const SubUsuario = require('../models/SubUsuario');
const Log = require('../models/Log');
const crypto = require('crypto');

// Gerar senha aleatória
function gerarSenhaAleatoria(tamanho = 10) {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789@#$!';
    let senha = '';
    for (let i = 0; i < tamanho; i++) {
        senha += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return senha;
}

// @desc    Listar sub-usuários da escola
// @route   GET /api/subusuarios
exports.listar = async (req, res) => {
    try {
        const subs = await SubUsuario.find({ escola: req.usuario._id })
            .select('-senha')
            .sort('-criadoEm');
        res.json({ success: true, subUsuarios: subs });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Erro ao listar usuários.', error: error.message });
    }
};

// @desc    Criar sub-usuário
// @route   POST /api/subusuarios
exports.criar = async (req, res) => {
    try {
        const { nome, email, cargo, permissoes, senha } = req.body;

        if (!nome || !email) {
            return res.status(400).json({ success: false, message: 'Nome e email são obrigatórios.' });
        }

        // Verificar duplicidade dentro da escola
        const existente = await SubUsuario.findOne({ email, escola: req.usuario._id });
        if (existente) {
            return res.status(400).json({ success: false, message: 'Já existe um usuário com este email nesta escola.' });
        }

        const senhaFinal = senha || gerarSenhaAleatoria();

        const sub = await SubUsuario.create({
            nome,
            email,
            senha: senhaFinal,
            escola: req.usuario._id,
            cargo: cargo || 'Funcionário',
            permissoes: permissoes || {}
        });

        // Log
        await Log.create({
            usuario: req.usuario._id,
            acao: 'CRIAR_ALUNO',
            descricao: `Criou sub-usuário: ${nome} (${email})`,
            nivel: 'INFO'
        });

        res.status(201).json({
            success: true,
            message: 'Usuário criado com sucesso!',
            subUsuario: { _id: sub._id, nome: sub.nome, email: sub.email, cargo: sub.cargo, permissoes: sub.permissoes, ativo: sub.ativo },
            senhaGerada: senhaFinal
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Erro ao criar usuário.', error: error.message });
    }
};

// @desc    Atualizar sub-usuário
// @route   PUT /api/subusuarios/:id
exports.atualizar = async (req, res) => {
    try {
        const { nome, email, cargo, permissoes, ativo, senha } = req.body;

        const sub = await SubUsuario.findOne({ _id: req.params.id, escola: req.usuario._id });
        if (!sub) {
            return res.status(404).json({ success: false, message: 'Usuário não encontrado.' });
        }

        if (nome) sub.nome = nome;
        if (email) sub.email = email;
        if (cargo !== undefined) sub.cargo = cargo;
        if (permissoes) sub.permissoes = { ...sub.permissoes, ...permissoes };
        if (ativo !== undefined) sub.ativo = ativo;
        if (senha && senha.trim().length >= 6) sub.senha = senha.trim();

        await sub.save();

        const senhaAlterada = senha && senha.trim().length >= 6 ? ' — SENHA ALTERADA' : '';
        await Log.create({
            usuario: req.usuario._id,
            acao: 'EDITAR_ALUNO',
            descricao: `Atualizou sub-usuário: ${sub.nome} (${sub.email})${ativo === false ? ' — BLOQUEADO' : ativo === true ? ' — DESBLOQUEADO' : ''}${senhaAlterada}`,
            nivel: senha ? 'WARNING' : 'INFO'
        });

        res.json({ success: true, message: 'Usuário atualizado!', subUsuario: sub });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Erro ao atualizar.', error: error.message });
    }
};

// @desc    Resetar senha de sub-usuário
// @route   POST /api/subusuarios/:id/resetar-senha
exports.resetarSenha = async (req, res) => {
    try {
        const sub = await SubUsuario.findOne({ _id: req.params.id, escola: req.usuario._id });
        if (!sub) {
            return res.status(404).json({ success: false, message: 'Usuário não encontrado.' });
        }

        const novaSenha = req.body.novaSenha || gerarSenhaAleatoria();
        sub.senha = novaSenha;
        await sub.save();

        await Log.create({
            usuario: req.usuario._id,
            acao: 'EDITAR_ALUNO',
            descricao: `Resetou senha do sub-usuário: ${sub.nome} (${sub.email})`,
            nivel: 'WARNING'
        });

        res.json({ success: true, message: 'Senha resetada!', novaSenha });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Erro ao resetar senha.', error: error.message });
    }
};

// @desc    Excluir sub-usuário
// @route   DELETE /api/subusuarios/:id
exports.excluir = async (req, res) => {
    try {
        const sub = await SubUsuario.findOneAndDelete({ _id: req.params.id, escola: req.usuario._id });
        if (!sub) {
            return res.status(404).json({ success: false, message: 'Usuário não encontrado.' });
        }

        await Log.create({
            usuario: req.usuario._id,
            acao: 'DELETAR_ALUNO',
            descricao: `Excluiu sub-usuário: ${sub.nome} (${sub.email})`,
            nivel: 'WARNING'
        });

        res.json({ success: true, message: 'Usuário excluído.' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Erro ao excluir.', error: error.message });
    }
};

// @desc    Logs de atividade da escola
// @route   GET /api/subusuarios/logs
exports.logs = async (req, res) => {
    try {
        const { limite = 50, pagina = 1 } = req.query;
        const skip = (parseInt(pagina) - 1) * parseInt(limite);

        // Buscar IDs de sub-usuários da escola
        const subIds = await SubUsuario.find({ escola: req.usuario._id }).distinct('_id');
        const todosIds = [req.usuario._id, ...subIds];

        const [logs, total] = await Promise.all([
            Log.find({ usuario: { $in: todosIds } })
                .populate('usuario', 'nome email')
                .sort('-timestamp')
                .limit(parseInt(limite))
                .skip(skip),
            Log.countDocuments({ usuario: { $in: todosIds } })
        ]);

        res.json({
            success: true,
            logs,
            paginacao: { total, pagina: parseInt(pagina), totalPaginas: Math.ceil(total / parseInt(limite)) }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Erro ao buscar logs.', error: error.message });
    }
};

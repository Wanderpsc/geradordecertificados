const Log = require('../models/Log');

// Função helper para criar log
const criarLog = async (usuario, acao, descricao, req, nivel = 'INFO', dados = null) => {
    try {
        await Log.create({
            usuario: usuario._id || usuario,
            acao,
            descricao,
            ip: req.ip || req.connection.remoteAddress,
            userAgent: req.headers['user-agent'],
            dados,
            nivel
        });
    } catch (error) {
        console.error('Erro ao criar log:', error);
    }
};

// Middleware para logar requisições
const logRequest = (acao) => {
    return async (req, res, next) => {
        // Guardar referência para o response original
        const originalSend = res.send;
        
        res.send = function(data) {
            // Log após resposta
            if (req.usuario) {
                const statusCode = res.statusCode;
                const nivel = statusCode >= 400 ? 'ERROR' : 'INFO';
                
                criarLog(
                    req.usuario,
                    acao,
                    `${req.method} ${req.originalUrl} - Status: ${statusCode}`,
                    req,
                    nivel,
                    { statusCode, method: req.method, url: req.originalUrl }
                ).catch(console.error);
            }
            
            originalSend.call(this, data);
        };
        
        next();
    };
};

// Log de login
const logLogin = async (req, usuario, sucesso) => {
    await criarLog(
        usuario,
        sucesso ? 'LOGIN' : 'ERRO_AUTENTICACAO',
        sucesso ? `Login realizado com sucesso` : `Tentativa de login falhada`,
        req,
        sucesso ? 'INFO' : 'WARNING',
        { email: usuario.email, sucesso }
    );
};

// Log de registro
const logRegistro = async (req, usuario) => {
    await criarLog(
        usuario,
        'REGISTRO',
        `Novo usuário registrado: ${usuario.nome}`,
        req,
        'INFO',
        { email: usuario.email, instituicao: usuario.instituicao }
    );
};

// Log de ação em aluno
const logAcaoAluno = async (req, acao, aluno) => {
    await criarLog(
        req.usuario,
        acao,
        `${acao} - Aluno: ${aluno.nome}`,
        req,
        'INFO',
        { alunoId: aluno._id, alunoNome: aluno.nome }
    );
};

// Log de geração de certificado
const logGerarCertificado = async (req, aluno, codigoVerificacao) => {
    await criarLog(
        req.usuario,
        'GERAR_CERTIFICADO',
        `Certificado gerado para ${aluno.nome}`,
        req,
        'INFO',
        { 
            alunoId: aluno._id, 
            alunoNome: aluno.nome,
            codigoVerificacao 
        }
    );
};

// Log de tentativa de acesso não autorizado
const logAcessoNegado = async (req, motivo) => {
    const usuario = req.usuario || { _id: 'ANONIMO' };
    await criarLog(
        usuario,
        'TENTAR_ACESSO_NAO_AUTORIZADO',
        `Acesso negado: ${motivo}`,
        req,
        'WARNING',
        { motivo, url: req.originalUrl }
    );
};

// Obter logs de um usuário (Admin)
const obterLogs = async (req, res) => {
    try {
        const { usuarioId, acao, dataInicio, dataFim, limite = 100 } = req.query;
        
        let query = {};
        
        if (usuarioId) query.usuario = usuarioId;
        if (acao) query.acao = acao;
        if (dataInicio || dataFim) {
            query.timestamp = {};
            if (dataInicio) query.timestamp.$gte = new Date(dataInicio);
            if (dataFim) query.timestamp.$lte = new Date(dataFim);
        }
        
        const logs = await Log.find(query)
            .populate('usuario', 'nome email instituicao')
            .sort('-timestamp')
            .limit(parseInt(limite));
        
        res.json({
            success: true,
            quantidade: logs.length,
            logs
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erro ao buscar logs',
            error: error.message
        });
    }
};

module.exports = {
    criarLog,
    logRequest,
    logLogin,
    logRegistro,
    logAcaoAluno,
    logGerarCertificado,
    logAcessoNegado,
    obterLogs
};

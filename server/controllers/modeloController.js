const Modelo = require('../models/Modelo');

// Listar modelos do usuário
exports.listarModelos = async (req, res) => {
    try {
        const filtro = { usuario: req.usuario._id };
        if (req.query.arquivado === 'true') {
            filtro.arquivado = true;
        } else {
            filtro.arquivado = false;
        }
        const modelos = await Modelo.find(filtro)
            .select('nome descricao ativo arquivado criadoEm atualizadoEm')
            .sort('-atualizadoEm');
        res.json({ success: true, modelos });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Erro ao listar modelos.' });
    }
};

// Obter modelo completo
exports.obterModelo = async (req, res) => {
    try {
        const modelo = await Modelo.findOne({ _id: req.params.id, usuario: req.usuario._id });
        if (!modelo) {
            return res.status(404).json({ success: false, message: 'Modelo não encontrado.' });
        }
        res.json({ success: true, modelo });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Erro ao obter modelo.' });
    }
};

// Salvar novo modelo
exports.salvarModelo = async (req, res) => {
    try {
        const { nome, descricao, config, uploads } = req.body;
        if (!nome || !config) {
            return res.status(400).json({ success: false, message: 'Nome e configuração são obrigatórios.' });
        }
        const modelo = await Modelo.create({
            usuario: req.usuario._id,
            nome,
            descricao: descricao || '',
            config,
            uploads: uploads || {}
        });
        res.status(201).json({ success: true, modelo: { _id: modelo._id, nome: modelo.nome, descricao: modelo.descricao, criadoEm: modelo.criadoEm } });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Erro ao salvar modelo.' });
    }
};

// Atualizar modelo existente
exports.atualizarModelo = async (req, res) => {
    try {
        const modelo = await Modelo.findOne({ _id: req.params.id, usuario: req.usuario._id });
        if (!modelo) {
            return res.status(404).json({ success: false, message: 'Modelo não encontrado.' });
        }
        const { nome, descricao, config, uploads } = req.body;
        if (nome) modelo.nome = nome;
        if (descricao !== undefined) modelo.descricao = descricao;
        if (config) {
            modelo.config = config;
            modelo.markModified('config');
        }
        if (uploads !== undefined) {
            modelo.uploads = uploads;
            modelo.markModified('uploads');
        }
        await modelo.save();
        res.json({ success: true, modelo: { _id: modelo._id, nome: modelo.nome, descricao: modelo.descricao, atualizadoEm: modelo.atualizadoEm } });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Erro ao atualizar modelo.' });
    }
};

// Copiar modelo
exports.copiarModelo = async (req, res) => {
    try {
        const original = await Modelo.findOne({ _id: req.params.id, usuario: req.usuario._id });
        if (!original) {
            return res.status(404).json({ success: false, message: 'Modelo não encontrado.' });
        }
        const copia = await Modelo.create({
            usuario: req.usuario._id,
            nome: original.nome + ' (Cópia)',
            descricao: original.descricao,
            config: original.config,
            uploads: original.uploads
        });
        res.status(201).json({ success: true, modelo: { _id: copia._id, nome: copia.nome, descricao: copia.descricao, criadoEm: copia.criadoEm } });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Erro ao copiar modelo.' });
    }
};

// Arquivar/Desarquivar modelo
exports.arquivarModelo = async (req, res) => {
    try {
        const modelo = await Modelo.findOne({ _id: req.params.id, usuario: req.usuario._id });
        if (!modelo) {
            return res.status(404).json({ success: false, message: 'Modelo não encontrado.' });
        }
        modelo.arquivado = !modelo.arquivado;
        await modelo.save();
        res.json({ success: true, arquivado: modelo.arquivado });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Erro ao arquivar modelo.' });
    }
};

// Deletar modelo
exports.deletarModelo = async (req, res) => {
    try {
        const modelo = await Modelo.findOneAndDelete({ _id: req.params.id, usuario: req.usuario._id });
        if (!modelo) {
            return res.status(404).json({ success: false, message: 'Modelo não encontrado.' });
        }
        res.json({ success: true, message: 'Modelo excluído.' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Erro ao excluir modelo.' });
    }
};

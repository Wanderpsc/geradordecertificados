const MatrizCurricular = require('../models/MatrizCurricular');

exports.listar = async (req, res) => {
    try {
        const matrizes = await MatrizCurricular.find({ usuario: req.usuario._id }).sort('-atualizadoEm');
        res.json({ success: true, matrizes });
    } catch (e) {
        res.status(500).json({ success: false, message: 'Erro ao listar matrizes.' });
    }
};

exports.obter = async (req, res) => {
    try {
        const matriz = await MatrizCurricular.findOne({ _id: req.params.id, usuario: req.usuario._id });
        if (!matriz) return res.status(404).json({ success: false, message: 'Matriz não encontrada.' });
        res.json({ success: true, matriz });
    } catch (e) {
        res.status(500).json({ success: false, message: 'Erro ao obter matriz.' });
    }
};

exports.criar = async (req, res) => {
    try {
        const { titulo, disciplinas } = req.body;
        if (!titulo) return res.status(400).json({ success: false, message: 'Título é obrigatório.' });
        const matriz = await MatrizCurricular.create({
            usuario: req.usuario._id,
            titulo,
            disciplinas: disciplinas || []
        });
        res.status(201).json({ success: true, matriz });
    } catch (e) {
        res.status(500).json({ success: false, message: 'Erro ao criar matriz.' });
    }
};

exports.atualizar = async (req, res) => {
    try {
        const matriz = await MatrizCurricular.findOne({ _id: req.params.id, usuario: req.usuario._id });
        if (!matriz) return res.status(404).json({ success: false, message: 'Matriz não encontrada.' });
        const { titulo, disciplinas } = req.body;
        if (titulo) matriz.titulo = titulo;
        if (disciplinas !== undefined) {
            matriz.disciplinas = disciplinas;
            matriz.markModified('disciplinas');
        }
        await matriz.save();
        res.json({ success: true, matriz });
    } catch (e) {
        res.status(500).json({ success: false, message: 'Erro ao atualizar matriz.' });
    }
};

exports.excluir = async (req, res) => {
    try {
        const matriz = await MatrizCurricular.findOne({ _id: req.params.id, usuario: req.usuario._id });
        if (!matriz) return res.status(404).json({ success: false, message: 'Matriz não encontrada.' });
        await MatrizCurricular.deleteOne({ _id: matriz._id });
        res.json({ success: true, message: 'Matriz excluída.' });
    } catch (e) {
        res.status(500).json({ success: false, message: 'Erro ao excluir matriz.' });
    }
};

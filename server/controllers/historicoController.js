const GradeHistorico = require('../models/GradeHistorico');
const Historico = require('../models/Historico');
const Aluno = require('../models/Aluno');

// ==================== GRADES (Templates de disciplinas) ====================

exports.listarGrades = async (req, res) => {
    try {
        const filtro = { usuario: req.usuario._id };
        if (req.query.tipo) filtro.tipo = req.query.tipo;
        const grades = await GradeHistorico.find(filtro).sort('-atualizadoEm');
        res.json({ success: true, grades });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Erro ao listar grades.' });
    }
};

exports.obterGrade = async (req, res) => {
    try {
        const grade = await GradeHistorico.findOne({ _id: req.params.id, usuario: req.usuario._id })
            .populate('seriesMatrizes.matrizId');
        if (!grade) return res.status(404).json({ success: false, message: 'Grade não encontrada.' });
        res.json({ success: true, grade });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Erro ao obter grade.' });
    }
};

exports.salvarGrade = async (req, res) => {
    try {
        const { tipo, nome, disciplinas, numSeries, nomesSeries, seriesMatrizes } = req.body;
        if (!tipo || !nome) {
            return res.status(400).json({ success: false, message: 'Tipo e nome são obrigatórios.' });
        }
        const grade = await GradeHistorico.create({
            usuario: req.usuario._id,
            tipo,
            nome,
            disciplinas: disciplinas || [],
            numSeries: numSeries || (tipo === 'medio' ? 3 : 9),
            nomesSeries: nomesSeries || [],
            seriesMatrizes: seriesMatrizes || []
        });
        res.status(201).json({ success: true, grade });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Erro ao salvar grade.' });
    }
};

exports.atualizarGrade = async (req, res) => {
    try {
        const grade = await GradeHistorico.findOne({ _id: req.params.id, usuario: req.usuario._id });
        if (!grade) return res.status(404).json({ success: false, message: 'Grade não encontrada.' });

        const { nome, disciplinas, numSeries, nomesSeries, seriesMatrizes } = req.body;
        if (nome) grade.nome = nome;
        if (disciplinas !== undefined) {
            grade.disciplinas = disciplinas;
            grade.markModified('disciplinas');
        }
        if (numSeries) grade.numSeries = numSeries;
        if (nomesSeries) grade.nomesSeries = nomesSeries;
        if (seriesMatrizes !== undefined) {
            grade.seriesMatrizes = seriesMatrizes;
            grade.markModified('seriesMatrizes');
        }
        await grade.save();
        res.json({ success: true, grade });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Erro ao atualizar grade.' });
    }
};

exports.excluirGrade = async (req, res) => {
    try {
        const grade = await GradeHistorico.findOne({ _id: req.params.id, usuario: req.usuario._id });
        if (!grade) return res.status(404).json({ success: false, message: 'Grade não encontrada.' });
        // Verificar se há históricos usando esta grade
        const count = await Historico.countDocuments({ grade: grade._id });
        if (count > 0) {
            return res.status(400).json({ success: false, message: `Não é possível excluir: ${count} histórico(s) usam esta grade.` });
        }
        await GradeHistorico.deleteOne({ _id: grade._id });
        res.json({ success: true, message: 'Grade excluída.' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Erro ao excluir grade.' });
    }
};

// ==================== HISTÓRICOS (Dados por aluno) ====================

exports.listarHistoricos = async (req, res) => {
    try {
        const filtro = { usuario: req.usuario._id };
        if (req.query.tipo) filtro.tipo = req.query.tipo;
        if (req.query.aluno) filtro.aluno = req.query.aluno;
        const historicos = await Historico.find(filtro)
            .populate('aluno', 'nome cpf serie turma')
            .populate('grade', 'nome tipo')
            .select('aluno grade tipo dataEmissao criadoEm atualizadoEm')
            .sort('-atualizadoEm');
        res.json({ success: true, historicos });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Erro ao listar históricos.' });
    }
};

exports.obterHistorico = async (req, res) => {
    try {
        const historico = await Historico.findOne({ _id: req.params.id, usuario: req.usuario._id })
            .populate('aluno')
            .populate('grade');
        if (!historico) return res.status(404).json({ success: false, message: 'Histórico não encontrado.' });
        res.json({ success: true, historico });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Erro ao obter histórico.' });
    }
};

exports.salvarHistorico = async (req, res) => {
    try {
        const { aluno, grade, tipo, notas, seriesInfo, fichaIndividual, observacoes, dataEmissao, registro } = req.body;
        if (!aluno || !grade || !tipo) {
            return res.status(400).json({ success: false, message: 'Aluno, grade e tipo são obrigatórios.' });
        }
        // Verificar se já existe histórico deste tipo para este aluno
        let historico = await Historico.findOne({ usuario: req.usuario._id, aluno, tipo });
        if (historico) {
            // Atualizar existente
            historico.grade = grade;
            if (notas !== undefined) { historico.notas = notas; historico.markModified('notas'); }
            if (seriesInfo !== undefined) { historico.seriesInfo = seriesInfo; historico.markModified('seriesInfo'); }
            if (fichaIndividual !== undefined) { historico.fichaIndividual = fichaIndividual; historico.markModified('fichaIndividual'); }
            if (observacoes !== undefined) historico.observacoes = observacoes;
            if (dataEmissao !== undefined) historico.dataEmissao = dataEmissao;
            if (registro !== undefined) historico.registro = registro;
            await historico.save();
            return res.json({ success: true, historico: { _id: historico._id }, atualizado: true });
        }
        historico = await Historico.create({
            usuario: req.usuario._id,
            aluno,
            grade,
            tipo,
            notas: notas || {},
            seriesInfo: seriesInfo || [],
            fichaIndividual: fichaIndividual || [],
            observacoes: observacoes || '',
            dataEmissao: dataEmissao || '',
            registro: registro || ''
        });
        res.status(201).json({ success: true, historico: { _id: historico._id }, atualizado: false });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Erro ao salvar histórico.' });
    }
};

exports.atualizarHistorico = async (req, res) => {
    try {
        const historico = await Historico.findOne({ _id: req.params.id, usuario: req.usuario._id });
        if (!historico) return res.status(404).json({ success: false, message: 'Histórico não encontrado.' });

        const { notas, seriesInfo, fichaIndividual, observacoes, dataEmissao, registro, grade } = req.body;
        if (grade) historico.grade = grade;
        if (notas !== undefined) { historico.notas = notas; historico.markModified('notas'); }
        if (seriesInfo !== undefined) { historico.seriesInfo = seriesInfo; historico.markModified('seriesInfo'); }
        if (fichaIndividual !== undefined) { historico.fichaIndividual = fichaIndividual; historico.markModified('fichaIndividual'); }
        if (observacoes !== undefined) historico.observacoes = observacoes;
        if (dataEmissao !== undefined) historico.dataEmissao = dataEmissao;
        if (registro !== undefined) historico.registro = registro;
        await historico.save();
        res.json({ success: true, historico: { _id: historico._id } });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Erro ao atualizar histórico.' });
    }
};

exports.excluirHistorico = async (req, res) => {
    try {
        const historico = await Historico.findOne({ _id: req.params.id, usuario: req.usuario._id });
        if (!historico) return res.status(404).json({ success: false, message: 'Histórico não encontrado.' });
        await Historico.deleteOne({ _id: historico._id });
        res.json({ success: true, message: 'Histórico excluído.' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Erro ao excluir histórico.' });
    }
};

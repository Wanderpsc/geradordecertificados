const Aluno = require('../models/Aluno');

// @desc    Criar novo aluno
// @route   POST /api/alunos
// @access  Private
exports.criarAluno = async (req, res) => {
    try {
        const alunoData = {
            ...req.body,
            usuario: req.usuario._id
        };

        const aluno = await Aluno.create(alunoData);

        res.status(201).json({
            success: true,
            message: 'Aluno cadastrado com sucesso!',
            aluno
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erro ao cadastrar aluno.',
            error: error.message
        });
    }
};

// @desc    Listar todos os alunos do usuário
// @route   GET /api/alunos
// @access  Private
exports.listarAlunos = async (req, res) => {
    try {
        const alunos = await Aluno.find({ usuario: req.usuario._id }).sort('-criadoEm');

        res.json({
            success: true,
            quantidade: alunos.length,
            alunos
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erro ao listar alunos.',
            error: error.message
        });
    }
};

// @desc    Buscar aluno por ID
// @route   GET /api/alunos/:id
// @access  Private
exports.buscarAluno = async (req, res) => {
    try {
        const aluno = await Aluno.findOne({
            _id: req.params.id,
            usuario: req.usuario._id
        });

        if (!aluno) {
            return res.status(404).json({
                success: false,
                message: 'Aluno não encontrado.'
            });
        }

        res.json({
            success: true,
            aluno
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erro ao buscar aluno.',
            error: error.message
        });
    }
};

// @desc    Atualizar aluno
// @route   PUT /api/alunos/:id
// @access  Private
exports.atualizarAluno = async (req, res) => {
    try {
        let aluno = await Aluno.findOne({
            _id: req.params.id,
            usuario: req.usuario._id
        });

        if (!aluno) {
            return res.status(404).json({
                success: false,
                message: 'Aluno não encontrado.'
            });
        }

        aluno = await Aluno.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        res.json({
            success: true,
            message: 'Aluno atualizado com sucesso!',
            aluno
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erro ao atualizar aluno.',
            error: error.message
        });
    }
};

// @desc    Deletar aluno
// @route   DELETE /api/alunos/:id
// @access  Private
exports.deletarAluno = async (req, res) => {
    try {
        const aluno = await Aluno.findOne({
            _id: req.params.id,
            usuario: req.usuario._id
        });

        if (!aluno) {
            return res.status(404).json({
                success: false,
                message: 'Aluno não encontrado.'
            });
        }

        await aluno.deleteOne();

        res.json({
            success: true,
            message: 'Aluno deletado com sucesso!'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erro ao deletar aluno.',
            error: error.message
        });
    }
};

// @desc    Buscar alunos (com filtros)
// @route   GET /api/alunos/search
// @access  Private
exports.buscarAlunos = async (req, res) => {
    try {
        const { nome, cpf } = req.query;

        let query = { usuario: req.usuario._id };

        if (nome) {
            query.nome = { $regex: nome, $options: 'i' };
        }

        if (cpf) {
            query.cpf = cpf;
        }

        const alunos = await Aluno.find(query).sort('-criadoEm');

        res.json({
            success: true,
            quantidade: alunos.length,
            alunos
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erro ao buscar alunos.',
            error: error.message
        });
    }
};

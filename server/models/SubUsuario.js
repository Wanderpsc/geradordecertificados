const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const subUsuarioSchema = new mongoose.Schema({
    nome: {
        type: String,
        required: [true, 'Nome é obrigatório'],
        trim: true
    },
    email: {
        type: String,
        required: [true, 'Email é obrigatório'],
        lowercase: true,
        trim: true,
        match: [/^\S+@\S+\.\S+$/, 'Email inválido']
    },
    senha: {
        type: String,
        required: [true, 'Senha é obrigatória'],
        minlength: 6,
        select: false
    },
    escola: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Usuario',
        required: true,
        index: true
    },
    cargo: {
        type: String,
        trim: true,
        default: 'Funcionário'
    },
    permissoes: {
        cadastrarAlunos: { type: Boolean, default: true },
        editarAlunos: { type: Boolean, default: true },
        excluirAlunos: { type: Boolean, default: false },
        gerarCertificados: { type: Boolean, default: true },
        editarModelos: { type: Boolean, default: false },
        verLogs: { type: Boolean, default: false }
    },
    ativo: {
        type: Boolean,
        default: true
    },
    ultimoAcesso: {
        type: Date
    },
    criadoEm: {
        type: Date,
        default: Date.now
    }
});

// Email único por escola
subUsuarioSchema.index({ email: 1, escola: 1 }, { unique: true });

// Hash da senha antes de salvar
subUsuarioSchema.pre('save', async function(next) {
    if (!this.isModified('senha')) return next();
    this.senha = await bcrypt.hash(this.senha, 12);
    next();
});

// Método para comparar senhas
subUsuarioSchema.methods.compararSenha = async function(senhaInformada) {
    return await bcrypt.compare(senhaInformada, this.senha);
};

module.exports = mongoose.model('SubUsuario', subUsuarioSchema);

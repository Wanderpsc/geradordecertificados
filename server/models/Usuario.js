const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const usuarioSchema = new mongoose.Schema({
    nome: {
        type: String,
        required: [true, 'Nome é obrigatório'],
        trim: true
    },
    email: {
        type: String,
        required: [true, 'Email é obrigatório'],
        unique: true,
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
    instituicao: {
        type: String,
        required: [true, 'Nome da instituição é obrigatório'],
        trim: true
    },
    telefone: {
        type: String,
        trim: true
    },
    licenca: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Licenca'
    },
    ativo: {
        type: Boolean,
        default: true
    },
    role: {
        type: String,
        enum: ['admin', 'user'],
        default: 'user'
    },
    aceitouTermos: {
        type: Boolean,
        default: false,
        required: true
    },
    dataAceiteTermos: {
        type: Date
    },
    versaoTermosAceitos: {
        type: String,
        default: '1.0'
    },
    criadoEm: {
        type: Date,
        default: Date.now
    }
});

// Hash da senha antes de salvar
usuarioSchema.pre('save', async function(next) {
    if (!this.isModified('senha')) return next();
    this.senha = await bcrypt.hash(this.senha, 12);
    next();
});

// Método para comparar senhas
usuarioSchema.methods.compararSenha = async function(senhaInformada) {
    return await bcrypt.compare(senhaInformada, this.senha);
};

module.exports = mongoose.model('Usuario', usuarioSchema);

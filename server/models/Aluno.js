const mongoose = require('mongoose');

const alunoSchema = new mongoose.Schema({
    usuario: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Usuario',
        required: true
    },
    nome: {
        type: String,
        required: [true, 'Nome do aluno é obrigatório'],
        trim: true
    },
    rg: {
        type: String,
        required: [true, 'RG é obrigatório'],
        trim: true
    },
    orgaoEmissor: {
        type: String,
        required: [true, 'Órgão emissor é obrigatório'],
        trim: true
    },
    cpf: {
        type: String,
        required: [true, 'CPF é obrigatório'],
        trim: true,
        match: [/^\d{3}\.\d{3}\.\d{3}-\d{2}$/, 'CPF inválido']
    },
    dataNascimento: {
        dia: {
            type: Number,
            required: true,
            min: 1,
            max: 31
        },
        mes: {
            type: String,
            required: true,
            enum: ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 
                   'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro']
        },
        ano: {
            type: Number,
            required: true,
            min: 1900,
            max: 2020
        }
    },
    naturalidade: {
        cidade: {
            type: String,
            required: true,
            trim: true
        },
        estado: {
            type: String,
            required: true,
            trim: true
        }
    },
    filiacao: {
        mae: {
            type: String,
            required: true,
            trim: true
        },
        pai: {
            type: String,
            required: true,
            trim: true
        }
    },
    dataConfeccao: {
        type: String,
        trim: true
    },
    cidadeConfeccao: {
        type: String,
        trim: true
    },
    resolucao: {
        type: String,
        trim: true
    },
    anoConclusao: {
        type: String,
        trim: true
    },
    nacionalidade: {
        type: String,
        trim: true,
        default: 'Brasileira'
    },
    observacoes: {
        type: String,
        trim: true
    },
    criadoEm: {
        type: Date,
        default: Date.now
    },
    atualizadoEm: {
        type: Date,
        default: Date.now
    }
});

// Atualizar timestamp ao modificar
alunoSchema.pre('save', function(next) {
    this.atualizadoEm = Date.now();
    next();
});

module.exports = mongoose.model('Aluno', alunoSchema);

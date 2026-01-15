const mongoose = require('mongoose');

const logSchema = new mongoose.Schema({
    usuario: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Usuario',
        required: true
    },
    acao: {
        type: String,
        required: true,
        enum: [
            'LOGIN',
            'LOGOUT',
            'REGISTRO',
            'CRIAR_ALUNO',
            'EDITAR_ALUNO',
            'DELETAR_ALUNO',
            'GERAR_CERTIFICADO',
            'ATIVAR_LICENCA',
            'TENTAR_ACESSO_NAO_AUTORIZADO',
            'ERRO_AUTENTICACAO',
            'MODIFICAR_LICENCA',
            'EXPORTAR_DADOS'
        ]
    },
    descricao: {
        type: String,
        required: true
    },
    ip: {
        type: String
    },
    userAgent: {
        type: String
    },
    dados: {
        type: mongoose.Schema.Types.Mixed
    },
    nivel: {
        type: String,
        enum: ['INFO', 'WARNING', 'ERROR', 'CRITICAL'],
        default: 'INFO'
    },
    timestamp: {
        type: Date,
        default: Date.now,
        index: true
    }
});

// Índice para consultas rápidas
logSchema.index({ usuario: 1, timestamp: -1 });
logSchema.index({ acao: 1, timestamp: -1 });

module.exports = mongoose.model('Log', logSchema);

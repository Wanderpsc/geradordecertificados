const mongoose = require('mongoose');

const modeloSchema = new mongoose.Schema({
    usuario: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Usuario',
        required: true,
        index: true
    },
    nome: {
        type: String,
        required: [true, 'Nome do modelo é obrigatório'],
        trim: true,
        maxlength: 100
    },
    descricao: {
        type: String,
        trim: true,
        maxlength: 300,
        default: ''
    },
    config: {
        type: mongoose.Schema.Types.Mixed,
        required: true
    },
    uploads: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    tipo: {
        type: String,
        enum: ['certificado', 'historico'],
        default: 'certificado'
    },
    ativo: {
        type: Boolean,
        default: true
    },
    arquivado: {
        type: Boolean,
        default: false
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

modeloSchema.index({ usuario: 1, nome: 1 });
modeloSchema.index({ usuario: 1, arquivado: 1 });

modeloSchema.pre('save', function(next) {
    this.atualizadoEm = Date.now();
    next();
});

module.exports = mongoose.model('Modelo', modeloSchema);

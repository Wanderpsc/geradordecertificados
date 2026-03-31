const mongoose = require('mongoose');

const GradeHistoricoSchema = new mongoose.Schema({
    usuario: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Usuario',
        required: true,
        index: true
    },
    tipo: {
        type: String,
        enum: ['fundamental', 'medio'],
        required: true
    },
    nome: {
        type: String,
        required: true,
        trim: true,
        maxlength: 150
    },
    // Disciplinas organizadas por categoria
    // [{ nome: "Língua Portuguesa", categoria: "formacao_geral", cargaHorariaPadrao: 240 }]
    disciplinas: {
        type: mongoose.Schema.Types.Mixed,
        default: []
    },
    // Número de séries/anos (3 para médio, 9 para fundamental, ou customizado)
    numSeries: {
        type: Number,
        default: 3
    },
    // Nomes das séries ['1ª Série', '2ª Série', '3ª Série']
    nomesSeries: {
        type: [String],
        default: []
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

GradeHistoricoSchema.pre('save', function(next) {
    this.atualizadoEm = new Date();
    next();
});

GradeHistoricoSchema.index({ usuario: 1, tipo: 1 });

module.exports = mongoose.model('GradeHistorico', GradeHistoricoSchema);

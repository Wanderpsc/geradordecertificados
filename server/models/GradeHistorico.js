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
    // [{ nome, categoria, cargaHorariaPorSerie: [ch1, ch2, ...], cargaHorariaPadrao }]
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
    // Série específica que esta grade representa (ex: '1ª Série', '2º Ano')
    serie: {
        type: String,
        trim: true,
        default: ''
    },
    // Matrizes curriculares por série
    // [{ serieIdx: 0, serieNome: '6º Ano', matrizId: ObjectId }]
    seriesMatrizes: {
        type: [{
            serieIdx: Number,
            serieNome: String,
            matrizId: { type: mongoose.Schema.Types.ObjectId, ref: 'MatrizCurricular' }
        }],
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

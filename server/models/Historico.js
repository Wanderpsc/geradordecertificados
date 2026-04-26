const mongoose = require('mongoose');

const HistoricoSchema = new mongoose.Schema({
    usuario: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Usuario',
        required: true,
        index: true
    },
    aluno: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Aluno',
        required: true
    },
    grade: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'GradeHistorico',
        required: true
    },
    // Array de grades por série (uma grade por série/ano)
    grades: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'GradeHistorico'
    }],
    tipo: {
        type: String,
        enum: ['fundamental', 'medio'],
        required: true
    },
    // Notas por disciplina por série
    // { "Língua Portuguesa": { "1": { nota: 6.60, ch: 240 }, "2": { nota: 7.50, ch: 240 } } }
    notas: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    // Info por série (estabelecimento, município, estado, ano)
    // [{ serie: "1", estabelecimento: "...", municipio: "...", estado: "...", ano: "2023" }]
    seriesInfo: {
        type: mongoose.Schema.Types.Mixed,
        default: []
    },
    // Ficha Individual do Rendimento (verso)
    // [{ ano: "2023", registros: [{ disciplina: "...", avaliacoes: [{num, nota, faltas}], bimestres: [{num, media, faltas}] }] }]
    fichaIndividual: {
        type: mongoose.Schema.Types.Mixed,
        default: []
    },
    observacoes: {
        type: String,
        trim: true,
        default: ''
    },
    registro: {
        type: String,
        trim: true,
        default: ''
    },
    dataEmissao: {
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

HistoricoSchema.pre('save', function(next) {
    this.atualizadoEm = new Date();
    next();
});

HistoricoSchema.index({ usuario: 1, aluno: 1, tipo: 1 });

module.exports = mongoose.model('Historico', HistoricoSchema);

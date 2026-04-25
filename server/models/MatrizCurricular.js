const mongoose = require('mongoose');

const MatrizCurricularSchema = new mongoose.Schema({
    usuario: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Usuario',
        required: true,
        index: true
    },
    titulo: {
        type: String,
        required: true,
        trim: true,
        maxlength: 200
    },
    // Disciplinas: [{ nome, categoria, cargaHoraria }]
    disciplinas: {
        type: mongoose.Schema.Types.Mixed,
        default: []
    },
    criadoEm: { type: Date, default: Date.now },
    atualizadoEm: { type: Date, default: Date.now }
});

MatrizCurricularSchema.pre('save', function (next) {
    this.atualizadoEm = new Date();
    next();
});

MatrizCurricularSchema.index({ usuario: 1, titulo: 1 });

module.exports = mongoose.model('MatrizCurricular', MatrizCurricularSchema);

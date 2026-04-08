const mongoose = require('mongoose');

const templatePadraoSchema = new mongoose.Schema({
    nome: { type: String, required: true, trim: true },
    descricao: { type: String, default: '' },
    tipo: { type: String, enum: ['certificado', 'historico'], required: true },
    previewBase64: { type: String, default: '' },  // imagem de preview em base64
    config: { type: mongoose.Schema.Types.Mixed, required: true },  // JSON completo do template
    uploads: { type: mongoose.Schema.Types.Mixed, default: {} },    // uploads (logos/emblemas)
    ordem: { type: Number, default: 0 }
}, { _id: true });

const planoVendaSchema = new mongoose.Schema({
    nome: {
        type: String,
        required: [true, 'Nome do plano é obrigatório'],
        trim: true,
        maxlength: 100
    },
    descricao: {
        type: String,
        default: '',
        maxlength: 500
    },
    subtitulo: {
        type: String,
        default: '',
        maxlength: 200
    },
    tipo: {
        type: String,
        enum: ['limpo', 'com-templates', 'creditos'],
        required: true,
        default: 'limpo'
    },
    // Para tipo='creditos': quantos créditos são adicionados
    quantidadeCreditos: {
        type: Number,
        default: 0   // 0 = não é pacote de créditos
    },
    // Subtipo do crédito: 'certificados' | 'historicos' | 'ambos'
    subtipoCredito: {
        type: String,
        enum: ['certificados', 'historicos', 'ambos'],
        default: 'certificados'
    },
    // Preço base (à vista em R$)
    preco: {
        type: Number,
        required: true,
        min: 0
    },
    // Parcelamento
    maxParcelas: {
        type: Number,
        default: 1,
        min: 1,
        max: 12
    },
    // Período de validade da licença gerada
    validadeDias: {
        type: Number,
        default: 365,
        min: 1
    },
    // Corresponde ao tipo de Licença que será criada
    tipoLicenca: {
        type: String,
        enum: ['trial', 'mensal', 'anual', 'vitalicia'],
        default: 'anual'
    },
    // Recursos incluídos no plano
    recursos: {
        certificados: { type: Boolean, default: true },
        historicos: { type: Boolean, default: false },
        subUsuarios: { type: Number, default: 0 },       // 0 = não inclui sub-usuários
        limiteCertificados: { type: Number, default: -1 }, // -1 = ilimitado
        exportacaoPDF: { type: Boolean, default: true },
        marcaDagua: { type: Boolean, default: false },    // false = sem marca d'água
        multiplosTemplates: { type: Boolean, default: false },
        templatesCustomizados: { type: Boolean, default: true },
        limiteHistoricos: { type: Number, default: -1 }   // -1 = ilimitado
    },
    // Templates padrão enviados junto ao plano
    templatesCertificado: [templatePadraoSchema],
    templatesHistorico: [templatePadraoSchema],
    // Exibição na vitrine
    ativo: { type: Boolean, default: true },
    destaque: { type: Boolean, default: false },       // badge "Mais Popular"
    corDestaque: { type: String, default: '#1e40af' }, // cor do card na vitrine
    icone: { type: String, default: '🎓' },
    ordem: { type: Number, default: 0 },               // ordem de exibição
    // Tags visuais na vitrine
    tags: [String],
    criadoEm: { type: Date, default: Date.now },
    atualizadoEm: { type: Date, default: Date.now }
}, {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Virtual: valor por parcela
planoVendaSchema.virtual('valorParcela').get(function () {
    if (this.maxParcelas <= 1) return this.preco;
    return Math.ceil((this.preco * 100) / this.maxParcelas) / 100;
});

// Virtual: total de templates incluídos
planoVendaSchema.virtual('totalTemplates').get(function () {
    return (this.templatesCertificado?.length || 0) + (this.templatesHistorico?.length || 0);
});

planoVendaSchema.pre('save', function (next) {
    this.atualizadoEm = new Date();
    next();
});

module.exports = mongoose.model('PlanoVenda', planoVendaSchema);

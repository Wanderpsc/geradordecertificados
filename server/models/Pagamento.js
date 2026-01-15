const mongoose = require('mongoose');

const pagamentoSchema = new mongoose.Schema({
    usuario: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Usuario',
        required: true,
        index: true
    },
    licenca: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Licenca',
        required: true
    },
    valor: {
        type: Number,
        required: true,
        min: 0
    },
    desconto: {
        type: Number,
        default: 0,
        min: 0
    },
    valorFinal: {
        type: Number,
        required: true
    },
    metodoPagamento: {
        type: String,
        enum: ['boleto', 'cartao_credito', 'cartao_debito', 'pix', 'transferencia', 'dinheiro'],
        required: true
    },
    status: {
        type: String,
        enum: ['pendente', 'processando', 'aprovado', 'recusado', 'cancelado', 'reembolsado'],
        default: 'pendente',
        index: true
    },
    dataVencimento: Date,
    dataPagamento: Date,
    codigoTransacao: String,
    gatewayPagamento: String, // MercadoPago, PagSeguro, etc
    
    // Dados da compra
    tipoProduto: {
        type: String,
        enum: ['trial', 'mensal', 'anual', 'vitalicia', 'upgrade', 'renovacao'],
        required: true
    },
    periodoCobertura: {
        inicio: Date,
        fim: Date
    },
    
    // Nota Fiscal
    notaFiscal: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'NotaFiscal'
    },
    
    // Informações adicionais
    cupomDesconto: String,
    observacoes: String,
    dadosCartao: {
        ultimosDigitos: String,
        bandeira: String
    },
    
    criadoEm: {
        type: Date,
        default: Date.now,
        index: true
    },
    atualizadoEm: {
        type: Date,
        default: Date.now
    }
});

// Atualizar timestamp
pagamentoSchema.pre('save', function(next) {
    this.atualizadoEm = Date.now();
    next();
});

// Calcular valor final com desconto
pagamentoSchema.methods.calcularValorFinal = function() {
    this.valorFinal = this.valor - this.desconto;
    return this.valorFinal;
};

module.exports = mongoose.model('Pagamento', pagamentoSchema);

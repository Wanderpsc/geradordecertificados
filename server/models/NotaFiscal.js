const mongoose = require('mongoose');

const notaFiscalSchema = new mongoose.Schema({
    numero: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    serie: {
        type: String,
        default: '001'
    },
    pagamento: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Pagamento',
        required: true
    },
    usuario: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Usuario',
        required: true
    },
    
    // Dados do Prestador (Sua Empresa)
    prestador: {
        razaoSocial: String,
        nomeFantasia: String,
        cnpj: String,
        inscricaoMunicipal: String,
        endereco: String,
        cidade: String,
        estado: String,
        cep: String,
        telefone: String,
        email: String
    },
    
    // Dados do Tomador (Cliente)
    tomador: {
        nome: String,
        cpfCnpj: String,
        endereco: String,
        cidade: String,
        estado: String,
        cep: String,
        email: String,
        telefone: String
    },
    
    // Descrição do Serviço
    descricaoServico: {
        type: String,
        required: true
    },
    valorServico: {
        type: Number,
        required: true
    },
    
    // Impostos
    impostos: {
        iss: { type: Number, default: 0 },
        pis: { type: Number, default: 0 },
        cofins: { type: Number, default: 0 },
        inss: { type: Number, default: 0 },
        ir: { type: Number, default: 0 },
        csll: { type: Number, default: 0 }
    },
    
    valorTotalImpostos: {
        type: Number,
        default: 0
    },
    valorLiquido: {
        type: Number,
        required: true
    },
    
    // Status
    status: {
        type: String,
        enum: ['emitida', 'cancelada', 'substituida'],
        default: 'emitida'
    },
    
    // Datas
    dataEmissao: {
        type: Date,
        default: Date.now
    },
    dataCompetencia: Date,
    dataCancelamento: Date,
    motivoCancelamento: String,
    
    // Arquivos
    arquivoPDF: String,
    arquivoXML: String,
    codigoVerificacao: String,
    
    // RPS (Recibo Provisório de Serviços)
    numeroRPS: String,
    serieRPS: String,
    
    observacoes: String,
    
    criadaEm: {
        type: Date,
        default: Date.now
    }
});

// Gerar número sequencial de nota
notaFiscalSchema.statics.gerarNumero = async function() {
    const ultimaNota = await this.findOne().sort('-numero');
    const ultimoNumero = ultimaNota ? parseInt(ultimaNota.numero) : 0;
    return String(ultimoNumero + 1).padStart(8, '0');
};

// Calcular total de impostos
notaFiscalSchema.methods.calcularImpostos = function() {
    const { iss, pis, cofins, inss, ir, csll } = this.impostos;
    this.valorTotalImpostos = (iss || 0) + (pis || 0) + (cofins || 0) + 
                              (inss || 0) + (ir || 0) + (csll || 0);
    this.valorLiquido = this.valorServico - this.valorTotalImpostos;
    return this.valorTotalImpostos;
};

// Cancelar nota fiscal
notaFiscalSchema.methods.cancelar = async function(motivo) {
    this.status = 'cancelada';
    this.dataCancelamento = new Date();
    this.motivoCancelamento = motivo;
    await this.save();
};

module.exports = mongoose.model('NotaFiscal', notaFiscalSchema);

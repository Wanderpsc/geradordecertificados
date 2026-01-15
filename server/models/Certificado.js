const mongoose = require('mongoose');
const crypto = require('crypto');

const certificadoSchema = new mongoose.Schema({
    codigoVerificacao: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    hashDocumento: {
        type: String,
        required: true
    },
    aluno: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Aluno',
        required: true
    },
    usuario: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Usuario',
        required: true
    },
    licenca: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Licenca',
        required: true
    },
    dadosAluno: {
        nome: String,
        cpf: String,
        rg: String
    },
    template: {
        type: String,
        required: true
    },
    dataGeracao: {
        type: Date,
        default: Date.now,
        index: true
    },
    ipGeracao: String,
    valido: {
        type: Boolean,
        default: true
    },
    observacoes: String,
    metadados: {
        versaoSistema: String,
        assinaturaDigital: String
    }
});

// Gerar código de verificação único
certificadoSchema.statics.gerarCodigoVerificacao = function() {
    const timestamp = Date.now().toString(36);
    const random = crypto.randomBytes(6).toString('hex').toUpperCase();
    return `CERT-${timestamp}-${random}`;
};

// Gerar hash do documento
certificadoSchema.statics.gerarHash = function(dados) {
    const conteudo = JSON.stringify(dados);
    return crypto.createHash('sha256').update(conteudo).digest('hex');
};

// Verificar autenticidade
certificadoSchema.methods.verificarAutenticidade = async function() {
    if (!this.valido) return false;
    
    // Verificar se a licença ainda existe e está válida
    const Licenca = require('./Licenca');
    const licenca = await Licenca.findById(this.licenca);
    
    if (!licenca || !licenca.estaValida()) {
        return false;
    }
    
    return true;
};

// Invalidar certificado
certificadoSchema.methods.invalidar = async function(motivo) {
    this.valido = false;
    this.observacoes = `Invalidado: ${motivo}`;
    await this.save();
};

module.exports = mongoose.model('Certificado', certificadoSchema);

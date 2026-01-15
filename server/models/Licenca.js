const mongoose = require('mongoose');
const crypto = require('crypto');

const licencaSchema = new mongoose.Schema({
    chaveLicenca: {
        type: String,
        required: true,
        unique: true
    },
    usuario: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Usuario'
    },
    tipo: {
        type: String,
        enum: ['trial', 'mensal', 'anual', 'vitalicia'],
        required: true
    },
    status: {
        type: String,
        enum: ['ativa', 'expirada', 'suspensa', 'cancelada'],
        default: 'ativa'
    },
    limiteCertificados: {
        type: Number,
        default: -1 // -1 = ilimitado
    },
    certificadosGerados: {
        type: Number,
        default: 0
    },
    dataInicio: {
        type: Date,
        default: Date.now
    },
    dataExpiracao: {
        type: Date,
        required: true
    },
    recursos: {
        multiplosTemplates: {
            type: Boolean,
            default: false
        },
        templatesCustomizados: {
            type: Boolean,
            default: false
        },
        exportacaoPDF: {
            type: Boolean,
            default: true
        },
        historicosEscolares: {
            type: Boolean,
            default: false
        },
        marcaDagua: {
            type: Boolean,
            default: true // true = tem marca d'água
        }
    },
    valorPago: {
        type: Number,
        default: 0
    },
    metodoPagamento: {
        type: String,
        enum: ['boleto', 'cartao', 'pix', 'transferencia', 'cortesia'],
        default: 'cortesia'
    },
    observacoes: {
        type: String
    },
    criadoEm: {
        type: Date,
        default: Date.now
    }
});

// Gerar chave de licença única
licencaSchema.statics.gerarChaveLicenca = function() {
    const prefixo = 'CERT';
    const parte1 = crypto.randomBytes(2).toString('hex').toUpperCase();
    const parte2 = crypto.randomBytes(2).toString('hex').toUpperCase();
    const parte3 = crypto.randomBytes(2).toString('hex').toUpperCase();
    const parte4 = crypto.randomBytes(2).toString('hex').toUpperCase();
    
    return `${prefixo}-${parte1}-${parte2}-${parte3}-${parte4}`;
};

// Verificar se a licença está válida
licencaSchema.methods.estaValida = function() {
    if (this.status !== 'ativa') return false;
    if (new Date() > this.dataExpiracao) {
        this.status = 'expirada';
        this.save();
        return false;
    }
    if (this.limiteCertificados !== -1 && this.certificadosGerados >= this.limiteCertificados) {
        return false;
    }
    return true;
};

// Incrementar contador de certificados gerados
licencaSchema.methods.incrementarContador = async function() {
    this.certificadosGerados += 1;
    await this.save();
};

module.exports = mongoose.model('Licenca', licencaSchema);

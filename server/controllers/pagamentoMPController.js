const { MercadoPagoConfig, Payment, Preference } = require('mercadopago');
const Pagamento = require('../models/Pagamento');
const PlanoVenda = require('../models/PlanoVenda');
const { provisionarLicencaParaPlano } = require('./planoController');

// Inicializar cliente MP com access token do .env
function getMPClient() {
    const token = process.env.MP_ACCESS_TOKEN;
    if (!token) throw new Error('MP_ACCESS_TOKEN não configurado nas variáveis de ambiente.');
    return new MercadoPagoConfig({ accessToken: token });
}

// ─────────────────────────── PIX ─────────────────────────────────────────────

// @desc  Criar pagamento PIX
// @route POST /api/pagamentos/pix
// @access Private
exports.criarPix = async (req, res) => {
    try {
        const { planoId } = req.body;
        const usuario = req.usuario;

        const plano = await PlanoVenda.findOne({ _id: planoId, ativo: true });
        if (!plano) return res.status(404).json({ success: false, message: 'Plano não encontrado.' });

        const client = getMPClient();
        const paymentApi = new Payment(client);

        const paymentData = {
            transaction_amount: plano.preco,
            description: `${plano.nome} — Gerador de Certificados`,
            payment_method_id: 'pix',
            payer: {
                email: usuario.email,
                first_name: (usuario.nome || '').split(' ')[0],
                last_name: (usuario.nome || '').split(' ').slice(1).join(' ') || 'N/A'
            },
            metadata: {
                plano_id: planoId,
                usuario_id: usuario._id.toString(),
                plano_nome: plano.nome
            }
        };

        const mpResponse = await paymentApi.create({ body: paymentData });

        // Registrar pagamento pendente no banco
        const pagamento = await Pagamento.create({
            usuario: usuario._id,
            valor: plano.preco,
            valorFinal: plano.preco,
            desconto: 0,
            metodoPagamento: 'pix',
            status: 'pendente',
            gatewayPagamento: 'mercadopago',
            codigoTransacao: String(mpResponse.id),
            tipoProduto: plano.tipoLicenca,
            periodoCobertura: {
                inicio: new Date(),
                fim: new Date(Date.now() + plano.validadeDias * 86400000)
            }
        });

        const qr = mpResponse.point_of_interaction?.transaction_data;

        res.json({
            success: true,
            pagamentoId: pagamento._id,
            mpPaymentId: mpResponse.id,
            qrCode: qr?.qr_code || null,
            qrCodeBase64: qr?.qr_code_base64 || null,
            expiracao: mpResponse.date_of_expiration,
            plano: { nome: plano.nome, preco: plano.preco }
        });
    } catch (err) {
        console.error('Erro ao criar PIX:', err.message);
        res.status(500).json({ success: false, message: 'Erro ao gerar pagamento PIX.', error: err.message });
    }
};

// ─────────────────────── CARTÃO PARCELADO ────────────────────────────────────

// @desc  Criar preferência de pagamento com cartão (Checkout MP)
// @route POST /api/pagamentos/cartao
// @access Private
exports.criarCheckoutCartao = async (req, res) => {
    try {
        const { planoId, parcelas } = req.body;
        const usuario = req.usuario;

        const plano = await PlanoVenda.findOne({ _id: planoId, ativo: true });
        if (!plano) return res.status(404).json({ success: false, message: 'Plano não encontrado.' });

        const numParcelas = Math.min(Math.max(parseInt(parcelas) || 1, 1), plano.maxParcelas);

        const client = getMPClient();
        const preferenceApi = new Preference(client);

        const baseUrl = process.env.APP_BASE_URL || 'https://gerador-certificados.surge.sh';

        const preferenceData = {
            items: [{
                id: planoId,
                title: plano.nome,
                description: plano.descricao || plano.nome,
                quantity: 1,
                currency_id: 'BRL',
                unit_price: plano.preco
            }],
            payer: {
                email: usuario.email,
                name: usuario.nome || ''
            },
            payment_methods: {
                installments: numParcelas,
                default_installments: numParcelas
            },
            back_urls: {
                success: `${baseUrl}/comprar.html?status=aprovado&plano=${planoId}`,
                failure: `${baseUrl}/comprar.html?status=falha&plano=${planoId}`,
                pending: `${baseUrl}/comprar.html?status=pendente&plano=${planoId}`
            },
            auto_return: 'approved',
            metadata: {
                plano_id: planoId,
                usuario_id: usuario._id.toString(),
                plano_nome: plano.nome
            },
            notification_url: `${process.env.API_BASE_URL || 'https://gerador-certificados.onrender.com'}/api/pagamentos/webhook`
        };

        const mpResponse = await preferenceApi.create({ body: preferenceData });

        // Registrar pagamento pendente
        await Pagamento.create({
            usuario: usuario._id,
            valor: plano.preco,
            valorFinal: plano.preco,
            desconto: 0,
            metodoPagamento: 'cartao_credito',
            status: 'pendente',
            gatewayPagamento: 'mercadopago',
            codigoTransacao: mpResponse.id,
            tipoProduto: plano.tipoLicenca,
            periodoCobertura: {
                inicio: new Date(),
                fim: new Date(Date.now() + plano.validadeDias * 86400000)
            }
        });

        res.json({
            success: true,
            checkoutUrl: mpResponse.init_point,
            checkoutUrlSandbox: mpResponse.sandbox_init_point,
            preferenceId: mpResponse.id,
            plano: { nome: plano.nome, preco: plano.preco, maxParcelas: plano.maxParcelas }
        });
    } catch (err) {
        console.error('Erro ao criar checkout cartão:', err.message);
        res.status(500).json({ success: false, message: 'Erro ao criar checkout.', error: err.message });
    }
};

// ─────────────────────────── WEBHOOK ─────────────────────────────────────────

// @desc  Receber notificações do Mercado Pago
// @route POST /api/pagamentos/webhook
// @access Public (sem auth — verificar assinatura MP)
exports.webhook = async (req, res) => {
    try {
        const { type, data } = req.body;
        res.sendStatus(200); // Responder 200 imediatamente ao MP

        if (type !== 'payment') return;

        const mpPaymentId = data?.id;
        if (!mpPaymentId) return;

        const client = getMPClient();
        const paymentApi = new Payment(client);
        const mpPayment = await paymentApi.get({ id: mpPaymentId });

        if (mpPayment.status !== 'approved') return;

        const planoId = mpPayment.metadata?.plano_id;
        const usuarioId = mpPayment.metadata?.usuario_id;
        if (!planoId || !usuarioId) return;

        // Atualizar registro de pagamento
        const pagamento = await Pagamento.findOneAndUpdate(
            { codigoTransacao: String(mpPaymentId) },
            {
                status: 'aprovado',
                dataPagamento: new Date(),
                metodoPagamento: mpPayment.payment_method_id === 'pix' ? 'pix' : 'cartao_credito'
            },
            { new: true }
        );

        // Provisionar licença e templates
        const metodo = mpPayment.payment_method_id === 'pix' ? 'pix' : 'cartao_credito';
        await provisionarLicencaParaPlano(planoId, usuarioId, metodo);

        console.log(`✅ Pagamento ${mpPaymentId} aprovado → licença provisionada para usuário ${usuarioId}`);
    } catch (err) {
        console.error('❌ Erro no webhook MP:', err.message);
    }
};

// @desc  Verificar status de um pagamento PIX (polling)
// @route GET /api/pagamentos/status/:mpPaymentId
// @access Private
exports.verificarStatusPix = async (req, res) => {
    try {
        const client = getMPClient();
        const paymentApi = new Payment(client);
        const mpPayment = await paymentApi.get({ id: req.params.mpPaymentId });

        const aprovado = mpPayment.status === 'approved';
        if (aprovado) {
            const planoId = mpPayment.metadata?.plano_id;
            const usuarioId = req.usuario._id.toString();

            // Verificar se licença já foi provisionada
            const pgto = await Pagamento.findOne({ codigoTransacao: String(req.params.mpPaymentId) });
            if (pgto && pgto.status !== 'aprovado') {
                await Pagamento.findByIdAndUpdate(pgto._id, { status: 'aprovado', dataPagamento: new Date() });
                await provisionarLicencaParaPlano(planoId, usuarioId, 'pix');
            }
        }

        res.json({
            success: true,
            status: mpPayment.status,
            aprovado
        });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Erro ao verificar status.', error: err.message });
    }
};

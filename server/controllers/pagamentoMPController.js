const { MercadoPagoConfig, Payment, Preference } = require('mercadopago');
const Pagamento = require('../models/Pagamento');
const PlanoVenda = require('../models/PlanoVenda');
const { provisionarLicencaParaPlano } = require('./planoController');

// Extrair mensagem legível de erros do SDK do Mercado Pago
function mpErrMsg(err) {
    // SDK v2: err.cause pode ser array de objetos { code, description }
    if (Array.isArray(err?.cause) && err.cause.length > 0) {
        return err.cause.map(c => `${c.code}: ${c.description}`).join(' | ');
    }
    if (err?.error && err?.message) return `${err.error} — ${err.message}`;
    if (err?.message && err.message !== '[object Object]') return err.message;
    try { return JSON.stringify(err); } catch (_) { return String(err); }
}

// Detectar modo sandbox/teste pelo prefixo do token
function isTestMode() {
    const token = process.env.MP_ACCESS_TOKEN || '';
    return token.startsWith('TEST-');
}

// Email do pagador: em modo teste usa email fixo de teste do MP
function payerEmail(realEmail) {
    // Em modo teste o payer DEVE ser um test-user; usamos o email de teste padrão.
    // Substitua por um test-user criado na sua conta MP se quiser testar pagamentos aprovados.
    return isTestMode() ? (process.env.MP_TEST_PAYER_EMAIL || 'test_user_123456789@testuser.com') : realEmail;
}

// Inicializar cliente MP com access token do .env
function getMPClient() {
    const token = process.env.MP_ACCESS_TOKEN;
    if (!token) throw new Error('MP_ACCESS_TOKEN não configurado nas variáveis de ambiente. Configure a variável no painel do Render.');
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
                email: payerEmail(usuario.email),
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
        const detalhe = mpErrMsg(err);
        console.error('Erro ao criar PIX:', detalhe);
        res.status(500).json({ success: false, message: 'Erro ao gerar pagamento PIX.', error: detalhe });
    }
};

// ─────────────────────── PIX DE RENOVAÇÃO AUTOMÁTICA ─────────────────────────

// @desc  Criar PIX de renovação usando o plano atual do usuário (sem precisar de planoId)
// @route POST /api/pagamentos/pix-renovacao
// @access Private
exports.criarPixRenovacao = async (req, res) => {
    try {
        const usuario = req.usuario; // já populado com licença pelo middleware
        const licenca = usuario.licenca;

        if (!licenca) {
            return res.status(400).json({ success: false, message: 'Nenhuma licença encontrada.' });
        }

        if (licenca.status === 'cancelada') {
            return res.status(400).json({ success: false, message: 'Licença já cancelada.' });
        }

        // Encontrar o plano de venda mais barato que corresponde ao tipo de licença do usuário
        const plano = await PlanoVenda.findOne({
            tipoLicenca: licenca.tipo,
            ativo: true,
            tipo: { $ne: 'creditos' }
        }).sort({ preco: 1 });

        if (!plano) {
            return res.status(404).json({
                success: false,
                message: 'Nenhum plano de renovação encontrado para esta licença.'
            });
        }

        const client = getMPClient();
        const paymentApi = new Payment(client);

        const paymentData = {
            transaction_amount: plano.preco,
            description: `Renovação — ${plano.nome} — Gerador de Certificados`,
            payment_method_id: 'pix',
            payer: {
                email: payerEmail(usuario.email),
                first_name: (usuario.nome || '').split(' ')[0],
                last_name: (usuario.nome || '').split(' ').slice(1).join(' ') || 'N/A'
            },
            metadata: {
                plano_id: plano._id.toString(),
                usuario_id: usuario._id.toString(),
                plano_nome: plano.nome,
                renovacao: 'true'
            }
        };

        const mpResponse = await paymentApi.create({ body: paymentData });

        await Pagamento.create({
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
            mpPaymentId: mpResponse.id,
            qrCode: qr?.qr_code || null,
            qrCodeBase64: qr?.qr_code_base64 || null,
            plano: { nome: plano.nome, preco: plano.preco }
        });
    } catch (err) {
        const detalhe = mpErrMsg(err);
        console.error('Erro ao criar PIX de renovação:', detalhe);
        res.status(500).json({ success: false, message: 'Erro ao gerar PIX de renovação.', error: detalhe });
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
            // Não enviar payer.email — se for o mesmo email do vendedor, MP bloqueia o botão Pagar.
            // O comprador fará login com a própria conta MP no checkout.
            payment_methods: {
                // Excluir boleto e ATM — manter apenas cartão
                excluded_payment_types: [
                    { id: 'ticket' },   // boleto bancário
                    { id: 'atm' },      // caixas eletrônicos
                    { id: 'bank_transfer' } // transferência bancária (mantém apenas cartão)
                ],
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

        // Em modo teste usar sandbox_init_point; em produção usar init_point
        const checkoutUrl = isTestMode()
            ? mpResponse.sandbox_init_point
            : mpResponse.init_point;

        res.json({
            success: true,
            checkoutUrl,
            testMode: isTestMode(),
            preferenceId: mpResponse.id,
            plano: { nome: plano.nome, preco: plano.preco, maxParcelas: plano.maxParcelas }
        });
    } catch (err) {
        const detalhe = mpErrMsg(err);
        console.error('Erro ao criar checkout cartão:', detalhe);
        res.status(500).json({ success: false, message: 'Erro ao criar checkout.', error: detalhe });
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

// @desc  Verificar e provisionar pagamentos aprovados mais recentes do usuário (pós back_url do cartão)
// @route POST /api/pagamentos/verificar-pendentes
// @access Private
exports.verificarEProvisionar = async (req, res) => {
    try {
        const usuarioId = req.usuario._id.toString();

        // Buscar os últimos pagamentos pendentes do usuário
        const pgtosPendentes = await Pagamento.find({
            usuario: usuarioId,
            status: 'pendente',
            gatewayPagamento: 'mercadopago'
        }).sort({ createdAt: -1 }).limit(5);

        if (!pgtosPendentes.length) {
            return res.json({ success: true, aprovado: false, message: 'Nenhum pagamento pendente encontrado.' });
        }

        const client = getMPClient();
        const paymentApi = new Payment(client);

        let provisionado = false;

        for (const pgto of pgtosPendentes) {
            try {
                const mpPayment = await paymentApi.get({ id: pgto.codigoTransacao });
                if (mpPayment.status !== 'approved') continue;

                const planoId = mpPayment.metadata?.plano_id;
                if (!planoId) continue;

                // Atualizar pagamento e provisionar licença
                await Pagamento.findByIdAndUpdate(pgto._id, {
                    status: 'aprovado',
                    dataPagamento: new Date(),
                    metodoPagamento: mpPayment.payment_method_id === 'pix' ? 'pix' : 'cartao_credito'
                });
                await provisionarLicencaParaPlano(planoId, usuarioId,
                    mpPayment.payment_method_id === 'pix' ? 'pix' : 'cartao_credito');

                provisionado = true;
                console.log(`✅ Pagamento ${pgto.codigoTransacao} provisionado via verificar-pendentes para ${usuarioId}`);
                break; // provisiona apenas o primeiro aprovado encontrado
            } catch (_) {}
        }

        res.json({ success: true, aprovado: provisionado });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Erro ao verificar pagamentos.', error: err.message });
    }
};

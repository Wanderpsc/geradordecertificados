const express = require('express');
const router = express.Router();
const {
    criarPix,
    criarPixRenovacao,
    criarCheckoutCartao,
    webhook,
    verificarStatusPix,
    verificarEProvisionar
} = require('../controllers/pagamentoMPController');
const { proteger } = require('../middlewares/auth');

// Webhook público (sem autenticação — chamado pelo Mercado Pago)
router.post('/webhook', webhook);

// Rotas autenticadas
router.post('/pix', proteger, criarPix);
router.post('/pix-renovacao', proteger, criarPixRenovacao);
router.post('/cartao', proteger, criarCheckoutCartao);
router.get('/status/:mpPaymentId', proteger, verificarStatusPix);
router.post('/verificar-pendentes', proteger, verificarEProvisionar);

module.exports = router;

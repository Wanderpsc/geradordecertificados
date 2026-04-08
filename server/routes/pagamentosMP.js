const express = require('express');
const router = express.Router();
const {
    criarPix,
    criarPixRenovacao,
    criarCheckoutCartao,
    webhook,
    verificarStatusPix
} = require('../controllers/pagamentoMPController');
const { proteger } = require('../middlewares/auth');

// Webhook público (sem autenticação — chamado pelo Mercado Pago)
router.post('/webhook', webhook);

// Rotas autenticadas
router.post('/pix', proteger, criarPix);
router.post('/pix-renovacao', proteger, criarPixRenovacao);
router.post('/cartao', proteger, criarCheckoutCartao);
router.get('/status/:mpPaymentId', proteger, verificarStatusPix);

module.exports = router;

const express = require('express');
const router = express.Router();
const {
    criarLicenca,
    ativarLicenca,
    verificarStatus,
    listarLicencas,
    renovarLicenca,
    cancelarMinhaAssinatura
} = require('../controllers/licenseController');
const { proteger, apenasAdmin } = require('../middlewares/auth');

router.post('/', proteger, apenasAdmin, criarLicenca);
router.post('/activate', proteger, ativarLicenca);
router.get('/status', proteger, verificarStatus);
router.get('/', proteger, apenasAdmin, listarLicencas);
router.put('/:id/renew', proteger, apenasAdmin, renovarLicenca);
router.delete('/minha', proteger, cancelarMinhaAssinatura);

module.exports = router;

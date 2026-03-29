const express = require('express');
const router = express.Router();
const { proteger, apenasCliente, verificarLicenca } = require('../middlewares/auth');
const ctrl = require('../controllers/subUsuarioController');

// Todas as rotas protegidas: precisa estar logado, ser cliente e ter licença
router.use(proteger, apenasCliente, verificarLicenca);

router.get('/', ctrl.listar);
router.post('/', ctrl.criar);
router.get('/logs', ctrl.logs);
router.put('/:id', ctrl.atualizar);
router.post('/:id/resetar-senha', ctrl.resetarSenha);
router.delete('/:id', ctrl.excluir);

module.exports = router;

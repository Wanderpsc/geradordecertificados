const express = require('express');
const router = express.Router();
const { proteger, apenasCliente, verificarLicenca, apenasDonoEscola, checarPermissao } = require('../middlewares/auth');
const ctrl = require('../controllers/subUsuarioController');

// Todas as rotas protegidas: precisa estar logado, ser cliente e ter licença
router.use(proteger, apenasCliente, verificarLicenca);

// Somente o titular da conta pode gerenciar usuários e ver logs de conta
router.get('/', apenasDonoEscola, ctrl.listar);
router.post('/', apenasDonoEscola, ctrl.criar);
router.get('/logs', apenasDonoEscola, ctrl.logs);
router.put('/:id', apenasDonoEscola, ctrl.atualizar);
router.post('/:id/resetar-senha', apenasDonoEscola, ctrl.resetarSenha);
router.delete('/:id', apenasDonoEscola, ctrl.excluir);

module.exports = router;

const express = require('express');
const router = express.Router();
const { proteger, apenasCliente, verificarLicenca, checarPermissao } = require('../middlewares/auth');
const modeloController = require('../controllers/modeloController');

// Todas as rotas requerem autenticação + cliente + licença válida
router.use(proteger, apenasCliente, verificarLicenca);

router.get('/diagnostico', modeloController.diagnostico);
router.get('/', modeloController.listarModelos);
router.post('/', checarPermissao('editarModelos'), modeloController.salvarModelo);
router.get('/:id', modeloController.obterModelo);
router.put('/:id', checarPermissao('editarModelos'), modeloController.atualizarModelo);
router.post('/:id/copiar', checarPermissao('editarModelos'), modeloController.copiarModelo);
router.patch('/:id/arquivar', checarPermissao('editarModelos'), modeloController.arquivarModelo);
router.delete('/:id', checarPermissao('editarModelos'), modeloController.deletarModelo);

module.exports = router;

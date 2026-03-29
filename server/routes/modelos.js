const express = require('express');
const router = express.Router();
const { proteger, apenasCliente, verificarLicenca } = require('../middlewares/auth');
const modeloController = require('../controllers/modeloController');

// Todas as rotas requerem autenticação + cliente + licença válida
router.use(proteger, apenasCliente, verificarLicenca);

router.get('/', modeloController.listarModelos);
router.post('/', modeloController.salvarModelo);
router.get('/:id', modeloController.obterModelo);
router.put('/:id', modeloController.atualizarModelo);
router.post('/:id/copiar', modeloController.copiarModelo);
router.patch('/:id/arquivar', modeloController.arquivarModelo);
router.delete('/:id', modeloController.deletarModelo);

module.exports = router;

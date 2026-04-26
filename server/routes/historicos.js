const express = require('express');
const router = express.Router();
const { proteger, apenasCliente, verificarLicenca, checarPermissao } = require('../middlewares/auth');
const ctrl = require('../controllers/historicoController');
const matrizCtrl = require('../controllers/matrizController');

router.use(proteger, apenasCliente, verificarLicenca);

// Matrizes Curriculares
router.get('/matrizes', matrizCtrl.listar);
router.get('/matrizes/:id', matrizCtrl.obter);
router.post('/matrizes', checarPermissao('editarModelos'), matrizCtrl.criar);
router.post('/matrizes/:id/duplicar', checarPermissao('editarModelos'), matrizCtrl.duplicar);
router.put('/matrizes/:id', checarPermissao('editarModelos'), matrizCtrl.atualizar);
router.delete('/matrizes/:id', checarPermissao('editarModelos'), matrizCtrl.excluir);

// Grades (templates de disciplinas) — edição requer permissão editarModelos
router.get('/grades', ctrl.listarGrades);
router.get('/grades/:id', ctrl.obterGrade);
router.post('/grades', checarPermissao('editarModelos'), ctrl.salvarGrade);
router.put('/grades/:id', checarPermissao('editarModelos'), ctrl.atualizarGrade);
router.delete('/grades/:id', checarPermissao('editarModelos'), ctrl.excluirGrade);

// Históricos (dados por aluno)
router.get('/', ctrl.listarHistoricos);
router.get('/:id', ctrl.obterHistorico);
router.post('/', checarPermissao('gerarCertificados'), ctrl.salvarHistorico);
router.put('/:id', checarPermissao('gerarCertificados'), ctrl.atualizarHistorico);
router.delete('/:id', checarPermissao('excluirAlunos'), ctrl.excluirHistorico);

module.exports = router;

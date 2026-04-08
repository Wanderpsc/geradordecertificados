const express = require('express');
const router = express.Router();
const { proteger, apenasCliente, verificarLicenca, checarPermissao } = require('../middlewares/auth');
const ctrl = require('../controllers/historicoController');

router.use(proteger, apenasCliente, verificarLicenca);

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

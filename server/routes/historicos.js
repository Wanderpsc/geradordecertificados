const express = require('express');
const router = express.Router();
const { proteger, apenasCliente, verificarLicenca } = require('../middlewares/auth');
const ctrl = require('../controllers/historicoController');

router.use(proteger, apenasCliente, verificarLicenca);

// Grades (templates de disciplinas)
router.get('/grades', ctrl.listarGrades);
router.get('/grades/:id', ctrl.obterGrade);
router.post('/grades', ctrl.salvarGrade);
router.put('/grades/:id', ctrl.atualizarGrade);
router.delete('/grades/:id', ctrl.excluirGrade);

// Históricos (dados por aluno)
router.get('/', ctrl.listarHistoricos);
router.get('/:id', ctrl.obterHistorico);
router.post('/', ctrl.salvarHistorico);
router.put('/:id', ctrl.atualizarHistorico);
router.delete('/:id', ctrl.excluirHistorico);

module.exports = router;

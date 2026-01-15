const express = require('express');
const router = express.Router();
const {
    criarAluno,
    listarAlunos,
    buscarAluno,
    atualizarAluno,
    deletarAluno,
    buscarAlunos
} = require('../controllers/alunoController');
const { proteger, verificarLicenca, apenasCliente } = require('../middlewares/auth');

// Todas as rotas requerem autenticação e licença válida
// ADMINISTRADORES NÃO PODEM ACESSAR (apenas clientes)
router.use(proteger);
router.use(apenasCliente); // Bloqueia admins
router.use(verificarLicenca);

router.route('/')
    .get(listarAlunos)
    .post(criarAluno);

router.get('/search', buscarAlunos);

router.route('/:id')
    .get(buscarAluno)
    .put(atualizarAluno)
    .delete(deletarAluno);

module.exports = router;

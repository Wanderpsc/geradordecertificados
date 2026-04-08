const express = require('express');
const router = express.Router();
const {
    listarPlanosAdmin,
    criarPlano,
    atualizarPlano,
    excluirPlano,
    adicionarTemplate,
    removerTemplate,
    listarPlanosPublico,
    obterPlano
} = require('../controllers/planoController');
const { proteger, apenasAdmin } = require('../middlewares/auth');

// Rotas públicas (vitrine)
router.get('/', listarPlanosPublico);
router.get('/:id', obterPlano);

// Rotas admin
router.get('/admin/todos', proteger, apenasAdmin, listarPlanosAdmin);
router.post('/admin', proteger, apenasAdmin, criarPlano);
router.put('/admin/:id', proteger, apenasAdmin, atualizarPlano);
router.delete('/admin/:id', proteger, apenasAdmin, excluirPlano);
router.post('/admin/:id/templates', proteger, apenasAdmin, adicionarTemplate);
router.delete('/admin/:id/templates/:templateId', proteger, apenasAdmin, removerTemplate);

module.exports = router;

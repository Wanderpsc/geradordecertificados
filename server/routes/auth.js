const express = require('express');
const router = express.Router();
const { registrar, login, obterUsuarioAtual } = require('../controllers/authController');
const { proteger } = require('../middlewares/auth');

// Ping simples para acordar o servidor (Render free tier)
router.get('/ping', (req, res) => res.json({ ok: true }));

router.post('/register', registrar);
router.post('/login', login);
router.get('/me', proteger, obterUsuarioAtual);

module.exports = router;

const express = require('express');
const router = express.Router();
const { registrar, login, obterUsuarioAtual } = require('../controllers/authController');
const { proteger } = require('../middlewares/auth');

router.post('/register', registrar);
router.post('/login', login);
router.get('/me', proteger, obterUsuarioAtual);

module.exports = router;

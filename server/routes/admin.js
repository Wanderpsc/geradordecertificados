const express = require('express');
const router = express.Router();
const {
    getDashboard,
    listarClientes,
    detalhesCliente,
    alterarStatusCliente,
    registrarPagamento,
    listarPagamentos,
    aprovarPagamento,
    recusarPagamento,
    emitirNotaFiscal,
    listarNotasFiscais,
    detalhesNotaFiscal,
    cancelarNotaFiscal,
    relatorioFinanceiro,
    listarLogs
} = require('../controllers/adminController');
const { proteger, apenasAdmin } = require('../middlewares/auth');

// Todas as rotas requerem autenticação de admin
router.use(proteger);
router.use(apenasAdmin);

// Dashboard
router.get('/dashboard', getDashboard);

// Clientes
router.get('/clientes', listarClientes);
router.get('/clientes/:id', detalhesCliente);
router.patch('/clientes/:id/status', alterarStatusCliente);

// Pagamentos
router.get('/pagamentos', listarPagamentos);
router.post('/pagamentos', registrarPagamento);
router.patch('/pagamentos/:id/aprovar', aprovarPagamento);
router.patch('/pagamentos/:id/recusar', recusarPagamento);

// Notas Fiscais
router.get('/notas-fiscais', listarNotasFiscais);
router.get('/notas-fiscais/:id', detalhesNotaFiscal);
router.post('/notas-fiscais', emitirNotaFiscal);
router.patch('/notas-fiscais/:id/cancelar', cancelarNotaFiscal);

// Relatórios
router.get('/relatorio-financeiro', relatorioFinanceiro);

// Logs
router.get('/logs', listarLogs);

module.exports = router;

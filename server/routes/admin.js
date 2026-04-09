const express = require('express');
const router = express.Router();
const {
    getDashboard,
    listarClientes,
    detalhesCliente,
    alterarStatusCliente,
    resetarSenhaCliente,
    excluirCliente,
    excluirClientesLote,
    excluirLicenca,
    editarDataLicenca,
    registrarPagamento,
    listarPagamentos,
    aprovarPagamento,
    recusarPagamento,
    excluirPagamentosRecusados,
    emitirNotaFiscal,
    listarNotasFiscais,
    detalhesNotaFiscal,
    cancelarNotaFiscal,
    editarNotaFiscal,
    reemitirNotaFiscal,
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
router.post('/clientes/excluir-lote', excluirClientesLote);
router.get('/clientes/:id', detalhesCliente);
router.patch('/clientes/:id/status', alterarStatusCliente);
router.post('/clientes/:id/resetar-senha', resetarSenhaCliente);
router.delete('/clientes/:id', excluirCliente);

// Pagamentos
router.get('/pagamentos', listarPagamentos);

// Licenças (admin)
router.delete('/licencas/:id', excluirLicenca);
router.patch('/licencas/:id/data', editarDataLicenca);

// Pagamentos (continuação)
router.post('/pagamentos', registrarPagamento);
router.patch('/pagamentos/:id/aprovar', aprovarPagamento);
router.patch('/pagamentos/:id/recusar', recusarPagamento);
router.delete('/pagamentos/recusados', excluirPagamentosRecusados);

// Notas Fiscais
router.get('/notas-fiscais', listarNotasFiscais);
router.get('/notas-fiscais/:id', detalhesNotaFiscal);
router.post('/notas-fiscais', emitirNotaFiscal);
router.patch('/notas-fiscais/:id', editarNotaFiscal);
router.patch('/notas-fiscais/:id/cancelar', cancelarNotaFiscal);
router.post('/notas-fiscais/:id/reemitir', reemitirNotaFiscal);

// Relatórios
router.get('/relatorio-financeiro', relatorioFinanceiro);

// Logs
router.get('/logs', listarLogs);

module.exports = router;

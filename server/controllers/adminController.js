const Usuario = require('../models/Usuario');
const Licenca = require('../models/Licenca');
const Pagamento = require('../models/Pagamento');
const NotaFiscal = require('../models/NotaFiscal');
const Log = require('../models/Log');

// @desc    Dashboard com estatísticas gerais
// @route   GET /api/admin/dashboard
// @access  Private/Admin
exports.getDashboard = async (req, res) => {
    try {
        const hoje = new Date();
        const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
        const inicioAno = new Date(hoje.getFullYear(), 0, 1);

        // Estatísticas de usuários
        const totalUsuarios = await Usuario.countDocuments();
        const usuariosAtivos = await Usuario.countDocuments({ ativo: true });
        const usuariosNovos = await Usuario.countDocuments({ 
            criadoEm: { $gte: inicioMes } 
        });

        // Estatísticas de licenças
        const licencasAtivas = await Licenca.countDocuments({ status: 'ativa' });
        const licencasExpiradas = await Licenca.countDocuments({ status: 'expirada' });
        const licencasTrial = await Licenca.countDocuments({ tipo: 'trial', status: 'ativa' });
        const licencasPagas = await Licenca.countDocuments({ 
            tipo: { $in: ['mensal', 'anual', 'vitalicia'] },
            status: 'ativa'
        });

        // Estatísticas financeiras
        const pagamentosAprovados = await Pagamento.find({ status: 'aprovado' });
        const receitaMensal = pagamentosAprovados
            .filter(p => p.dataPagamento >= inicioMes)
            .reduce((sum, p) => sum + p.valorFinal, 0);
        const receitaAnual = pagamentosAprovados
            .filter(p => p.dataPagamento >= inicioAno)
            .reduce((sum, p) => sum + p.valorFinal, 0);
        const receitaTotal = pagamentosAprovados
            .reduce((sum, p) => sum + p.valorFinal, 0);

        // Pagamentos pendentes
        const pagamentosPendentes = await Pagamento.countDocuments({ status: 'pendente' });
        const valorPendente = await Pagamento.aggregate([
            { $match: { status: 'pendente' } },
            { $group: { _id: null, total: { $sum: '$valorFinal' } } }
        ]);

        // Notas fiscais emitidas
        const notasEmitidas = await NotaFiscal.countDocuments({ status: 'emitida' });
        const notasEsteMes = await NotaFiscal.countDocuments({ 
            dataEmissao: { $gte: inicioMes },
            status: 'emitida'
        });

        // Últimas atividades
        const ultimosLogs = await Log.find()
            .populate('usuario', 'nome email')
            .sort('-timestamp')
            .limit(10);

        res.json({
            success: true,
            dashboard: {
                usuarios: {
                    total: totalUsuarios,
                    ativos: usuariosAtivos,
                    novos: usuariosNovos
                },
                licencas: {
                    ativas: licencasAtivas,
                    expiradas: licencasExpiradas,
                    trial: licencasTrial,
                    pagas: licencasPagas
                },
                financeiro: {
                    receitaMensal,
                    receitaAnual,
                    receitaTotal,
                    pagamentosPendentes,
                    valorPendente: valorPendente[0]?.total || 0
                },
                notasFiscais: {
                    emitidas: notasEmitidas,
                    esteMes: notasEsteMes
                },
                ultimasAtividades: ultimosLogs
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erro ao buscar dashboard',
            error: error.message
        });
    }
};

// @desc    Listar todos os clientes
// @route   GET /api/admin/clientes
// @access  Private/Admin
exports.listarClientes = async (req, res) => {
    try {
        const { status, tipo, busca, pagina = 1, limite = 20 } = req.query;

        let query = { role: 'user' };

        if (status === 'ativo') query.ativo = true;
        if (status === 'inativo') query.ativo = false;
        
        if (busca) {
            query.$or = [
                { nome: { $regex: busca, $options: 'i' } },
                { email: { $regex: busca, $options: 'i' } },
                { instituicao: { $regex: busca, $options: 'i' } }
            ];
        }

        const clientes = await Usuario.find(query)
            .populate('licenca')
            .sort('-criadoEm')
            .limit(parseInt(limite))
            .skip((parseInt(pagina) - 1) * parseInt(limite));

        const total = await Usuario.countDocuments(query);

        res.json({
            success: true,
            clientes,
            paginacao: {
                total,
                pagina: parseInt(pagina),
                totalPaginas: Math.ceil(total / parseInt(limite))
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erro ao listar clientes',
            error: error.message
        });
    }
};

// @desc    Detalhes de um cliente
// @route   GET /api/admin/clientes/:id
// @access  Private/Admin
exports.detalhesCliente = async (req, res) => {
    try {
        const cliente = await Usuario.findById(req.params.id).populate('licenca');
        
        if (!cliente) {
            return res.status(404).json({
                success: false,
                message: 'Cliente não encontrado'
            });
        }

        // Buscar histórico de pagamentos
        const pagamentos = await Pagamento.find({ usuario: cliente._id })
            .sort('-criadoEm');

        // Buscar notas fiscais
        const notasFiscais = await NotaFiscal.find({ usuario: cliente._id })
            .sort('-dataEmissao');

        // Buscar logs de atividade
        const logs = await Log.find({ usuario: cliente._id })
            .sort('-timestamp')
            .limit(50);

        res.json({
            success: true,
            cliente,
            pagamentos,
            notasFiscais,
            logs
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erro ao buscar detalhes do cliente',
            error: error.message
        });
    }
};

// @desc    Ativar/Desativar cliente
// @route   PUT /api/admin/clientes/:id/status
// @access  Private/Admin
exports.alterarStatusCliente = async (req, res) => {
    try {
        const { ativo } = req.body;
        
        const cliente = await Usuario.findByIdAndUpdate(
            req.params.id,
            { ativo },
            { new: true }
        );

        res.json({
            success: true,
            message: `Cliente ${ativo ? 'ativado' : 'desativado'} com sucesso`,
            cliente
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erro ao alterar status do cliente',
            error: error.message
        });
    }
};

// @desc    Registrar pagamento
// @route   POST /api/admin/pagamentos
// @access  Private/Admin
exports.registrarPagamento = async (req, res) => {
    try {
        const pagamento = await Pagamento.create(req.body);
        
        // Se pagamento aprovado, atualizar/criar licença
        if (req.body.status === 'aprovado') {
            const usuario = await Usuario.findById(req.body.usuario);
            let licenca;

            if (usuario.licenca) {
                // Renovar licença existente
                licenca = await Licenca.findById(usuario.licenca);
                const novaDataExpiracao = new Date(licenca.dataExpiracao);
                
                if (req.body.tipoProduto === 'mensal') {
                    novaDataExpiracao.setMonth(novaDataExpiracao.getMonth() + 1);
                } else if (req.body.tipoProduto === 'anual') {
                    novaDataExpiracao.setFullYear(novaDataExpiracao.getFullYear() + 1);
                }
                
                licenca.dataExpiracao = novaDataExpiracao;
                licenca.status = 'ativa';
                await licenca.save();
            } else {
                // Criar nova licença
                const dataExpiracao = new Date();
                if (req.body.tipoProduto === 'mensal') {
                    dataExpiracao.setMonth(dataExpiracao.getMonth() + 1);
                } else if (req.body.tipoProduto === 'anual') {
                    dataExpiracao.setFullYear(dataExpiracao.getFullYear() + 1);
                } else if (req.body.tipoProduto === 'vitalicia') {
                    dataExpiracao.setFullYear(dataExpiracao.getFullYear() + 100);
                }

                licenca = await Licenca.create({
                    chaveLicenca: Licenca.gerarChaveLicenca(),
                    usuario: usuario._id,
                    tipo: req.body.tipoProduto,
                    dataExpiracao,
                    limiteCertificados: -1,
                    recursos: {
                        multiplosTemplates: true,
                        templatesCustomizados: true,
                        exportacaoPDF: true,
                        historicosEscolares: true,
                        marcaDagua: false
                    }
                });

                usuario.licenca = licenca._id;
                await usuario.save();
            }

            pagamento.licenca = licenca._id;
            await pagamento.save();
        }

        res.status(201).json({
            success: true,
            message: 'Pagamento registrado com sucesso',
            pagamento
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erro ao registrar pagamento',
            error: error.message
        });
    }
};

// @desc    Listar pagamentos
// @route   GET /api/admin/pagamentos
// @access  Private/Admin
exports.listarPagamentos = async (req, res) => {
    try {
        const { status, metodo, dataInicio, dataFim, pagina = 1, limite = 20 } = req.query;

        let query = {};

        if (status) query.status = status;
        if (metodo) query.metodoPagamento = metodo;
        
        if (dataInicio || dataFim) {
            query.criadoEm = {};
            if (dataInicio) query.criadoEm.$gte = new Date(dataInicio);
            if (dataFim) query.criadoEm.$lte = new Date(dataFim);
        }

        const pagamentos = await Pagamento.find(query)
            .populate('usuario', 'nome email instituicao')
            .populate('licenca', 'tipo chaveLicenca')
            .sort('-criadoEm')
            .limit(parseInt(limite))
            .skip((parseInt(pagina) - 1) * parseInt(limite));

        const total = await Pagamento.countDocuments(query);

        // Totalizadores
        const totalizadores = await Pagamento.aggregate([
            { $match: query },
            { $group: {
                _id: '$status',
                count: { $sum: 1 },
                total: { $sum: '$valorFinal' }
            }}
        ]);

        res.json({
            success: true,
            pagamentos,
            totalizadores,
            paginacao: {
                total,
                pagina: parseInt(pagina),
                totalPaginas: Math.ceil(total / parseInt(limite))
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erro ao listar pagamentos',
            error: error.message
        });
    }
};

// @desc    Emitir nota fiscal
// @route   POST /api/admin/notas-fiscais
// @access  Private/Admin
exports.emitirNotaFiscal = async (req, res) => {
    try {
        const { pagamentoId, dadosPrestador, observacoes } = req.body;

        const pagamento = await Pagamento.findById(pagamentoId)
            .populate('usuario');

        if (!pagamento) {
            return res.status(404).json({
                success: false,
                message: 'Pagamento não encontrado'
            });
        }

        if (pagamento.status !== 'aprovado') {
            return res.status(400).json({
                success: false,
                message: 'Só é possível emitir nota fiscal para pagamentos aprovados'
            });
        }

        if (pagamento.notaFiscal) {
            return res.status(400).json({
                success: false,
                message: 'Nota fiscal já emitida para este pagamento'
            });
        }

        const numero = await NotaFiscal.gerarNumero();

        const notaFiscal = await NotaFiscal.create({
            numero,
            pagamento: pagamento._id,
            usuario: pagamento.usuario._id,
            prestador: dadosPrestador,
            tomador: {
                nome: pagamento.usuario.nome,
                cpfCnpj: '', // Adicionar ao cadastro do usuário
                endereco: '',
                cidade: '',
                estado: '',
                cep: '',
                email: pagamento.usuario.email,
                telefone: pagamento.usuario.telefone
            },
            descricaoServico: `Licença ${pagamento.tipoProduto} - Software Gerador de Certificados`,
            valorServico: pagamento.valorFinal,
            valorLiquido: pagamento.valorFinal,
            dataCompetencia: pagamento.dataPagamento,
            observacoes
        });

        // Atualizar pagamento com referência da nota
        pagamento.notaFiscal = notaFiscal._id;
        await pagamento.save();

        res.status(201).json({
            success: true,
            message: 'Nota fiscal emitida com sucesso',
            notaFiscal
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erro ao emitir nota fiscal',
            error: error.message
        });
    }
};

// @desc    Listar notas fiscais
// @route   GET /api/admin/notas-fiscais
// @access  Private/Admin
exports.listarNotasFiscais = async (req, res) => {
    try {
        const { status, dataInicio, dataFim, pagina = 1, limite = 20 } = req.query;

        let query = {};

        if (status) query.status = status;
        
        if (dataInicio || dataFim) {
            query.dataEmissao = {};
            if (dataInicio) query.dataEmissao.$gte = new Date(dataInicio);
            if (dataFim) query.dataEmissao.$lte = new Date(dataFim);
        }

        const notasFiscais = await NotaFiscal.find(query)
            .populate('usuario', 'nome email')
            .populate('pagamento')
            .sort('-dataEmissao')
            .limit(parseInt(limite))
            .skip((parseInt(pagina) - 1) * parseInt(limite));

        const total = await NotaFiscal.countDocuments(query);

        res.json({
            success: true,
            notasFiscais,
            paginacao: {
                total,
                pagina: parseInt(pagina),
                totalPaginas: Math.ceil(total / parseInt(limite))
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erro ao listar notas fiscais',
            error: error.message
        });
    }
};

// @desc    Relatório financeiro
// @route   GET /api/admin/relatorio-financeiro
// @access  Private/Admin
exports.relatorioFinanceiro = async (req, res) => {
    try {
        const { dataInicio, dataFim } = req.query;
        
        const hoje = new Date();
        const inicio = dataInicio ? new Date(dataInicio) : new Date(hoje.getFullYear(), 0, 1);
        const fim = dataFim ? new Date(dataFim) : hoje;

        // Receitas por mês
        const receitasPorMes = await Pagamento.aggregate([
            {
                $match: {
                    status: 'aprovado',
                    dataPagamento: { $gte: inicio, $lte: fim }
                }
            },
            {
                $group: {
                    _id: {
                        ano: { $year: '$dataPagamento' },
                        mes: { $month: '$dataPagamento' }
                    },
                    total: { $sum: '$valorFinal' },
                    quantidade: { $sum: 1 }
                }
            },
            { $sort: { '_id.ano': 1, '_id.mes': 1 } }
        ]);

        // Receitas por tipo de produto
        const receitasPorProduto = await Pagamento.aggregate([
            {
                $match: {
                    status: 'aprovado',
                    dataPagamento: { $gte: inicio, $lte: fim }
                }
            },
            {
                $group: {
                    _id: '$tipoProduto',
                    total: { $sum: '$valorFinal' },
                    quantidade: { $sum: 1 }
                }
            }
        ]);

        // Receitas por método de pagamento
        const receitasPorMetodo = await Pagamento.aggregate([
            {
                $match: {
                    status: 'aprovado',
                    dataPagamento: { $gte: inicio, $lte: fim }
                }
            },
            {
                $group: {
                    _id: '$metodoPagamento',
                    total: { $sum: '$valorFinal' },
                    quantidade: { $sum: 1 }
                }
            }
        ]);

        res.json({
            success: true,
            relatorio: {
                periodo: { inicio, fim },
                receitasPorMes,
                receitasPorProduto,
                receitasPorMetodo
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erro ao gerar relatório financeiro',
            error: error.message
        });
    }
};

// @desc    Aprovar pagamento
// @route   PATCH /api/admin/pagamentos/:id/aprovar
// @access  Private/Admin
exports.aprovarPagamento = async (req, res) => {
    try {
        const pagamento = await Pagamento.findById(req.params.id);

        if (!pagamento) {
            return res.status(404).json({
                success: false,
                message: 'Pagamento não encontrado'
            });
        }

        if (pagamento.status !== 'pendente' && pagamento.status !== 'processando') {
            return res.status(400).json({
                success: false,
                message: 'Pagamento já foi processado'
            });
        }

        // Atualizar status do pagamento
        pagamento.status = 'aprovado';
        pagamento.dataAprovacao = new Date();
        await pagamento.save();

        // Criar ou renovar licença
        let licenca = await Licenca.findOne({ usuario: pagamento.usuario });

        if (licenca) {
            // Renovar licença existente
            const dataExpiracao = new Date();
            
            if (pagamento.tipoLicenca === 'mensal') {
                dataExpiracao.setDate(dataExpiracao.getDate() + 30);
            } else if (pagamento.tipoLicenca === 'anual') {
                dataExpiracao.setFullYear(dataExpiracao.getFullYear() + 1);
            } else if (pagamento.tipoLicenca === 'vitalicia') {
                dataExpiracao.setFullYear(dataExpiracao.getFullYear() + 100);
            }

            licenca.tipo = pagamento.tipoLicenca;
            licenca.dataExpiracao = dataExpiracao;
            licenca.status = 'ativa';
            await licenca.save();
        } else {
            // Criar nova licença
            const dataExpiracao = new Date();
            
            if (pagamento.tipoLicenca === 'mensal') {
                dataExpiracao.setDate(dataExpiracao.getDate() + 30);
            } else if (pagamento.tipoLicenca === 'anual') {
                dataExpiracao.setFullYear(dataExpiracao.getFullYear() + 1);
            } else if (pagamento.tipoLicenca === 'vitalicia') {
                dataExpiracao.setFullYear(dataExpiracao.getFullYear() + 100);
            }

            licenca = await Licenca.create({
                usuario: pagamento.usuario,
                tipo: pagamento.tipoLicenca,
                dataInicio: new Date(),
                dataExpiracao: dataExpiracao,
                status: 'ativa'
            });
        }

        // Registrar log
        await Log.create({
            usuario: req.usuario._id,
            acao: 'aprovacao_pagamento',
            descricao: `Pagamento aprovado para ${pagamento.tipoLicenca}`,
            nivel: 'info'
        });

        res.json({
            success: true,
            message: 'Pagamento aprovado e licença atualizada',
            pagamento,
            licenca
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erro ao aprovar pagamento',
            error: error.message
        });
    }
};

// @desc    Recusar pagamento
// @route   PATCH /api/admin/pagamentos/:id/recusar
// @access  Private/Admin
exports.recusarPagamento = async (req, res) => {
    try {
        const { motivo } = req.body;
        const pagamento = await Pagamento.findById(req.params.id);

        if (!pagamento) {
            return res.status(404).json({
                success: false,
                message: 'Pagamento não encontrado'
            });
        }

        if (pagamento.status !== 'pendente' && pagamento.status !== 'processando') {
            return res.status(400).json({
                success: false,
                message: 'Pagamento já foi processado'
            });
        }

        pagamento.status = 'recusado';
        pagamento.motivoRecusa = motivo;
        await pagamento.save();

        // Registrar log
        await Log.create({
            usuario: req.usuario._id,
            acao: 'recusa_pagamento',
            descricao: `Pagamento recusado: ${motivo}`,
            nivel: 'warning'
        });

        res.json({
            success: true,
            message: 'Pagamento recusado',
            pagamento
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erro ao recusar pagamento',
            error: error.message
        });
    }
};

// @desc    Detalhes de nota fiscal
// @route   GET /api/admin/notas-fiscais/:id
// @access  Private/Admin
exports.detalhesNotaFiscal = async (req, res) => {
    try {
        const nota = await NotaFiscal.findById(req.params.id)
            .populate('pagamento')
            .populate('usuario');

        if (!nota) {
            return res.status(404).json({
                success: false,
                message: 'Nota fiscal não encontrada'
            });
        }

        res.json(nota);
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erro ao buscar nota fiscal',
            error: error.message
        });
    }
};

// @desc    Cancelar nota fiscal
// @route   PATCH /api/admin/notas-fiscais/:id/cancelar
// @access  Private/Admin
exports.cancelarNotaFiscal = async (req, res) => {
    try {
        const { motivo } = req.body;
        const nota = await NotaFiscal.findById(req.params.id);

        if (!nota) {
            return res.status(404).json({
                success: false,
                message: 'Nota fiscal não encontrada'
            });
        }

        if (nota.cancelada) {
            return res.status(400).json({
                success: false,
                message: 'Nota fiscal já está cancelada'
            });
        }

        await nota.cancelar(motivo);

        // Registrar log
        await Log.create({
            usuario: req.usuario._id,
            acao: 'cancelamento_nota_fiscal',
            descricao: `Nota fiscal ${nota.numero} cancelada: ${motivo}`,
            nivel: 'warning'
        });

        res.json({
            success: true,
            message: 'Nota fiscal cancelada',
            nota
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erro ao cancelar nota fiscal',
            error: error.message
        });
    }
};

// @desc    Listar logs de auditoria
// @route   GET /api/admin/logs
// @access  Private/Admin
exports.listarLogs = async (req, res) => {
    try {
        const { limite = 50, pagina = 1, usuario, acao, nivel } = req.query;

        const filtros = {};
        if (usuario) filtros.usuario = usuario;
        if (acao) filtros.acao = acao;
        if (nivel) filtros.nivel = nivel;

        const logs = await Log.find(filtros)
            .populate('usuario', 'nome email')
            .sort({ createdAt: -1 })
            .limit(Number(limite))
            .skip((Number(pagina) - 1) * Number(limite));

        const total = await Log.countDocuments(filtros);

        res.json({
            success: true,
            logs,
            total,
            pagina: Number(pagina),
            totalPaginas: Math.ceil(total / Number(limite))
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erro ao listar logs',
            error: error.message
        });
    }
};

module.exports = exports;

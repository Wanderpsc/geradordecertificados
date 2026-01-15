const Licenca = require('../models/Licenca');
const Usuario = require('../models/Usuario');

// @desc    Criar nova licença
// @route   POST /api/licenses
// @access  Private/Admin
exports.criarLicenca = async (req, res) => {
    try {
        const { 
            usuarioId, 
            tipo, 
            limiteCertificados, 
            diasValidade,
            recursos,
            valorPago,
            metodoPagamento,
            observacoes
        } = req.body;

        // Calcular data de expiração
        const dataExpiracao = new Date();
        if (tipo === 'trial') {
            dataExpiracao.setDate(dataExpiracao.getDate() + 7);
        } else if (tipo === 'mensal') {
            dataExpiracao.setMonth(dataExpiracao.getMonth() + 1);
        } else if (tipo === 'anual') {
            dataExpiracao.setFullYear(dataExpiracao.getFullYear() + 1);
        } else if (tipo === 'vitalicia') {
            dataExpiracao.setFullYear(dataExpiracao.getFullYear() + 100);
        } else if (diasValidade) {
            dataExpiracao.setDate(dataExpiracao.getDate() + diasValidade);
        }

        const licenca = await Licenca.create({
            chaveLicenca: Licenca.gerarChaveLicenca(),
            usuario: usuarioId,
            tipo,
            limiteCertificados: limiteCertificados || -1,
            dataExpiracao,
            recursos: recursos || {},
            valorPago: valorPago || 0,
            metodoPagamento: metodoPagamento || 'cortesia',
            observacoes
        });

        // Associar licença ao usuário
        if (usuarioId) {
            await Usuario.findByIdAndUpdate(usuarioId, { licenca: licenca._id });
        }

        res.status(201).json({
            success: true,
            message: 'Licença criada com sucesso!',
            licenca
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erro ao criar licença.',
            error: error.message
        });
    }
};

// @desc    Ativar licença com chave
// @route   POST /api/licenses/activate
// @access  Private
exports.ativarLicenca = async (req, res) => {
    try {
        const { chaveLicenca } = req.body;

        const licenca = await Licenca.findOne({ chaveLicenca });

        if (!licenca) {
            return res.status(404).json({
                success: false,
                message: 'Chave de licença inválida.'
            });
        }

        if (licenca.usuario && licenca.usuario.toString() !== req.usuario._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Esta licença já está vinculada a outro usuário.'
            });
        }

        // Associar licença ao usuário
        licenca.usuario = req.usuario._id;
        await licenca.save();

        req.usuario.licenca = licenca._id;
        await req.usuario.save();

        res.json({
            success: true,
            message: 'Licença ativada com sucesso!',
            licenca: {
                tipo: licenca.tipo,
                status: licenca.status,
                dataExpiracao: licenca.dataExpiracao,
                recursos: licenca.recursos
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erro ao ativar licença.',
            error: error.message
        });
    }
};

// @desc    Verificar status da licença
// @route   GET /api/licenses/status
// @access  Private
exports.verificarStatus = async (req, res) => {
    try {
        if (!req.usuario.licenca) {
            return res.json({
                success: true,
                temLicenca: false,
                message: 'Nenhuma licença ativa.'
            });
        }

        const licenca = await Licenca.findById(req.usuario.licenca);

        const valida = licenca.estaValida();

        res.json({
            success: true,
            temLicenca: true,
            valida,
            licenca: {
                chaveLicenca: licenca.chaveLicenca,
                tipo: licenca.tipo,
                status: licenca.status,
                dataInicio: licenca.dataInicio,
                dataExpiracao: licenca.dataExpiracao,
                certificadosGerados: licenca.certificadosGerados,
                certificadosRestantes: licenca.limiteCertificados === -1 
                    ? 'Ilimitado' 
                    : licenca.limiteCertificados - licenca.certificadosGerados,
                recursos: licenca.recursos
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erro ao verificar licença.',
            error: error.message
        });
    }
};

// @desc    Listar todas as licenças (Admin)
// @route   GET /api/licenses
// @access  Private/Admin
exports.listarLicencas = async (req, res) => {
    try {
        const licencas = await Licenca.find().populate('usuario', 'nome email instituicao');

        res.json({
            success: true,
            quantidade: licencas.length,
            licencas
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erro ao listar licenças.',
            error: error.message
        });
    }
};

// @desc    Renovar/Upgrade de licença
// @route   PUT /api/licenses/:id/renew
// @access  Private/Admin
exports.renovarLicenca = async (req, res) => {
    try {
        const { tipo, diasValidade, recursos, valorPago, metodoPagamento } = req.body;

        const licenca = await Licenca.findById(req.params.id);

        if (!licenca) {
            return res.status(404).json({
                success: false,
                message: 'Licença não encontrada.'
            });
        }

        // Atualizar tipo e recursos
        if (tipo) licenca.tipo = tipo;
        if (recursos) licenca.recursos = { ...licenca.recursos, ...recursos };
        if (valorPago) licenca.valorPago = valorPago;
        if (metodoPagamento) licenca.metodoPagamento = metodoPagamento;

        // Renovar data de expiração
        const novaDataExpiracao = new Date(licenca.dataExpiracao);
        if (diasValidade) {
            novaDataExpiracao.setDate(novaDataExpiracao.getDate() + diasValidade);
        } else if (tipo === 'mensal') {
            novaDataExpiracao.setMonth(novaDataExpiracao.getMonth() + 1);
        } else if (tipo === 'anual') {
            novaDataExpiracao.setFullYear(novaDataExpiracao.getFullYear() + 1);
        }

        licenca.dataExpiracao = novaDataExpiracao;
        licenca.status = 'ativa';

        await licenca.save();

        res.json({
            success: true,
            message: 'Licença renovada com sucesso!',
            licenca
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erro ao renovar licença.',
            error: error.message
        });
    }
};

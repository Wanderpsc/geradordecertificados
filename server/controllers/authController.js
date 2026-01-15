const Usuario = require('../models/Usuario');
const Licenca = require('../models/Licenca');
const jwt = require('jsonwebtoken');
const { logLogin, logRegistro } = require('../middlewares/logger');

// Gerar JWT Token
const gerarToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d'
    });
};

// @desc    Registrar novo usuário
// @route   POST /api/auth/register
// @access  Public
exports.registrar = async (req, res) => {
    try {
        const { nome, email, senha, instituicao, telefone, aceitouTermos } = req.body;

        // Verificar aceite dos termos
        if (!aceitouTermos) {
            return res.status(400).json({
                success: false,
                message: 'Você deve aceitar os Termos de Uso e Licença para continuar.'
            });
        }

        // Verificar se usuário já existe
        const usuarioExistente = await Usuario.findOne({ email });
        if (usuarioExistente) {
            return res.status(400).json({
                success: false,
                message: 'Email já cadastrado.'
            });
        }

        // Criar usuário
        const usuario = await Usuario.create({
            nome,
            email,
            senha,
            instituicao,
            telefone,
            aceitouTermos: true,
            dataAceiteTermos: new Date()
        });

        // Criar licença trial de 7 dias
        const dataExpiracao = new Date();
        dataExpiracao.setDate(dataExpiracao.getDate() + 7);

        const licenca = await Licenca.create({
            chaveLicenca: Licenca.gerarChaveLicenca(),
            usuario: usuario._id,
            tipo: 'trial',
            dataExpiracao,
            limiteCertificados: 10, // Limite de 10 certificados no trial
            recursos: {
                multiplosTemplates: false,
                templatesCustomizados: false,
                exportacaoPDF: true,
                historicosEscolares: false,
                marcaDagua: true
            }
        });

        // Associar licença ao usuário
        usuario.licenca = licenca._id;
        await usuario.save();

        // Log de registro
        await logRegistro(req, usuario);

        const token = gerarToken(usuario._id);

        res.status(201).json({
            success: true,
            message: 'Usuário registrado com sucesso!',
            token,
            usuario: {
                id: usuario._id,
                nome: usuario.nome,
                email: usuario.email,
                instituicao: usuario.instituicao
            },
            licenca: {
                tipo: licenca.tipo,
                dataExpiracao: licenca.dataExpiracao,
                chaveLicenca: licenca.chaveLicenca
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erro ao registrar usuário.',
            error: error.message
        });
    }
};

// @desc    Login de usuário
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
    try {
        const { email, senha } = req.body;

        // Validar
        if (!email || !senha) {
            return res.status(400).json({
                success: false,
                message: 'Por favor, informe email e senha.'
            });
        }

        // Buscar usuário (incluindo senha)
        const usuario = await Usuario.findOne({ email }).select('+senha').populate('licenca');

        if (!usuario) {
            // Log de tentativa falhada
            await logLogin(req, { email }, false);
            return res.status(401).json({
                success: false,
                message: 'Credenciais inválidas.'
            });
        }

        // Verificar senha
        const senhaCorreta = await usuario.compararSenha(senha);
        if (!senhaCorreta) {
            // Log de tentativa falhada
            await logLogin(req, usuario, false);
            return res.status(401).json({
                success: false,
                message: 'Credenciais inválidas.'
            });
        }

        // Verificar se usuário está ativo
        if (!usuario.ativo) {
            await logLogin(req, usuario, false);
            return res.status(403).json({
                success: false,
                message: 'Conta desativada. Entre em contato com o suporte.'
            });
        }

        // Log de login bem-sucedido
        await logLogin(req, usuario, true);

        const token = gerarToken(usuario._id);

        res.json({
            success: true,
            token,
            usuario: {
                id: usuario._id,
                nome: usuario.nome,
                email: usuario.email,
                instituicao: usuario.instituicao,
                role: usuario.role
            },
            licenca: usuario.licenca ? {
                tipo: usuario.licenca.tipo,
                status: usuario.licenca.status,
                dataExpiracao: usuario.licenca.dataExpiracao,
                certificadosRestantes: usuario.licenca.limiteCertificados === -1 
                    ? 'Ilimitado' 
                    : usuario.licenca.limiteCertificados - usuario.licenca.certificadosGerados
            } : null
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erro ao fazer login.',
            error: error.message
        });
    }
};

// @desc    Obter usuário atual
// @route   GET /api/auth/me
// @access  Private
exports.obterUsuarioAtual = async (req, res) => {
    try {
        const usuario = await Usuario.findById(req.usuario.id).populate('licenca');

        res.json({
            success: true,
            usuario
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erro ao buscar usuário.',
            error: error.message
        });
    }
};

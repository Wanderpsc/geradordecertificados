const Usuario = require('../models/Usuario');
const SubUsuario = require('../models/SubUsuario');
const Licenca = require('../models/Licenca');
const jwt = require('jsonwebtoken');
const { logLogin, logRegistro } = require('../middlewares/logger');

// Gerar JWT Token
const gerarToken = (id, tipo = 'usuario') => {
    return jwt.sign({ id, tipo }, process.env.JWT_SECRET, {
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

        // Determinar tipo de licença baseado na escolha do usuário
        const { planoEscolhido = 'trial' } = req.body;
        let tipoLicenca = planoEscolhido;
        let dataExpiracao = new Date();
        let limiteCertificados = null;
        
        // Configurar licença de acordo com o plano
        if (tipoLicenca === 'trial') {
            dataExpiracao.setDate(dataExpiracao.getDate() + 7); // 7 dias
            limiteCertificados = 10;
        } else if (tipoLicenca === 'mensal') {
            dataExpiracao.setMonth(dataExpiracao.getMonth() + 1); // 1 mês
            limiteCertificados = null; // Ilimitado
        } else if (tipoLicenca === 'pay-per-certificate') {
            dataExpiracao.setFullYear(dataExpiracao.getFullYear() + 100); // "Sem expiração"
            limiteCertificados = 0; // Paga por certificado
        }

        const licenca = await Licenca.create({
            chaveLicenca: Licenca.gerarChaveLicenca(),
            usuario: usuario._id,
            tipo: tipoLicenca,
            dataExpiracao,
            limiteCertificados,
            recursos: {
                multiplosTemplates: tipoLicenca !== 'trial',
                templatesCustomizados: tipoLicenca !== 'trial',
                exportacaoPDF: true,
                historicosEscolares: tipoLicenca !== 'trial',
                marcaDagua: tipoLicenca === 'trial'
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

// @desc    Login de usuário (principal ou sub-usuário)
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

        // 1) Buscar primeiro na coleção de usuários principais
        const usuario = await Usuario.findOne({ email }).select('+senha').populate('licenca');

        if (usuario) {
            // Verificar senha
            const senhaCorreta = await usuario.compararSenha(senha);
            if (!senhaCorreta) {
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

            const token = gerarToken(usuario._id, 'usuario');

            return res.json({
                success: true,
                token,
                usuario: {
                    id: usuario._id,
                    nome: usuario.nome,
                    email: usuario.email,
                    instituicao: usuario.instituicao,
                    role: usuario.role,
                    tipo: 'usuario'
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
        }

        // 2) Se não encontrou em Usuario, buscar em SubUsuario
        const subUsuario = await SubUsuario.findOne({ email }).select('+senha');

        if (!subUsuario) {
            await logLogin(req, { email }, false);
            return res.status(401).json({
                success: false,
                message: 'Credenciais inválidas.'
            });
        }

        // Verificar senha do sub-usuário
        const senhaSubCorreta = await subUsuario.compararSenha(senha);
        if (!senhaSubCorreta) {
            await logLogin(req, { email: subUsuario.email, nome: subUsuario.nome }, false);
            return res.status(401).json({
                success: false,
                message: 'Credenciais inválidas.'
            });
        }

        // Verificar se sub-usuário está ativo
        if (!subUsuario.ativo) {
            await logLogin(req, { email: subUsuario.email, nome: subUsuario.nome }, false);
            return res.status(403).json({
                success: false,
                message: 'Conta desativada. Entre em contato com o administrador da sua escola.'
            });
        }

        // Buscar o dono (escola) para obter a licença
        const dono = await Usuario.findById(subUsuario.escola).populate('licenca');

        // Atualizar último acesso
        subUsuario.ultimoAcesso = new Date();
        await subUsuario.save();

        await logLogin(req, { email: subUsuario.email, nome: subUsuario.nome, _id: subUsuario._id }, true);

        const token = gerarToken(subUsuario._id, 'subUsuario');

        return res.json({
            success: true,
            token,
            usuario: {
                id: subUsuario._id,
                nome: subUsuario.nome,
                email: subUsuario.email,
                instituicao: dono ? dono.instituicao : '',
                role: 'user',
                tipo: 'subUsuario',
                escola: subUsuario.escola,
                permissoes: subUsuario.permissoes,
                cargo: subUsuario.cargo
            },
            licenca: dono && dono.licenca ? {
                tipo: dono.licenca.tipo,
                status: dono.licenca.status,
                dataExpiracao: dono.licenca.dataExpiracao,
                certificadosRestantes: dono.licenca.limiteCertificados === -1 
                    ? 'Ilimitado' 
                    : dono.licenca.limiteCertificados - dono.licenca.certificadosGerados
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
        // Se for sub-usuário, retornar dados do sub com a licença do dono
        if (req.isSubUsuario && req.subUsuario) {
            const dono = req.usuario; // já populado no middleware
            return res.json({
                success: true,
                usuario: {
                    id: req.subUsuario._id,
                    nome: req.subUsuario.nome,
                    email: req.subUsuario.email,
                    instituicao: dono.instituicao,
                    role: 'user',
                    tipo: 'subUsuario',
                    escola: req.subUsuario.escola,
                    permissoes: req.subUsuario.permissoes,
                    cargo: req.subUsuario.cargo,
                    licenca: dono.licenca
                }
            });
        }

        const usuario = await Usuario.findById(req.usuario.id).populate('licenca');

        res.json({
            success: true,
            usuario: {
                ...usuario.toObject(),
                tipo: 'usuario'
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erro ao buscar usuário.',
            error: error.message
        });
    }
};

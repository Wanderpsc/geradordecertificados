const jwt = require('jsonwebtoken');
const Usuario = require('../models/Usuario');
const SubUsuario = require('../models/SubUsuario');

exports.proteger = async (req, res, next) => {
    try {
        let token;

        // Verificar se o token existe no header
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Não autorizado. Token não fornecido.'
            });
        }

        // Verificar token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Se for sub-usuário, buscar na coleção SubUsuario
        if (decoded.tipo === 'subUsuario') {
            const subUsuario = await SubUsuario.findById(decoded.id);
            if (!subUsuario) {
                return res.status(401).json({
                    success: false,
                    message: 'Usuário não encontrado.'
                });
            }
            if (!subUsuario.ativo) {
                return res.status(403).json({
                    success: false,
                    message: 'Conta desativada. Entre em contato com o administrador da sua escola.'
                });
            }
            // Buscar o dono para obter a licença
            const dono = await Usuario.findById(subUsuario.escola).populate('licenca');
            if (!dono || !dono.ativo) {
                return res.status(403).json({
                    success: false,
                    message: 'A conta da escola está desativada.'
                });
            }
            // Montar req.usuario com dados do dono + info do sub
            req.usuario = dono;
            req.subUsuario = subUsuario;
            req.isSubUsuario = true;
            return next();
        }

        // Buscar usuário principal
        req.usuario = await Usuario.findById(decoded.id).populate('licenca');

        if (!req.usuario) {
            return res.status(401).json({
                success: false,
                message: 'Usuário não encontrado.'
            });
        }

        // Verificar se usuário está ativo
        if (!req.usuario.ativo) {
            return res.status(403).json({
                success: false,
                message: 'Conta desativada. Entre em contato com o suporte.'
            });
        }

        req.isSubUsuario = false;
        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: 'Token inválido ou expirado.'
        });
    }
};

// Verificar se tem licença válida
exports.verificarLicenca = async (req, res, next) => {
    try {
        if (!req.usuario.licenca) {
            return res.status(403).json({
                success: false,
                message: 'Nenhuma licença ativa. Adquira uma licença para continuar.'
            });
        }

        const Licenca = require('../models/Licenca');
        const licenca = await Licenca.findById(req.usuario.licenca);

        if (!licenca || !licenca.estaValida()) {
            return res.status(403).json({
                success: false,
                message: 'Licença inválida ou expirada. Renove sua licença.'
            });
        }

        req.licenca = licenca;
        next();
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Erro ao verificar licença.'
        });
    }
};

// Middleware para verificar se é admin
exports.apenasAdmin = (req, res, next) => {
    if (req.usuario.role !== 'admin') {
        return res.status(403).json({
            success: false,
            message: 'Acesso negado. Apenas administradores.'
        });
    }
    next();
};

// Middleware para verificar se é cliente (não admin)
// Administradores NÃO podem acessar o gerador de certificados
exports.apenasCliente = (req, res, next) => {
    if (req.usuario.role === 'admin') {
        return res.status(403).json({
            success: false,
            message: 'Administradores não têm acesso ao gerador de certificados. Use o painel administrativo.'
        });
    }
    next();
};

// Bloquear sub-usuários de gerenciar outros sub-usuários
exports.apenasDonoEscola = (req, res, next) => {
    if (req.isSubUsuario) {
        return res.status(403).json({
            success: false,
            message: 'Acesso negado. Somente o titular da conta pode gerenciar usuários.'
        });
    }
    next();
};

// Fábrica de middleware de permissão granular para sub-usuários
// Ex: checarPermissao('cadastrarAlunos')
exports.checarPermissao = (campo) => (req, res, next) => {
    if (!req.isSubUsuario) return next(); // dono da escola passa sempre
    const perm = req.subUsuario?.permissoes?.[campo];
    if (!perm) {
        return res.status(403).json({
            success: false,
            message: `Ação não permitida. Seu perfil não tem permissão para "${campo}".`
        });
    }
    next();
};

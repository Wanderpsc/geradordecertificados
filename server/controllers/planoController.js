const PlanoVenda = require('../models/PlanoVenda');
const Licenca = require('../models/Licenca');
const Usuario = require('../models/Usuario');
const Modelo = require('../models/Modelo');
const { enviarConfirmacaoPagamento, enviarNotificacaoVenda } = require('../services/emailService');

// ─────────────────────────── ADMIN: CRUD DE PLANOS ────────────────────────────

// @desc  Listar todos os planos (admin vê inativos também)
// @route GET /api/planos/admin
// @access Admin
exports.listarPlanosAdmin = async (req, res) => {
    try {
        const planos = await PlanoVenda.find().sort('ordem nome');
        res.json({ success: true, planos });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Erro ao listar planos.', error: err.message });
    }
};

// @desc  Criar plano
// @route POST /api/planos/admin
// @access Admin
exports.criarPlano = async (req, res) => {
    try {
        const plano = await PlanoVenda.create(req.body);
        res.status(201).json({ success: true, message: 'Plano criado com sucesso!', plano });
    } catch (err) {
        res.status(400).json({ success: false, message: 'Erro ao criar plano.', error: err.message });
    }
};

// @desc  Atualizar plano
// @route PUT /api/planos/admin/:id
// @access Admin
exports.atualizarPlano = async (req, res) => {
    try {
        const plano = await PlanoVenda.findByIdAndUpdate(req.params.id, req.body, {
            new: true, runValidators: true
        });
        if (!plano) return res.status(404).json({ success: false, message: 'Plano não encontrado.' });
        res.json({ success: true, message: 'Plano atualizado!', plano });
    } catch (err) {
        res.status(400).json({ success: false, message: 'Erro ao atualizar plano.', error: err.message });
    }
};

// @desc  Excluir plano
// @route DELETE /api/planos/admin/:id
// @access Admin
exports.excluirPlano = async (req, res) => {
    try {
        const plano = await PlanoVenda.findByIdAndDelete(req.params.id);
        if (!plano) return res.status(404).json({ success: false, message: 'Plano não encontrado.' });
        res.json({ success: true, message: 'Plano excluído.' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Erro ao excluir plano.', error: err.message });
    }
};

// @desc  Adicionar template padrão a um plano
// @route POST /api/planos/admin/:id/templates
// @access Admin
exports.adicionarTemplate = async (req, res) => {
    try {
        const { tipoTemplate, nome, descricao, config, uploads, previewBase64 } = req.body;
        const plano = await PlanoVenda.findById(req.params.id);
        if (!plano) return res.status(404).json({ success: false, message: 'Plano não encontrado.' });

        const novoTemplate = { nome, descricao, tipo: tipoTemplate, config, uploads: uploads || {}, previewBase64: previewBase64 || '' };

        if (tipoTemplate === 'historico') {
            plano.templatesHistorico.push(novoTemplate);
        } else {
            plano.templatesCertificado.push(novoTemplate);
        }
        await plano.save();
        res.json({ success: true, message: 'Template adicionado ao plano!', plano });
    } catch (err) {
        res.status(400).json({ success: false, message: 'Erro ao adicionar template.', error: err.message });
    }
};

// @desc  Remover template de um plano
// @route DELETE /api/planos/admin/:id/templates/:templateId
// @access Admin
exports.removerTemplate = async (req, res) => {
    try {
        const plano = await PlanoVenda.findById(req.params.id);
        if (!plano) return res.status(404).json({ success: false, message: 'Plano não encontrado.' });

        plano.templatesCertificado = plano.templatesCertificado.filter(t => t._id.toString() !== req.params.templateId);
        plano.templatesHistorico = plano.templatesHistorico.filter(t => t._id.toString() !== req.params.templateId);
        await plano.save();
        res.json({ success: true, message: 'Template removido.', plano });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Erro ao remover template.', error: err.message });
    }
};

// ─────────────────── PÚBLICO: LISTAR PLANOS DISPONÍVEIS ──────────────────────

// @desc  Listar planos ativos para a vitrine pública
// @route GET /api/planos
// @access Public
exports.listarPlanosPublico = async (req, res) => {
    try {
        const planos = await PlanoVenda.find({ ativo: true })
            .select('-templatesCertificado.config -templatesHistorico.config -templatesCertificado.uploads -templatesHistorico.uploads')
            .sort('ordem preco');
        res.json({ success: true, planos });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Erro ao carregar planos.', error: err.message });
    }
};

// @desc  Obter detalhe de um plano (sem configs sensíveis)
// @route GET /api/planos/:id
// @access Public
exports.obterPlano = async (req, res) => {
    try {
        const plano = await PlanoVenda.findOne({ _id: req.params.id, ativo: true })
            .select('-templatesCertificado.config -templatesHistorico.config');
        if (!plano) return res.status(404).json({ success: false, message: 'Plano não encontrado.' });
        res.json({ success: true, plano });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Erro ao obter plano.', error: err.message });
    }
};

// ─────────────────── PROVISIONAR LICENÇA APÓS PAGAMENTO ──────────────────────

// Chamado internamente após confirmação de pagamento
exports.provisionarLicencaParaPlano = async (planoId, usuarioId, metodo = 'desconhecido') => {
    const plano = await PlanoVenda.findById(planoId);
    if (!plano) throw new Error('Plano não encontrado para provisionamento.');
    const usuario = await Usuario.findById(usuarioId).populate('licenca');
    if (!usuario) throw new Error('Usuário não encontrado.');

    let licenca;
    let dataExpiracao;

    // ─── PACOTE DE CRÉDITOS: soma ao limite existente ────────────────────────
    if (plano.tipo === 'creditos') {
        const licencaAtual = usuario.licenca;

        if (licencaAtual && licencaAtual.status === 'ativa') {
            // Somar créditos na licença ativa existente
            const qty = plano.quantidadeCreditos || 0;
            const sub = plano.subtipoCredito || 'certificados';

            const update = {};
            if (sub === 'certificados' || sub === 'ambos') {
                // -1 = ilimitado; não somar sobre ilimitado
                if (licencaAtual.limiteCertificados !== -1) {
                    update.limiteCertificados = licencaAtual.limiteCertificados + qty;
                }
            }
            if (sub === 'historicos' || sub === 'ambos') {
                if (licencaAtual.limiteHistoricos !== -1) {
                    update.limiteHistoricos = (licencaAtual.limiteHistoricos || 0) + qty;
                }
                // Se não tinha histórico habilitado, habilitar
                if (!licencaAtual.recursos?.historicosEscolares) {
                    update['recursos.historicosEscolares'] = true;
                }
            }

            licenca = await Licenca.findByIdAndUpdate(licencaAtual._id, { $set: update }, { new: true });
        } else {
            // Sem licença ativa — criar uma nova licença de créditos com validade de 1 ano
            dataExpiracao = new Date();
            dataExpiracao.setFullYear(dataExpiracao.getFullYear() + 1);
            const qty = plano.quantidadeCreditos || 0;
            licenca = await Licenca.create({
                chaveLicenca: Licenca.gerarChaveLicenca(),
                usuario: usuarioId,
                tipo: 'mensal',
                status: 'ativa',
                limiteCertificados: (plano.subtipoCredito === 'historicos') ? -1 : qty,
                limiteHistoricos: (plano.subtipoCredito === 'certificados') ? -1 : qty,
                dataExpiracao,
                recursos: {
                    multiplosTemplates: false,
                    templatesCustomizados: true,
                    exportacaoPDF: true,
                    historicosEscolares: plano.subtipoCredito !== 'certificados',
                    marcaDagua: false
                },
                valorPago: plano.preco,
                metodoPagamento: metodo
            });
            usuario.licenca = licenca._id;
            await usuario.save();
        }

    } else {
        // ─── UPGRADE / NOVO PLANO: substitui licença atual ───────────────────
        // Cancelar licença antiga se existir
        if (usuario.licenca) {
            await Licenca.findByIdAndUpdate(
                typeof usuario.licenca === 'object' ? usuario.licenca._id : usuario.licenca,
                { status: 'cancelada', observacoes: `Substituída por upgrade — plano: ${plano.nome}` }
            );
        }

        dataExpiracao = new Date();
        dataExpiracao.setDate(dataExpiracao.getDate() + plano.validadeDias);

        licenca = await Licenca.create({
            chaveLicenca: Licenca.gerarChaveLicenca(),
            usuario: usuarioId,
            tipo: plano.tipoLicenca,
            status: 'ativa',
            limiteCertificados: plano.recursos.limiteCertificados,
            limiteHistoricos: plano.recursos.historicos ? -1 : 0,
            dataExpiracao,
            recursos: {
                multiplosTemplates: plano.recursos.multiplosTemplates,
                templatesCustomizados: plano.recursos.templatesCustomizados,
                exportacaoPDF: plano.recursos.exportacaoPDF,
                historicosEscolares: plano.recursos.historicos,
                marcaDagua: plano.recursos.marcaDagua
            },
            valorPago: plano.preco,
            metodoPagamento: metodo
        });

        usuario.licenca = licenca._id;
        await usuario.save();

        // Copiar templates do plano para a conta do usuário
        const templatesParaCopiar = [
            ...plano.templatesCertificado.map(t => ({ ...t.toObject(), usuario: usuarioId, ativo: true })),
            ...plano.templatesHistorico.map(t => ({ ...t.toObject(), usuario: usuarioId, ativo: true }))
        ];
        if (templatesParaCopiar.length > 0) {
            await Modelo.insertMany(templatesParaCopiar.map(t => ({
                usuario: usuarioId,
                nome: t.nome,
                descricao: t.descricao || '',
                config: t.config,
                uploads: t.uploads || {},
                ativo: true
            })));
        }
    }

    // Enviar emails de confirmação (sem bloquear)
    setImmediate(async () => {
        try {
            await enviarConfirmacaoPagamento({
                nome: usuario.nome || usuario.email,
                email: usuario.email,
                plano: plano.nome,
                valor: plano.preco,
                metodo,
                expiracao: licenca.dataExpiracao
            });
            await enviarNotificacaoVenda({
                compradorNome: usuario.nome || usuario.email,
                compradorEmail: usuario.email,
                plano: plano.nome,
                valor: plano.preco,
                metodo
            });
        } catch (emailErr) {
            console.error('Erro ao enviar emails de venda:', emailErr.message);
        }
    });

    return licenca;
};

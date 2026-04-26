/**
 * HISTÓRICO ESCOLAR - Frontend
 * Gerenciamento de grades, notas e geração de históricos
 */

// ==================== ESTADO ====================
let HIST_UPLOADS = JSON.parse(localStorage.getItem('histUploads') || '{}');

const HIST_STATE = {
    grades: [],
    matrizes: [],
    gradeAtual: null,
    historicoAtual: null,
    historicosSelecionados: new Set(),
    alunosComHistorico: new Set() // IDs de alunos que já têm histórico salvo (para o tipo atual)
};

// ==================== INICIALIZAÇÃO ====================
// Inicialização é chamada por navegarParaTab('historico') em app.js

function inicializarHistorico() {
    carregarConfigHist();
    carregarListaMatrizes();
    carregarListaGrades();
    popularSelectAlunos();
    carregarListaHistoricos();
}

// ==================== CONFIGURAÇÕES DO HISTÓRICO ====================

const HIST_CONFIG_DEFAULTS = {
    cabecalho: {
        linha1: 'REPÚBLICA FEDERATIVA DO BRASIL',
        linha2: 'ESTADO DO PIAUÍ',
        linha3: 'SECRETARIA DE ESTADO DA EDUCAÇÃO',
        nomeInstituicao: '',
        endereco: '',
        cnpj: '',
        inep: ''
    },
    frente: {
        resolucao: '',
        assinatura1: 'SECRETÁRIO(A)',
        assinatura2: 'DIRETOR(A)'
    },
    emblema: {
        tipo: 'brasao-brasil',
        largura: 22,
        altura: 26,
        qualidade: 100
    }
};

function obterConfigHist() {
    // Lê dos inputs do editor; se não existirem, retorna o salvo no localStorage
    const saved = JSON.parse(localStorage.getItem('histConfig') || 'null');
    const el = id => document.getElementById(id);
    if (!el('histCfgLinha1')) return saved || HIST_CONFIG_DEFAULTS;
    return {
        cabecalho: {
            linha1: el('histCfgLinha1').value.trim() || HIST_CONFIG_DEFAULTS.cabecalho.linha1,
            linha2: el('histCfgLinha2').value.trim() || HIST_CONFIG_DEFAULTS.cabecalho.linha2,
            linha3: el('histCfgLinha3').value.trim() || HIST_CONFIG_DEFAULTS.cabecalho.linha3,
            nomeInstituicao: el('histCfgInstituicao').value.trim(),
            endereco: el('histCfgEndereco').value.trim(),
            cnpj: el('histCfgCNPJ').value.trim(),
            inep: el('histCfgINEP').value.trim()
        },
        frente: {
            resolucao: el('histCfgResolucao').value.trim(),
            assinatura1: el('histCfgAssinatura1').value.trim() || HIST_CONFIG_DEFAULTS.frente.assinatura1,
            assinatura2: el('histCfgAssinatura2').value.trim() || HIST_CONFIG_DEFAULTS.frente.assinatura2
        },
        emblema: {
            tipo: el('histCfgEmblema')?.value || 'brasao-brasil',
            largura: parseInt(el('histCfgEmblemaLargura')?.value) || 22,
            altura: parseInt(el('histCfgEmblemaAltura')?.value) || 26,
            qualidade: parseInt(el('histCfgEmblemaQualidade')?.value) || 100
        }
    };
}

function _aplicarConfigHistNosInputs(cfg) {
    const el = id => document.getElementById(id);
    if (!el('histCfgLinha1')) return;
    el('histCfgLinha1').value = cfg?.cabecalho?.linha1 || '';
    el('histCfgLinha2').value = cfg?.cabecalho?.linha2 || '';
    el('histCfgLinha3').value = cfg?.cabecalho?.linha3 || '';
    el('histCfgInstituicao').value = cfg?.cabecalho?.nomeInstituicao || '';
    el('histCfgEndereco').value = cfg?.cabecalho?.endereco || '';
    el('histCfgCNPJ').value = cfg?.cabecalho?.cnpj || '';
    el('histCfgINEP').value = cfg?.cabecalho?.inep || '';
    el('histCfgResolucao').value = cfg?.frente?.resolucao || '';
    el('histCfgAssinatura1').value = cfg?.frente?.assinatura1 || '';
    el('histCfgAssinatura2').value = cfg?.frente?.assinatura2 || '';
    // Emblema
    const emb = cfg?.emblema || HIST_CONFIG_DEFAULTS.emblema;
    if (el('histCfgEmblema')) el('histCfgEmblema').value = emb.tipo || 'brasao-brasil';
    if (el('histCfgEmblemaLargura')) el('histCfgEmblemaLargura').value = emb.largura || 22;
    if (el('histCfgEmblemaAltura')) el('histCfgEmblemaAltura').value = emb.altura || 26;
    if (el('histCfgEmblemaQualidade')) el('histCfgEmblemaQualidade').value = emb.qualidade || 100;
    const uploadGroup = el('histEmblemaUploadGroup');
    if (uploadGroup) uploadGroup.style.display = emb.tipo === 'custom' ? 'block' : 'none';
    // Restaurar preview do emblema customizado se existir
    if (emb.tipo === 'custom' && HIST_UPLOADS.emblemaCustom) {
        const prev = el('previewEmblemaHist');
        if (prev) prev.innerHTML = `<img src="${HIST_UPLOADS.emblemaCustom}" style="max-height: 60px; border-radius: 8px; margin-top: 6px;">`;
    }
}

function carregarConfigHist() {
    // Tentar carregar do localStorage; se vazio, pré-preencher com valores do certificado (se existirem)
    let cfg = JSON.parse(localStorage.getItem('histConfig') || 'null');
    if (!cfg) {
        // Importar valores do editor de certificados como ponto de partida
        const certCfg = JSON.parse(localStorage.getItem('certConfig') || 'null');
        cfg = {
            cabecalho: {
                linha1: certCfg?.cabecalho?.linha1 || HIST_CONFIG_DEFAULTS.cabecalho.linha1,
                linha2: certCfg?.cabecalho?.linha2 || HIST_CONFIG_DEFAULTS.cabecalho.linha2,
                linha3: certCfg?.cabecalho?.linha3 || HIST_CONFIG_DEFAULTS.cabecalho.linha3,
                nomeInstituicao: certCfg?.cabecalho?.nomeInstituicao || '',
                endereco: certCfg?.cabecalho?.endereco || '',
                cnpj: certCfg?.cnpj || certCfg?.cabecalho?.cnpj || '',
                inep: certCfg?.inep || certCfg?.cabecalho?.inep || ''
            },
            frente: {
                resolucao: certCfg?.frente?.resolucao || '',
                assinatura1: HIST_CONFIG_DEFAULTS.frente.assinatura1,
                assinatura2: HIST_CONFIG_DEFAULTS.frente.assinatura2
            }
        };
    }
    _aplicarConfigHistNosInputs(cfg);
}

function salvarConfigHist() {
    const cfg = obterConfigHist();
    localStorage.setItem('histConfig', JSON.stringify(cfg));
    mostrarNotificacao('Configurações do histórico salvas!', 'success');
}

function resetarConfigHist() {
    if (!confirm('Restaurar todos os campos para os valores padrão?')) return;
    localStorage.removeItem('histConfig');
    localStorage.removeItem('histUploads');
    HIST_UPLOADS = {};
    const prev = document.getElementById('previewEmblemaHist');
    if (prev) prev.innerHTML = '';
    _aplicarConfigHistNosInputs(HIST_CONFIG_DEFAULTS);
    mostrarNotificacao('Configurações restauradas para o padrão.', 'info');
}

function handleUploadEmblemaHist(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
        HIST_UPLOADS.emblemaCustom = e.target.result;
        localStorage.setItem('histUploads', JSON.stringify(HIST_UPLOADS));
        const prev = document.getElementById('previewEmblemaHist');
        if (prev) prev.innerHTML = `<img src="${e.target.result}" style="max-height: 60px; border-radius: 8px; margin-top: 6px;">`;
        const sel = document.getElementById('histCfgEmblema');
        if (sel) sel.value = 'custom';
        mostrarNotificacao('Emblema personalizado carregado!', 'success');
    };
    reader.readAsDataURL(file);
}

// ==================== MATRIZES CURRICULARES ====================

let _gradeSeriesMatrizes = []; // [{id, titulo}|null, ...] — por tab
let _gradeTabDiscs = [];       // [[{nome,categoria,ch},...], ...] — disciplinas por tab
let _gradeActiveTab = 0;       // tab ativa
let _gradeSeriesNomes = [];    // nomes das séries/anos

async function carregarListaMatrizes() {
    const token = localStorage.getItem('token');
    if (!token) return;
    const container = document.getElementById('listaMatrizes');
    if (!container) return;
    try {
        const resp = await fetch(`${API_URL}/historicos/matrizes`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await resp.json();
        HIST_STATE.matrizes = data.success ? data.matrizes : [];
        if (!HIST_STATE.matrizes.length) {
            container.innerHTML = '<div style="text-align:center;color:#9ca3af;padding:30px;grid-column:1/-1;">Nenhuma matriz cadastrada. Clique em "+ Nova Matriz" para começar.</div>';
            return;
        }
        container.innerHTML = HIST_STATE.matrizes.map(m => `
            <div style="background:white;border:2px solid #a5b4fc;border-radius:12px;padding:14px;">
                <h3 style="font-size:14px;font-weight:700;color:#1e3a8a;margin:0 0 6px 0;">${escapeHtml(m.titulo)}</h3>
                <div style="font-size:12px;color:#6b7280;margin-bottom:10px;">${m.disciplinas ? m.disciplinas.length : 0} disciplina(s)</div>
                <div style="display:flex;gap:4px;flex-wrap:wrap;">
                    <button class="btn btn-primary btn-sm" onclick="editarMatriz('${m._id}')" style="font-size:11px;padding:4px 10px;">✏️ Editar</button>
                    <button class="btn btn-danger btn-sm" onclick="excluirMatriz('${m._id}', '${escapeHtml(m.titulo)}')" style="font-size:11px;padding:4px 10px;">🗑️</button>
                </div>
            </div>
        `).join('');
    } catch (e) {
        if (container) container.innerHTML = '<div style="text-align:center;color:#ef4444;padding:20px;grid-column:1/-1;">Erro ao carregar matrizes.</div>';
    }
}

function abrirModalNovaMatriz() { abrirModalMatriz(null); }

function abrirModalMatriz(matrizExistente) {
    const isEdit = !!matrizExistente;
    const m = matrizExistente || { titulo: '', disciplinas: [] };

    const modal = document.createElement('div');
    modal.className = 'overlay-modal';
    modal.id = 'modalMatriz';
    modal.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.6);z-index:9999;display:flex;align-items:center;justify-content:center;overflow-y:auto;padding:20px;';

    modal.innerHTML = `
    <div style="background:white;border-radius:16px;padding:28px;max-width:780px;width:95%;max-height:90vh;overflow-y:auto;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">
            <h2 style="color:#1e3a8a;margin:0;">${isEdit ? '✏️ Editar' : '➕ Nova'} Matriz Curricular</h2>
            <button onclick="this.closest('.overlay-modal').remove()" style="background:none;border:none;font-size:24px;cursor:pointer;">✕</button>
        </div>
        <div style="margin-bottom:16px;">
            <label style="font-weight:600;font-size:13px;display:block;margin-bottom:4px;">Título da Matriz</label>
            <input type="text" id="matrizTitulo" class="form-control" value="${escapeHtml(m.titulo)}" placeholder="Ex: Ensino Médio – 1ª Série 2025">
        </div>
        <div style="border-top:2px solid #e5e7eb;padding-top:16px;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
                <h3 style="color:#1e3a8a;font-size:15px;margin:0;">Disciplinas e Cargas Horárias</h3>
                <button class="btn btn-primary btn-sm" onclick="adicionarDisciplinaMatriz()" style="font-size:12px;">+ Adicionar Disciplina</button>
            </div>
            <div style="overflow-x:auto;border:1px solid #e5e7eb;border-radius:8px;">
                <table style="width:100%;border-collapse:collapse;min-width:400px;">
                    <thead>
                        <tr style="background:#e2e8f0;">
                            <th style="padding:7px 10px;text-align:left;border:1px solid #cbd5e1;font-size:12px;font-weight:600;min-width:200px;">Disciplina</th>
                            <th style="padding:7px 8px;text-align:left;border:1px solid #cbd5e1;font-size:12px;font-weight:600;min-width:180px;">Categoria</th>
                            <th style="padding:7px 8px;text-align:center;border:1px solid #cbd5e1;font-size:12px;font-weight:600;width:100px;">CH (horas)</th>
                            <th style="padding:4px;border:1px solid #cbd5e1;width:38px;"></th>
                        </tr>
                    </thead>
                    <tbody id="matrizDisciplinasTbody"></tbody>
                </table>
            </div>
        </div>
        <div style="display:flex;gap:10px;justify-content:flex-end;margin-top:20px;border-top:2px solid #e5e7eb;padding-top:16px;">
            <button class="btn btn-secondary" onclick="this.closest('.overlay-modal').remove()">Cancelar</button>
            <button class="btn btn-primary" onclick="salvarMatriz('${isEdit ? m._id : ''}')">${isEdit ? '💾 Salvar Alterações' : '✅ Criar Matriz'}</button>
        </div>
    </div>`;

    document.body.appendChild(modal);
    modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });
    if (m.disciplinas && m.disciplinas.length) m.disciplinas.forEach(d => adicionarDisciplinaMatriz(d));
}

function _obterCategoriasMatriz() {
    return [
        ['formacao_geral', 'Formação Geral Básica'],
        ['itinerarios', 'Itinerários Formativos'],
        ['atividades_integradoras', 'Atividades Integradoras'],
        ['linguagens', 'Linguagens, Códigos e Suas Tecnologias'],
        ['ciencias_humanas', 'Ciências Humanas e Suas Tecnologias'],
        ['ciencias_natureza', 'Ciências da Natureza e Suas Tecnologias'],
        ['matematica', 'Matemática e Suas Tecnologias'],
        ['parte_flexivel', 'Parte Flexível (Diversificada)'],
        ['ensino_religioso', 'Ensino Religioso']
    ];
}

function adicionarDisciplinaMatriz(disc) {
    const tbody = document.getElementById('matrizDisciplinasTbody');
    if (!tbody) return;
    const cats = _obterCategoriasMatriz();
    const row = document.createElement('tr');
    row.className = 'matriz-disc-row';
    row.innerHTML = `
        <td style="padding:3px 6px;border:1px solid #e5e7eb;background:#f8fafc;">
            <input type="text" class="form-control mdisc-nome" value="${disc ? escapeHtml(disc.nome) : ''}" placeholder="Nome da Disciplina" style="font-size:12px;padding:5px 7px;min-width:185px;">
        </td>
        <td style="padding:3px 6px;border:1px solid #e5e7eb;">
            <select class="form-control mdisc-categoria" style="font-size:12px;padding:5px 7px;min-width:165px;">
                ${cats.map(c => `<option value="${c[0]}" ${disc && disc.categoria === c[0] ? 'selected' : ''}>${c[1]}</option>`).join('')}
            </select>
        </td>
        <td style="padding:3px 6px;border:1px solid #e5e7eb;text-align:center;">
            <input type="number" class="form-control mdisc-ch" min="0" value="${disc ? (disc.cargaHoraria !== undefined ? disc.cargaHoraria : (disc.cargaHorariaPadrao || '')) : ''}" placeholder="0" style="width:80px;font-size:12px;padding:4px 6px;text-align:center;">
        </td>
        <td style="padding:3px 4px;border:1px solid #e5e7eb;text-align:center;">
            <button onclick="this.closest('tr').remove()" style="background:#fee2e2;color:#991b1b;border:1px solid #fca5a5;padding:4px 8px;border-radius:6px;cursor:pointer;font-size:14px;" title="Remover">✕</button>
        </td>
    `;
    tbody.appendChild(row);
}

async function salvarMatriz(id) {
    const token = localStorage.getItem('token');
    if (!token) return;
    const titulo = document.getElementById('matrizTitulo')?.value.trim();
    if (!titulo) { mostrarNotificacao('Informe o título da matriz.', 'error'); return; }
    const rows = document.querySelectorAll('.matriz-disc-row');
    const disciplinas = [];
    rows.forEach(row => {
        const n = row.querySelector('.mdisc-nome').value.trim();
        if (!n) return;
        disciplinas.push({
            nome: n,
            categoria: row.querySelector('.mdisc-categoria').value,
            cargaHoraria: parseInt(row.querySelector('.mdisc-ch').value) || 0
        });
    });
    if (!disciplinas.length) { mostrarNotificacao('Adicione ao menos uma disciplina.', 'error'); return; }
    const url = id ? `${API_URL}/historicos/matrizes/${id}` : `${API_URL}/historicos/matrizes`;
    const method = id ? 'PUT' : 'POST';
    try {
        const resp = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ titulo, disciplinas })
        });
        const data = await resp.json();
        if (data.success) {
            document.getElementById('modalMatriz')?.remove();
            mostrarNotificacao(`Matriz "${titulo}" ${id ? 'atualizada' : 'criada'} com sucesso!`, 'success');
            carregarListaMatrizes();
        } else {
            mostrarNotificacao(data.message || 'Erro ao salvar matriz.', 'error');
        }
    } catch (e) { mostrarNotificacao('Erro de conexão.', 'error'); }
}

async function editarMatriz(id) {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
        const resp = await fetch(`${API_URL}/historicos/matrizes/${id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await resp.json();
        if (data.success) abrirModalMatriz(data.matriz);
    } catch (e) { mostrarNotificacao('Erro ao carregar matriz.', 'error'); }
}

async function excluirMatriz(id, titulo) {
    if (!confirm(`Excluir a matriz "${titulo}"? Esta ação não pode ser desfeita.`)) return;
    const token = localStorage.getItem('token');
    try {
        const resp = await fetch(`${API_URL}/historicos/matrizes/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await resp.json();
        if (data.success) {
            mostrarNotificacao('Matriz excluída!', 'success');
            carregarListaMatrizes();
        } else { mostrarNotificacao(data.message || 'Erro ao excluir.', 'error'); }
    } catch (e) { mostrarNotificacao('Erro de conexão.', 'error'); }
}

// ==================== GRADES (Templates de Disciplinas) ====================

async function carregarListaGrades() {
    const token = localStorage.getItem('token');
    if (!token) return;
    const container = document.getElementById('listaGrades');

    try {
        const resp = await fetch(`${API_URL}/historicos/grades`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await resp.json();
        HIST_STATE.grades = data.success ? data.grades : [];

        if (!HIST_STATE.grades.length) {
            container.innerHTML = `<div style="text-align: center; color: #9ca3af; padding: 30px; grid-column: 1/-1;">
                Nenhuma grade criada. Clique em "+ Nova Grade" para começar.
            </div>`;
            return;
        }

        container.innerHTML = HIST_STATE.grades.map(g => `
            <div class="card" style="padding: 14px; border: 2px solid ${g.tipo === 'medio' ? '#3b82f6' : '#10b981'}; border-radius: 12px;">
                <div style="display: flex; justify-content: space-between; align-items: start;">
                    <div>
                        <span style="background: ${g.tipo === 'medio' ? '#dbeafe' : '#d1fae5'}; color: ${g.tipo === 'medio' ? '#1e40af' : '#065f46'}; padding: 2px 8px; border-radius: 6px; font-size: 11px; font-weight: 600;">
                            ${g.tipo === 'medio' ? 'ENSINO MÉDIO' : 'ENSINO FUNDAMENTAL'}
                        </span>
                        <h3 style="margin-top: 6px; font-size: 15px; color: #1e3a8a;">${escapeHtml(g.nome)}</h3>
                    </div>
                </div>
                <div style="color: #6b7280; font-size: 12px; margin: 6px 0;">
                    ${g.disciplinas ? g.disciplinas.length : 0} disciplina(s) · ${g.numSeries} série(s)/ano(s)
                </div>
                <div style="display: flex; gap: 4px; flex-wrap: wrap; margin-top: 8px;">
                    <button class="btn btn-primary btn-sm" onclick="editarGrade('${g._id}')" style="font-size: 11px; padding: 4px 10px;">✏️ Editar</button>
                    <button class="btn btn-danger btn-sm" onclick="excluirGrade('${g._id}', '${escapeHtml(g.nome)}')" style="font-size: 11px; padding: 4px 10px;">🗑️</button>
                </div>
            </div>
        `).join('');
    } catch (e) {
        container.innerHTML = '<div style="text-align: center; color: #ef4444; padding: 20px; grid-column: 1/-1;">Erro ao carregar grades.</div>';
    }
}

function abrirModalNovaGrade() {
    abrirModalGrade(null);
}

function abrirModalGrade(gradeExistente) {
    const isEdit = !!gradeExistente;
    const g = gradeExistente || { tipo: 'medio', nome: '', disciplinas: [], numSeries: 3, nomesSeries: ['1ª Série', '2ª Série', '3ª Série'] };

    const numSeriesTotal = g.nomesSeries?.length || (g.tipo === 'medio' ? 3 : 9);
    const nomesPadrao = g.tipo === 'medio'
        ? ['1ª Série', '2ª Série', '3ª Série']
        : ['1º Ano', '2º Ano', '3º Ano', '4º Ano', '5º Ano', '6º Ano', '7º Ano', '8º Ano', '9º Ano'];

    // Inicializar estado das tabs
    _gradeActiveTab = 0;
    _gradeSeriesNomes = g.nomesSeries?.length ? [...g.nomesSeries] : [...nomesPadrao];
    _gradeSeriesMatrizes = new Array(numSeriesTotal).fill(null);
    _gradeTabDiscs = Array.from({ length: numSeriesTotal }, () => []);

    if (g.seriesMatrizes?.length) {
        g.seriesMatrizes.forEach(sm => {
            const idx = sm.serieIdx;
            if (idx >= 0 && idx < numSeriesTotal) {
                const mId = sm.matrizId?._id || sm.matrizId;
                if (mId) _gradeSeriesMatrizes[idx] = { id: mId.toString(), titulo: sm.matrizId?.titulo || '' };
            }
        });
    }

    // Distribuir disciplinas por tab a partir de cargaHorariaPorSerie
    if (g.disciplinas?.length) {
        g.disciplinas.forEach(d => {
            const chArr = d.cargaHorariaPorSerie;
            if (chArr && chArr.length >= numSeriesTotal) {
                for (let i = 0; i < numSeriesTotal; i++) {
                    const ch = chArr[i] !== undefined ? chArr[i] : 0;
                    if (ch > 0) _gradeTabDiscs[i].push({ nome: d.nome, categoria: d.categoria, ch });
                }
            } else {
                const ch = d.cargaHorariaPadrao || 0;
                for (let i = 0; i < numSeriesTotal; i++) _gradeTabDiscs[i].push({ nome: d.nome, categoria: d.categoria, ch });
            }
        });
    }

    const modal = document.createElement('div');
    modal.className = 'overlay-modal';
    modal.id = 'modalGrade';
    modal.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.6);z-index:9999;display:flex;align-items:center;justify-content:center;overflow-y:auto;padding:20px;';

    modal.innerHTML = `
    <div style="background:white;border-radius:16px;padding:28px;max-width:720px;width:95%;max-height:90vh;overflow-y:auto;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">
            <h2 style="color:#1e3a8a;margin:0;">${isEdit ? '✏️ Editar' : '➕ Nova'} Grade de Disciplinas</h2>
            <button onclick="this.closest('.overlay-modal').remove()" style="background:none;border:none;font-size:24px;cursor:pointer;">✕</button>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:20px;">
            <div>
                <label style="font-weight:600;font-size:13px;display:block;margin-bottom:4px;">Modalidade</label>
                <select id="gradeTipo" class="form-control" onchange="atualizarSeriesGrade()">
                    <option value="medio" ${g.tipo === 'medio' ? 'selected' : ''}>Ensino Médio</option>
                    <option value="fundamental" ${g.tipo === 'fundamental' ? 'selected' : ''}>Ensino Fundamental</option>
                </select>
            </div>
            <div>
                <label style="font-weight:600;font-size:13px;display:block;margin-bottom:4px;">Nome da Grade</label>
                <input type="text" id="gradeNome" class="form-control" value="${escapeHtml(g.nome)}" placeholder="Ex: Ensino Médio Integral 2025">
            </div>
        </div>

        <div style="margin-bottom:16px;">
            <label style="font-weight:600;font-size:13px;display:block;margin-bottom:8px;">Séries / Anos</label>
            <div id="gradeSeriesTabs" style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px;"></div>
            <div style="background:#f8fafc;border:1px solid #e5e7eb;border-radius:10px;padding:10px 14px;">
                <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;flex-wrap:wrap;">
                    <label style="font-size:12px;font-weight:600;white-space:nowrap;color:#374151;">Nome desta série:</label>
                    <input type="text" id="gradeSerieNomeInput" class="form-control" style="max-width:180px;font-size:12px;padding:5px 8px;" oninput="atualizarNomeSerieAtiva()">
                </div>
                <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
                    <span style="font-size:12px;color:#6b7280;white-space:nowrap;">Matriz curricular:</span>
                    <span id="gradeSerieMatrizLabel" style="font-size:12px;font-weight:600;color:#9ca3af;flex:1;min-width:60px;">Nenhuma</span>
                    <button onclick="selecionarMatrizParaSerie(_gradeActiveTab)" style="background:#eff6ff;color:#1e40af;border:1px solid #bfdbfe;padding:4px 10px;border-radius:6px;cursor:pointer;font-size:11px;white-space:nowrap;">📋 Selecionar Matriz</button>
                    <button onclick="limparMatrizSerie(_gradeActiveTab)" style="background:#fef2f2;color:#991b1b;border:1px solid #fecaca;padding:4px 8px;border-radius:6px;cursor:pointer;font-size:11px;" title="Remover matriz">✕</button>
                </div>
            </div>
        </div>

        <div style="border-top:2px solid #e5e7eb;padding-top:16px;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
                <h3 id="gradeDisciplinasTitle" style="color:#1e3a8a;font-size:15px;margin:0;">Disciplinas</h3>
                <button class="btn btn-primary btn-sm" onclick="adicionarDisciplinaGrade()" style="font-size:12px;">+ Adicionar Disciplina</button>
            </div>
            <div style="overflow-x:auto;max-height:370px;overflow-y:auto;border:1px solid #e5e7eb;border-radius:8px;">
                <table style="width:100%;border-collapse:collapse;" id="gradeDisciplinasTable">
                    <thead>
                        <tr style="background:#e2e8f0;">
                            <th style="padding:7px 10px;text-align:left;border:1px solid #cbd5e1;font-size:12px;font-weight:600;min-width:200px;">Disciplina</th>
                            <th style="padding:7px 8px;text-align:left;border:1px solid #cbd5e1;font-size:12px;font-weight:600;min-width:155px;">Categoria</th>
                            <th style="padding:7px 8px;text-align:center;border:1px solid #cbd5e1;font-size:12px;font-weight:600;width:110px;">CH (horas)</th>
                            <th style="padding:4px;border:1px solid #cbd5e1;width:38px;"></th>
                        </tr>
                    </thead>
                    <tbody id="gradeDisciplinasTbody"></tbody>
                </table>
            </div>
        </div>

        <div id="gradeModalFooter" style="display:flex;gap:10px;justify-content:flex-end;margin-top:20px;border-top:2px solid #e5e7eb;padding-top:16px;">
            <button class="btn btn-secondary" onclick="this.closest('.overlay-modal').remove()">Cancelar</button>
            <button class="btn btn-secondary" id="btnCarregarPadrao" onclick="carregarDisciplinasPadrao()">📋 Carregar Padrão</button>
            <button class="btn btn-primary" onclick="salvarGrade('${isEdit ? gradeExistente._id : ''}')">${isEdit ? '💾 Salvar Alterações' : '✅ Criar Grade'}</button>
        </div>
    </div>`;

    document.body.appendChild(modal);
    modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });

    renderGradeTabs();
    renderGradeTabContent(0);

    const btnPadrao = document.getElementById('btnCarregarPadrao');
    if (btnPadrao) btnPadrao.textContent = g.tipo === 'medio' ? '📋 Carregar Padrão Médio' : '📋 Carregar Padrão Fundamental';
}

// ==================== TABS DE SÉRIES NA GRADE ====================

function renderGradeTabs() {
    const container = document.getElementById('gradeSeriesTabs');
    if (!container) return;
    container.innerHTML = _gradeSeriesNomes.map((nome, i) => {
        const mat = _gradeSeriesMatrizes[i];
        const isActive = i === _gradeActiveTab;
        return `<button class="grade-tab-btn" onclick="switchGradeTab(${i})"
            style="padding:8px 18px;border-radius:8px;border:2px solid ${isActive ? '#1e3a8a' : '#e5e7eb'};
            background:${isActive ? '#1e3a8a' : 'white'};color:${isActive ? 'white' : '#374151'};
            cursor:pointer;font-size:13px;font-weight:600;position:relative;transition:all .15s;">
            ${escapeHtml(nome)}
            ${mat ? '<span style="position:absolute;top:-5px;right:-5px;background:#10b981;color:white;border-radius:50%;width:16px;height:16px;font-size:9px;line-height:16px;text-align:center;display:inline-block;">✓</span>' : ''}
        </button>`;
    }).join('');
}

function renderGradeTabContent(idx) {
    const nomeInput = document.getElementById('gradeSerieNomeInput');
    if (nomeInput) nomeInput.value = _gradeSeriesNomes[idx] || '';

    const mat = _gradeSeriesMatrizes[idx];
    const label = document.getElementById('gradeSerieMatrizLabel');
    if (label) { label.textContent = mat ? mat.titulo : 'Nenhuma'; label.style.color = mat ? '#1e3a8a' : '#9ca3af'; }

    const title = document.getElementById('gradeDisciplinasTitle');
    if (title) title.textContent = `Disciplinas — ${_gradeSeriesNomes[idx] || 'Série ' + (idx + 1)}`;

    const tbody = document.getElementById('gradeDisciplinasTbody');
    if (tbody) {
        tbody.innerHTML = '';
        (_gradeTabDiscs[idx] || []).forEach(d => adicionarDisciplinaGrade(d));
    }
}

function switchGradeTab(newIdx) {
    saveCurrentTabDiscs();
    _gradeActiveTab = newIdx;
    renderGradeTabs();
    renderGradeTabContent(newIdx);
}

function saveCurrentTabDiscs() {
    const rows = [...document.querySelectorAll('#gradeDisciplinasTbody .grade-disc-row')];
    _gradeTabDiscs[_gradeActiveTab] = rows.map(row => ({
        nome: row.querySelector('.disc-nome').value.trim(),
        categoria: row.querySelector('.disc-categoria').value,
        ch: parseInt(row.querySelector('.disc-ch').value) || 0
    })).filter(d => d.nome);
    const nomeInput = document.getElementById('gradeSerieNomeInput');
    if (nomeInput && nomeInput.value.trim()) _gradeSeriesNomes[_gradeActiveTab] = nomeInput.value.trim();
}

function atualizarNomeSerieAtiva() {
    const nomeInput = document.getElementById('gradeSerieNomeInput');
    if (!nomeInput) return;
    _gradeSeriesNomes[_gradeActiveTab] = nomeInput.value;
    const title = document.getElementById('gradeDisciplinasTitle');
    if (title) title.textContent = `Disciplinas — ${nomeInput.value || 'Série ' + (_gradeActiveTab + 1)}`;
    renderGradeTabs();
}

function atualizarSeriesGrade() {
    const tipo = document.getElementById('gradeTipo').value;
    const numSeries = tipo === 'medio' ? 3 : 9;
    const seriesPadrao = tipo === 'medio'
        ? ['1ª Série', '2ª Série', '3ª Série']
        : ['1º Ano', '2º Ano', '3º Ano', '4º Ano', '5º Ano', '6º Ano', '7º Ano', '8º Ano', '9º Ano'];
    saveCurrentTabDiscs();
    while (_gradeSeriesNomes.length < numSeries) _gradeSeriesNomes.push(seriesPadrao[_gradeSeriesNomes.length]);
    while (_gradeSeriesMatrizes.length < numSeries) _gradeSeriesMatrizes.push(null);
    while (_gradeTabDiscs.length < numSeries) _gradeTabDiscs.push([]);
    _gradeSeriesNomes = _gradeSeriesNomes.slice(0, numSeries);
    _gradeSeriesMatrizes = _gradeSeriesMatrizes.slice(0, numSeries);
    _gradeTabDiscs = _gradeTabDiscs.slice(0, numSeries);
    if (_gradeActiveTab >= numSeries) _gradeActiveTab = 0;
    const btnPadrao = document.getElementById('btnCarregarPadrao');
    if (btnPadrao) btnPadrao.textContent = tipo === 'medio' ? '📋 Carregar Padrão Médio' : '📋 Carregar Padrão Fundamental';
    renderGradeTabs();
    renderGradeTabContent(_gradeActiveTab);
}

async function selecionarMatrizParaSerie(serieIdx) {
    const token = localStorage.getItem('token');
    if (!token) return;
    let matrizes = HIST_STATE.matrizes || [];
    if (!matrizes.length) {
        try {
            const resp = await fetch(`${API_URL}/historicos/matrizes`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await resp.json();
            if (data.success) { matrizes = data.matrizes; HIST_STATE.matrizes = matrizes; }
        } catch (e) {}
    }
    if (!matrizes.length) {
        mostrarNotificacao('Nenhuma matriz cadastrada. Cadastre primeiro em "Matrizes Curriculares".', 'warning');
        return;
    }
    // Guardar dados para uso no onclick
    window._matrizPickerData = {};
    matrizes.forEach(m => { window._matrizPickerData[m._id] = m; });

    const serieNome = _gradeSeriesNomes[serieIdx] || `Série ${serieIdx + 1}`;
    const picker = document.createElement('div');
    picker.id = 'modalMatrizPicker';
    picker.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.7);z-index:10000;display:flex;align-items:center;justify-content:center;padding:20px;';
    picker.innerHTML = `
    <div style="background:white;border-radius:16px;padding:24px;max-width:480px;width:95%;max-height:80vh;overflow-y:auto;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
            <h3 style="color:#1e3a8a;margin:0;">Selecionar Matriz — ${escapeHtml(serieNome)}</h3>
            <button onclick="document.getElementById('modalMatrizPicker').remove()" style="background:none;border:none;font-size:22px;cursor:pointer;">✕</button>
        </div>
        <div style="display:flex;flex-direction:column;gap:8px;">
            ${matrizes.map(m => `
            <div onclick="aplicarMatrizNaSerie(${serieIdx}, '${m._id}')"
                 style="padding:12px 16px;border:2px solid #e5e7eb;border-radius:10px;cursor:pointer;"
                 onmouseover="this.style.borderColor='#3b82f6';this.style.background='#eff6ff'"
                 onmouseout="this.style.borderColor='#e5e7eb';this.style.background='white'">
                <div style="font-weight:600;font-size:13px;color:#1e3a8a;">${escapeHtml(m.titulo)}</div>
                <div style="font-size:11px;color:#6b7280;margin-top:2px;">${m.disciplinas ? m.disciplinas.length : 0} disciplina(s)</div>
            </div>`).join('')}
        </div>
    </div>`;
    document.body.appendChild(picker);
    picker.addEventListener('click', e => { if (e.target === picker) picker.remove(); });
}

function aplicarMatrizNaSerie(serieIdx, matrizId) {
    const matriz = window._matrizPickerData?.[matrizId];
    if (!matriz) return;
    _gradeSeriesMatrizes[serieIdx] = { id: matrizId, titulo: matriz.titulo };
    _gradeTabDiscs[serieIdx] = (matriz.disciplinas || []).map(d => ({
        nome: d.nome, categoria: d.categoria, ch: d.cargaHoraria || 0
    }));
    if (serieIdx === _gradeActiveTab) renderGradeTabContent(serieIdx);
    renderGradeTabs();
    document.getElementById('modalMatrizPicker')?.remove();
}

function limparMatrizSerie(serieIdx) {
    _gradeSeriesMatrizes[serieIdx] = null;
    if (serieIdx === _gradeActiveTab) {
        const label = document.getElementById('gradeSerieMatrizLabel');
        if (label) { label.textContent = 'Nenhuma'; label.style.color = '#9ca3af'; }
    }
    renderGradeTabs();
}

function obterCategoriasPorTipo(tipo) {
    if (tipo === 'medio') {
        return [
            ['formacao_geral', 'Formação Geral Básica'],
            ['itinerarios', 'Itinerários Formativos'],
            ['atividades_integradoras', 'Atividades Integradoras']
        ];
    }
    return [
        ['linguagens', 'Linguagens, Códigos e Suas Tecnologias'],
        ['ciencias_humanas', 'Ciências Humanas e Suas Tecnologias'],
        ['ciencias_natureza', 'Ciências da Natureza e Suas Tecnologias'],
        ['matematica', 'Matemática e Suas Tecnologias'],
        ['parte_flexivel', 'Parte Flexível (Diversificada)'],
        ['ensino_religioso', 'Ensino Religioso']
    ];
}

function adicionarDisciplinaGrade(disc) {
    const tbody = document.getElementById('gradeDisciplinasTbody');
    if (!tbody) return;
    const tipo = document.getElementById('gradeTipo').value;
    const categorias = obterCategoriasPorTipo(tipo);
    // Aceita ch, cargaHoraria ou cargaHorariaPadrao
    const ch = disc ? (disc.ch !== undefined ? disc.ch : (disc.cargaHoraria !== undefined ? disc.cargaHoraria : (disc.cargaHorariaPadrao || ''))) : '';
    const row = document.createElement('tr');
    row.className = 'grade-disc-row';
    row.innerHTML = `
        <td style="padding:3px 6px;border:1px solid #e5e7eb;background:#f8fafc;">
            <input type="text" class="form-control disc-nome" value="${disc ? escapeHtml(disc.nome) : ''}" placeholder="Nome da Disciplina" style="font-size:12px;padding:5px 7px;min-width:185px;">
        </td>
        <td style="padding:3px 6px;border:1px solid #e5e7eb;">
            <select class="form-control disc-categoria" style="font-size:12px;padding:5px 7px;min-width:155px;">
                ${categorias.map(c => `<option value="${c[0]}" ${disc && disc.categoria === c[0] ? 'selected' : ''}>${c[1]}</option>`).join('')}
            </select>
        </td>
        <td style="padding:3px 8px;border:1px solid #e5e7eb;text-align:center;">
            <input type="number" class="form-control disc-ch" min="0" value="${ch}" placeholder="0" style="width:90px;font-size:12px;padding:4px 6px;text-align:center;">
        </td>
        <td style="padding:3px 4px;border:1px solid #e5e7eb;text-align:center;">
            <button onclick="this.closest('tr').remove()" style="background:#fee2e2;color:#991b1b;border:1px solid #fca5a5;padding:4px 8px;border-radius:6px;cursor:pointer;font-size:14px;" title="Remover">✕</button>
        </td>
    `;
    tbody.appendChild(row);
}

function carregarDisciplinasPadrao() {
    const tipo = document.getElementById('gradeTipo').value;
    if (tipo === 'medio') {
        carregarDisciplinasPadraoMedio();
    } else {
        carregarDisciplinasPadraoFundamental();
    }
}

function carregarDisciplinasPadraoFundamental() {
    const tbody = document.getElementById('gradeDisciplinasTbody');
    if (tbody) tbody.innerHTML = '';

    const disciplinas = [
        // Linguagens, Códigos e Suas Tecnologias
        { nome: 'Língua Portuguesa', categoria: 'linguagens', cargaHorariaPadrao: 200 },
        { nome: 'Arte', categoria: 'linguagens', cargaHorariaPadrao: 80 },
        { nome: 'Educação Física', categoria: 'linguagens', cargaHorariaPadrao: 120 },
        // Ciências Humanas e Suas Tecnologias
        { nome: 'História', categoria: 'ciencias_humanas', cargaHorariaPadrao: 120 },
        { nome: 'Geografia', categoria: 'ciencias_humanas', cargaHorariaPadrao: 120 },
        // Ciências da Natureza e Suas Tecnologias
        { nome: 'Ciências', categoria: 'ciencias_natureza', cargaHorariaPadrao: 160 },
        { nome: 'Biologia', categoria: 'ciencias_natureza', cargaHorariaPadrao: 80 },
        { nome: 'Física', categoria: 'ciencias_natureza', cargaHorariaPadrao: 80 },
        { nome: 'Química', categoria: 'ciencias_natureza', cargaHorariaPadrao: 80 },
        // Matemática e Suas Tecnologias
        { nome: 'Matemática', categoria: 'matematica', cargaHorariaPadrao: 200 },
        // Parte Flexível (Diversificada)
        { nome: 'Língua Estrangeira Moderna: Inglês', categoria: 'parte_flexivel', cargaHorariaPadrao: 80 },
        { nome: 'Componente Eletivo', categoria: 'parte_flexivel', cargaHorariaPadrao: 80 },
        { nome: 'Projeto Interdisciplinar', categoria: 'parte_flexivel', cargaHorariaPadrao: 40 },
        { nome: 'Acompanhamento Pedagógico', categoria: 'parte_flexivel', cargaHorariaPadrao: 80 },
        { nome: 'Recomposição da Aprendizagem/Matemática', categoria: 'parte_flexivel', cargaHorariaPadrao: 80 },
        { nome: 'Recomposição da Aprendizagem/Português', categoria: 'parte_flexivel', cargaHorariaPadrao: 80 },
        { nome: 'Estudos Dirigidos', categoria: 'parte_flexivel', cargaHorariaPadrao: 280 },
        // Ensino Religioso
        { nome: 'Ensino Religioso', categoria: 'ensino_religioso', cargaHorariaPadrao: 40 },
    ];

    disciplinas.forEach(d => adicionarDisciplinaGrade(d));
}

function carregarDisciplinasPadraoMedio() {
    const tbody = document.getElementById('gradeDisciplinasTbody');
    if (tbody) tbody.innerHTML = '';

    const disciplinas = [
        // Formação Geral Básica
        { nome: 'Língua Portuguesa', categoria: 'formacao_geral', cargaHorariaPadrao: 240 },
        { nome: 'Arte', categoria: 'formacao_geral', cargaHorariaPadrao: 80 },
        { nome: 'Educação Física', categoria: 'formacao_geral', cargaHorariaPadrao: 80 },
        { nome: 'Língua Inglesa', categoria: 'formacao_geral', cargaHorariaPadrao: 80 },
        { nome: 'Língua Espanhola', categoria: 'formacao_geral', cargaHorariaPadrao: 80 },
        { nome: 'Matemática', categoria: 'formacao_geral', cargaHorariaPadrao: 120 },
        { nome: 'Física', categoria: 'formacao_geral', cargaHorariaPadrao: 120 },
        { nome: 'Química', categoria: 'formacao_geral', cargaHorariaPadrao: 120 },
        { nome: 'Biologia', categoria: 'formacao_geral', cargaHorariaPadrao: 120 },
        { nome: 'História', categoria: 'formacao_geral', cargaHorariaPadrao: 40 },
        { nome: 'Geografia', categoria: 'formacao_geral', cargaHorariaPadrao: 40 },
        { nome: 'Filosofia', categoria: 'formacao_geral', cargaHorariaPadrao: 40 },
        { nome: 'Sociologia', categoria: 'formacao_geral', cargaHorariaPadrao: 40 },
        // Itinerários Formativos
        { nome: 'Trilhas de Aprendizagem da Área', categoria: 'itinerarios', cargaHorariaPadrao: 240 },
        { nome: 'Projeto de Vida', categoria: 'itinerarios', cargaHorariaPadrao: 120 },
        { nome: 'Eletivas', categoria: 'itinerarios', cargaHorariaPadrao: 120 },
        { nome: 'Língua Inglesa Aprofundamento', categoria: 'itinerarios', cargaHorariaPadrao: 120 },
        { nome: 'Estudo Orientado', categoria: 'itinerarios', cargaHorariaPadrao: 80 },
        { nome: 'Recomposição da Aprendizagem em Matemática', categoria: 'itinerarios', cargaHorariaPadrao: 80 },
        { nome: 'Recomposição da Aprendizagem em Língua Portuguesa', categoria: 'itinerarios', cargaHorariaPadrao: 80 },
        // Atividades Integradoras
        { nome: 'Seminários Integradores', categoria: 'atividades_integradoras', cargaHorariaPadrao: 40 },
        { nome: 'Projetos Pedagógicos Interdisciplinares', categoria: 'atividades_integradoras', cargaHorariaPadrao: 40 },
        { nome: 'Esporte (Integrado ao Componente Educação Física)', categoria: 'atividades_integradoras', cargaHorariaPadrao: 40 },
        { nome: 'Cultura (Integrado com Componente de Arte)', categoria: 'atividades_integradoras', cargaHorariaPadrao: 40 },
    ];

    disciplinas.forEach(d => adicionarDisciplinaGrade(d));
}

async function salvarGrade(id) {
    const token = localStorage.getItem('token');
    if (!token) return;

    const tipo = document.getElementById('gradeTipo').value;
    const nome = document.getElementById('gradeNome').value.trim();
    if (!nome) { mostrarNotificacao('Informe o nome da grade.', 'error'); return; }

    // Salvar tab ativa antes de mesclar
    saveCurrentTabDiscs();

    const nomesSeries = [..._gradeSeriesNomes];
    const numSeries = nomesSeries.length;

    // Mesclar todas as tabs em cargaHorariaPorSerie
    const allNames = [];
    const seen = new Set();
    _gradeTabDiscs.forEach(tab => {
        tab.forEach(d => { if (d.nome && !seen.has(d.nome)) { seen.add(d.nome); allNames.push(d.nome); } });
    });

    if (!allNames.length) { mostrarNotificacao('Adicione ao menos uma disciplina em alguma série.', 'error'); return; }

    const disciplinas = allNames.map(discNome => {
        let categoria = 'formacao_geral';
        const chPorSerie = _gradeTabDiscs.map(tab => {
            const found = tab.find(d => d.nome === discNome);
            if (found) { categoria = found.categoria; return found.ch || 0; }
            return 0;
        });
        return { nome: discNome, categoria, cargaHorariaPorSerie: chPorSerie, cargaHorariaPadrao: Math.max(...chPorSerie) };
    });

    const seriesMatrizes = _gradeSeriesMatrizes
        .map((m, i) => m ? { serieIdx: i, serieNome: nomesSeries[i] || '', matrizId: m.id } : null)
        .filter(Boolean);

    const body = { tipo, nome, disciplinas, numSeries, nomesSeries, seriesMatrizes };
    const url = id ? `${API_URL}/historicos/grades/${id}` : `${API_URL}/historicos/grades`;
    const method = id ? 'PUT' : 'POST';

    try {
        const resp = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(body)
        });
        const data = await resp.json();
        if (data.success) {
            document.getElementById('modalGrade')?.remove();
            mostrarNotificacao(`Grade "${nome}" ${id ? 'atualizada' : 'criada'} com sucesso!`, 'success');
            carregarListaGrades();
        } else {
            mostrarNotificacao(data.message || 'Erro ao salvar grade.', 'error');
        }
    } catch (e) {
        mostrarNotificacao('Erro de conexão.', 'error');
    }
}

async function editarGrade(id) {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
        const resp = await fetch(`${API_URL}/historicos/grades/${id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await resp.json();
        if (data.success) {
            abrirModalGrade(data.grade);
        }
    } catch (e) {
        mostrarNotificacao('Erro ao carregar grade.', 'error');
    }
}

async function excluirGrade(id, nome) {
    if (!confirm(`Excluir a grade "${nome}"? Esta ação não pode ser desfeita.`)) return;
    const token = localStorage.getItem('token');
    try {
        const resp = await fetch(`${API_URL}/historicos/grades/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await resp.json();
        if (data.success) {
            mostrarNotificacao('Grade excluída!', 'success');
            carregarListaGrades();
        } else {
            mostrarNotificacao(data.message || 'Erro ao excluir.', 'error');
        }
    } catch (e) {
        mostrarNotificacao('Erro de conexão.', 'error');
    }
}

// ==================== LANÇAR NOTAS ====================

function popularSelectAlunos() {
    popularFiltrosHistorico();
    filtrarListaAlunosHistorico();
}

function popularFiltrosHistorico() {
    const selSerie = document.getElementById('histFiltroSerie');
    const selTurma = document.getElementById('histFiltroTurma');
    if (!selSerie || !selTurma) return;

    const series = [...new Set((APP_STATE.alunos || []).map(a => a.serie).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'pt-BR'));
    const serieAtual = selSerie.value;
    selSerie.innerHTML = '<option value="">Todas as séries</option>' + series.map(s => `<option value="${s}" ${s === serieAtual ? 'selected' : ''}>${s}</option>`).join('');

    atualizarFiltroTurmaHistorico(serieAtual);
}

function atualizarFiltroTurmaHistorico(serieSelecionada) {
    const selTurma = document.getElementById('histFiltroTurma');
    if (!selTurma) return;
    const base = serieSelecionada ? (APP_STATE.alunos || []).filter(a => a.serie === serieSelecionada) : (APP_STATE.alunos || []);
    const turmas = [...new Set(base.map(a => a.turma).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'pt-BR'));
    const turmaAtual = selTurma.value;
    selTurma.innerHTML = '<option value="">Todas as turmas</option>' + turmas.map(t => `<option value="${t}" ${t === turmaAtual ? 'selected' : ''}>${t}</option>`).join('');
    if (turmaAtual && !turmas.includes(turmaAtual)) selTurma.value = '';
}

function aoMudarSerieHistorico() {
    const serie = document.getElementById('histFiltroSerie')?.value || '';
    atualizarFiltroTurmaHistorico(serie);
    filtrarListaAlunosHistorico();
}

function aoMudarTurmaHistorico() {
    filtrarListaAlunosHistorico();
}

function filtrarListaAlunosHistorico() {
    const container = document.getElementById('listaAlunosHistorico');
    if (!container) return;

    const filtroSerie = document.getElementById('histFiltroSerie')?.value || '';
    const filtroTurma = document.getElementById('histFiltroTurma')?.value || '';
    const busca = (document.getElementById('histBuscarAluno')?.value || '').toLowerCase().trim();
    const alunoAbertoId = document.getElementById('histAluno')?.value || '';
    const tipo = document.getElementById('histTipo')?.value || '';

    // Deduplicar por ID (evita duplicações no APP_STATE)
    const seen = new Set();
    let alunos = (APP_STATE.alunos || [])
        .filter(a => { if (seen.has(a.id)) return false; seen.add(a.id); return true; })
        .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));

    if (filtroSerie) alunos = alunos.filter(a => (a.serie || '') === filtroSerie);
    if (filtroTurma) alunos = alunos.filter(a => (a.turma || '') === filtroTurma);
    if (busca) alunos = alunos.filter(a => a.nome.toLowerCase().includes(busca));

    // Ocultar aluno em edição (já está no form abaixo)
    if (alunoAbertoId) alunos = alunos.filter(a => a.id !== alunoAbertoId);

    // Ocultar alunos que já têm histórico salvo para o tipo selecionado
    if (tipo && HIST_STATE.alunosComHistorico.size)
        alunos = alunos.filter(a => !HIST_STATE.alunosComHistorico.has(a.id));

    atualizarContadorHistorico(alunos.length);

    if (!alunos.length) {
        container.innerHTML = `<div style="text-align:center;color:#9ca3af;padding:20px;font-size:13px;">Nenhum aluno encontrado.</div>`;
        return;
    }

    let html = '';
    // Agrupar por Série — Turma se sem filtro de turma e sem busca
    const agrupar = !filtroTurma && !busca;
    if (agrupar) {
        const grupos = {};
        alunos.forEach(a => {
            const chave = [a.serie, a.turma].filter(Boolean).join(' — ') || 'Sem turma';
            if (!grupos[chave]) grupos[chave] = [];
            grupos[chave].push(a);
        });
        Object.keys(grupos).sort((a, b) => a.localeCompare(b, 'pt-BR')).forEach(chave => {
            html += `<div style="background:linear-gradient(90deg,#eff6ff,#dbeafe);padding:6px 12px;font-weight:700;font-size:12px;color:#1e3a8a;border-bottom:1px solid #bfdbfe;">📚 ${escapeHtml(chave)} <span style="font-weight:400;color:#6b7280;">(${grupos[chave].length})</span></div>`;
            grupos[chave].forEach(a => { html += renderItemAlunoHistorico(a, alunoAbertoId); });
        });
    } else {
        alunos.forEach(a => { html += renderItemAlunoHistorico(a, alunoAbertoId); });
    }

    container.innerHTML = html;
}

function renderItemAlunoHistorico(aluno, alunoAbertoId) {
    const aberto = aluno.id === alunoAbertoId;
    const bg = aberto ? '#dbeafe' : '#ffffff';
    const bgHover = aberto ? '#dbeafe' : '#eff6ff';
    const info = [aluno.serie, aluno.turma ? 'Turma ' + aluno.turma : ''].filter(Boolean).join(' — ');
    const nomeEsc = escapeHtml(aluno.nome).replace(/'/g, '&#39;');
    const serieEsc = escapeHtml(aluno.serie || '').replace(/'/g, '&#39;');
    const turmaEsc = escapeHtml(aluno.turma || '').replace(/'/g, '&#39;');
    return `<div style="display:flex;align-items:center;border-bottom:1px solid #f1f5f9;background:${bg};cursor:pointer;"
         onclick="abrirNotasAlunoHistorico('${aluno.id}','${nomeEsc}','${serieEsc}','${turmaEsc}')"
         onmouseover="this.style.background='${bgHover}'" onmouseout="this.style.background='${bg}'">
        <div style="flex:1;min-width:0;padding:9px 14px;">
            <div style="font-weight:600;font-size:13px;color:#1e293b;">${escapeHtml(aluno.nome)}
                ${aberto ? '<span style="color:#1e3a8a;font-size:11px;margin-left:6px;">✏️ editando</span>' : ''}
            </div>
            ${info ? `<div style="font-size:11px;color:#6b7280;margin-top:1px;">${info}</div>` : ''}
        </div>
        <span style="color:#9ca3af;font-size:11px;padding-right:12px;">→</span>
    </div>`;
}

function atualizarContadorHistorico(n) {
    const el = document.getElementById('contadorAlunosHistorico');
    if (el) {
        el.textContent = n != null ? (n > 0 ? `${n} aluno${n !== 1 ? 's' : ''} encontrado${n !== 1 ? 's' : ''}` : '') : '';
    }
}

function abrirNotasAlunoHistorico(id, nome, serie, turma) {
    const hiddenInput = document.getElementById('histAluno');
    if (!hiddenInput) return;
    hiddenInput.value = id;

    const infoBar = document.getElementById('alunoHistoricoSelecionado');
    const nomeEl = document.getElementById('alunoHistoricoNome');
    if (infoBar && nomeEl) {
        const info = [serie, turma].filter(Boolean).join(' — Turma ');
        nomeEl.textContent = nome + (info ? ' · ' + info : '');
        infoBar.style.display = 'flex';
    }

    filtrarListaAlunosHistorico();
    carregarHistoricoAluno();
}

function limparSelecaoAlunoHistorico() {
    const hiddenInput = document.getElementById('histAluno');
    if (hiddenInput) hiddenInput.value = '';
    const infoBar = document.getElementById('alunoHistoricoSelecionado');
    if (infoBar) infoBar.style.display = 'none';
    const formNotas = document.getElementById('formNotas');
    if (formNotas) formNotas.style.display = 'none';
    filtrarListaAlunosHistorico();
}

async function carregarGradesParaNotas() {
    const tipo = document.getElementById('histTipo').value;
    const sel = document.getElementById('histGrade');
    sel.innerHTML = '<option value="">Carregando...</option>';
    document.getElementById('formNotas').style.display = 'none';

    // Recarregar a lista de históricos conforme o filtro de tipo
    carregarListaHistoricos();

    if (!tipo) {
        sel.innerHTML = '<option value="">Selecione a modalidade primeiro...</option>';
        return;
    }

    const token = localStorage.getItem('token');
    try {
        const resp = await fetch(`${API_URL}/historicos/grades?tipo=${tipo}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await resp.json();
        if (data.success && data.grades.length) {
            sel.innerHTML = '<option value="">Selecione a grade...</option>';
            data.grades.forEach(g => {
                sel.innerHTML += `<option value="${g._id}">${escapeHtml(g.nome)} (${g.disciplinas.length} disc.)</option>`;
            });
        } else {
            sel.innerHTML = '<option value="">Nenhuma grade para esta modalidade</option>';
        }
    } catch (e) {
        sel.innerHTML = '<option value="">Erro ao carregar</option>';
    }
}

async function carregarFormNotas() {
    const gradeId = document.getElementById('histGrade').value;
    const container = document.getElementById('formNotas');
    if (!gradeId) { container.style.display = 'none'; return; }

    const token = localStorage.getItem('token');
    try {
        const resp = await fetch(`${API_URL}/historicos/grades/${gradeId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await resp.json();
        if (!data.success) return;

        HIST_STATE.gradeAtual = data.grade;
        renderizarTabelaNotas(data.grade, {});
        container.style.display = 'block';

        // Se já tem aluno selecionado, carregar notas existentes
        carregarHistoricoAluno();
    } catch (e) {
        mostrarNotificacao('Erro ao carregar grade.', 'error');
    }
}

function renderizarTabelaNotas(grade, notasExistentes) {
    const container = document.getElementById('formNotas');
    const series = grade.nomesSeries || [];
    const discs = grade.disciplinas || [];

    // Agrupar por categoria
    const categorias = {};
    discs.forEach(d => {
        if (!categorias[d.categoria]) categorias[d.categoria] = [];
        categorias[d.categoria].push(d);
    });

    const categoriasNomes = {
        'formacao_geral': 'Formação Geral Básica',
        'itinerarios': 'Itinerários Formativos',
        'atividades_integradoras': 'Atividades Integradoras',
        'linguagens': 'Linguagens, Códigos e Suas Tecnologias',
        'ciencias_humanas': 'Ciências Humanas e Suas Tecnologias',
        'ciencias_natureza': 'Ciências da Natureza e Suas Tecnologias',
        'matematica': 'Matemática e Suas Tecnologias',
        'parte_flexivel': 'Parte Flexível (Diversificada)',
        'ensino_religioso': 'Ensino Religioso'
    };

    const isFundamental = grade.tipo === 'fundamental';

    let html = `
    <div style="overflow-x:auto;margin-top:12px;">
        <table style="width:100%;border-collapse:collapse;font-size:12px;">
            <thead>
                <tr style="background:#1e3a8a;color:white;">
                    <th style="padding:8px 10px;text-align:left;border:1px solid #93c5fd;min-width:180px;">Componente Curricular</th>
                    ${isFundamental ? '<th style="padding:8px 6px;text-align:center;border:1px solid #93c5fd;font-size:10px;min-width:40px;writing-mode:vertical-rl;transform:rotate(180deg);">POLIVALÊNCIA</th>' : ''}
                    ${series.map((s, i) => `
                        <th colspan="2" style="padding:8px 6px;text-align:center;border:1px solid #93c5fd;">${escapeHtml(s)}</th>
                    `).join('')}
                </tr>
                <tr style="background:#2563eb;color:white;">
                    <th style="padding:4px 10px;border:1px solid #93c5fd;"></th>
                    ${isFundamental ? '<th style="padding:4px 6px;border:1px solid #93c5fd;"></th>' : ''}
                    ${series.map((s, i) => `
                        <th style="padding:4px 6px;text-align:center;border:1px solid #93c5fd;font-size:10px;">Nota</th>
                        <th style="padding:4px 6px;text-align:center;border:1px solid #93c5fd;font-size:10px;">CH</th>
                    `).join('')}
                </tr>
            </thead>
            <tbody>`;

    const totalCols = 1 + (isFundamental ? 1 : 0) + series.length * 2;

    Object.keys(categorias).forEach(catId => {
        const catNome = categoriasNomes[catId] || catId;
        html += `<tr style="background:#fef3c7;">
            <td colspan="${totalCols}" style="padding:6px 10px;font-weight:bold;font-size:11px;color:#92400e;border:1px solid #e5e7eb;">
                ${catNome}
            </td>
        </tr>`;

        categorias[catId].forEach(disc => {
            const notasDisc = notasExistentes[disc.nome] || {};
            html += `<tr>
                <td style="padding:4px 10px;border:1px solid #e5e7eb;font-size:12px;">${escapeHtml(disc.nome)}</td>
                ${isFundamental ? `<td style="padding:2px;border:1px solid #e5e7eb;text-align:center;">
                    <input type="text" class="nota-input" data-disc="${escapeHtml(disc.nome)}" data-serie="0" data-campo="polivalencia"
                        value="${notasDisc['0']?.polivalencia || '-'}" style="width:30px;text-align:center;border:1px solid #d1d5db;border-radius:4px;padding:3px;font-size:11px;">
                </td>` : ''}
                ${series.map((s, i) => {
                    const idx = String(i + 1);
                    const nd = notasDisc[idx] || {};
                    return `
                        <td style="padding:2px;border:1px solid #e5e7eb;text-align:center;">
                            <input type="number" step="0.01" min="0" max="10" class="nota-input" data-disc="${escapeHtml(disc.nome)}" data-serie="${idx}" data-campo="nota"
                                value="${nd.nota !== undefined ? nd.nota : ''}" style="width:55px;text-align:center;border:1px solid #d1d5db;border-radius:4px;padding:3px;font-size:11px;">
                        </td>
                        <td style="padding:2px;border:1px solid #e5e7eb;text-align:center;">
                            <input type="number" min="0" class="nota-input" data-disc="${escapeHtml(disc.nome)}" data-serie="${idx}" data-campo="ch"
                                value="${nd.ch !== undefined ? nd.ch : (disc.cargaHorariaPorSerie ? (disc.cargaHorariaPorSerie[i] || '') : (disc.cargaHorariaPadrao || ''))}" style="width:55px;text-align:center;border:1px solid #d1d5db;border-radius:4px;padding:3px;font-size:11px;">
                        </td>`;
                }).join('')}
            </tr>`;
        });
    });

    // Informações por série (estabelecimento, cidade/uf, ano/conclusão)
    // Tabela separada no formato do modelo: ANOS | ANO/CONCLUSÃO | INSTITUIÇÃO DE ENSINO | CIDADE/UF
    const seriesInfoExistente = HIST_STATE.historicoAtual?.seriesInfo || [];

    // Para fundamental, incluir Prv. (Pré) como série "0"
    const seriesParaInfo = isFundamental
        ? [{ nome: 'Prv.', key: '0' }, ...series.map((s, i) => ({ nome: `${i + 1}°`, key: String(i + 1) }))]
        : series.map((s, i) => ({ nome: s, key: String(i + 1) }));

    html += `</tbody></table></div>

    <div style="overflow-x:auto;margin-top:16px;">
        <h4 style="color:#1e3a8a;margin-bottom:8px;">📍 Instituições de Ensino por Série/Ano</h4>
        <table style="width:100%;border-collapse:collapse;font-size:12px;">
            <thead>
                <tr style="background:#1e3a8a;color:white;">
                    <th style="padding:6px 10px;border:1px solid #93c5fd;text-align:center;width:60px;">ANOS</th>
                    <th style="padding:6px 10px;border:1px solid #93c5fd;text-align:center;width:110px;">ANO/CONCLUSÃO</th>
                    <th style="padding:6px 10px;border:1px solid #93c5fd;text-align:left;">INSTITUIÇÃO DE ENSINO</th>
                    <th style="padding:6px 10px;border:1px solid #93c5fd;text-align:center;width:150px;">CIDADE/UF</th>
                </tr>
            </thead>
            <tbody>`;

    seriesParaInfo.forEach(s => {
        const info = seriesInfoExistente.find(si => si.serie === s.key) || {};
        html += `<tr>
            <td style="padding:3px 8px;border:1px solid #e5e7eb;text-align:center;font-weight:600;font-size:12px;">${s.nome}</td>
            <td style="padding:2px;border:1px solid #e5e7eb;text-align:center;">
                <input type="text" class="serie-info-input" data-serie="${s.key}" data-campo="ano"
                    value="${info.ano || ''}" style="width:100%;border:1px solid #d1d5db;border-radius:4px;padding:3px;font-size:11px;text-align:center;" placeholder="Ex: 2023">
            </td>
            <td style="padding:2px;border:1px solid #e5e7eb;">
                <input type="text" class="serie-info-input" data-serie="${s.key}" data-campo="estabelecimento"
                    value="${info.estabelecimento || ''}" style="width:100%;border:1px solid #d1d5db;border-radius:4px;padding:3px;font-size:11px;" placeholder="Nome da escola">
            </td>
            <td style="padding:2px;border:1px solid #e5e7eb;">
                <input type="text" class="serie-info-input" data-serie="${s.key}" data-campo="cidadeUf"
                    value="${info.cidadeUf || ''}" style="width:100%;border:1px solid #d1d5db;border-radius:4px;padding:3px;font-size:11px;text-align:center;" placeholder="CIDADE-UF">
            </td>
        </tr>`;
    });

    html += `</tbody></table></div>`;

    // Autenticação e Observações
    html += `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:12px;">
        <div>
            <label style="font-weight:600;font-size:13px;display:block;margin-bottom:4px;">Nº de Registro / Autenticação</label>
            <input type="text" id="histRegistro" class="form-control" style="font-size:12px;" value="${HIST_STATE.historicoAtual?.registro || ''}" placeholder="Nº de registro">
        </div>
        <div>
            <label style="font-weight:600;font-size:13px;display:block;margin-bottom:4px;">Data de Emissão</label>
            <input type="text" id="histDataEmissao" class="form-control" style="font-size:12px;" value="${HIST_STATE.historicoAtual?.dataEmissao || ''}" placeholder="Ex: Curimatá-PI, 22 de dezembro de 2025">
        </div>
    </div>

    <div style="margin-top:12px;">
        <label style="font-weight:600;font-size:13px;display:block;margin-bottom:4px;">Observações</label>
        <textarea id="histObservacoes" class="form-control" rows="2" style="font-size:12px;">${HIST_STATE.historicoAtual?.observacoes || ''}</textarea>
    </div>

    <div style="display:flex;gap:8px;justify-content:flex-end;align-items:center;margin-top:16px;padding-top:12px;border-top:1px solid #e5e7eb;">
        <button class="btn btn-secondary" onclick="abrirFichaIndividual()" style="font-size:13px;padding:8px 16px;">
            📝 Ficha Individual (Verso)
        </button>
        <button class="btn btn-primary" onclick="salvarNotasHistorico()" style="font-size:14px;padding:10px 24px;font-weight:700;">
            💾 Salvar Notas
        </button>
    </div>`;

    container.innerHTML = html;
}

async function carregarHistoricoAluno() {
    const alunoId = document.getElementById('histAluno').value;
    const gradeId = document.getElementById('histGrade').value;
    const tipo = document.getElementById('histTipo').value;
    if (!alunoId || !gradeId || !tipo) return;

    HIST_STATE.historicoAtual = null;
    const token = localStorage.getItem('token');

    try {
        const resp = await fetch(`${API_URL}/historicos?aluno=${alunoId}&tipo=${tipo}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await resp.json();

        if (data.success && data.historicos.length) {
            // Carregar o histórico completo
            const histId = data.historicos[0]._id;
            const resp2 = await fetch(`${API_URL}/historicos/${histId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data2 = await resp2.json();
            if (data2.success) {
                HIST_STATE.historicoAtual = data2.historico;
                renderizarTabelaNotas(HIST_STATE.gradeAtual, data2.historico.notas || {});
                return;
            }
        }
        // Sem histórico existente - manter tabela limpa
        if (HIST_STATE.gradeAtual) {
            renderizarTabelaNotas(HIST_STATE.gradeAtual, {});
        }
    } catch (e) {
        console.error('Erro ao carregar histórico do aluno:', e);
    }
}

async function salvarNotasHistorico() {
    const alunoId = document.getElementById('histAluno').value;
    const gradeId = document.getElementById('histGrade').value;
    const tipo = document.getElementById('histTipo').value;

    if (!alunoId) { mostrarNotificacao('Selecione um aluno.', 'error'); return; }
    if (!gradeId) { mostrarNotificacao('Selecione uma grade.', 'error'); return; }

    // Coletar notas
    const notas = {};
    document.querySelectorAll('.nota-input').forEach(input => {
        const disc = input.dataset.disc;
        const serie = input.dataset.serie;
        const campo = input.dataset.campo;
        const val = input.value.trim();

        if (!notas[disc]) notas[disc] = {};
        if (!notas[disc][serie]) notas[disc][serie] = {};
        if (val !== '') {
            notas[disc][serie][campo] = campo === 'nota' ? parseFloat(val) : parseInt(val);
        }
    });

    // Coletar info das séries
    const seriesInfoMap = {};
    document.querySelectorAll('.serie-info-input').forEach(input => {
        const serie = input.dataset.serie;
        const campo = input.dataset.campo;
        if (!seriesInfoMap[serie]) seriesInfoMap[serie] = { serie };
        seriesInfoMap[serie][campo] = input.value.trim();
    });
    const seriesInfo = Object.values(seriesInfoMap);

    const observacoes = document.getElementById('histObservacoes')?.value || '';
    const registro = document.getElementById('histRegistro')?.value.trim() || '';
    const dataEmissao = document.getElementById('histDataEmissao')?.value.trim() || '';
    const fichaIndividual = HIST_STATE.historicoAtual?.fichaIndividual || [];

    const token = localStorage.getItem('token');
    try {
        const resp = await fetch(`${API_URL}/historicos`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ aluno: alunoId, grade: gradeId, tipo, notas, seriesInfo, observacoes, registro, dataEmissao, fichaIndividual })
        });
        const data = await resp.json();
        if (data.success) {
            mostrarNotificacao(`Notas ${data.atualizado ? 'atualizadas' : 'salvas'} com sucesso!`, 'success');
            HIST_STATE.historicoAtual = { _id: data.historico._id, notas, seriesInfo, observacoes, registro, dataEmissao, fichaIndividual };
            carregarListaHistoricos();
        } else {
            mostrarNotificacao(data.message || 'Erro ao salvar.', 'error');
        }
    } catch (e) {
        mostrarNotificacao('Erro de conexão.', 'error');
    }
}

// ==================== FICHA INDIVIDUAL (VERSO) ====================

function abrirFichaIndividual() {
    if (!HIST_STATE.gradeAtual) {
        mostrarNotificacao('Selecione uma grade primeiro.', 'error');
        return;
    }

    const grade = HIST_STATE.gradeAtual;
    const fichaExistente = HIST_STATE.historicoAtual?.fichaIndividual || [];
    const isFundamental = grade.tipo === 'fundamental';
    const numAvals = 8; // Ambos usam 8 avaliações

    const modal = document.createElement('div');
    modal.className = 'overlay-modal';
    modal.id = 'modalFichaIndividual';
    modal.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.6);z-index:9999;display:flex;align-items:center;justify-content:center;overflow-y:auto;padding:20px;';

    // Determinar qual ano está sendo editado
    const anoAtual = fichaExistente.length ? fichaExistente[0].ano : new Date().getFullYear().toString();

    let html = `
    <div style="background:white;border-radius:16px;padding:28px;max-width:95vw;width:1200px;max-height:90vh;overflow-y:auto;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
            <h2 style="color:#1e3a8a;">📝 Ficha Individual do Rendimento Escolar e Frequência do Aluno</h2>
            <button onclick="this.closest('.overlay-modal').remove()" style="background:none;border:none;font-size:24px;cursor:pointer;">✕</button>
        </div>

        <div style="display:flex;gap:12px;align-items:center;margin-bottom:16px;">
            <label style="font-weight:600;font-size:13px;">ANO:</label>
            <input type="text" id="fichaAno" class="form-control" value="${escapeHtml(anoAtual)}" style="width:100px;font-size:13px;">
            <span style="color:#6b7280;font-size:12px;">Preencher somente em caso de transferência durante o período letivo.</span>
        </div>

        <div style="overflow-x:auto;">
            <table style="width:100%;border-collapse:collapse;font-size:11px;">
                <thead>
                    <tr style="background:#1e3a8a;color:white;">
                        <th rowspan="2" style="padding:6px 8px;border:1px solid #93c5fd;min-width:160px;text-align:left;">DISCIPLINAS</th>
                        <th colspan="${numAvals * 2}" style="padding:4px;border:1px solid #93c5fd;text-align:center;">AVALIAÇÃO / FREQUÊNCIA</th>
                    </tr>
                    <tr style="background:#2563eb;color:white;">`;

    for (let a = 1; a <= numAvals; a++) {
        html += `<th colspan="2" style="padding:4px 2px;border:1px solid #93c5fd;text-align:center;font-size:10px;">${a}ª AVAL</th>`;
    }

    html += `</tr>
                    <tr style="background:#3b82f6;color:white;">
                        <th style="border:1px solid #93c5fd;"></th>`;

    for (let a = 1; a <= numAvals; a++) {
        html += `<th style="padding:2px;border:1px solid #93c5fd;text-align:center;font-size:9px;">Notas</th>
                 <th style="padding:2px;border:1px solid #93c5fd;text-align:center;font-size:9px;">Faltas</th>`;
    }

    html += `</tr></thead><tbody>`;

    // Obter registros existentes
    const fichaAtual = fichaExistente.find(f => f.ano === anoAtual) || {};
    const registros = fichaAtual.registros || [];

    // Listar todas as disciplinas da grade
    const discs = grade.disciplinas || [];
    discs.forEach(disc => {
        const reg = registros.find(r => r.disciplina === disc.nome) || {};
        const avaliacoes = reg.avaliacoes || [];

        html += `<tr>
            <td style="padding:3px 6px;border:1px solid #e5e7eb;font-size:11px;white-space:nowrap;">${escapeHtml(disc.nome)}</td>`;

        for (let a = 1; a <= numAvals; a++) {
            const av = avaliacoes.find(x => x.num === a) || {};
            html += `<td style="padding:1px;border:1px solid #e5e7eb;text-align:center;">
                <input type="number" step="0.01" min="0" max="10" class="ficha-input" data-disc="${escapeHtml(disc.nome)}" data-aval="${a}" data-campo="nota"
                    value="${av.nota !== undefined ? av.nota : ''}" style="width:42px;text-align:center;border:1px solid #d1d5db;border-radius:3px;padding:2px;font-size:10px;">
            </td>
            <td style="padding:1px;border:1px solid #e5e7eb;text-align:center;">
                <input type="number" min="0" class="ficha-input" data-disc="${escapeHtml(disc.nome)}" data-aval="${a}" data-campo="faltas"
                    value="${av.faltas !== undefined ? av.faltas : ''}" style="width:42px;text-align:center;border:1px solid #d1d5db;border-radius:3px;padding:2px;font-size:10px;">
            </td>`;
        }
        html += `</tr>`;
    });

    html += `</tbody></table></div>

        <div style="margin-top:12px;">
            <label style="font-weight:600;font-size:13px;display:block;margin-bottom:4px;">Observação (Ficha Individual)</label>
            <textarea id="fichaObservacao" class="form-control" rows="2" style="font-size:12px;">${fichaAtual.observacao || ''}</textarea>
        </div>

        <div style="display:flex;gap:10px;justify-content:flex-end;margin-top:16px;border-top:2px solid #e5e7eb;padding-top:12px;">
            <button class="btn btn-secondary" onclick="this.closest('.overlay-modal').remove()">Cancelar</button>
            <button class="btn btn-primary" onclick="salvarFichaIndividual()">💾 Salvar Ficha</button>
        </div>
    </div>`;

    modal.innerHTML = html;
    document.body.appendChild(modal);
    modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });
}

function salvarFichaIndividual() {
    const ano = document.getElementById('fichaAno')?.value.trim() || '';
    const observacao = document.getElementById('fichaObservacao')?.value || '';
    const numAvals = 8;

    // Coletar dados da ficha
    const registrosMap = {};
    document.querySelectorAll('.ficha-input').forEach(input => {
        const disc = input.dataset.disc;
        const aval = parseInt(input.dataset.aval);
        const campo = input.dataset.campo;
        const val = input.value.trim();

        if (!registrosMap[disc]) registrosMap[disc] = { disciplina: disc, avaliacoes: [] };

        let av = registrosMap[disc].avaliacoes.find(a => a.num === aval);
        if (!av) {
            av = { num: aval };
            registrosMap[disc].avaliacoes.push(av);
        }
        if (val !== '') {
            av[campo] = campo === 'nota' ? parseFloat(val) : parseInt(val);
        }
    });

    const registros = Object.values(registrosMap);
    const fichaEntry = { ano, registros, observacao };

    // Atualizar no HIST_STATE
    if (!HIST_STATE.historicoAtual) {
        HIST_STATE.historicoAtual = {};
    }

    let fichaArr = HIST_STATE.historicoAtual.fichaIndividual || [];
    const idx = fichaArr.findIndex(f => f.ano === ano);
    if (idx >= 0) {
        fichaArr[idx] = fichaEntry;
    } else {
        fichaArr.push(fichaEntry);
    }
    HIST_STATE.historicoAtual.fichaIndividual = fichaArr;

    document.getElementById('modalFichaIndividual')?.remove();
    mostrarNotificacao('Ficha Individual salva localmente. Clique em "Salvar Notas" para persistir.', 'success');
}

// ==================== CRIAR GRADES POR TURMA (2025) ====================

async function criarGradesTurmas2025() {
    const token = localStorage.getItem('token');
    if (!token) { mostrarNotificacao('Faça login primeiro!', 'error'); return; }

    if (!confirm('Criar 4 grades de disciplinas para as turmas de 2025?\n\n• EFP-FUND II - 9° ANO - I-A\n• EMRINTEGRAL - 3ª SÉRIE I-A\n• EMTPDES-SIS - 3ª SÉRIE 1-A\n• EMTPDES-SIS - 3ª SÉRIE 1-B\n\nApós criar, você pode editar cada grade pela interface.')) return;

    const grades = [
        // ========== TURMA 1: FUNDAMENTAL 9° ANO ==========
        {
            tipo: 'fundamental',
            nome: 'EFP-FUND II ANOS FINAIS INT - 9° ANO - I-A',
            numSeries: 9,
            nomesSeries: ['1º Ano', '2º Ano', '3º Ano', '4º Ano', '5º Ano', '6º Ano', '7º Ano', '8º Ano', '9º Ano'],
            disciplinas: [
                // Linguagens, Códigos e Suas Tecnologias
                { nome: 'Língua Portuguesa', categoria: 'linguagens', cargaHorariaPadrao: 0 },
                { nome: 'Leitura, Interpretação e Produção Textual', categoria: 'linguagens', cargaHorariaPadrao: 0 },
                { nome: 'Arte', categoria: 'linguagens', cargaHorariaPadrao: 0 },
                { nome: 'Educação Física', categoria: 'linguagens', cargaHorariaPadrao: 0 },
                // Ciências Humanas e Suas Tecnologias
                { nome: 'História', categoria: 'ciencias_humanas', cargaHorariaPadrao: 0 },
                { nome: 'Geografia', categoria: 'ciencias_humanas', cargaHorariaPadrao: 0 },
                { nome: 'História e Cultura Afro-Brasileira e Indígena', categoria: 'ciencias_humanas', cargaHorariaPadrao: 0 },
                // Ciências da Natureza e Suas Tecnologias
                { nome: 'Física', categoria: 'ciencias_natureza', cargaHorariaPadrao: 0 },
                { nome: 'Química', categoria: 'ciencias_natureza', cargaHorariaPadrao: 0 },
                { nome: 'Biologia', categoria: 'ciencias_natureza', cargaHorariaPadrao: 0 },
                // Matemática e Suas Tecnologias
                { nome: 'Matemática', categoria: 'matematica', cargaHorariaPadrao: 0 },
                // Parte Flexível (Diversificada)
                { nome: 'Língua Inglesa', categoria: 'parte_flexivel', cargaHorariaPadrao: 0 },
                { nome: 'Computação', categoria: 'parte_flexivel', cargaHorariaPadrao: 0 },
                { nome: 'Inteligência Artificial', categoria: 'parte_flexivel', cargaHorariaPadrao: 0 },
                { nome: 'Esporte (Clube de Leitura ou Robótica - Eletiva Obrigatória)', categoria: 'parte_flexivel', cargaHorariaPadrao: 0 },
                { nome: 'Aprendizagem Interdisciplinar', categoria: 'parte_flexivel', cargaHorariaPadrao: 0 },
                { nome: 'Matemática/Recomposição da Aprendizagem', categoria: 'parte_flexivel', cargaHorariaPadrao: 0 },
                { nome: 'Língua Portuguesa/Recomposição da Aprendizagem', categoria: 'parte_flexivel', cargaHorariaPadrao: 0 },
                { nome: 'Acompanhamento Pedagógico', categoria: 'parte_flexivel', cargaHorariaPadrao: 0 },
                { nome: 'Música/Dança/Teatro/Esporte', categoria: 'parte_flexivel', cargaHorariaPadrao: 0 },
                { nome: 'Horário de Estudo', categoria: 'parte_flexivel', cargaHorariaPadrao: 0 },
                { nome: 'Projeto de Vida', categoria: 'parte_flexivel', cargaHorariaPadrao: 0 },
                // Ensino Religioso
                { nome: 'Ensino Religioso', categoria: 'ensino_religioso', cargaHorariaPadrao: 0 },
            ]
        },

        // ========== TURMA 2: ENSINO MÉDIO REGULAR INTEGRAL ==========
        {
            tipo: 'medio',
            nome: 'EMRINTEGRAL - 3ª SÉRIE I-A',
            numSeries: 3,
            nomesSeries: ['1ª Série', '2ª Série', '3ª Série'],
            disciplinas: [
                // Formação Geral Básica
                { nome: 'Língua Portuguesa', categoria: 'formacao_geral', cargaHorariaPadrao: 0 },
                { nome: 'Arte', categoria: 'formacao_geral', cargaHorariaPadrao: 0 },
                { nome: 'Educação Física', categoria: 'formacao_geral', cargaHorariaPadrao: 0 },
                { nome: 'Língua Estrangeira Inglês', categoria: 'formacao_geral', cargaHorariaPadrao: 0 },
                { nome: 'Língua Estrangeira Espanhol', categoria: 'formacao_geral', cargaHorariaPadrao: 0 },
                { nome: 'Matemática', categoria: 'formacao_geral', cargaHorariaPadrao: 0 },
                { nome: 'Física', categoria: 'formacao_geral', cargaHorariaPadrao: 0 },
                { nome: 'Química', categoria: 'formacao_geral', cargaHorariaPadrao: 0 },
                { nome: 'Biologia', categoria: 'formacao_geral', cargaHorariaPadrao: 0 },
                { nome: 'História', categoria: 'formacao_geral', cargaHorariaPadrao: 0 },
                { nome: 'Geografia', categoria: 'formacao_geral', cargaHorariaPadrao: 0 },
                { nome: 'Filosofia', categoria: 'formacao_geral', cargaHorariaPadrao: 0 },
                { nome: 'Sociologia', categoria: 'formacao_geral', cargaHorariaPadrao: 0 },
                // Itinerários Formativos
                { nome: 'Inteligência Artificial Aplicada a Automação', categoria: 'itinerarios', cargaHorariaPadrao: 0 },
                { nome: 'Inteligência Artificial', categoria: 'itinerarios', cargaHorariaPadrao: 0 },
                { nome: 'Língua Inglesa', categoria: 'itinerarios', cargaHorariaPadrao: 0 },
                { nome: 'Leitura e Produção Textual', categoria: 'itinerarios', cargaHorariaPadrao: 0 },
                { nome: 'Matemática/Recomposição da Aprendizagem', categoria: 'itinerarios', cargaHorariaPadrao: 0 },
                { nome: 'Percursos de Aprofundamento - Língua Portuguesa', categoria: 'itinerarios', cargaHorariaPadrao: 0 },
                { nome: 'Orientação Profissional e Empreendedorismo', categoria: 'itinerarios', cargaHorariaPadrao: 0 },
                { nome: 'Língua Inglesa - Aprofundamento', categoria: 'itinerarios', cargaHorariaPadrao: 0 },
                { nome: 'Música/Dança/Teatro/Esporte', categoria: 'itinerarios', cargaHorariaPadrao: 0 },
                { nome: 'Biologia - Aprofundamento', categoria: 'itinerarios', cargaHorariaPadrao: 0 },
                { nome: 'Física - Aprofundamento', categoria: 'itinerarios', cargaHorariaPadrao: 0 },
                { nome: 'Química - Aprofundamento', categoria: 'itinerarios', cargaHorariaPadrao: 0 },
                { nome: 'Língua Espanhola', categoria: 'itinerarios', cargaHorariaPadrao: 0 },
                { nome: 'Projeto de Vida e Empreendedorismo', categoria: 'itinerarios', cargaHorariaPadrao: 0 },
                { nome: 'Língua Portuguesa/Recomposição da Aprendizagem', categoria: 'itinerarios', cargaHorariaPadrao: 0 },
                { nome: 'Horário de Estudo', categoria: 'itinerarios', cargaHorariaPadrao: 0 },
                { nome: 'Internet das Coisas - IoT', categoria: 'itinerarios', cargaHorariaPadrao: 0 },
                // Atividades Integradoras
                { nome: 'Atividades Integradoras - Esporte Integrado a Educação Física', categoria: 'atividades_integradoras', cargaHorariaPadrao: 0 },
                { nome: 'Atividades Integradoras - Inteligência Artificial', categoria: 'atividades_integradoras', cargaHorariaPadrao: 0 },
                { nome: 'Teste de Sistemas e Segurança de Dados', categoria: 'atividades_integradoras', cargaHorariaPadrao: 0 },
                { nome: 'Atividades Integradoras - Monitoria/Horário de Estudo', categoria: 'atividades_integradoras', cargaHorariaPadrao: 0 },
                { nome: 'Atividades Integradoras - Cultura Integrada a Arte', categoria: 'atividades_integradoras', cargaHorariaPadrao: 0 },
                { nome: 'Projeto Integrador', categoria: 'atividades_integradoras', cargaHorariaPadrao: 0 },
                { nome: 'Atividades Integradoras - Educação do Trânsito', categoria: 'atividades_integradoras', cargaHorariaPadrao: 0 },
            ]
        },

        // ========== TURMA 3: ENSINO MÉDIO TÉCNICO 1-A ==========
        {
            tipo: 'medio',
            nome: 'EMTPDES-SIS - 3ª SÉRIE INTEGRAL 1-A',
            numSeries: 3,
            nomesSeries: ['1ª Série', '2ª Série', '3ª Série'],
            disciplinas: [
                // Formação Geral Básica
                { nome: 'Língua Portuguesa', categoria: 'formacao_geral', cargaHorariaPadrao: 0 },
                { nome: 'Arte', categoria: 'formacao_geral', cargaHorariaPadrao: 0 },
                { nome: 'Educação Física', categoria: 'formacao_geral', cargaHorariaPadrao: 0 },
                { nome: 'Língua Estrangeira Inglês', categoria: 'formacao_geral', cargaHorariaPadrao: 0 },
                { nome: 'Língua Estrangeira Espanhol', categoria: 'formacao_geral', cargaHorariaPadrao: 0 },
                { nome: 'Matemática', categoria: 'formacao_geral', cargaHorariaPadrao: 0 },
                { nome: 'Física', categoria: 'formacao_geral', cargaHorariaPadrao: 0 },
                { nome: 'Química', categoria: 'formacao_geral', cargaHorariaPadrao: 0 },
                { nome: 'Biologia', categoria: 'formacao_geral', cargaHorariaPadrao: 0 },
                { nome: 'História', categoria: 'formacao_geral', cargaHorariaPadrao: 0 },
                { nome: 'Geografia', categoria: 'formacao_geral', cargaHorariaPadrao: 0 },
                { nome: 'Filosofia', categoria: 'formacao_geral', cargaHorariaPadrao: 0 },
                { nome: 'Sociologia', categoria: 'formacao_geral', cargaHorariaPadrao: 0 },
                // Itinerários Formativos
                { nome: 'Inteligência Artificial Aplicada a Automação', categoria: 'itinerarios', cargaHorariaPadrao: 0 },
                { nome: 'Percursos de Aprofundamento - Língua Portuguesa', categoria: 'itinerarios', cargaHorariaPadrao: 0 },
                { nome: 'Orientação Profissional', categoria: 'itinerarios', cargaHorariaPadrao: 0 },
                { nome: 'Empreendedorismo', categoria: 'itinerarios', cargaHorariaPadrao: 0 },
                { nome: 'Percursos de Aprofundamento - Ciências da Natureza', categoria: 'itinerarios', cargaHorariaPadrao: 0 },
                { nome: 'Língua Portuguesa/Recomposição da Aprendizagem', categoria: 'itinerarios', cargaHorariaPadrao: 0 },
                { nome: 'Educação Física - Percursos de Aprofundamento/Matemática', categoria: 'itinerarios', cargaHorariaPadrao: 0 },
                { nome: 'Internet das Coisas - IoT', categoria: 'itinerarios', cargaHorariaPadrao: 0 },
                // Atividades Integradoras
                { nome: 'Atividades Integradoras - Esporte Integrado a Educação Física', categoria: 'atividades_integradoras', cargaHorariaPadrao: 0 },
                { nome: 'Atividades Integradoras - Inteligência Artificial', categoria: 'atividades_integradoras', cargaHorariaPadrao: 0 },
                { nome: 'Teste de Sistemas e Segurança de Dados', categoria: 'atividades_integradoras', cargaHorariaPadrao: 0 },
                { nome: 'Atividades Integradoras - Monitoria/Horário de Estudo', categoria: 'atividades_integradoras', cargaHorariaPadrao: 0 },
                { nome: 'Atividades Integradoras - Cultura Integrada a Arte', categoria: 'atividades_integradoras', cargaHorariaPadrao: 0 },
                { nome: 'Projeto Integrador', categoria: 'atividades_integradoras', cargaHorariaPadrao: 0 },
                { nome: 'Atividades Integradoras - Educação do Trânsito', categoria: 'atividades_integradoras', cargaHorariaPadrao: 0 },
            ]
        },

        // ========== TURMA 4: ENSINO MÉDIO TÉCNICO 1-B ==========
        {
            tipo: 'medio',
            nome: 'EMTPDES-SIS - 3ª SÉRIE INTEGRAL 1-B',
            numSeries: 3,
            nomesSeries: ['1ª Série', '2ª Série', '3ª Série'],
            disciplinas: [
                // Formação Geral Básica
                { nome: 'Língua Portuguesa', categoria: 'formacao_geral', cargaHorariaPadrao: 0 },
                { nome: 'Arte', categoria: 'formacao_geral', cargaHorariaPadrao: 0 },
                { nome: 'Educação Física', categoria: 'formacao_geral', cargaHorariaPadrao: 0 },
                { nome: 'Língua Estrangeira Inglês', categoria: 'formacao_geral', cargaHorariaPadrao: 0 },
                { nome: 'Língua Estrangeira Espanhol', categoria: 'formacao_geral', cargaHorariaPadrao: 0 },
                { nome: 'Matemática', categoria: 'formacao_geral', cargaHorariaPadrao: 0 },
                { nome: 'Física', categoria: 'formacao_geral', cargaHorariaPadrao: 0 },
                { nome: 'Química', categoria: 'formacao_geral', cargaHorariaPadrao: 0 },
                { nome: 'Biologia', categoria: 'formacao_geral', cargaHorariaPadrao: 0 },
                { nome: 'História', categoria: 'formacao_geral', cargaHorariaPadrao: 0 },
                { nome: 'Geografia', categoria: 'formacao_geral', cargaHorariaPadrao: 0 },
                { nome: 'Filosofia', categoria: 'formacao_geral', cargaHorariaPadrao: 0 },
                { nome: 'Sociologia', categoria: 'formacao_geral', cargaHorariaPadrao: 0 },
                // Itinerários Formativos
                { nome: 'Inteligência Artificial Aplicada a Automação', categoria: 'itinerarios', cargaHorariaPadrao: 0 },
                { nome: 'Percursos de Aprofundamento - Língua Portuguesa', categoria: 'itinerarios', cargaHorariaPadrao: 0 },
                { nome: 'Orientação Profissional', categoria: 'itinerarios', cargaHorariaPadrao: 0 },
                { nome: 'Empreendedorismo', categoria: 'itinerarios', cargaHorariaPadrao: 0 },
                { nome: 'Percursos de Aprofundamento - Ciências da Natureza', categoria: 'itinerarios', cargaHorariaPadrao: 0 },
                { nome: 'Língua Portuguesa/Recomposição da Aprendizagem', categoria: 'itinerarios', cargaHorariaPadrao: 0 },
                { nome: 'Educação Física - Percursos de Aprofundamento/Matemática', categoria: 'itinerarios', cargaHorariaPadrao: 0 },
                { nome: 'Internet das Coisas - IoT', categoria: 'itinerarios', cargaHorariaPadrao: 0 },
                // Atividades Integradoras
                { nome: 'Atividades Integradoras - Esporte Integrado a Educação Física', categoria: 'atividades_integradoras', cargaHorariaPadrao: 0 },
                { nome: 'Atividades Integradoras - Inteligência Artificial', categoria: 'atividades_integradoras', cargaHorariaPadrao: 0 },
                { nome: 'Teste de Sistemas e Segurança de Dados', categoria: 'atividades_integradoras', cargaHorariaPadrao: 0 },
                { nome: 'Atividades Integradoras - Monitoria/Horário de Estudo', categoria: 'atividades_integradoras', cargaHorariaPadrao: 0 },
                { nome: 'Atividades Integradoras - Cultura Integrada a Arte', categoria: 'atividades_integradoras', cargaHorariaPadrao: 0 },
                { nome: 'Projeto Integrador', categoria: 'atividades_integradoras', cargaHorariaPadrao: 0 },
                { nome: 'Atividades Integradoras - Educação do Trânsito', categoria: 'atividades_integradoras', cargaHorariaPadrao: 0 },
            ]
        },
    ];

    let criadas = 0;
    for (const grade of grades) {
        try {
            const resp = await fetch(`${API_URL}/historicos/grades`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(grade)
            });
            const data = await resp.json();
            if (data.success) {
                criadas++;
            } else {
                console.error(`❌ Erro: ${grade.nome} - ${data.message}`);
            }
        } catch (e) {
            console.error(`❌ Falha: ${grade.nome}`, e);
        }
    }

    carregarListaGrades();
    mostrarNotificacao(`${criadas} de ${grades.length} grades criadas com sucesso! Verifique e ajuste as disciplinas se necessário.`, criadas === grades.length ? 'success' : 'warning');
}

// ==================== LISTA DE HISTÓRICOS SALVOS ====================

async function carregarListaHistoricos() {
    const container = document.getElementById('listaHistoricos');
    const token = localStorage.getItem('token');
    if (!token || !container) return;

    container.innerHTML = '<div style="text-align:center;padding:20px;color:#9ca3af;">Carregando...</div>';

    try {
        const tipo = document.getElementById('histTipo')?.value || '';
        const url = `${API_URL}/historicos` + (tipo ? `?tipo=${tipo}` : '');
        const resp = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } });
        const data = await resp.json();

        if (!data.success || !data.historicos.length) {
            container.innerHTML = '<div style="text-align:center;padding:30px;color:#9ca3af;">Nenhum histórico salvo ainda.</div>';
            document.getElementById('btnGerarHistPDF').disabled = true;
            HIST_STATE.alunosComHistorico = new Set();
            filtrarListaAlunosHistorico();
            return;
        }

        let html = `<table style="width:100%;border-collapse:collapse;font-size:13px;">
            <thead>
                <tr style="background:#1e3a8a;color:white;">
                    <th style="padding:8px;border:1px solid #93c5fd;width:36px;text-align:center;">
                        <input type="checkbox" id="checkTodosHistoricos" onchange="toggleTodosHistoricos(this.checked)">
                    </th>
                    <th style="padding:8px 10px;border:1px solid #93c5fd;text-align:left;">Aluno</th>
                    <th style="padding:8px 10px;border:1px solid #93c5fd;text-align:center;">Modalidade</th>
                    <th style="padding:8px 10px;border:1px solid #93c5fd;text-align:left;">Grade</th>
                    <th style="padding:8px 10px;border:1px solid #93c5fd;text-align:center;">Atualizado</th>
                    <th style="padding:8px 10px;border:1px solid #93c5fd;text-align:center;">Ações</th>
                </tr>
            </thead>
            <tbody>`;

        data.historicos.forEach(h => {
            const sel = HIST_STATE.historicosSelecionados.has(h._id);
            const dt = new Date(h.atualizadoEm || h.criadoEm).toLocaleDateString('pt-BR');
            html += `<tr style="border-bottom:1px solid #e5e7eb;">
                <td style="padding:6px;border:1px solid #e5e7eb;text-align:center;">
                    <input type="checkbox" class="check-hist" value="${h._id}" ${sel ? 'checked' : ''}
                        onchange="toggleHistoricoSel('${h._id}', this.checked)">
                </td>
                <td style="padding:6px 10px;border:1px solid #e5e7eb;">${escapeHtml(h.aluno?.nome || '—')}</td>
                <td style="padding:6px 10px;border:1px solid #e5e7eb;text-align:center;">
                    <span style="background:${h.tipo==='medio'?'#dbeafe':'#d1fae5'};color:${h.tipo==='medio'?'#1e40af':'#065f46'};
                        padding:2px 8px;border-radius:6px;font-size:11px;font-weight:600;">
                        ${h.tipo==='medio'?'MÉDIO':'FUNDAMENTAL'}
                    </span>
                </td>
                <td style="padding:6px 10px;border:1px solid #e5e7eb;font-size:12px;">${escapeHtml(h.grade?.nome||'—')}</td>
                <td style="padding:6px 10px;border:1px solid #e5e7eb;text-align:center;font-size:12px;">${dt}</td>
                <td style="padding:4px 6px;border:1px solid #e5e7eb;">
                    <div style="display:flex;gap:3px;justify-content:center;align-items:center;">
                        <button class="btn btn-primary btn-sm" onclick="editarHistorico('${h._id}')"
                            style="font-size:11px;padding:3px 9px;" title="Editar">✏️</button>
                        <button class="btn btn-secondary btn-sm" onclick="previewHistorico('${h._id}')"
                            style="font-size:11px;padding:3px 9px;" title="Pré-visualizar">👁️</button>
                        <button class="btn btn-danger btn-sm" onclick="excluirHistorico('${h._id}')"
                            style="font-size:11px;padding:3px 9px;" title="Excluir">🗑️</button>
                    </div>
                </td>
            </tr>`;
        });

        html += `</tbody></table>`;
        container.innerHTML = html;
        _atualizarBtnHistPDF();
        // Atualizar lista de alunos com histórico salvo (para ocultar da lista de cima)
        HIST_STATE.alunosComHistorico = new Set(
            data.historicos.map(h => h.aluno?._id || h.aluno).filter(Boolean)
        );
        filtrarListaAlunosHistorico();
    } catch (e) {
        container.innerHTML = '<div style="text-align:center;padding:20px;color:#ef4444;">Erro ao carregar históricos.</div>';
    }
}

function toggleHistoricoSel(id, checked) {
    checked ? HIST_STATE.historicosSelecionados.add(id) : HIST_STATE.historicosSelecionados.delete(id);
    const cbs = [...document.querySelectorAll('.check-hist')];
    const chkAll = document.getElementById('checkTodosHistoricos');
    if (chkAll) chkAll.checked = cbs.length > 0 && cbs.every(cb => cb.checked);
    _atualizarBtnHistPDF();
}

function toggleTodosHistoricos(checked) {
    document.querySelectorAll('.check-hist').forEach(cb => {
        cb.checked = checked;
        checked ? HIST_STATE.historicosSelecionados.add(cb.value) : HIST_STATE.historicosSelecionados.delete(cb.value);
    });
    _atualizarBtnHistPDF();
}

function _atualizarBtnHistPDF() {
    const btn = document.getElementById('btnGerarHistPDF');
    if (btn) btn.disabled = HIST_STATE.historicosSelecionados.size === 0;
}

async function excluirHistorico(id) {
    if (!confirm('Excluir este histórico? Esta ação não pode ser desfeita.')) return;
    const token = localStorage.getItem('token');
    try {
        const resp = await fetch(`${API_URL}/historicos/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await resp.json();
        if (data.success) {
            HIST_STATE.historicosSelecionados.delete(id);
            mostrarNotificacao('Histórico excluído.', 'success');
            carregarListaHistoricos();
        } else {
            mostrarNotificacao(data.message || 'Erro ao excluir.', 'error');
        }
    } catch (e) {
        mostrarNotificacao('Erro de conexão.', 'error');
    }
}

async function editarHistorico(id) {
    const token = localStorage.getItem('token');
    mostrarNotificacao('Carregando histórico para edição...', 'info');
    try {
        const resp = await fetch(`${API_URL}/historicos/${id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await resp.json();
        if (!data.success) { mostrarNotificacao(data.message || 'Erro ao carregar histórico.', 'error'); return; }

        const hist = data.historico;
        HIST_STATE.historicoAtual = hist;

        // 1. Definir modalidade e carregar grades do tipo correto
        const selTipo = document.getElementById('histTipo');
        if (selTipo) selTipo.value = hist.tipo;

        // 2. Carregar grades e depois selecionar a grade correta
        await carregarGradesParaNotasAsync(hist.tipo);

        const selGrade = document.getElementById('histGrade');
        if (selGrade) selGrade.value = hist.grade?._id || hist.grade;

        // 3. Carregar o form de notas com a grade selecionada
        await carregarFormNotasAsync();

        // 4. Preencher notas existentes
        if (HIST_STATE.gradeAtual) {
            renderizarTabelaNotas(HIST_STATE.gradeAtual, hist.notas || {});
        }

        // 5. Restaurar campos extras
        const reg = document.getElementById('histRegistro');
        if (reg) reg.value = hist.registro || '';
        const emissao = document.getElementById('histDataEmissao');
        if (emissao) emissao.value = hist.dataEmissao || '';
        const obs = document.getElementById('histObservacoes');
        if (obs) obs.value = hist.observacoes || '';

        // 6. Selecionar aluno na barra de seleção
        const aluno = hist.aluno || {};
        const hiddenInput = document.getElementById('histAluno');
        if (hiddenInput) hiddenInput.value = aluno._id || aluno;
        const infoBar = document.getElementById('alunoHistoricoSelecionado');
        const nomeEl = document.getElementById('alunoHistoricoNome');
        if (infoBar && nomeEl) {
            nomeEl.textContent = aluno.nome || 'Aluno';
            infoBar.style.display = 'flex';
        }
        filtrarListaAlunosHistorico();

        // 7. Mostrar form e navegar
        const formNotas = document.getElementById('formNotas');
        if (formNotas) formNotas.style.display = 'block';

        // Ir para a aba histórico e rolar até o form de notas
        navegarParaTab('historico');
        setTimeout(() => {
            formNotas?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 200);

        mostrarNotificacao(`Editando histórico de ${aluno.nome || 'aluno'}. Faça as alterações e clique em "Salvar Notas".`, 'success');
    } catch (e) {
        console.error('Erro ao editar histórico:', e);
        mostrarNotificacao('Erro de conexão.', 'error');
    }
}

// Versão assíncrona de carregarGradesParaNotas que resolve quando termina
async function carregarGradesParaNotasAsync(tipo) {
    const sel = document.getElementById('histGrade');
    if (sel) sel.innerHTML = '<option value="">Carregando...</option>';
    document.getElementById('formNotas').style.display = 'none';
    carregarListaHistoricos();
    if (!tipo) { if (sel) sel.innerHTML = '<option value="">Selecione a modalidade...</option>'; return; }
    const token = localStorage.getItem('token');
    try {
        const resp = await fetch(`${API_URL}/historicos/grades?tipo=${tipo}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await resp.json();
        if (data.success && data.grades.length) {
            sel.innerHTML = '<option value="">Selecione a grade...</option>';
            data.grades.forEach(g => {
                sel.innerHTML += `<option value="${g._id}">${escapeHtml(g.nome)} (${g.disciplinas.length} disc.)</option>`;
            });
        } else {
            sel.innerHTML = '<option value="">Nenhuma grade para esta modalidade</option>';
        }
    } catch (e) {
        sel.innerHTML = '<option value="">Erro ao carregar</option>';
    }
}

// Versão assíncrona de carregarFormNotas que resolve quando termina
async function carregarFormNotasAsync() {
    const gradeId = document.getElementById('histGrade').value;
    const container = document.getElementById('formNotas');
    if (!gradeId) { container.style.display = 'none'; return; }
    const token = localStorage.getItem('token');
    try {
        const resp = await fetch(`${API_URL}/historicos/grades/${gradeId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await resp.json();
        if (!data.success) return;
        HIST_STATE.gradeAtual = data.grade;
        renderizarTabelaNotas(data.grade, {});
        container.style.display = 'block';
    } catch (e) {
        mostrarNotificacao('Erro ao carregar grade.', 'error');
    }
}

// ==================== GERAÇÃO DE PDF ====================

// ==================== PRÉ-VISUALIZAÇÃO ====================

let _histPreviewBlobUrl = null; // guarda a URL atual para abrir em nova página

async function previewHistorico(id) {
    if (!window.jspdf?.jsPDF) {
        mostrarNotificacao('Biblioteca jsPDF não carregada. Recarregue a página.', 'error');
        return;
    }
    const token = localStorage.getItem('token');
    mostrarNotificacao('Gerando pré-visualização...', 'info');

    try {
        const resp = await fetch(`${API_URL}/historicos/${id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await resp.json();
        if (!data.success) { mostrarNotificacao('Histórico não encontrado.', 'error'); return; }

        const hist = data.historico;
        const cfg = obterConfigHist();
        const { jsPDF } = window.jspdf;
const isMedioPreview = hist.tipo === 'medio';
    const pdf = new jsPDF({ orientation: isMedioPreview ? 'landscape' : 'portrait', unit: 'mm', format: 'a4' });

        _histFrente(pdf, hist, cfg);
        pdf.addPage({ orientation: isMedioPreview ? 'landscape' : 'portrait' });
        _histVerso(pdf, hist, cfg);

        // Revogar blob anterior para liberar memória
        if (_histPreviewBlobUrl) URL.revokeObjectURL(_histPreviewBlobUrl);
        _histPreviewBlobUrl = URL.createObjectURL(pdf.output('blob'));

        const card = document.getElementById('histPreviewCard');
        const frame = document.getElementById('histPreviewFrame');
        const label = document.getElementById('histPreviewNomeAluno');

        if (card) card.style.display = '';
        if (frame) frame.src = _histPreviewBlobUrl;
        if (label) label.textContent = `Aluno: ${hist.aluno?.nome || '—'}`;

        setTimeout(() => {
            if (card) card.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 200);

        mostrarNotificacao('Pré-visualização pronta!', 'success');
    } catch (e) {
        console.error('Erro ao gerar pré-visualização:', e);
        mostrarNotificacao('Erro ao gerar pré-visualização.', 'error');
    }
}

function _atualizarOrientacaoHist(tipo) {
    const sel = document.getElementById('histOrientacao');
    if (!sel) return;
    sel.value = tipo === 'medio' ? 'landscape' : 'portrait';
}

function _getOrientacaoHist(hist) {
    const sel = document.getElementById('histOrientacao');
    if (sel && sel.value) return sel.value;
    return (hist?.tipo === 'medio') ? 'landscape' : 'portrait';
}

function fecharHistPreview() {
    const card = document.getElementById('histPreviewCard');
    const frame = document.getElementById('histPreviewFrame');
    if (frame) frame.src = '';
    if (card) card.style.display = 'none';
    if (_histPreviewBlobUrl) { URL.revokeObjectURL(_histPreviewBlobUrl); _histPreviewBlobUrl = null; }
}

function abrirHistPreviewNovaPagina() {
    if (_histPreviewBlobUrl) window.open(_histPreviewBlobUrl, '_blank');
    else mostrarNotificacao('Gere uma pré-visualização primeiro.', 'error');
}

// ==================== GERAÇÃO DE PDF ====================

async function gerarHistoricoPDF() {
    const ids = [...HIST_STATE.historicosSelecionados];
    if (!ids.length) { mostrarNotificacao('Selecione pelo menos um histórico.', 'error'); return; }
    if (!window.jspdf?.jsPDF) { mostrarNotificacao('Biblioteca jsPDF não carregada. Recarregue a página.', 'error'); return; }

    mostrarNotificacao(`Gerando ${ids.length} histórico(s)...`, 'info');
    const { jsPDF } = window.jspdf;
    const cfg = obterConfigHist();
    // orientacão será definida por histórico individualmente abaixo
    let pdf = null;
    let primeiroDoc = true;
    const token = localStorage.getItem('token');

    for (const histId of ids) {
        try {
            const resp = await fetch(`${API_URL}/historicos/${histId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await resp.json();
            if (!data.success) continue;

            const hist = data.historico;
            const isMedio = hist.tipo === 'medio';
            if (!primeiroDoc) {
                pdf.addPage({ orientation: isMedio ? 'landscape' : 'portrait' });
            } else {
                pdf = new jsPDF({ orientation: isMedio ? 'landscape' : 'portrait', unit: 'mm', format: 'a4' });
            }
            primeiroDoc = false;

            _histFrente(pdf, hist, cfg);
            pdf.addPage({ orientation: isMedio ? 'landscape' : 'portrait' });
            _histVerso(pdf, hist, cfg);
        } catch (e) {
            console.error('Erro ao gerar histórico:', histId, e);
        }
    }

    const pdfBlob = pdf.output('blob');
    window.open(URL.createObjectURL(pdfBlob), '_blank');
    setTimeout(() => {
        pdf.save(ids.length === 1 ? 'Historico_Escolar.pdf' : `Historicos_${ids.length}.pdf`);
    }, 400);
    mostrarNotificacao(`${ids.length} histórico(s) gerado(s)!`, 'success');
}

// ---------- helpers baixo nível ----------

function _hRect(pdf, x, y, w, h, fill, stroke) {
    if (fill) { pdf.setFillColor(fill[0], fill[1], fill[2]); pdf.rect(x, y, w, h, 'F'); }
    if (stroke) {
        pdf.setDrawColor(stroke[0], stroke[1], stroke[2]);
        pdf.rect(x, y, w, h, 'S');
    }
}

function _hLine(pdf, x1, y1, x2, y2, lw, color) {
    pdf.setLineWidth(lw || 0.2);
    if (color) pdf.setDrawColor(color[0], color[1], color[2]);
    pdf.line(x1, y1, x2, y2);
}

function _hText(pdf, text, x, y, opts) {
    const o = opts || {};
    pdf.setFont(o.font || 'helvetica', o.bold ? 'bold' : 'normal');
    pdf.setFontSize(o.size || 7);
    pdf.setTextColor(...(o.color || [0, 0, 0]));
    pdf.text(String(text ?? ''), x, y, { align: o.align || 'left', angle: o.angle || 0, maxWidth: o.maxWidth });
}

// ---------- Página da frente ----------

function _histFrente(pdf, hist, cfg) {
    const aluno = hist.aluno || {};
    const grade = hist.grade || {};
    const notas = hist.notas || {};
    const seriesInfo = hist.seriesInfo || [];
    const isFund = hist.tipo === 'fundamental';
    const series = grade.nomesSeries || [];
    const numSeries = series.length;

    const isMedio = !isFund;
    const PW = isMedio ? 297 : 210;
    const PH = isMedio ? 210 : 297;
    const ML = 5, MR = 5, MT = 5;
    const UW = PW - ML - MR; // 287mm para médio, 200mm para fundamental
    let y = MT;

    // --- cabeçalho dupla linha ---
    _hLine(pdf, ML, y, PW - MR, y, 0.6, [0, 40, 120]);
    _hLine(pdf, ML, y + 1.3, PW - MR, y + 1.3, 0.2, [0, 40, 120]);
    y += 2.5;

    // brasão / emblema
    const emb = cfg?.emblema || {};
    const tipoEmb = emb.tipo || 'brasao-brasil';
    const bW = Number(emb.largura) || 22;
    const bH = Number(emb.altura) || 26;
    const embQual = Math.min(100, Math.max(1, Number(emb.qualidade) || 100));
    const embCompression = embQual >= 85 ? 'NONE' : embQual >= 65 ? 'FAST' : embQual >= 40 ? 'MEDIUM' : 'SLOW';
    if (tipoEmb !== 'nenhum') {
        try {
            let src = null;
            let fmt = 'PNG';
            if (tipoEmb === 'custom' && typeof HIST_UPLOADS !== 'undefined' && HIST_UPLOADS.emblemaCustom) {
                src = HIST_UPLOADS.emblemaCustom;
                fmt = src.startsWith('data:image/png') ? 'PNG' : 'JPEG';
            } else if (tipoEmb === 'brasao-brasil' && typeof BRASAO_BRASIL !== 'undefined') {
                src = BRASAO_BRASIL;
                fmt = 'PNG';
            }
            if (src) pdf.addImage(src, fmt, ML, y, bW, bH, undefined, embCompression);
        } catch (_) {}
    }

    // texto do cabeçalho
    const txX = tipoEmb !== 'nenhum' ? ML + bW + 3 : ML;

    const txW = tipoEmb !== 'nenhum' ? UW - bW - 3 : UW;
    let ty = y + 2.5;
    const l1 = cfg?.cabecalho?.linha1 || 'REPÚBLICA FEDERATIVA DO BRASIL';
    const l2 = cfg?.cabecalho?.linha2 || 'ESTADO DO PIAUÍ';
    const l3 = cfg?.cabecalho?.linha3 || 'SECRETARIA DE ESTADO DA EDUCAÇÃO';
    const inst = cfg?.cabecalho?.nomeInstituicao || 'UNIDADE ESCOLAR';
    const end_ = cfg?.cabecalho?.endereco || '';
    const cnpj = cfg?.cabecalho?.cnpj || '';
    const inep = cfg?.cabecalho?.inep || '';
    const resol = cfg?.frente?.resolucao || '';

    _hText(pdf, l1, txX + txW / 2, ty, { bold: true, size: 6.5, align: 'center' }); ty += 3.5;
    _hText(pdf, l2, txX + txW / 2, ty, { bold: true, size: 8, align: 'center' }); ty += 3.8;
    _hText(pdf, l3, txX + txW / 2, ty, { size: 6, align: 'center' }); ty += 3.2;
    _hText(pdf, inst.toUpperCase(), txX + txW / 2, ty, { bold: true, size: 8.5, align: 'center', color: [0, 0, 140] }); ty += 3.8;
    if (end_) { _hText(pdf, end_, txX + txW / 2, ty, { size: 5.5, align: 'center' }); ty += 3; }
    const infoLine = [cnpj ? `CNPJ: ${cnpj}` : '', inep ? `INEP: ${inep}` : '', resol].filter(Boolean).join('   ');
    if (infoLine) { _hText(pdf, infoLine, txX + txW / 2, ty, { size: 5.5, align: 'center', color: [80, 80, 80] }); ty += 2.5; }

    y = Math.max(y + bH, ty) + 1.5;

    // dupla linha separadora
    _hLine(pdf, ML, y, PW - MR, y, 0.2, [0, 40, 120]);
    _hLine(pdf, ML, y + 1, PW - MR, y + 1, 0.6, [0, 40, 120]);
    y += 2.5;

    // --- título ---
    const titulo = isFund ? 'HISTÓRICO ESCOLAR  –  ENSINO FUNDAMENTAL' : 'HISTÓRICO ESCOLAR  –  ENSINO MÉDIO';
    pdf.setFillColor(0, 40, 120);
    pdf.rect(ML, y, UW, 7, 'F');
    _hText(pdf, titulo, PW / 2, y + 5, { bold: true, size: 9, align: 'center', color: [255, 255, 255] });
    y += 8.5;

    // --- dados do aluno ---
    const nascStr = aluno.dataNascimento
        ? `${aluno.dataNascimento.dia}/${String(Object.keys({janeiro:1,fevereiro:2,março:3,abril:4,maio:5,junho:6,julho:7,agosto:8,setembro:9,outubro:10,novembro:11,dezembro:12}).indexOf(aluno.dataNascimento.mes)+1).padStart(2,'0')}/${aluno.dataNascimento.ano}`
        : '';

    if (isFund) {
        // === ENSINO FUNDAMENTAL: 3 linhas ===
        // Linha 1: ESTUDANTE | CPF | DATA DE NASCIMENTO
        // Linha 2: MUNICÍPIO DE NASC. | RG | SSP | ESTADO
        // Linha 3: MÃE | PAI
        const boxH = 21;
        _hRect(pdf, ML, y, UW, boxH, null, [0, 40, 120]);
        pdf.setLineWidth(0.2); pdf.setDrawColor(0, 40, 120);
        pdf.line(ML, y + 7, ML + UW, y + 7);
        pdf.line(ML, y + 14, ML + UW, y + 14);

        // Linha 1 — divisores em x=110 e x=150 (relativo a ML)
        const fCpfX = ML + 110; const fNascX = ML + 152;
        pdf.line(fCpfX, y, fCpfX, y + 7);
        pdf.line(fNascX, y, fNascX, y + 7);
        const fy1 = y + 4.5;
        _hText(pdf, 'ESTUDANTE:', ML + 1, fy1, { bold: true, size: 6 });
        _hText(pdf, aluno.nome || '', ML + 23, fy1, { size: 6, maxWidth: fCpfX - ML - 25 });
        _hText(pdf, 'CPF:', fCpfX + 1, fy1, { bold: true, size: 6 });
        _hText(pdf, aluno.cpf || '', fCpfX + 9, fy1, { size: 6 });
        _hText(pdf, 'DATA DE NASCIMENTO:', fNascX + 1, fy1, { bold: true, size: 5.5 });
        _hText(pdf, nascStr, fNascX + 35, fy1, { size: 6 });

        // Linha 2 — divisores em x=80, x=113, x=130
        const fMunW = 80; const fRgX = ML + fMunW; const fSspX = ML + fMunW + 33; const fEstX = ML + fMunW + 50;
        pdf.line(fRgX, y + 7, fRgX, y + 14);
        pdf.line(fSspX, y + 7, fSspX, y + 14);
        pdf.line(fEstX, y + 7, fEstX, y + 14);
        const fy2 = y + 11.5;
        _hText(pdf, 'MUNICÍPIO DE NASC.:', ML + 1, fy2, { bold: true, size: 6 });
        _hText(pdf, aluno.naturalidade?.cidade || '', ML + 35, fy2, { size: 6, maxWidth: fMunW - 37 });
        _hText(pdf, 'RG:', fRgX + 1, fy2, { bold: true, size: 6 });
        _hText(pdf, aluno.rg || '', fRgX + 8, fy2, { size: 6, maxWidth: 22 });
        _hText(pdf, 'SSP:', fSspX + 1, fy2, { bold: true, size: 6 });
        _hText(pdf, aluno.orgaoEmissor || 'DF', fSspX + 10, fy2, { size: 6, maxWidth: 14 });
        _hText(pdf, 'ESTADO:', fEstX + 1, fy2, { bold: true, size: 6 });
        _hText(pdf, aluno.naturalidade?.estado || '', fEstX + 14, fy2, { size: 6, maxWidth: 40 });

        // Linha 3 — divisor em x=UW*0.55
        const fPaiX = ML + Math.round(UW * 0.55);
        pdf.line(fPaiX, y + 14, fPaiX, y + boxH);
        const fy3 = y + 18.5;
        _hText(pdf, 'MÃE:', ML + 1, fy3, { bold: true, size: 6 });
        _hText(pdf, aluno.filiacao?.mae || '', ML + 10, fy3, { size: 6, maxWidth: fPaiX - ML - 12 });
        _hText(pdf, 'PAI:', fPaiX + 1, fy3, { bold: true, size: 6 });
        _hText(pdf, aluno.filiacao?.pai || '', fPaiX + 9, fy3, { size: 6, maxWidth: ML + UW - fPaiX - 11 });

        y += boxH + 2;
    } else {
        // === ENSINO MÉDIO: 2 linhas (layout original) ===
        const boxH = 14;
        _hRect(pdf, ML, y, UW, boxH, null, [0, 40, 120]);
        pdf.setLineWidth(0.2); pdf.setDrawColor(0, 40, 120);
        pdf.line(ML, y + 7, ML + UW, y + 7);

        const fy1 = y + 4.5;
        _hText(pdf, 'ESTUDANTE:', ML + 1, fy1, { bold: true, size: 6 });
        _hText(pdf, aluno.nome || '', ML + 22, fy1, { size: 6 });
        const cpfX = ML + 78; const nascX = ML + 108; const munX = ML + 148;
        pdf.line(cpfX, y, cpfX, y + 7);
        pdf.line(nascX, y, nascX, y + 7);
        pdf.line(munX, y, munX, y + 7);
        _hText(pdf, 'CPF:', cpfX + 1, fy1, { bold: true, size: 6 });
        _hText(pdf, aluno.cpf || '', cpfX + 10, fy1, { size: 6 });
        _hText(pdf, 'DATA NASC.:', nascX + 1, fy1, { bold: true, size: 6 });
        _hText(pdf, nascStr, nascX + 22, fy1, { size: 6 });
        _hText(pdf, 'MUN. NASC.:', munX + 1, fy1, { bold: true, size: 6 });
        _hText(pdf, aluno.naturalidade?.cidade || '', munX + 22, fy1, { size: 6, maxWidth: 22 });

        const fy2 = y + 11.5;
        const rgX = ML; const sspX = ML + 38; const estX = ML + 62; const maeX = ML + 86; const paiX = ML + 143;
        pdf.line(sspX, y + 7, sspX, y + boxH);
        pdf.line(estX, y + 7, estX, y + boxH);
        pdf.line(maeX, y + 7, maeX, y + boxH);
        pdf.line(paiX, y + 7, paiX, y + boxH);
        _hText(pdf, 'RG:', rgX + 1, fy2, { bold: true, size: 6 });
        _hText(pdf, aluno.rg || '', rgX + 8, fy2, { size: 6 });
        _hText(pdf, 'SSP:', sspX + 1, fy2, { bold: true, size: 6 });
        _hText(pdf, aluno.orgaoEmissor || '', sspX + 10, fy2, { size: 6 });
        _hText(pdf, 'ESTADO:', estX + 1, fy2, { bold: true, size: 6 });
        _hText(pdf, aluno.naturalidade?.estado || '', estX + 14, fy2, { size: 6 });
        _hText(pdf, 'MÃE:', maeX + 1, fy2, { bold: true, size: 6 });
        _hText(pdf, aluno.filiacao?.mae || '', maeX + 10, fy2, { size: 6, maxWidth: 50 });
        _hText(pdf, 'PAI:', paiX + 1, fy2, { bold: true, size: 6 });
        _hText(pdf, aluno.filiacao?.pai || '', paiX + 9, fy2, { size: 6, maxWidth: 44 });

        y += boxH + 2;
    }

    // --- tabela principal ---
    const discs = grade.disciplinas || [];
    const catMap = {};
    discs.forEach(d => { if (!catMap[d.categoria]) catMap[d.categoria] = []; catMap[d.categoria].push(d); });

    const catLabels = {
        formacao_geral: 'FORMAÇÃO GERAL BÁSICA',
        itinerarios: 'ITINERÁRIOS FORMATIVOS',
        atividades_integradoras: 'ATIVIDADES INTEGRADORAS',
        linguagens: 'LINGUAGENS, CÓDIGOS E SUAS TECNOLOGIAS',
        ciencias_humanas: 'CIÊNCIAS HUMANAS E SUAS TECNOLOGIAS',
        ciencias_natureza: 'CIÊNCIAS DA NATUREZA E SUAS TECNOLOGIAS',
        matematica: 'MATEMÁTICA E SUAS TECNOLOGIAS',
        parte_flexivel: 'PARTE FLEXÍVEL (DIVERSIFICADA)',
        ensino_religioso: 'ENSINO RELIGIOSO'
    };

    // Larguras das colunas
    const cVert = 7;
    const cDisc = isFund ? 50 : 65;
    const cPoliv = isFund ? 12 : 0;
    const remainW = UW - cVert - cDisc - cPoliv;
    const pairW = remainW / numSeries;
    const cNota = parseFloat((pairW * 0.58).toFixed(2));
    const cCH = parseFloat((pairW - cNota).toFixed(2));

    const hdrH = 6;     // header row height
    const catH = 4.2;   // category row height
    const rowH = 3.8;   // discipline row height
    const tblStartY = y;
    const tblX = ML;

    // cabeçalho linha 1
    pdf.setFillColor(0, 35, 105);
    pdf.rect(tblX, y, UW, hdrH, 'F');
    // coluna vertical
    _hRect(pdf, tblX, y, cVert, hdrH * 2, [0, 35, 105], null);
    pdf.setFont('helvetica', 'bold'); pdf.setFontSize(4.2); pdf.setTextColor(255, 255, 255);
    pdf.text('ÁREAS DO CONHECIMENTO / COMPONENTES CURRICULARES / ATIVIDADES', tblX + 4.8, y + hdrH * 2 - 0.6, { angle: 90, align: 'right' });

    // coluna disciplinas header (span 2)
    pdf.setFont('helvetica', 'bold'); pdf.setFontSize(5.5); pdf.setTextColor(255, 255, 255);
    pdf.text('COMPONENTES CURRICULARES', tblX + cVert + cDisc / 2, y + hdrH + 3.5, { align: 'center' });

    if (isFund) {
        pdf.setFontSize(4.5);
        pdf.text('POLI-\nVALÊNCIA', tblX + cVert + cDisc + cPoliv / 2, y + hdrH / 2 + 1, { align: 'center' });
    }

    // headers das séries
    let sx = tblX + cVert + cDisc + cPoliv;
    for (let i = 0; i < numSeries; i++) {
        const lbl = isFund ? `${i + 1}° ANO` : (series[i] || `${i + 1}ª`);
        pdf.setFont('helvetica', 'bold'); pdf.setFontSize(isFund ? 5 : 6); pdf.setTextColor(255, 255, 255);
        pdf.text(lbl, sx + pairW / 2, y + 4, { align: 'center' });
        sx += pairW;
    }
    // linhas de grade do header vertical
    pdf.setDrawColor(80, 120, 200); pdf.setLineWidth(0.15);
    pdf.line(tblX + cVert, y, tblX + cVert, y + hdrH * 2);
    if (isFund) pdf.line(tblX + cVert + cDisc, y, tblX + cVert + cDisc, y + hdrH * 2);
    if (isFund) pdf.line(tblX + cVert + cDisc + cPoliv, y, tblX + cVert + cDisc + cPoliv, y + hdrH * 2);
    else pdf.line(tblX + cVert + cDisc, y, tblX + cVert + cDisc, y + hdrH * 2);
    sx = tblX + cVert + cDisc + cPoliv;
    for (let i = 0; i < numSeries; i++) { pdf.line(sx + pairW, y, sx + pairW, y + hdrH * 2); sx += pairW; }
    pdf.rect(tblX, y, UW, hdrH, 'S');
    y += hdrH;

    // cabeçalho linha 2 (Nota / CH)
    pdf.setFillColor(15, 55, 150);
    pdf.rect(tblX, y, UW, hdrH, 'F');
    sx = tblX + cVert + cDisc + cPoliv;
    for (let i = 0; i < numSeries; i++) {
        pdf.setFont('helvetica', 'bold'); pdf.setFontSize(4.5); pdf.setTextColor(255, 255, 255);
        pdf.text('NOTA', sx + cNota / 2, y + 4, { align: 'center' });
        pdf.line(sx + cNota, y, sx + cNota, y + hdrH);
        pdf.text('CH', sx + cNota + cCH / 2, y + 4, { align: 'center' });
        pdf.line(sx + pairW, y, sx + pairW, y + hdrH);
        sx += pairW;
    }
    pdf.setDrawColor(80, 120, 200);
    pdf.setLineWidth(0.15);
    pdf.rect(tblX, y, UW, hdrH, 'S');
    y += hdrH;

    // linhas de dados
    const catKeys = Object.keys(catMap);
    let rowIdx = 0;
    for (const catId of catKeys) {
        const catNome = catLabels[catId] || catId;
        const catDiscs = catMap[catId];

        // linha de categoria
        pdf.setFillColor(254, 243, 199);
        pdf.rect(tblX, y, UW, catH, 'F');
        pdf.setDrawColor(200, 150, 50); pdf.setLineWidth(0.15);
        pdf.rect(tblX, y, UW, catH, 'S');
        pdf.setFont('helvetica', 'bold'); pdf.setFontSize(5.5); pdf.setTextColor(100, 55, 0);
        pdf.text(catNome, tblX + cVert + 1.5, y + 3, { maxWidth: UW - cVert - 2 });
        y += catH;

        for (const disc of catDiscs) {
            const notasDisc = notas[disc.nome] || {};
            const bg = rowIdx % 2 === 0 ? [248, 252, 255] : [255, 255, 255];
            pdf.setFillColor(...bg);
            pdf.rect(tblX, y, UW, rowH, 'F');
            pdf.setDrawColor(210, 225, 240); pdf.setLineWidth(0.1);
            pdf.rect(tblX, y, UW, rowH, 'S');
            pdf.line(tblX + cVert, y, tblX + cVert, y + rowH);

            // nome disciplina
            pdf.setFont('helvetica', 'normal'); pdf.setFontSize(5.5); pdf.setTextColor(15, 15, 15);
            pdf.text(disc.nome, tblX + cVert + 1.2, y + rowH - 1, { maxWidth: cDisc - 2 });
            pdf.setDrawColor(180, 200, 225);
            pdf.line(tblX + cVert + cDisc, y, tblX + cVert + cDisc, y + rowH);

            // polivalência
            if (isFund) {
                const pv = notasDisc['0']?.polivalencia ?? '';
                pdf.setFontSize(5.5); pdf.setTextColor(10, 10, 10);
                pdf.text(String(pv), tblX + cVert + cDisc + cPoliv / 2, y + rowH - 1, { align: 'center' });
                pdf.line(tblX + cVert + cDisc + cPoliv, y, tblX + cVert + cDisc + cPoliv, y + rowH);
            }

            // notas por série
            let nx = tblX + cVert + cDisc + cPoliv;
            for (let si = 0; si < numSeries; si++) {
                const nd = notasDisc[String(si + 1)] || {};
                const nv = nd.nota !== undefined ? Number(nd.nota).toFixed(1) : '';
                const cv = nd.ch !== undefined ? String(nd.ch) : '';
                pdf.setFont('helvetica', 'normal'); pdf.setFontSize(5.5); pdf.setTextColor(0, 0, 0);
                pdf.text(nv, nx + cNota / 2, y + rowH - 1, { align: 'center' });
                pdf.line(nx + cNota, y, nx + cNota, y + rowH);
                pdf.text(cv, nx + cNota + cCH / 2, y + rowH - 1, { align: 'center' });
                pdf.line(nx + pairW, y, nx + pairW, y + rowH);
                nx += pairW;
            }
            rowIdx++;
            y += rowH;
        }
    }
    // borda externa da tabela
    pdf.setDrawColor(0, 40, 120); pdf.setLineWidth(0.4);
    pdf.rect(tblX, tblStartY, UW, y - tblStartY, 'S');
    y += 3;

    // --- tabela de instituições ---
    const seriesParaInfo = isFund
        ? [{ nome: 'PRÉ', key: '0' }, ...series.map((_, i) => ({ nome: `${i + 1}°`, key: String(i + 1) }))]
        : series.map((s, i) => ({ nome: s, key: String(i + 1) }));

    const iColW = [20, 28, UW - 20 - 28 - 48, 48];
    const iHdrH = 5.5;
    const iRowH = 4.5;

    pdf.setFillColor(0, 40, 120);
    pdf.rect(ML, y, UW, iHdrH, 'F');
    const iHdrs = ['ANOS', 'ANO/ CONCLUSÃO', 'INSTITUIÇÃO DE ENSINO', 'CIDADE/UF'];
    let ix = ML;
    iHdrs.forEach((h, ci) => {
        pdf.setFont('helvetica', 'bold'); pdf.setFontSize(5.5); pdf.setTextColor(255, 255, 255);
        pdf.text(h, ix + iColW[ci] / 2, y + iHdrH - 1.2, { align: 'center' });
        if (ci < iHdrs.length - 1) { pdf.setDrawColor(80, 120, 200); pdf.setLineWidth(0.15); pdf.line(ix + iColW[ci], y, ix + iColW[ci], y + iHdrH); }
        ix += iColW[ci];
    });
    pdf.setDrawColor(80, 120, 200); pdf.setLineWidth(0.15);
    pdf.rect(ML, y, UW, iHdrH, 'S');
    y += iHdrH;

    const iStartY = y;
    seriesParaInfo.forEach((sp, ri) => {
        const info = seriesInfo.find(si => si.serie === sp.key) || {};
        const bg2 = ri % 2 === 0 ? [245, 248, 255] : [255, 255, 255];
        pdf.setFillColor(...bg2);
        pdf.rect(ML, y, UW, iRowH, 'F');
        const vals = [sp.nome, info.ano || '', info.estabelecimento || '', info.cidadeUf || ''];
        ix = ML;
        vals.forEach((v, ci) => {
            pdf.setFont('helvetica', ci === 0 ? 'bold' : 'normal');
            pdf.setFontSize(5.5); pdf.setTextColor(15, 15, 15);
            pdf.text(String(v), ix + iColW[ci] / 2, y + iRowH - 1.2, { align: 'center', maxWidth: iColW[ci] - 1 });
            pdf.setDrawColor(180, 200, 230); pdf.setLineWidth(0.1);
            pdf.rect(ix, y, iColW[ci], iRowH, 'S');
            ix += iColW[ci];
        });
        y += iRowH;
    });
    pdf.setDrawColor(0, 40, 120); pdf.setLineWidth(0.35);
    pdf.rect(ML, iStartY - iHdrH, UW, y - iStartY + iHdrH, 'S');
    y += 3;

    // --- autenticação e observações ---
    _hText(pdf, `AUTENTICAÇÃO/ Nº DE REGISTRO: ${hist.registro || '________________________________________'}`, ML, y, { bold: true, size: 7 });
    y += 5;

    if (hist.observacoes) {
        pdf.setFont('helvetica', 'normal'); pdf.setFontSize(6.5); pdf.setTextColor(30, 30, 30);
        const obsL = pdf.splitTextToSize(hist.observacoes, UW);
        pdf.text(obsL.slice(0, 3), ML, y);
        y += obsL.slice(0, 3).length * 3.5 + 2;
    }

    // para Fundamental: texto de aprovação antes da data/assinaturas
    if (isFund) {
        const textoAprov = 'Considerar-se-á aprovado o aluno quanto a: 1. Nota/ Média obtiver o mínimo de 60 % (sessenta por cento) de rendimento escolar em cada componente curricular; 2. Assiduidade obtiver frequência mínima de 75% (setenta e cinco por cento) do total da carga horária trabalhada pela escola durante o ano letivo.';
        pdf.setFont('helvetica', 'normal'); pdf.setFontSize(6); pdf.setTextColor(20, 20, 20);
        const aprvLines = pdf.splitTextToSize(textoAprov, UW);
        pdf.text(aprvLines, ML, y);
        y += aprvLines.length * 3 + 2;
    }

    // data de emissão
    _hText(pdf, hist.dataEmissao || '', PW / 2, y, { size: 7, align: 'center' });
    y += 8;

    // assinaturas — centralizadas em ¼ e ¾
    const sig1 = cfg?.frente?.assinatura1 || 'SECRETÁRIO(A)';
    const sig2 = cfg?.frente?.assinatura2 || 'DIRETOR(A)';
    const cx1f = ML + UW * 0.25;
    const cx2f = ML + UW * 0.75;
    [{ cx: cx1f, sig: sig1 }, { cx: cx2f, sig: sig2 }].forEach(({ cx, sig }) => {
        pdf.setLineWidth(0.4); pdf.setDrawColor(0, 0, 0);
        pdf.line(cx - 35, y, cx + 35, y);
        _hText(pdf, sig, cx, y + 4, { size: 6.5, align: 'center', bold: true });
    });

    // linha dupla final
    const fyBot = PH - 8;
    _hLine(pdf, ML, fyBot, PW - MR, fyBot, 0.6, [0, 40, 120]);
    _hLine(pdf, ML, fyBot + 1.2, PW - MR, fyBot + 1.2, 0.2, [0, 40, 120]);
}

// ---------- Página do verso ----------

function _histVerso(pdf, hist, cfg) {
    return hist.tipo === 'medio' ? _histVersoMedio(pdf, hist, cfg) : _histVersoFundamental(pdf, hist, cfg);
}

function _histVersoFundamental(pdf, hist, cfg) {
    const aluno = hist.aluno || {};
    const grade = hist.grade || {};
    const fichaIndividual = hist.fichaIndividual || [];
    const discs = grade.disciplinas || [];
    const numAvals = 8;

    const PW = 210, PH = 297, ML = 7, MR = 7, MT = 7;
    const UW = PW - ML - MR;
    let y = MT;

    // linhas do topo
    _hLine(pdf, ML, y, PW - MR, y, 0.6, [0, 40, 120]);
    _hLine(pdf, ML, y + 1.3, PW - MR, y + 1.3, 0.2, [0, 40, 120]);
    y += 3;

    // título + ANO na mesma barra
    pdf.setFillColor(0, 40, 120);
    pdf.rect(ML, y, UW, 7, 'F');
    _hText(pdf, 'FICHA INDIVIDUAL DO RENDIMENTO ESCOLAR E FREQUÊNCIA DO ALUNO', PW / 2, y + 4, { bold: true, size: 7.5, align: 'center', color: [255, 255, 255] });
    y += 9;

    // linha secundária com ANO
    const fichaEntry = fichaIndividual.length ? fichaIndividual[0] : {};
    const fichaAno = fichaEntry.ano || '';
    pdf.setFont('helvetica', 'bold'); pdf.setFontSize(8); pdf.setTextColor(0, 40, 120);
    pdf.text(`ANO:  ${fichaAno}`, PW / 2, y + 4, { align: 'center' });
    y += 9;

    // tabela — Fundamental: 8 avaliações, cada uma com Notas + Faltas
    const cDiscW = 52;
    const availAvalW = UW - cDiscW;
    const avalW = availAvalW / numAvals;
    const notaW = avalW * 0.54;
    const faltaW = avalW - notaW;
    const hH = 5;
    const rH = 3.6;

    // header linha 1
    pdf.setFillColor(0, 40, 120);
    pdf.rect(ML, y, UW, hH, 'F');
    pdf.setFont('helvetica', 'bold'); pdf.setFontSize(5.5); pdf.setTextColor(255, 255, 255);
    pdf.text('DISCIPLINAS', ML + cDiscW / 2, y + 3.5, { align: 'center' });
    let ax = ML + cDiscW;
    for (let a = 1; a <= numAvals; a++) {
        pdf.text(`${a}ª AVAL`, ax + avalW / 2, y + 3.5, { align: 'center' });
        pdf.setDrawColor(80, 120, 200); pdf.setLineWidth(0.15);
        pdf.line(ax, y, ax, y + hH);
        ax += avalW;
    }
    pdf.setDrawColor(80, 120, 200); pdf.setLineWidth(0.15);
    pdf.rect(ML, y, UW, hH, 'S');
    y += hH;

    // header linha 2 (Notas / Faltas)
    pdf.setFillColor(15, 55, 150);
    pdf.rect(ML, y, UW, hH, 'F');
    ax = ML + cDiscW;
    pdf.setFont('helvetica', 'bold'); pdf.setFontSize(4.5); pdf.setTextColor(255, 255, 255);
    for (let a = 1; a <= numAvals; a++) {
        pdf.text('Notas', ax + notaW / 2, y + 3.3, { align: 'center' });
        pdf.line(ax + notaW, y, ax + notaW, y + hH);
        pdf.text('Faltas', ax + notaW + faltaW / 2, y + 3.3, { align: 'center' });
        pdf.line(ax + avalW, y, ax + avalW, y + hH);
        ax += avalW;
    }
    pdf.setDrawColor(80, 120, 200); pdf.setLineWidth(0.15);
    pdf.rect(ML, y, UW, hH, 'S');
    y += hH;

    // linhas disciplinas
    const registros = fichaEntry.registros || [];
    const tblAvalStart = y;
    discs.forEach((disc, idx) => {
        const reg = registros.find(r => r.disciplina === disc.nome) || {};
        const avs = reg.avaliacoes || [];
        const bg = idx % 2 === 0 ? [248, 251, 255] : [255, 255, 255];
        pdf.setFillColor(...bg);
        pdf.rect(ML, y, UW, rH, 'F');
        pdf.setDrawColor(205, 220, 235); pdf.setLineWidth(0.1);
        pdf.rect(ML, y, UW, rH, 'S');
        pdf.setFont('helvetica', 'normal'); pdf.setFontSize(5.2); pdf.setTextColor(10, 10, 10);
        pdf.text(disc.nome, ML + 1, y + rH - 1, { maxWidth: cDiscW - 2 });
        pdf.setDrawColor(160, 190, 220);
        pdf.line(ML + cDiscW, y, ML + cDiscW, y + rH);
        ax = ML + cDiscW;
        for (let a = 1; a <= numAvals; a++) {
            const av = avs.find(v => v.num === a) || {};
            const nVal = av.nota !== undefined ? Number(av.nota).toFixed(1) : '';
            const fVal = av.faltas !== undefined ? String(av.faltas) : '';
            pdf.setTextColor(0, 0, 0);
            pdf.text(nVal, ax + notaW / 2, y + rH - 1, { align: 'center' });
            pdf.line(ax + notaW, y, ax + notaW, y + rH);
            pdf.text(fVal, ax + notaW + faltaW / 2, y + rH - 1, { align: 'center' });
            pdf.line(ax + avalW, y, ax + avalW, y + rH);
            ax += avalW;
        }
        y += rH;
    });

    // Linha ATENÇÃO dentro da tabela (última linha antes da borda externa)
    const atencaoH = 5;
    pdf.setFillColor(255, 252, 240);
    pdf.rect(ML, y, UW, atencaoH, 'F');
    pdf.setDrawColor(200, 150, 50); pdf.setLineWidth(0.15);
    pdf.rect(ML, y, UW, atencaoH, 'S');
    pdf.setFont('helvetica', 'bold'); pdf.setFontSize(6); pdf.setTextColor(100, 55, 0);
    pdf.text('ATENÇÃO: ', ML + 2, y + 3.3);
    pdf.setFont('helvetica', 'normal');
    pdf.text('Preencher somente em caso do aluno solicitar transferência durante o período letivo.', ML + 19, y + 3.3);
    y += atencaoH;

    pdf.setDrawColor(0, 40, 120); pdf.setLineWidth(0.35);
    pdf.rect(ML, tblAvalStart - 2 * hH, UW, y - tblAvalStart + 2 * hH, 'S');
    y += 4;

    _histVersoRodape(pdf, hist, cfg, { PW, PH, ML, MR, UW, y, isMedio: false });
}

function _histVersoMedio(pdf, hist, cfg) {
    const aluno = hist.aluno || {};
    const grade = hist.grade || {};
    const fichaIndividual = hist.fichaIndividual || [];
    const discs = grade.disciplinas || [];

    // Em paisagem A4: 297 x 210
    const PW = 297, PH = 210, ML = 7, MR = 7, MT = 7;
    const UW = PW - ML - MR;
    let y = MT;

    // linhas do topo
    _hLine(pdf, ML, y, PW - MR, y, 0.6, [0, 40, 120]);
    _hLine(pdf, ML, y + 1.3, PW - MR, y + 1.3, 0.2, [0, 40, 120]);
    y += 3;

    // título
    pdf.setFillColor(0, 40, 120);
    pdf.rect(ML, y, UW, 7, 'F');
    _hText(pdf, 'FICHA INDIVIDUAL DO RENDIMENTO ESCOLAR E FREQUÊNCIA DO ALUNO', PW / 2, y + 5, { bold: true, size: 9, align: 'center', color: [255, 255, 255] });
    y += 9;

    // aluno + ano
    const fichaEntry = fichaIndividual.length ? fichaIndividual[0] : {};
    const fichaAno = fichaEntry.ano || '';
    _hText(pdf, `ALUNO(A): ${aluno.nome || ''}`, ML, y + 3, { bold: true, size: 7 });
    _hText(pdf, `ANO: ${fichaAno}`, PW - MR - 40, y + 3, { bold: true, size: 7 });
    y += 7;

    // atenção
    _hText(pdf, 'ATENÇÃO:', ML, y, { bold: true, size: 6, color: [100, 50, 0] });
    _hText(pdf, ' Preencher somente em caso do aluno solicitar transferência durante o período letivo.', ML + 14, y, { size: 6 });
    y += 6;

    // Estrutura do Médio:
    // Blocos: [1ªAVAL(N+F) | 2ªAVAL(N+F) | 1ºBIMS(MB+FTB)] x4 = 4 bimestres
    // Colunas: DISCIPLINAS | 1ªAVAL Notas | 1ªAVAL Faltas | 2ªAVAL Notas | 2ªAVAL Faltas | 1ºBIMESTRE MB | 1ºBIMESTRE FTB | ... (x4)
    const cDiscW = 40;
    // Cada bimestre = 2 avals (N+F cada) + 1 bimestre (MB+FTB) = 6 sub-colunas
    const numBim = 4;
    const bimW = (UW - cDiscW) / numBim;
    const avalUnitW = bimW / 3; // cada bloco tem 3 partes: 1ªAVAL, 2ªAVAL, BIMESTRE
    const subW = avalUnitW / 2; // cada parte tem 2 sub-colunas

    const hH1 = 5; // altura header linha1 (avaliação/frequência)
    const hH2 = 5; // altura header linha2 (1ªAVAL etc)
    const hH3 = 4; // altura header linha3 (Notas/Faltas/MB/FTB)
    const rH = 3.8;

    // header linha 1: AVALIAÇÃO / FREQUÊNCIA
    pdf.setFillColor(0, 40, 120);
    pdf.rect(ML + cDiscW, y, UW - cDiscW, hH1, 'F');
    _hText(pdf, 'AVALIAÇÃO / FREQUÊNCIA', ML + cDiscW + (UW - cDiscW) / 2, y + 3.5, { bold: true, size: 7, align: 'center', color: [255, 255, 255] });
    pdf.setDrawColor(80, 120, 200); pdf.setLineWidth(0.15);
    pdf.rect(ML + cDiscW, y, UW - cDiscW, hH1, 'S');
    y += hH1;

    // header linha 2: DISCIPLINAS | 1ªAVAL | 2ªAVAL | 1ºBIMESTRE | ...
    pdf.setFillColor(0, 40, 120);
    pdf.rect(ML, y, cDiscW, hH2, 'F');
    _hText(pdf, 'DISCIPLINAS', ML + cDiscW / 2, y + 3.3, { bold: true, size: 6, align: 'center', color: [255, 255, 255] });
    pdf.setFillColor(15, 55, 150);
    pdf.rect(ML + cDiscW, y, UW - cDiscW, hH2, 'F');
    const bimLabels = ['1ª AVAL', '2ª AVAL', '1º BIMESTRE', '3ª AVAL', '4ª AVAL', '2º BIMESTRE', '5ª AVAL', '6ª AVAL', '3º BIMESTRE', '7ª AVAL', '8ª AVAL', '4º BIMESTRE'];
    let bx = ML + cDiscW;
    for (let i = 0; i < 12; i++) {
        pdf.setFont('helvetica', 'bold'); pdf.setFontSize(4.2); pdf.setTextColor(255, 255, 255);
        pdf.text(bimLabels[i], bx + avalUnitW / 2, y + 3.3, { align: 'center' });
        pdf.setDrawColor(80, 150, 220); pdf.setLineWidth(0.15);
        pdf.line(bx + avalUnitW, y, bx + avalUnitW, y + hH2);
        bx += avalUnitW;
    }
    pdf.setDrawColor(80, 120, 200); pdf.setLineWidth(0.15);
    pdf.rect(ML, y, UW, hH2, 'S');
    y += hH2;

    // header linha 3: Notas/Faltas x2 | MB/FTB | ... x4
    pdf.setFillColor(30, 70, 160);
    pdf.rect(ML, y, UW, hH3, 'F');
    pdf.setFont('helvetica', 'bold'); pdf.setFontSize(4); pdf.setTextColor(255, 255, 255);
    bx = ML + cDiscW;
    for (let b = 0; b < numBim; b++) {
        // 1ª aval dentro do bimestre
        pdf.text('Notas', bx + subW / 2, y + 2.8, { align: 'center' });
        pdf.line(bx + subW, y, bx + subW, y + hH3);
        pdf.text('Faltas', bx + subW + subW / 2, y + 2.8, { align: 'center' });
        pdf.line(bx + avalUnitW, y, bx + avalUnitW, y + hH3);
        // 2ª aval dentro do bimestre
        pdf.text('Notas', bx + avalUnitW + subW / 2, y + 2.8, { align: 'center' });
        pdf.line(bx + avalUnitW + subW, y, bx + avalUnitW + subW, y + hH3);
        pdf.text('Faltas', bx + avalUnitW + subW + subW / 2, y + 2.8, { align: 'center' });
        pdf.line(bx + avalUnitW * 2, y, bx + avalUnitW * 2, y + hH3);
        // bimestre
        pdf.text('MB', bx + avalUnitW * 2 + subW / 2, y + 2.8, { align: 'center' });
        pdf.line(bx + avalUnitW * 2 + subW, y, bx + avalUnitW * 2 + subW, y + hH3);
        pdf.text('FTB', bx + avalUnitW * 2 + subW + subW / 2, y + 2.8, { align: 'center' });
        pdf.line(bx + bimW, y, bx + bimW, y + hH3);
        bx += bimW;
    }
    pdf.setDrawColor(80, 120, 200); pdf.setLineWidth(0.15);
    pdf.rect(ML, y, UW, hH3, 'S');
    y += hH3;

    // linhas disciplinas
    const registros = fichaEntry.registros || [];
    const tblStart = y;
    discs.forEach((disc, idx) => {
        const reg = registros.find(r => r.disciplina === disc.nome) || {};
        const avs = reg.avaliacoes || [];
        const bg = idx % 2 === 0 ? [248, 251, 255] : [255, 255, 255];
        pdf.setFillColor(...bg);
        pdf.rect(ML, y, UW, rH, 'F');
        pdf.setDrawColor(205, 220, 235); pdf.setLineWidth(0.1);
        pdf.rect(ML, y, UW, rH, 'S');
        pdf.setFont('helvetica', 'normal'); pdf.setFontSize(5); pdf.setTextColor(10, 10, 10);
        pdf.text(disc.nome, ML + 1, y + rH - 1, { maxWidth: cDiscW - 2 });
        pdf.line(ML + cDiscW, y, ML + cDiscW, y + rH);

        bx = ML + cDiscW;
        const avalNums = [1, 2, 3, 4, 5, 6, 7, 8]; // avaliações reais
        // Mapeamento: bimestre 1 → avals 1,2; bimestre 2 → 3,4; bimestre 3 → 5,6; bimestre 4 → 7,8
        for (let b = 0; b < numBim; b++) {
            const av1 = avs.find(v => v.num === b * 2 + 1) || {};
            const av2 = avs.find(v => v.num === b * 2 + 2) || {};
            const n1 = av1.nota !== undefined ? Number(av1.nota).toFixed(1) : '';
            const f1 = av1.faltas !== undefined ? String(av1.faltas) : '';
            const n2 = av2.nota !== undefined ? Number(av2.nota).toFixed(1) : '';
            const f2 = av2.faltas !== undefined ? String(av2.faltas) : '';
            // MB = média das duas avaliações; FTB = soma das faltas
            const mb = (av1.nota !== undefined && av2.nota !== undefined)
                ? ((Number(av1.nota) + Number(av2.nota)) / 2).toFixed(1) : '';
            const ftb = (av1.faltas !== undefined || av2.faltas !== undefined)
                ? String((Number(av1.faltas) || 0) + (Number(av2.faltas) || 0)) : '';
            pdf.setFont('helvetica', 'normal'); pdf.setFontSize(4.8); pdf.setTextColor(0, 0, 0);
            const vals = [n1, f1, n2, f2, mb, ftb];
            for (let s = 0; s < 6; s++) {
                pdf.text(String(vals[s]), bx + subW / 2, y + rH - 1, { align: 'center' });
                pdf.line(bx + subW, y, bx + subW, y + rH);
                bx += subW;
            }
        }
        y += rH;
    });
    pdf.setDrawColor(0, 40, 120); pdf.setLineWidth(0.35);
    pdf.rect(ML, tblStart - hH1 - hH2 - hH3, UW, y - tblStart + hH1 + hH2 + hH3, 'S');
    y += 3;

    _histVersoRodape(pdf, hist, cfg, { PW, PH, ML, MR, UW, y, isMedio: true });
}

function _histVersoRodape(pdf, hist, cfg, { PW, PH, ML, MR, UW, y, isMedio }) {
    // LEGENDA (só no médio)
    if (isMedio) {
        pdf.setFont('helvetica', 'bold'); pdf.setFontSize(6); pdf.setTextColor(0, 0, 0);
        pdf.text('LEGENDA:', ML, y);
        pdf.setFont('helvetica', 'normal');
        pdf.text(' MB - Média Bimestral          FTB - Falta Total do Bimestre', ML + 14, y);
        y += 5;
    }

    // VERIFICAÇÃO
    pdf.setFillColor(230, 237, 255);
    const verH = isMedio ? 15 : 17;
    pdf.rect(ML, y, UW, verH, 'F');
    pdf.setDrawColor(0, 40, 120); pdf.setLineWidth(0.3);
    pdf.rect(ML, y, UW, verH, 'S');
    pdf.setFont('helvetica', 'bold'); pdf.setFontSize(6.5); pdf.setTextColor(0, 40, 120);
    pdf.text('VERIFICAÇÃO DO RENDIMENTO E FREQUÊNCIA ESCOLAR', ML + 2, y + 4);
    pdf.setFont('helvetica', 'normal'); pdf.setFontSize(5.8); pdf.setTextColor(20, 20, 20);
    pdf.text('Considerar-se-á aprovado o aluno que quanto a:', ML + 2, y + 8);
    pdf.text('1. Nota/ Média obtiver o mínimo de 60 % (sessenta por cento) de rendimento escolar em cada componente curricular;', ML + 2, y + 11.5);
    pdf.text('2. Assiduidade  obtiver frequência mínima de 75% (setenta e cinco por cento) do total da carga horária trabalhada pela escola durante o ano letivo.', ML + 2, y + 14.5);
    y += verH + 3;

    // OBSERVAÇÃO
    _hText(pdf, 'OBSERVAÇÃO:', ML, y, { bold: true, size: 7 });
    y += 4;
    const fichaEntry = (hist.fichaIndividual || []).length ? hist.fichaIndividual[0] : {};
    const obsText = fichaEntry.observacao || '';
    pdf.setFont('helvetica', 'normal'); pdf.setFontSize(6.5); pdf.setTextColor(10, 10, 10);
    const obsLines = pdf.splitTextToSize(obsText || ' ', UW);
    pdf.text(obsLines.slice(0, 2), ML, y);
    pdf.setDrawColor(180, 180, 180); pdf.setLineWidth(0.2);
    [0, 5].forEach(dy => pdf.line(ML, y + dy, ML + UW, y + dy));
    y += 12;

    // sem emendas
    _hText(pdf, 'Neste documento não há emendas nem rasuras.', PW / 2, y, { size: 7, align: 'center', bold: true });
    y += 7;

    // data
    _hText(pdf, hist.dataEmissao || '', PW / 2, y, { size: 7, align: 'center' });
    y += 8;

    // assinaturas
    const sig1 = cfg?.frente?.assinatura1 || 'SECRETÁRIO(A)';
    const sig2 = cfg?.frente?.assinatura2 || 'DIRETOR(A)';
    const cx1 = ML + UW * 0.25;
    const cx2 = ML + UW * 0.75;
    [{ cx: cx1, sig: sig1 }, { cx: cx2, sig: sig2 }].forEach(({ cx, sig }) => {
        pdf.setLineWidth(0.4); pdf.setDrawColor(0, 0, 0);
        pdf.line(cx - 35, y, cx + 35, y);
        _hText(pdf, sig, cx, y + 4, { size: 6.5, align: 'center', bold: true });
    });
    y += 8;

    // RESERVADO PARA AUTENTICAÇÃO — cresce até perto da borda inferior
    const fyBot = PH - 10;
    const autH = Math.max(isMedio ? 12 : 28, fyBot - y - 3);
    pdf.setDrawColor(0, 40, 120); pdf.setLineWidth(0.5);
    pdf.rect(ML, y, UW, autH, 'S');
    pdf.setFont('helvetica', 'bold'); pdf.setFontSize(8); pdf.setTextColor(0, 40, 120);
    pdf.text('RESERVADO PARA AUTENTICAÇÃO', ML + UW / 2, y + 7, { align: 'center' });

    // linha dupla final
    _hLine(pdf, ML, fyBot, PW - MR, fyBot, 0.6, [0, 40, 120]);
    _hLine(pdf, ML, fyBot + 1.2, PW - MR, fyBot + 1.2, 0.2, [0, 40, 120]);
}

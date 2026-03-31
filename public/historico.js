/**
 * HISTÓRICO ESCOLAR - Frontend
 * Gerenciamento de grades, notas e geração de históricos
 */

// ==================== ESTADO ====================
const HIST_STATE = {
    grades: [],
    gradeAtual: null,
    historicoAtual: null,
    historicosSelecionados: new Set()
};

// ==================== INICIALIZAÇÃO ====================
// Inicialização é chamada por navegarParaTab('historico') em app.js

function inicializarHistorico() {
    carregarListaGrades();
    popularSelectAlunos();
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
    const g = gradeExistente || {
        tipo: 'medio',
        nome: '',
        disciplinas: [],
        numSeries: 3,
        nomesSeries: ['1ª Série', '2ª Série', '3ª Série']
    };

    // Categorias não usadas diretamente no modal, apenas em adicionarDisciplinaGrade

    const modal = document.createElement('div');
    modal.className = 'overlay-modal';
    modal.id = 'modalGrade';
    modal.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.6);z-index:9999;display:flex;align-items:center;justify-content:center;overflow-y:auto;padding:20px;';

    modal.innerHTML = `
    <div style="background:white;border-radius:16px;padding:28px;max-width:800px;width:95%;max-height:90vh;overflow-y:auto;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">
            <h2 style="color:#1e3a8a;">${isEdit ? '✏️ Editar' : '➕ Nova'} Grade de Disciplinas</h2>
            <button onclick="this.closest('.overlay-modal').remove()" style="background:none;border:none;font-size:24px;cursor:pointer;">✕</button>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px;">
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
            <label style="font-weight:600;font-size:13px;display:block;margin-bottom:4px;">Nomes das Séries/Anos</label>
            <div id="gradeSeriesContainer" style="display:flex;gap:8px;flex-wrap:wrap;">
                <!-- Preenchido dinamicamente -->
            </div>
        </div>

        <div style="border-top:2px solid #e5e7eb;padding-top:16px;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
                <h3 style="color:#1e3a8a;font-size:15px;">Disciplinas</h3>
                <button class="btn btn-primary btn-sm" onclick="adicionarDisciplinaGrade()" style="font-size:12px;">+ Adicionar Disciplina</button>
            </div>
            <div id="gradeDisciplinas" style="max-height:400px;overflow-y:auto;">
                <!-- Disciplinas serão listadas aqui -->
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

    // Preencher séries
    atualizarSeriesGrade(g.nomesSeries);

    // Preencher disciplinas existentes
    if (g.disciplinas && g.disciplinas.length) {
        g.disciplinas.forEach(d => adicionarDisciplinaGrade(d));
    }
}

function atualizarSeriesGrade(seriesExistentes) {
    const tipo = document.getElementById('gradeTipo').value;
    const container = document.getElementById('gradeSeriesContainer');
    const numSeries = tipo === 'medio' ? 3 : 9;

    const seriesPadrao = tipo === 'medio'
        ? ['1ª Série', '2ª Série', '3ª Série']
        : ['1º Ano', '2º Ano', '3º Ano', '4º Ano', '5º Ano', '6º Ano', '7º Ano', '8º Ano', '9º Ano'];

    const series = seriesExistentes && seriesExistentes.length === numSeries ? seriesExistentes : seriesPadrao;

    container.innerHTML = series.map((s, i) => `
        <input type="text" class="form-control grade-serie-nome" value="${s}" style="width:120px;font-size:12px;padding:6px 8px;" data-index="${i}">
    `).join('');

    // Atualizar o label do botão carregar padrão
    const btnPadrao = document.getElementById('btnCarregarPadrao');
    if (btnPadrao) {
        btnPadrao.textContent = tipo === 'medio' ? '📋 Carregar Padrão Médio' : '📋 Carregar Padrão Fundamental';
    }
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
    const container = document.getElementById('gradeDisciplinas');
    const tipo = document.getElementById('gradeTipo').value;
    const categorias = obterCategoriasPorTipo(tipo);

    const row = document.createElement('div');
    row.className = 'grade-disc-row';
    row.style.cssText = 'display:flex;gap:8px;align-items:center;margin-bottom:6px;padding:6px;background:#f8fafc;border-radius:8px;';
    row.innerHTML = `
        <input type="text" class="form-control disc-nome" value="${disc ? escapeHtml(disc.nome) : ''}" placeholder="Nome da Disciplina" style="flex:2;font-size:12px;padding:6px 8px;">
        <select class="form-control disc-categoria" style="flex:1;font-size:12px;padding:6px 8px;">
            ${categorias.map(c => `<option value="${c[0]}" ${disc && disc.categoria === c[0] ? 'selected' : ''}>${c[1]}</option>`).join('')}
        </select>
        <input type="number" class="form-control disc-ch" value="${disc ? disc.cargaHorariaPadrao || '' : ''}" placeholder="CH" title="Carga Horária Padrão" style="width:70px;font-size:12px;padding:6px 8px;">
        <button onclick="this.closest('.grade-disc-row').remove()" style="background:#fee2e2;color:#991b1b;border:1px solid #fca5a5;padding:4px 8px;border-radius:6px;cursor:pointer;font-size:14px;" title="Remover">✕</button>
    `;
    container.appendChild(row);
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
    const container = document.getElementById('gradeDisciplinas');
    container.innerHTML = '';

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
    const container = document.getElementById('gradeDisciplinas');
    container.innerHTML = '';

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

    const nomesSeries = [...document.querySelectorAll('.grade-serie-nome')].map(el => el.value.trim());
    const rows = document.querySelectorAll('.grade-disc-row');
    const disciplinas = [];
    rows.forEach(row => {
        const n = row.querySelector('.disc-nome').value.trim();
        if (!n) return;
        disciplinas.push({
            nome: n,
            categoria: row.querySelector('.disc-categoria').value,
            cargaHorariaPadrao: parseInt(row.querySelector('.disc-ch').value) || 0
        });
    });

    if (!disciplinas.length) { mostrarNotificacao('Adicione ao menos uma disciplina.', 'error'); return; }

    const body = { tipo, nome, disciplinas, numSeries: nomesSeries.length, nomesSeries };
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
    const sel = document.getElementById('histAluno');
    if (!sel) return;
    sel.innerHTML = '<option value="">Selecione um aluno...</option>';
    if (APP_STATE.alunos && APP_STATE.alunos.length) {
        APP_STATE.alunos.forEach(a => {
            const info = [a.serie, a.turma].filter(Boolean).join(' - ');
            sel.innerHTML += `<option value="${a.id}">${a.nome}${info ? ' (' + info + ')' : ''}</option>`;
        });
    }
}

async function carregarGradesParaNotas() {
    const tipo = document.getElementById('histTipo').value;
    const sel = document.getElementById('histGrade');
    sel.innerHTML = '<option value="">Carregando...</option>';
    document.getElementById('formNotas').style.display = 'none';

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
                                value="${nd.ch !== undefined ? nd.ch : disc.cargaHorariaPadrao || ''}" style="width:55px;text-align:center;border:1px solid #d1d5db;border-radius:4px;padding:3px;font-size:11px;">
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

    <div style="display:flex;gap:10px;justify-content:flex-end;margin-top:15px;">
        <button class="btn btn-secondary" onclick="abrirFichaIndividual()" style="font-size:13px;padding:8px 16px;">
            📝 Ficha Individual (Verso)
        </button>
        <button class="btn btn-primary" onclick="salvarNotasHistorico()" style="font-size:14px;padding:10px 24px;">
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
                console.log(`✅ Grade criada: ${grade.nome} (${grade.disciplinas.length} disciplinas)`);
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

// ==================== GERAÇÃO DE PDF (placeholder) ====================
function gerarHistoricoPDF() {
    mostrarNotificacao('Geração de PDF do Histórico será implementada na próxima fase.', 'info');
}

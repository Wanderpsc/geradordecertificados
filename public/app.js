// ==================== ESTADO DA APLICAÇÃO ====================
const APP_STATE = {
    alunos: JSON.parse(localStorage.getItem('alunos')) || [],
    templateSelecionado: 'estadual-pi',
    templateCustom: localStorage.getItem('templateCustom') || null,
    alunoEditando: null
};

// ==================== TEMPLATES DE CERTIFICADOS ====================
const TEMPLATES = {
    'estadual-pi': {
        nome: 'Modelo Estadual - PI',
        cor1: '#1e3a8a',
        cor2: '#3b82f6',
        corTexto: '#1e293b',
        fonte: 'serif'
    },
    'classico-azul': {
        nome: 'Clássico Azul',
        cor1: '#1e3a8a',
        cor2: '#3b82f6',
        corTexto: '#1e293b',
        fonte: 'serif'
    },
    'elegante-verde': {
        nome: 'Elegante Verde',
        cor1: '#064e3b',
        cor2: '#10b981',
        corTexto: '#1e293b',
        fonte: 'serif'
    },
    'moderno-roxo': {
        nome: 'Moderno Roxo',
        cor1: '#581c87',
        cor2: '#a855f7',
        corTexto: '#1e293b',
        fonte: 'sans-serif'
    },
    'profissional-cinza': {
        nome: 'Profissional Cinza',
        cor1: '#1f2937',
        cor2: '#6b7280',
        corTexto: '#111827',
        fonte: 'sans-serif'
    },
    'festivo-laranja': {
        nome: 'Festivo Laranja',
        cor1: '#9a3412',
        cor2: '#f97316',
        corTexto: '#1e293b',
        fonte: 'serif'
    },
    'corporativo-azul': {
        nome: 'Corporativo Azul',
        cor1: '#0c4a6e',
        cor2: '#0284c7',
        corTexto: '#1e293b',
        fonte: 'sans-serif'
    }
};

// ==================== INICIALIZAÇÃO ====================
document.addEventListener('DOMContentLoaded', () => {
    inicializarTabs();
    inicializarFormulario();
    inicializarTemplates();
    carregarAlunos(); // Carregar alunos do servidor
    carregarTemplateCustom();
});

// ==================== GERENCIAMENTO DE TABS ====================
function inicializarTabs() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetTab = button.dataset.tab;
            navegarParaTab(targetTab);
        });
    });
    
    // Restaurar aba da URL ou usar primeira aba
    const hash = window.location.hash.slice(1);
    if (hash) {
        navegarParaTab(hash);
    } else {
        navegarParaTab('cadastro');
    }
    
    // Escutar mudanças no hash
    window.addEventListener('hashchange', () => {
        const novaTab = window.location.hash.slice(1);
        if (novaTab) {
            navegarParaTab(novaTab, false);
        }
    });
}

function navegarParaTab(targetTab, atualizarHash = true) {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabButtons.forEach(btn => btn.classList.remove('active'));
    tabContents.forEach(content => content.classList.remove('active'));
    
    const btnAlvo = document.querySelector(`[data-tab="${targetTab}"]`);
    const contentAlvo = document.getElementById(targetTab);
    
    if (btnAlvo && contentAlvo) {
        btnAlvo.classList.add('active');
        contentAlvo.classList.add('active');
        
        if (atualizarHash) {
            window.location.hash = targetTab;
        }
    }
}

// ==================== FORMULÁRIO DE CADASTRO ====================

// ==================== FORMULÁRIO DE CADASTRO ====================
function inicializarFormulario() {
    const form = document.getElementById('formAluno');
    const btnLimpar = document.getElementById('btnLimpar');

    // Máscara de CPF
    document.getElementById('cpfAluno').addEventListener('input', (e) => {
        let valor = e.target.value.replace(/\D/g, '');
        if (valor.length <= 11) {
            valor = valor.replace(/(\d{3})(\d)/, '$1.$2');
            valor = valor.replace(/(\d{3})(\d)/, '$1.$2');
            valor = valor.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
            e.target.value = valor;
        }
    });

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        cadastrarAluno();
    });

    btnLimpar.addEventListener('click', () => {
        form.reset();
        APP_STATE.alunoEditando = null;
        mostrarNotificacao('Formulário limpo', 'info');
    });

    // Busca de alunos
    document.getElementById('buscarAluno').addEventListener('input', (e) => {
        atualizarListaAlunos(e.target.value);
    });

    // Botões de ação
    document.getElementById('btnLimparTodos').addEventListener('click', limparTodosAlunos);
    document.getElementById('btnExportarDados').addEventListener('click', exportarDados);
    document.getElementById('btnFazerBackup').addEventListener('click', fazerBackupCompleto);
    document.getElementById('btnCadastroLote').addEventListener('click', abrirModalCadastroLote);
    
    // Verificar se precisa lembrar de fazer backup
    verificarLembreteBackup();
}

async function cadastrarAluno() {
    const token = localStorage.getItem('token');
    if (!token) {
        mostrarNotificacao('Sessão expirada. Faça login novamente.', 'error');
        window.location.href = 'login.html';
        return;
    }

    const aluno = {
        nome: document.getElementById('nomeAluno').value.trim(),
        rg: document.getElementById('rgAluno').value.trim(),
        orgaoEmissor: document.getElementById('orgaoEmissor').value.trim(),
        cpf: document.getElementById('cpfAluno').value.trim(),
        dataNascimento: {
            dia: parseInt(document.getElementById('diaNascimento').value),
            mes: document.getElementById('mesNascimento').value,
            ano: parseInt(document.getElementById('anoNascimento').value)
        },
        naturalidade: {
            cidade: document.getElementById('cidadeNascimento').value.trim(),
            estado: document.getElementById('estadoNascimento').value.trim()
        },
        filiacao: {
            mae: document.getElementById('nomeMae').value.trim(),
            pai: document.getElementById('nomePai').value.trim()
        },
        dataConfeccao: document.getElementById('dataConfeccao').value,
        resolucao: document.getElementById('resolucao').value.trim(),
        anoConclusao: document.getElementById('anoConclusao').value,
        nacionalidade: document.getElementById('nacionalidade').value.trim(),
        observacoes: document.getElementById('observacoes').value.trim()
    };

    try {
        const isEdicao = APP_STATE.alunoEditando !== null;
        const url = isEdicao 
            ? `http://localhost:5000/api/alunos/${APP_STATE.alunoEditando}`
            : 'http://localhost:5000/api/alunos';
        const method = isEdicao ? 'PUT' : 'POST';

        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(aluno)
        });

        const data = await response.json();

        if (data.success) {
            document.getElementById('formAluno').reset();
            APP_STATE.alunoEditando = null;
            await carregarAlunos(); // Recarrega a lista do servidor
            const acao = isEdicao ? 'atualizado' : 'cadastrado';
            mostrarNotificacao(`Aluno ${aluno.nome} ${acao} com sucesso!`, 'success');
        } else {
            mostrarNotificacao(data.message || 'Erro ao processar aluno', 'error');
        }
    } catch (error) {
        console.error('Erro ao cadastrar aluno:', error);
        mostrarNotificacao('Erro ao conectar com o servidor', 'error');
    }
}

async function carregarAlunos() {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
        const response = await fetch('http://localhost:5000/api/alunos', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();

        if (data.success) {
            // Converte os alunos do MongoDB para o formato esperado pelo sistema
            APP_STATE.alunos = data.alunos.map(aluno => ({
                id: aluno._id,
                nome: aluno.nome,
                rg: aluno.rg,
                orgaoEmissor: aluno.orgaoEmissor,
                cpf: aluno.cpf,
                diaNascimento: aluno.dataNascimento?.dia || '',
                mesNascimento: aluno.dataNascimento?.mes || '',
                anoNascimento: aluno.dataNascimento?.ano || '',
                cidadeNascimento: aluno.naturalidade?.cidade || '',
                estadoNascimento: aluno.naturalidade?.estado || '',
                nomeMae: aluno.filiacao?.mae || '',
                nomePai: aluno.filiacao?.pai || '',
                dataConfeccao: aluno.dataConfeccao,
                resolucao: aluno.resolucao,
                anoConclusao: aluno.anoConclusao,
                nacionalidade: aluno.nacionalidade,
                observacoes: aluno.observacoes
            }));
            
            atualizarListaAlunos();
            atualizarSelectAlunos();
        }
    } catch (error) {
        console.error('Erro ao carregar alunos:', error);
    }
}

function editarAluno(id) {
    const aluno = APP_STATE.alunos.find(a => a.id === id);
    if (!aluno) return;

    document.getElementById('nomeAluno').value = aluno.nome || '';
    document.getElementById('rgAluno').value = aluno.rg || '';
    document.getElementById('orgaoEmissor').value = aluno.orgaoEmissor || '';
    document.getElementById('cpfAluno').value = aluno.cpf || '';
    document.getElementById('diaNascimento').value = aluno.diaNascimento || '';
    document.getElementById('mesNascimento').value = aluno.mesNascimento || '';
    document.getElementById('anoNascimento').value = aluno.anoNascimento || '';
    document.getElementById('cidadeNascimento').value = aluno.cidadeNascimento || '';
    document.getElementById('estadoNascimento').value = aluno.estadoNascimento || '';
    document.getElementById('nomeMae').value = aluno.nomeMae || '';
    document.getElementById('nomePai').value = aluno.nomePai || '';
    document.getElementById('dataConfeccao').value = aluno.dataConfeccao || '';
    document.getElementById('resolucao').value = aluno.resolucao || '';
    document.getElementById('anoConclusao').value = aluno.anoConclusao || '';
    document.getElementById('nacionalidade').value = aluno.nacionalidade || 'Brasileira';
    document.getElementById('observacoes').value = aluno.observacoes || '';

    // Armazenar ID do aluno sendo editado
    APP_STATE.alunoEditando = id;
    
    // Mudar para a aba de cadastro
    document.querySelector('[data-tab="cadastro"]').click();
    mostrarNotificacao('Aluno carregado para edicao. Faca as alteracoes e clique em Cadastrar.', 'info');
}

async function excluirAluno(id, mostrarMensagem = true) {
    const token = localStorage.getItem('token');
    const index = APP_STATE.alunos.findIndex(a => a.id === id);
    if (index !== -1) {
        const nome = APP_STATE.alunos[index].nome;
        
        try {
            const response = await fetch(`http://localhost:5000/api/alunos/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await response.json();

            if (data.success) {
                APP_STATE.alunos.splice(index, 1);
                atualizarListaAlunos();
                atualizarSelectAlunos();
                
                if (mostrarMensagem) {
                    mostrarNotificacao(`Aluno ${nome} removido`, 'success');
                }
            } else {
                mostrarNotificacao(data.message || 'Erro ao excluir aluno', 'error');
            }
        } catch (error) {
            console.error('Erro ao excluir aluno:', error);
            mostrarNotificacao('Erro ao conectar com o servidor', 'error');
        }
    }
}

function limparTodosAlunos() {
    if (confirm('Tem certeza que deseja remover TODOS os alunos? Esta ação não pode ser desfeita!')) {
        APP_STATE.alunos = [];
        salvarAlunos();
        atualizarListaAlunos();
        atualizarSelectAlunos();
        mostrarNotificacao('Todos os alunos foram removidos', 'success');
    }
}

// ==================== CADASTRO EM LOTE ====================
const API_URL_ALUNOS = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:5000/api/alunos'
    : 'https://gerador-certificados.onrender.com/api/alunos';

function abrirModalCadastroLote() {
    const modal = document.createElement('div');
    modal.id = 'modal-cadastro-lote';
    modal.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(0,0,0,0.8); display: flex; align-items: center;
        justify-content: center; z-index: 10000;
    `;
    modal.innerHTML = `
        <div style="background: white; padding: 28px; border-radius: 15px; max-width: 750px; width: 95%; box-shadow: 0 10px 40px rgba(0,0,0,0.3); max-height: 92vh; overflow-y: auto;">
            <div style="text-align: center; margin-bottom: 16px;">
                <div style="font-size: 50px;">📋</div>
                <h2 style="color: #1e3a8a; margin-top: 8px;">Cadastro de Alunos em Lote</h2>
                <p style="font-size: 13px; color: #666;">Cole os dados dos alunos no formato abaixo (separados por <strong>;</strong> ponto e vírgula)</p>
            </div>

            <div style="background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 8px; padding: 14px; margin-bottom: 14px;">
                <p style="font-size: 13px; font-weight: 600; color: #1e3a8a; margin-bottom: 6px;">Formato (uma linha por aluno):</p>
                <code style="font-size: 11px; color: #334155; word-break: break-all; display: block; background: white; padding: 8px; border-radius: 6px;">
                    Nome; RG; Órgão Emissor; CPF; Dia Nasc; Mês Nasc; Ano Nasc; Cidade Nasc; Estado Nasc; Nome Mãe; Nome Pai
                </code>
                <p style="font-size: 12px; color: #64748b; margin-top: 8px;">
                    <strong>Exemplo:</strong><br>
                    <span style="font-family: monospace; font-size: 11px;">Maria Silva; 1.234.567; SSP/PI; 123.456.789-00; 15; março; 2006; Curimatá; Piauí; Ana Silva; José Silva</span>
                </p>
                <p style="font-size: 12px; color: #64748b; margin-top: 6px;">
                    📌 Campos opcionais ao final: <em>Data Confecção (AAAA-MM-DD); Resolução; Ano Conclusão; Nacionalidade</em>
                </p>
            </div>

            <div style="margin-bottom: 14px;">
                <label style="font-weight: 600; font-size: 14px; display: block; margin-bottom: 4px;">Dados dos Alunos</label>
                <textarea id="lote-dados" rows="10" placeholder="Cole aqui os dados dos alunos, uma linha por aluno...
Maria Silva; 1.234.567; SSP/PI; 123.456.789-00; 15; março; 2006; Curimatá; Piauí; Ana Silva; José Silva
João Santos; 2.345.678; SSP/PI; 234.567.890-11; 20; janeiro; 2007; Teresina; Piauí; Maria Santos; Pedro Santos"
                    style="width: 100%; padding: 12px; border: 2px solid #d1d5db; border-radius: 8px; font-size: 13px; font-family: monospace; resize: vertical;"></textarea>
            </div>

            <div id="lote-preview" style="display: none; margin-bottom: 14px;">
                <h3 style="font-size: 14px; color: #1e3a8a; margin-bottom: 8px;">Pré-visualização (<span id="lote-count">0</span> alunos)</h3>
                <div id="lote-preview-content" style="max-height: 200px; overflow-y: auto; border: 1px solid #e5e7eb; border-radius: 8px; font-size: 12px;"></div>
            </div>

            <div id="lote-progresso" style="display: none; margin-bottom: 14px;">
                <div style="background: #f3f4f6; border-radius: 8px; overflow: hidden; height: 24px;">
                    <div id="lote-barra" style="background: #16a34a; height: 100%; width: 0%; transition: width 0.3s; display: flex; align-items: center; justify-content: center; color: white; font-size: 12px; font-weight: 600;"></div>
                </div>
                <p id="lote-status" style="font-size: 13px; color: #666; margin-top: 6px; text-align: center;"></p>
            </div>

            <div style="display: flex; gap: 10px; justify-content: center; flex-wrap: wrap;">
                <button type="button" onclick="preVisualizarLote()"
                    style="background: #2563eb; color: white; border: none; padding: 12px 24px; border-radius: 8px; cursor: pointer; font-size: 15px; font-weight: bold;">
                    🔍 Pré-visualizar
                </button>
                <button type="button" id="btn-enviar-lote" onclick="enviarCadastroLote()"
                    style="background: #16a34a; color: white; border: none; padding: 12px 24px; border-radius: 8px; cursor: pointer; font-size: 15px; font-weight: bold;">
                    ✅ Cadastrar Todos
                </button>
                <button type="button" onclick="document.getElementById('modal-cadastro-lote').remove()"
                    style="background: #6b7280; color: white; border: none; padding: 12px 24px; border-radius: 8px; cursor: pointer; font-size: 15px;">
                    Cancelar
                </button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

function parsearLinhaAluno(linha) {
    const campos = linha.split(';').map(c => c.trim());
    if (campos.length < 11) return null;

    const mesesValidos = ['janeiro','fevereiro','março','abril','maio','junho',
        'julho','agosto','setembro','outubro','novembro','dezembro'];
    const mes = campos[5].toLowerCase();
    if (!mesesValidos.includes(mes)) return null;

    const cpf = campos[3];
    if (!/^\d{3}\.\d{3}\.\d{3}-\d{2}$/.test(cpf)) return null;

    const aluno = {
        nome: campos[0],
        rg: campos[1],
        orgaoEmissor: campos[2],
        cpf: cpf,
        dataNascimento: {
            dia: parseInt(campos[4]),
            mes: mes,
            ano: parseInt(campos[6])
        },
        naturalidade: {
            cidade: campos[7],
            estado: campos[8]
        },
        filiacao: {
            mae: campos[9],
            pai: campos[10]
        },
        nacionalidade: 'Brasileira'
    };

    // Campos opcionais
    if (campos[11]) aluno.dataConfeccao = campos[11];
    if (campos[12]) aluno.resolucao = campos[12];
    if (campos[13]) aluno.anoConclusao = campos[13];
    if (campos[14]) aluno.nacionalidade = campos[14];

    return aluno;
}

function preVisualizarLote() {
    const texto = document.getElementById('lote-dados').value.trim();
    if (!texto) {
        alert('Cole os dados dos alunos primeiro');
        return;
    }

    const linhas = texto.split('\n').filter(l => l.trim());
    const preview = document.getElementById('lote-preview');
    const content = document.getElementById('lote-preview-content');
    const count = document.getElementById('lote-count');

    let html = '<table style="width: 100%; border-collapse: collapse;">';
    html += '<thead><tr style="background: #f1f5f9;">';
    html += '<th style="padding: 6px 8px; text-align: left; font-size: 11px; border-bottom: 1px solid #e5e7eb;">#</th>';
    html += '<th style="padding: 6px 8px; text-align: left; font-size: 11px; border-bottom: 1px solid #e5e7eb;">Nome</th>';
    html += '<th style="padding: 6px 8px; text-align: left; font-size: 11px; border-bottom: 1px solid #e5e7eb;">CPF</th>';
    html += '<th style="padding: 6px 8px; text-align: left; font-size: 11px; border-bottom: 1px solid #e5e7eb;">Nascimento</th>';
    html += '<th style="padding: 6px 8px; text-align: left; font-size: 11px; border-bottom: 1px solid #e5e7eb;">Status</th>';
    html += '</tr></thead><tbody>';

    let validos = 0;
    linhas.forEach((linha, i) => {
        const aluno = parsearLinhaAluno(linha);
        const ok = aluno !== null;
        if (ok) validos++;
        html += `<tr style="background: ${ok ? '#f0fdf4' : '#fef2f2'};">`;
        html += `<td style="padding: 5px 8px; font-size: 12px; border-bottom: 1px solid #f1f5f9;">${i + 1}</td>`;
        html += `<td style="padding: 5px 8px; font-size: 12px; border-bottom: 1px solid #f1f5f9;">${ok ? aluno.nome : '<span style=color:#dc2626>Erro na linha</span>'}</td>`;
        html += `<td style="padding: 5px 8px; font-size: 12px; border-bottom: 1px solid #f1f5f9;">${ok ? aluno.cpf : '-'}</td>`;
        html += `<td style="padding: 5px 8px; font-size: 12px; border-bottom: 1px solid #f1f5f9;">${ok ? `${aluno.dataNascimento.dia}/${aluno.dataNascimento.mes}/${aluno.dataNascimento.ano}` : '-'}</td>`;
        html += `<td style="padding: 5px 8px; font-size: 12px; border-bottom: 1px solid #f1f5f9;">${ok ? '<span style=color:#16a34a>✓ OK</span>' : '<span style=color:#dc2626>✗ Inválido</span>'}</td>`;
        html += '</tr>';
    });
    html += '</tbody></table>';

    count.textContent = `${validos}/${linhas.length}`;
    content.innerHTML = html;
    preview.style.display = 'block';
}

async function enviarCadastroLote() {
    const token = localStorage.getItem('token');
    if (!token) {
        mostrarNotificacao('Sessão expirada. Faça login novamente.', 'error');
        return;
    }

    const texto = document.getElementById('lote-dados').value.trim();
    if (!texto) {
        alert('Cole os dados dos alunos primeiro');
        return;
    }

    const linhas = texto.split('\n').filter(l => l.trim());
    const alunos = [];
    const erros = [];

    linhas.forEach((linha, i) => {
        const aluno = parsearLinhaAluno(linha);
        if (aluno) {
            alunos.push(aluno);
        } else {
            erros.push(i + 1);
        }
    });

    if (alunos.length === 0) {
        alert('Nenhum aluno válido encontrado. Verifique o formato dos dados.');
        return;
    }

    if (erros.length > 0) {
        if (!confirm(`⚠️ ${erros.length} linha(s) com erro (linhas: ${erros.join(', ')}) serão ignoradas.\n\nDeseja cadastrar os ${alunos.length} aluno(s) válidos?`)) {
            return;
        }
    }

    const btnEnviar = document.getElementById('btn-enviar-lote');
    btnEnviar.disabled = true;
    btnEnviar.textContent = '⏳ Cadastrando...';

    const progresso = document.getElementById('lote-progresso');
    const barra = document.getElementById('lote-barra');
    const status = document.getElementById('lote-status');
    progresso.style.display = 'block';

    let sucesso = 0;
    let falhas = 0;

    for (let i = 0; i < alunos.length; i++) {
        try {
            const response = await fetch(API_URL_ALUNOS, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(alunos[i])
            });

            const data = await response.json();
            if (data.success) {
                sucesso++;
            } else {
                falhas++;
            }
        } catch (error) {
            falhas++;
        }

        const pct = Math.round(((i + 1) / alunos.length) * 100);
        barra.style.width = pct + '%';
        barra.textContent = pct + '%';
        status.textContent = `Processando ${i + 1} de ${alunos.length}... (${sucesso} ok, ${falhas} erros)`;
    }

    status.textContent = `✅ Concluído! ${sucesso} cadastrado(s) com sucesso, ${falhas} erro(s).`;
    barra.style.width = '100%';
    barra.style.background = falhas > 0 ? '#f59e0b' : '#16a34a';

    btnEnviar.disabled = false;
    btnEnviar.textContent = '✅ Cadastrar Todos';

    // Recarregar lista
    await carregarAlunos();
    mostrarNotificacao(`${sucesso} aluno(s) cadastrado(s) em lote!`, 'success');
}

function atualizarListaAlunos(filtro = '') {
    const container = document.getElementById('listaAlunos');
    const totalElement = document.getElementById('totalAlunos');
    
    let alunosFiltrados = APP_STATE.alunos;
    
    if (filtro) {
        const termo = filtro.toLowerCase();
        alunosFiltrados = APP_STATE.alunos.filter(aluno => 
            aluno.nome.toLowerCase().includes(termo) ||
            aluno.curso.toLowerCase().includes(termo) ||
            aluno.cpf.includes(termo)
        );
    }

    totalElement.textContent = APP_STATE.alunos.length;

    if (alunosFiltrados.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <h3>📋 Nenhum aluno cadastrado</h3>
                <p>Cadastre alunos na aba "Cadastrar Alunos" para começar</p>
            </div>
        `;
        return;
    }

    container.innerHTML = alunosFiltrados.map(aluno => `
        <div class="aluno-item">
            <div class="aluno-header">
                <div class="aluno-nome">${aluno.nome}</div>
                <div class="aluno-actions">
                    <button class="btn btn-primary btn-small" onclick="editarAluno('${aluno.id}')">✏️ Editar</button>
                    <button class="btn btn-danger btn-small" onclick="excluirAluno('${aluno.id}')">🗑️ Excluir</button>
                </div>
            </div>
            <div class="aluno-info">
                <div class="aluno-info-item">
                    <div class="aluno-info-label">RG</div>
                    <div>${aluno.rg}</div>
                </div>
                <div class="aluno-info-item">
                    <div class="aluno-info-label">CPF</div>
                    <div>${aluno.cpf}</div>
                </div>
                <div class="aluno-info-item">
                    <div class="aluno-info-label">Data de Nascimento</div>
                    <div>${aluno.diaNascimento} de ${aluno.mesNascimento} de ${aluno.anoNascimento}</div>
                </div>
                <div class="aluno-info-item">
                    <div class="aluno-info-label">Naturalidade</div>
                    <div>${aluno.cidadeNascimento} - ${aluno.estadoNascimento}</div>
                </div>
                <div class="aluno-info-item">
                    <div class="aluno-info-label">Ano de Conclusão</div>
                    <div>${aluno.anoConclusao}</div>
                </div>
                <div class="aluno-info-item">
                    <div class="aluno-info-label">Resolução</div>
                    <div>${aluno.resolucao}</div>
                </div>
            </div>
            ${aluno.observacoes ? `<p style="margin-top: 10px; color: #64748b;"><strong>Obs:</strong> ${aluno.observacoes}</p>` : ''}
        </div>
    `).join('');
}

function atualizarSelectAlunos() {
    const select = document.getElementById('selectAluno');
    
    if (APP_STATE.alunos.length === 0) {
        select.innerHTML = '<option value="">-- Nenhum aluno cadastrado --</option>';
        return;
    }

    select.innerHTML = '<option value="">-- Selecione um aluno --</option>' +
        APP_STATE.alunos.map(aluno => 
            `<option value="${aluno.id}">${aluno.nome}${aluno.anoConclusao ? ' (' + aluno.anoConclusao + ')' : ''}</option>`
        ).join('');
}

// ==================== TEMPLATES ====================
function inicializarTemplates() {
    const grid = document.getElementById('templatesGrid');
    
    grid.innerHTML = Object.keys(TEMPLATES).map(key => `
        <div class="template-card ${key === APP_STATE.templateSelecionado ? 'selected' : ''}" 
             onclick="selecionarTemplate('${key}')">
            <div class="template-preview" style="background: linear-gradient(135deg, ${TEMPLATES[key].cor1}, ${TEMPLATES[key].cor2})">
                📜
            </div>
            <div class="template-name">${TEMPLATES[key].nome}</div>
        </div>
    `).join('');

    // Upload de template customizado
    document.getElementById('uploadTemplate').addEventListener('change', handleUploadTemplate);

    // Botões de geração
    document.getElementById('btnGerarIndividual').addEventListener('click', gerarCertificadoIndividual);
    document.getElementById('btnGerarLote').addEventListener('click', gerarCertificadosLote);

    atualizarTemplateInfo();
}

function selecionarTemplate(key) {
    APP_STATE.templateSelecionado = key;
    
    document.querySelectorAll('.template-card').forEach(card => {
        card.classList.remove('selected');
    });
    
    event.target.closest('.template-card').classList.add('selected');
    atualizarTemplateInfo();
    mostrarNotificacao(`Template "${TEMPLATES[key].nome}" selecionado`, 'success');
}

function handleUploadTemplate(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
        APP_STATE.templateCustom = event.target.result;
        localStorage.setItem('templateCustom', event.target.result);
        APP_STATE.templateSelecionado = 'custom';
        carregarTemplateCustom();
        atualizarTemplateInfo();
        mostrarNotificacao('Template personalizado carregado com sucesso!', 'success');
    };
    reader.readAsDataURL(file);
}

function carregarTemplateCustom() {
    const preview = document.getElementById('customTemplatePreview');
    if (APP_STATE.templateCustom) {
        preview.innerHTML = `
            <img src="${APP_STATE.templateCustom}" alt="Template Personalizado">
            <div style="margin-top: 10px;">
                <button class="btn btn-primary" onclick="selecionarTemplateCustom()">✓ Usar Este Template</button>
                <button class="btn btn-danger" onclick="removerTemplateCustom()">✗ Remover</button>
            </div>
        `;
    }
}

function selecionarTemplateCustom() {
    APP_STATE.templateSelecionado = 'custom';
    document.querySelectorAll('.template-card').forEach(card => {
        card.classList.remove('selected');
    });
    atualizarTemplateInfo();
    mostrarNotificacao('Template personalizado selecionado', 'success');
}

function removerTemplateCustom() {
    if (confirm('Deseja remover o template personalizado?')) {
        APP_STATE.templateCustom = null;
        localStorage.removeItem('templateCustom');
        document.getElementById('customTemplatePreview').innerHTML = '';
        if (APP_STATE.templateSelecionado === 'custom') {
            APP_STATE.templateSelecionado = 'estadual-pi';
        }
        atualizarTemplateInfo();
        mostrarNotificacao('Template personalizado removido', 'success');
    }
}

function atualizarTemplateInfo() {
    const info = document.getElementById('templateSelecionado');
    if (APP_STATE.templateSelecionado === 'custom') {
        info.textContent = 'Personalizado';
    } else {
        info.textContent = TEMPLATES[APP_STATE.templateSelecionado].nome;
    }
}

// ==================== GERAÇÃO DE CERTIFICADOS ====================
async function gerarCertificadoIndividual() {
    const selectAluno = document.getElementById('selectAluno');
    const alunoId = selectAluno.value; // MongoDB usa string _id, não número
    
    if (!alunoId) {
        mostrarNotificacao('Selecione um aluno primeiro!', 'error');
        return;
    }

    const aluno = APP_STATE.alunos.find(a => a.id === alunoId);
    if (!aluno) return;

    await gerarCertificado(aluno);
    mostrarNotificacao(`Certificado de ${aluno.nome} gerado com sucesso!`, 'success');
}

async function gerarCertificadosLote() {
    if (APP_STATE.alunos.length === 0) {
        mostrarNotificacao('Nenhum aluno cadastrado!', 'error');
        return;
    }

    if (!confirm(`Deseja gerar ${APP_STATE.alunos.length} certificado(s)?`)) {
        return;
    }

    mostrarNotificacao('Gerando certificados em lote...', 'info');

    for (let i = 0; i < APP_STATE.alunos.length; i++) {
        await gerarCertificado(APP_STATE.alunos[i], true);
        await new Promise(resolve => setTimeout(resolve, 500)); // Pausa entre gerações
    }

    mostrarNotificacao(`${APP_STATE.alunos.length} certificado(s) gerado(s) com sucesso!`, 'success');
}

async function gerarCertificado(aluno, emLote = false) {
    try {
        // Verificar se jsPDF está disponível
        if (!window.jspdf || !window.jspdf.jsPDF) {
            mostrarNotificacao('Biblioteca jsPDF não carregada. Recarregue a página.', 'error');
            return;
        }
        
        const { jsPDF } = window.jspdf;
        
        // Criar PDF em formato A4 landscape
        const pdf = new jsPDF({
            orientation: 'landscape',
            unit: 'mm',
            format: 'a4'
        });

        // Gerar frente do certificado
        await gerarFrenteCertificado(pdf, aluno);
        
        // Adicionar nova página para o verso
        pdf.addPage();
        gerarVersoCertificado(pdf, aluno);
        
        // Abrir PDF em nova aba para visualização
        const pdfBlob = pdf.output('blob');
        const pdfUrl = URL.createObjectURL(pdfBlob);
        window.open(pdfUrl, '_blank');
        
        // Aguardar um pouco e fazer o download também
        setTimeout(() => {
            const nomeArquivo = `Certificado_${aluno.nome.replace(/\s+/g, '_')}.pdf`;
            pdf.save(nomeArquivo);
        }, 500);
    } catch (error) {
        console.error('Erro ao gerar certificado:', error);
        mostrarNotificacao('Erro ao gerar certificado: ' + error.message, 'error');
    }
}

async function gerarFrenteCertificado(pdf, aluno) {
    const pageWidth = 297;
    const pageHeight = 210;
    const bordaEspessura = 7;
    
    // Fundo branco
    pdf.setFillColor(255, 255, 255);
    pdf.rect(0, 0, pageWidth, pageHeight, 'F');
    
    // Adicionar bordas verticais (esquerda e direita) em PNG de alta qualidade - PRIMEIRO
    if (typeof BORDA_VERTICAL !== 'undefined' && BORDA_VERTICAL) {
        try {
            // Borda esquerda - altura total da página
            pdf.addImage(BORDA_VERTICAL, 'PNG', 0, 0, bordaEspessura, pageHeight);
            // Borda direita - altura total da página
            pdf.addImage(BORDA_VERTICAL, 'PNG', pageWidth - bordaEspessura, 0, bordaEspessura, pageHeight);
        } catch(e) {
            console.error('Erro ao adicionar borda vertical:', e);
        }
    }
    
    // Adicionar bordas horizontais (superior e inferior) em PNG de alta qualidade - POR CIMA
    if (typeof BORDA_HORIZONTAL !== 'undefined' && BORDA_HORIZONTAL) {
        try {
            // Borda superior - largura total (cobre os cantos das verticais)
            pdf.addImage(BORDA_HORIZONTAL, 'PNG', 0, 0, pageWidth, bordaEspessura);
            // Borda inferior - largura total (cobre os cantos das verticais)
            pdf.addImage(BORDA_HORIZONTAL, 'PNG', 0, pageHeight - bordaEspessura, pageWidth, bordaEspessura);
        } catch(e) {
            console.error('Erro ao adicionar borda horizontal:', e);
        }
    }
    
    // Brasão Oficial do Brasil (imagem embutida em base64)
    const brasaoX = pageWidth / 2;
    const brasaoY = 30;
    const brasaoLargura = 46;
    const brasaoAltura = 30;
    
    // Usar a constante BRASAO_BRASIL definida em brasao-data.js
    if (typeof BRASAO_BRASIL !== 'undefined' && BRASAO_BRASIL && BRASAO_BRASIL.length > 100) {
        try {
            pdf.addImage(
                BRASAO_BRASIL,
                'PNG',
                brasaoX - brasaoLargura / 2,
                brasaoY - brasaoAltura / 2,
                brasaoLargura,
                brasaoAltura
            );
        } catch(e) {
            console.error('Erro ao adicionar brasão oficial:', e);
            alert('Erro ao carregar brasão. Verifique o arquivo brasao-data.js');
        }
    } else {
        console.error('BRASAO_BRASIL não está definido ou está vazio');
        alert('Brasão não carregado! Recarregue a página.');
    }
    
    // Cabeçalho
    pdf.setTextColor(30, 58, 138);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(14);
    pdf.text('REPÚBLICA FEDERATIVA DO BRASIL', pageWidth / 2, 50, { align: 'center' });
    pdf.setFontSize(14);
    pdf.text('ESTADO DO PIAUÍ', pageWidth / 2, 56, { align: 'center' });
    pdf.setFontSize(14);
    pdf.text('SECRETARIA DE ESTADO DA EDUCAÇÃO', pageWidth / 2, 62, { align: 'center' });
    
    // CNPJ e INEP
    pdf.setTextColor(0, 0, 0);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(14);
    const cnpjText = 'CNPJ Nº ';
    const cnpjNum = '01.902.400/0001-55';
    const inepText = 'INEP Nº ';
    const inepNum = '22076450';
    
    const espacoTotal = pdf.getTextWidth(cnpjText + cnpjNum + '        ' + inepText + inepNum);
    const inicioX = (pageWidth - espacoTotal) / 2;
    
    pdf.text(cnpjText, inicioX, 67);
    pdf.setFont('helvetica', 'bold');
    pdf.text(cnpjNum, inicioX + pdf.getTextWidth(cnpjText), 67);
    
    pdf.setFont('helvetica', 'normal');
    const posInep = inicioX + pdf.getTextWidth(cnpjText + cnpjNum) + 15;
    pdf.text(inepText, posInep, 67);
    pdf.setFont('helvetica', 'bold');
    pdf.text(inepNum, posInep + pdf.getTextWidth(inepText), 67);
    
    // Nome da instituição em itálico e sublinhado
    pdf.setFont('times', 'italic');
    pdf.setFontSize(14);
    const nomeInstituicao = 'Centro Estadual de Tempo Integral Desembargador Amaral';
    pdf.text(nomeInstituicao, pageWidth / 2, 75, { align: 'center' });
    const larguraNomeInst = pdf.getTextWidth(nomeInstituicao);
    pdf.setLineWidth(0.2);
    pdf.setDrawColor(0, 0, 0);
    pdf.line((pageWidth - larguraNomeInst) / 2, 76, (pageWidth + larguraNomeInst) / 2, 76);
    
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(7);
    pdf.text('NOME DO ESTABELECIMENTO DE ENSINO', pageWidth / 2, 80, { align: 'center' });
    
    // Endereço em itálico e sublinhado
    pdf.setFont('times', 'italic');
    pdf.setFontSize(14);
    const endereco = 'Praça Tiradentes – 96 – Centro – Curimatá – Piauí';
    pdf.text(endereco, pageWidth / 2, 86, { align: 'center' });
    const larguraEnd = pdf.getTextWidth(endereco);
    pdf.line((pageWidth - larguraEnd) / 2, 87, (pageWidth + larguraEnd) / 2, 87);
    
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(7);
    pdf.text('ENDEREÇO', pageWidth / 2, 91, { align: 'center' });
    
    // Resolução
    pdf.setFont('times', 'italic');
    pdf.setFontSize(14);
    const resolucaoTexto = aluno.resolucao ? `Resolução CEE/PI Nº ${aluno.resolucao}` : 'Resolução CEE/PI';
    pdf.text(resolucaoTexto, pageWidth / 2, 100, { align: 'center' });
    
    // Título
    pdf.setFont('times', 'bolditalic');
    pdf.setFontSize(16);
    pdf.setTextColor(30, 58, 138);
    pdf.text('CERTIFICADO DE CONCLUSÃO DO ENSINO MÉDIO', pageWidth / 2, 108, { align: 'center' });
    
    // Corpo do texto - texto justificado
    pdf.setFont('times', 'italic');
    pdf.setFontSize(14);
    pdf.setTextColor(0, 0, 0);
    
    let yPos = 125;
    const margemEsq = 20;
    const margemDir = pageWidth - 20;
    const larguraTexto = margemDir - margemEsq;
    const espacamentoLinha = 8;
    
    // Preparar todo o texto primeiro
    const textoParts = [
        { texto: 'A Direção da Instituição de Ensino ', negrito: false },
        { texto: 'Centro Estadual de Tempo Integral Desembargador Amaral', negrito: true },
        { texto: ', no uso de suas atribuições legais, confere a ', negrito: false },
        { texto: aluno.nome.toUpperCase(), negrito: true },
        { texto: ' CPF ', negrito: false },
        { texto: aluno.cpf, negrito: true },
        { texto: ', nascido(a) em ', negrito: false },
        { texto: String(aluno.diaNascimento).padStart(2, '0'), negrito: true },
        { texto: ' de ', negrito: false },
        { texto: aluno.mesNascimento, negrito: true },
        { texto: ' de ', negrito: false },
        { texto: aluno.anoNascimento, negrito: true },
        { texto: ', natural de ', negrito: false },
        { texto: aluno.cidadeNascimento, negrito: true },
        { texto: ', Estado de(o) ', negrito: false },
        { texto: aluno.estadoNascimento, negrito: true },
        { texto: ' de nacionalidade ', negrito: false },
        { texto: aluno.nacionalidade, negrito: true },
        { texto: ', filho(a) de ', negrito: false },
        { texto: aluno.nomeMae, negrito: true },
        { texto: ' e de ', negrito: false },
        { texto: aluno.nomePai, negrito: true },
        { texto: ' o presente certificado por ter concluído no ano de ', negrito: false },
        { texto: aluno.anoConclusao, negrito: true },
        { texto: ' o ', negrito: false },
        { texto: 'ENSINO MÉDIO', negrito: true },
        { texto: ', para que possa gozar de todos os direitos e prerrogativas concedidos pelas leis do País.', negrito: false }
    ];
    
    // Dividir em palavras mantendo a formatação
    let palavrasFormatadas = [];
    textoParts.forEach(part => {
        const textoString = String(part.texto || ''); // Converte para string e trata undefined
        const palavras = textoString.split(' ');
        palavras.forEach((palavra, idx) => {
            if (palavra) {
                palavrasFormatadas.push({ 
                    palavra: palavra, 
                    negrito: part.negrito,
                    espacoDepois: idx < palavras.length - 1
                });
            }
        });
    });
    
    // Renderizar com justificação
    posX = margemEsq;
    let linhaAtual = [];
    
    for (let i = 0; i < palavrasFormatadas.length; i++) {
        const item = palavrasFormatadas[i];
        pdf.setFont('times', item.negrito ? 'bolditalic' : 'italic');
        const larguraPalavra = pdf.getTextWidth(item.palavra + ' ');
        
        // Verificar se cabe na linha
        if (posX + larguraPalavra > margemDir && linhaAtual.length > 0) {
            // Justificar linha completa
            const espacoTotal = larguraTexto;
            let larguraUsada = 0;
            linhaAtual.forEach(p => {
                pdf.setFont('times', p.negrito ? 'bolditalic' : 'italic');
                larguraUsada += pdf.getTextWidth(p.palavra);
            });
            
            const espacoExtra = (espacoTotal - larguraUsada) / (linhaAtual.length - 1 || 1);
            let xAtual = margemEsq;
            
            linhaAtual.forEach((p, idx) => {
                pdf.setFont('times', p.negrito ? 'bolditalic' : 'italic');
                pdf.text(p.palavra, xAtual, yPos);
                xAtual += pdf.getTextWidth(p.palavra) + espacoExtra;
            });
            
            // Nova linha
            yPos += espacamentoLinha;
            posX = margemEsq;
            linhaAtual = [];
        }
        
        linhaAtual.push(item);
        posX += larguraPalavra;
    }
    
    // Última linha (não justificada)
    posX = margemEsq;
    linhaAtual.forEach(p => {
        pdf.setFont('times', p.negrito ? 'bolditalic' : 'italic');
        pdf.text(p.palavra, posX, yPos);
        posX += pdf.getTextWidth(p.palavra + ' ');
    });
    
    // Data de confecção
    yPos += 12;
    let dataFormatada = '';
    if (aluno.dataConfeccao) {
        const dataConf = new Date(aluno.dataConfeccao + 'T00:00:00');
        dataFormatada = `${dataConf.getDate()} de ${obterNomeMes(dataConf.getMonth())} de ${dataConf.getFullYear()}.`;
    } else {
        const hoje = new Date();
        dataFormatada = `${hoje.getDate()} de ${obterNomeMes(hoje.getMonth())} de ${hoje.getFullYear()}.`;
    }
    pdf.setFont('times', 'bold');
    pdf.setTextColor(30, 58, 138);
    pdf.text(dataFormatada, pageWidth / 2, yPos, { align: 'center' });
    
    // Linhas de assinatura - ajustadas
    yPos += 15;
    pdf.setLineWidth(0.5);
    pdf.setDrawColor(0, 0, 0);
    pdf.line(25, yPos, 130, yPos);
    pdf.line(167, yPos, 272, yPos);
    
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    pdf.setTextColor(30, 58, 138);
    pdf.text('SECRETÁRIO(A)', 77.5, yPos + 5, { align: 'center' });
    pdf.text('DIRETOR(A)', 219.5, yPos + 5, { align: 'center' });
    
    // Linha para concludente
    yPos += 15;
    pdf.line(100, yPos, 197, yPos);
    pdf.text('CONCLUDENTE', 148.5, yPos + 5, { align: 'center' });
}

function gerarVersoCertificado(pdf, aluno) {
    const pageWidth = 297;
    const pageHeight = 210;
    const bordaEspessura = 7;
    
    // Fundo branco
    pdf.setFillColor(255, 255, 255);
    pdf.rect(0, 0, pageWidth, pageHeight, 'F');
    
    // Adicionar bordas verticais (esquerda e direita) em PNG de alta qualidade - PRIMEIRO
    if (typeof BORDA_VERTICAL !== 'undefined' && BORDA_VERTICAL) {
        try {
            // Borda esquerda - altura total da página
            pdf.addImage(BORDA_VERTICAL, 'PNG', 0, 0, bordaEspessura, pageHeight);
            // Borda direita - altura total da página
            pdf.addImage(BORDA_VERTICAL, 'PNG', pageWidth - bordaEspessura, 0, bordaEspessura, pageHeight);
        } catch(e) {
            console.error('Erro ao adicionar borda vertical:', e);
        }
    }
    
    // Adicionar bordas horizontais (superior e inferior) em PNG de alta qualidade - POR CIMA
    if (typeof BORDA_HORIZONTAL !== 'undefined' && BORDA_HORIZONTAL) {
        try {
            // Borda superior - largura total (cobre os cantos das verticais)
            pdf.addImage(BORDA_HORIZONTAL, 'PNG', 0, 0, pageWidth, bordaEspessura);
            // Borda inferior - largura total (cobre os cantos das verticais)
            pdf.addImage(BORDA_HORIZONTAL, 'PNG', 0, pageHeight - bordaEspessura, pageWidth, bordaEspessura);
        } catch(e) {
            console.error('Erro ao adicionar borda horizontal:', e);
        }
    }
    
    // Cabeçalho do verso - linha 1
    pdf.setTextColor(30, 58, 138);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(7);
    
    let yPos = 25;
    let posX = 15;
    
    pdf.text('ESTABELECIMENTO DE ENSINO:', posX, yPos);
    pdf.setFont('helvetica', 'bold');
    posX += pdf.getTextWidth('ESTABELECIMENTO DE ENSINO: ');
    pdf.text('CENTRO ESTADUAL DE TEMPO INTEGRAL DESEMBARGADOR AMARAL', posX, yPos);
    
    pdf.setFont('helvetica', 'normal');
    posX = 195;
    pdf.text('MUNICÍPIO:', posX, yPos);
    pdf.setFont('helvetica', 'bold');
    posX += pdf.getTextWidth('MUNICÍPIO: ');
    pdf.text('Curimatá', posX, yPos);
    
    pdf.setFont('helvetica', 'normal');
    posX = 250;
    pdf.text('UF:', posX, yPos);
    pdf.setFont('helvetica', 'bold');
    posX += pdf.getTextWidth('UF: ');
    pdf.text('Piauí', posX, yPos);
    
    // Linha 2
    yPos += 5;
    posX = 15;
    pdf.setFont('helvetica', 'normal');
    pdf.text('ESTUDANTE:', posX, yPos);
    pdf.setFont('helvetica', 'bold');
    posX += pdf.getTextWidth('ESTUDANTE: ');
    pdf.text(String(aluno.nome || '').toUpperCase(), posX, yPos);
    
    pdf.setFont('helvetica', 'normal');
    posX = 150;
    pdf.text('RG:', posX, yPos);
    pdf.setFont('helvetica', 'bold');
    posX += pdf.getTextWidth('RG: ');
    pdf.text(String(aluno.rg || ''), posX, yPos);
    
    pdf.setFont('helvetica', 'normal');
    posX = 190;
    pdf.text('ÓRGÃO EMISSOR:', posX, yPos);
    pdf.setFont('helvetica', 'bold');
    posX += pdf.getTextWidth('ÓRGÃO EMISSOR: ');
    pdf.text(String(aluno.orgaoEmissor || ''), posX, yPos);
    
    pdf.setFont('helvetica', 'normal');
    posX = 240;
    pdf.text('CPF:', posX, yPos);
    pdf.setFont('helvetica', 'bold');
    posX += pdf.getTextWidth('CPF: ');
    pdf.text(String(aluno.cpf || ''), posX, yPos);
    
    // Linha 3
    yPos += 5;
    posX = 15;
    pdf.setFont('helvetica', 'normal');
    pdf.text('DATA DE NASCIMENTO:', posX, yPos);
    pdf.setFont('helvetica', 'bold');
    posX += pdf.getTextWidth('DATA DE NASCIMENTO: ');
    pdf.text(String(aluno.diaNascimento).padStart(2, '0'), posX, yPos);
    
    pdf.setFont('helvetica', 'normal');
    posX += pdf.getTextWidth(String(aluno.diaNascimento).padStart(2, '0')) + 1;
    pdf.text('DE', posX, yPos);
    
    pdf.setFont('helvetica', 'bold');
    posX += pdf.getTextWidth('DE ');
    pdf.text(String(aluno.mesNascimento || ''), posX, yPos);
    
    pdf.setFont('helvetica', 'normal');
    posX += pdf.getTextWidth(aluno.mesNascimento) + 1;
    pdf.text('DE', posX, yPos);
    
    pdf.setFont('helvetica', 'bold');
    posX += pdf.getTextWidth('DE ');
    pdf.text(String(aluno.anoNascimento || ''), posX, yPos);
    
    pdf.setFont('helvetica', 'normal');
    posX = 115;
    pdf.text('NATURALIDADE:', posX, yPos);
    pdf.setFont('helvetica', 'bold');
    posX += pdf.getTextWidth('NATURALIDADE: ');
    pdf.text(String(aluno.cidadeNascimento || ''), posX, yPos);
    
    pdf.setFont('helvetica', 'normal');
    posX += pdf.getTextWidth(aluno.cidadeNascimento) + 1;
    pdf.text('-', posX, yPos);
    
    pdf.setFont('helvetica', 'bold');
    posX += pdf.getTextWidth('- ');
    pdf.text(String(aluno.estadoNascimento || ''), posX, yPos);
    
    pdf.setFont('helvetica', 'normal');
    posX = 210;
    pdf.text('NACIONALIDADE:', posX, yPos);
    pdf.setFont('helvetica', 'bold');
    posX += pdf.getTextWidth('NACIONALIDADE: ');
    pdf.text(String(aluno.nacionalidade || '').toUpperCase(), posX, yPos);
    
    // Linha 4 - Filiação
    yPos += 5;
    posX = 15;
    pdf.setFont('helvetica', 'normal');
    pdf.text('FILIAÇÃO: MÃE:', posX, yPos);
    pdf.setFont('helvetica', 'bold');
    posX += pdf.getTextWidth('FILIAÇÃO: MÃE: ');
    pdf.text(String(aluno.nomeMae || ''), posX, yPos);
    
    // Linha 5 - PAI
    yPos += 5;
    posX = 15;
    pdf.setFont('helvetica', 'normal');
    pdf.text('PAI:', posX, yPos);
    pdf.setFont('helvetica', 'bold');
    posX += pdf.getTextWidth('PAI: ');
    pdf.text(String(aluno.nomePai || ''), posX, yPos);
    
    // Título
    yPos += 10;
    pdf.setFont('times', 'bolditalic');
    pdf.setFontSize(13);
    pdf.text('CERTIFICADO DE CONCLUSÃO DO ENSINO MÉDIO', pageWidth / 2, yPos, { align: 'center' });
    
    // Tabela com duas colunas
    yPos += 8;
    pdf.setDrawColor(30, 58, 138);
    pdf.setLineWidth(0.5);
    pdf.setTextColor(0, 0, 0);
    
    const tabelaAltura = pageHeight - yPos - 15;
    const colunaEsqLargura = 170;
    const colunaDirLargura = pageWidth - 30 - colunaEsqLargura;
    
    // Coluna esquerda (grande para histórico)
    pdf.rect(15, yPos, colunaEsqLargura, tabelaAltura);
    
    // Coluna direita com cabeçalho OBSERVAÇÕES
    const obsY = yPos;
    pdf.setFillColor(255, 255, 200);
    pdf.rect(15 + colunaEsqLargura, obsY, colunaDirLargura, 10, 'FD');
    
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(9);
    pdf.setTextColor(0, 0, 0);
    pdf.text('OBSERVAÇÕES', 15 + colunaEsqLargura + (colunaDirLargura / 2), obsY + 7, { align: 'center' });
    
    // Linhas de observações
    const linhaAltura = 13;
    const numLinhas = Math.floor((tabelaAltura - 10) / linhaAltura);
    
    for(let i = 0; i < numLinhas; i++) {
        pdf.rect(15 + colunaEsqLargura, obsY + 10 + (i * linhaAltura), colunaDirLargura, linhaAltura);
        
        // Adicionar observações personalizadas se houver
        if(i === 0 && aluno.observacoes) {
            pdf.setFont('helvetica', 'normal');
            pdf.setFontSize(8);
            pdf.text(aluno.observacoes, 15 + colunaEsqLargura + 3, obsY + 10 + (i * linhaAltura) + 8, { maxWidth: colunaDirLargura - 6 });
        }
    }
}

function obterNomeMes(mes) {
    const meses = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
                   'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
    return meses[mes];
}

// ==================== EXPORTAÇÃO DE DADOS ====================
function exportarDados() {
    if (APP_STATE.alunos.length === 0) {
        mostrarNotificacao('Nenhum aluno para exportar!', 'error');
        return;
    }

    const dados = JSON.stringify(APP_STATE.alunos, null, 2);
    const blob = new Blob([dados], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `alunos_${new Date().getTime()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    mostrarNotificacao('Dados exportados com sucesso!', 'success');
}

// ==================== SISTEMA DE BACKUP ====================
async function fazerBackupCompleto() {
    if (APP_STATE.alunos.length === 0) {
        mostrarNotificacao('Nenhum dado para fazer backup!', 'error');
        return;
    }

    // Criar backup completo com data e hora
    const agora = new Date();
    const dataFormatada = `${agora.getDate().toString().padStart(2, '0')}-${(agora.getMonth() + 1).toString().padStart(2, '0')}-${agora.getFullYear()}_${agora.getHours().toString().padStart(2, '0')}h${agora.getMinutes().toString().padStart(2, '0')}`;
    
    const backup = {
        versao: '1.0',
        dataBackup: agora.toISOString(),
        totalAlunos: APP_STATE.alunos.length,
        usuario: JSON.parse(localStorage.getItem('usuario') || '{}'),
        alunos: APP_STATE.alunos,
        templates: {
            brasao: localStorage.getItem('brasaoCustomizado'),
            bordas: localStorage.getItem('bordasCustomizadas')
        }
    };

    const dados = JSON.stringify(backup, null, 2);
    const blob = new Blob([dados], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `BACKUP_COMPLETO_${dataFormatada}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    // Registrar data do último backup
    localStorage.setItem('ultimoBackup', agora.toISOString());
    
    mostrarNotificacao(`✅ Backup completo realizado! ${APP_STATE.alunos.length} alunos salvos.`, 'success');
}

function verificarLembreteBackup() {
    const ultimoBackup = localStorage.getItem('ultimoBackup');
    const agora = new Date();
    
    if (!ultimoBackup) {
        // Nunca fez backup - avisar após 7 dias de uso
        const primeiroCadastro = localStorage.getItem('primeiroCadastro');
        if (!primeiroCadastro) {
            localStorage.setItem('primeiroCadastro', agora.toISOString());
        } else {
            const diasDesde = Math.floor((agora - new Date(primeiroCadastro)) / (1000 * 60 * 60 * 24));
            if (diasDesde >= 7 && APP_STATE.alunos.length > 0) {
                setTimeout(() => {
                    mostrarLembreteBackup();
                }, 3000);
            }
        }
    } else {
        // Já fez backup - lembrar a cada 30 dias
        const ultimaData = new Date(ultimoBackup);
        const diasDesdeBackup = Math.floor((agora - ultimaData) / (1000 * 60 * 60 * 24));
        
        if (diasDesdeBackup >= 30 && APP_STATE.alunos.length > 0) {
            setTimeout(() => {
                mostrarLembreteBackup();
            }, 3000);
        }
    }
}

function mostrarLembreteBackup() {
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.7);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
    `;
    
    modal.innerHTML = `
        <div style="background: white; padding: 30px; border-radius: 15px; max-width: 500px; text-align: center; box-shadow: 0 10px 40px rgba(0,0,0,0.3);">
            <div style="font-size: 60px; margin-bottom: 20px;">⚠️</div>
            <h2 style="color: #dc2626; margin-bottom: 15px;">Lembrete Importante!</h2>
            <p style="font-size: 16px; color: #333; margin-bottom: 20px; line-height: 1.6;">
                <strong>Faça backup dos seus dados regularmente!</strong><br><br>
                Você tem <strong>${APP_STATE.alunos.length} aluno(s)</strong> cadastrado(s).<br>
                Para garantir que seus dados não sejam perdidos, recomendamos fazer backup mensal.
            </p>
            <div style="display: flex; gap: 10px; justify-content: center;">
                <button onclick="this.closest('div').parentElement.remove(); fazerBackupCompleto();" style="background: #16a34a; color: white; border: none; padding: 12px 24px; border-radius: 8px; cursor: pointer; font-size: 16px; font-weight: bold;">
                    💾 Fazer Backup Agora
                </button>
                <button onclick="this.closest('div').parentElement.remove();" style="background: #6b7280; color: white; border: none; padding: 12px 24px; border-radius: 8px; cursor: pointer; font-size: 16px;">
                    Lembrar Depois
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

// ==================== UTILITÁRIOS ====================
// Função removida - agora salvamos no MongoDB via API

function formatarData(dataStr) {
    if (!dataStr) return '';
    const [ano, mes, dia] = dataStr.split('-');
    return `${dia}/${mes}/${ano}`;
}

function formatarDataAtual() {
    const data = new Date();
    const dia = String(data.getDate()).padStart(2, '0');
    const mes = String(data.getMonth() + 1).padStart(2, '0');
    const ano = data.getFullYear();
    return `${dia}/${mes}/${ano}`;
}

function mostrarNotificacao(mensagem, tipo = 'info') {
    const notification = document.getElementById('notification');
    notification.textContent = mensagem;
    notification.className = `notification ${tipo}`;
    notification.classList.add('show');
    
    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

// ==================== MINHA ASSINATURA ====================
let cronometroInterval = null;

async function carregarDadosAssinatura() {
    const token = localStorage.getItem('token');
    
    try {
        const response = await fetch('http://localhost:5000/api/auth/me', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) throw new Error('Erro ao carregar dados');
        
        const data = await response.json();
        const usuario = data.usuario;
        const licenca = usuario.licenca || {};
        
        // Atualizar informações do plano
        const planoNomes = {
            'trial': '🎁 Trial Gratuito',
            'pay-per-certificate': '📜 Pagar por Certificado',
            'mensal': '⚡ Plano Ilimitado'
        };
        
        const planoDescricoes = {
            'trial': '7 dias de teste gratuito',
            'pay-per-certificate': 'Pague apenas quando usar',
            'mensal': 'Certificados ilimitados'
        };
        
        const valoresPlano = {
            'trial': 'GRÁTIS',
            'pay-per-certificate': 'R$ 10,00/cert',
            'mensal': 'R$ 199,90/mês'
        };
        
        document.getElementById('plano-nome').textContent = planoNomes[licenca.tipo] || 'Trial Gratuito';
        document.getElementById('plano-descricao').textContent = planoDescricoes[licenca.tipo] || '7 dias de teste';
        document.getElementById('plano-status').textContent = licenca.status === 'ativa' ? '✅ ATIVA' : '❌ EXPIRADA';
        document.getElementById('cert-disponiveis').textContent = licenca.certificadosDisponiveis || 10;
        document.getElementById('cert-gerados').textContent = licenca.certificadosGerados || 0;
        document.getElementById('valor-plano').textContent = valoresPlano[licenca.tipo] || 'GRÁTIS';
        
        // Iniciar cronômetro
        if (licenca.dataExpiracao) {
            iniciarCronometro(new Date(licenca.dataExpiracao));
        }
        
    } catch (error) {
        console.error('Erro ao carregar assinatura:', error);
        mostrarNotificacao('Erro ao carregar dados da assinatura', 'error');
    }
}

function iniciarCronometro(dataExpiracao) {
    // Limpar intervalo anterior se existir
    if (cronometroInterval) clearInterval(cronometroInterval);
    
    const dataVencimento = document.getElementById('data-vencimento');
    dataVencimento.textContent = dataExpiracao.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
    
    function atualizarCronometro() {
        const agora = new Date().getTime();
        const expiracao = dataExpiracao.getTime();
        const diferenca = expiracao - agora;
        
        if (diferenca <= 0) {
            document.getElementById('dias').textContent = '0';
            document.getElementById('horas').textContent = '0';
            document.getElementById('minutos').textContent = '0';
            document.getElementById('segundos').textContent = '0';
            clearInterval(cronometroInterval);
            document.getElementById('plano-status').textContent = '❌ EXPIRADA';
            document.getElementById('alerta-vencimento').style.display = 'block';
            return;
        }
        
        const dias = Math.floor(diferenca / (1000 * 60 * 60 * 24));
        const horas = Math.floor((diferenca % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutos = Math.floor((diferenca % (1000 * 60 * 60)) / (1000 * 60));
        const segundos = Math.floor((diferenca % (1000 * 60)) / 1000);
        
        document.getElementById('dias').textContent = dias;
        document.getElementById('horas').textContent = horas.toString().padStart(2, '0');
        document.getElementById('minutos').textContent = minutos.toString().padStart(2, '0');
        document.getElementById('segundos').textContent = segundos.toString().padStart(2, '0');
        
        // Mostrar alerta se faltarem menos de 3 dias
        if (dias < 3) {
            document.getElementById('alerta-vencimento').style.display = 'block';
        }
    }
    
    atualizarCronometro();
    cronometroInterval = setInterval(atualizarCronometro, 1000);
}

function renovarPlano() {
    const planoAtual = document.getElementById('plano-nome').textContent;
    if (confirm(`🔄 Deseja renovar seu plano atual (${planoAtual})?\n\nRolagem para baixo para escolher o plano desejado.`)) {
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    }
}

function atualizarPlano() {
    if (confirm('⬆️ Deseja fazer upgrade do seu plano?\n\nRolagem para baixo para ver os planos disponíveis.')) {
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    }
}

function selecionarPlano(tipo) {
    const planos = {
        'trial': 'Trial Gratuito',
        'pay-per-certificate': 'Pagar por Certificado (R$ 10,00)',
        'mensal': 'Plano Ilimitado (R$ 199,90/mês)'
    };
    
    if (tipo === 'pay-per-certificate') {
        const qtd = prompt('💰 Quantos certificados deseja comprar?\n\nValor: R$ 10,00 por certificado', '10');
        if (qtd && parseInt(qtd) > 0) {
            const total = parseInt(qtd) * 10;
            alert(`✅ Você está contratando:\n\n${qtd} certificados\nValor total: R$ ${total.toFixed(2)}\n\n🔜 Em breve: Integração com pagamento Pix`);
        }
    } else if (tipo === 'mensal') {
        if (confirm(`✅ Contratar ${planos[tipo]}?\n\n📞 Entre em contato com o suporte:\nEmail: suporte@exemplo.com\nWhatsApp: (00) 00000-0000`)) {
            // Funcionalidade futura
        }
    }
}

function verHistoricoPagamentos() {
    alert('📊 Em breve! Histórico de pagamentos em desenvolvimento.');
}

// ==================== LOGOUT ====================
function logout() {
    if (confirm('Deseja realmente sair?')) {
        localStorage.removeItem('token');
        localStorage.removeItem('usuario');
        if (cronometroInterval) clearInterval(cronometroInterval);
        window.location.replace('login.html');
    }
}

// Carregar dados da assinatura quando a aba for aberta
document.addEventListener('DOMContentLoaded', () => {
    const tabBtns = document.querySelectorAll('.tab-btn');
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            if (btn.dataset.tab === 'assinatura') {
                carregarDadosAssinatura();
            }
        });
    });
});



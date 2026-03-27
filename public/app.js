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

        // Ao entrar na aba gerar, atualizar a lista de alunos com checkbox
        if (targetTab === 'gerar' && typeof atualizarListaAlunosLote === 'function') {
            atualizarListaAlunosLote();
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
    } else {
        select.innerHTML = '<option value="">-- Selecione um aluno --</option>' +
            APP_STATE.alunos.map(aluno => 
                `<option value="${aluno.id}">${aluno.nome}${aluno.anoConclusao ? ' (' + aluno.anoConclusao + ')' : ''}</option>`
            ).join('');
    }

    // Atualizar lista de alunos para geração em lote
    atualizarListaAlunosLote();
}

function atualizarListaAlunosLote(filtro = '') {
    const container = document.getElementById('listaAlunosLote');
    if (!container) return;

    let alunosFiltrados = APP_STATE.alunos;
    if (filtro) {
        const termo = filtro.toLowerCase();
        alunosFiltrados = APP_STATE.alunos.filter(a =>
            a.nome.toLowerCase().includes(termo) || (a.cpf && a.cpf.includes(termo))
        );
    }

    if (alunosFiltrados.length === 0) {
        container.innerHTML = `<p style="text-align: center; padding: 20px; color: #9ca3af;">${filtro ? 'Nenhum aluno encontrado' : 'Nenhum aluno cadastrado'}</p>`;
        atualizarContadorLote();
        return;
    }

    container.innerHTML = alunosFiltrados.map((aluno, idx) => {
        const checked = APP_STATE.alunosSelecionadosLote && APP_STATE.alunosSelecionadosLote.has(aluno.id) ? 'checked' : '';
        const bg = idx % 2 === 0 ? '#ffffff' : '#f8fafc';
        return `
        <div style="display: flex; align-items: center; gap: 12px; padding: 10px 14px; border-bottom: 1px solid #e5e7eb; cursor: pointer; background: ${bg}; transition: background 0.15s;"
             onmouseover="this.style.background='#eff6ff'" onmouseout="this.style.background='${bg}'"
             onclick="toggleCheckLote(this, '${aluno.id}')">
            <input type="checkbox" class="check-aluno-lote" data-id="${aluno.id}" ${checked}
                style="width: 20px; height: 20px; cursor: pointer; flex-shrink: 0; accent-color: #1e3a8a;" onclick="event.stopPropagation(); toggleAlunolote('${aluno.id}', this.checked)">
            <div style="flex: 1; min-width: 0;">
                <div style="font-weight: 600; font-size: 14px; color: #1e293b;">${aluno.nome}</div>
                <div style="font-size: 12px; color: #6b7280;">CPF: ${aluno.cpf || '-'} | Conclusão: ${aluno.anoConclusao || '-'}</div>
            </div>
        </div>`;
    }).join('');

    atualizarContadorLote();
}

// Inicializar set de seleção
if (!APP_STATE.alunosSelecionadosLote) {
    APP_STATE.alunosSelecionadosLote = new Set();
}

function toggleCheckLote(el, id) {
    const cb = el.querySelector('input[type=checkbox]');
    cb.checked = !cb.checked;
    toggleAlunolote(id, cb.checked);
}

function toggleAlunolote(id, checked) {
    if (checked) {
        APP_STATE.alunosSelecionadosLote.add(id);
    } else {
        APP_STATE.alunosSelecionadosLote.delete(id);
    }
    atualizarContadorLote();
    // sincronizar checkbox "Selecionar Todos"
    const checkAll = document.getElementById('checkTodosLote');
    if (checkAll) {
        checkAll.checked = APP_STATE.alunosSelecionadosLote.size === APP_STATE.alunos.length && APP_STATE.alunos.length > 0;
    }
}

function toggleSelecionarTodosLote() {
    const checkAll = document.getElementById('checkTodosLote');
    if (checkAll.checked) {
        APP_STATE.alunos.forEach(a => APP_STATE.alunosSelecionadosLote.add(a.id));
    } else {
        APP_STATE.alunosSelecionadosLote.clear();
    }
    // Recarregar com filtro atual
    const filtro = document.getElementById('buscarAlunoLote')?.value || '';
    atualizarListaAlunosLote(filtro);
}

function atualizarContadorLote() {
    const el = document.getElementById('contadorSelecionadosLote');
    if (el) {
        const n = APP_STATE.alunosSelecionadosLote ? APP_STATE.alunosSelecionadosLote.size : 0;
        el.textContent = `(${n} selecionado${n !== 1 ? 's' : ''})`;
    }
}

// ==================== PERSONALIZAÇÃO DE TEMPLATES ====================
let CERT_CONFIG = JSON.parse(localStorage.getItem('certConfig')) || {};
let CERT_UPLOADS = JSON.parse(localStorage.getItem('certUploads')) || {};
let previewLado = 'frente'; // frente ou verso

function obterConfigCert() {
    return {
        cabecalho: {
            linha1: document.getElementById('certCabecalhoLinha1')?.value || 'REPÚBLICA FEDERATIVA DO BRASIL',
            linha2: document.getElementById('certCabecalhoLinha2')?.value || 'ESTADO DO PIAUÍ',
            linha3: document.getElementById('certCabecalhoLinha3')?.value || 'SECRETARIA DE ESTADO DA EDUCAÇÃO',
            cnpj: document.getElementById('certCNPJ')?.value || '01.902.400/0001-55',
            inep: document.getElementById('certINEP')?.value || '22076450',
            nomeInstituicao: document.getElementById('certNomeInstituicao')?.value || 'Centro Estadual de Tempo Integral Desembargador Amaral',
            endereco: document.getElementById('certEndereco')?.value || 'Praça Tiradentes – 96 – Centro – Curimatá – Piauí',
            fonteTam: parseInt(document.getElementById('certFonteCabecalho')?.value) || 14
        },
        emblema: {
            tipo: document.getElementById('certEmblema')?.value || 'brasao-brasil',
            largura: parseInt(document.getElementById('certEmblemaLargura')?.value) || 46,
            altura: parseInt(document.getElementById('certEmblemaAltura')?.value) || 30,
            posY: parseInt(document.getElementById('certEmblemaPosY')?.value) || 30
        },
        frente: {
            resolucao: document.getElementById('certResolucao')?.value || 'Resolução CEE/PI',
            titulo: document.getElementById('certTitulo')?.value || 'CERTIFICADO DE CONCLUSÃO DO ENSINO MÉDIO',
            corpoTexto: document.getElementById('certCorpoTexto')?.value || '',
            fonte: document.getElementById('certFonteCorpo')?.value || 'times',
            fonteTam: parseInt(document.getElementById('certFonteCorpoTam')?.value) || 14,
            tituloTam: parseInt(document.getElementById('certFonteTituloTam')?.value) || 16,
            assinatura1: document.getElementById('certAssinatura1')?.value || 'SECRETÁRIO(A)',
            assinatura2: document.getElementById('certAssinatura2')?.value || 'DIRETOR(A)',
            assinatura3: document.getElementById('certAssinatura3')?.value || 'CONCLUDENTE'
        },
        verso: {
            municipio: document.getElementById('certVersoMunicipio')?.value || 'Curimatá',
            uf: document.getElementById('certVersoUF')?.value || 'Piauí',
            titulo: document.getElementById('certVersoTitulo')?.value || 'CERTIFICADO DE CONCLUSÃO DO ENSINO MÉDIO',
            observacoes: document.getElementById('certVersoObservacoes')?.value || 'sim',
            bordas: document.getElementById('certVersoBordas')?.value || 'sim'
        },
        rodape: {
            exibir: document.getElementById('certRodapeExibir')?.value || 'sim',
            linha1: document.getElementById('certRodapeLinha1')?.value || '',
            linha2: document.getElementById('certRodapeLinha2')?.value || '',
            fonteTam: parseInt(document.getElementById('certRodapeFonte')?.value) || 8
        },
        margens: {
            esq: parseInt(document.getElementById('certMargemEsq')?.value) || 20,
            dir: parseInt(document.getElementById('certMargemDir')?.value) || 20,
            sup: parseInt(document.getElementById('certMargemSup')?.value) || 15,
            inf: parseInt(document.getElementById('certMargemInf')?.value) || 15,
            bordaEspessura: parseFloat(document.getElementById('certBordaEspessura')?.value) || 7,
            bordaExibir: document.getElementById('certBordaExibir')?.value || 'sim',
            orientacao: document.getElementById('certOrientacao')?.value || 'landscape'
        },
        cores: {
            principal: document.getElementById('certCorPrincipal')?.value || '#1e3a8a',
            secundaria: document.getElementById('certCorSecundaria')?.value || '#3b82f6',
            texto: document.getElementById('certCorTexto')?.value || '#000000',
            assinatura: document.getElementById('certCorAssinatura')?.value || '#1e3a8a',
            fundo: document.getElementById('certCorFundo')?.value || '#ffffff'
        }
    };
}

function aplicarConfigNosInputs(cfg) {
    if (!cfg || !cfg.cabecalho) return;
    const sets = [
        ['certCabecalhoLinha1', cfg.cabecalho.linha1],
        ['certCabecalhoLinha2', cfg.cabecalho.linha2],
        ['certCabecalhoLinha3', cfg.cabecalho.linha3],
        ['certCNPJ', cfg.cabecalho.cnpj],
        ['certINEP', cfg.cabecalho.inep],
        ['certNomeInstituicao', cfg.cabecalho.nomeInstituicao],
        ['certEndereco', cfg.cabecalho.endereco],
        ['certFonteCabecalho', cfg.cabecalho.fonteTam],
        ['certEmblema', cfg.emblema.tipo],
        ['certEmblemaLargura', cfg.emblema.largura],
        ['certEmblemaAltura', cfg.emblema.altura],
        ['certEmblemaPosY', cfg.emblema.posY],
        ['certResolucao', cfg.frente.resolucao],
        ['certTitulo', cfg.frente.titulo],
        ['certCorpoTexto', cfg.frente.corpoTexto],
        ['certFonteCorpo', cfg.frente.fonte],
        ['certFonteCorpoTam', cfg.frente.fonteTam],
        ['certFonteTituloTam', cfg.frente.tituloTam],
        ['certAssinatura1', cfg.frente.assinatura1],
        ['certAssinatura2', cfg.frente.assinatura2],
        ['certAssinatura3', cfg.frente.assinatura3],
        ['certVersoMunicipio', cfg.verso.municipio],
        ['certVersoUF', cfg.verso.uf],
        ['certVersoTitulo', cfg.verso.titulo],
        ['certVersoObservacoes', cfg.verso.observacoes],
        ['certVersoBordas', cfg.verso.bordas],
        ['certRodapeExibir', cfg.rodape.exibir],
        ['certRodapeLinha1', cfg.rodape.linha1],
        ['certRodapeLinha2', cfg.rodape.linha2],
        ['certRodapeFonte', cfg.rodape.fonteTam],
        ['certMargemEsq', cfg.margens.esq],
        ['certMargemDir', cfg.margens.dir],
        ['certMargemSup', cfg.margens.sup],
        ['certMargemInf', cfg.margens.inf],
        ['certBordaEspessura', cfg.margens.bordaEspessura],
        ['certBordaExibir', cfg.margens.bordaExibir],
        ['certOrientacao', cfg.margens.orientacao],
        ['certCorPrincipal', cfg.cores.principal],
        ['certCorSecundaria', cfg.cores.secundaria],
        ['certCorTexto', cfg.cores.texto],
        ['certCorAssinatura', cfg.cores.assinatura],
        ['certCorFundo', cfg.cores.fundo],
        ['certCorPrincipalHex', cfg.cores.principal],
        ['certCorSecundariaHex', cfg.cores.secundaria],
        ['certCorTextoHex', cfg.cores.texto],
        ['certCorAssinaturaHex', cfg.cores.assinatura],
        ['certCorFundoHex', cfg.cores.fundo]
    ];
    sets.forEach(([id, val]) => {
        const el = document.getElementById(id);
        if (el && val !== undefined) el.value = val;
    });
    // Mostrar previews de uploads salvos
    if (CERT_UPLOADS.emblemaCustom) {
        const prev = document.getElementById('previewEmblemaCustom');
        if (prev) prev.innerHTML = `<img src="${CERT_UPLOADS.emblemaCustom}" style="max-height: 60px; border-radius: 8px;">`;
    }
    ['frente', 'verso'].forEach(lado => {
        if (CERT_UPLOADS['fundo' + lado.charAt(0).toUpperCase() + lado.slice(1)]) {
            const key = 'fundo' + lado.charAt(0).toUpperCase() + lado.slice(1);
            const prev = document.getElementById('previewFundo' + lado.charAt(0).toUpperCase() + lado.slice(1));
            const btn = document.getElementById('btnRemover' + 'Fundo' + lado.charAt(0).toUpperCase() + lado.slice(1));
            if (prev) prev.innerHTML = `<img src="${CERT_UPLOADS[key]}" style="max-height: 80px; border-radius: 8px;">`;
            if (btn) btn.style.display = 'inline-block';
        }
    });
}

function trocarEditorTab(btn) {
    document.querySelectorAll('.editor-tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.editor-tab-content').forEach(c => c.classList.remove('active'));
    btn.classList.add('active');
    const tabId = btn.dataset.editorTab;
    const tabContent = document.getElementById(tabId);
    if (tabContent) tabContent.classList.add('active');
}

function sincronizarCor(colorInputId, hexValue) {
    if (/^#[0-9a-fA-F]{6}$/.test(hexValue)) {
        document.getElementById(colorInputId).value = hexValue;
        atualizarPreviewCert();
    }
}

function salvarPersonalizacao() {
    CERT_CONFIG = obterConfigCert();
    localStorage.setItem('certConfig', JSON.stringify(CERT_CONFIG));
    localStorage.setItem('certUploads', JSON.stringify(CERT_UPLOADS));
    mostrarNotificacao('Modelo personalizado salvo com sucesso!', 'success');
}

function resetarPersonalizacao() {
    if (!confirm('Resetar todas as personalizações para os valores padrão?')) return;
    localStorage.removeItem('certConfig');
    localStorage.removeItem('certUploads');
    CERT_CONFIG = {};
    CERT_UPLOADS = {};
    // Recarregar a página para limpar os campos
    location.hash = 'templates';
    location.reload();
}

// Upload handlers
function handleUploadEmblema(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
        CERT_UPLOADS.emblemaCustom = e.target.result;
        document.getElementById('previewEmblemaCustom').innerHTML = `<img src="${e.target.result}" style="max-height: 60px; border-radius: 8px;">`;
        document.getElementById('certEmblema').value = 'custom';
        atualizarPreviewCert();
        mostrarNotificacao('Emblema carregado!', 'success');
    };
    reader.readAsDataURL(file);
}

function handleUploadFundo(event, lado) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
        const key = 'fundo' + lado.charAt(0).toUpperCase() + lado.slice(1);
        CERT_UPLOADS[key] = e.target.result;
        const prevId = 'previewFundo' + lado.charAt(0).toUpperCase() + lado.slice(1);
        const btnId = 'btnRemoverFundo' + lado.charAt(0).toUpperCase() + lado.slice(1);
        document.getElementById(prevId).innerHTML = `<img src="${e.target.result}" style="max-height: 80px; border-radius: 8px;">`;
        document.getElementById(btnId).style.display = 'inline-block';
        atualizarPreviewCert();
        mostrarNotificacao('Fundo carregado!', 'success');
    };
    reader.readAsDataURL(file);
}

function handleUploadBordaCustom(event, tipo) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
        CERT_UPLOADS['borda' + tipo.charAt(0).toUpperCase() + tipo.slice(1)] = e.target.result;
        const sufixo = tipo === 'horizontal' ? 'H' : 'V';
        document.getElementById('previewBorda' + sufixo).innerHTML = `<img src="${e.target.result}" style="max-height: 40px; border-radius: 4px;">`;
        document.getElementById('btnRemoverBorda' + sufixo).style.display = 'inline-block';
        atualizarPreviewCert();
        mostrarNotificacao('Borda carregada!', 'success');
    };
    reader.readAsDataURL(file);
}

function removerUpload(tipo) {
    if (tipo === 'fundoFrente') {
        delete CERT_UPLOADS.fundoFrente;
        document.getElementById('previewFundoFrente').innerHTML = '';
        document.getElementById('btnRemoverFundoFrente').style.display = 'none';
        document.getElementById('uploadFundoFrente').value = '';
    } else if (tipo === 'fundoVerso') {
        delete CERT_UPLOADS.fundoVerso;
        document.getElementById('previewFundoVerso').innerHTML = '';
        document.getElementById('btnRemoverFundoVerso').style.display = 'none';
        document.getElementById('uploadFundoVerso').value = '';
    } else if (tipo === 'bordaH') {
        delete CERT_UPLOADS.bordaHorizontal;
        document.getElementById('previewBordaH').innerHTML = '';
        document.getElementById('btnRemoverBordaH').style.display = 'none';
        document.getElementById('uploadBordaH').value = '';
    } else if (tipo === 'bordaV') {
        delete CERT_UPLOADS.bordaVertical;
        document.getElementById('previewBordaV').innerHTML = '';
        document.getElementById('btnRemoverBordaV').style.display = 'none';
        document.getElementById('uploadBordaV').value = '';
    }
    atualizarPreviewCert();
}

function hexParaRgb(hex) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return { r, g, b };
}

// ==================== PRÉ-VISUALIZAÇÃO NO CANVAS ====================
function atualizarPreviewCert() {
    const canvas = document.getElementById('previewCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const cfg = obterConfigCert();

    const isLandscape = cfg.margens.orientacao === 'landscape';
    const pw = isLandscape ? 842 : 595; // A4 em pixels ~72dpi
    const ph = isLandscape ? 595 : 842;
    canvas.width = pw;
    canvas.height = ph;

    // Escala para mm
    const sx = pw / (isLandscape ? 297 : 210);
    const sy = ph / (isLandscape ? 210 : 297);

    // Fundo
    const bgColor = hexParaRgb(cfg.cores.fundo);
    ctx.fillStyle = cfg.cores.fundo;
    ctx.fillRect(0, 0, pw, ph);

    if (previewLado === 'frente') {
        desenharPreviewFrente(ctx, cfg, sx, sy, pw, ph);
    } else {
        desenharPreviewVerso(ctx, cfg, sx, sy, pw, ph);
    }

    document.getElementById('previewLadoLabel').textContent = 'Mostrando: ' + (previewLado === 'frente' ? 'FRENTE' : 'VERSO');
}

function desenharPreviewFrente(ctx, cfg, sx, sy, pw, ph) {
    const pageWidth = pw / sx; // em mm
    const bordaEsp = cfg.margens.bordaEspessura;

    // Bordas decorativas simuladas
    if (cfg.margens.bordaExibir === 'sim' && bordaEsp > 0) {
        ctx.fillStyle = cfg.cores.principal;
        ctx.globalAlpha = 0.3;
        ctx.fillRect(0, 0, bordaEsp * sx, ph); // esq
        ctx.fillRect(pw - bordaEsp * sx, 0, bordaEsp * sx, ph); // dir
        ctx.fillRect(0, 0, pw, bordaEsp * sy); // sup
        ctx.fillRect(0, ph - bordaEsp * sy, pw, bordaEsp * sy); // inf
        ctx.globalAlpha = 1;
    }

    // Emblema placeholder
    if (cfg.emblema.tipo !== 'nenhum') {
        const emX = pw / 2;
        const emY = cfg.emblema.posY * sy;
        const emW = cfg.emblema.largura * sx;
        const emH = cfg.emblema.altura * sy;
        ctx.fillStyle = '#d4a843';
        ctx.globalAlpha = 0.4;
        ctx.fillRect(emX - emW / 2, emY - emH / 2, emW, emH);
        ctx.globalAlpha = 1;
        ctx.fillStyle = '#8b6914';
        ctx.font = 'bold 14px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('🏛️ BRASÃO', emX, emY + 5);
    }

    // Cabeçalho
    const corPrincipal = cfg.cores.principal;
    const fontTam = cfg.cabecalho.fonteTam;
    ctx.fillStyle = corPrincipal;
    ctx.font = `bold ${fontTam * sx / 2.1}px serif`;
    ctx.textAlign = 'center';

    let yBase = (cfg.emblema.posY + cfg.emblema.altura / 2 + 10) * sy;
    ctx.fillText(cfg.cabecalho.linha1, pw / 2, yBase);
    yBase += fontTam * sy / 2.5;
    ctx.fillText(cfg.cabecalho.linha2, pw / 2, yBase);
    yBase += fontTam * sy / 2.5;
    ctx.fillText(cfg.cabecalho.linha3, pw / 2, yBase);

    // CNPJ / INEP
    yBase += fontTam * sy / 2;
    ctx.fillStyle = cfg.cores.texto;
    ctx.font = `${12 * sx / 2.2}px sans-serif`;
    ctx.fillText(`CNPJ Nº ${cfg.cabecalho.cnpj}        INEP Nº ${cfg.cabecalho.inep}`, pw / 2, yBase);

    // Nome Instituição
    yBase += 14 * sy / 2;
    ctx.fillStyle = cfg.cores.texto;
    ctx.font = `italic ${fontTam * sx / 2.1}px serif`;
    ctx.fillText(cfg.cabecalho.nomeInstituicao, pw / 2, yBase);
    // sublinhado
    const tw = ctx.measureText(cfg.cabecalho.nomeInstituicao).width;
    ctx.beginPath();
    ctx.moveTo(pw / 2 - tw / 2, yBase + 2);
    ctx.lineTo(pw / 2 + tw / 2, yBase + 2);
    ctx.strokeStyle = cfg.cores.texto;
    ctx.lineWidth = 0.5;
    ctx.stroke();

    yBase += 6 * sy / 2;
    ctx.font = `${7 * sx / 2}px sans-serif`;
    ctx.fillText('NOME DO ESTABELECIMENTO DE ENSINO', pw / 2, yBase);

    // Endereço
    yBase += 12 * sy / 2;
    ctx.font = `italic ${fontTam * sx / 2.1}px serif`;
    ctx.fillText(cfg.cabecalho.endereco, pw / 2, yBase);
    const ew = ctx.measureText(cfg.cabecalho.endereco).width;
    ctx.beginPath();
    ctx.moveTo(pw / 2 - ew / 2, yBase + 2);
    ctx.lineTo(pw / 2 + ew / 2, yBase + 2);
    ctx.stroke();

    yBase += 6 * sy / 2;
    ctx.font = `${7 * sx / 2}px sans-serif`;
    ctx.fillText('ENDEREÇO', pw / 2, yBase);

    // Resolução
    yBase += 16 * sy / 2;
    ctx.font = `italic ${fontTam * sx / 2.1}px serif`;
    ctx.fillText(cfg.frente.resolucao, pw / 2, yBase);

    // Título
    yBase += 16 * sy / 2;
    ctx.fillStyle = corPrincipal;
    ctx.font = `bold italic ${cfg.frente.tituloTam * sx / 2.1}px serif`;
    ctx.fillText(cfg.frente.titulo, pw / 2, yBase);

    // Corpo resumido
    yBase += 26 * sy / 2;
    ctx.fillStyle = cfg.cores.texto;
    ctx.font = `italic ${cfg.frente.fonteTam * sx / 2.3}px ${cfg.frente.fonte === 'times' ? 'serif' : 'sans-serif'}`;
    ctx.textAlign = 'left';
    const margemEsq = cfg.margens.esq * sx;
    const margemDir = pw - cfg.margens.dir * sx;
    const maxW = margemDir - margemEsq;

    // Texto preview com dados fictícios
    let textoPreview = cfg.frente.corpoTexto || 'A Direção da Instituição de Ensino...';
    textoPreview = textoPreview
        .replace('{INSTITUICAO}', cfg.cabecalho.nomeInstituicao)
        .replace('{NOME}', 'MARIA DA SILVA')
        .replace('{CPF}', '123.456.789-00')
        .replace('{DIA}', '01').replace('{MES}', 'janeiro').replace('{ANO}', '2000')
        .replace('{CIDADE}', 'Curimatá').replace('{ESTADO}', 'Piauí')
        .replace('{NACIONALIDADE}', 'brasileira')
        .replace('{MAE}', 'Ana da Silva').replace('{PAI}', 'José da Silva')
        .replace('{ANO_CONCLUSAO}', '2025');

    wrapText(ctx, textoPreview, margemEsq, yBase, maxW, cfg.frente.fonteTam * sy / 2.5);

    // Linhas de assinatura
    const assY = ph - 60 * sy / 2;
    ctx.strokeStyle = cfg.cores.assinatura;
    ctx.lineWidth = 1;
    ctx.textAlign = 'center';
    ctx.fillStyle = cfg.cores.assinatura;
    ctx.font = `${9 * sx / 2.2}px sans-serif`;

    ctx.beginPath(); ctx.moveTo(pw * 0.08, assY); ctx.lineTo(pw * 0.42, assY); ctx.stroke();
    ctx.fillText(cfg.frente.assinatura1, pw * 0.25, assY + 14);

    ctx.beginPath(); ctx.moveTo(pw * 0.58, assY); ctx.lineTo(pw * 0.92, assY); ctx.stroke();
    ctx.fillText(cfg.frente.assinatura2, pw * 0.75, assY + 14);

    const ass3Y = assY + 36;
    ctx.beginPath(); ctx.moveTo(pw * 0.33, ass3Y); ctx.lineTo(pw * 0.67, ass3Y); ctx.stroke();
    ctx.fillText(cfg.frente.assinatura3, pw * 0.5, ass3Y + 14);

    // Rodapé
    if (cfg.rodape.exibir === 'sim' && (cfg.rodape.linha1 || cfg.rodape.linha2)) {
        const rodY = ph - 12;
        ctx.fillStyle = '#6b7280';
        ctx.font = `${cfg.rodape.fonteTam * sx / 2.5}px sans-serif`;
        ctx.textAlign = 'center';
        if (cfg.rodape.linha1) ctx.fillText(cfg.rodape.linha1, pw / 2, rodY - 10);
        if (cfg.rodape.linha2) ctx.fillText(cfg.rodape.linha2, pw / 2, rodY);
    }
}

function desenharPreviewVerso(ctx, cfg, sx, sy, pw, ph) {
    const bordaEsp = cfg.margens.bordaEspessura;

    // Bordas
    if (cfg.verso.bordas === 'sim' && cfg.margens.bordaExibir === 'sim' && bordaEsp > 0) {
        ctx.fillStyle = cfg.cores.principal;
        ctx.globalAlpha = 0.3;
        ctx.fillRect(0, 0, bordaEsp * sx, ph);
        ctx.fillRect(pw - bordaEsp * sx, 0, bordaEsp * sx, ph);
        ctx.fillRect(0, 0, pw, bordaEsp * sy);
        ctx.fillRect(0, ph - bordaEsp * sy, pw, bordaEsp * sy);
        ctx.globalAlpha = 1;
    }

    // Cabeçalho do verso
    let yPos = 30 * sy;
    ctx.fillStyle = cfg.cores.texto;
    ctx.font = `bold ${7 * sx / 2}px sans-serif`;
    ctx.textAlign = 'left';
    const mx = 15 * sx;

    ctx.fillText(`ESTABELECIMENTO DE ENSINO: ${cfg.cabecalho.nomeInstituicao.toUpperCase()}`, mx, yPos);
    yPos += 12;
    ctx.fillText(`MUNICÍPIO: ${cfg.verso.municipio}     UF: ${cfg.verso.uf}`, mx, yPos);
    yPos += 12;
    ctx.fillText('ESTUDANTE: MARIA DA SILVA     RG: 12345678     CPF: 123.456.789-00', mx, yPos);
    yPos += 12;
    ctx.fillText('DATA DE NASCIMENTO: 01 DE janeiro DE 2000     NATURALIDADE: Curimatá - Piauí', mx, yPos);
    yPos += 12;
    ctx.fillText('FILIAÇÃO: MÃE: Ana da Silva', mx, yPos);
    yPos += 12;
    ctx.fillText('PAI: José da Silva', mx, yPos);

    // Título
    yPos += 20;
    ctx.fillStyle = cfg.cores.principal;
    ctx.font = `bold italic ${13 * sx / 2.1}px serif`;
    ctx.textAlign = 'center';
    ctx.fillText(cfg.verso.titulo, pw / 2, yPos);

    // Tabela placeholder
    yPos += 15;
    ctx.strokeStyle = cfg.cores.principal;
    ctx.lineWidth = 1;
    const tabelaW = pw - 30 * sx;
    const tabelaH = ph - yPos - 20 * sy;
    ctx.strokeRect(mx, yPos, tabelaW * 0.65, tabelaH);

    // Observações
    if (cfg.verso.observacoes === 'sim') {
        const obsX = mx + tabelaW * 0.65;
        const obsW = tabelaW * 0.35;
        ctx.fillStyle = '#ffffc8';
        ctx.fillRect(obsX, yPos, obsW, 20);
        ctx.strokeRect(obsX, yPos, obsW, 20);
        ctx.strokeRect(obsX, yPos + 20, obsW, tabelaH - 20);
        ctx.fillStyle = cfg.cores.texto;
        ctx.font = `bold ${9 * sx / 2.2}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText('OBSERVAÇÕES', obsX + obsW / 2, yPos + 14);
    }

    // Texto na tabela principal
    ctx.fillStyle = '#9ca3af';
    ctx.font = `italic ${10 * sx / 2.2}px sans-serif`;
    ctx.fillText('Área para Histórico Escolar', mx + tabelaW * 0.325, yPos + tabelaH / 2);
}

function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
    const words = text.split(' ');
    let line = '';
    for (let n = 0; n < words.length; n++) {
        const testLine = line + words[n] + ' ';
        const metrics = ctx.measureText(testLine);
        if (metrics.width > maxWidth && n > 0) {
            ctx.fillText(line.trim(), x, y);
            line = words[n] + ' ';
            y += lineHeight;
        } else {
            line = testLine;
        }
    }
    ctx.fillText(line.trim(), x, y);
}

function alternarPreviewLado() {
    previewLado = previewLado === 'frente' ? 'verso' : 'frente';
    atualizarPreviewCert();
}

// ==================== GERAR PDF DO MODELO COM DADOS FICTÍCIOS ====================
function gerarModeloPreview() {
    if (!window.jspdf || !window.jspdf.jsPDF) {
        mostrarNotificacao('Biblioteca jsPDF não carregada. Recarregue a página.', 'error');
        return;
    }

    // Dados fictícios
    const alunoFicticio = {
        nome: 'Maria da Silva',
        cpf: '123.456.789-00',
        rg: '12345678',
        orgaoEmissor: 'SSP-PI',
        diaNascimento: '01',
        mesNascimento: 'janeiro',
        anoNascimento: '2000',
        cidadeNascimento: 'Curimatá',
        estadoNascimento: 'Piauí',
        nacionalidade: 'brasileira',
        nomeMae: 'Ana da Silva',
        nomePai: 'José da Silva',
        anoConclusao: '2025',
        resolucao: ''
    };

    const cfg = obterConfigCert();
    // Salvar config temporariamente
    CERT_CONFIG = cfg;

    gerarCertificado(alunoFicticio);
    mostrarNotificacao('PDF gerado com dados fictícios para pré-visualização!', 'info');
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

    // Botões de geração
    document.getElementById('btnGerarIndividual').addEventListener('click', gerarCertificadoIndividual);
    document.getElementById('btnGerarLote').addEventListener('click', gerarCertificadosLote);

    // Busca na lista de geração em lote
    document.getElementById('buscarAlunoLote').addEventListener('input', (e) => {
        atualizarListaAlunosLote(e.target.value);
    });

    atualizarTemplateInfo();

    // Carregar config salva
    if (CERT_CONFIG && CERT_CONFIG.cabecalho) {
        aplicarConfigNosInputs(CERT_CONFIG);
    }
    // Carregar uploads salvos
    if (CERT_UPLOADS.emblemaCustom) {
        const prev = document.getElementById('previewEmblemaCustom');
        if (prev) prev.innerHTML = `<img src="${CERT_UPLOADS.emblemaCustom}" style="max-height: 60px; border-radius: 8px;">`;
    }

    // Gerar preview inicial
    setTimeout(() => atualizarPreviewCert(), 200);
}

function selecionarTemplate(key) {
    APP_STATE.templateSelecionado = key;
    
    document.querySelectorAll('.template-card').forEach(card => {
        card.classList.remove('selected');
    });
    
    event.target.closest('.template-card').classList.add('selected');

    // Aplicar cores do template nos campos do editor
    const t = TEMPLATES[key];
    if (t) {
        document.getElementById('certCorPrincipal').value = t.cor1;
        document.getElementById('certCorPrincipalHex').value = t.cor1;
        document.getElementById('certCorSecundaria').value = t.cor2;
        document.getElementById('certCorSecundariaHex').value = t.cor2;
        document.getElementById('certCorTexto').value = t.corTexto;
        document.getElementById('certCorTextoHex').value = t.corTexto;
        const fonteSelect = document.getElementById('certFonteCorpo');
        if (fonteSelect) fonteSelect.value = t.fonte === 'serif' ? 'times' : 'helvetica';
    }

    atualizarTemplateInfo();
    atualizarPreviewCert();
    mostrarNotificacao(`Template "${TEMPLATES[key].nome}" selecionado`, 'success');
}

function atualizarTemplateInfo() {
    const info = document.getElementById('templateSelecionado');
    if (!info) return;
    if (APP_STATE.templateSelecionado === 'custom') {
        info.textContent = 'Personalizado';
    } else if (TEMPLATES[APP_STATE.templateSelecionado]) {
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
    const selecionados = APP_STATE.alunosSelecionadosLote;
    
    if (!selecionados || selecionados.size === 0) {
        mostrarNotificacao('Selecione pelo menos um aluno para gerar certificados!', 'error');
        return;
    }

    const alunosParaGerar = APP_STATE.alunos.filter(a => selecionados.has(a.id));

    if (!confirm(`Deseja gerar ${alunosParaGerar.length} certificado(s)?`)) {
        return;
    }

    mostrarNotificacao(`Gerando ${alunosParaGerar.length} certificado(s)...`, 'info');

    for (let i = 0; i < alunosParaGerar.length; i++) {
        await gerarCertificado(alunosParaGerar[i], true);
        await new Promise(resolve => setTimeout(resolve, 500)); // Pausa entre gerações
    }

    mostrarNotificacao(`${alunosParaGerar.length} certificado(s) gerado(s) com sucesso!`, 'success');
}

async function gerarCertificado(aluno, emLote = false) {
    try {
        // Verificar se jsPDF está disponível
        if (!window.jspdf || !window.jspdf.jsPDF) {
            mostrarNotificacao('Biblioteca jsPDF não carregada. Recarregue a página.', 'error');
            return;
        }
        
        const { jsPDF } = window.jspdf;
        const cfg = (CERT_CONFIG && CERT_CONFIG.cabecalho) ? CERT_CONFIG : obterConfigCert();
        const orientacao = cfg.margens.orientacao || 'landscape';
        
        // Criar PDF em formato A4
        const pdf = new jsPDF({
            orientation: orientacao,
            unit: 'mm',
            format: 'a4'
        });

        // Gerar frente do certificado
        await gerarFrenteCertificado(pdf, aluno, cfg);
        
        // Adicionar nova página para o verso
        pdf.addPage();
        gerarVersoCertificado(pdf, aluno, cfg);
        
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

async function gerarFrenteCertificado(pdf, aluno, cfg) {
    if (!cfg) cfg = obterConfigCert();
    const isLandscape = cfg.margens.orientacao === 'landscape';
    const pageWidth = isLandscape ? 297 : 210;
    const pageHeight = isLandscape ? 210 : 297;
    const bordaEspessura = cfg.margens.bordaEspessura;
    const corP = hexParaRgb(cfg.cores.principal);
    const corT = hexParaRgb(cfg.cores.texto);
    const corA = hexParaRgb(cfg.cores.assinatura);
    const corF = hexParaRgb(cfg.cores.fundo);
    
    // Fundo
    pdf.setFillColor(corF.r, corF.g, corF.b);
    pdf.rect(0, 0, pageWidth, pageHeight, 'F');

    // Fundo personalizado
    if (CERT_UPLOADS.fundoFrente) {
        try {
            pdf.addImage(CERT_UPLOADS.fundoFrente, 'JPEG', 0, 0, pageWidth, pageHeight);
        } catch(e) { console.error('Erro fundo frente:', e); }
    }
    
    // Bordas decorativas
    if (cfg.margens.bordaExibir === 'sim' && bordaEspessura > 0) {
        const bordaV = CERT_UPLOADS.bordaVertical || (typeof BORDA_VERTICAL !== 'undefined' ? BORDA_VERTICAL : null);
        const bordaH = CERT_UPLOADS.bordaHorizontal || (typeof BORDA_HORIZONTAL !== 'undefined' ? BORDA_HORIZONTAL : null);
        
        if (bordaV) {
            try {
                pdf.addImage(bordaV, 'PNG', 0, 0, bordaEspessura, pageHeight);
                pdf.addImage(bordaV, 'PNG', pageWidth - bordaEspessura, 0, bordaEspessura, pageHeight);
            } catch(e) { console.error('Erro borda vertical:', e); }
        }
        if (bordaH) {
            try {
                pdf.addImage(bordaH, 'PNG', 0, 0, pageWidth, bordaEspessura);
                pdf.addImage(bordaH, 'PNG', 0, pageHeight - bordaEspessura, pageWidth, bordaEspessura);
            } catch(e) { console.error('Erro borda horizontal:', e); }
        }
    }
    
    // Emblema
    if (cfg.emblema.tipo !== 'nenhum') {
        const brasaoX = pageWidth / 2;
        const brasaoY = cfg.emblema.posY;
        const brasaoLargura = cfg.emblema.largura;
        const brasaoAltura = cfg.emblema.altura;
        
        let imgEmblema = null;
        if (cfg.emblema.tipo === 'custom' && CERT_UPLOADS.emblemaCustom) {
            imgEmblema = CERT_UPLOADS.emblemaCustom;
        } else if (typeof BRASAO_BRASIL !== 'undefined' && BRASAO_BRASIL && BRASAO_BRASIL.length > 100) {
            imgEmblema = BRASAO_BRASIL;
        }
        
        if (imgEmblema) {
            try {
                pdf.addImage(imgEmblema, 'PNG', brasaoX - brasaoLargura / 2, brasaoY - brasaoAltura / 2, brasaoLargura, brasaoAltura);
            } catch(e) { console.error('Erro ao adicionar emblema:', e); }
        }
    }
    
    // Cabeçalho
    const fontTamCab = cfg.cabecalho.fonteTam;
    pdf.setTextColor(corP.r, corP.g, corP.b);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(fontTamCab);
    
    let yBase = cfg.emblema.posY + cfg.emblema.altura / 2 + 6;
    pdf.text(cfg.cabecalho.linha1, pageWidth / 2, yBase, { align: 'center' });
    yBase += fontTamCab * 0.45;
    pdf.text(cfg.cabecalho.linha2, pageWidth / 2, yBase, { align: 'center' });
    yBase += fontTamCab * 0.45;
    pdf.text(cfg.cabecalho.linha3, pageWidth / 2, yBase, { align: 'center' });
    
    // CNPJ e INEP
    yBase += fontTamCab * 0.4;
    pdf.setTextColor(corT.r, corT.g, corT.b);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(fontTamCab);
    const cnpjText = 'CNPJ Nº ';
    const cnpjNum = cfg.cabecalho.cnpj;
    const inepText = 'INEP Nº ';
    const inepNum = cfg.cabecalho.inep;
    
    const espacoTotal = pdf.getTextWidth(cnpjText + cnpjNum + '        ' + inepText + inepNum);
    const inicioX = (pageWidth - espacoTotal) / 2;
    
    pdf.text(cnpjText, inicioX, yBase);
    pdf.setFont('helvetica', 'bold');
    pdf.text(cnpjNum, inicioX + pdf.getTextWidth(cnpjText), yBase);
    
    pdf.setFont('helvetica', 'normal');
    const posInep = inicioX + pdf.getTextWidth(cnpjText + cnpjNum) + 15;
    pdf.text(inepText, posInep, yBase);
    pdf.setFont('helvetica', 'bold');
    pdf.text(inepNum, posInep + pdf.getTextWidth(inepText), yBase);
    
    // Nome da instituição
    yBase += fontTamCab * 0.55;
    pdf.setFont('times', 'italic');
    pdf.setFontSize(fontTamCab);
    const nomeInstituicao = cfg.cabecalho.nomeInstituicao;
    pdf.text(nomeInstituicao, pageWidth / 2, yBase, { align: 'center' });
    const larguraNomeInst = pdf.getTextWidth(nomeInstituicao);
    pdf.setLineWidth(0.2);
    pdf.setDrawColor(corT.r, corT.g, corT.b);
    pdf.line((pageWidth - larguraNomeInst) / 2, yBase + 1, (pageWidth + larguraNomeInst) / 2, yBase + 1);
    
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(7);
    yBase += 4;
    pdf.text('NOME DO ESTABELECIMENTO DE ENSINO', pageWidth / 2, yBase, { align: 'center' });
    
    // Endereço
    yBase += 6;
    pdf.setFont('times', 'italic');
    pdf.setFontSize(fontTamCab);
    const endereco = cfg.cabecalho.endereco;
    pdf.text(endereco, pageWidth / 2, yBase, { align: 'center' });
    const larguraEnd = pdf.getTextWidth(endereco);
    pdf.line((pageWidth - larguraEnd) / 2, yBase + 1, (pageWidth + larguraEnd) / 2, yBase + 1);
    
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(7);
    yBase += 4;
    pdf.text('ENDEREÇO', pageWidth / 2, yBase, { align: 'center' });
    
    // Resolução
    yBase += 9;
    pdf.setFont('times', 'italic');
    pdf.setFontSize(fontTamCab);
    const resolucaoTexto = aluno.resolucao ? `${cfg.frente.resolucao} Nº ${aluno.resolucao}` : cfg.frente.resolucao;
    pdf.text(resolucaoTexto, pageWidth / 2, yBase, { align: 'center' });
    
    // Título
    yBase += 8;
    pdf.setFont('times', 'bolditalic');
    pdf.setFontSize(cfg.frente.tituloTam);
    pdf.setTextColor(corP.r, corP.g, corP.b);
    pdf.text(cfg.frente.titulo, pageWidth / 2, yBase, { align: 'center' });
    
    // Corpo do texto
    yBase += 17;
    const fonteCorpo = cfg.frente.fonte || 'times';
    pdf.setFont(fonteCorpo, 'italic');
    pdf.setFontSize(cfg.frente.fonteTam);
    pdf.setTextColor(corT.r, corT.g, corT.b);
    
    const margemEsq = cfg.margens.esq;
    const margemDir = pageWidth - cfg.margens.dir;
    const larguraTexto = margemDir - margemEsq;
    const espacamentoLinha = 8;
    
    // Montar texto do corpo usando template ou padrão
    let corpoTemplate = cfg.frente.corpoTexto || '';
    let textoParts;
    
    if (corpoTemplate && corpoTemplate.includes('{NOME}')) {
        // Usar template personalizado - substituir placeholders
        const textoFinal = corpoTemplate
            .replace('{INSTITUICAO}', nomeInstituicao)
            .replace('{NOME}', aluno.nome.toUpperCase())
            .replace('{CPF}', aluno.cpf)
            .replace('{DIA}', String(aluno.diaNascimento).padStart(2, '0'))
            .replace('{MES}', aluno.mesNascimento)
            .replace('{ANO}', aluno.anoNascimento)
            .replace('{CIDADE}', aluno.cidadeNascimento)
            .replace('{ESTADO}', aluno.estadoNascimento)
            .replace('{NACIONALIDADE}', aluno.nacionalidade)
            .replace('{MAE}', aluno.nomeMae)
            .replace('{PAI}', aluno.nomePai)
            .replace('{ANO_CONCLUSAO}', aluno.anoConclusao);
        
        // Para template personalizado, usar negrito nos valores substituídos
        textoParts = [];
        // Segmentar em partes normais e valores negrito
        const valNeg = [aluno.nome.toUpperCase(), aluno.cpf, String(aluno.diaNascimento).padStart(2, '0'),
            aluno.mesNascimento, String(aluno.anoNascimento), aluno.cidadeNascimento, aluno.estadoNascimento,
            String(aluno.nacionalidade), aluno.nomeMae, aluno.nomePai, String(aluno.anoConclusao),
            nomeInstituicao, 'ENSINO MÉDIO'];
        
        let textoRestante = textoFinal;
        while (textoRestante.length > 0) {
            let menorIdx = textoRestante.length;
            let valEncontrado = null;
            for (const val of valNeg) {
                if (!val) continue;
                const idx = textoRestante.indexOf(val);
                if (idx >= 0 && idx < menorIdx) {
                    menorIdx = idx;
                    valEncontrado = val;
                }
            }
            if (valEncontrado && menorIdx < textoRestante.length) {
                if (menorIdx > 0) {
                    textoParts.push({ texto: textoRestante.substring(0, menorIdx), negrito: false });
                }
                textoParts.push({ texto: valEncontrado, negrito: true });
                textoRestante = textoRestante.substring(menorIdx + valEncontrado.length);
            } else {
                textoParts.push({ texto: textoRestante, negrito: false });
                break;
            }
        }
    } else {
        // Padrão hardcoded
        textoParts = [
            { texto: 'A Direção da Instituição de Ensino ', negrito: false },
            { texto: nomeInstituicao, negrito: true },
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
    }
    
    // Dividir em palavras mantendo a formatação
    let palavrasFormatadas = [];
    textoParts.forEach(part => {
        const textoString = String(part.texto || '');
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
    let posX = margemEsq;
    let linhaAtual = [];
    let yPos = yBase;
    
    for (let i = 0; i < palavrasFormatadas.length; i++) {
        const item = palavrasFormatadas[i];
        pdf.setFont(fonteCorpo, item.negrito ? 'bolditalic' : 'italic');
        const larguraPalavra = pdf.getTextWidth(item.palavra + ' ');
        
        if (posX + larguraPalavra > margemDir && linhaAtual.length > 0) {
            const espTotal = larguraTexto;
            let larguraUsada = 0;
            linhaAtual.forEach(p => {
                pdf.setFont(fonteCorpo, p.negrito ? 'bolditalic' : 'italic');
                larguraUsada += pdf.getTextWidth(p.palavra);
            });
            
            const espacoExtra = (espTotal - larguraUsada) / (linhaAtual.length - 1 || 1);
            let xAtual = margemEsq;
            
            linhaAtual.forEach((p) => {
                pdf.setFont(fonteCorpo, p.negrito ? 'bolditalic' : 'italic');
                pdf.text(p.palavra, xAtual, yPos);
                xAtual += pdf.getTextWidth(p.palavra) + espacoExtra;
            });
            
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
        pdf.setFont(fonteCorpo, p.negrito ? 'bolditalic' : 'italic');
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
    pdf.setTextColor(corP.r, corP.g, corP.b);
    pdf.text(dataFormatada, pageWidth / 2, yPos, { align: 'center' });
    
    // Linhas de assinatura
    yPos += 15;
    pdf.setLineWidth(0.5);
    pdf.setDrawColor(corA.r, corA.g, corA.b);
    pdf.line(25, yPos, 130, yPos);
    pdf.line(167, yPos, 272, yPos);
    
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    pdf.setTextColor(corA.r, corA.g, corA.b);
    pdf.text(cfg.frente.assinatura1, 77.5, yPos + 5, { align: 'center' });
    pdf.text(cfg.frente.assinatura2, 219.5, yPos + 5, { align: 'center' });
    
    // Linha para terceira assinatura
    yPos += 15;
    pdf.line(100, yPos, 197, yPos);
    pdf.text(cfg.frente.assinatura3, 148.5, yPos + 5, { align: 'center' });

    // Rodapé
    if (cfg.rodape.exibir === 'sim' && (cfg.rodape.linha1 || cfg.rodape.linha2)) {
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(cfg.rodape.fonteTam);
        pdf.setTextColor(100, 100, 100);
        const rodY = pageHeight - cfg.margens.inf;
        if (cfg.rodape.linha1) pdf.text(cfg.rodape.linha1, pageWidth / 2, rodY - 4, { align: 'center' });
        if (cfg.rodape.linha2) pdf.text(cfg.rodape.linha2, pageWidth / 2, rodY, { align: 'center' });
    }
}

function gerarVersoCertificado(pdf, aluno, cfg) {
    if (!cfg) cfg = obterConfigCert();
    const isLandscape = cfg.margens.orientacao === 'landscape';
    const pageWidth = isLandscape ? 297 : 210;
    const pageHeight = isLandscape ? 210 : 297;
    const bordaEspessura = cfg.margens.bordaEspessura;
    const corP = hexParaRgb(cfg.cores.principal);
    const corT = hexParaRgb(cfg.cores.texto);
    const corF = hexParaRgb(cfg.cores.fundo);
    
    // Fundo
    pdf.setFillColor(corF.r, corF.g, corF.b);
    pdf.rect(0, 0, pageWidth, pageHeight, 'F');

    // Fundo personalizado
    if (CERT_UPLOADS.fundoVerso) {
        try {
            pdf.addImage(CERT_UPLOADS.fundoVerso, 'JPEG', 0, 0, pageWidth, pageHeight);
        } catch(e) { console.error('Erro fundo verso:', e); }
    }
    
    // Bordas
    if (cfg.verso.bordas === 'sim' && cfg.margens.bordaExibir === 'sim' && bordaEspessura > 0) {
        const bordaV = CERT_UPLOADS.bordaVertical || (typeof BORDA_VERTICAL !== 'undefined' ? BORDA_VERTICAL : null);
        const bordaH = CERT_UPLOADS.bordaHorizontal || (typeof BORDA_HORIZONTAL !== 'undefined' ? BORDA_HORIZONTAL : null);
        
        if (bordaV) {
            try {
                pdf.addImage(bordaV, 'PNG', 0, 0, bordaEspessura, pageHeight);
                pdf.addImage(bordaV, 'PNG', pageWidth - bordaEspessura, 0, bordaEspessura, pageHeight);
            } catch(e) { console.error('Erro borda vertical verso:', e); }
        }
        if (bordaH) {
            try {
                pdf.addImage(bordaH, 'PNG', 0, 0, pageWidth, bordaEspessura);
                pdf.addImage(bordaH, 'PNG', 0, pageHeight - bordaEspessura, pageWidth, bordaEspessura);
            } catch(e) { console.error('Erro borda horizontal verso:', e); }
        }
    }
    
    // Cabeçalho do verso
    pdf.setTextColor(corP.r, corP.g, corP.b);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(7);
    
    let yPos = 25;
    let posX = 15;
    
    pdf.text('ESTABELECIMENTO DE ENSINO:', posX, yPos);
    pdf.setFont('helvetica', 'bold');
    posX += pdf.getTextWidth('ESTABELECIMENTO DE ENSINO: ');
    pdf.text(cfg.cabecalho.nomeInstituicao.toUpperCase(), posX, yPos);
    
    pdf.setFont('helvetica', 'normal');
    posX = 195;
    pdf.text('MUNICÍPIO:', posX, yPos);
    pdf.setFont('helvetica', 'bold');
    posX += pdf.getTextWidth('MUNICÍPIO: ');
    pdf.text(cfg.verso.municipio, posX, yPos);
    
    pdf.setFont('helvetica', 'normal');
    posX = 250;
    pdf.text('UF:', posX, yPos);
    pdf.setFont('helvetica', 'bold');
    posX += pdf.getTextWidth('UF: ');
    pdf.text(cfg.verso.uf, posX, yPos);
    
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
    
    // Filiação
    yPos += 5;
    posX = 15;
    pdf.setFont('helvetica', 'normal');
    pdf.text('FILIAÇÃO: MÃE:', posX, yPos);
    pdf.setFont('helvetica', 'bold');
    posX += pdf.getTextWidth('FILIAÇÃO: MÃE: ');
    pdf.text(String(aluno.nomeMae || ''), posX, yPos);
    
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
    pdf.text(cfg.verso.titulo, pageWidth / 2, yPos, { align: 'center' });
    
    // Tabela
    yPos += 8;
    pdf.setDrawColor(corP.r, corP.g, corP.b);
    pdf.setLineWidth(0.5);
    pdf.setTextColor(corT.r, corT.g, corT.b);
    
    const tabelaAltura = pageHeight - yPos - 15;
    const colunaEsqLargura = 170;
    const colunaDirLargura = pageWidth - 30 - colunaEsqLargura;
    
    pdf.rect(15, yPos, colunaEsqLargura, tabelaAltura);
    
    if (cfg.verso.observacoes === 'sim') {
        const obsY = yPos;
        pdf.setFillColor(255, 255, 200);
        pdf.rect(15 + colunaEsqLargura, obsY, colunaDirLargura, 10, 'FD');
        
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(9);
        pdf.setTextColor(corT.r, corT.g, corT.b);
        pdf.text('OBSERVAÇÕES', 15 + colunaEsqLargura + (colunaDirLargura / 2), obsY + 7, { align: 'center' });
        
        const linhaAltura = 13;
        const numLinhas = Math.floor((tabelaAltura - 10) / linhaAltura);
        
        for(let i = 0; i < numLinhas; i++) {
            pdf.rect(15 + colunaEsqLargura, obsY + 10 + (i * linhaAltura), colunaDirLargura, linhaAltura);
            
            if(i === 0 && aluno.observacoes) {
                pdf.setFont('helvetica', 'normal');
                pdf.setFontSize(8);
                pdf.text(aluno.observacoes, 15 + colunaEsqLargura + 3, obsY + 10 + (i * linhaAltura) + 8, { maxWidth: colunaDirLargura - 6 });
            }
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



/**
 * GERADOR DE CERTIFICADOS PROFISSIONAL
 * © 2026 Wander Pires Silva Coelho (wanderpsc@gmail.com)
 * Todos os direitos reservados. Software proprietário.
 * Protegido por Lei 9.610/98, Lei 9.609/98 e Art. 184 CP.
 * Reprodução, cópia ou engenharia reversa proibidas.
 */
// ==================== URL DA API ====================
const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:5000/api'
    : 'https://gerador-certificados.onrender.com/api';

// ==================== ESTADO DA APLICAÇÃO ====================
const APP_STATE = {
    alunos: JSON.parse(localStorage.getItem('alunos')) || [],
    templateSelecionado: 'estadual-pi',
    templateCustom: localStorage.getItem('templateCustom') || null,
    alunoEditando: null,
    modeloAtualId: localStorage.getItem('modeloAtualId') || null,
    modeloAtualNome: localStorage.getItem('modeloAtualNome') || null,
    autoSalvar: localStorage.getItem('autoSalvar') === 'true'
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
    aplicarPermissoesSubUsuario();
    inicializarTabs();
    inicializarFormulario();
    inicializarTemplates();
    carregarAlunos(); // Carregar alunos do servidor
});

// ==================== PERMISSÕES DE SUB-USUÁRIO ====================
function aplicarPermissoesSubUsuario() {
    const usuarioStr = localStorage.getItem('usuario');
    if (!usuarioStr) return;
    
    try {
        const usuario = JSON.parse(usuarioStr);
        if (usuario.tipo === 'subUsuario') {
            // Esconder aba "Gerenciar Usuários" para sub-usuários
            const tabUsuarios = document.querySelector('[data-tab="usuarios"]');
            if (tabUsuarios) tabUsuarios.style.display = 'none';
        }
    } catch (e) {
        // Ignorar erro de parse
    }
}

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

        // Ao entrar na aba usuários, carregar sub-usuários
        if (targetTab === 'usuarios' && typeof carregarSubUsuarios === 'function') {
            carregarSubUsuarios();
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
    document.getElementById('btnCadastroLoteCadastro').addEventListener('click', abrirModalCadastroLote);
    document.getElementById('btnImprimirLista').addEventListener('click', imprimirListaAlunos);
    document.getElementById('btnImprimirListaCadastro').addEventListener('click', imprimirListaAlunos);
    
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
        cidadeConfeccao: document.getElementById('cidadeConfeccao').value.trim(),
        resolucao: document.getElementById('resolucao').value.trim(),
        anoConclusao: document.getElementById('anoConclusao').value,
        nacionalidade: document.getElementById('nacionalidade').value.trim(),
        observacoes: document.getElementById('observacoes').value.trim()
    };

    try {
        const isEdicao = APP_STATE.alunoEditando !== null;
        const url = isEdicao 
            ? `${API_URL}/alunos/${APP_STATE.alunoEditando}`
            : `${API_URL}/alunos`;
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
        const response = await fetch(`${API_URL}/alunos`, {
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
                cidadeConfeccao: aluno.cidadeConfeccao || '',
                resolucao: aluno.resolucao,
                anoConclusao: aluno.anoConclusao,
                nacionalidade: aluno.nacionalidade,
                observacoes: aluno.observacoes
            }));
            localStorage.setItem('alunos', JSON.stringify(APP_STATE.alunos));
            
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
    document.getElementById('cidadeConfeccao').value = aluno.cidadeConfeccao || '';
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
            const response = await fetch(`${API_URL}/alunos/${id}`, {
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
    if (campos[15]) aluno.cidadeConfeccao = campos[15];

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
            const response = await fetch(`${API_URL}/alunos`, {
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
            (aluno.cpf && aluno.cpf.includes(termo))
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
                    <div>${aluno.rg}${aluno.orgaoEmissor ? ' - ' + aluno.orgaoEmissor : ''}</div>
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
                    <div class="aluno-info-label">Nacionalidade</div>
                    <div>${aluno.nacionalidade || 'Brasileira'}</div>
                </div>
                <div class="aluno-info-item">
                    <div class="aluno-info-label">Mãe</div>
                    <div>${aluno.nomeMae || ''}</div>
                </div>
                <div class="aluno-info-item">
                    <div class="aluno-info-label">Pai</div>
                    <div>${aluno.nomePai || ''}</div>
                </div>
                <div class="aluno-info-item">
                    <div class="aluno-info-label">Ano de Conclusão</div>
                    <div>${aluno.anoConclusao}</div>
                </div>
                <div class="aluno-info-item">
                    <div class="aluno-info-label">Data de Confecção</div>
                    <div>${aluno.cidadeConfeccao ? aluno.cidadeConfeccao + ', ' : ''}${aluno.dataConfeccao ? new Date(aluno.dataConfeccao + 'T00:00:00').toLocaleDateString('pt-BR') : ''}</div>
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

// ==================== IMPRIMIR LISTA DE ALUNOS ====================
function imprimirListaAlunos() {
    if (APP_STATE.alunos.length === 0) {
        mostrarNotificacao('Nenhum aluno cadastrado para imprimir!', 'error');
        return;
    }

    const janela = window.open('', '_blank');
    const dataAtual = new Date().toLocaleDateString('pt-BR');

    let linhas = APP_STATE.alunos.map((aluno, idx) => `
        <tr>
            <td>${idx + 1}</td>
            <td>${aluno.nome || ''}</td>
            <td>${aluno.cpf || ''}</td>
            <td>${aluno.rg || ''}${aluno.orgaoEmissor ? ' - ' + aluno.orgaoEmissor : ''}</td>
            <td>${aluno.diaNascimento || ''}/${aluno.mesNascimento || ''}/${aluno.anoNascimento || ''}</td>
            <td>${aluno.cidadeNascimento || ''} - ${aluno.estadoNascimento || ''}</td>
            <td>${aluno.nacionalidade || 'Brasileira'}</td>
            <td>${aluno.nomeMae || ''}</td>
            <td>${aluno.nomePai || ''}</td>
            <td>${aluno.anoConclusao || ''}</td>
            <td>${aluno.cidadeConfeccao ? aluno.cidadeConfeccao + ', ' : ''}${aluno.dataConfeccao ? new Date(aluno.dataConfeccao + 'T00:00:00').toLocaleDateString('pt-BR') : ''}</td>
            <td>${aluno.resolucao || ''}</td>
            <td>${aluno.observacoes || ''}</td>
        </tr>
    `).join('');

    janela.document.write(`
        <!DOCTYPE html>
        <html><head><title>Lista de Alunos</title>
        <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { text-align: center; color: #1e3a8a; margin-bottom: 5px; }
            .info { text-align: center; color: #666; margin-bottom: 20px; font-size: 14px; }
            table { width: 100%; border-collapse: collapse; font-size: 10px; }
            th { background: #1e3a8a; color: white; padding: 6px 4px; text-align: left; white-space: nowrap; }
            td { padding: 5px 4px; border-bottom: 1px solid #ddd; }
            tr:nth-child(even) { background: #f8f9fa; }
            .total { margin-top: 15px; font-weight: bold; font-size: 14px; }
            @media print { body { padding: 0; } @page { size: landscape; } }
        </style>
        </head><body>
        <h1>Lista de Alunos Cadastrados</h1>
        <p class="info">Data: ${dataAtual} | Total: ${APP_STATE.alunos.length} aluno(s)</p>
        <table>
            <thead><tr>
                <th>#</th><th>Nome</th><th>CPF</th><th>RG</th><th>Nascimento</th><th>Naturalidade</th><th>Nacional.</th><th>Mãe</th><th>Pai</th><th>Conclusão</th><th>Confecção</th><th>Resolução</th><th>Obs</th>
            </tr></thead>
            <tbody>${linhas}</tbody>
        </table>
        <p class="total">Total de alunos: ${APP_STATE.alunos.length}</p>
        </body></html>
    `);
    janela.document.close();
    setTimeout(() => janela.print(), 500);
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
let _posOffsets = (CERT_CONFIG && CERT_CONFIG.ajustesPosicao) ? Object.assign({}, CERT_CONFIG.ajustesPosicao) : {};
let previewLado = 'frente'; // frente ou verso

function _pf(id, fallback) {
    const v = parseFloat(document.getElementById(id)?.value);
    return isNaN(v) ? fallback : v;
}

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
            alinhamento: document.getElementById('certAlinhamento')?.value || 'justify',
            corCorpo: document.getElementById('certCorFrenteCorpo')?.value || '#000000',
            corTitulo: document.getElementById('certCorFrenteTitulo')?.value || '#1e3a8a',
            assinatura1: document.getElementById('certAssinatura1')?.value || 'SECRETÁRIO(A)',
            assinatura2: document.getElementById('certAssinatura2')?.value || 'DIRETOR(A)',
            assinatura3: document.getElementById('certAssinatura3')?.value || 'CONCLUDENTE',
            localData: document.getElementById('certLocalData')?.value || ''
        },
        verso: {
            municipio: document.getElementById('certVersoMunicipio')?.value || 'Curimatá',
            uf: document.getElementById('certVersoUF')?.value || 'Piauí',
            titulo: document.getElementById('certVersoTitulo')?.value || 'CERTIFICADO DE CONCLUSÃO DO ENSINO MÉDIO',
            observacoes: document.getElementById('certVersoObservacoes')?.value || 'sim',
            bordas: document.getElementById('certVersoBordas')?.value || 'sim',
            fonteCabecalho: document.getElementById('certVersoFonteCabecalho')?.value || 'helvetica',
            fonteCabecalhoTam: parseInt(document.getElementById('certVersoFonteCabecalhoTam')?.value) || 7,
            fonteTitulo: document.getElementById('certVersoFonteTitulo')?.value || 'times',
            fonteTituloTam: parseInt(document.getElementById('certVersoFonteTituloTam')?.value) || 13,
            estiloTitulo: document.getElementById('certVersoEstiloTitulo')?.value || 'bolditalic',
            alinhamentoTitulo: document.getElementById('certVersoAlinhamentoTitulo')?.value || 'center',
            corTexto: document.getElementById('certCorVersoTexto')?.value || '#000000',
            corTitulo: document.getElementById('certCorVersoTitulo')?.value || '#1e3a8a',
            localData: document.getElementById('certVersoLocalData')?.value || ''
        },
        rodape: {
            exibir: document.getElementById('certRodapeExibir')?.value || 'sim',
            linha1: document.getElementById('certRodapeLinha1')?.value || '',
            linha2: document.getElementById('certRodapeLinha2')?.value || '',
            fonteTam: parseInt(document.getElementById('certRodapeFonte')?.value) || 8,
            fonte: document.getElementById('certRodapeFonteFamily')?.value || 'helvetica'
        },
        margens: {
            esq: _pf('certMargemEsq', 20),
            dir: _pf('certMargemDir', 20),
            sup: _pf('certMargemSup', 15),
            inf: _pf('certMargemInf', 15),
            bordaEspessura: _pf('certBordaEspessura', 7),
            bordaExibir: document.getElementById('certBordaExibir')?.value || 'sim',
            orientacao: document.getElementById('certOrientacao')?.value || 'landscape'
        },
        cores: {
            principal: document.getElementById('certCorPrincipal')?.value || '#1e3a8a',
            cabecalho: document.getElementById('certCorCabecalho')?.value || '#1e3a8a',
            titulo: document.getElementById('certCorTitulo')?.value || '#1e3a8a',
            secundaria: document.getElementById('certCorSecundaria')?.value || '#3b82f6',
            texto: document.getElementById('certCorTexto')?.value || '#000000',
            assinatura: document.getElementById('certCorAssinatura')?.value || '#1e3a8a',
            borda: document.getElementById('certCorBorda')?.value || '#1e3a8a',
            rodape: document.getElementById('certCorRodape')?.value || '#646464',
            fundo: document.getElementById('certCorFundo')?.value || '#ffffff'
        },
        fundoImg: {
            frenteMode: document.getElementById('certFundoFrenteMode')?.value || 'clarear',
            frenteOpacidade: parseInt(document.getElementById('certFundoFrenteOpacidade')?.value) || 50,
            frenteLargura: parseInt(document.getElementById('certFundoFrenteLargura')?.value) || 100,
            frenteAltura: parseInt(document.getElementById('certFundoFrenteAltura')?.value) || 100,
            versoMode: document.getElementById('certFundoVersoMode')?.value || 'clarear',
            versoOpacidade: parseInt(document.getElementById('certFundoVersoOpacidade')?.value) || 50,
            versoLargura: parseInt(document.getElementById('certFundoVersoLargura')?.value) || 100,
            versoAltura: parseInt(document.getElementById('certFundoVersoAltura')?.value) || 100
        },
        formatacao: {
            fonteCabecalho: document.getElementById('certFmtFonteCabecalho')?.value || 'helvetica',
            estiloCabecalho: document.getElementById('certFmtEstiloCabecalho')?.value || 'bold',
            fonteTitulo: document.getElementById('certFmtFonteTitulo')?.value || 'times',
            estiloTitulo: document.getElementById('certFmtEstiloTitulo')?.value || 'bolditalic',
            estiloCorpo: document.getElementById('certFmtEstiloCorpo')?.value || 'italic',
            fonteAssinatura: document.getElementById('certFmtFonteAssinatura')?.value || 'helvetica',
            transformCabecalho: document.getElementById('certFmtTransformCabecalho')?.value || 'uppercase',
            transformTitulo: document.getElementById('certFmtTransformTitulo')?.value || 'uppercase',
            espacoLinha: parseFloat(document.getElementById('certFmtEspacoLinha')?.value) || 8,
            espacoLetras: parseFloat(document.getElementById('certFmtEspacoLetras')?.value) || 0
        },
        ajustesPosicao: Object.assign({}, _posOffsets)
    };
}

function aplicarConfigNosInputs(cfg) {
    if (!cfg || !cfg.cabecalho) return;
    if (cfg.ajustesPosicao) _posOffsets = Object.assign({}, cfg.ajustesPosicao);
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
        ['certAlinhamento', cfg.frente.alinhamento || 'justify'],
        ['certCorFrenteCorpo', cfg.frente.corCorpo || '#000000'],
        ['certCorFrenteCorpoHex', cfg.frente.corCorpo || '#000000'],
        ['certCorFrenteTitulo', cfg.frente.corTitulo || '#1e3a8a'],
        ['certCorFrenteTituloHex', cfg.frente.corTitulo || '#1e3a8a'],
        ['certAssinatura1', cfg.frente.assinatura1],
        ['certAssinatura2', cfg.frente.assinatura2],
        ['certAssinatura3', cfg.frente.assinatura3],
        ['certLocalData', cfg.frente.localData || ''],
        ['certVersoMunicipio', cfg.verso.municipio],
        ['certVersoUF', cfg.verso.uf],
        ['certVersoTitulo', cfg.verso.titulo],
        ['certVersoObservacoes', cfg.verso.observacoes],
        ['certVersoBordas', cfg.verso.bordas],
        ['certVersoFonteCabecalho', cfg.verso.fonteCabecalho],
        ['certVersoFonteCabecalhoTam', cfg.verso.fonteCabecalhoTam],
        ['certVersoFonteTitulo', cfg.verso.fonteTitulo],
        ['certVersoFonteTituloTam', cfg.verso.fonteTituloTam],
        ['certVersoEstiloTitulo', cfg.verso.estiloTitulo],
        ['certVersoAlinhamentoTitulo', cfg.verso.alinhamentoTitulo],
        ['certCorVersoTexto', cfg.verso.corTexto || '#000000'],
        ['certCorVersoTextoHex', cfg.verso.corTexto || '#000000'],
        ['certCorVersoTitulo', cfg.verso.corTitulo || '#1e3a8a'],
        ['certCorVersoTituloHex', cfg.verso.corTitulo || '#1e3a8a'],
        ['certVersoLocalData', cfg.verso.localData || ''],
        ['certRodapeExibir', cfg.rodape.exibir],
        ['certRodapeLinha1', cfg.rodape.linha1],
        ['certRodapeLinha2', cfg.rodape.linha2],
        ['certRodapeFonte', cfg.rodape.fonteTam],
        ['certRodapeFonteFamily', cfg.rodape.fonte || 'helvetica'],
        ['certMargemEsq', cfg.margens.esq],
        ['certMargemDir', cfg.margens.dir],
        ['certMargemSup', cfg.margens.sup],
        ['certMargemInf', cfg.margens.inf],
        ['certBordaEspessura', cfg.margens.bordaEspessura],
        ['certBordaExibir', cfg.margens.bordaExibir],
        ['certOrientacao', cfg.margens.orientacao],
        ['certCorPrincipal', cfg.cores.principal],
        ['certCorCabecalho', cfg.cores.cabecalho || cfg.cores.principal],
        ['certCorTitulo', cfg.cores.titulo || cfg.cores.principal],
        ['certCorSecundaria', cfg.cores.secundaria],
        ['certCorTexto', cfg.cores.texto],
        ['certCorAssinatura', cfg.cores.assinatura],
        ['certCorBorda', cfg.cores.borda || cfg.cores.principal],
        ['certCorRodape', cfg.cores.rodape || '#646464'],
        ['certCorFundo', cfg.cores.fundo],
        ['certCorPrincipalHex', cfg.cores.principal],
        ['certCorCabecalhoHex', cfg.cores.cabecalho || cfg.cores.principal],
        ['certCorTituloHex', cfg.cores.titulo || cfg.cores.principal],
        ['certCorSecundariaHex', cfg.cores.secundaria],
        ['certCorTextoHex', cfg.cores.texto],
        ['certCorAssinaturaHex', cfg.cores.assinatura],
        ['certCorBordaHex', cfg.cores.borda || cfg.cores.principal],
        ['certCorRodapeHex', cfg.cores.rodape || '#646464'],
        ['certCorFundoHex', cfg.cores.fundo],
        ['certFundoFrenteMode', cfg.fundoImg ? cfg.fundoImg.frenteMode : 'clarear'],
        ['certFundoFrenteOpacidade', cfg.fundoImg ? cfg.fundoImg.frenteOpacidade : 50],
        ['certFundoFrenteLargura', cfg.fundoImg ? cfg.fundoImg.frenteLargura : 100],
        ['certFundoFrenteAltura', cfg.fundoImg ? cfg.fundoImg.frenteAltura : 100],
        ['certFundoVersoMode', cfg.fundoImg ? cfg.fundoImg.versoMode : 'clarear'],
        ['certFundoVersoOpacidade', cfg.fundoImg ? cfg.fundoImg.versoOpacidade : 50],
        ['certFundoVersoLargura', cfg.fundoImg ? cfg.fundoImg.versoLargura : 100],
        ['certFundoVersoAltura', cfg.fundoImg ? cfg.fundoImg.versoAltura : 100],
        ['certFmtFonteCabecalho', cfg.formatacao ? cfg.formatacao.fonteCabecalho : 'helvetica'],
        ['certFmtEstiloCabecalho', cfg.formatacao ? cfg.formatacao.estiloCabecalho : 'bold'],
        ['certFmtFonteTitulo', cfg.formatacao ? cfg.formatacao.fonteTitulo : 'times'],
        ['certFmtEstiloTitulo', cfg.formatacao ? cfg.formatacao.estiloTitulo : 'bolditalic'],
        ['certFmtEstiloCorpo', cfg.formatacao ? cfg.formatacao.estiloCorpo : 'italic'],
        ['certFmtFonteAssinatura', cfg.formatacao ? cfg.formatacao.fonteAssinatura : 'helvetica'],
        ['certFmtTransformCabecalho', cfg.formatacao ? cfg.formatacao.transformCabecalho : 'uppercase'],
        ['certFmtTransformTitulo', cfg.formatacao ? cfg.formatacao.transformTitulo : 'uppercase'],
        ['certFmtEspacoLinha', cfg.formatacao ? cfg.formatacao.espacoLinha : 8],
        ['certFmtEspacoLetras', cfg.formatacao ? cfg.formatacao.espacoLetras : 0]
    ];
    sets.forEach(([id, val]) => {
        const el = document.getElementById(id);
        if (el && val !== undefined) el.value = val;
    });
    // Sincronizar labels de intensidade
    const lblF = document.getElementById('lblFundoFrenteIntensidade');
    if (lblF) lblF.textContent = (cfg.fundoImg ? cfg.fundoImg.frenteOpacidade : 50) + '%';
    const lblV = document.getElementById('lblFundoVersoIntensidade');
    if (lblV) lblV.textContent = (cfg.fundoImg ? cfg.fundoImg.versoOpacidade : 50) + '%';
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

    // Sincronizar o preview com a sub-aba selecionada
    if (tabId === 'tab-frente' || tabId === 'tab-cabecalho' || tabId === 'tab-emblema' || tabId === 'tab-formatacao') {
        previewLado = 'frente';
        atualizarPreviewCert();
    } else if (tabId === 'tab-verso') {
        previewLado = 'verso';
        atualizarPreviewCert();
    }
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
    dispararAutoSalvar();
}

function aplicarAlteracoes() {
    CERT_CONFIG = obterConfigCert();
    localStorage.setItem('certConfig', JSON.stringify(CERT_CONFIG));
    localStorage.setItem('certUploads', JSON.stringify(CERT_UPLOADS));
    atualizarPreviewCert();
    if (APP_STATE.modeloAtualId) {
        salvarModeloNaNuvem();
    } else {
        mostrarNotificacao('Alterações aplicadas!', 'success');
    }
}

// ==================== EDITOR VISUAL NA PRÉ-VISUALIZAÇÃO ====================
let _editMode = false;

function toggleEditarPreview() {
    _editMode = !_editMode;
    const btn = document.getElementById('btnEditarPreview');
    if (_editMode) {
        btn.textContent = '💾 Salvar';
        btn.classList.remove('btn-secondary');
        btn.classList.add('btn-success');
        _criarOverlaysEditaveis();
    } else {
        _salvarERemoverOverlays();
        btn.textContent = '✏️ Editar';
        btn.classList.remove('btn-success');
        btn.classList.add('btn-secondary');
    }
}

function _getCanvasWrapper() {
    const canvas = document.getElementById('previewCanvas');
    if (!canvas) return null;
    let wrapper = document.getElementById('previewCanvasWrapper');
    if (!wrapper) {
        wrapper = document.createElement('div');
        wrapper.id = 'previewCanvasWrapper';
        wrapper.style.position = 'relative';
        wrapper.style.display = 'inline-block';
        canvas.parentNode.insertBefore(wrapper, canvas);
        wrapper.appendChild(canvas);
    }
    return wrapper;
}

function _criarOverlaysEditaveis() {
    const wrapper = _getCanvasWrapper();
    const canvas = document.getElementById('previewCanvas');
    if (!wrapper || !canvas) return;
    wrapper.querySelectorAll('.edit-overlay').forEach(el => el.remove());

    const cfg = obterConfigCert();
    const isLandscape = cfg.margens.orientacao === 'landscape';
    const basePw = isLandscape ? 842 : 595;
    const basePh = isLandscape ? 595 : 842;
    const sx = basePw / (isLandscape ? 297 : 210);
    const sy = basePh / (isLandscape ? 210 : 297);
    const ds = canvas.clientWidth / basePw;
    const aj = cfg.ajustesPosicao || {};

    if (previewLado === 'frente') {
        _criarOverlaysFrente(wrapper, cfg, sx, sy, basePw, basePh, ds, aj);
    } else {
        _criarOverlaysVerso(wrapper, cfg, sx, sy, basePw, basePh, ds, aj);
    }
}

function _criarOverlaysFrente(wrapper, cfg, sx, sy, pw, ph, ds, aj) {
    const fmt = cfg.formatacao || {};
    const fontTam = cfg.cabecalho.fonteTam;
    const hFontPx = fontTam * sx / 2.1;
    const hSpacing = fontTam * sy / 2.5;
    let y = (cfg.emblema.posY + cfg.emblema.altura / 2 + 10) * sy;

    // Cabeçalho Linhas 1-3
    ['certCabecalhoLinha1', 'certCabecalhoLinha2', 'certCabecalhoLinha3'].forEach(id => {
        _addEditOverlay(wrapper, id, {
            x: pw * 0.05, y: y - hFontPx * 0.85 + (aj[id] || 0) * sy,
            w: pw * 0.9, h: hFontPx * 1.3,
            fontSize: hFontPx,
            fontFamily: fmtCanvasFamily(fmt.fonteCabecalho || 'helvetica'),
            fontWeight: 'bold',
            color: cfg.cores.cabecalho || cfg.cores.principal,
            textAlign: 'center',
            textTransform: fmt.transformCabecalho || 'uppercase',
            ds: ds, sy: sy
        });
        y += hSpacing;
    });

    // Pular CNPJ/INEP + nome + labels + endereço
    y += fontTam * sy / 2;
    y += 14 * sy / 2;
    y += 6 * sy / 2;
    y += 12 * sy / 2;
    y += 6 * sy / 2;
    y += 16 * sy / 2;

    // Título
    y += 16 * sy / 2;
    const tFontPx = cfg.frente.tituloTam * sx / 2.1;
    _addEditOverlay(wrapper, 'certTitulo', {
        x: pw * 0.1, y: y - tFontPx * 0.85 + (aj.certTitulo || 0) * sy,
        w: pw * 0.8, h: tFontPx * 1.5,
        fontSize: tFontPx,
        fontFamily: fmtCanvasFamily(fmt.fonteTitulo || 'times'),
        fontWeight: (fmt.estiloTitulo || 'bolditalic').includes('bold') ? 'bold' : 'normal',
        fontStyle: (fmt.estiloTitulo || 'bolditalic').includes('italic') ? 'italic' : 'normal',
        color: cfg.frente.corTitulo || cfg.cores.titulo || cfg.cores.principal,
        textAlign: 'center',
        textTransform: fmt.transformTitulo || 'uppercase',
        ds: ds, sy: sy
    });

    // Corpo texto
    y += 26 * sy / 2;
    const cFontPx = cfg.frente.fonteTam * sx / 2.3;
    const mEsq = cfg.margens.esq * sx;
    const maxW = pw - cfg.margens.dir * sx - mEsq;
    const assY = ph - 60 * sy / 2;

    _addEditOverlay(wrapper, 'certCorpoTexto', {
        x: mEsq, y: y - cFontPx + (aj.certCorpoTexto || 0) * sy,
        w: maxW, h: assY - y - 30,
        fontSize: cFontPx * 0.85,
        fontFamily: fmtCanvasFamily(cfg.frente.fonte || 'times'),
        fontStyle: (fmt.estiloCorpo || 'italic').includes('italic') ? 'italic' : 'normal',
        fontWeight: (fmt.estiloCorpo || 'italic').includes('bold') ? 'bold' : 'normal',
        color: cfg.frente.corCorpo || cfg.cores.texto,
        textAlign: cfg.frente.alinhamento === 'justify' ? 'justify' : (cfg.frente.alinhamento || 'left'),
        isTextarea: true,
        ds: ds, sy: sy
    });

    // Assinaturas
    const aFontPx = 9 * sx / 2.2;
    _addEditOverlay(wrapper, 'certAssinatura1', {
        x: pw * 0.08, y: assY + 2 + (aj.certAssinatura1 || 0) * sy,
        w: pw * 0.34, h: aFontPx * 2.5,
        fontSize: aFontPx,
        fontFamily: fmtCanvasFamily(fmt.fonteAssinatura || 'helvetica'),
        color: cfg.cores.assinatura,
        textAlign: 'center',
        ds: ds, sy: sy
    });
    _addEditOverlay(wrapper, 'certAssinatura2', {
        x: pw * 0.58, y: assY + 2 + (aj.certAssinatura2 || 0) * sy,
        w: pw * 0.34, h: aFontPx * 2.5,
        fontSize: aFontPx,
        fontFamily: fmtCanvasFamily(fmt.fonteAssinatura || 'helvetica'),
        color: cfg.cores.assinatura,
        textAlign: 'center',
        ds: ds, sy: sy
    });
    _addEditOverlay(wrapper, 'certAssinatura3', {
        x: pw * 0.33, y: assY + 38 + (aj.certAssinatura3 || 0) * sy,
        w: pw * 0.34, h: aFontPx * 2.5,
        fontSize: aFontPx,
        fontFamily: fmtCanvasFamily(fmt.fonteAssinatura || 'helvetica'),
        color: cfg.cores.assinatura,
        textAlign: 'center',
        ds: ds, sy: sy
    });

    // Local e Data (frente)
    if (document.getElementById('certLocalData')) {
        const ldFontPx = 10 * sx / 2.2;
        _addEditOverlay(wrapper, 'certLocalData', {
            x: pw * 0.15, y: assY - 18 * sy / 2 - ldFontPx + (aj.certLocalData || 0) * sy,
            w: pw * 0.7, h: ldFontPx * 2.2,
            fontSize: ldFontPx,
            fontFamily: fmtCanvasFamily(fmt.fonteCabecalho || 'helvetica'),
            fontWeight: 'bold',
            color: cfg.cores.texto,
            textAlign: 'center',
            ds: ds, sy: sy
        });
    }
}

function _criarOverlaysVerso(wrapper, cfg, sx, sy, pw, ph, ds, aj) {
    let yPos = 30 * sy + 12 * 5 + 20;
    const vTituloTam = cfg.verso.fonteTituloTam || 13;
    const vFontPx = vTituloTam * sx / 2.1;

    _addEditOverlay(wrapper, 'certVersoTitulo', {
        x: pw * 0.1, y: yPos - vFontPx * 0.85 + (aj.certVersoTitulo || 0) * sy,
        w: pw * 0.8, h: vFontPx * 1.5,
        fontSize: vFontPx,
        fontFamily: fmtCanvasFamily(cfg.verso.fonteTitulo || 'times'),
        fontWeight: 'bold',
        fontStyle: 'italic',
        color: cfg.verso.corTitulo || cfg.cores.titulo || cfg.cores.principal,
        textAlign: cfg.verso.alinhamentoTitulo || 'center',
        textTransform: 'uppercase',
        ds: ds, sy: sy
    });

    // Local e Data (verso)
    if (document.getElementById('certVersoLocalData')) {
        const ldVFontPx = 9 * sx / 2.2;
        const ldVY = ph - 15 * sy + (aj.certVersoLocalData || 0) * sy;
        _addEditOverlay(wrapper, 'certVersoLocalData', {
            x: pw * 0.15, y: ldVY - ldVFontPx,
            w: pw * 0.7, h: ldVFontPx * 2.2,
            fontSize: ldVFontPx,
            fontFamily: fmtCanvasFamily(cfg.verso.fonteCabecalho || 'helvetica'),
            fontWeight: 'bold',
            color: cfg.verso.corTexto || cfg.cores.texto,
            textAlign: 'center',
            ds: ds, sy: sy
        });
    }
}

function _addEditOverlay(wrapper, inputId, o) {
    const src = document.getElementById(inputId);
    if (!src) return;
    const ds = o.ds;
    const syVal = o.sy;

    // Container com grip + input
    const container = document.createElement('div');
    container.className = 'edit-overlay';
    container.dataset.inputId = inputId;
    container.dataset.origY = o.y;
    container.style.cssText = [
        'position:absolute',
        'left:' + (o.x * ds - 18) + 'px',
        'top:' + (o.y * ds) + 'px',
        'display:flex',
        'align-items:stretch',
        'z-index:10'
    ].join(';');

    // Grip handle
    const grip = document.createElement('div');
    grip.style.cssText = 'width:16px;min-height:100%;cursor:ns-resize;display:flex;align-items:center;justify-content:center;background:rgba(59,130,246,0.2);border-radius:3px 0 0 3px;color:#3b82f6;font-size:14px;user-select:none;flex-shrink:0;';
    grip.textContent = '↕';
    grip.title = 'Arrastar para mover';

    // Input element
    const el = document.createElement(o.isTextarea ? 'textarea' : 'input');
    if (!o.isTextarea) el.type = 'text';
    el.value = src.value;
    el.style.cssText = [
        'width:' + (o.w * ds) + 'px',
        'height:' + (o.h * ds) + 'px',
        'font-size:' + Math.max(o.fontSize * ds, 10) + 'px',
        'font-family:' + (o.fontFamily || 'serif'),
        'font-weight:' + (o.fontWeight || 'normal'),
        'font-style:' + (o.fontStyle || 'normal'),
        'color:' + (o.color || '#000'),
        'text-align:' + (o.textAlign || 'left'),
        'text-transform:' + (o.textTransform || 'none'),
        'background:rgba(255,255,255,0.75)',
        'border:1px dashed rgba(59,130,246,0.6)',
        'border-radius:0 3px 3px 0',
        'padding:2px 4px',
        'outline:none',
        'box-sizing:border-box',
        'resize:none',
        'overflow:hidden',
        'line-height:1.3',
        'cursor:text',
        'flex-shrink:0'
    ].join(';');

    el.addEventListener('input', () => { src.value = el.value; });
    el.addEventListener('focus', () => {
        el.style.background = 'rgba(255,255,255,0.95)';
        el.style.borderColor = '#3b82f6';
        el.style.borderStyle = 'solid';
        el.style.boxShadow = '0 0 0 2px rgba(59,130,246,0.25)';
    });
    el.addEventListener('blur', () => {
        el.style.background = 'rgba(255,255,255,0.75)';
        el.style.borderColor = 'rgba(59,130,246,0.6)';
        el.style.borderStyle = 'dashed';
        el.style.boxShadow = 'none';
    });

    container.appendChild(grip);
    container.appendChild(el);

    // Drag logic
    let dragging = false, startMouseY = 0, startTop = 0;
    grip.addEventListener('mousedown', e => {
        dragging = true;
        startMouseY = e.clientY;
        startTop = parseFloat(container.style.top);
        e.preventDefault();
    });
    const onMove = e => {
        if (!dragging) return;
        const dy = e.clientY - startMouseY;
        container.style.top = (startTop + dy) + 'px';
    };
    const onUp = () => {
        if (!dragging) return;
        dragging = false;
        const currentTop = parseFloat(container.style.top);
        const origTop = parseFloat(container.dataset.origY) * ds;
        const deltaCSS = currentTop - origTop;
        const deltaMM = deltaCSS / (ds * syVal);
        _posOffsets[inputId] = (_posOffsets[inputId] || 0) + deltaMM;
        // Update origY so subsequent drags don't re-add the same delta
        container.dataset.origY = currentTop / ds;
    };
    // Touch support
    grip.addEventListener('touchstart', e => {
        dragging = true;
        startMouseY = e.touches[0].clientY;
        startTop = parseFloat(container.style.top);
        e.preventDefault();
    }, { passive: false });
    const onTouchMove = e => {
        if (!dragging) return;
        const dy = e.touches[0].clientY - startMouseY;
        container.style.top = (startTop + dy) + 'px';
    };
    const onTouchEnd = () => { onUp(); };

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
    document.addEventListener('touchmove', onTouchMove, { passive: false });
    document.addEventListener('touchend', onTouchEnd);

    // Cleanup listeners when overlay removed
    container._cleanup = () => {
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
        document.removeEventListener('touchmove', onTouchMove);
        document.removeEventListener('touchend', onTouchEnd);
    };

    wrapper.appendChild(container);
}

function _salvarERemoverOverlays() {
    const wrapper = document.getElementById('previewCanvasWrapper');
    if (wrapper) {
        wrapper.querySelectorAll('.edit-overlay').forEach(el => {
            const inputEl = el.querySelector('input, textarea');
            const src = document.getElementById(el.dataset.inputId);
            if (src && inputEl) src.value = inputEl.value;
            if (el._cleanup) el._cleanup();
            el.remove();
        });
    }
    CERT_CONFIG = obterConfigCert();
    localStorage.setItem('certConfig', JSON.stringify(CERT_CONFIG));
    localStorage.setItem('certUploads', JSON.stringify(CERT_UPLOADS));
    atualizarPreviewCert();
    dispararAutoSalvar();
    mostrarNotificacao('Alterações salvas!', 'success');
}

function resetarPersonalizacao() {
    if (!confirm('Resetar todas as personalizações para os valores padrão?')) return;
    localStorage.removeItem('certConfig');
    localStorage.removeItem('certUploads');
    CERT_CONFIG = {};
    CERT_UPLOADS = {};
    _posOffsets = {};
    APP_STATE.modeloAtualId = null;
    APP_STATE.modeloAtualNome = null;
    localStorage.removeItem('modeloAtualId');
    localStorage.removeItem('modeloAtualNome');
    // Recarregar a página para limpar os campos
    location.hash = 'templates';
    location.reload();
}

// ==================== MODELOS NA NUVEM ====================
let _autoSalvarTimer = null;

function toggleAutoSalvar(ativo) {
    APP_STATE.autoSalvar = ativo;
    localStorage.setItem('autoSalvar', ativo ? 'true' : 'false');
    mostrarNotificacao(ativo ? 'Auto-salvar ativado' : 'Auto-salvar desativado', 'info');
}

function dispararAutoSalvar() {
    if (!APP_STATE.autoSalvar || !APP_STATE.modeloAtualId) return;
    clearTimeout(_autoSalvarTimer);
    _autoSalvarTimer = setTimeout(async () => {
        const config = obterConfigCert();
        CERT_CONFIG = config; // Manter sincronizado
        const token = localStorage.getItem('token');
        if (!token) return;
        try {
            await fetch(`${API_URL}/modelos/${APP_STATE.modeloAtualId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ config, uploads: CERT_UPLOADS })
            });
        } catch(e) { /* silencioso */ }
    }, 3000);
}

async function salvarModeloNaNuvem() {
    const token = localStorage.getItem('token');
    if (!token) { mostrarNotificacao('Faça login para salvar modelos na nuvem.', 'error'); return; }

    const config = obterConfigCert();
    CERT_CONFIG = config; // Sincronizar CERT_CONFIG com os inputs atuais

    if (APP_STATE.modeloAtualId) {
        // Atualizar modelo existente
        try {
            const resp = await fetch(`${API_URL}/modelos/${APP_STATE.modeloAtualId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ config, uploads: CERT_UPLOADS })
            });
            const data = await resp.json();
            if (data.success) {
                localStorage.setItem('certConfig', JSON.stringify(config));
                localStorage.setItem('certUploads', JSON.stringify(CERT_UPLOADS));
                mostrarNotificacao(`Modelo "${APP_STATE.modeloAtualNome}" atualizado na nuvem!`, 'success');
                carregarModelosSalvos();
            } else {
                mostrarNotificacao(data.message || 'Erro ao atualizar', 'error');
            }
        } catch(e) { mostrarNotificacao('Erro de conexão', 'error'); }
        return;
    }

    // Novo modelo — pedir nome
    const nome = prompt('Nome do modelo:');
    if (!nome || !nome.trim()) return;
    const descricao = prompt('Descrição (opcional):') || '';

    try {
        const resp = await fetch(`${API_URL}/modelos`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ nome: nome.trim(), descricao: descricao.trim(), config, uploads: CERT_UPLOADS })
        });
        const data = await resp.json();
        if (data.success) {
            APP_STATE.modeloAtualId = data.modelo._id;
            APP_STATE.modeloAtualNome = data.modelo.nome;
            localStorage.setItem('modeloAtualId', data.modelo._id);
            localStorage.setItem('modeloAtualNome', data.modelo.nome);
            localStorage.setItem('certConfig', JSON.stringify(config));
            localStorage.setItem('certUploads', JSON.stringify(CERT_UPLOADS));
            atualizarInfoModeloAtual();
            mostrarNotificacao(`Modelo "${nome}" salvo na nuvem!`, 'success');
            carregarModelosSalvos();
        } else {
            mostrarNotificacao(data.message || 'Erro ao salvar', 'error');
        }
    } catch(e) { mostrarNotificacao('Erro de conexão', 'error'); }
}

async function carregarModelosSalvos() {
    const token = localStorage.getItem('token');
    if (!token) return;
    const grid = document.getElementById('modelosSalvosGrid');
    if (!grid) return;

    try {
        const resp = await fetch(`${API_URL}/modelos`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await resp.json();
        if (!data.success || !data.modelos.length) {
            grid.innerHTML = '<div style="text-align: center; color: #9ca3af; padding: 20px; grid-column: 1/-1;">Nenhum modelo salvo. Use "☁️ Salvar na Nuvem" para criar.</div>';
            return;
        }
        grid.innerHTML = data.modelos.map(m => `
            <div class="card" style="padding: 12px; cursor: pointer; border: 2px solid ${APP_STATE.modeloAtualId === m._id ? '#3b82f6' : '#e5e7eb'}; border-radius: 12px; transition: all 0.2s;">
                <div style="font-weight: 600; font-size: 14px; margin-bottom: 4px; color: #1e3a8a;">${escapeHtml(m.nome)}</div>
                ${m.descricao ? `<div style="font-size: 12px; color: #6b7280; margin-bottom: 6px;">${escapeHtml(m.descricao)}</div>` : ''}
                <div style="font-size: 11px; color: #9ca3af; margin-bottom: 8px;">Atualizado: ${new Date(m.atualizadoEm).toLocaleDateString('pt-BR')}</div>
                <div style="display: flex; gap: 4px; flex-wrap: wrap;">
                    <button class="btn btn-primary btn-sm" onclick="carregarModeloNuvem('${m._id}')" style="font-size: 11px; padding: 4px 8px;">📂 Carregar</button>
                    <button class="btn btn-secondary btn-sm" onclick="copiarModeloNuvem('${m._id}')" style="font-size: 11px; padding: 4px 8px;">📋 Copiar</button>
                    <button class="btn btn-secondary btn-sm" onclick="arquivarModeloNuvem('${m._id}')" style="font-size: 11px; padding: 4px 8px;">📦 Arquivar</button>
                    <button class="btn btn-danger btn-sm" onclick="excluirModeloNuvem('${m._id}', '${escapeHtml(m.nome)}')" style="font-size: 11px; padding: 4px 8px;">🗑️</button>
                </div>
            </div>
        `).join('');
    } catch(e) {
        grid.innerHTML = '<div style="text-align: center; color: #ef4444; padding: 20px; grid-column: 1/-1;">Erro ao carregar modelos.</div>';
    }
}

async function carregarModeloNuvem(id) {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
        const resp = await fetch(`${API_URL}/modelos/${id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await resp.json();
        if (!data.success) { mostrarNotificacao(data.message || 'Erro', 'error'); return; }
        const m = data.modelo;
        CERT_CONFIG = m.config;
        CERT_UPLOADS = m.uploads || {};
        APP_STATE.modeloAtualId = m._id;
        APP_STATE.modeloAtualNome = m.nome;
        localStorage.setItem('certConfig', JSON.stringify(CERT_CONFIG));
        localStorage.setItem('certUploads', JSON.stringify(CERT_UPLOADS));
        localStorage.setItem('modeloAtualId', m._id);
        localStorage.setItem('modeloAtualNome', m.nome);
        aplicarConfigNosInputs(CERT_CONFIG);
        atualizarInfoModeloAtual();
        atualizarPreviewCert();
        carregarModelosSalvos();
        mostrarNotificacao(`Modelo "${m.nome}" carregado!`, 'success');
    } catch(e) { mostrarNotificacao('Erro de conexão', 'error'); }
}

async function copiarModeloNuvem(id) {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
        const resp = await fetch(`${API_URL}/modelos/${id}/copiar`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await resp.json();
        if (data.success) {
            mostrarNotificacao(`Cópia criada: "${data.modelo.nome}"`, 'success');
            carregarModelosSalvos();
        } else { mostrarNotificacao(data.message || 'Erro', 'error'); }
    } catch(e) { mostrarNotificacao('Erro de conexão', 'error'); }
}

function copiarModeloAtual() {
    if (APP_STATE.modeloAtualId) {
        copiarModeloNuvem(APP_STATE.modeloAtualId);
    } else {
        // Sem modelo carregado — salvar como novo
        salvarModeloNaNuvem();
    }
}

async function arquivarModeloNuvem(id) {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
        const resp = await fetch(`${API_URL}/modelos/${id}/arquivar`, {
            method: 'PATCH',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await resp.json();
        if (data.success) {
            if (APP_STATE.modeloAtualId === id) {
                APP_STATE.modeloAtualId = null;
                APP_STATE.modeloAtualNome = null;
                localStorage.removeItem('modeloAtualId');
                localStorage.removeItem('modeloAtualNome');
                atualizarInfoModeloAtual();
            }
            mostrarNotificacao(data.arquivado ? 'Modelo arquivado' : 'Modelo desarquivado', 'success');
            carregarModelosSalvos();
        } else { mostrarNotificacao(data.message || 'Erro', 'error'); }
    } catch(e) { mostrarNotificacao('Erro de conexão', 'error'); }
}

async function excluirModeloNuvem(id, nome) {
    if (!confirm(`Excluir o modelo "${nome}" permanentemente?`)) return;
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
        const resp = await fetch(`${API_URL}/modelos/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await resp.json();
        if (data.success) {
            if (APP_STATE.modeloAtualId === id) {
                APP_STATE.modeloAtualId = null;
                APP_STATE.modeloAtualNome = null;
                localStorage.removeItem('modeloAtualId');
                localStorage.removeItem('modeloAtualNome');
                atualizarInfoModeloAtual();
            }
            mostrarNotificacao('Modelo excluído', 'success');
            carregarModelosSalvos();
        } else { mostrarNotificacao(data.message || 'Erro', 'error'); }
    } catch(e) { mostrarNotificacao('Erro de conexão', 'error'); }
}

async function listarModelosArquivados() {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
        const resp = await fetch(`${API_URL}/modelos?arquivado=true`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await resp.json();
        if (!data.success || !data.modelos.length) {
            mostrarNotificacao('Nenhum modelo arquivado.', 'info');
            return;
        }
        const html = data.modelos.map(m => `
            <div style="display:flex; justify-content:space-between; align-items:center; padding:8px 0; border-bottom:1px solid #e5e7eb;">
                <div>
                    <strong>${escapeHtml(m.nome)}</strong>
                    <span style="color:#9ca3af; font-size:12px; margin-left:8px;">${new Date(m.atualizadoEm).toLocaleDateString('pt-BR')}</span>
                </div>
                <div style="display:flex; gap:6px;">
                    <button class="btn btn-primary btn-sm" onclick="arquivarModeloNuvem('${m._id}');this.closest('.overlay-modal')?.remove();" style="font-size:11px; padding:3px 8px;">Restaurar</button>
                    <button class="btn btn-danger btn-sm" onclick="excluirModeloNuvem('${m._id}','${escapeHtml(m.nome)}');this.closest('.overlay-modal')?.remove();" style="font-size:11px; padding:3px 8px;">Excluir</button>
                </div>
            </div>
        `).join('');
        const modal = document.createElement('div');
        modal.className = 'overlay-modal';
        modal.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.5);z-index:9999;display:flex;align-items:center;justify-content:center;';
        modal.innerHTML = `<div style="background:white;border-radius:16px;padding:24px;max-width:500px;width:90%;max-height:70vh;overflow-y:auto;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
                <h3 style="color:#1e3a8a;">📦 Modelos Arquivados</h3>
                <button onclick="this.closest('.overlay-modal').remove()" style="background:none;border:none;font-size:20px;cursor:pointer;">✕</button>
            </div>
            ${html}
        </div>`;
        document.body.appendChild(modal);
        modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });
    } catch(e) { mostrarNotificacao('Erro ao carregar arquivados', 'error'); }
}

function descarregarModelo() {
    APP_STATE.modeloAtualId = null;
    APP_STATE.modeloAtualNome = null;
    localStorage.removeItem('modeloAtualId');
    localStorage.removeItem('modeloAtualNome');
    atualizarInfoModeloAtual();
    carregarModelosSalvos();
    mostrarNotificacao('Modelo desvinculado. Agora editando modelo novo.', 'info');
}

function atualizarInfoModeloAtual() {
    const info = document.getElementById('modeloAtualInfo');
    const nome = document.getElementById('modeloAtualNome');
    if (!info || !nome) return;
    if (APP_STATE.modeloAtualId && APP_STATE.modeloAtualNome) {
        info.style.display = 'block';
        nome.textContent = APP_STATE.modeloAtualNome;
    } else {
        info.style.display = 'none';
    }
}

function escapeHtml(text) {
    const d = document.createElement('div');
    d.textContent = text;
    return d.innerHTML;
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

function handleUploadBordaCompleta(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
        CERT_UPLOADS.bordaCompleta = e.target.result;
        document.getElementById('previewBordaCompleta').innerHTML = `<img src="${e.target.result}" style="max-height: 80px; border-radius: 8px;">`;
        document.getElementById('btnRemoverBordaCompleta').style.display = 'inline-block';
        atualizarPreviewCert();
        mostrarNotificacao('Borda completa carregada!', 'success');
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
    } else if (tipo === 'bordaCompleta') {
        delete CERT_UPLOADS.bordaCompleta;
        document.getElementById('previewBordaCompleta').innerHTML = '';
        document.getElementById('btnRemoverBordaCompleta').style.display = 'none';
        document.getElementById('uploadBordaCompleta').value = '';
    }
    atualizarPreviewCert();
}

function hexParaRgb(hex) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return { r, g, b };
}

// ==================== CARREGAR IMAGEM ASYNC ====================
function carregarImagem(src) {
    return new Promise((resolve) => {
        if (!src) { resolve(null); return; }
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => resolve(null);
        img.src = src;
    });
}

// Rotaciona imagem 90° CW para gerar borda vertical a partir da horizontal (garante mesma espessura visual)
function _rotateImageForBorder(dataUrl) {
    return new Promise((resolve) => {
        if (!dataUrl) { resolve(null); return; }
        const img = new Image();
        img.onload = () => {
            const c = document.createElement('canvas');
            c.width = img.height;
            c.height = img.width;
            const ctx = c.getContext('2d');
            ctx.translate(c.width, 0);
            ctx.rotate(Math.PI / 2);
            ctx.drawImage(img, 0, 0);
            resolve(c.toDataURL('image/png'));
        };
        img.onerror = () => resolve(null);
        img.src = dataUrl;
    });
}

function detectarFormatoImagem(dataUrl) {
    if (!dataUrl) return 'PNG';
    if (dataUrl.startsWith('data:image/jpeg') || dataUrl.startsWith('data:image/jpg')) return 'JPEG';
    if (dataUrl.startsWith('data:image/webp')) return 'WEBP';
    return 'PNG';
}

// ==================== PRÉ-VISUALIZAÇÃO NO CANVAS ====================
async function atualizarPreviewCert() {
    const canvas = document.getElementById('previewCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const cfg = obterConfigCert();

    const isLandscape = cfg.margens.orientacao === 'landscape';
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const basePw = isLandscape ? 842 : 595;
    const basePh = isLandscape ? 595 : 842;
    const pw = basePw * dpr;
    const ph = basePh * dpr;
    canvas.width = pw;
    canvas.height = ph;
    canvas.style.width = basePw + 'px';
    canvas.style.height = basePh + 'px';
    ctx.scale(dpr, dpr);

    // Habilitar suavização de alta qualidade
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // Escala para mm (baseada nas dimensões lógicas)
    const sx = basePw / (isLandscape ? 297 : 210);
    const sy = basePh / (isLandscape ? 210 : 297);
    // Dimensões lógicas usadas para desenho
    const pw_l = basePw;
    const ph_l = basePh;

    // Fundo
    ctx.fillStyle = cfg.cores.fundo;
    ctx.fillRect(0, 0, pw_l, ph_l);

    // Pré-carregar todas as imagens necessárias
    const imgs = {};
    if (previewLado === 'frente') {
        if (CERT_UPLOADS.fundoFrente) imgs.fundo = await carregarImagem(CERT_UPLOADS.fundoFrente);
        if (cfg.emblema.tipo === 'custom' && CERT_UPLOADS.emblemaCustom) {
            imgs.emblema = await carregarImagem(CERT_UPLOADS.emblemaCustom);
        } else if (cfg.emblema.tipo === 'brasao-brasil' && typeof BRASAO_BRASIL !== 'undefined') {
            imgs.emblema = await carregarImagem(BRASAO_BRASIL);
        }
        if (CERT_UPLOADS.bordaCompleta) imgs.bordaCompleta = await carregarImagem(CERT_UPLOADS.bordaCompleta);
        desenharPreviewFrente(ctx, cfg, sx, sy, pw_l, ph_l, imgs);
    } else {
        if (CERT_UPLOADS.fundoVerso) imgs.fundo = await carregarImagem(CERT_UPLOADS.fundoVerso);
        if (CERT_UPLOADS.bordaCompleta) imgs.bordaCompleta = await carregarImagem(CERT_UPLOADS.bordaCompleta);
        desenharPreviewVerso(ctx, cfg, sx, sy, pw_l, ph_l, imgs);
    }

    document.getElementById('previewLadoLabel').textContent = 'Mostrando: ' + (previewLado === 'frente' ? 'FRENTE' : 'VERSO');
}

function desenharPreviewFrente(ctx, cfg, sx, sy, pw, ph, imgs) {
    const pageWidth = pw / sx; // em mm
    const bordaEsp = cfg.margens.bordaEspessura;

    // Fundo de imagem com overlay
    if (imgs && imgs.fundo) {
        const fi = cfg.fundoImg || {};
        const largPct = (fi.frenteLargura || 100) / 100;
        const altPct = (fi.frenteAltura || 100) / 100;
        const imgW = pw * largPct;
        const imgH = ph * altPct;
        const imgX = (pw - imgW) / 2;
        const imgY = (ph - imgH) / 2;
        ctx.drawImage(imgs.fundo, imgX, imgY, imgW, imgH);
        const mode = fi.frenteMode || 'clarear';
        const opac = (fi.frenteOpacidade || 50) / 100;
        if (mode !== 'nenhum' && opac > 0) {
            ctx.fillStyle = mode === 'escurecer' ? 'rgba(0,0,0,' + opac + ')' : 'rgba(255,255,255,' + opac + ')';
            ctx.fillRect(0, 0, pw, ph);
        }
    }

    // Bordas decorativas simuladas
    if (cfg.margens.bordaExibir === 'sim' && bordaEsp > 0) {
        const sUnif = (sx + sy) / 2; // escala uniforme para espessura igual em todas as direções
        if (imgs && imgs.bordaCompleta) {
            ctx.drawImage(imgs.bordaCompleta, 0, 0, pw, ph);
        } else {
            ctx.fillStyle = cfg.cores.borda || cfg.cores.principal;
            ctx.globalAlpha = 0.3;
            ctx.fillRect(0, 0, bordaEsp * sUnif, ph); // esq
            ctx.fillRect(pw - bordaEsp * sUnif, 0, bordaEsp * sUnif, ph); // dir
            ctx.fillRect(0, 0, pw, bordaEsp * sUnif); // sup
            ctx.fillRect(0, ph - bordaEsp * sUnif, pw, bordaEsp * sUnif); // inf
            ctx.globalAlpha = 1;
        }
    }

    // Emblema (largura e altura configuráveis)
    if (cfg.emblema.tipo !== 'nenhum') {
        const emX = pw / 2;
        const emY = cfg.emblema.posY * sy;
        const emW = cfg.emblema.largura * sx;
        const emH = cfg.emblema.altura * sy;
        if (imgs && imgs.emblema) {
            ctx.drawImage(imgs.emblema, emX - emW / 2, emY - emH / 2, emW, emH);
        } else {
            ctx.fillStyle = '#d4a843';
            ctx.globalAlpha = 0.4;
            ctx.fillRect(emX - emW / 2, emY - emH / 2, emW, emH);
            ctx.globalAlpha = 1;
            ctx.fillStyle = '#8b6914';
            ctx.font = 'bold 14px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('BRASÃO', emX, emY + 5);
        }
    }

    // Cabeçalho
    const corCabecalho = cfg.cores.cabecalho || cfg.cores.principal;
    const fontTam = cfg.cabecalho.fonteTam;
    const fmt = cfg.formatacao || {};
    const aj = cfg.ajustesPosicao || {};
    ctx.fillStyle = corCabecalho;
    ctx.font = `${fmtCanvasStyle(fmt.estiloCabecalho || 'bold')} ${fontTam * sx / 2.1}px ${fmtCanvasFamily(fmt.fonteCabecalho || 'helvetica')}`;
    ctx.textAlign = 'center';

    let yBase = (cfg.emblema.posY + cfg.emblema.altura / 2 + 10) * sy;
    ctx.fillText(fmtTransformText(cfg.cabecalho.linha1, fmt.transformCabecalho || 'uppercase'), pw / 2, yBase + (aj.certCabecalhoLinha1 || 0) * sy);
    yBase += fontTam * sy / 2.5;
    ctx.fillText(fmtTransformText(cfg.cabecalho.linha2, fmt.transformCabecalho || 'uppercase'), pw / 2, yBase + (aj.certCabecalhoLinha2 || 0) * sy);
    yBase += fontTam * sy / 2.5;
    ctx.fillText(fmtTransformText(cfg.cabecalho.linha3, fmt.transformCabecalho || 'uppercase'), pw / 2, yBase + (aj.certCabecalhoLinha3 || 0) * sy);

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
    ctx.fillStyle = cfg.frente.corTitulo || cfg.cores.titulo || cfg.cores.principal;
    ctx.font = `${fmtCanvasStyle(fmt.estiloTitulo || 'bolditalic')} ${cfg.frente.tituloTam * sx / 2.1}px ${fmtCanvasFamily(fmt.fonteTitulo || 'times')}`;
    ctx.fillText(fmtTransformText(cfg.frente.titulo, fmt.transformTitulo || 'uppercase'), pw / 2, yBase + (aj.certTitulo || 0) * sy);

    // Corpo resumido
    yBase += 26 * sy / 2;
    ctx.fillStyle = cfg.frente.corCorpo || cfg.cores.texto;
    ctx.font = `${fmtCanvasStyle(fmt.estiloCorpo || 'italic')} ${cfg.frente.fonteTam * sx / 2.3}px ${fmtCanvasFamily(cfg.frente.fonte || 'times')}`;
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

    wrapText(ctx, textoPreview, margemEsq, yBase + (aj.certCorpoTexto || 0) * sy, maxW, (fmt.espacoLinha || 8) * sy / 2.5, cfg.frente.alinhamento || 'justify');

    // Local e Data (frente)
    const assY = ph - 60 * sy / 2;
    if (cfg.frente.localData) {
        const ldY = assY - 18 * sy / 2 + (aj.certLocalData || 0) * sy;
        ctx.fillStyle = cfg.cores.texto;
        ctx.font = `bold ${10 * sx / 2.2}px ${fmtCanvasFamily(fmt.fonteCabecalho || 'helvetica')}`;
        ctx.textAlign = 'center';
        ctx.fillText(cfg.frente.localData, pw / 2, ldY);
    }

    // Linhas de assinatura
    ctx.strokeStyle = cfg.cores.assinatura;
    ctx.lineWidth = 1;
    ctx.textAlign = 'center';
    ctx.fillStyle = cfg.cores.assinatura;
    ctx.font = `${9 * sx / 2.2}px ${fmtCanvasFamily(fmt.fonteAssinatura || 'helvetica')}`;

    const a1dy = (aj.certAssinatura1 || 0) * sy;
    ctx.beginPath(); ctx.moveTo(pw * 0.08, assY + a1dy); ctx.lineTo(pw * 0.42, assY + a1dy); ctx.stroke();
    ctx.fillText(cfg.frente.assinatura1, pw * 0.25, assY + 14 + a1dy);

    const a2dy = (aj.certAssinatura2 || 0) * sy;
    ctx.beginPath(); ctx.moveTo(pw * 0.58, assY + a2dy); ctx.lineTo(pw * 0.92, assY + a2dy); ctx.stroke();
    ctx.fillText(cfg.frente.assinatura2, pw * 0.75, assY + 14 + a2dy);

    const a3dy = (aj.certAssinatura3 || 0) * sy;
    const ass3Y = assY + 36 + a3dy;
    ctx.beginPath(); ctx.moveTo(pw * 0.33, ass3Y); ctx.lineTo(pw * 0.67, ass3Y); ctx.stroke();
    ctx.fillText(cfg.frente.assinatura3, pw * 0.5, ass3Y + 14);

    // Rodapé
    if (cfg.rodape.exibir === 'sim' && (cfg.rodape.linha1 || cfg.rodape.linha2)) {
        const rodY = ph - 12;
        ctx.fillStyle = cfg.cores.rodape || '#646464';
        ctx.font = `${cfg.rodape.fonteTam * sx / 2.5}px ${fmtCanvasFamily(cfg.rodape.fonte || 'helvetica')}`;
        ctx.textAlign = 'center';
        if (cfg.rodape.linha1) ctx.fillText(cfg.rodape.linha1, pw / 2, rodY - 10);
        if (cfg.rodape.linha2) ctx.fillText(cfg.rodape.linha2, pw / 2, rodY);
    }
}

function desenharPreviewVerso(ctx, cfg, sx, sy, pw, ph, imgs) {
    const bordaEsp = cfg.margens.bordaEspessura;

    // Fundo de imagem com overlay
    if (imgs && imgs.fundo) {
        const fi = cfg.fundoImg || {};
        const largPct = (fi.versoLargura || 100) / 100;
        const altPct = (fi.versoAltura || 100) / 100;
        const imgW = pw * largPct;
        const imgH = ph * altPct;
        const imgX = (pw - imgW) / 2;
        const imgY = (ph - imgH) / 2;
        ctx.drawImage(imgs.fundo, imgX, imgY, imgW, imgH);
        const mode = fi.versoMode || 'clarear';
        const opac = (fi.versoOpacidade || 50) / 100;
        if (mode !== 'nenhum' && opac > 0) {
            ctx.fillStyle = mode === 'escurecer' ? 'rgba(0,0,0,' + opac + ')' : 'rgba(255,255,255,' + opac + ')';
            ctx.fillRect(0, 0, pw, ph);
        }
    }

    // Bordas
    if (cfg.verso.bordas === 'sim' && cfg.margens.bordaExibir === 'sim' && bordaEsp > 0) {
        const sUnif = (sx + sy) / 2; // escala uniforme para espessura igual
        if (imgs && imgs.bordaCompleta) {
            ctx.drawImage(imgs.bordaCompleta, 0, 0, pw, ph);
        } else {
            ctx.fillStyle = cfg.cores.borda || cfg.cores.principal;
            ctx.globalAlpha = 0.3;
            ctx.fillRect(0, 0, bordaEsp * sUnif, ph);
            ctx.fillRect(pw - bordaEsp * sUnif, 0, bordaEsp * sUnif, ph);
            ctx.fillRect(0, 0, pw, bordaEsp * sUnif);
            ctx.fillRect(0, ph - bordaEsp * sUnif, pw, bordaEsp * sUnif);
            ctx.globalAlpha = 1;
        }
    }

    // Cabeçalho do verso
    let yPos = 30 * sy;
    ctx.fillStyle = cfg.verso.corTexto || cfg.cores.texto;
    const versoCabFonte = cfg.verso.fonteCabecalho || 'helvetica';
    const versoCabTam = cfg.verso.fonteCabecalhoTam || 7;
    ctx.font = `bold ${versoCabTam * sx / 2}px ${fmtCanvasFamily(versoCabFonte)}`;
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
    const aj = cfg.ajustesPosicao || {};
    const versoTituloFonte = cfg.verso.fonteTitulo || 'times';
    const versoTituloTam = cfg.verso.fonteTituloTam || 13;
    const versoTituloEstilo = cfg.verso.estiloTitulo || 'bolditalic';
    const versoTituloAlign = cfg.verso.alinhamentoTitulo || 'center';
    ctx.fillStyle = cfg.verso.corTitulo || cfg.cores.titulo || cfg.cores.principal;
    ctx.font = `${fmtCanvasStyle(versoTituloEstilo)} ${versoTituloTam * sx / 2.1}px ${fmtCanvasFamily(versoTituloFonte)}`;
    ctx.textAlign = versoTituloAlign;
    const tituloX = versoTituloAlign === 'center' ? pw / 2 : (versoTituloAlign === 'right' ? pw - 15 * sx : 15 * sx);
    ctx.fillText(fmtTransformText(cfg.verso.titulo, 'uppercase'), tituloX, yPos + (aj.certVersoTitulo || 0) * sy);

    // Tabela placeholder
    yPos += 15;
    ctx.strokeStyle = cfg.cores.borda || cfg.cores.principal;
    ctx.lineWidth = 1;
    const tabelaW = pw - 30 * sx;
    const tabelaH = ph - yPos - 20 * sy;
    ctx.strokeRect(mx, yPos, tabelaW * 0.65, tabelaH);

    // Observações
    if (cfg.verso.observacoes === 'sim') {
        const obsX = mx + tabelaW * 0.65;
        const obsW = tabelaW * 0.35;
        
        // Retângulo externo completo (mesma altura da tabela principal)
        ctx.strokeRect(obsX, yPos, obsW, tabelaH);
        
        // Cabeçalho com fundo amarelo
        ctx.fillStyle = '#ffffc8';
        ctx.fillRect(obsX, yPos, obsW, 20);
        ctx.strokeRect(obsX, yPos, obsW, 20);
        
        // Linhas horizontais internas
        const linhaAlt = 20;
        const numLinhas = Math.floor((tabelaH - 20) / linhaAlt);
        for (let i = 1; i < numLinhas; i++) {
            const ly = yPos + 20 + (i * linhaAlt);
            ctx.beginPath();
            ctx.moveTo(obsX, ly);
            ctx.lineTo(obsX + obsW, ly);
            ctx.stroke();
        }
        
        ctx.fillStyle = cfg.verso.corTexto || cfg.cores.texto;
        ctx.font = `bold ${9 * sx / 2.2}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText('OBSERVAÇÕES', obsX + obsW / 2, yPos + 14);
    }

    // Texto na tabela principal
    ctx.fillStyle = '#9ca3af';
    ctx.font = `italic ${10 * sx / 2.2}px sans-serif`;
    ctx.fillText('Área para Histórico Escolar', mx + tabelaW * 0.325, yPos + tabelaH / 2);

    // Local e Data (verso)
    if (cfg.verso.localData) {
        const ldVY = ph - 15 * sy + (aj.certVersoLocalData || 0) * sy;
        ctx.fillStyle = cfg.verso.corTexto || cfg.cores.texto;
        ctx.font = `bold ${9 * sx / 2.2}px ${fmtCanvasFamily(cfg.verso.fonteCabecalho || 'helvetica')}`;
        ctx.textAlign = 'center';
        ctx.fillText(cfg.verso.localData, pw / 2, ldVY);
    }
}

function fmtCanvasFamily(fonte) {
    const map = {
        'courier': 'Courier New, monospace',
        'helvetica': 'Helvetica, sans-serif',
        'times': 'Times New Roman, serif',
        'arial': 'Arial, sans-serif',
        'georgia': 'Georgia, serif',
        'verdana': 'Verdana, sans-serif',
        'tahoma': 'Tahoma, sans-serif',
        'trebuchet': 'Trebuchet MS, sans-serif',
        'palatino': 'Palatino Linotype, Palatino, serif',
        'garamond': 'Garamond, serif',
        'cambria': 'Cambria, serif',
        'calibri': 'Calibri, sans-serif'
    };
    return map[fonte] || 'serif';
}

function fmtPdfFamily(fonte) {
    const serif = ['times', 'georgia', 'palatino', 'garamond', 'cambria'];
    const mono = ['courier'];
    if (serif.includes(fonte)) return 'times';
    if (mono.includes(fonte)) return 'courier';
    return 'helvetica';
}

function fmtCanvasStyle(estilo) {
    if (estilo === 'bolditalic') return 'bold italic';
    return estilo; // bold, italic, normal
}

function fmtTransformText(text, transform) {
    if (transform === 'uppercase') return text.toUpperCase();
    if (transform === 'capitalize') return text.replace(/\b\w/g, c => c.toUpperCase());
    return text;
}

function wrapText(ctx, text, x, y, maxWidth, lineHeight, alinhamento) {
    const words = text.split(' ');
    let lines = [];
    let line = '';
    for (let n = 0; n < words.length; n++) {
        const testLine = line + words[n] + ' ';
        const metrics = ctx.measureText(testLine);
        if (metrics.width > maxWidth && n > 0) {
            lines.push(line.trim());
            line = words[n] + ' ';
        } else {
            line = testLine;
        }
    }
    lines.push(line.trim());

    const align = alinhamento || 'left';
    for (let i = 0; i < lines.length; i++) {
        const l = lines[i];
        if (align === 'center') {
            ctx.fillText(l, x + maxWidth / 2 - ctx.measureText(l).width / 2, y);
        } else if (align === 'right') {
            ctx.fillText(l, x + maxWidth - ctx.measureText(l).width, y);
        } else if (align === 'justify' && i < lines.length - 1) {
            const palavras = l.split(' ');
            if (palavras.length <= 1) {
                ctx.fillText(l, x, y);
            } else {
                let largPalavras = 0;
                palavras.forEach(p => largPalavras += ctx.measureText(p).width);
                const espExtra = (maxWidth - largPalavras) / (palavras.length - 1);
                let xP = x;
                palavras.forEach(p => {
                    ctx.fillText(p, xP, y);
                    xP += ctx.measureText(p).width + espExtra;
                });
                y += lineHeight;
                continue;
            }
        } else {
            ctx.fillText(l, x, y);
        }
        y += lineHeight;
    }
}

async function alternarPreviewLado() {
    if (_editMode) {
        const wrapper = document.getElementById('previewCanvasWrapper');
        if (wrapper) wrapper.querySelectorAll('.edit-overlay').forEach(el => {
            const inputEl = el.querySelector('input, textarea');
            const src = document.getElementById(el.dataset.inputId);
            if (src && inputEl) src.value = inputEl.value;
            if (el._cleanup) el._cleanup();
            el.remove();
        });
    }
    previewLado = previewLado === 'frente' ? 'verso' : 'frente';
    await atualizarPreviewCert();
    if (_editMode) _criarOverlaysEditaveis();
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
function obterModelosLocais() {
    try { return JSON.parse(localStorage.getItem('modelosLocais')) || {}; } catch(e) { return {}; }
}

function salvarModelosLocais(modelos) {
    localStorage.setItem('modelosLocais', JSON.stringify(modelos));
}

function salvarModeloLocal() {
    const nome = prompt('Nome do modelo local:');
    if (!nome || !nome.trim()) return;
    const chave = 'local_' + Date.now();
    const config = obterConfigCert();
    const modelos = obterModelosLocais();
    modelos[chave] = {
        nome: nome.trim(),
        config: config,
        uploads: JSON.parse(JSON.stringify(CERT_UPLOADS)),
        cor1: config.cores.principal || '#1e3a8a',
        cor2: config.cores.secundaria || '#3b82f6',
        criadoEm: new Date().toISOString()
    };
    salvarModelosLocais(modelos);
    renderizarTemplatesGrid();
    mostrarNotificacao(`Modelo local "${nome.trim()}" salvo!`, 'success');
}

function carregarModeloLocal(chave) {
    const modelos = obterModelosLocais();
    const m = modelos[chave];
    if (!m) return;
    CERT_CONFIG = m.config;
    CERT_UPLOADS = m.uploads || {};
    localStorage.setItem('certConfig', JSON.stringify(CERT_CONFIG));
    localStorage.setItem('certUploads', JSON.stringify(CERT_UPLOADS));
    aplicarConfigNosInputs(CERT_CONFIG);
    atualizarPreviewCert();
    mostrarNotificacao(`Modelo "${m.nome}" carregado!`, 'success');
}

function excluirModeloLocal(chave) {
    const modelos = obterModelosLocais();
    const nome = modelos[chave]?.nome || chave;
    if (!confirm(`Excluir o modelo local "${nome}"?`)) return;
    delete modelos[chave];
    salvarModelosLocais(modelos);
    renderizarTemplatesGrid();
    mostrarNotificacao('Modelo local excluído.', 'success');
}

function renderizarTemplatesGrid() {
    const grid = document.getElementById('templatesGrid');
    if (!grid) return;
    // Templates predefinidos
    let html = Object.keys(TEMPLATES).map(key => `
        <div class="template-card ${key === APP_STATE.templateSelecionado ? 'selected' : ''}" 
             onclick="selecionarTemplate('${key}')">
            <div class="template-preview" style="background: linear-gradient(135deg, ${TEMPLATES[key].cor1}, ${TEMPLATES[key].cor2})">
                📜
            </div>
            <div class="template-name">${TEMPLATES[key].nome}</div>
        </div>
    `).join('');
    // Templates locais salvos
    const locais = obterModelosLocais();
    const chaves = Object.keys(locais);
    if (chaves.length) {
        html += chaves.map(k => {
            const m = locais[k];
            return `
            <div class="template-card" style="border: 2px solid #059669; position: relative;">
                <div class="template-preview" style="background: linear-gradient(135deg, ${m.cor1 || '#1e3a8a'}, ${m.cor2 || '#3b82f6'}); cursor: pointer;" onclick="carregarModeloLocal('${k}')">
                    💾
                </div>
                <div class="template-name" style="color: #059669; font-weight: 600;">${escapeHtml(m.nome)}</div>
                <div style="display: flex; gap: 4px; justify-content: center; margin-top: 4px;">
                    <button class="btn btn-primary btn-sm" onclick="event.stopPropagation(); carregarModeloLocal('${k}')" style="font-size: 10px; padding: 2px 6px;">Carregar</button>
                    <button class="btn btn-danger btn-sm" onclick="event.stopPropagation(); excluirModeloLocal('${k}')" style="font-size: 10px; padding: 2px 6px;">Excluir</button>
                </div>
            </div>`;
        }).join('');
    }
    grid.innerHTML = html;
}

function inicializarTemplates() {
    renderizarTemplatesGrid();

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
    if (CERT_UPLOADS.bordaCompleta) {
        const prev = document.getElementById('previewBordaCompleta');
        const btn = document.getElementById('btnRemoverBordaCompleta');
        if (prev) prev.innerHTML = `<img src="${CERT_UPLOADS.bordaCompleta}" style="max-height: 80px; border-radius: 8px;">`;
        if (btn) btn.style.display = 'inline-block';
    }

    // Gerar preview inicial
    setTimeout(() => atualizarPreviewCert(), 200);

    // Carregar modelos da nuvem
    const token = localStorage.getItem('token');
    if (token) {
        carregarModelosSalvos();
        atualizarInfoModeloAtual();
    }
    // Restaurar estado do auto-salvar
    const chk = document.getElementById('chkAutoSalvar');
    if (chk) chk.checked = APP_STATE.autoSalvar;
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
        // Sempre ler config fresca dos inputs para capturar alterações
        CERT_CONFIG = obterConfigCert();
        const cfg = CERT_CONFIG;
        const orientacao = cfg.margens.orientacao || 'landscape';
        
        // Criar PDF em formato A4
        const pdf = new jsPDF({
            orientation: orientacao,
            unit: 'mm',
            format: 'a4'
        });

        // Pré-gerar borda vertical consistente (rotacionando a horizontal) para espessura uniforme
        if (!CERT_UPLOADS.bordaVertical && !CERT_UPLOADS._bordaVFromH) {
            const bordaH = CERT_UPLOADS.bordaHorizontal || (typeof BORDA_HORIZONTAL !== 'undefined' ? BORDA_HORIZONTAL : null);
            if (bordaH) {
                CERT_UPLOADS._bordaVFromH = await _rotateImageForBorder(bordaH);
            }
        }

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
    const corCab = hexParaRgb(cfg.cores.cabecalho || cfg.cores.principal);
    const corTit = hexParaRgb(cfg.frente.corTitulo || cfg.cores.titulo || cfg.cores.principal);
    const corT = hexParaRgb(cfg.frente.corCorpo || cfg.cores.texto);
    const corA = hexParaRgb(cfg.cores.assinatura);
    const corB = hexParaRgb(cfg.cores.borda || cfg.cores.principal);
    const corRod = hexParaRgb(cfg.cores.rodape || '#646464');
    const corF = hexParaRgb(cfg.cores.fundo);
    
    // Fundo
    pdf.setFillColor(corF.r, corF.g, corF.b);
    pdf.rect(0, 0, pageWidth, pageHeight, 'F');

    // Fundo personalizado
    if (CERT_UPLOADS.fundoFrente) {
        try {
            const fi = cfg.fundoImg || {};
            const largPct = (fi.frenteLargura || 100) / 100;
            const altPct = (fi.frenteAltura || 100) / 100;
            const imgW = pageWidth * largPct;
            const imgH = pageHeight * altPct;
            const imgX = (pageWidth - imgW) / 2;
            const imgY = (pageHeight - imgH) / 2;
            pdf.addImage(CERT_UPLOADS.fundoFrente, detectarFormatoImagem(CERT_UPLOADS.fundoFrente), imgX, imgY, imgW, imgH);
            // Overlay escurecer/clarear
            const mode = fi.frenteMode || 'clarear';
            const opac = (fi.frenteOpacidade || 50) / 100;
            if (mode !== 'nenhum' && opac > 0) {
                if (mode === 'escurecer') {
                    pdf.setFillColor(0, 0, 0);
                } else {
                    pdf.setFillColor(255, 255, 255);
                }
                pdf.setGState(new pdf.GState({ opacity: opac }));
                pdf.rect(0, 0, pageWidth, pageHeight, 'F');
                pdf.setGState(new pdf.GState({ opacity: 1 }));
            }
        } catch(e) { console.error('Erro fundo frente:', e); }
    }
    
    // Bordas decorativas
    if (cfg.margens.bordaExibir === 'sim' && bordaEspessura > 0) {
        // Borda completa tem prioridade
        if (CERT_UPLOADS.bordaCompleta) {
            try {
                pdf.addImage(CERT_UPLOADS.bordaCompleta, detectarFormatoImagem(CERT_UPLOADS.bordaCompleta), 0, 0, pageWidth, pageHeight);
            } catch(e) { console.error('Erro borda completa:', e); }
        } else {
            const bordaV = CERT_UPLOADS.bordaVertical || CERT_UPLOADS._bordaVFromH || (typeof BORDA_VERTICAL !== 'undefined' ? BORDA_VERTICAL : null);
            const bordaH = CERT_UPLOADS.bordaHorizontal || (typeof BORDA_HORIZONTAL !== 'undefined' ? BORDA_HORIZONTAL : null);
        
            if (bordaV) {
                try {
                    const fmtV = detectarFormatoImagem(bordaV);
                    pdf.addImage(bordaV, fmtV, 0, 0, bordaEspessura, pageHeight);
                    pdf.addImage(bordaV, fmtV, pageWidth - bordaEspessura, 0, bordaEspessura, pageHeight);
                } catch(e) { console.error('Erro borda vertical:', e); }
            }
            if (bordaH) {
                try {
                    const fmtH = detectarFormatoImagem(bordaH);
                    pdf.addImage(bordaH, fmtH, 0, 0, pageWidth, bordaEspessura);
                    pdf.addImage(bordaH, fmtH, 0, pageHeight - bordaEspessura, pageWidth, bordaEspessura);
                } catch(e) { console.error('Erro borda horizontal:', e); }
            }
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
                const tmpImg = new Image();
                tmpImg.src = imgEmblema;
                const fmt = detectarFormatoImagem(imgEmblema);
                pdf.addImage(imgEmblema, fmt, brasaoX - brasaoLargura / 2, brasaoY - brasaoAltura / 2, brasaoLargura, brasaoAltura);
            } catch(e) { console.error('Erro ao adicionar emblema:', e); }
        }
    }
    
    // Cabeçalho
    const fontTamCab = cfg.cabecalho.fonteTam;
    const fmt = cfg.formatacao || {};
    const aj = cfg.ajustesPosicao || {};
    pdf.setTextColor(corCab.r, corCab.g, corCab.b);
    pdf.setFont(fmtPdfFamily(fmt.fonteCabecalho || 'helvetica'), fmt.estiloCabecalho || 'bold');
    pdf.setFontSize(fontTamCab);
    
    let yBase = cfg.emblema.posY + cfg.emblema.altura / 2 + 6;
    pdf.text(fmtTransformText(cfg.cabecalho.linha1, fmt.transformCabecalho || 'uppercase'), pageWidth / 2, yBase + (aj.certCabecalhoLinha1 || 0), { align: 'center' });
    yBase += fontTamCab * 0.45;
    pdf.text(fmtTransformText(cfg.cabecalho.linha2, fmt.transformCabecalho || 'uppercase'), pageWidth / 2, yBase + (aj.certCabecalhoLinha2 || 0), { align: 'center' });
    yBase += fontTamCab * 0.45;
    pdf.text(fmtTransformText(cfg.cabecalho.linha3, fmt.transformCabecalho || 'uppercase'), pageWidth / 2, yBase + (aj.certCabecalhoLinha3 || 0), { align: 'center' });
    
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
    pdf.setFont(fmtPdfFamily(fmt.fonteTitulo || 'times'), fmt.estiloTitulo || 'bolditalic');
    pdf.setFontSize(cfg.frente.tituloTam);
    pdf.setTextColor(corTit.r, corTit.g, corTit.b);
    pdf.text(fmtTransformText(cfg.frente.titulo, fmt.transformTitulo || 'uppercase'), pageWidth / 2, yBase + (aj.certTitulo || 0), { align: 'center' });
    
    // Corpo do texto
    yBase += 17 + (aj.certCorpoTexto || 0);
    const fonteCorpo = fmtPdfFamily(cfg.frente.fonte || 'times');
    pdf.setFont(fonteCorpo, fmt.estiloCorpo || 'italic');
    pdf.setFontSize(cfg.frente.fonteTam);
    pdf.setTextColor(corT.r, corT.g, corT.b);
    
    const margemEsq = cfg.margens.esq;
    const margemDir = pageWidth - cfg.margens.dir;
    const larguraTexto = margemDir - margemEsq;
    const espacamentoLinha = fmt.espacoLinha || 8;
    
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
    
    // Renderizar texto com alinhamento configurável
    const alinhamento = cfg.frente.alinhamento || 'justify';
    let posX = margemEsq;
    let linhaAtual = [];
    let yPos = yBase;

    // Função auxiliar para renderizar uma linha com o alinhamento escolhido
    const estiloCorpoBase = fmt.estiloCorpo || 'italic';
    const estiloCorpoNeg = estiloCorpoBase === 'italic' ? 'bolditalic' : estiloCorpoBase === 'normal' ? 'bold' : estiloCorpoBase === 'bold' ? 'bold' : 'bolditalic';
    function renderizarLinha(linha, ultimaLinha) {
        let larguraUsada = 0;
        linha.forEach(p => {
            pdf.setFont(fonteCorpo, p.negrito ? estiloCorpoNeg : estiloCorpoBase);
            larguraUsada += pdf.getTextWidth(p.palavra);
        });
        const espacoPadrao = pdf.getTextWidth(' ');
        const larguraComEspacos = larguraUsada + (linha.length - 1) * espacoPadrao;

        let xAtual;
        if (alinhamento === 'justify' && !ultimaLinha && linha.length > 1) {
            const espacoExtra = (larguraTexto - larguraUsada) / (linha.length - 1);
            xAtual = margemEsq;
            linha.forEach(p => {
                pdf.setFont(fonteCorpo, p.negrito ? estiloCorpoNeg : estiloCorpoBase);
                pdf.text(p.palavra, xAtual, yPos);
                xAtual += pdf.getTextWidth(p.palavra) + espacoExtra;
            });
        } else if (alinhamento === 'center') {
            xAtual = margemEsq + (larguraTexto - larguraComEspacos) / 2;
            linha.forEach(p => {
                pdf.setFont(fonteCorpo, p.negrito ? estiloCorpoNeg : estiloCorpoBase);
                pdf.text(p.palavra, xAtual, yPos);
                xAtual += pdf.getTextWidth(p.palavra) + espacoPadrao;
            });
        } else if (alinhamento === 'right') {
            xAtual = margemDir - larguraComEspacos;
            linha.forEach(p => {
                pdf.setFont(fonteCorpo, p.negrito ? estiloCorpoNeg : estiloCorpoBase);
                pdf.text(p.palavra, xAtual, yPos);
                xAtual += pdf.getTextWidth(p.palavra) + espacoPadrao;
            });
        } else {
            // left ou última linha do justify
            xAtual = margemEsq;
            linha.forEach(p => {
                pdf.setFont(fonteCorpo, p.negrito ? estiloCorpoNeg : estiloCorpoBase);
                pdf.text(p.palavra, xAtual, yPos);
                xAtual += pdf.getTextWidth(p.palavra) + espacoPadrao;
            });
        }
    }
    
    for (let i = 0; i < palavrasFormatadas.length; i++) {
        const item = palavrasFormatadas[i];
        pdf.setFont(fonteCorpo, item.negrito ? estiloCorpoNeg : estiloCorpoBase);
        const larguraPalavra = pdf.getTextWidth(item.palavra + ' ');
        
        if (posX + larguraPalavra > margemDir && linhaAtual.length > 0) {
            renderizarLinha(linhaAtual, false);
            yPos += espacamentoLinha;
            posX = margemEsq;
            linhaAtual = [];
        }
        
        linhaAtual.push(item);
        posX += larguraPalavra;
    }
    
    // Última linha
    if (linhaAtual.length > 0) {
        renderizarLinha(linhaAtual, true);
    }
    
    // Local e Data (frente) - campo manual
    if (cfg.frente.localData) {
        yPos += 10;
        yPos += aj.certLocalData || 0;
        pdf.setFont('times', 'bold');
        pdf.setTextColor(corTit.r, corTit.g, corTit.b);
        pdf.text(cfg.frente.localData, pageWidth / 2, yPos, { align: 'center' });
    }

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
    if (aluno.cidadeConfeccao) {
        dataFormatada = `${aluno.cidadeConfeccao}, ${dataFormatada}`;
    }
    pdf.setFont('times', 'bold');
    pdf.setTextColor(corTit.r, corTit.g, corTit.b);
    pdf.text(dataFormatada, pageWidth / 2, yPos, { align: 'center' });
    
    // Linhas de assinatura
    yPos += 15;
    pdf.setLineWidth(0.5);
    pdf.setDrawColor(corA.r, corA.g, corA.b);
    const a1dyP = aj.certAssinatura1 || 0;
    pdf.line(25, yPos + a1dyP, 130, yPos + a1dyP);
    const a2dyP = aj.certAssinatura2 || 0;
    pdf.line(167, yPos + a2dyP, 272, yPos + a2dyP);
    
    pdf.setFont(fmtPdfFamily(fmt.fonteAssinatura || 'helvetica'), 'normal');
    pdf.setFontSize(9);
    pdf.setTextColor(corA.r, corA.g, corA.b);
    pdf.text(cfg.frente.assinatura1, 77.5, yPos + 5 + a1dyP, { align: 'center' });
    pdf.text(cfg.frente.assinatura2, 219.5, yPos + 5 + a2dyP, { align: 'center' });
    
    // Linha para terceira assinatura
    const a3dyP = aj.certAssinatura3 || 0;
    yPos += 15;
    pdf.line(100, yPos + a3dyP, 197, yPos + a3dyP);
    pdf.text(cfg.frente.assinatura3, 148.5, yPos + 5 + a3dyP, { align: 'center' });

    // Rodapé
    if (cfg.rodape.exibir === 'sim' && (cfg.rodape.linha1 || cfg.rodape.linha2)) {
        pdf.setFont(fmtPdfFamily(cfg.rodape.fonte || 'helvetica'), 'normal');
        pdf.setFontSize(cfg.rodape.fonteTam);
        pdf.setTextColor(corRod.r, corRod.g, corRod.b);
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
    const corCab = hexParaRgb(cfg.cores.cabecalho || cfg.cores.principal);
    const corTit = hexParaRgb(cfg.verso.corTitulo || cfg.cores.titulo || cfg.cores.principal);
    const corT = hexParaRgb(cfg.verso.corTexto || cfg.cores.texto);
    const corB = hexParaRgb(cfg.cores.borda || cfg.cores.principal);
    const corF = hexParaRgb(cfg.cores.fundo);
    
    // Fundo
    pdf.setFillColor(corF.r, corF.g, corF.b);
    pdf.rect(0, 0, pageWidth, pageHeight, 'F');

    // Fundo personalizado
    if (CERT_UPLOADS.fundoVerso) {
        try {
            const fi = cfg.fundoImg || {};
            const largPct = (fi.versoLargura || 100) / 100;
            const altPct = (fi.versoAltura || 100) / 100;
            const imgW = pageWidth * largPct;
            const imgH = pageHeight * altPct;
            const imgX = (pageWidth - imgW) / 2;
            const imgY = (pageHeight - imgH) / 2;
            pdf.addImage(CERT_UPLOADS.fundoVerso, detectarFormatoImagem(CERT_UPLOADS.fundoVerso), imgX, imgY, imgW, imgH);
            // Overlay escurecer/clarear
            const mode = fi.versoMode || 'clarear';
            const opac = (fi.versoOpacidade || 50) / 100;
            if (mode !== 'nenhum' && opac > 0) {
                if (mode === 'escurecer') {
                    pdf.setFillColor(0, 0, 0);
                } else {
                    pdf.setFillColor(255, 255, 255);
                }
                pdf.setGState(new pdf.GState({ opacity: opac }));
                pdf.rect(0, 0, pageWidth, pageHeight, 'F');
                pdf.setGState(new pdf.GState({ opacity: 1 }));
            }
        } catch(e) { console.error('Erro fundo verso:', e); }
    }
    
    // Bordas
    if (cfg.verso.bordas === 'sim' && cfg.margens.bordaExibir === 'sim' && bordaEspessura > 0) {
        if (CERT_UPLOADS.bordaCompleta) {
            try {
                pdf.addImage(CERT_UPLOADS.bordaCompleta, detectarFormatoImagem(CERT_UPLOADS.bordaCompleta), 0, 0, pageWidth, pageHeight);
            } catch(e) { console.error('Erro borda completa verso:', e); }
        } else {
            const bordaV = CERT_UPLOADS.bordaVertical || CERT_UPLOADS._bordaVFromH || (typeof BORDA_VERTICAL !== 'undefined' ? BORDA_VERTICAL : null);
            const bordaH = CERT_UPLOADS.bordaHorizontal || (typeof BORDA_HORIZONTAL !== 'undefined' ? BORDA_HORIZONTAL : null);
        
            if (bordaV) {
                try {
                    const fmtV = detectarFormatoImagem(bordaV);
                    pdf.addImage(bordaV, fmtV, 0, 0, bordaEspessura, pageHeight);
                    pdf.addImage(bordaV, fmtV, pageWidth - bordaEspessura, 0, bordaEspessura, pageHeight);
                } catch(e) { console.error('Erro borda vertical verso:', e); }
            }
            if (bordaH) {
                try {
                    const fmtH = detectarFormatoImagem(bordaH);
                    pdf.addImage(bordaH, fmtH, 0, 0, pageWidth, bordaEspessura);
                    pdf.addImage(bordaH, fmtH, 0, pageHeight - bordaEspessura, pageWidth, bordaEspessura);
                } catch(e) { console.error('Erro borda horizontal verso:', e); }
            }
        }
    }
    
    // Cabeçalho do verso
    pdf.setTextColor(corCab.r, corCab.g, corCab.b);
    const versoCabFonte = fmtPdfFamily(cfg.verso.fonteCabecalho || 'helvetica');
    const versoCabTam = cfg.verso.fonteCabecalhoTam || 7;
    pdf.setFont(versoCabFonte, 'normal');
    pdf.setFontSize(versoCabTam);
    
    let yPos = 25;
    let posX = 15;
    
    pdf.text('ESTABELECIMENTO DE ENSINO:', posX, yPos);
    pdf.setFont(versoCabFonte, 'bold');
    posX += pdf.getTextWidth('ESTABELECIMENTO DE ENSINO: ');
    pdf.text(cfg.cabecalho.nomeInstituicao.toUpperCase(), posX, yPos);
    
    pdf.setFont(versoCabFonte, 'normal');
    posX = 195;
    pdf.text('MUNICÍPIO:', posX, yPos);
    pdf.setFont(versoCabFonte, 'bold');
    posX += pdf.getTextWidth('MUNICÍPIO: ');
    pdf.text(cfg.verso.municipio, posX, yPos);
    
    pdf.setFont(versoCabFonte, 'normal');
    posX = 250;
    pdf.text('UF:', posX, yPos);
    pdf.setFont(versoCabFonte, 'bold');
    posX += pdf.getTextWidth('UF: ');
    pdf.text(cfg.verso.uf, posX, yPos);
    
    // Linha 2
    yPos += 5;
    posX = 15;
    pdf.setFont(versoCabFonte, 'normal');
    pdf.text('ESTUDANTE:', posX, yPos);
    pdf.setFont(versoCabFonte, 'bold');
    posX += pdf.getTextWidth('ESTUDANTE: ');
    pdf.text(String(aluno.nome || '').toUpperCase(), posX, yPos);
    
    pdf.setFont(versoCabFonte, 'normal');
    posX = 150;
    pdf.text('RG:', posX, yPos);
    pdf.setFont(versoCabFonte, 'bold');
    posX += pdf.getTextWidth('RG: ');
    pdf.text(String(aluno.rg || ''), posX, yPos);
    
    pdf.setFont(versoCabFonte, 'normal');
    posX = 190;
    pdf.text('ÓRGÃO EMISSOR:', posX, yPos);
    pdf.setFont(versoCabFonte, 'bold');
    posX += pdf.getTextWidth('ÓRGÃO EMISSOR: ');
    pdf.text(String(aluno.orgaoEmissor || ''), posX, yPos);
    
    pdf.setFont(versoCabFonte, 'normal');
    posX = 240;
    pdf.text('CPF:', posX, yPos);
    pdf.setFont(versoCabFonte, 'bold');
    posX += pdf.getTextWidth('CPF: ');
    pdf.text(String(aluno.cpf || ''), posX, yPos);
    
    // Linha 3
    yPos += 5;
    posX = 15;
    pdf.setFont(versoCabFonte, 'normal');
    pdf.text('DATA DE NASCIMENTO:', posX, yPos);
    pdf.setFont(versoCabFonte, 'bold');
    posX += pdf.getTextWidth('DATA DE NASCIMENTO: ');
    pdf.text(String(aluno.diaNascimento).padStart(2, '0'), posX, yPos);
    
    pdf.setFont(versoCabFonte, 'normal');
    posX += pdf.getTextWidth(String(aluno.diaNascimento).padStart(2, '0')) + 1;
    pdf.text('DE', posX, yPos);
    
    pdf.setFont(versoCabFonte, 'bold');
    posX += pdf.getTextWidth('DE ');
    pdf.text(String(aluno.mesNascimento || ''), posX, yPos);
    
    pdf.setFont(versoCabFonte, 'normal');
    posX += pdf.getTextWidth(aluno.mesNascimento) + 1;
    pdf.text('DE', posX, yPos);
    
    pdf.setFont(versoCabFonte, 'bold');
    posX += pdf.getTextWidth('DE ');
    pdf.text(String(aluno.anoNascimento || ''), posX, yPos);
    
    pdf.setFont(versoCabFonte, 'normal');
    posX = 115;
    pdf.text('NATURALIDADE:', posX, yPos);
    pdf.setFont(versoCabFonte, 'bold');
    posX += pdf.getTextWidth('NATURALIDADE: ');
    pdf.text(String(aluno.cidadeNascimento || ''), posX, yPos);
    
    pdf.setFont(versoCabFonte, 'normal');
    posX += pdf.getTextWidth(aluno.cidadeNascimento) + 1;
    pdf.text('-', posX, yPos);
    
    pdf.setFont(versoCabFonte, 'bold');
    posX += pdf.getTextWidth('- ');
    pdf.text(String(aluno.estadoNascimento || ''), posX, yPos);
    
    pdf.setFont(versoCabFonte, 'normal');
    posX = 210;
    pdf.text('NACIONALIDADE:', posX, yPos);
    pdf.setFont(versoCabFonte, 'bold');
    posX += pdf.getTextWidth('NACIONALIDADE: ');
    pdf.text(String(aluno.nacionalidade || '').toUpperCase(), posX, yPos);
    
    // Filiação
    yPos += 5;
    posX = 15;
    pdf.setFont(versoCabFonte, 'normal');
    pdf.text('FILIAÇÃO: MÃE:', posX, yPos);
    pdf.setFont(versoCabFonte, 'bold');
    posX += pdf.getTextWidth('FILIAÇÃO: MÃE: ');
    pdf.text(String(aluno.nomeMae || ''), posX, yPos);
    
    yPos += 5;
    posX = 15;
    pdf.setFont(versoCabFonte, 'normal');
    pdf.text('PAI:', posX, yPos);
    pdf.setFont(versoCabFonte, 'bold');
    posX += pdf.getTextWidth('PAI: ');
    pdf.text(String(aluno.nomePai || ''), posX, yPos);
    
    // Título
    yPos += 10;
    const aj = cfg.ajustesPosicao || {};
    const versoTituloFonte = cfg.verso.fonteTitulo || 'times';
    const versoTituloTam = cfg.verso.fonteTituloTam || 13;
    const versoTituloEstilo = cfg.verso.estiloTitulo || 'bolditalic';
    const versoTituloAlign = cfg.verso.alinhamentoTitulo || 'center';
    pdf.setFont(fmtPdfFamily(versoTituloFonte), versoTituloEstilo);
    pdf.setFontSize(versoTituloTam);
    pdf.setTextColor(corTit.r, corTit.g, corTit.b);
    const tituloX = versoTituloAlign === 'center' ? pageWidth / 2 : (versoTituloAlign === 'right' ? pageWidth - 15 : 15);
    pdf.text(fmtTransformText(cfg.verso.titulo, 'uppercase'), tituloX, yPos + (aj.certVersoTitulo || 0), { align: versoTituloAlign });
    
    // Tabela
    yPos += 8;
    pdf.setDrawColor(corB.r, corB.g, corB.b);
    pdf.setLineWidth(0.5);
    pdf.setTextColor(corT.r, corT.g, corT.b);
    
    const tabelaAltura = pageHeight - yPos - 15;
    const colunaEsqLargura = 170;
    const colunaDirLargura = pageWidth - 30 - colunaEsqLargura;
    
    pdf.rect(15, yPos, colunaEsqLargura, tabelaAltura);
    
    if (cfg.verso.observacoes === 'sim') {
        const obsY = yPos;
        const obsX = 15 + colunaEsqLargura;
        
        // Retângulo externo completo (mesma altura da tabela principal)
        pdf.rect(obsX, obsY, colunaDirLargura, tabelaAltura);
        
        // Cabeçalho com fundo amarelo
        pdf.setFillColor(255, 255, 200);
        pdf.rect(obsX, obsY, colunaDirLargura, 10, 'FD');
        
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(9);
        pdf.setTextColor(corT.r, corT.g, corT.b);
        pdf.text('OBSERVAÇÕES', obsX + (colunaDirLargura / 2), obsY + 7, { align: 'center' });
        
        // Linhas horizontais internas
        const linhaAltura = 13;
        const numLinhas = Math.floor((tabelaAltura - 10) / linhaAltura);
        
        for(let i = 1; i < numLinhas; i++) {
            const ly = obsY + 10 + (i * linhaAltura);
            pdf.line(obsX, ly, obsX + colunaDirLargura, ly);
        }
        
        // Texto de observações na primeira linha
        if (aluno.observacoes) {
            pdf.setFont('helvetica', 'normal');
            pdf.setFontSize(8);
            pdf.text(aluno.observacoes, obsX + 3, obsY + 18, { maxWidth: colunaDirLargura - 6 });
        }
    }

    // Local e Data (verso)
    if (cfg.verso.localData) {
        const ldVY = pageHeight - 8 + (aj.certVersoLocalData || 0);
        pdf.setFont('times', 'bold');
        pdf.setFontSize(9);
        pdf.setTextColor(corT.r, corT.g, corT.b);
        pdf.text(cfg.verso.localData, pageWidth / 2, ldVY, { align: 'center' });
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
        const response = await fetch(`${API_URL}/auth/me`, {
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

// ==================== GERENCIAR SUB-USUÁRIOS ====================
async function carregarSubUsuarios() {
    const token = localStorage.getItem('token');
    const container = document.getElementById('listaSubUsuarios');
    if (!container) return;

    try {
        const res = await fetch(`${API_URL}/subusuarios`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.mensagem || 'Erro ao carregar usuários');

        if (!data.subUsuarios || data.subUsuarios.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 40px; color: #9ca3af;">
                    <p style="font-size: 48px; margin-bottom: 10px;">👥</p>
                    <p>Nenhum usuário cadastrado ainda.</p>
                    <p style="font-size: 13px;">Clique em "➕ Novo Usuário" para criar o primeiro.</p>
                </div>`;
            return;
        }

        const permNomes = {
            cadastrarAlunos: '📝 Cadastrar',
            editarAlunos: '✏️ Editar',
            excluirAlunos: '🗑️ Excluir',
            gerarCertificados: '📄 Certificados',
            editarModelos: '🎨 Modelos',
            verLogs: '📋 Logs'
        };

        container.innerHTML = data.subUsuarios.map(u => {
            const perms = Object.entries(u.permissoes || {})
                .filter(([, v]) => v)
                .map(([k]) => `<span class="badge-permissao">${permNomes[k] || k}</span>`)
                .join('');

            return `
            <div class="sub-usuario-card ${u.ativo ? '' : 'inativo'}">
                <div class="sub-usuario-info">
                    <h4>${u.nome} <span class="badge-ativo ${u.ativo ? 'ativo' : 'inativo'}">${u.ativo ? 'Ativo' : 'Bloqueado'}</span></h4>
                    <p>📧 ${u.email} · 💼 ${u.cargo || 'Funcionário'}</p>
                    <div style="margin-top: 6px;">${perms || '<span style="color:#9ca3af;font-size:12px;">Sem permissões</span>'}</div>
                    ${u.ultimoAcesso ? `<p style="font-size:11px;color:#94a3b8;margin-top:4px;">Último acesso: ${new Date(u.ultimoAcesso).toLocaleString('pt-BR')}</p>` : ''}
                </div>
                <div class="sub-usuario-acoes">
                    <button onclick="editarSubUsuario('${u._id}')" style="background:#eff6ff;color:#1d4ed8;" title="Editar">✏️ Editar</button>
                    <button onclick="resetarSenhaSubUsuario('${u._id}','${u.nome}')" style="background:#fef3c7;color:#92400e;" title="Resetar Senha">🔑 Senha</button>
                    <button onclick="toggleSubUsuario('${u._id}',${u.ativo},'${u.nome}')" style="background:${u.ativo ? '#fee2e2' : '#d1fae5'};color:${u.ativo ? '#991b1b' : '#065f46'};" title="${u.ativo ? 'Bloquear' : 'Desbloquear'}">
                        ${u.ativo ? '🚫 Bloquear' : '✅ Ativar'}
                    </button>
                    <button onclick="excluirSubUsuario('${u._id}','${u.nome}')" style="background:#fee2e2;color:#991b1b;" title="Excluir">🗑️</button>
                </div>
            </div>`;
        }).join('');
    } catch (err) {
        container.innerHTML = `<p style="color:#ef4444;text-align:center;">❌ ${err.message}</p>`;
    }
}

function abrirFormSubUsuario() {
    document.getElementById('formSubUsuario').style.display = 'block';
    document.getElementById('formSubUsuarioTitulo').textContent = '➕ Novo Usuário';
    document.getElementById('subUsuarioEditId').value = '';
    document.getElementById('subNome').value = '';
    document.getElementById('subEmail').value = '';
    document.getElementById('subCargo').value = 'Funcionário';
    document.getElementById('subSenha').value = '';
    atualizarLabelSenha(false);
    document.getElementById('permCadastrarAlunos').checked = true;
    document.getElementById('permEditarAlunos').checked = true;
    document.getElementById('permExcluirAlunos').checked = false;
    document.getElementById('permGerarCertificados').checked = true;
    document.getElementById('permEditarModelos').checked = false;
    document.getElementById('permVerLogs').checked = false;
}

function atualizarLabelSenha(isEdit) {
    const label = document.getElementById('labelSubSenha');
    const input = document.getElementById('subSenha');
    if (isEdit) {
        label.textContent = 'Nova Senha (deixe em branco para manter a atual)';
        input.placeholder = 'Deixe em branco para manter a senha atual';
    } else {
        label.textContent = 'Senha (deixe em branco para gerar automaticamente)';
        input.placeholder = 'Senha será gerada automaticamente';
    }
}

function fecharFormSubUsuario() {
    document.getElementById('formSubUsuario').style.display = 'none';
}

async function salvarSubUsuario() {
    const token = localStorage.getItem('token');
    const editId = document.getElementById('subUsuarioEditId').value;
    const nome = document.getElementById('subNome').value.trim();
    const email = document.getElementById('subEmail').value.trim();
    const cargo = document.getElementById('subCargo').value.trim();
    const senha = document.getElementById('subSenha').value.trim();

    if (!nome || !email) {
        alert('Nome e e-mail são obrigatórios.');
        return;
    }

    if (senha && senha.length < 6) {
        alert('A senha deve ter no mínimo 6 caracteres.');
        return;
    }

    const permissoes = {
        cadastrarAlunos: document.getElementById('permCadastrarAlunos').checked,
        editarAlunos: document.getElementById('permEditarAlunos').checked,
        excluirAlunos: document.getElementById('permExcluirAlunos').checked,
        gerarCertificados: document.getElementById('permGerarCertificados').checked,
        editarModelos: document.getElementById('permEditarModelos').checked,
        verLogs: document.getElementById('permVerLogs').checked
    };

    const body = { nome, email, cargo, permissoes };
    if (senha) body.senha = senha;

    try {
        const url = editId ? `${API_URL}/subusuarios/${editId}` : `${API_URL}/subusuarios`;
        const method = editId ? 'PUT' : 'POST';

        const res = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(body)
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.mensagem || 'Erro ao salvar');

        if (data.senhaGerada) {
            alert(`✅ Usuário criado com sucesso!\n\n📧 Email: ${email}\n🔑 Senha gerada: ${data.senhaGerada}\n\n⚠️ Anote esta senha, ela não será exibida novamente!`);
        } else if (editId && senha) {
            alert(`✅ Usuário atualizado e senha alterada com sucesso!`);
        } else {
            alert(`✅ Usuário ${editId ? 'atualizado' : 'criado'} com sucesso!`);
        }

        fecharFormSubUsuario();
        carregarSubUsuarios();
    } catch (err) {
        alert('❌ ' + err.message);
    }
}

async function editarSubUsuario(id) {
    const token = localStorage.getItem('token');
    try {
        const res = await fetch(`${API_URL}/subusuarios`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.mensagem);

        const usuario = data.subUsuarios.find(u => u._id === id);
        if (!usuario) { alert('Usuário não encontrado.'); return; }

        document.getElementById('formSubUsuario').style.display = 'block';
        document.getElementById('formSubUsuarioTitulo').textContent = '✏️ Editar Usuário';
        document.getElementById('subUsuarioEditId').value = id;
        document.getElementById('subNome').value = usuario.nome;
        document.getElementById('subEmail').value = usuario.email;
        document.getElementById('subCargo').value = usuario.cargo || 'Funcionário';
        document.getElementById('subSenha').value = '';
        atualizarLabelSenha(true);

        const p = usuario.permissoes || {};
        document.getElementById('permCadastrarAlunos').checked = !!p.cadastrarAlunos;
        document.getElementById('permEditarAlunos').checked = !!p.editarAlunos;
        document.getElementById('permExcluirAlunos').checked = !!p.excluirAlunos;
        document.getElementById('permGerarCertificados').checked = !!p.gerarCertificados;
        document.getElementById('permEditarModelos').checked = !!p.editarModelos;
        document.getElementById('permVerLogs').checked = !!p.verLogs;

        document.getElementById('formSubUsuario').scrollIntoView({ behavior: 'smooth' });
    } catch (err) {
        alert('❌ ' + err.message);
    }
}

async function toggleSubUsuario(id, atualmenteAtivo, nome) {
    const acao = atualmenteAtivo ? 'bloquear' : 'desbloquear';
    if (!confirm(`Deseja ${acao} o usuário "${nome}"?`)) return;

    const token = localStorage.getItem('token');
    try {
        const res = await fetch(`${API_URL}/subusuarios/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ ativo: !atualmenteAtivo })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.mensagem);
        alert(`✅ Usuário ${!atualmenteAtivo ? 'ativado' : 'bloqueado'} com sucesso!`);
        carregarSubUsuarios();
    } catch (err) {
        alert('❌ ' + err.message);
    }
}

async function resetarSenhaSubUsuario(id, nome) {
    if (!confirm(`Resetar a senha do usuário "${nome}"?\nUma nova senha será gerada.`)) return;

    const token = localStorage.getItem('token');
    try {
        const res = await fetch(`${API_URL}/subusuarios/${id}/resetar-senha`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({})
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.mensagem);
        alert(`✅ Senha resetada com sucesso!\n\n🔑 Nova senha: ${data.novaSenha}\n\n⚠️ Anote esta senha, ela não será exibida novamente!`);
    } catch (err) {
        alert('❌ ' + err.message);
    }
}

async function excluirSubUsuario(id, nome) {
    if (!confirm(`⚠️ Excluir permanentemente o usuário "${nome}"?\nEsta ação não pode ser desfeita.`)) return;

    const token = localStorage.getItem('token');
    try {
        const res = await fetch(`${API_URL}/subusuarios/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.mensagem);
        alert('✅ Usuário excluído com sucesso!');
        carregarSubUsuarios();
    } catch (err) {
        alert('❌ ' + err.message);
    }
}

async function carregarLogsEscola(pagina = 1) {
    const token = localStorage.getItem('token');
    const section = document.getElementById('logsEscolaSection');
    const conteudo = document.getElementById('logsEscolaConteudo');
    const paginacao = document.getElementById('logsPaginacao');
    section.style.display = 'block';
    conteudo.innerHTML = '<p style="color:#9ca3af;text-align:center;">Carregando logs...</p>';

    try {
        const res = await fetch(`${API_URL}/subusuarios/logs?pagina=${pagina}&limite=20`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.mensagem);

        if (!data.logs || data.logs.length === 0) {
            conteudo.innerHTML = '<p style="color:#9ca3af;text-align:center;">Nenhum log encontrado.</p>';
            paginacao.innerHTML = '';
            return;
        }

        conteudo.innerHTML = `
            <div style="background:#f8fafc;border-radius:8px;overflow:hidden;border:1px solid #e2e8f0;">
                <div class="log-row" style="background:#e2e8f0;font-weight:600;font-size:12px;text-transform:uppercase;color:#475569;">
                    <span>Data/Hora</span><span>Usuário</span><span>Ação</span><span>Nível</span>
                </div>
                ${data.logs.map(log => `
                    <div class="log-row">
                        <span>${new Date(log.criadoEm || log.createdAt).toLocaleString('pt-BR')}</span>
                        <span>${log.usuario?.nome || log.usuario?.email || 'Sistema'}</span>
                        <span>${log.acao || ''} ${log.descricao ? '— ' + log.descricao : ''}</span>
                        <span><span class="log-nivel ${log.nivel || 'INFO'}">${log.nivel || 'INFO'}</span></span>
                    </div>
                `).join('')}
            </div>`;

        const totalPaginas = data.totalPaginas || 1;
        if (totalPaginas > 1) {
            let btns = '';
            for (let i = 1; i <= totalPaginas; i++) {
                btns += `<button class="btn" onclick="carregarLogsEscola(${i})" style="padding:6px 14px;font-size:13px;background:${i === pagina ? '#3b82f6' : '#e2e8f0'};color:${i === pagina ? '#fff' : '#374151'};">${i}</button>`;
            }
            paginacao.innerHTML = btns;
        } else {
            paginacao.innerHTML = '';
        }

        section.scrollIntoView({ behavior: 'smooth' });
    } catch (err) {
        conteudo.innerHTML = `<p style="color:#ef4444;text-align:center;">❌ ${err.message}</p>`;
        paginacao.innerHTML = '';
    }
}

// Carregar dados da assinatura/usuários quando a aba for aberta
document.addEventListener('DOMContentLoaded', () => {
    const tabBtns = document.querySelectorAll('.tab-btn');
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            if (btn.dataset.tab === 'assinatura') {
                carregarDadosAssinatura();
            }
            if (btn.dataset.tab === 'usuarios') {
                carregarSubUsuarios();
            }
        });
    });
});



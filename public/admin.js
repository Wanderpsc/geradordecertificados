// Admin Panel JavaScript
const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:5000/api'
    : 'https://gerador-certificados.onrender.com/api';

// Verificar autenticação
async function verificarAuth() {
    const token = localStorage.getItem('token');
    
    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    try {
        const response = await fetch(`${API_URL}/auth/me`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Não autorizado');
        }

        const userData = await response.json();
        
        // Verificar se é administrador
        if (userData.usuario.role !== 'admin') {
            alert('Acesso negado! Esta área é restrita a administradores.');
            window.location.href = 'index.html';
            return;
        }

        // Exibir nome do admin
        document.getElementById('adminName').textContent = userData.usuario.nome;
        
        // Carregar página atual baseada no hash ou dashboard
        const hash = window.location.hash.replace('#', '') || 'dashboard';
        navegarPara(hash);
        
    } catch (error) {
        console.error('❌ Erro de autenticação:', error);
        localStorage.removeItem('token');
        window.location.href = 'login.html';
    }
}

// Logout
function logout() {
    if (confirm('Deseja realmente sair?')) {
        localStorage.removeItem('token');
        localStorage.removeItem('usuario');
        window.location.replace('login.html'); // replace evita loop no histórico
    }
}

// Configurar navegação entre páginas
function configurarNavegacao() {
    document.querySelectorAll('.nav-menu a').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const page = link.dataset.page;
            window.location.hash = page;
            navegarPara(page);
        });
    });
    
    // Listener para mudanças no hash
    window.addEventListener('hashchange', () => {
        const page = window.location.hash.replace('#', '') || 'dashboard';
        navegarPara(page);
    });
}

// Navegar para uma página específica
function navegarPara(page) {
    // Remover active de todos
    document.querySelectorAll('.nav-menu a').forEach(l => l.classList.remove('active'));
    const activeLink = document.querySelector(`.nav-menu a[data-page="${page}"]`);
    if (activeLink) activeLink.classList.add('active');
    
    // Esconder todas as páginas
    document.querySelectorAll('.page').forEach(p => {
        p.classList.add('hidden');
    });
    
    // Mostrar página selecionada
    const pageElement = document.getElementById(`page-${page}`);
    if (!pageElement) return;
    
    pageElement.classList.remove('hidden');
    
    // Carregar dados da página
    switch(page) {
        case 'dashboard': carregarDashboard(); break;
        case 'clientes': carregarClientes(); break;
        case 'licencas': carregarLicencas(); break;
        case 'pagamentos': carregarPagamentos(); break;
        case 'notas-fiscais': carregarNotasFiscais(); break;
        case 'financeiro': carregarFinanceiro(); break;
        case 'logs': carregarLogs(); break;
        case 'planos': carregarPlanos(); break;
    }
}

// Carregar Dashboard
async function carregarDashboard() {
    const token = localStorage.getItem('token');
    
    try {
        const response = await fetch(`${API_URL}/admin/dashboard`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Erro ao carregar dashboard');
        }

        const data = await response.json();
        const dashboard = data.dashboard || {};
        
        // Atualizar estatísticas
        document.getElementById('stat-clientes').textContent = dashboard.usuarios?.total || 0;
        document.getElementById('stat-novos-clientes').textContent = dashboard.usuarios?.novos || 0;
        document.getElementById('stat-licencas').textContent = dashboard.licencas?.ativas || 0;
        document.getElementById('stat-licencas-pagas').textContent = dashboard.licencas?.pagas || 0;
        document.getElementById('stat-receita').textContent = 
            formatarMoeda(dashboard.financeiro?.receitaMensal || 0);
        document.getElementById('stat-receita-anual').textContent = 
            formatarMoeda(dashboard.financeiro?.receitaAnual || 0).replace('R$ ', '');
        document.getElementById('stat-notas').textContent = dashboard.notasFiscais?.emitidas || 0;
        document.getElementById('stat-notas-mes').textContent = dashboard.notasFiscais?.esteMes || 0;

        // Carregar últimas atividades (logs)
        carregarUltimasAtividades();
        
    } catch (error) {
        console.error('❌ Erro ao carregar dashboard:', error);
        alert('Erro ao carregar dados do dashboard: ' + error.message);
    }
}

// Carregar últimas atividades
async function carregarUltimasAtividades() {
    const token = localStorage.getItem('token');
    
    try {
        const response = await fetch(`${API_URL}/admin/logs?limite=10`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Erro ao carregar logs');
        }

        const data = await response.json();
        const logs = data.logs || data || []; // Suporta diferentes formatos de resposta
        
        const tbody = document.getElementById('ultimas-atividades');
        
        if (!Array.isArray(logs) || logs.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align: center;">Nenhuma atividade recente</td></tr>';
            return;
        }

        tbody.innerHTML = logs.map(log => `
            <tr>
                <td>${formatarDataHora(log.createdAt)}</td>
                <td>${log.usuario?.nome || 'Sistema'}</td>
                <td><span class="badge badge-info">${log.acao}</span></td>
                <td>${log.descricao || '-'}</td>
                <td><span class="badge ${getBadgeNivel(log.nivel)}">${log.nivel}</span></td>
            </tr>
        `).join('');
        
    } catch (error) {
        console.error('Erro ao carregar atividades:', error);
        document.getElementById('ultimas-atividades').innerHTML = 
            '<tr><td colspan="5" style="text-align: center; color: #dc2626;">Erro ao carregar atividades</td></tr>';
    }
}

// Carregar Clientes
async function carregarClientes(busca = '') {
    
    const token = localStorage.getItem('token');
    
    try {
        let url = `${API_URL}/admin/clientes`;
        if (busca) {
            url += `?busca=${encodeURIComponent(busca)}`;
        }

        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Erro ao carregar clientes');
        }

        const data = await response.json();
        
        const clientes = data.clientes || []; // Mudou de 'usuarios' para 'clientes'
        
        const tbody = document.getElementById('lista-clientes');
        if (!tbody) {
            console.error('❌ Elemento lista-clientes não encontrado!');
            return;
        }
        
        if (clientes.length === 0) {
            
            tbody.innerHTML = '<tr><td colspan="7" style="text-align: center;">Nenhum cliente encontrado</td></tr>';
            return;
        }

        
        tbody.innerHTML = clientes.map(cliente => `
            <tr>
                <td><input type="checkbox" class="select-cliente" value="${cliente._id}" ${cliente.role === 'admin' ? 'disabled title="Admin não pode ser excluído"' : ''} onchange="atualizarContadorSelecionados()"></td>
                <td>${cliente.nome}</td>
                <td>${cliente.email}</td>
                <td>${cliente.instituicao || '-'}</td>
                <td><span class="badge ${getBadgeLicenca(cliente.licenca?.tipo)}">${cliente.licenca?.tipo || 'Nenhuma'}</span></td>
                <td><span class="badge ${cliente.ativo ? 'badge-success' : 'badge-danger'}">${cliente.ativo ? 'Ativo' : 'Inativo'}</span></td>
                <td>${formatarData(cliente.createdAt)}</td>
                <td class="action-btns">
                    <button class="btn btn-primary btn-sm" onclick="verDetalhesCliente('${cliente._id}')">Ver</button>
                    <button class="btn btn-warning btn-sm" onclick="resetarSenhaCliente('${cliente._id}', '${cliente.email}')">🔑</button>
                    <button class="btn btn-sm ${cliente.ativo ? 'badge-danger' : 'badge-success'}" 
                            onclick="toggleStatusCliente('${cliente._id}', ${!cliente.ativo})">
                        ${cliente.ativo ? 'Desativar' : 'Ativar'}
                    </button>
                    ${cliente.role !== 'admin' ? `<button class="btn btn-sm" style="background:#dc2626;color:white;" onclick="excluirCliente('${cliente._id}', '${cliente.email}')">🗑️</button>` : ''}
                </td>
            </tr>
        `).join('');
        
    } catch (error) {
        console.error('Erro ao carregar clientes:', error);
        document.getElementById('lista-clientes').innerHTML = 
            '<tr><td colspan="7" style="text-align: center; color: #dc2626;">Erro ao carregar clientes</td></tr>';
    }
}

// Configurar busca de clientes
function configurarBuscaCliente() {
    const buscaInput = document.getElementById('busca-cliente');
    if (buscaInput) {
        buscaInput.addEventListener('input', (e) => {
            const busca = e.target.value;
            carregarClientes(busca);
        });
    }
}

// Carregar Licenças
async function carregarLicencas() {
    
    const token = localStorage.getItem('token');
    
    try {
        const response = await fetch(`${API_URL}/admin/clientes`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Erro ao carregar licenças');
        }

        const data = await response.json();
        
        const clientes = data.clientes || [];
        
        // Filtrar apenas clientes com licença
        const clientesComLicenca = clientes.filter(c => c.licenca);
        
        
        const tbody = document.getElementById('lista-licencas');
        if (!tbody) {
            console.error('❌ Elemento lista-licencas não encontrado!');
            return;
        }
        
        if (clientesComLicenca.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align: center;">Nenhuma licença ativa</td></tr>';
            
            return;
        }

        tbody.innerHTML = clientesComLicenca.map(cliente => {
            const licenca = cliente.licenca;
            const dataExpiracao = new Date(licenca.dataExpiracao);
            const hoje = new Date();
            const diasRestantes = Math.ceil((dataExpiracao - hoje) / (1000 * 60 * 60 * 24));
            const expirada = diasRestantes < 0;
            
            return `
            <tr>
                <td>${cliente.nome}</td>
                <td>${cliente.email}</td>
                <td><span class="badge ${getBadgeLicenca(licenca.tipo)}">${licenca.tipo}</span></td>
                <td><span class="badge ${expirada ? 'badge-danger' : licenca.status === 'ativa' ? 'badge-success' : 'badge-warning'}">
                    ${expirada ? 'Expirada' : licenca.status === 'ativa' ? 'Ativa' : 'Inativa'}
                </span></td>
                <td>
                    ${formatarData(licenca.dataExpiracao)}
                    ${!expirada ? `<br><small style="color: ${diasRestantes <= 7 ? '#dc2626' : '#6b7280'};">(${diasRestantes} dias)</small>` : ''}
                </td>
                <td>${licenca.limiteCertificados !== null && licenca.limiteCertificados !== -1 ? licenca.limiteCertificados : '∞'}</td>
                <td class="action-btns">
                    <button class="btn btn-primary btn-sm" onclick="abrirEditarDataLicenca('${licenca._id}', '${licenca.dataExpiracao}')">📅 Renovar</button>
                    <button class="btn btn-danger btn-sm" onclick="excluirLicenca('${licenca._id}', '${cliente.email}')">🗑️ Excluir</button>
                </td>
            </tr>
        `;
        }).join('');
        
        
        
    } catch (error) {
        console.error('Erro ao carregar licenças:', error);
        document.getElementById('lista-licencas').innerHTML = 
            '<tr><td colspan="7" style="text-align: center; color: #dc2626;">Erro ao carregar licenças</td></tr>';
    }
}

// Abrir modal para editar data de expiração da licença
function abrirEditarDataLicenca(licencaId, dataAtual) {
    const dataFormatada = new Date(dataAtual).toISOString().split('T')[0];
    
    const modal = document.createElement('div');
    modal.id = 'modal-editar-data';
    modal.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(0,0,0,0.8); display: flex; align-items: center;
        justify-content: center; z-index: 10000;
    `;
    modal.innerHTML = `
        <div style="background: white; padding: 30px; border-radius: 15px; max-width: 450px; width: 90%; text-align: center; box-shadow: 0 10px 40px rgba(0,0,0,0.3);">
            <div style="font-size: 60px; margin-bottom: 15px;">📅</div>
            <h2 style="color: #1e3a8a; margin-bottom: 20px;">Renovar Licença</h2>
            <p style="font-size: 14px; color: #666; margin-bottom: 15px;">Selecione a nova data de expiração:</p>
            <input type="date" id="input-nova-data" value="${dataFormatada}" 
                style="width: 100%; padding: 12px; font-size: 16px; border: 2px solid #d1d5db; border-radius: 8px; margin-bottom: 10px; text-align: center;">
            <div style="display: flex; gap: 8px; justify-content: center; margin: 15px 0 20px;">
                <button onclick="definirRenovacao(30)" style="background: #e0e7ff; color: #1e3a8a; border: none; padding: 8px 14px; border-radius: 6px; cursor: pointer; font-size: 13px; font-weight: 600;">+30 dias</button>
                <button onclick="definirRenovacao(90)" style="background: #e0e7ff; color: #1e3a8a; border: none; padding: 8px 14px; border-radius: 6px; cursor: pointer; font-size: 13px; font-weight: 600;">+90 dias</button>
                <button onclick="definirRenovacao(365)" style="background: #e0e7ff; color: #1e3a8a; border: none; padding: 8px 14px; border-radius: 6px; cursor: pointer; font-size: 13px; font-weight: 600;">+1 ano</button>
            </div>
            <div style="display: flex; gap: 10px; justify-content: center;">
                <button onclick="salvarDataLicenca('${licencaId}')"
                    style="background: #16a34a; color: white; border: none; padding: 12px 28px; border-radius: 8px; cursor: pointer; font-size: 16px; font-weight: bold;">
                    ✅ Salvar
                </button>
                <button onclick="document.getElementById('modal-editar-data').remove()"
                    style="background: #6b7280; color: white; border: none; padding: 12px 28px; border-radius: 8px; cursor: pointer; font-size: 16px;">
                    Cancelar
                </button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

// Atalho para definir data relativa
function definirRenovacao(dias) {
    const input = document.getElementById('input-nova-data');
    const novaData = new Date();
    novaData.setDate(novaData.getDate() + dias);
    input.value = novaData.toISOString().split('T')[0];
}

// Salvar nova data de expiração
async function salvarDataLicenca(licencaId) {
    const novaData = document.getElementById('input-nova-data').value;
    if (!novaData) {
        alert('Selecione uma data válida');
        return;
    }
    const token = localStorage.getItem('token');
    try {
        const response = await fetch(`${API_URL}/admin/licencas/${licencaId}/data`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ dataExpiracao: novaData })
        });
        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.message || 'Erro ao atualizar data');
        }
        document.getElementById('modal-editar-data').remove();
        alert('✅ Data de expiração atualizada com sucesso!');
        carregarLicencas();
    } catch (error) {
        console.error('Erro ao atualizar data:', error);
        alert('Erro ao atualizar data da licença: ' + error.message);
    }
}

// Excluir licença
async function excluirLicenca(licencaId, email) {
    if (!confirm(`⚠️ ATENÇÃO!\n\nDeseja realmente EXCLUIR a licença do cliente:\n${email}\n\nO cliente perderá o acesso aos recursos da licença.`)) {
        return;
    }
    const token = localStorage.getItem('token');
    try {
        const response = await fetch(`${API_URL}/admin/licencas/${licencaId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.message || 'Erro ao excluir licença');
        }
        alert('✅ Licença excluída com sucesso!');
        carregarLicencas();
    } catch (error) {
        console.error('Erro ao excluir licença:', error);
        alert('Erro ao excluir licença: ' + error.message);
    }
}

// Ver detalhes do cliente
async function verDetalhesCliente(clienteId) {
    const token = localStorage.getItem('token');
    
    try {
        const response = await fetch(`${API_URL}/admin/clientes/${clienteId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Erro ao carregar detalhes');
        }

        const data = await response.json();
        const cliente = data.cliente;
        
        if (!cliente) {
            throw new Error('Dados do cliente não encontrados');
        }
        
        alert(`
DETALHES DO CLIENTE

Nome: ${cliente.nome}
Email: ${cliente.email}
Instituição: ${cliente.instituicao || '-'}
CPF/CNPJ: ${cliente.cpf || cliente.cnpj || '-'}
Telefone: ${cliente.telefone || '-'}

LICENÇA ATUAL:
Tipo: ${cliente.licenca?.tipo || 'Nenhuma'}
Status: ${cliente.licenca?.status === 'ativa' ? 'Ativa' : 'Inativa'}
Validade: ${cliente.licenca?.dataExpiracao ? formatarData(cliente.licenca.dataExpiracao) : '-'}

ESTATÍSTICAS:
Total de Pagamentos: ${data.pagamentos?.length || 0}
Total de Notas Fiscais: ${data.notasFiscais?.length || 0}
        `);
        
    } catch (error) {
        console.error('Erro ao carregar detalhes:', error);
        alert('Erro ao carregar detalhes do cliente');
    }
}

// Toggle status do cliente
async function toggleStatusCliente(clienteId, novoStatus) {
    const token = localStorage.getItem('token');
    
    if (!confirm(`Deseja realmente ${novoStatus ? 'ativar' : 'desativar'} este cliente?`)) {
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/admin/clientes/${clienteId}/status`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ ativo: novoStatus })
        });

        if (!response.ok) {
            throw new Error('Erro ao alterar status');
        }

        alert('Status alterado com sucesso!');
        carregarClientes();
        
    } catch (error) {
        console.error('Erro ao alterar status:', error);
        alert('Erro ao alterar status do cliente');
    }
}

// Resetar senha do cliente
async function resetarSenhaCliente(clienteId, email) {
    if (!confirm(`Deseja resetar a senha do cliente: ${email}?\n\nUma nova senha temporária será gerada.`)) {
        return;
    }

    const token = localStorage.getItem('token');
    
    try {
        const response = await fetch(`${API_URL}/admin/clientes/${clienteId}/resetar-senha`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Erro ao resetar senha');
        }

        const data = await response.json();
        
        // Mostrar a nova senha em modal
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.8);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
        `;
        
        modal.innerHTML = `
            <div style="background: white; padding: 30px; border-radius: 15px; max-width: 500px; text-align: center; box-shadow: 0 10px 40px rgba(0,0,0,0.3);">
                <div style="font-size: 60px; margin-bottom: 20px;">🔑</div>
                <h2 style="color: #16a34a; margin-bottom: 15px;">Senha Resetada!</h2>
                <p style="font-size: 16px; color: #333; margin-bottom: 15px;">
                    <strong>Cliente:</strong> ${email}
                </p>
                <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <p style="font-size: 14px; color: #666; margin-bottom: 10px;">Nova senha temporária:</p>
                    <p style="font-size: 24px; font-weight: bold; color: #1e3a8a; font-family: monospace; letter-spacing: 2px;">
                        ${data.novaSenha}
                    </p>
                </div>
                <p style="font-size: 13px; color: #dc2626; margin-bottom: 20px;">
                    ⚠️ Anote esta senha! Ela não poderá ser recuperada depois.
                </p>
                <button onclick="navigator.clipboard.writeText('${data.novaSenha}').then(() => alert('Senha copiada!')); this.textContent='✓ Copiado!'" 
                        style="background: #2563eb; color: white; border: none; padding: 12px 24px; border-radius: 8px; cursor: pointer; font-size: 16px; font-weight: bold; margin-right: 10px;">
                    📋 Copiar Senha
                </button>
                <button onclick="this.closest('div').parentElement.remove();" 
                        style="background: #6b7280; color: white; border: none; padding: 12px 24px; border-radius: 8px; cursor: pointer; font-size: 16px;">
                    Fechar
                </button>
            </div>
        `;
        
        document.body.appendChild(modal);
        
    } catch (error) {
        console.error('Erro ao resetar senha:', error);
        alert('Erro ao resetar senha do cliente');
    }
}

// Excluir cliente individual
async function excluirCliente(clienteId, email) {
    if (!confirm(`⚠️ ATENÇÃO!\n\nDeseja realmente EXCLUIR PERMANENTEMENTE o cliente:\n${email}\n\nEsta ação não pode ser desfeita!\nTodos os dados (licença, pagamentos, notas fiscais) serão removidos.`)) {
        return;
    }

    const token = localStorage.getItem('token');

    try {
        const response = await fetch(`${API_URL}/admin/clientes/${clienteId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Erro ao excluir cliente');
        }

        alert('✅ Cliente excluído com sucesso!');
        carregarClientes();
    } catch (error) {
        console.error('Erro ao excluir cliente:', error);
        alert('❌ ' + error.message);
    }
}

// Selecionar/desselecionar todos os clientes
function toggleSelectAllClientes(checkbox) {
    document.querySelectorAll('.select-cliente:not(:disabled)').forEach(cb => {
        cb.checked = checkbox.checked;
    });
    atualizarContadorSelecionados();
}

// Atualizar contador de selecionados
function atualizarContadorSelecionados() {
    const selecionados = document.querySelectorAll('.select-cliente:checked');
    const count = selecionados.length;
    const btnLote = document.getElementById('btn-excluir-lote');
    const countSpan = document.getElementById('count-selecionados');

    if (btnLote) btnLote.style.display = count > 0 ? 'inline-block' : 'none';
    if (countSpan) countSpan.textContent = count;
}

// Excluir clientes em lote
async function excluirClientesEmLote() {
    const selecionados = document.querySelectorAll('.select-cliente:checked');
    const ids = Array.from(selecionados).map(cb => cb.value);

    if (ids.length === 0) {
        alert('Nenhum cliente selecionado');
        return;
    }

    if (!confirm(`⚠️ ATENÇÃO!\n\nDeseja realmente EXCLUIR PERMANENTEMENTE ${ids.length} cliente(s)?\n\nEsta ação não pode ser desfeita!\nTodos os dados associados serão removidos.`)) {
        return;
    }

    // Confirmação dupla para segurança
    if (!confirm(`🔴 CONFIRMAÇÃO FINAL\n\nVocê está prestes a excluir ${ids.length} cliente(s).\n\nClique OK para confirmar.`)) {
        return;
    }

    const token = localStorage.getItem('token');

    try {
        const response = await fetch(`${API_URL}/admin/clientes/excluir-lote`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ ids })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Erro ao excluir clientes');
        }

        let msg = `✅ ${data.excluidos} cliente(s) excluído(s) com sucesso!`;
        if (data.ignorados > 0) {
            msg += `\n⚠️ ${data.ignorados} admin(s) foram ignorados.`;
        }
        alert(msg);

        document.getElementById('select-all-clientes').checked = false;
        atualizarContadorSelecionados();
        carregarClientes();
    } catch (error) {
        console.error('Erro ao excluir clientes em lote:', error);
        alert('❌ ' + error.message);
    }
}

// Modal para registrar novo pagamento
async function showModalPagamento() {
    const token = localStorage.getItem('token');

    // Carregar lista de clientes para o select
    let clientesOptions = '<option value="">Carregando...</option>';
    try {
        const response = await fetch(`${API_URL}/admin/clientes?limite=100`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
            const data = await response.json();
            const clientes = data.clientes || [];
            clientesOptions = '<option value="">-- Selecione o cliente --</option>' +
                clientes.map(c => `<option value="${c._id}">${c.nome} (${c.email})</option>`).join('');
        }
    } catch (e) {
        clientesOptions = '<option value="">Erro ao carregar clientes</option>';
    }

    const modal = document.createElement('div');
    modal.id = 'modal-novo-pagamento';
    modal.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(0,0,0,0.8); display: flex; align-items: center;
        justify-content: center; z-index: 10000;
    `;
    modal.innerHTML = `
        <div style="background: white; padding: 30px; border-radius: 15px; max-width: 520px; width: 95%; box-shadow: 0 10px 40px rgba(0,0,0,0.3); max-height: 90vh; overflow-y: auto;">
            <div style="text-align: center; margin-bottom: 20px;">
                <div style="font-size: 50px;">💰</div>
                <h2 style="color: #1e3a8a; margin-top: 10px;">Novo Pagamento</h2>
            </div>
            <form id="form-novo-pagamento" onsubmit="enviarPagamento(event)" style="display: flex; flex-direction: column; gap: 14px;">
                <div>
                    <label style="font-weight: 600; font-size: 14px; display: block; margin-bottom: 4px;">Cliente *</label>
                    <select id="pag-cliente" required style="width: 100%; padding: 10px; border: 2px solid #d1d5db; border-radius: 8px; font-size: 14px;">
                        ${clientesOptions}
                    </select>
                </div>
                <div>
                    <label style="font-weight: 600; font-size: 14px; display: block; margin-bottom: 4px;">Tipo de Licença *</label>
                    <select id="pag-tipo" required style="width: 100%; padding: 10px; border: 2px solid #d1d5db; border-radius: 8px; font-size: 14px;">
                        <option value="">-- Selecione --</option>
                        <option value="mensal">Mensal</option>
                        <option value="anual">Anual</option>
                        <option value="vitalicia">Vitalícia</option>
                        <option value="renovacao">Renovação</option>
                        <option value="upgrade">Upgrade</option>
                    </select>
                </div>
                <div style="display: flex; gap: 12px;">
                    <div style="flex: 1;">
                        <label style="font-weight: 600; font-size: 14px; display: block; margin-bottom: 4px;">Valor (R$) *</label>
                        <input type="number" id="pag-valor" step="0.01" min="0" required placeholder="0,00"
                            style="width: 100%; padding: 10px; border: 2px solid #d1d5db; border-radius: 8px; font-size: 14px;"
                            oninput="calcularValorFinal()">
                    </div>
                    <div style="flex: 1;">
                        <label style="font-weight: 600; font-size: 14px; display: block; margin-bottom: 4px;">Desconto (R$)</label>
                        <input type="number" id="pag-desconto" step="0.01" min="0" value="0" placeholder="0,00"
                            style="width: 100%; padding: 10px; border: 2px solid #d1d5db; border-radius: 8px; font-size: 14px;"
                            oninput="calcularValorFinal()">
                    </div>
                </div>
                <div style="background: #f0fdf4; padding: 10px 14px; border-radius: 8px; text-align: center;">
                    <span style="font-size: 13px; color: #666;">Valor Final: </span>
                    <strong id="pag-valor-final-display" style="font-size: 18px; color: #16a34a;">R$ 0,00</strong>
                </div>
                <div>
                    <label style="font-weight: 600; font-size: 14px; display: block; margin-bottom: 4px;">Método de Pagamento *</label>
                    <select id="pag-metodo" required style="width: 100%; padding: 10px; border: 2px solid #d1d5db; border-radius: 8px; font-size: 14px;">
                        <option value="">-- Selecione --</option>
                        <option value="pix">PIX</option>
                        <option value="cartao_credito">Cartão de Crédito</option>
                        <option value="cartao_debito">Cartão de Débito</option>
                        <option value="boleto">Boleto</option>
                        <option value="transferencia">Transferência</option>
                        <option value="dinheiro">Dinheiro</option>
                    </select>
                </div>
                <div>
                    <label style="font-weight: 600; font-size: 14px; display: block; margin-bottom: 4px;">Status *</label>
                    <select id="pag-status" required style="width: 100%; padding: 10px; border: 2px solid #d1d5db; border-radius: 8px; font-size: 14px;">
                        <option value="pendente">Pendente</option>
                        <option value="aprovado">Aprovado</option>
                    </select>
                </div>
                <div>
                    <label style="font-weight: 600; font-size: 14px; display: block; margin-bottom: 4px;">Observações</label>
                    <textarea id="pag-obs" rows="2" placeholder="Opcional..."
                        style="width: 100%; padding: 10px; border: 2px solid #d1d5db; border-radius: 8px; font-size: 14px; resize: vertical;"></textarea>
                </div>
                <div style="display: flex; gap: 10px; justify-content: center; margin-top: 10px;">
                    <button type="submit"
                        style="background: #16a34a; color: white; border: none; padding: 12px 28px; border-radius: 8px; cursor: pointer; font-size: 16px; font-weight: bold;">
                        ✅ Registrar
                    </button>
                    <button type="button" onclick="document.getElementById('modal-novo-pagamento').remove()"
                        style="background: #6b7280; color: white; border: none; padding: 12px 28px; border-radius: 8px; cursor: pointer; font-size: 16px;">
                        Cancelar
                    </button>
                </div>
            </form>
        </div>
    `;
    document.body.appendChild(modal);
}

// Calcular valor final em tempo real
function calcularValorFinal() {
    const valor = parseFloat(document.getElementById('pag-valor').value) || 0;
    const desconto = parseFloat(document.getElementById('pag-desconto').value) || 0;
    const final_val = Math.max(0, valor - desconto);
    document.getElementById('pag-valor-final-display').textContent = `R$ ${final_val.toFixed(2).replace('.', ',')}`;
}

// Enviar novo pagamento ao backend
async function enviarPagamento(event) {
    event.preventDefault();
    const token = localStorage.getItem('token');

    const usuario = document.getElementById('pag-cliente').value;
    const tipoProduto = document.getElementById('pag-tipo').value;
    const valor = parseFloat(document.getElementById('pag-valor').value);
    const desconto = parseFloat(document.getElementById('pag-desconto').value) || 0;
    const valorFinal = Math.max(0, valor - desconto);
    const metodoPagamento = document.getElementById('pag-metodo').value;
    const status = document.getElementById('pag-status').value;
    const observacoes = document.getElementById('pag-obs').value.trim();

    if (!usuario || !tipoProduto || !valor || !metodoPagamento) {
        alert('Preencha todos os campos obrigatórios');
        return;
    }

    try {
        const body = {
            usuario,
            tipoProduto,
            valor,
            desconto,
            valorFinal,
            metodoPagamento,
            status,
            dataPagamento: status === 'aprovado' ? new Date().toISOString() : undefined,
            observacoes: observacoes || undefined
        };

        const response = await fetch(`${API_URL}/admin/pagamentos`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.message || 'Erro ao registrar pagamento');
        }

        document.getElementById('modal-novo-pagamento').remove();
        alert('✅ Pagamento registrado com sucesso!');
        carregarPagamentos();
    } catch (error) {
        console.error('Erro ao registrar pagamento:', error);
        alert('❌ Erro ao registrar pagamento: ' + error.message);
    }
}

// Carregar Pagamentos
async function carregarPagamentos() {
    
    const token = localStorage.getItem('token');
    
    try {
        const response = await fetch(`${API_URL}/admin/pagamentos`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Erro ao carregar pagamentos');
        }

        const data = await response.json();
        
        const pagamentos = data.pagamentos || [];
        
        
        const tbody = document.getElementById('lista-pagamentos');
        if (!tbody) {
            console.error('❌ Elemento lista-pagamentos não encontrado!');
            return;
        }
        
        if (pagamentos.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align: center;">Nenhum pagamento registrado</td></tr>';
            return;
        }

        tbody.innerHTML = pagamentos.map(pag => `
            <tr>
                <td>${formatarData(pag.dataPagamento)}</td>
                <td>${pag.usuario?.nome || '-'}</td>
                <td>${pag.tipoLicenca}</td>
                <td>${formatarMoeda(pag.valorFinal)}</td>
                <td>${pag.metodoPagamento}</td>
                <td><span class="badge ${getBadgeStatusPagamento(pag.status)}">${pag.status}</span></td>
                <td class="action-btns">
                    ${pag.status === 'pendente' ? `
                        <button class="btn btn-success btn-sm" onclick="aprovarPagamento('${pag._id}')">Aprovar</button>
                        <button class="btn badge-danger btn-sm" onclick="recusarPagamento('${pag._id}')">Recusar</button>
                    ` : '-'}
                </td>
            </tr>
        `).join('');
        
    } catch (error) {
        console.error('Erro ao carregar pagamentos:', error);
        document.getElementById('lista-pagamentos').innerHTML = 
            '<tr><td colspan="7" style="text-align: center; color: #dc2626;">Erro ao carregar pagamentos</td></tr>';
    }
}

// Aprovar pagamento
async function aprovarPagamento(pagamentoId) {
    const token = localStorage.getItem('token');
    
    if (!confirm('Confirmar aprovação do pagamento?')) {
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/admin/pagamentos/${pagamentoId}/aprovar`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Erro ao aprovar pagamento');
        }

        alert('Pagamento aprovado com sucesso! Licença atualizada.');
        carregarPagamentos();
        
    } catch (error) {
        console.error('Erro ao aprovar pagamento:', error);
        alert('Erro ao aprovar pagamento');
    }
}

// Recusar pagamento
async function recusarPagamento(pagamentoId) {
    const token = localStorage.getItem('token');
    const motivo = prompt('Motivo da recusa:');
    
    if (!motivo) {
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/admin/pagamentos/${pagamentoId}/recusar`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ motivo })
        });

        if (!response.ok) {
            throw new Error('Erro ao recusar pagamento');
        }

        alert('Pagamento recusado.');
        carregarPagamentos();
        
    } catch (error) {
        console.error('Erro ao recusar pagamento:', error);
        alert('Erro ao recusar pagamento');
    }
}

// Dados do prestador (Prefeitura Municipal de Curimatá)
const DADOS_PRESTADOR = {
    razaoSocial: 'Wander Pires Silva Coelho',
    nomeFantasia: 'Gerador de Certificados Escolares',
    cnpj: '06.554.273/0001-64',
    cpf: '036.236.556-35',
    inscricaoMunicipal: '',
    endereco: 'Avenida Curimatá-PI',
    cidade: 'Curimatá',
    estado: 'PI',
    cep: '64960-000',
    telefone: '',
    email: 'wanderpsc@gmail.com',
    // Dados ISS
    prefeitura: 'Prefeitura Municipal de Curimatá',
    cnpjPrefeitura: '06.554.273/0001-64',
    enderecoPrefeitura: 'Praça Abdias Albuquerque, 427, Centro, Curimatá/PI, CEP 64960-000',
    aliquotaISS: 5.00, // 5% - alíquota padrão ISS Curimatá/PI (Simples Nacional, serviço de TI - item 1.07 LC 116/2003)
    codigoServico: '1.07', // Suporte técnico em informática / software
    descricaoServico: 'Licenciamento de uso de software - Gerador de Certificados e Históricos Escolares'
};

// Modal para emitir nota fiscal
async function showModalNotaFiscal() {
    const token = localStorage.getItem('token');

    // Buscar pagamentos aprovados sem NF
    let pagamentosOptions = '<option value="">Carregando...</option>';
    try {
        const response = await fetch(`${API_URL}/admin/pagamentos`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
            const data = await response.json();
            const pagamentos = (data.pagamentos || []).filter(p => p.status === 'aprovado' && !p.notaFiscal);
            if (pagamentos.length === 0) {
                pagamentosOptions = '<option value="">Nenhum pagamento aprovado sem NF</option>';
            } else {
                pagamentosOptions = '<option value="">-- Selecione o pagamento --</option>' +
                    pagamentos.map(p => `<option value="${p._id}" data-valor="${p.valorFinal}" data-tipo="${p.tipoProduto}" data-cliente="${p.usuario?.nome || '-'}">
                        ${formatarData(p.dataPagamento)} - ${p.usuario?.nome || '-'} - ${p.tipoProduto} - ${formatarMoeda(p.valorFinal)}
                    </option>`).join('');
            }
        }
    } catch (e) {
        pagamentosOptions = '<option value="">Erro ao carregar pagamentos</option>';
    }

    const modal = document.createElement('div');
    modal.id = 'modal-nota-fiscal';
    modal.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(0,0,0,0.8); display: flex; align-items: center;
        justify-content: center; z-index: 10000;
    `;
    modal.innerHTML = `
        <div style="background: white; padding: 30px; border-radius: 15px; max-width: 620px; width: 95%; box-shadow: 0 10px 40px rgba(0,0,0,0.3); max-height: 92vh; overflow-y: auto;">
            <div style="text-align: center; margin-bottom: 18px;">
                <div style="font-size: 50px;">📄</div>
                <h2 style="color: #1e3a8a; margin-top: 8px;">Emitir Nota Fiscal de Serviço</h2>
                <p style="font-size: 13px; color: #666;">NFS-e - ISS Prefeitura de Curimatá/PI</p>
            </div>
            <form id="form-nota-fiscal" onsubmit="enviarNotaFiscal(event)" style="display: flex; flex-direction: column; gap: 14px;">
                
                <div>
                    <label style="font-weight: 600; font-size: 14px; display: block; margin-bottom: 4px;">Pagamento Vinculado *</label>
                    <select id="nf-pagamento" required onchange="preencherDadosNF()"
                        style="width: 100%; padding: 10px; border: 2px solid #d1d5db; border-radius: 8px; font-size: 13px;">
                        ${pagamentosOptions}
                    </select>
                </div>

                <fieldset style="border: 2px solid #e5e7eb; border-radius: 10px; padding: 14px;">
                    <legend style="font-weight: 700; color: #1e3a8a; padding: 0 8px; font-size: 14px;">Prestador de Serviço</legend>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                        <div>
                            <label style="font-size: 12px; color: #666;">Nome/Razão Social</label>
                            <input type="text" id="nf-prestador-nome" value="${DADOS_PRESTADOR.razaoSocial}" readonly
                                style="width: 100%; padding: 8px; border: 1px solid #e5e7eb; border-radius: 6px; font-size: 13px; background: #f9fafb;">
                        </div>
                        <div>
                            <label style="font-size: 12px; color: #666;">CPF</label>
                            <input type="text" id="nf-prestador-cpf" value="${DADOS_PRESTADOR.cpf}" readonly
                                style="width: 100%; padding: 8px; border: 1px solid #e5e7eb; border-radius: 6px; font-size: 13px; background: #f9fafb;">
                        </div>
                        <div style="grid-column: span 2;">
                            <label style="font-size: 12px; color: #666;">Endereço</label>
                            <input type="text" id="nf-prestador-endereco" value="${DADOS_PRESTADOR.endereco}, ${DADOS_PRESTADOR.cidade}/${DADOS_PRESTADOR.estado} - CEP ${DADOS_PRESTADOR.cep}" readonly
                                style="width: 100%; padding: 8px; border: 1px solid #e5e7eb; border-radius: 6px; font-size: 13px; background: #f9fafb;">
                        </div>
                    </div>
                </fieldset>

                <fieldset style="border: 2px solid #e5e7eb; border-radius: 10px; padding: 14px;">
                    <legend style="font-weight: 700; color: #1e3a8a; padding: 0 8px; font-size: 14px;">Recolhimento ISS</legend>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                        <div style="grid-column: span 2;">
                            <label style="font-size: 12px; color: #666;">Prefeitura</label>
                            <input type="text" value="${DADOS_PRESTADOR.prefeitura} - CNPJ ${DADOS_PRESTADOR.cnpjPrefeitura}" readonly
                                style="width: 100%; padding: 8px; border: 1px solid #e5e7eb; border-radius: 6px; font-size: 13px; background: #f9fafb;">
                        </div>
                        <div style="grid-column: span 2;">
                            <label style="font-size: 12px; color: #666;">Endereço Prefeitura</label>
                            <input type="text" value="${DADOS_PRESTADOR.enderecoPrefeitura}" readonly
                                style="width: 100%; padding: 8px; border: 1px solid #e5e7eb; border-radius: 6px; font-size: 13px; background: #f9fafb;">
                        </div>
                        <div>
                            <label style="font-size: 12px; color: #666;">Código do Serviço (LC 116/2003)</label>
                            <input type="text" value="${DADOS_PRESTADOR.codigoServico} - Software / TI" readonly
                                style="width: 100%; padding: 8px; border: 1px solid #e5e7eb; border-radius: 6px; font-size: 13px; background: #f9fafb;">
                        </div>
                        <div>
                            <label style="font-size: 12px; color: #666;">Alíquota ISS</label>
                            <input type="text" value="${DADOS_PRESTADOR.aliquotaISS}%" readonly
                                style="width: 100%; padding: 8px; border: 1px solid #e5e7eb; border-radius: 6px; font-size: 13px; background: #f9fafb;">
                        </div>
                    </div>
                </fieldset>

                <fieldset style="border: 2px solid #e5e7eb; border-radius: 10px; padding: 14px;">
                    <legend style="font-weight: 700; color: #16a34a; padding: 0 8px; font-size: 14px;">Valores</legend>
                    <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px;">
                        <div>
                            <label style="font-size: 12px; color: #666;">Valor Serviço</label>
                            <input type="text" id="nf-valor-servico" value="R$ 0,00" readonly
                                style="width: 100%; padding: 8px; border: 1px solid #e5e7eb; border-radius: 6px; font-size: 14px; font-weight: 600; background: #f9fafb; text-align: center;">
                        </div>
                        <div>
                            <label style="font-size: 12px; color: #666;">ISS (${DADOS_PRESTADOR.aliquotaISS}%)</label>
                            <input type="text" id="nf-valor-iss" value="R$ 0,00" readonly
                                style="width: 100%; padding: 8px; border: 1px solid #e5e7eb; border-radius: 6px; font-size: 14px; background: #f9fafb; text-align: center; color: #dc2626;">
                        </div>
                        <div>
                            <label style="font-size: 12px; color: #666;">Valor Líquido</label>
                            <input type="text" id="nf-valor-liquido" value="R$ 0,00" readonly
                                style="width: 100%; padding: 8px; border: 1px solid #e5e7eb; border-radius: 6px; font-size: 14px; font-weight: 700; background: #f0fdf4; text-align: center; color: #16a34a;">
                        </div>
                    </div>
                </fieldset>

                <div>
                    <label style="font-weight: 600; font-size: 14px; display: block; margin-bottom: 4px;">Descrição do Serviço</label>
                    <textarea id="nf-descricao" rows="2"
                        style="width: 100%; padding: 10px; border: 2px solid #d1d5db; border-radius: 8px; font-size: 13px; resize: vertical;">${DADOS_PRESTADOR.descricaoServico}</textarea>
                </div>

                <div>
                    <label style="font-weight: 600; font-size: 14px; display: block; margin-bottom: 4px;">Observações</label>
                    <textarea id="nf-obs" rows="2" placeholder="Opcional..."
                        style="width: 100%; padding: 10px; border: 2px solid #d1d5db; border-radius: 8px; font-size: 13px; resize: vertical;"></textarea>
                </div>

                <div style="display: flex; gap: 10px; justify-content: center; margin-top: 8px;">
                    <button type="submit"
                        style="background: #16a34a; color: white; border: none; padding: 12px 28px; border-radius: 8px; cursor: pointer; font-size: 16px; font-weight: bold;">
                        📄 Emitir Nota Fiscal
                    </button>
                    <button type="button" onclick="document.getElementById('modal-nota-fiscal').remove()"
                        style="background: #6b7280; color: white; border: none; padding: 12px 28px; border-radius: 8px; cursor: pointer; font-size: 16px;">
                        Cancelar
                    </button>
                </div>
            </form>
        </div>
    `;
    document.body.appendChild(modal);
}

// Preencher valores ao selecionar pagamento
function preencherDadosNF() {
    const select = document.getElementById('nf-pagamento');
    const option = select.options[select.selectedIndex];
    const valor = parseFloat(option.dataset.valor) || 0;
    const tipo = option.dataset.tipo || '';
    const iss = valor * (DADOS_PRESTADOR.aliquotaISS / 100);
    const liquido = valor - iss;

    document.getElementById('nf-valor-servico').value = formatarMoeda(valor);
    document.getElementById('nf-valor-iss').value = formatarMoeda(iss);
    document.getElementById('nf-valor-liquido').value = formatarMoeda(liquido);

    if (tipo) {
        document.getElementById('nf-descricao').value =
            `Licença ${tipo} - ${DADOS_PRESTADOR.descricaoServico}`;
    }
}

// Enviar nota fiscal ao backend
async function enviarNotaFiscal(event) {
    event.preventDefault();
    const token = localStorage.getItem('token');

    const pagamentoId = document.getElementById('nf-pagamento').value;
    if (!pagamentoId) {
        alert('Selecione um pagamento');
        return;
    }

    const select = document.getElementById('nf-pagamento');
    const option = select.options[select.selectedIndex];
    const valor = parseFloat(option.dataset.valor) || 0;
    const iss = valor * (DADOS_PRESTADOR.aliquotaISS / 100);

    const dadosPrestador = {
        razaoSocial: DADOS_PRESTADOR.razaoSocial,
        nomeFantasia: DADOS_PRESTADOR.nomeFantasia,
        cnpj: DADOS_PRESTADOR.cnpjPrefeitura,
        inscricaoMunicipal: DADOS_PRESTADOR.inscricaoMunicipal,
        endereco: DADOS_PRESTADOR.endereco,
        cidade: DADOS_PRESTADOR.cidade,
        estado: DADOS_PRESTADOR.estado,
        cep: DADOS_PRESTADOR.cep,
        telefone: DADOS_PRESTADOR.telefone,
        email: DADOS_PRESTADOR.email
    };

    const observacoes = document.getElementById('nf-obs').value.trim();

    try {
        const response = await fetch(`${API_URL}/admin/notas-fiscais`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                pagamentoId,
                dadosPrestador,
                descricaoServico: document.getElementById('nf-descricao').value,
                impostos: { iss },
                observacoes: observacoes || undefined
            })
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.message || 'Erro ao emitir nota fiscal');
        }

        document.getElementById('modal-nota-fiscal').remove();
        alert('✅ Nota Fiscal emitida com sucesso!');
        carregarNotasFiscais();
    } catch (error) {
        console.error('Erro ao emitir nota fiscal:', error);
        alert('❌ Erro ao emitir nota fiscal: ' + error.message);
    }
}

// Cancelar nota fiscal
async function cancelarNota(notaId) {
    const motivo = prompt('Motivo do cancelamento:');
    if (!motivo) return;

    const token = localStorage.getItem('token');
    try {
        const response = await fetch(`${API_URL}/admin/notas-fiscais/${notaId}/cancelar`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ motivo })
        });
        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.message || 'Erro ao cancelar nota');
        }
        alert('✅ Nota fiscal cancelada.');
        carregarNotasFiscais();
    } catch (error) {
        console.error('Erro ao cancelar nota:', error);
        alert('❌ Erro: ' + error.message);
    }
}

// Carregar Notas Fiscais
async function carregarNotasFiscais() {
    
    const token = localStorage.getItem('token');
    
    try {
        const response = await fetch(`${API_URL}/admin/notas-fiscais`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Erro ao carregar notas fiscais');
        }

        const data = await response.json();
        
        const notas = data.notasFiscais || [];
        
        
        const tbody = document.getElementById('lista-notas');
        if (!tbody) {
            console.error('❌ Elemento lista-notas não encontrado!');
            return;
        }
        
        if (notas.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align: center;">Nenhuma nota fiscal emitida</td></tr>';
            return;
        }

        tbody.innerHTML = notas.map(nota => {
            const cancelada = nota.status === 'cancelada';
            return `
            <tr>
                <td>${nota.numero}</td>
                <td>${formatarData(nota.dataEmissao)}</td>
                <td>${nota.tomador?.nome || '-'}</td>
                <td>${formatarMoeda(nota.valorServico)}</td>
                <td><span class="badge ${cancelada ? 'badge-danger' : 'badge-success'}">
                    ${cancelada ? 'Cancelada' : 'Emitida'}
                </span></td>
                <td class="action-btns">
                    <button class="btn btn-primary btn-sm" onclick="verNotaFiscal('${nota._id}')">Ver</button>
                    ${!cancelada ? `
                        <button class="btn badge-danger btn-sm" onclick="cancelarNota('${nota._id}')">Cancelar</button>
                    ` : ''}
                </td>
            </tr>`;
        }).join('');
        
    } catch (error) {
        console.error('Erro ao carregar notas fiscais:', error);
        document.getElementById('lista-notas').innerHTML = 
            '<tr><td colspan="6" style="text-align: center; color: #dc2626;">Erro ao carregar notas fiscais</td></tr>';
    }
}

// Ver nota fiscal
async function verNotaFiscal(notaId) {
    const token = localStorage.getItem('token');
    try {
        const response = await fetch(`${API_URL}/admin/notas-fiscais/${notaId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Erro ao carregar nota fiscal');
        const nota = await response.json();

        const isCancelada = nota.status === 'cancelada';
        const valorServico = nota.valorServico || 0;
        const valorLiquido = nota.valorLiquido || 0;
        const iss = nota.impostos?.iss || 0;

        const textoParaCopiar = `NFS-e Nº ${nota.numero}\nData: ${formatarData(nota.dataEmissao)}\n\nPRESTADOR: ${nota.prestador?.razaoSocial || DADOS_PRESTADOR.razaoSocial}\nCPF/CNPJ: ${nota.prestador?.cnpj || DADOS_PRESTADOR.cpf}\n\nTOMADOR: ${nota.tomador?.nome || ''}\nCPF/CNPJ: ${nota.tomador?.cpfCnpj || ''}\nE-mail: ${nota.tomador?.email || ''}\n\nDESCRIÇÃO: ${nota.descricaoServico || DADOS_PRESTADOR.descricaoServico}\nCód. Serviço: ${DADOS_PRESTADOR.codigoServico} (LC 116/2003)\n\nVALOR DO SERVIÇO: ${formatarMoeda(valorServico)}\nISS (${DADOS_PRESTADOR.aliquotaISS}%): ${formatarMoeda(iss)}\nVALOR LÍQUIDO: ${formatarMoeda(valorLiquido)}\n\nStatus: ${isCancelada ? 'CANCELADA' : 'EMITIDA'}${nota.observacoes ? '\n\nOBS: ' + nota.observacoes : ''}`;

        document.getElementById('modal-ver-nf')?.remove();
        const modal = document.createElement('div');
        modal.id = 'modal-ver-nf';
        modal.style.cssText = 'position:fixed;inset:0;background:rgba(15,23,42,0.7);z-index:10000;display:flex;align-items:center;justify-content:center;padding:20px;backdrop-filter:blur(4px)';
        modal.innerHTML = `
            <div style="background:#fff;border-radius:18px;padding:32px;max-width:560px;width:100%;box-shadow:0 25px 60px rgba(0,0,0,0.35);max-height:90vh;overflow-y:auto;font-family:'Segoe UI',sans-serif">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px">
                    <div>
                        <h2 style="color:#1d4ed8;font-size:1.3rem;font-weight:800;margin:0">NFS-e Nº ${nota.numero}</h2>
                        <span style="font-size:12px;font-weight:700;padding:3px 10px;border-radius:20px;background:${isCancelada ? 'linear-gradient(135deg,#fee2e2,#fecaca)' : 'linear-gradient(135deg,#d1fae5,#a7f3d0)'};color:${isCancelada ? '#991b1b' : '#065f46'}">${isCancelada ? '● CANCELADA' : '● EMITIDA'}</span>
                    </div>
                    <button onclick="document.getElementById('modal-ver-nf').remove()" style="background:none;border:none;cursor:pointer;font-size:22px;color:#64748b;line-height:1">✕</button>
                </div>

                <div style="background:#f8faff;border-radius:12px;padding:16px;margin-bottom:16px;border:1px solid #e2ebf8">
                    <p style="font-size:11px;font-weight:700;color:#7c8bac;text-transform:uppercase;letter-spacing:.5px;margin-bottom:8px">Prestador</p>
                    <p style="font-size:14px;font-weight:600;color:#1e293b">${nota.prestador?.razaoSocial || DADOS_PRESTADOR.razaoSocial}</p>
                    <p style="font-size:13px;color:#64748b">CPF/CNPJ: ${nota.prestador?.cnpj || DADOS_PRESTADOR.cpf}</p>
                </div>

                <div style="background:#f8faff;border-radius:12px;padding:16px;margin-bottom:16px;border:1px solid #e2ebf8">
                    <p style="font-size:11px;font-weight:700;color:#7c8bac;text-transform:uppercase;letter-spacing:.5px;margin-bottom:8px">Tomador</p>
                    <p style="font-size:14px;font-weight:600;color:#1e293b">${nota.tomador?.nome || '-'}</p>
                    <p style="font-size:13px;color:#64748b">CPF/CNPJ: ${nota.tomador?.cpfCnpj || '-'}</p>
                    <p style="font-size:13px;color:#64748b">E-mail: ${nota.tomador?.email || '-'}</p>
                </div>

                <div style="background:#f8faff;border-radius:12px;padding:16px;margin-bottom:16px;border:1px solid #e2ebf8">
                    <p style="font-size:11px;font-weight:700;color:#7c8bac;text-transform:uppercase;letter-spacing:.5px;margin-bottom:8px">Serviço</p>
                    <p style="font-size:13px;color:#1e293b">${nota.descricaoServico || DADOS_PRESTADOR.descricaoServico}</p>
                    <p style="font-size:12px;color:#64748b;margin-top:4px">Código ${DADOS_PRESTADOR.codigoServico} — LC 116/2003 &nbsp;|&nbsp; Data: ${formatarData(nota.dataEmissao)}</p>
                </div>

                <div style="background:linear-gradient(135deg,#eff6ff,#f0f4ff);border-radius:12px;padding:16px;margin-bottom:20px;border:1px solid rgba(37,99,235,.18)">
                    <p style="font-size:11px;font-weight:700;color:#7c8bac;text-transform:uppercase;letter-spacing:.5px;margin-bottom:10px">Valores</p>
                    <div style="display:flex;flex-direction:column;gap:6px">
                        <div style="display:flex;justify-content:space-between;font-size:14px"><span style="color:#64748b">Valor do Serviço</span><span style="font-weight:700;color:#1e293b">${formatarMoeda(valorServico)}</span></div>
                        <div style="display:flex;justify-content:space-between;font-size:13px"><span style="color:#64748b">ISS (${DADOS_PRESTADOR.aliquotaISS}%)</span><span style="color:#f59e0b;font-weight:600">${formatarMoeda(iss)}</span></div>
                        <hr style="border:none;border-top:1px solid #d1d9f0;margin:2px 0">
                        <div style="display:flex;justify-content:space-between;font-size:15px"><span style="font-weight:700;color:#1e293b">Valor Líquido</span><span style="font-weight:800;color:#2563eb">${formatarMoeda(valorLiquido)}</span></div>
                    </div>
                </div>

                <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:12px;padding:14px;margin-bottom:12px">
                    <p style="font-size:12px;color:#92400e;font-weight:600;margin:0 0 6px">⚠️ Este é um registro interno. Para ter validade fiscal, emita a NFS-e oficialmente (opções abaixo).</p>
                    <p style="font-size:11px;color:#b45309;margin:0">O portal NFS-e Nacional pede o Recibo do IRPF para verificar sua identidade. Você encontra esse número no e-CAC da Receita Federal (link abaixo) ou no programa IRPF instalado no seu PC.</p>
                </div>

                <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:8px">
                    <button onclick="navigator.clipboard.writeText(${JSON.stringify(textoParaCopiar).replace(/"/g, '&quot;')}).then(()=>this.textContent='✔ Copiado!').catch(()=>{})" style="flex:1;min-width:120px;padding:10px;border:2px solid #2563eb;border-radius:10px;background:#eff6ff;color:#1d4ed8;font-weight:700;cursor:pointer;font-size:12px">📋 Copiar Dados</button>
                    <button onclick="window.open('https://www.nfse.gov.br/EmissorNacional/','_blank')" style="flex:2;min-width:180px;padding:10px;border:none;border-radius:10px;background:linear-gradient(165deg,#60a5fa,#2563eb,#1d4ed8);color:#fff;font-weight:700;cursor:pointer;font-size:12px;box-shadow:0 5px 14px rgba(37,99,235,.4)">🌐 Portal NFS-e Nacional (Gratuito)</button>
                </div>
                <div style="display:flex;gap:8px;flex-wrap:wrap">
                    <button onclick="window.open('https://cav.receita.fazenda.gov.br/autenticacao/login','_blank')" style="flex:1;min-width:140px;padding:10px;border:2px solid #7c3aed;border-radius:10px;background:#f5f3ff;color:#6d28d9;font-weight:700;cursor:pointer;font-size:12px">🔑 e-CAC — Consultar Recibo IRPF</button>
                    <button onclick="window.open('https://www.gov.br/prefeituras/curumata-pi','_blank')" style="flex:1;min-width:140px;padding:10px;border:2px solid #059669;border-radius:10px;background:#ecfdf5;color:#065f46;font-weight:700;cursor:pointer;font-size:12px">🏛️ Prefeitura de Curimatá/PI</button>
                </div>
            </div>`;
        document.body.appendChild(modal);
        modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });
    } catch (error) {
        alert('Erro ao carregar nota fiscal');
    }
}

// Carregar Financeiro
async function carregarFinanceiro() {
    const token = localStorage.getItem('token');
    
    try {
        // Buscar dados do dashboard e pagamentos
        const [dashboardRes, pagamentosRes, clientesRes] = await Promise.all([
            fetch(`${API_URL}/admin/dashboard`, {
                headers: { 'Authorization': `Bearer ${token}` }
            }),
            fetch(`${API_URL}/admin/pagamentos`, {
                headers: { 'Authorization': `Bearer ${token}` }
            }),
            fetch(`${API_URL}/admin/clientes`, {
                headers: { 'Authorization': `Bearer ${token}` }
            })
        ]);

        const dashboardData = await dashboardRes.json();
        const pagamentosData = await pagamentosRes.json();
        const clientesData = await clientesRes.json();

        const dashboard = dashboardData.dashboard || {};
        const pagamentos = pagamentosData.pagamentos || [];
        const clientes = clientesData.clientes || [];

        // Atualizar cards de estatísticas
        document.getElementById('fin-receita-mensal').textContent = 
            formatarMoeda(dashboard.financeiro?.receitaMensal || 0);
        document.getElementById('fin-receita-anual').textContent = 
            formatarMoeda(dashboard.financeiro?.receitaAnual || 0);
        document.getElementById('fin-total-pagamentos').textContent = pagamentos.length;
        
        // Contar licenças ativas
        const licencasAtivas = clientes.filter(c => 
            c.licenca && c.licenca.status === 'ativa'
        ).length;
        document.getElementById('fin-licencas-ativas').textContent = licencasAtivas;

        // Calcular resumo por tipo de plano
        const planos = {};
        let receitaTotal = 0;
        
        pagamentos.forEach(pag => {
            const tipo = pag.tipo || 'Não especificado';
            if (!planos[tipo]) {
                planos[tipo] = { quantidade: 0, receita: 0 };
            }
            planos[tipo].quantidade++;
            planos[tipo].receita += pag.valor || 0;
            receitaTotal += pag.valor || 0;
        });

        const tbodyPlanos = document.getElementById('fin-planos');
        if (Object.keys(planos).length === 0) {
            tbodyPlanos.innerHTML = '<tr><td colspan="4" style="text-align: center;">Nenhum pagamento registrado</td></tr>';
        } else {
            tbodyPlanos.innerHTML = Object.entries(planos).map(([tipo, dados]) => `
                <tr>
                    <td><strong>${tipo}</strong></td>
                    <td>${dados.quantidade}</td>
                    <td>${formatarMoeda(dados.receita)}</td>
                    <td>${receitaTotal > 0 ? ((dados.receita / receitaTotal) * 100).toFixed(1) : 0}%</td>
                </tr>
            `).join('');
        }

        // Últimos pagamentos
        const tbodyPagamentos = document.getElementById('fin-ultimos-pagamentos');
        if (pagamentos.length === 0) {
            tbodyPagamentos.innerHTML = '<tr><td colspan="6" style="text-align: center;">Nenhum pagamento registrado</td></tr>';
        } else {
            const ultimosPagamentos = pagamentos.slice(0, 10);
            tbodyPagamentos.innerHTML = ultimosPagamentos.map(pag => `
                <tr>
                    <td>${formatarData(pag.data)}</td>
                    <td>${pag.usuarioNome || 'N/A'}</td>
                    <td><span class="badge badge-info">${pag.tipo || 'N/A'}</span></td>
                    <td><strong>${formatarMoeda(pag.valor)}</strong></td>
                    <td>${pag.metodoPagamento || 'N/A'}</td>
                    <td><span class="badge badge-${pag.status === 'confirmado' ? 'success' : pag.status === 'pendente' ? 'warning' : 'danger'}">${pag.status || 'N/A'}</span></td>
                </tr>
            `).join('');
        }
        
    } catch (error) {
        console.error('Erro ao carregar dados financeiros:', error);
        document.getElementById('fin-planos').innerHTML = '<tr><td colspan="4" style="text-align: center; color: red;">Erro ao carregar dados</td></tr>';
        document.getElementById('fin-ultimos-pagamentos').innerHTML = '<tr><td colspan="6" style="text-align: center; color: red;">Erro ao carregar dados</td></tr>';
    }
}

// Carregar Logs (página completa de logs)
async function carregarLogs() {
    
    const token = localStorage.getItem('token');
    
    try {
        const response = await fetch(`${API_URL}/admin/logs?limite=100`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Erro ao carregar logs');
        }

        const data = await response.json();
        
        const logs = data.logs || data || [];
        
        
        const tbody = document.getElementById('lista-logs');
        if (!tbody) {
            console.error('❌ Elemento lista-logs não encontrado!');
            return;
        }
        
        if (!Array.isArray(logs) || logs.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align: center;">Nenhum log encontrado</td></tr>';
            return;
        }

        tbody.innerHTML = logs.map(log => `
            <tr>
                <td>${formatarDataHora(log.createdAt)}</td>
                <td>${log.usuario?.nome || 'Sistema'}</td>
                <td><span class="badge badge-info">${log.acao}</span></td>
                <td>${log.descricao || '-'}</td>
                <td><span class="badge ${getBadgeNivel(log.nivel)}">${log.nivel}</span></td>
            </tr>
        `).join('');
        
    } catch (error) {
        console.error('Erro ao carregar logs:', error);
        document.getElementById('lista-logs').innerHTML = 
            '<tr><td colspan="5" style="text-align: center; color: #dc2626;">Erro ao carregar logs</td></tr>';
    }
}

// Funções auxiliares
function formatarData(data) {
    if (!data) return '-';
    return new Date(data).toLocaleDateString('pt-BR');
}

function formatarDataHora(data) {
    if (!data) return '-';
    return new Date(data).toLocaleString('pt-BR');
}

function formatarMoeda(valor) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(valor || 0);
}

function getBadgeLicenca(tipo) {
    const badges = {
        'TRIAL': 'badge-warning',
        'MENSAL': 'badge-info',
        'ANUAL': 'badge-success',
        'VITALICIA': 'badge-success'
    };
    return badges[tipo] || 'badge-danger';
}

function getBadgeStatusPagamento(status) {
    const badges = {
        'pendente': 'badge-warning',
        'processando': 'badge-info',
        'aprovado': 'badge-success',
        'recusado': 'badge-danger',
        'cancelado': 'badge-danger'
    };
    return badges[status] || 'badge-info';
}

function getBadgeNivel(nivel) {
    const badges = {
        'info': 'badge-info',
        'warning': 'badge-warning',
        'error': 'badge-danger',
        'success': 'badge-success'
    };
    return badges[nivel] || 'badge-info';
}

// ══════════════════════════════════════════════════════
//  PLANOS DE VENDA
// ══════════════════════════════════════════════════════

let _planoEditandoId = null;

async function carregarPlanos() {
    const token = localStorage.getItem('token');
    const tbody = document.getElementById('lista-planos');
    tbody.innerHTML = '<tr><td colspan="9" class="loading"><div class="spinner"></div> Carregando...</td></tr>';
    try {
        const resp = await fetch(`${API_URL}/planos/admin/todos`, { headers: { 'Authorization': `Bearer ${token}` } });
        const data = await resp.json();
        if (!data.success) throw new Error(data.message);
        const planos = data.planos;
        if (!planos.length) {
            tbody.innerHTML = '<tr><td colspan="9" style="text-align:center;padding:20px;color:#6b7280;">Nenhum plano cadastrado. Crie o primeiro!</td></tr>';
            return;
        }
        tbody.innerHTML = planos.map(p => `
            <tr>
                <td>${p.ordem}</td>
                <td><strong>${p.icone || ''} ${p.nome}</strong><br><small style="color:#6b7280">${p.subtitulo || ''}</small></td>
                <td><span class="badge ${p.tipo === 'limpo' ? 'badge-info' : 'badge-success'}">${p.tipo === 'limpo' ? 'Limpo' : 'Com Templates'}</span></td>
                <td><strong>R$ ${Number(p.preco).toFixed(2)}</strong></td>
                <td>${p.maxParcelas}x de R$ ${Number(p.preco / p.maxParcelas).toFixed(2)}</td>
                <td>${(p.templatesCertificado?.length || 0)} certif. + ${(p.templatesHistorico?.length || 0)} hist.</td>
                <td>${p.validadeDias} dias</td>
                <td><span class="badge ${p.ativo ? 'badge-success' : 'badge-danger'}">${p.ativo ? 'Ativo' : 'Inativo'}</span>${p.destaque ? ' <span class="badge badge-warning">⭐ Destaque</span>' : ''}</td>
                <td>
                    <button class="btn btn-sm" onclick="editarPlano('${p._id}')">✏️ Editar</button>
                    <button class="btn btn-sm" style="background:#dc2626;color:#fff" onclick="excluirPlano('${p._id}','${p.nome}')">🗑️</button>
                </td>
            </tr>`).join('');
    } catch (err) {
        tbody.innerHTML = `<tr><td colspan="9" style="color:#dc2626;padding:20px;">${err.message}</td></tr>`;
    }
}

function abrirModalPlano(plano = null) {
    _planoEditandoId = plano?._id || null;
    const titulo = plano ? 'Editar Plano' : 'Novo Plano de Venda';
    const p = plano || {};
    const rec = p.recursos || {};

    const html = `
    <div id="modalPlano" style="position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:9999;display:flex;align-items:center;justify-content:center;padding:16px;" onclick="if(event.target===this)fecharModalPlano()">
      <div style="background:#fff;border-radius:16px;padding:28px 32px;max-width:680px;width:100%;max-height:90vh;overflow-y:auto;box-shadow:0 20px 60px rgba(0,0,0,.3)">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px">
          <h2 style="margin:0;color:#1e3a8a">${titulo}</h2>
          <button onclick="fecharModalPlano()" style="background:none;border:none;font-size:22px;cursor:pointer">×</button>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px">
          <div>
            <label style="font-size:13px;font-weight:600;color:#374151">Ícone</label>
            <input id="pIcone" class="form-control" value="${p.icone || '🎓'}" style="font-size:20px;text-align:center">
          </div>
          <div>
            <label style="font-size:13px;font-weight:600;color:#374151">Ordem de exibição</label>
            <input id="pOrdem" type="number" class="form-control" value="${p.ordem ?? 0}">
          </div>
          <div style="grid-column:1/-1">
            <label style="font-size:13px;font-weight:600;color:#374151">Nome do Plano *</label>
            <input id="pNome" class="form-control" placeholder="Ex: Plano Básico" value="${p.nome || ''}">
          </div>
          <div style="grid-column:1/-1">
            <label style="font-size:13px;font-weight:600;color:#374151">Subtítulo</label>
            <input id="pSubtitulo" class="form-control" placeholder="Ex: Ideal para começar" value="${p.subtitulo || ''}">
          </div>
          <div style="grid-column:1/-1">
            <label style="font-size:13px;font-weight:600;color:#374151">Descrição (aparece na vitrine)</label>
            <textarea id="pDescricao" class="form-control" rows="2" placeholder="O que está incluído neste plano...">${p.descricao || ''}</textarea>
          </div>
          <div>
            <label style="font-size:13px;font-weight:600;color:#374151">Tipo *</label>
            <select id="pTipo" class="form-control" onchange="toggleCamposCredito()">
              <option value="limpo" ${p.tipo === 'limpo' ? 'selected' : ''}>Limpo (sem templates)</option>
              <option value="com-templates" ${p.tipo === 'com-templates' ? 'selected' : ''}>Com Templates prontos</option>
              <option value="creditos" ${p.tipo === 'creditos' ? 'selected' : ''}>📦 Pacote de Créditos</option>
            </select>
          </div>
          <div>
            <label style="font-size:13px;font-weight:600;color:#374151">Tipo de Licença</label>
            <select id="pTipoLic" class="form-control">
              <option value="mensal" ${p.tipoLicenca === 'mensal' ? 'selected' : ''}>Mensal</option>
              <option value="anual" ${p.tipoLicenca === 'anual' ? 'selected' : ''}>Anual</option>
              <option value="vitalicia" ${p.tipoLicenca === 'vitalicia' ? 'selected' : ''}>Vitalícia</option>
            </select>
          </div>
          <div>
            <label style="font-size:13px;font-weight:600;color:#374151">Preço à vista (R$) *</label>
            <input id="pPreco" type="number" step="0.01" class="form-control" placeholder="0.00" value="${p.preco ?? ''}">
          </div>
          <div>
            <label style="font-size:13px;font-weight:600;color:#374151">Máximo de parcelas</label>
            <select id="pParcelas" class="form-control">
              ${[1,2,3,4,5,6,10,12].map(n => `<option value="${n}" ${p.maxParcelas === n ? 'selected' : ''}>${n}x</option>`).join('')}
            </select>
          </div>
          <div>
            <label style="font-size:13px;font-weight:600;color:#374151">Validade (dias)</label>
            <input id="pValidade" type="number" class="form-control" value="${p.validadeDias ?? 365}">
          </div>
          <div>
            <label style="font-size:13px;font-weight:600;color:#374151">Cor do card na vitrine</label>
            <input id="pCor" type="color" class="form-control" style="height:40px" value="${p.corDestaque || '#1e40af'}">
          </div>
        </div>

        <div id="camposCredito" style="${p.tipo === 'creditos' ? '' : 'display:none'};margin-top:14px;padding:14px;background:#f5f3ff;border-radius:10px;border:1px solid #c4b5fd">
          <strong style="font-size:13px;color:#5b21b6">📦 Configuração do Pacote</strong>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:10px">
            <div>
              <label style="font-size:13px;font-weight:600;color:#374151">Quantidade de Créditos</label>
              <input id="pQtdCreditos" type="number" class="form-control" min="1" value="${p.quantidadeCreditos ?? 50}" placeholder="Ex: 50">
            </div>
            <div>
              <label style="font-size:13px;font-weight:600;color:#374151">Tipo de Crédito</label>
              <select id="pSubtipoCredito" class="form-control">
                <option value="certificados" ${p.subtipoCredito === 'certificados' ? 'selected' : ''}>📜 Certificados</option>
                <option value="historicos" ${p.subtipoCredito === 'historicos' ? 'selected' : ''}>📋 Históricos</option>
                <option value="ambos" ${p.subtipoCredito === 'ambos' ? 'selected' : ''}>📦 Ambos (certificados + históricos)</option>
              </select>
            </div>
          </div>
        </div>

        <div id="camposRecursos" style="${p.tipo === 'creditos' ? 'display:none' : ''};margin-top:18px;padding:14px;background:#f8fafc;border-radius:10px;border:1px solid #e2e8f0">
          <strong style="font-size:13px;color:#374151">Recursos incluídos</strong>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:10px">
            <label style="display:flex;gap:8px;align-items:center;font-size:13px"><input type="checkbox" id="rCertif" ${rec.certificados !== false ? 'checked' : ''}> Certificados</label>
            <label style="display:flex;gap:8px;align-items:center;font-size:13px"><input type="checkbox" id="rHistorico" ${rec.historicos ? 'checked' : ''}> Históricos Escolares</label>
            <label style="display:flex;gap:8px;align-items:center;font-size:13px"><input type="checkbox" id="rMultiTempl" ${rec.multiplosTemplates ? 'checked' : ''}> Múltiplos Templates</label>
            <label style="display:flex;gap:8px;align-items:center;font-size:13px"><input type="checkbox" id="rMarcaDagua" ${rec.marcaDagua ? 'checked' : ''}> Marca d'água</label>
            <div style="display:flex;gap:8px;align-items:center;font-size:13px">
              Sub-usuários: <input type="number" id="rSubUsers" class="form-control" style="width:70px" value="${rec.subUsuarios ?? 0}" min="0">
            </div>
            <div style="display:flex;gap:8px;align-items:center;font-size:13px">
              Limite certif.: <input type="number" id="rLimite" class="form-control" style="width:90px" value="${rec.limiteCertificados ?? -1}" min="-1" title="-1 = ilimitado">
            </div>
          </div>
        </div>

        <div style="margin-top:14px;display:flex;gap:8px;align-items:center">
          <label style="display:flex;gap:8px;align-items:center;font-size:13px"><input type="checkbox" id="pAtivo" ${p.ativo !== false ? 'checked' : ''}> Ativo (visível na vitrine)</label>
          <label style="display:flex;gap:8px;align-items:center;font-size:13px"><input type="checkbox" id="pDestaque" ${p.destaque ? 'checked' : ''}> ⭐ Destaque (badge "Mais Popular")</label>
        </div>

        <div style="margin-top:18px;display:flex;gap:10px;justify-content:flex-end">
          <button onclick="fecharModalPlano()" class="btn" style="background:#f1f5f9;color:#374151">Cancelar</button>
          <button onclick="salvarPlano()" class="btn btn-primary">💾 Salvar Plano</button>
        </div>
      </div>
    </div>`;
    document.body.insertAdjacentHTML('beforeend', html);
}

function fecharModalPlano() {
    document.getElementById('modalPlano')?.remove();
    _planoEditandoId = null;
}

async function editarPlano(id) {
    const token = localStorage.getItem('token');
    try {
        const resp = await fetch(`${API_URL}/planos/admin/todos`, { headers: { 'Authorization': `Bearer ${token}` } });
        const data = await resp.json();
        const plano = data.planos.find(p => p._id === id);
        if (plano) abrirModalPlano(plano);
    } catch (err) {
        alert('Erro ao carregar plano: ' + err.message);
    }
}

async function salvarPlano() {
    const token = localStorage.getItem('token');
    const body = {
        nome: document.getElementById('pNome').value.trim(),
        subtitulo: document.getElementById('pSubtitulo').value.trim(),
        descricao: document.getElementById('pDescricao').value.trim(),
        icone: document.getElementById('pIcone').value.trim(),
        tipo: document.getElementById('pTipo').value,
        tipoLicenca: document.getElementById('pTipoLic').value,
        preco: parseFloat(document.getElementById('pPreco').value) || 0,
        maxParcelas: parseInt(document.getElementById('pParcelas').value) || 1,
        validadeDias: parseInt(document.getElementById('pValidade').value) || 365,
        corDestaque: document.getElementById('pCor').value,
        ordem: parseInt(document.getElementById('pOrdem').value) || 0,
        ativo: document.getElementById('pAtivo').checked,
        destaque: document.getElementById('pDestaque').checked,
        recursos: {
            certificados: document.getElementById('rCertif').checked,
            historicos: document.getElementById('rHistorico').checked,
            multiplosTemplates: document.getElementById('rMultiTempl').checked,
            marcaDagua: document.getElementById('rMarcaDagua').checked,
            subUsuarios: parseInt(document.getElementById('rSubUsers').value) || 0,
            limiteCertificados: parseInt(document.getElementById('rLimite').value) ?? -1,
            exportacaoPDF: true,
            templatesCustomizados: true
        }
    };

    if (!body.nome) return alert('Informe o nome do plano.');
    if (body.preco <= 0) return alert('Informe um preço válido.');

    const url = _planoEditandoId ? `${API_URL}/planos/admin/${_planoEditandoId}` : `${API_URL}/planos/admin`;
    const method = _planoEditandoId ? 'PUT' : 'POST';

    try {
        const resp = await fetch(url, {
            method,
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
        const data = await resp.json();
        if (!data.success) throw new Error(data.message || data.error);
        fecharModalPlano();
        carregarPlanos();
        alert(data.message || 'Plano salvo!');
    } catch (err) {
        alert('Erro ao salvar plano: ' + err.message);
    }
}

async function excluirPlano(id, nome) {
    if (!confirm(`Excluir o plano "${nome}"? Esta ação não pode ser desfeita.`)) return;
    const token = localStorage.getItem('token');
    try {
        const resp = await fetch(`${API_URL}/planos/admin/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await resp.json();
        if (!data.success) throw new Error(data.message);
        carregarPlanos();
        alert('Plano excluído.');
    } catch (err) {
        alert('Erro ao excluir: ' + err.message);
    }
}

// Inicializar
document.addEventListener('DOMContentLoaded', () => {
    configurarNavegacao();
    configurarBuscaCliente();
    verificarAuth();
});

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
                <td>${cliente.nome}</td>
                <td>${cliente.email}</td>
                <td>${cliente.instituicao || '-'}</td>
                <td><span class="badge ${getBadgeLicenca(cliente.licenca?.tipo)}">${cliente.licenca?.tipo || 'Nenhuma'}</span></td>
                <td><span class="badge ${cliente.ativo ? 'badge-success' : 'badge-danger'}">${cliente.ativo ? 'Ativo' : 'Inativo'}</span></td>
                <td>${formatarData(cliente.createdAt)}</td>
                <td class="action-btns">
                    <button class="btn btn-primary btn-sm" onclick="verDetalhesCliente('${cliente._id}')">Ver</button>
                    <button class="btn btn-warning btn-sm" onclick="resetarSenhaCliente('${cliente._id}', '${cliente.email}')">🔑 Resetar Senha</button>
                    <button class="btn btn-sm ${cliente.ativo ? 'badge-danger' : 'badge-success'}" 
                            onclick="toggleStatusCliente('${cliente._id}', ${!cliente.ativo})">
                        ${cliente.ativo ? 'Desativar' : 'Ativar'}
                    </button>
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
                <td><span class="badge ${expirada ? 'badge-danger' : licenca.ativa ? 'badge-success' : 'badge-warning'}">
                    ${expirada ? 'Expirada' : licenca.ativa ? 'Ativa' : 'Inativa'}
                </span></td>
                <td>
                    ${formatarData(licenca.dataExpiracao)}
                    ${!expirada ? `<br><small style="color: ${diasRestantes <= 7 ? '#dc2626' : '#6b7280'};">(${diasRestantes} dias)</small>` : ''}
                </td>
                <td>${licenca.limiteCertificados !== null ? licenca.limiteCertificados : '∞'}</td>
                <td class="action-btns">
                    <button class="btn btn-primary btn-sm" onclick="renovarLicenca('${cliente._id}')">Renovar</button>
                    <button class="btn btn-warning btn-sm" onclick="editarLicenca('${cliente._id}')">Editar</button>
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

// Renovar licença
async function renovarLicenca(clienteId) {
    alert('Funcionalidade de renovação em desenvolvimento.\nEm breve você poderá renovar licenças diretamente por aqui!');
}

// Editar licença
async function editarLicenca(clienteId) {
    alert('Funcionalidade de edição em desenvolvimento.\nEm breve você poderá editar licenças diretamente por aqui!');
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
Status: ${cliente.licenca?.ativa ? 'Ativa' : 'Inativa'}
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

        tbody.innerHTML = notas.map(nota => `
            <tr>
                <td>${nota.numero}</td>
                <td>${formatarData(nota.dataEmissao)}</td>
                <td>${nota.tomador?.nome || '-'}</td>
                <td>${formatarMoeda(nota.valorTotal)}</td>
                <td><span class="badge ${nota.cancelada ? 'badge-danger' : 'badge-success'}">
                    ${nota.cancelada ? 'Cancelada' : 'Emitida'}
                </span></td>
                <td class="action-btns">
                    <button class="btn btn-primary btn-sm" onclick="verNotaFiscal('${nota._id}')">Ver</button>
                    ${!nota.cancelada ? `
                        <button class="btn badge-danger btn-sm" onclick="cancelarNota('${nota._id}')">Cancelar</button>
                    ` : ''}
                </td>
            </tr>
        `).join('');
        
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
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Erro ao carregar nota fiscal');
        }

        const nota = await response.json();
        
        alert(`
NOTA FISCAL Nº ${nota.numero}

Data de Emissão: ${formatarDataHora(nota.dataEmissão)}

PRESTADOR:
${nota.prestador.nome}
CNPJ: ${nota.prestador.cnpj}

TOMADOR:
${nota.tomador.nome}
CPF/CNPJ: ${nota.tomador.cpfCnpj}

VALORES:
Serviços: ${formatarMoeda(nota.valorServicos)}
Descontos: ${formatarMoeda(nota.descontos)}
Total: ${formatarMoeda(nota.valorTotal)}

IMPOSTOS:
ISS: ${formatarMoeda(nota.impostos.iss)}
PIS: ${formatarMoeda(nota.impostos.pis)}
COFINS: ${formatarMoeda(nota.impostos.cofins)}

Status: ${nota.cancelada ? 'CANCELADA' : 'EMITIDA'}
        `);
        
    } catch (error) {
        console.error('Erro ao carregar nota fiscal:', error);
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

// Inicializar
document.addEventListener('DOMContentLoaded', () => {
    configurarNavegacao();
    configurarBuscaCliente();
    verificarAuth();
});

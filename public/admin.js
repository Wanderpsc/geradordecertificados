// Admin Panel JavaScript
const API_URL = 'http://localhost:5000/api';

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
        
        // Carregar dashboard
        carregarDashboard();
        
    } catch (error) {
        console.error('Erro de autenticação:', error);
        localStorage.removeItem('token');
        window.location.href = 'login.html';
    }
}

// Logout
function logout() {
    if (confirm('Deseja realmente sair?')) {
        localStorage.removeItem('token');
        window.location.href = 'login.html';
    }
}

// Navegação entre páginas
document.querySelectorAll('.nav-menu a').forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        
        // Remover active de todos
        document.querySelectorAll('.nav-menu a').forEach(l => l.classList.remove('active'));
        
        // Adicionar active ao clicado
        link.classList.add('active');
        
        // Esconder todas as páginas
        document.querySelectorAll('.page').forEach(p => p.classList.add('hidden'));
        
        // Mostrar página selecionada
        const page = link.dataset.page;
        document.getElementById(`page-${page}`).classList.remove('hidden');
        
        // Carregar dados da página
        switch(page) {
            case 'dashboard':
                carregarDashboard();
                break;
            case 'clientes':
                carregarClientes();
                break;
            case 'pagamentos':
                carregarPagamentos();
                break;
            case 'notas-fiscais':
                carregarNotasFiscais();
                break;
            case 'financeiro':
                carregarFinanceiro();
                break;
        }
    });
});

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
        
        // Atualizar estatísticas
        document.getElementById('stat-clientes').textContent = data.totalUsuarios || 0;
        document.getElementById('stat-novos-clientes').textContent = data.usuariosAtivos || 0;
        document.getElementById('stat-licencas').textContent = data.totalLicencas || 0;
        document.getElementById('stat-licencas-pagas').textContent = data.licencasPagas || 0;
        document.getElementById('stat-receita').textContent = 
            formatarMoeda(data.receitaMensal || 0);
        document.getElementById('stat-receita-anual').textContent = 
            formatarMoeda(data.receitaAnual || 0).replace('R$ ', '');
        document.getElementById('stat-notas').textContent = data.totalNotasFiscais || 0;
        document.getElementById('stat-notas-mes').textContent = data.notasFiscaisMes || 0;

        // Carregar últimas atividades (logs)
        carregarUltimasAtividades();
        
    } catch (error) {
        console.error('Erro ao carregar dashboard:', error);
        alert('Erro ao carregar dados do dashboard');
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

        const logs = await response.json();
        
        const tbody = document.getElementById('ultimas-atividades');
        
        if (logs.length === 0) {
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
        const clientes = data.usuarios || [];
        
        const tbody = document.getElementById('lista-clientes');
        
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

// Busca de clientes
document.getElementById('busca-cliente')?.addEventListener('input', (e) => {
    const busca = e.target.value;
    carregarClientes(busca);
});

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
        
        alert(`
DETALHES DO CLIENTE

Nome: ${data.usuario.nome}
Email: ${data.usuario.email}
Instituição: ${data.usuario.instituicao || '-'}
CPF/CNPJ: ${data.usuario.cpf || data.usuario.cnpj || '-'}
Telefone: ${data.usuario.telefone || '-'}

LICENÇA ATUAL:
Tipo: ${data.licenca?.tipo || 'Nenhuma'}
Status: ${data.licenca?.ativa ? 'Ativa' : 'Inativa'}
Validade: ${data.licenca?.dataExpiracao ? formatarData(data.licenca.dataExpiracao) : '-'}
Certificados Gerados: ${data.totalCertificados || 0}

ESTATÍSTICAS:
Total de Alunos: ${data.totalAlunos || 0}
Total de Certificados: ${data.totalCertificados || 0}
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
document.addEventListener('DOMContentLoaded', verificarAuth);

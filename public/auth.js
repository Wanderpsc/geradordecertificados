// Detectar ambiente automaticamente
const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:5000/api'
    : 'https://gerador-certificados.onrender.com/api';

function switchTab(tab) {
    const tabs = document.querySelectorAll('.tab-login button');
    const forms = document.querySelectorAll('.form-login');
    
    tabs.forEach(btn => btn.classList.remove('active'));
    forms.forEach(form => form.classList.remove('active'));
    
    if (tab === 'login') {
        tabs[0].classList.add('active');
        document.getElementById('formLogin').classList.add('active');
    } else {
        tabs[1].classList.add('active');
        document.getElementById('formRegister').classList.add('active');
    }
    
    hideMessages();
}

function showError(message) {
    const errorDiv = document.getElementById('errorMessage');
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
    setTimeout(() => errorDiv.style.display = 'none', 5000);
}

function showSuccess(message) {
    const successDiv = document.getElementById('successMessage');
    successDiv.textContent = message;
    successDiv.style.display = 'block';
    setTimeout(() => successDiv.style.display = 'none', 5000);
}

function hideMessages() {
    document.getElementById('errorMessage').style.display = 'none';
    document.getElementById('successMessage').style.display = 'none';
}

// Login
document.getElementById('formLogin').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const senha = document.getElementById('loginSenha').value;
    
    const form = e.target;
    form.classList.add('loading');
    
    try {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, senha })
        });
        
        const data = await response.json();
        
        if (data.success) {
            localStorage.setItem('token', data.token);
            localStorage.setItem('usuario', JSON.stringify(data.usuario));
            if (data.licenca) {
                localStorage.setItem('licenca', JSON.stringify(data.licenca));
            }
            showSuccess('Login realizado com sucesso!');
            setTimeout(() => {
                // Redirecionar baseado no role
                if (data.usuario.role === 'admin') {
                    window.location.href = 'admin.html';
                } else {
                    window.location.href = 'index.html';
                }
            }, 1000);
        } else {
            showError(data.message || 'Erro ao fazer login');
        }
    } catch (error) {
        showError('Erro ao conectar com o servidor. Verifique se o servidor está rodando.');
    } finally {
        form.classList.remove('loading');
    }
});

// Registro
document.getElementById('formRegister').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const nome = document.getElementById('registerNome').value;
    const email = document.getElementById('registerEmail').value;
    const senha = document.getElementById('registerSenha').value;
    const instituicao = document.getElementById('registerInstituicao').value;
    const telefone = document.getElementById('registerTelefone').value;
    const aceitouTermos = document.getElementById('aceitarTermos').checked;
    const planoSelecionado = document.querySelector('input[name="plano"]:checked').value;
    
    // Validar aceite dos termos
    if (!aceitouTermos) {
        showError('Você deve aceitar os Termos de Uso e Licença para continuar.');
        return;
    }
    
    const form = e.target;
    form.classList.add('loading');
    
    try {
        const response = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
                nome, 
                email, 
                senha, 
                instituicao, 
                telefone, 
                aceitouTermos,
                planoEscolhido: planoSelecionado 
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            localStorage.setItem('token', data.token);
            localStorage.setItem('usuario', JSON.stringify(data.usuario));
            if (data.licenca) {
                localStorage.setItem('licenca', JSON.stringify(data.licenca));
            }
            showSuccess('Conta criada com sucesso! Redirecionando...');
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1500);
        } else {
            showError(data.message || 'Erro ao criar conta');
        }
    } catch (error) {
        showError('Erro ao conectar com o servidor. Verifique se o servidor está rodando.');
    } finally {
        form.classList.remove('loading');
    }
});

// Verificar se já está logado (somente se tiver token válido)
const token = localStorage.getItem('token');
const usuarioLogado = localStorage.getItem('usuario');
if (token && usuarioLogado) {
    const usuario = JSON.parse(usuarioLogado);
    // Redirecionar baseado no role
    if (usuario.role === 'admin') {
        window.location.href = 'admin.html';
    } else {
        window.location.href = 'index.html';
    }
}

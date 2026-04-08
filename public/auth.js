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
    setTimeout(() => errorDiv.style.display = 'none', 8000);
}

function showWakeBanner(visible) {
    const b = document.getElementById('wakeBanner');
    if (b) b.style.display = visible ? 'block' : 'none';
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
                const returnTo = new URLSearchParams(location.search).get('returnTo');
                if (returnTo && returnTo.startsWith('/')) {
                    window.location.href = returnTo;
                } else if (data.usuario.role === 'admin') {
                    window.location.href = 'admin.html';
                } else {
                    window.location.href = 'index.html';
                }
            }, 1000);
        } else {
            showError(data.message || 'Erro ao fazer login');
        }
    } catch (error) {
        // Mostrar banner de "servidor acordando" e tentar novamente em 5s
        showWakeBanner(true);
        document.getElementById('errorMessage').style.display = 'none';
        const btn = form.querySelector('button[type=submit]');
        if (btn) btn.disabled = true;
        setTimeout(async () => {
            showWakeBanner(false);
            if (btn) btn.disabled = false;
            form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
        }, 7000);
    } finally {
        form.classList.remove('loading');
    }
});

// Registro handler
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
                const returnTo = new URLSearchParams(location.search).get('returnTo');
                if (returnTo && returnTo.startsWith('/')) {
                    window.location.href = returnTo;
                } else {
                    window.location.href = 'index.html';
                }
            }, 1500);
        } else {
            showError(data.message || 'Erro ao criar conta');
        }
    } catch (error) {
        showWakeBanner(true);
        document.getElementById('errorMessage').style.display = 'none';
        const btn = form.querySelector('button[type=submit]');
        if (btn) btn.disabled = true;
        setTimeout(() => {
            showWakeBanner(false);
            if (btn) btn.disabled = false;
            form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
        }, 7000);
    } finally {
        form.classList.remove('loading');
    }
});

// ── Ping prévio ao servidor (acordar Render free tier) ─────────────────────
(function pingServidor() {
    // Se estiver rodando local, não precisa de ping
    if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') return;
    fetch(`${API_URL}/auth/ping`, { method: 'GET', signal: AbortSignal.timeout(3000) })
        .catch(() => {
            // Servidor dormindo — mostrar banner por 5s, ele vai acordar sozinho
            showWakeBanner(true);
            setTimeout(() => showWakeBanner(false), 15000);
        });
})()

// Verificar se já está logado (somente se tiver token válido)
const token = localStorage.getItem('token');
const usuarioLogado = localStorage.getItem('usuario');
if (token && usuarioLogado) {
    const usuario = JSON.parse(usuarioLogado);
    const returnTo = new URLSearchParams(location.search).get('returnTo');
    if (returnTo && returnTo.startsWith('/')) {
        window.location.href = returnTo;
    } else if (usuario.role === 'admin') {
        window.location.href = 'admin.html';
    } else {
        window.location.href = 'index.html';
    }
}

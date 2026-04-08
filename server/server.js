/**
 * GERADOR DE CERTIFICADOS PROFISSIONAL - SERVIDOR
 * © 2026 Wander Pires Silva Coelho (wanderpsc@gmail.com)
 * Todos os direitos reservados. Software proprietário.
 * Protegido por Lei 9.610/98, Lei 9.609/98 e Art. 184 CP.
 * Reprodução, cópia ou engenharia reversa proibidas.
 */
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/database');

// Rotas
const authRoutes = require('./routes/auth');
const alunoRoutes = require('./routes/alunos');
const licenseRoutes = require('./routes/licenses');
const adminRoutes = require('./routes/admin');
const modeloRoutes = require('./routes/modelos');
const subUsuarioRoutes = require('./routes/subUsuarios');
const historicoRoutes = require('./routes/historicos');
const planoRoutes = require('./routes/planos');
const pagamentosMPRoutes = require('./routes/pagamentosMP');

const app = express();

// Conectar ao banco de dados
connectDB();

// Middlewares
app.use(cors({
    origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : '*',
    credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Headers de segurança e anti-plágio
app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    res.setHeader('X-Powered-By', 'Proprietary');
    res.setHeader('X-Copyright', '© 2026 Wander Pires Silva Coelho. Todos os direitos reservados.');
    res.removeHeader('X-Powered-By');
    next();
});

// Servir arquivos estáticos com headers anti-cache para HTML e JS
app.use(express.static(path.join(__dirname, '../public'), {
    setHeaders: (res, filePath) => {
        if (filePath.endsWith('.html') || filePath.endsWith('.js') || filePath.endsWith('.css')) {
            res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
            res.setHeader('Pragma', 'no-cache');
            res.setHeader('Expires', '0');
        }
    }
}));

// Endpoint para forçar limpeza do service worker (acessível direto pelo navegador)
app.get('/limpar-cache', (req, res) => {
    res.send(`<!DOCTYPE html><html><head><title>Limpando cache...</title></head><body>
<h2>Limpando cache e service worker...</h2><p id="status">Aguarde...</p>
<script>
(async()=>{
  const s=document.getElementById('status');
  try{
    if('serviceWorker' in navigator){
      const regs=await navigator.serviceWorker.getRegistrations();
      for(const r of regs){await r.unregister();}
      s.textContent='Service workers removidos: '+regs.length;
      const keys=await caches.keys();
      for(const k of keys){await caches.delete(k);}
      s.textContent+=' | Caches removidos: '+keys.length;
    }
    s.textContent+=' | Limpeza concluída! Redirecionando...';
    setTimeout(()=>window.location.replace('/index.html?v='+Date.now()),1500);
  }catch(e){s.textContent='Erro: '+e.message;}
})();
</script></body></html>`);
});

// Página de diagnóstico completa
app.get('/diagnostico', (req, res) => {
    res.send(`<!DOCTYPE html><html><head><title>Diagnóstico do Sistema</title>
<style>body{font-family:Arial;max-width:700px;margin:40px auto;padding:20px;background:#f8fafc;}
.box{background:white;border-radius:12px;padding:20px;margin:12px 0;box-shadow:0 1px 3px rgba(0,0,0,.1);}
.ok{color:#16a34a;font-weight:bold;} .err{color:#dc2626;font-weight:bold;} .warn{color:#f59e0b;font-weight:bold;}
pre{background:#f1f5f9;padding:10px;border-radius:8px;overflow-x:auto;font-size:12px;}
button{background:#3b82f6;color:white;border:none;padding:10px 20px;border-radius:8px;cursor:pointer;font-size:14px;margin:4px;}
button:hover{background:#2563eb;} button.red{background:#dc2626;} button.red:hover{background:#b91c1c;}</style></head>
<body><h1>🔍 Diagnóstico do Sistema</h1>
<div class="box" id="auth"><h3>1. Autenticação</h3><p>Verificando...</p></div>
<div class="box" id="modelos"><h3>2. Modelos Salvos</h3><p>Verificando...</p></div>
<div class="box" id="cache"><h3>3. Cache / Service Worker</h3><p>Verificando...</p></div>
<div class="box" id="acoes"><h3>4. Ações</h3>
<button onclick="limparCacheCompleto()">🧹 Limpar Cache Completo</button>
<button onclick="relogar()">🔄 Forçar Re-login</button>
<button class="red" onclick="restaurarModelos()">📦 Restaurar Modelos Arquivados</button>
</div>
<script>
const API_URL = '/api';
const token = localStorage.getItem('token');
const usuario = JSON.parse(localStorage.getItem('usuario') || 'null');

// 1. Auth
(function(){
  const el = document.getElementById('auth');
  if(!token){el.innerHTML='<h3>1. Autenticação</h3><p class="err">❌ Sem token. Você não está logado.</p>';return;}
  let html='<h3>1. Autenticação</h3>';
  if(usuario){
    html+='<p class="ok">✅ Logado como: <strong>'+usuario.nome+'</strong> ('+usuario.email+')</p>';
    html+='<p>Tipo: <strong>'+(usuario.tipo||'N/A')+'</strong> | Role: <strong>'+(usuario.role||'N/A')+'</strong></p>';
    if(usuario.tipo==='subUsuario') html+='<p class="warn">⚠️ Logado como SUB-USUÁRIO. O menu "Gerenciar Usuários" fica oculto para sub-usuários.</p>';
    else html+='<p class="ok">✅ Tipo "usuario" - Menu "Gerenciar Usuários" deveria estar visível.</p>';
  } else {
    html+='<p class="warn">⚠️ Token existe mas dados do usuário não estão no localStorage.</p>';
  }
  el.innerHTML=html;
})();

// 2. Modelos
(async function(){
  const el = document.getElementById('modelos');
  if(!token){el.innerHTML='<h3>2. Modelos</h3><p class="err">Faça login primeiro.</p>';return;}
  try{
    const resp=await fetch(API_URL+'/modelos/diagnostico',{headers:{'Authorization':'Bearer '+token}});
    const d=await resp.json();
    let html='<h3>2. Modelos Salvos</h3>';
    if(!d.success){html+='<p class="err">❌ Erro: '+(d.message||resp.status)+'</p>';el.innerHTML=html;return;}
    html+='<p>User ID no banco: <strong>'+d.userId+'</strong></p>';
    html+='<p>Total: <strong>'+d.total+'</strong> | Ativos: <span class="ok">'+d.ativos+'</span> | Arquivados: <span class="warn">'+d.arquivados+'</span></p>';
    if(d.modelos && d.modelos.length){
      html+='<pre>';
      d.modelos.forEach(m=>{html+=( m.arquivado?'📦':'✅')+' '+m.nome+' ('+new Date(m.criadoEm).toLocaleDateString('pt-BR')+')'+(m.arquivado?' [ARQUIVADO]':'')+String.fromCharCode(10);});
      html+='</pre>';
    }
    if(d.total===0) html+='<p class="err">❌ Nenhum modelo encontrado para este usuário no banco de dados.</p>';
    el.innerHTML=html;
  }catch(e){el.innerHTML='<h3>2. Modelos</h3><p class="err">Erro de conexão: '+e.message+'</p>';}
})();

// 3. Cache
(async function(){
  const el = document.getElementById('cache');
  let html='<h3>3. Cache / Service Worker</h3>';
  if('serviceWorker' in navigator){
    const regs=await navigator.serviceWorker.getRegistrations();
    html+='<p>Service Workers registrados: <strong>'+regs.length+'</strong></p>';
    const keys=await caches.keys();
    html+='<p>Caches ativos: <strong>'+keys.join(', ')||'nenhum'+'</strong></p>';
  } else {html+='<p>Service Worker não suportado.</p>';}
  el.innerHTML=html;
})();

async function limparCacheCompleto(){
  if('serviceWorker' in navigator){
    const regs=await navigator.serviceWorker.getRegistrations();
    for(const r of regs) await r.unregister();
    const keys=await caches.keys();
    for(const k of keys) await caches.delete(k);
  }
  alert('Cache limpo! A página vai recarregar.');
  location.reload(true);
}

function relogar(){
  localStorage.removeItem('token');
  localStorage.removeItem('usuario');
  localStorage.removeItem('licenca');
  window.location.replace('/login.html');
}

async function restaurarModelos(){
  if(!token){alert('Faça login primeiro.');return;}
  try{
    const resp=await fetch(API_URL+'/modelos?arquivado=true',{headers:{'Authorization':'Bearer '+token}});
    const d=await resp.json();
    if(!d.success||!d.modelos.length){alert('Nenhum modelo arquivado para restaurar.');return;}
    let restaurados=0;
    for(const m of d.modelos){
      const r=await fetch(API_URL+'/modelos/'+m._id+'/arquivar',{method:'PATCH',headers:{'Authorization':'Bearer '+token}});
      const rd=await r.json();
      if(rd.success) restaurados++;
    }
    alert('✅ '+restaurados+' modelo(s) restaurado(s)!');
    location.reload();
  }catch(e){alert('Erro: '+e.message);}
}
</script></body></html>`);
});

// Rotas da API
app.use('/api/auth', authRoutes);
app.use('/api/alunos', alunoRoutes);
app.use('/api/licenses', licenseRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/modelos', modeloRoutes);
app.use('/api/subusuarios', subUsuarioRoutes);
app.use('/api/historicos', historicoRoutes);
app.use('/api/planos', planoRoutes);
app.use('/api/pagamentos', pagamentosMPRoutes);

// Rota raiz - redirecionar para login
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/login.html'));
});

// Rotas amigáveis (sem .html)
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/login.html'));
});
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/admin.html'));
});
app.get('/app', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Tratamento de erros global
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ 
        success: false, 
        message: 'Erro interno do servidor',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// Iniciar servidor
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
    console.log(`📱 Acesse: http://localhost:${PORT}`);
});

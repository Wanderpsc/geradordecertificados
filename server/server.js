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

// Rotas da API
app.use('/api/auth', authRoutes);
app.use('/api/alunos', alunoRoutes);
app.use('/api/licenses', licenseRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/modelos', modeloRoutes);
app.use('/api/subusuarios', subUsuarioRoutes);

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

# 🚀 Deploy de Frontend Estático

Guia para fazer deploy apenas do **frontend** (arquivos HTML/CSS/JS) em plataformas gratuitas.

---

## ⚠️ Arquitetura do Sistema

Este sistema tem:
- **Frontend** (public/) → HTML, CSS, JavaScript
- **Backend** (server/) → Node.js, Express, API
- **Banco de Dados** → MongoDB

### Opções de Deploy

#### 1️⃣ Deploy Completo (Recomendado)
- **Backend + Frontend**: [Render.com](QUICK_DEPLOY.md)
- **Vantagem**: Tudo em um lugar
- **Custo**: Gratuito

#### 2️⃣ Deploy Separado
- **Frontend**: GitHub Pages ou Surge.sh
- **Backend**: Render.com
- **Vantagem**: Frontend em CDN (mais rápido)
- **Custo**: Gratuito

---

## 🌐 Opção 1: GitHub Pages

### Características
- ✅ Gratuito
- ✅ SSL incluído
- ✅ CDN global
- ✅ Deploy automático via Git
- ⚠️ Requer backend separado

### Deploy Rápido

```bash
# 1. Deploy backend no Render
# Ver: QUICK_DEPLOY.md

# 2. Atualizar URL do backend
# Editar public/auth.js:
const API_URL = 'https://seu-app.onrender.com/api';

# 3. Commit e push
git add .
git commit -m "Configurar para GitHub Pages"
git push origin main

# 4. Ativar GitHub Pages
# GitHub → Settings → Pages → Source: main → /public

# 5. Acessar
# https://seu-usuario.github.io/seu-repo/login.html
```

**Guia Completo**: [GITHUB_PAGES_DEPLOY.md](GITHUB_PAGES_DEPLOY.md)

---

## 🌊 Opção 2: Surge.sh

### Características
- ✅ Gratuito
- ✅ SSL incluído
- ✅ Deploy em 1 comando
- ✅ Domínio customizável
- ⚠️ Requer backend separado

### Deploy Rápido

```bash
# 1. Deploy backend no Render
# Ver: QUICK_DEPLOY.md

# 2. Instalar Surge
npm install -g surge

# 3. Atualizar URL backend
# Editar public/auth.js:
const API_URL = 'https://seu-app.onrender.com/api';

# 4. Deploy
cd public
surge

# 5. Acessar
# https://seu-dominio.surge.sh
```

**Guia Completo**: [SURGE_DEPLOY.md](SURGE_DEPLOY.md)

---

## 📊 Comparação

| | Render Completo | GitHub Pages | Surge.sh |
|--|:---------------:|:------------:|:--------:|
| **Frontend** | ✅ | ✅ | ✅ |
| **Backend** | ✅ | ❌ | ❌ |
| **Deploy** | Git push | Git push | 1 comando |
| **SSL** | ✅ | ✅ | ✅ |
| **CDN** | ❌ | ✅ | ✅ |
| **Domínio** | Customizável | `.github.io` | Customizável |
| **Custo** | Gratuito | Gratuito | Gratuito |

---

## 🎯 Qual Escolher?

### Use Render Completo se:
- ✅ Quer simplicidade
- ✅ Primeira vez com deploy
- ✅ Não se importa com CDN
- ✅ Quer tudo em um lugar

**Guia**: [QUICK_DEPLOY.md](QUICK_DEPLOY.md)

### Use GitHub Pages se:
- ✅ Já tem repositório no GitHub
- ✅ Quer deploy automático no Git push
- ✅ Quer CDN global
- ✅ Frontend vai ter muitos acessos

**Guia**: [GITHUB_PAGES_DEPLOY.md](GITHUB_PAGES_DEPLOY.md)

### Use Surge.sh se:
- ✅ Quer deploy super rápido
- ✅ Quer testar várias versões
- ✅ Precisa de staging/production
- ✅ Quer domínio customizado fácil

**Guia**: [SURGE_DEPLOY.md](SURGE_DEPLOY.md)

---

## 🔧 Configuração do Frontend

Para usar frontend separado, atualize os arquivos:

### 1. public/auth.js

```javascript
// Trocar de:
const API_URL = 'http://localhost:5000/api';

// Para:
const API_URL = 'https://seu-app.onrender.com/api';
```

### 2. public/app.js

Verificar se todas as chamadas usam `API_URL`:

```javascript
fetch(`${API_URL}/alunos`)
fetch(`${API_URL}/licenses/status`)
```

### 3. Configurar CORS no Backend

No Render, adicionar URL do frontend:

```env
# Para GitHub Pages
ALLOWED_ORIGINS=https://seu-usuario.github.io

# Para Surge
ALLOWED_ORIGINS=https://seu-dominio.surge.sh

# Para ambos
ALLOWED_ORIGINS=https://seu-usuario.github.io,https://seu-dominio.surge.sh
```

---

## 📝 Scripts NPM Úteis

Adicione ao `package.json`:

```json
{
  "scripts": {
    "deploy:surge": "cd public && surge",
    "deploy:gh-pages": "git subtree push --prefix public origin gh-pages"
  }
}
```

Uso:
```bash
npm run deploy:surge
npm run deploy:gh-pages
```

---

## ✅ Checklist de Deploy Frontend

- [ ] Backend deployado e funcionando
- [ ] URL do backend anotada
- [ ] `auth.js` e `app.js` atualizados
- [ ] CORS configurado no backend
- [ ] Plataforma escolhida (GitHub Pages ou Surge)
- [ ] Deploy do frontend realizado
- [ ] Site acessível e funcionando
- [ ] Login funciona
- [ ] API retorna dados

---

## 🎉 Resultado

### Arquitetura Final

```
┌─────────────────────────────────────┐
│   Frontend (GitHub Pages/Surge)    │
│   https://seu-dominio.com           │
│   - HTML, CSS, JavaScript           │
└──────────────┬──────────────────────┘
               │ API Calls
               ▼
┌─────────────────────────────────────┐
│   Backend (Render.com)              │
│   https://seu-app.onrender.com      │
│   - Node.js, Express                │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│   Banco de Dados (MongoDB Atlas)    │
│   - Armazenamento persistente       │
└─────────────────────────────────────┘
```

### Custos
- **Frontend**: R$ 0 (GitHub/Surge gratuito)
- **Backend**: R$ 0 (Render gratuito)
- **Banco**: R$ 0 (Atlas gratuito)
- **Total**: **R$ 0/mês** 🎉

---

## 🆘 Problemas Comuns

### CORS Error
**Causa**: Backend não permite origem do frontend  
**Solução**: Adicionar URL em `ALLOWED_ORIGINS` no Render

### API not found (404)
**Causa**: URL incorreta em `auth.js`  
**Solução**: Verificar URL do backend e atualizar

### Login não funciona
**Causa**: Backend não está rodando  
**Solução**: Verificar status no Render dashboard

### Site carrega mas não funciona
**Causa**: JavaScript com erro  
**Solução**: Abrir DevTools (F12) e ver console

---

## 💡 Dicas

### Desenvolvimento Local
Mantenha URL local para dev:
```javascript
const API_URL = window.location.hostname === 'localhost'
  ? 'http://localhost:5000/api'
  : 'https://seu-app.onrender.com/api';
```

### Múltiplos Ambientes
```javascript
const ENVIRONMENTS = {
  development: 'http://localhost:5000/api',
  staging: 'https://staging-app.onrender.com/api',
  production: 'https://app.onrender.com/api'
};

const API_URL = ENVIRONMENTS[process.env.NODE_ENV || 'production'];
```

---

## 📚 Guias Relacionados

- [QUICK_DEPLOY.md](QUICK_DEPLOY.md) - Deploy completo (tudo no Render)
- [GITHUB_PAGES_DEPLOY.md](GITHUB_PAGES_DEPLOY.md) - Frontend no GitHub
- [SURGE_DEPLOY.md](SURGE_DEPLOY.md) - Frontend no Surge
- [DEPLOY_GUIDE.md](DEPLOY_GUIDE.md) - Guia completo de todas opções

---

**Escolha sua plataforma e comece o deploy! 🚀**

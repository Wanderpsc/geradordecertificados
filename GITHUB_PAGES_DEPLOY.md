# 🚀 Deploy no GitHub Pages

## ⚠️ Importante

**GitHub Pages** hospeda apenas arquivos estáticos (HTML, CSS, JS). Para este sistema funcionar completamente:

- **Frontend** → GitHub Pages (gratuito)
- **Backend** → Render.com (gratuito)
- **Banco de Dados** → MongoDB Atlas (gratuito)

---

## 📋 Configuração Completa

### Passo 1: Deploy do Backend (Render.com)

Primeiro, faça o deploy do backend seguindo [QUICK_DEPLOY.md](QUICK_DEPLOY.md):

```bash
# Deploy backend no Render
# URL resultante: https://seu-app.onrender.com
```

**Anote a URL do backend!** Você vai precisar dela.

### Passo 2: Configurar Frontend para GitHub Pages

Atualize o arquivo `public/auth.js` com a URL do backend:

```javascript
// Trocar isso:
const API_URL = 'http://localhost:5000/api';

// Por isso:
const API_URL = 'https://seu-app.onrender.com/api';
```

### Passo 3: Criar Branch gh-pages

```bash
# Na pasta do projeto
cd "e:\1. Nova pasta\MEUS PROJETOS DE PROGRAMAÇÃO\GERADOR DE CERTIFICADOS E HISTÓRICOS ESCOLARES"

# Criar branch gh-pages
git checkout -b gh-pages

# Copiar apenas arquivos do frontend
git rm -rf server/
git rm -rf node_modules/
git rm -rf mongodb-data/
git rm *.js
git rm *.bat
git rm *.json
git rm .dockerignore
git rm Dockerfile
git rm Procfile
git rm *.sh
git rm render.yaml
git rm railway.json
git rm vercel.json

# Manter apenas pasta public e docs
git add public/
git add *.md
git commit -m "Deploy GitHub Pages"
git push origin gh-pages
```

### Passo 4: Ativar GitHub Pages

1. Acesse seu repositório no GitHub
2. **Settings** → **Pages**
3. **Source**: Deploy from a branch
4. **Branch**: `gh-pages` → `/` (root)
5. **Save**
6. Aguarde 2-3 minutos

### Passo 5: Acessar Site

URL: `https://seu-usuario.github.io/nome-repo/public/login.html`

---

## 🔧 Alternativa: Usar GitHub Actions

Crie `.github/workflows/deploy-pages.yml`:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Deploy to GitHub Pages
      uses: peaceiris/actions-gh-pages@v3
      with:
        github_token: ${{ secrets.GITHUB_TOKEN }}
        publish_dir: ./public
        publish_branch: gh-pages
```

Agora todo push no `main` faz deploy automático!

---

## ⚙️ Configurar CORS no Backend

No backend (Render), adicione a URL do GitHub Pages em `ALLOWED_ORIGINS`:

```env
ALLOWED_ORIGINS=https://seu-usuario.github.io
```

---

## ✅ Checklist

- [ ] Backend deployado no Render
- [ ] URL do backend anotada
- [ ] `auth.js` atualizado com URL do backend
- [ ] Branch `gh-pages` criada
- [ ] GitHub Pages ativado
- [ ] CORS configurado no backend
- [ ] Site acessível

---

## 🎯 Resultado

- **Backend**: `https://seu-app.onrender.com`
- **Frontend**: `https://seu-usuario.github.io/nome-repo/public/`
- **Custo**: R$ 0 (100% gratuito)

---

## 📝 Vantagens e Limitações

### ✅ Vantagens
- 100% gratuito
- SSL incluído
- CDN global do GitHub
- Deploy automático

### ⚠️ Limitações
- Apenas arquivos estáticos
- Precisa de backend separado
- URL do GitHub (pode configurar domínio customizado)

---

**Próximo**: Ver [SURGE_DEPLOY.md](SURGE_DEPLOY.md) para alternativa com Surge.sh

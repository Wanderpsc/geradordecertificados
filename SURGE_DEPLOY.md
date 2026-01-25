# 🌊 Deploy no Surge.sh

## ⚡ Sobre o Surge

**Surge.sh** é uma plataforma para deploy de sites estáticos em segundos!

- ✅ Gratuito
- ✅ Deploy em 1 comando
- ✅ SSL grátis
- ✅ Domínio customizado

## ⚠️ Importante

Como GitHub Pages, **Surge** hospeda apenas arquivos estáticos. Para sistema completo:

- **Frontend** → Surge.sh (gratuito)
- **Backend** → Render.com (gratuito)
- **Banco de Dados** → MongoDB Atlas (gratuito)

---

## 🚀 Deploy Rápido (2 minutos)

### Passo 1: Instalar Surge CLI

```bash
npm install -g surge
```

### Passo 2: Deploy do Backend (Render)

Primeiro, deploy o backend no Render seguindo [QUICK_DEPLOY.md](QUICK_DEPLOY.md).

**Anote a URL do backend!**

### Passo 3: Configurar Frontend

Atualize `public/auth.js`:

```javascript
const API_URL = 'https://seu-app.onrender.com/api';
```

### Passo 4: Deploy no Surge

```bash
# Na pasta do projeto
cd "e:\1. Nova pasta\MEUS PROJETOS DE PROGRAMAÇÃO\GERADOR DE CERTIFICADOS E HISTÓRICOS ESCOLARES"

# Deploy da pasta public
cd public
surge
```

**No prompt**:
1. Email: Digite seu email
2. Password: Crie uma senha
3. Project path: `./` (Enter)
4. Domain: Escolha um domínio (ex: `meu-certificados.surge.sh`)

**Pronto!** 🎉

URL: `https://meu-certificados.surge.sh`

---

## 🔧 Deploy com Domínio Customizado

```bash
# Deploy com domínio específico
surge ./public meu-certificados.surge.sh

# Ou com domínio próprio
surge ./public certificados.seudominio.com
```

---

## 🔄 Atualizar Site

Para atualizar depois de mudanças:

```bash
cd public
surge
```

Surge lembra o domínio automaticamente!

---

## ⚙️ Configurar CORS no Backend

No backend (Render), adicione o domínio Surge:

```env
ALLOWED_ORIGINS=https://meu-certificados.surge.sh
```

---

## 📦 Automatizar com NPM Script

Adicione ao `package.json`:

```json
{
  "scripts": {
    "deploy:surge": "cd public && surge"
  }
}
```

Uso:
```bash
npm run deploy:surge
```

---

## 🌐 Domínio Customizado no Surge

### Passo 1: Configurar DNS

No seu provedor de domínio, adicione:

```
Tipo: CNAME
Nome: certificados (ou @)
Valor: na-west1.surge.sh
TTL: 3600
```

### Passo 2: Deploy com Domínio

```bash
surge ./public certificados.seudominio.com
```

### Passo 3: Aguardar Propagação

Aguarde 1-24h para DNS propagar.

---

## ✅ Checklist

- [ ] Surge CLI instalado
- [ ] Backend deployado no Render
- [ ] `auth.js` atualizado com URL backend
- [ ] Deploy no Surge realizado
- [ ] CORS configurado
- [ ] Site acessível

---

## 📝 Comandos Úteis

```bash
# Login
surge login

# Listar sites
surge list

# Deletar site
surge teardown meu-certificados.surge.sh

# Ver logs
surge logs meu-certificados.surge.sh

# Logout
surge logout
```

---

## 🎯 Comparação: Surge vs GitHub Pages

| Recurso | Surge | GitHub Pages |
|---------|-------|--------------|
| **Deploy** | 1 comando | Git push |
| **Domínio** | Customizável | `.github.io` |
| **SSL** | Grátis | Grátis |
| **CDN** | Sim | Sim |
| **Limite** | Ilimitado | 1GB |
| **Privado** | Pago | Grátis (se repo privado) |

---

## 💡 Dicas

### Deploy Rápido
```bash
# Criar alias para deploy rápido
# No PowerShell profile:
function Deploy-Surge { cd public; surge }
```

### Deploy Múltiplos Ambientes
```bash
# Staging
surge ./public certificados-staging.surge.sh

# Production
surge ./public certificados.surge.sh
```

### Arquivo de Configuração

Crie `public/CNAME`:
```
meu-certificados.surge.sh
```

Agora só precisa executar `surge` na pasta public!

---

## 🔐 Ignorar Arquivos

Crie `public/.surgeignore`:

```
*.md
*.json
.DS_Store
Thumbs.db
```

---

## 📊 Resultado Final

- **Frontend**: `https://meu-certificados.surge.sh`
- **Backend**: `https://seu-app.onrender.com`
- **Custo**: R$ 0 (100% gratuito)
- **Deploy**: Segundos
- **SSL**: Incluído

---

## 🆘 Troubleshooting

### Erro: Command not found
```bash
npm install -g surge
```

### Erro: Not authorized
```bash
surge login
```

### Erro: Domain already taken
Escolha outro domínio ou use:
```bash
surge list
surge teardown dominio-antigo.surge.sh
```

### Site não carrega
- Verificar se `auth.js` tem URL correta do backend
- Verificar CORS no backend
- Limpar cache do navegador

---

## 🎉 Pronto!

Seu site está online em segundos com Surge.sh!

**Vantagens**:
- ✅ Deploy super rápido
- ✅ SSL automático
- ✅ Domínio customizável
- ✅ 100% gratuito
- ✅ Sem limites de deploy

**Perfeito para**:
- Testes rápidos
- Demos
- Landing pages
- Frontend de apps

---

**Ver também**:
- [GITHUB_PAGES_DEPLOY.md](GITHUB_PAGES_DEPLOY.md) - Deploy no GitHub Pages
- [QUICK_DEPLOY.md](QUICK_DEPLOY.md) - Deploy completo (backend + frontend)

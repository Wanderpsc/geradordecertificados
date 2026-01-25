# 🌐 Deploy Ultra Rápido - GitHub Pages

**Deploy automático no Git push!**

---

## 🚀 3 Passos Simples

### 1️⃣ Deploy Backend (5 min - uma vez)

Siga [QUICK_DEPLOY.md](QUICK_DEPLOY.md) para backend no Render.

**URL do backend**: `https://seu-app.onrender.com`

### 2️⃣ Configurar Frontend

Atualize `public/auth.js`:

```javascript
const API_URL = 'https://seu-app.onrender.com/api';
```

### 3️⃣ Ativar GitHub Pages

1. Push para GitHub:
   ```bash
   git add .
   git commit -m "Configurar GitHub Pages"
   git push origin main
   ```

2. GitHub → **Settings** → **Pages**
3. **Source**: Deploy from a branch
4. **Branch**: `main` → `/public`
5. **Save**

**Pronto!** 🎉 Aguarde 2 minutos.

---

## 🎯 URL do Site

```
https://seu-usuario.github.io/nome-repo/login.html
```

---

## 🔄 Deploy Automático

Agora todo `git push` faz deploy automático!

```bash
# Fazer mudanças
git add .
git commit -m "Atualização"
git push

# Deploy automático! ✨
```

---

## ⚙️ Configuração CORS

No backend (Render), adicione em `ALLOWED_ORIGINS`:
```
https://seu-usuario.github.io
```

---

## ✅ Pronto!

Seu site está online:
- 🌐 Frontend: `https://seu-usuario.github.io/repo/`
- 🔧 Backend: `https://seu-app.onrender.com`
- 💰 Custo: **R$ 0**
- 🔄 Deploy: **Automático**

---

**Ver guia completo**: [GITHUB_PAGES_DEPLOY.md](GITHUB_PAGES_DEPLOY.md)

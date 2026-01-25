# ⚡ Deploy Ultra Rápido - Surge.sh

**Deploy seu frontend em 30 segundos!**

---

## 🚀 3 Passos Simples

### 1️⃣ Instalar Surge (5 seg)

```bash
npm install -g surge
```

### 2️⃣ Deploy Backend (5 min - uma vez)

Siga [QUICK_DEPLOY.md](QUICK_DEPLOY.md) para backend no Render.

**URL do backend**: `https://seu-app.onrender.com`

### 3️⃣ Deploy Frontend (20 seg)

```bash
cd public
surge
```

**Pronto!** 🎉 URL: `https://seu-dominio.surge.sh`

---

## 🎯 Comandos Rápidos

### Deploy
```bash
# Primeira vez (cria conta)
cd public
surge

# Próximas vezes
cd public
surge
```

### Atualizar
```bash
# Mesmo comando!
cd public
surge
```

### Domínio Customizado
```bash
surge public meu-certificados.surge.sh
```

---

## ⚙️ Configuração Necessária

**Antes do primeiro deploy**, atualize `public/auth.js`:

```javascript
// Linha ~2
const API_URL = 'https://seu-app.onrender.com/api';
```

**E no backend (Render)**, adicione em `ALLOWED_ORIGINS`:
```
https://seu-dominio.surge.sh
```

---

## ✅ Pronto!

Seu site está online em:
- 🌐 Frontend: `https://seu-dominio.surge.sh`
- 🔧 Backend: `https://seu-app.onrender.com`
- 💰 Custo: **R$ 0**

---

**Ver guia completo**: [SURGE_DEPLOY.md](SURGE_DEPLOY.md)

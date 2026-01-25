# 🚀 Deploy Rápido - README

## ✨ Arquivos de Deploy Criados

Foram criados os seguintes arquivos para facilitar o deploy:

### 📄 Arquivos de Configuração

1. **Procfile** - Para Heroku
2. **vercel.json** - Para Vercel
3. **render.yaml** - Para Render.com
4. **railway.json** - Para Railway.app
5. **Dockerfile** - Para containers Docker
6. **.dockerignore** - Otimização do Docker
7. **docker-compose.yml** - Orquestração local com Docker
8. **.env.production** - Template de variáveis para produção
9. **start.sh** - Script de inicialização com validações

### 📚 Documentação

- **DEPLOY_GUIDE.md** - Guia completo com instruções detalhadas para cada plataforma

---

## ⚡ Deploy Rápido (Recomendado: Render.com)

### Passos Simplificados:

1. **Criar conta no MongoDB Atlas** (gratuito)
   - https://www.mongodb.com/cloud/atlas
   - Criar cluster gratuito
   - Obter string de conexão

2. **Push para GitHub**
   ```bash
   git init
   git add .
   git commit -m "Deploy inicial"
   git branch -M main
   git remote add origin https://github.com/seu-usuario/certificados.git
   git push -u origin main
   ```

3. **Deploy no Render**
   - Acessar https://render.com
   - New + → Web Service
   - Conectar repositório GitHub
   - Configurar:
     - Build Command: `npm install`
     - Start Command: `npm start`
   - Adicionar variáveis de ambiente (ver .env.production)
   - Deploy!

4. **Criar usuário admin**
   - Acessar Shell no Render
   - Executar: `node criar-admin.js`

---

## 🎯 Plataformas Suportadas

| Plataforma | Gratuito | Dificuldade | Arquivo Config |
|------------|----------|-------------|----------------|
| **Render.com** | ✅ Sim | ⭐ Fácil | render.yaml |
| **Railway.app** | ⚠️ $5 crédito | ⭐ Fácil | railway.json |
| **Heroku** | ❌ Não | ⭐⭐ Média | Procfile |
| **Vercel** | ✅ Sim | ⭐⭐⭐ Difícil* | vercel.json |
| **Docker** | N/A | ⭐⭐ Média | Dockerfile |

*Vercel tem limitações para apps Node.js com banco de dados

---

## 🔐 Variáveis de Ambiente Necessárias

```env
NODE_ENV=production
PORT=5000
MONGODB_URI=sua_string_mongodb_atlas
JWT_SECRET=sua_chave_secreta_32_chars
LICENSE_ENCRYPTION_KEY=outra_chave_secreta_32_chars
ALLOWED_ORIGINS=https://seu-dominio.com
```

Para gerar chaves seguras:
```javascript
require('crypto').randomBytes(32).toString('hex')
```

---

## 📖 Mais Informações

Consulte **DEPLOY_GUIDE.md** para instruções completas e detalhadas de cada plataforma.

---

## ✅ Checklist Rápido

- [ ] Código commitado no Git
- [ ] MongoDB Atlas configurado
- [ ] Variáveis de ambiente definidas
- [ ] Deploy realizado
- [ ] Aplicação acessível
- [ ] Usuário admin criado
- [ ] Teste de login funcionando

---

Boa sorte com o deploy! 🎉

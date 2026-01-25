# ⚡ Deploy em 5 Minutos - Guia Rápido

Deploy seu sistema em produção seguindo este guia relâmpago!

---

## ⏱️ Tempo Total: ~5 minutos

Este é o caminho mais rápido para ter seu sistema no ar.

---

## 🎯 Passo 1: MongoDB Atlas (2 min)

### 1.1 Criar Conta
- Acesse: https://mongodb.com/cloud/atlas
- **Sign Up** com Google/Email
- ✅ Gratuito!

### 1.2 Criar Cluster
1. **Build a Database** → **Free** (M0)
2. Cloud Provider: **AWS**
3. Region: Escolha mais próxima
4. Cluster Name: `Cluster0` (deixar padrão)
5. **Create**

### 1.3 Configurar Acesso
1. **Username**: `admin_certificados`
2. **Password**: Gerar senha → **Copiar e guardar!**
3. **Create User**

### 1.4 Network Access
1. **Add IP Address**
2. **Allow Access from Anywhere** (`0.0.0.0/0`)
3. **Confirm**

### 1.5 Obter String de Conexão
1. **Connect** → **Connect your application**
2. **Copiar** a string:
   ```
   mongodb+srv://admin_certificados:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
3. Substituir `<password>` pela senha real
4. Adicionar nome do banco no final: `/certificados_db`
   ```
   mongodb+srv://admin_certificados:SuaSenha@cluster0.xxxxx.mongodb.net/certificados_db?retryWrites=true&w=majority
   ```

✅ **MongoDB pronto!** Guarde essa string.

---

## 🚀 Passo 2: Deploy no Render.com (3 min)

### 2.1 Preparar GitHub
```bash
# No terminal, na pasta do projeto:
git init
git add .
git commit -m "Deploy inicial"

# Criar repo no GitHub (via navegador)
# Depois:
git remote add origin https://github.com/SEU-USUARIO/NOME-DO-REPO.git
git branch -M main
git push -u origin main
```

### 2.2 Criar Conta Render
- Acesse: https://render.com
- **Sign Up** com GitHub
- Autorizar acesso

### 2.3 Criar Web Service
1. **Dashboard** → **New +** → **Web Service**
2. **Connect** ao seu repositório
3. Configurar:

```
Name: gerador-certificados
Environment: Node
Build Command: npm install
Start Command: npm start
Plan: Free
```

### 2.4 Variáveis de Ambiente

Clique em **Advanced** → **Add Environment Variable**

Adicione CADA uma dessas (copie e cole):

```
NODE_ENV
production

PORT
5000

MONGODB_URI
[COLE SUA STRING DO MONGODB AQUI]

JWT_SECRET
[GERE UMA CHAVE - VER ABAIXO]

LICENSE_ENCRYPTION_KEY
[GERE OUTRA CHAVE - VER ABAIXO]

ALLOWED_ORIGINS
https://gerador-certificados.onrender.com
```

**Para gerar chaves JWT e LICENSE**:
No terminal local, execute:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```
Execute 2x, uma para cada chave.

### 2.5 Deploy!
1. **Create Web Service**
2. Aguarde 3-5 minutos (acompanhe logs)
3. Quando ver "Deploy live", clique na URL
4. 🎉 **Pronto!**

---

## ✅ Passo 3: Verificar (30 seg)

### 3.1 Testar Acesso
1. Abra a URL: `https://gerador-certificados.onrender.com`
2. Deve ver página de login
3. Clique em **Registrar**
4. Crie uma conta
5. Faça login

### 3.2 Criar Admin (Opcional)

**Opção A - Via MongoDB Atlas**:
1. MongoDB Atlas → **Browse Collections**
2. `certificados_db` → `usuarios`
3. Encontre seu usuário
4. Editar → `role`: `"admin"`
5. Update

**Opção B - Via Shell no Render**:
1. Render Dashboard → **Shell**
2. Execute:
   ```javascript
   node -e "
   require('dotenv').config();
   const mongoose = require('mongoose');
   const Usuario = require('./server/models/Usuario');
   mongoose.connect(process.env.MONGODB_URI).then(async () => {
     await Usuario.updateOne(
       { email: 'seu@email.com' },
       { role: 'admin' }
     );
     console.log('Admin criado!');
     process.exit(0);
   });
   "
   ```

---

## 🎉 DEPLOY COMPLETO!

Seu sistema está online em:
### 🌐 https://gerador-certificados.onrender.com

### O que você tem agora:
- ✅ Sistema rodando em produção
- ✅ Banco de dados na nuvem (MongoDB Atlas)
- ✅ SSL/HTTPS automático
- ✅ Deploy automático no push do GitHub
- ✅ Gratuito!

---

## 📝 Anotações Importantes

Guarde estas informações:

```
===========================================
INFORMAÇÕES DO SISTEMA
===========================================

URL Produção:
https://gerador-certificados.onrender.com

MongoDB Atlas:
Cluster: Cluster0
User: admin_certificados
Password: [SUA SENHA]

Render.com:
Service: gerador-certificados
Plan: Free

Admin:
Email: [SEU EMAIL]
Senha: [SUA SENHA]

===========================================
```

---

## 🔄 Fazer Atualizações

Quando fizer mudanças no código:

```bash
git add .
git commit -m "Descrição da mudança"
git push origin main
```

Render detecta automaticamente e faz redeploy! (3-5 min)

---

## ⚠️ Limitações do Plano Gratuito

**Render Free**:
- ✅ 512 MB RAM
- ✅ SSL incluído
- ✅ Deploys ilimitados
- ⚠️ App "dorme" após 15min de inatividade
  - Primeira requisição demora ~30s (cold start)
  - Depois funciona normal

**MongoDB Atlas Free**:
- ✅ 512 MB de storage
- ✅ Backups automáticos
- ✅ Suficiente para ~5000 certificados
- ⚠️ Limite de 100 conexões simultâneas

---

## 🚀 Próximos Passos

### Agora que está no ar:

1. **[Configurar Domínio Customizado](DOMINIO_CUSTOMIZADO.md)**
   - `certificados.seudominio.com`
   - Mais profissional!

2. **Testar Todas Funcionalidades**
   - Cadastro de alunos
   - Geração de certificados
   - Sistema de licenças

3. **Monitorar**
   - Verificar logs no Render
   - Acompanhar uso no MongoDB Atlas

4. **Marketing!**
   - Divulgar seu sistema
   - Começar a vender licenças

---

## 🆘 Problemas?

### App não abre
- **Causa**: Build com erro
- **Solução**: Ver logs no Render Dashboard

### Erro de conexão MongoDB
- **Causa**: `MONGODB_URI` incorreta
- **Solução**: Verificar string no Render (Environment)

### CORS error
- **Causa**: `ALLOWED_ORIGINS` desatualizado
- **Solução**: Atualizar no Render para sua URL real

### App muito lento
- **Causa**: Cold start (plano free)
- **Solução**: 
  - Primeiro acesso demora ~30s (normal)
  - Considere upgrade para $7/mês se precisar

---

## 📚 Documentação Completa

Para mais detalhes, consulte:

- **[DEPLOY_PACKAGE.md](DEPLOY_PACKAGE.md)** - Visão geral completa
- **[DEPLOY_GUIDE.md](DEPLOY_GUIDE.md)** - Guia detalhado
- **[DEPLOY_CHECKLIST.md](DEPLOY_CHECKLIST.md)** - Checklist completo
- **[COMANDOS_UTEIS.md](COMANDOS_UTEIS.md)** - Comandos úteis

---

## 💡 Dica Final

> **Favorite sua URL!** Como o app dorme no plano free, acesse pelo menos 1x por dia para mantê-lo "acordado" ou considere upgrade.

---

## ✨ Parabéns!

Você fez deploy de um sistema profissional em menos de 5 minutos!

Agora é só começar a usar e vender licenças! 💰

---

**Precisa de mais ajuda?** Consulte os outros guias de deploy.

🚀 **Bom trabalho!**

# 🚀 Configuração MongoDB Atlas (5 minutos)

## ✅ PASSO 1: Criar Conta
1. Acesse: https://www.mongodb.com/cloud/atlas/register
2. Clique em **"Sign up with Google"** (mais rápido) OU use email
3. Confirme sua conta

---

## ✅ PASSO 2: Criar Cluster Gratuito
1. Você verá a tela "Deploy a cloud database"
2. Clique em **"Create"** no plano **M0 FREE** (não precisa cartão)
3. Configurações:
   - **Provider**: AWS (recomendado)
   - **Region**: São Paulo (sa-east-1) OU N. Virginia (us-east-1)
   - **Cluster Name**: Deixe o padrão ou mude para "CertificadosCluster"
4. Clique em **"Create Deployment"** (canto inferior direito)

---

## ✅ PASSO 3: Criar Usuário do Banco
1. Uma janela popup aparecerá "Security Quickstart"
2. Em **"Username"**: Digite `admin` (ou outro nome)
3. Em **"Password"**: Clique em **"Autogenerate Secure Password"**
4. **IMPORTANTE**: Copie e salve a senha gerada! 
5. Clique em **"Create Database User"**

---

## ✅ PASSO 4: Configurar Acesso de Rede
1. Ainda na janela popup, role para baixo
2. Em **"Where would you like to connect from?"**
3. Clique em **"Add My Current IP Address"**
4. Depois clique em **"Add Entry"** com:
   - IP Address: `0.0.0.0/0` (permite de qualquer lugar)
   - Description: `Permitir todos`
5. Clique em **"Finish and Close"**

---

## ✅ PASSO 5: Obter Connection String
1. Na tela principal, clique em **"Connect"** no seu cluster
2. Escolha **"Drivers"** (ou "Connect your application")
3. Driver: **Node.js** / Version: **5.5 or later**
4. Copie a **Connection String** (algo como):
   ```
   mongodb+srv://admin:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
5. **SUBSTITUA** `<password>` pela senha que você salvou no Passo 3

---

## ✅ PASSO 6: Configurar no Projeto
1. Abra o arquivo `.env` neste projeto
2. Substitua a linha `MONGODB_URI=mongodb://localhost:27017/certificados_db`
3. Pela sua connection string:
   ```
   MONGODB_URI=mongodb+srv://admin:SUA_SENHA_AQUI@cluster0.xxxxx.mongodb.net/certificados_db?retryWrites=true&w=majority
   ```
4. Salve o arquivo

---

## ✅ PASSO 7: Testar
Execute no terminal:
```bash
npm start
```

Se conectar com sucesso, verá:
```
✅ MongoDB conectado com sucesso
🚀 Servidor rodando na porta 5000
```

---

## ❓ Precisa de Ajuda?
Me envie a connection string que você copiou e eu configuro automaticamente!

# GUIA DE INÍCIO RÁPIDO

## ⚡ Quick Start

### Passo 1: Instalar Dependências
```bash
npm install
```

### Passo 2: Configurar MongoDB

**Opção A - MongoDB Local (Recomendado para desenvolvimento):**

1. Baixe e instale: https://www.mongodb.com/try/download/community
2. O MongoDB já estará rodando como serviço após a instalação no Windows

**Opção B - MongoDB Atlas (Cloud - Recomendado para produção):**

1. Crie conta grátis em: https://www.mongodb.com/cloud/atlas
2. Crie um cluster gratuito
3. Pegue a connection string
4. Cole no arquivo `.env` na variável `MONGODB_URI`

### Passo 3: Iniciar o Servidor

```bash
# Desenvolvimento (com nodemon - auto-reload)
npm run dev

# OU Produção
npm start
```

### Passo 4: Acessar o Sistema

Abra no navegador: **http://localhost:5000/login.html**

## 📋 Primeiro Uso

1. **Registrar** - Crie sua conta
2. Você receberá automaticamente **7 dias grátis** com **10 certificados**
3. Comece a cadastrar alunos e gerar certificados!

## 🎯 Atalhos

- **Frontend**: http://localhost:5000
- **Login**: http://localhost:5000/login.html
- **API Base**: http://localhost:5000/api

## ⚠️ Problemas Comuns

### Erro: "Cannot connect to MongoDB"
- Certifique-se de que o MongoDB está rodando
- No Windows: MongoDB roda automaticamente após instalação
- Ou use MongoDB Atlas (cloud)

### Erro: "Port 5000 already in use"
- Mude a porta no arquivo `.env`: `PORT=3000`

### Dependências não instaladas
```bash
npm install
```

## 📞 Precisa de Ajuda?

Consulte o README.md completo para mais informações!

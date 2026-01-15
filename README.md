# 📜 Gerador de Certificados Escolares - Sistema Profissional

Sistema completo e profissional para geração de certificados escolares com:
- ✅ Backend Node.js + Express
- ✅ Banco de dados MongoDB
- ✅ Sistema de autenticação JWT
- ✅ Sistema de licenciamento completo
- ✅ API REST profissional
- ✅ Frontend integrado
- ✅ Pronto para venda de licenças

## 🚀 Instalação

### 1. Pré-requisitos

Instale os seguintes programas:
- [Node.js](https://nodejs.org/) (v14 ou superior)
- [MongoDB](https://www.mongodb.com/try/download/community) (ou use MongoDB Atlas para cloud)

### 2. Instalar dependências

```bash
npm install
```

### 3. Configurar variáveis de ambiente

Já existe um arquivo `.env` configurado para desenvolvimento local. Para produção, edite o arquivo e mude:
- `JWT_SECRET` - Use uma chave secreta forte
- `LICENSE_ENCRYPTION_KEY` - Use outra chave forte
- `MONGODB_URI` - Se usar MongoDB Atlas, coloque a URL de conexão

### 4. Iniciar MongoDB (local)

```bash
# Windows (se instalou como serviço, já está rodando)
# Ou execute:
mongod
```

### 5. Iniciar o servidor

```bash
# Desenvolvimento (com auto-reload)
npm run dev

# Produção
npm start
```

O servidor estará rodando em: **http://localhost:5000**

## 📖 Como usar

### Primeiro acesso

1. Acesse: http://localhost:5000/login.html
2. Clique em "Registrar"
3. Preencha os dados e crie sua conta
4. Você receberá automaticamente uma licença **TRIAL de 7 dias** com 10 certificados

### Funcionalidades

- **Cadastro de alunos** - CRUD completo
- **Geração de certificados** - Múltiplos templates
- **Sistema de licenças** - Controle profissional
- **Autenticação segura** - JWT tokens

## 🔑 Sistema de Licenças

### Tipos de licença

1. **TRIAL** (7 dias, 10 certificados) - Criada automaticamente no registro
2. **MENSAL** (30 dias) - Para venda mensal
3. **ANUAL** (1 ano) - Para venda anual
4. **VITALÍCIA** (100 anos) - Licença permanente

### Recursos por licença

Você pode configurar os recursos de cada licença:
- `multiplosTemplates` - Acesso a múltiplos templates
- `templatesCustomizados` - Criar templates personalizados
- `exportacaoPDF` - Exportar em PDF
- `historicosEscolares` - Gerar históricos escolares
- `marcaDagua` - true = com marca d'água, false = sem

## 🛠️ Administração

### Criar licenças manualmente (API)

```bash
POST /api/licenses
Headers: Authorization: Bearer {token_admin}
Body: {
    "usuarioId": "id_do_usuario",
    "tipo": "anual",
    "limiteCertificados": -1,
    "recursos": {
        "multiplosTemplates": true,
        "templatesCustomizados": true,
        "marcaDagua": false
    },
    "valorPago": 299.90,
    "metodoPagamento": "pix"
}
```

### Criar usuário Admin

Execute no MongoDB ou MongoDB Compass:

```javascript
db.usuarios.updateOne(
    { email: "seu@email.com" },
    { $set: { role: "admin" } }
)
```

## 🌐 Deploy em Produção

### Opção 1: VPS (Recomendado para venda)

1. Contrate um VPS (DigitalOcean, AWS, Contabo, etc)
2. Instale Node.js e MongoDB
3. Clone o projeto
4. Configure `.env` com URLs de produção
5. Use PM2 para manter o servidor rodando:

```bash
npm install -g pm2
pm2 start server/server.js --name certificados
pm2 startup
pm2 save
```

### Opção 2: MongoDB Atlas (Cloud Database)

1. Crie uma conta no [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Crie um cluster gratuito
3. Copie a connection string
4. Cole no `.env` em `MONGODB_URI`

### Opção 3: Heroku (Rápido)

1. Crie conta no Heroku
2. Instale Heroku CLI
3. Execute:

```bash
heroku create seu-app-certificados
heroku addons:create mongolab
git push heroku main
```

## 📊 Estrutura do Projeto

```
├── server/
│   ├── config/           # Configurações (DB)
│   ├── models/           # Models MongoDB (Usuario, Aluno, Licenca)
│   ├── controllers/      # Lógica de negócio
│   ├── routes/           # Rotas da API
│   ├── middlewares/      # Autenticação e validações
│   └── server.js         # Servidor principal
├── public/               # Frontend
│   ├── index.html
│   ├── login.html
│   ├── app.js
│   ├── auth.js
│   └── styles.css
├── package.json
├── .env                  # Variáveis de ambiente
└── README.md
```

## 🔒 Segurança

- ✅ Senhas criptografadas com bcrypt
- ✅ Autenticação JWT
- ✅ Validação de licenças em todas as operações
- ✅ CORS configurável
- ✅ Proteção contra ataques comuns

## 💰 Monetização

### Sugestão de preços

- **Trial**: Grátis (7 dias, 10 certificados)
- **Mensal**: R$ 49,90/mês
- **Anual**: R$ 499,90/ano (economize 2 meses)
- **Vitalícia**: R$ 1.499,90 (pagamento único)

### Integração com pagamentos

Integre com:
- Mercado Pago
- PagSeguro
- Stripe
- PayPal

Quando receber o pagamento, use a API para criar/ativar a licença do cliente.

## 📝 Endpoints da API

### Autenticação
- `POST /api/auth/register` - Registrar usuário
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Obter usuário atual

### Alunos
- `POST /api/alunos` - Criar aluno
- `GET /api/alunos` - Listar alunos
- `GET /api/alunos/:id` - Buscar aluno
- `PUT /api/alunos/:id` - Atualizar aluno
- `DELETE /api/alunos/:id` - Deletar aluno

### Licenças
- `POST /api/licenses` - Criar licença (Admin)
- `POST /api/licenses/activate` - Ativar licença com chave
- `GET /api/licenses/status` - Ver status da licença
- `GET /api/licenses` - Listar todas (Admin)
- `PUT /api/licenses/:id/renew` - Renovar licença (Admin)

## ⚖️ Licença

Este é um software proprietário. Todos os direitos reservados.

---

**Desenvolvido para venda profissional de licenças de software.**

---

**Versão**: 2.0  
**Última Atualização**: Janeiro 2026  
**Status**: ✅ Pronto para Produção

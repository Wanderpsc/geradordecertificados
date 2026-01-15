# 📜 Gerador de Certificados Escolares - Sistema Profissional

Sistema completo e profissional para geração de certificados escolares com:
- ✅ Backend Node.js + Express + MongoDB
- ✅ Sistema de autenticação JWT com roles
- ✅ Sistema de licenciamento completo
- ✅ **Painel Administrativo completo**
- ✅ Gestão de clientes, pagamentos e notas fiscais
- ✅ Proteções anti-plágio e segurança avançada
- ✅ **Pronto para venda comercial de licenças**

---

## 🚀 Instalação Rápida

### 1. Pré-requisitos

- [Node.js](https://nodejs.org/) (v14+)
- [MongoDB](https://www.mongodb.com/try/download/community) instalado e rodando

### 2. Instalar dependências

```bash
npm install
```

### 3. Iniciar MongoDB

```bash
# Windows
mongod

# Ou se instalou como serviço, já está rodando
```

### 4. Iniciar o servidor

```bash
npm run dev
```

Servidor: **http://localhost:5000**

---

## 👥 Sistema de Usuários

### 🎭 Dois tipos de acesso

#### 1️⃣ **ADMINISTRADOR** (Você)
- Acessa apenas o **Painel Administrativo**
- **NÃO** tem acesso ao gerador de certificados
- Gerencia:
  - Clientes
  - Licenças
  - Pagamentos
  - Notas Fiscais
  - Relatórios Financeiros
  - Logs de auditoria

#### 2️⃣ **CLIENTE** (Seus compradores)
- Acessa apenas o **Gerador de Certificados**
- **NÃO** tem acesso ao painel administrativo
- Funcionalidades:
  - Cadastrar alunos
  - Gerar certificados
  - Gerenciar históricos escolares

---

## 🔐 Primeiro Acesso

### Criar conta de ADMINISTRADOR

```bash
# Via MongoDB Compass ou mongo shell:

use certificados

db.usuarios.insertOne({
  nome: "SEU NOME",
  email: "seu@email.com",
  senha: "$2a$10$XGjM8fJvZKzYYME7iZ.wSeqWYVYfh9YQY0zJ8k8m1qv8zEzKhN9Hy",
  role: "admin",
  ativo: true,
  aceitouTermos: true,
  dataAceiteTermos: new Date(),
  createdAt: new Date()
})

# Senha padrão: "admin123"
# IMPORTANTE: Troque essa senha após o primeiro login!
```

### Login

1. Acesse: http://localhost:5000/public/login.html
2. Use as credenciais criadas acima
3. **Admin** será redirecionado para: `/public/admin.html`
4. **Cliente** será redirecionado para: `/index.html`

---

## 🎛️ Painel Administrativo

URL: http://localhost:5000/public/admin.html

### 📊 Dashboard
- Total de clientes
- Licenças ativas
- Receita mensal/anual
- Notas fiscais emitidas
- Últimas atividades do sistema

### 👥 Gerenciamento de Clientes
- Lista completa de clientes
- Busca por nome, email ou instituição
- Ver detalhes (alunos cadastrados, certificados gerados)
- Ativar/desativar contas
- Ver histórico de licenças

### 🔑 Licenças
- Visualizar todas as licenças
- Status (ativa, expirada, trial)
- Renovar licenças manualmente
- Criar licenças customizadas

### 💰 Pagamentos
- Registrar novos pagamentos
- Aprovar/recusar pagamentos pendentes
- Métodos: Boleto, Cartão, PIX, Transferência
- Status: Pendente, Processando, Aprovado, Recusado
- **Aprovação automática cria/renova licença**

### 📄 Notas Fiscais
- Emitir notas fiscais brasileiras
- Numeração sequencial automática
- Cálculo de impostos (ISS, PIS, COFINS, INSS, IR, CSLL)
- Cancelamento de notas
- Dados de prestador e tomador completos

### 📈 Relatório Financeiro
- Receita por mês
- Receita por tipo de licença
- Receita por método de pagamento
- Filtros por período

### 📝 Logs de Auditoria
- Rastreamento completo de ações
- Níveis: info, warning, error, success
- Filtros por usuário, ação e nível
- Histórico de alterações

---

## 🔑 Sistema de Licenças

### Tipos disponíveis

| Tipo | Duração | Limite Certificados | Uso |
|------|---------|---------------------|-----|
| **TRIAL** | 7 dias | 10 | Teste gratuito automático |
| **MENSAL** | 30 dias | Ilimitado* | Assinatura mensal |
| **ANUAL** | 365 dias | Ilimitado* | Assinatura anual |
| **VITALÍCIA** | 100 anos | Ilimitado* | Compra única |

*Você pode configurar limites específicos

### Recursos por licença

Configure no código `server/models/Licenca.js`:

```javascript
recursos: {
  multiplosTemplates: true,
  templatesCustomizados: true,
  exportacaoPDF: true,
  historicosEscolares: true,
  marcaDagua: false  // true = mostra marca d'água
}
```

### Fluxo de venda

1. Cliente se cadastra → Recebe **TRIAL** automático (7 dias)
2. Admin registra pagamento no painel
3. Admin aprova pagamento
4. **Sistema cria/renova licença automaticamente**
5. Cliente recebe acesso completo

---

## 💳 Sistema de Pagamentos

### Registrar pagamento

No painel admin → Pagamentos → Novo Pagamento:

1. Selecione o cliente
2. Escolha tipo de licença (mensal, anual, vitalícia)
3. Informe valor e método de pagamento
4. Status inicia como "pendente"

### Aprovar pagamento

- Admin revisa pagamento
- Clica em "Aprovar"
- **Sistema automaticamente:**
  - Atualiza status para "aprovado"
  - Cria nova licença OU renova existente
  - Calcula data de expiração
  - Registra log de auditoria

### Recusar pagamento

- Admin clica em "Recusar"
- Informa motivo
- Status muda para "recusado"
- Nenhuma licença é criada

---

## 📄 Notas Fiscais Brasileiras

### Campos obrigatórios

**Prestador (você):**
- Nome/Razão Social
- CNPJ
- Endereço completo
- Inscrição Municipal
- Regime tributário

**Tomador (cliente):**
- Nome
- CPF/CNPJ
- Endereço
- Email

**Serviço:**
- Descrição
- Valor dos serviços
- Descontos
- Impostos (ISS, PIS, COFINS, etc.)

### Emitir nota

1. Painel admin → Notas Fiscais → Emitir Nota Fiscal
2. Selecione pagamento aprovado
3. Preencha dados do prestador e tomador
4. Sistema calcula impostos automaticamente
5. Número sequencial gerado automaticamente

### Cancelar nota

- Apenas notas não canceladas
- Informe motivo do cancelamento
- Registro permanece no histórico

---

## 🛡️ Segurança e Proteções

### Backend
- ✅ JWT com expiração de 30 dias
- ✅ Senhas hashadas com bcrypt (10 rounds)
- ✅ Validação de licenças em todas as rotas
- ✅ Middleware de roles (admin vs cliente)
- ✅ Logs de auditoria completos
- ✅ CORS configurado
- ✅ Rate limiting (prevenir abusos)

### Frontend
- ✅ Anti-debugging (detecta DevTools)
- ✅ Bloqueio de teclas (F12, Ctrl+Shift+I/J/C)
- ✅ Bloqueio de clique direito
- ✅ Watermark de copyright no console
- ✅ Object.freeze em prototypes
- ✅ Detecção de ferramentas de desenvolvedor

### Legal
- ✅ Termos de Uso completos (4800+ palavras)
- ✅ Aceite obrigatório no cadastro
- ✅ LGPD compliance
- ✅ Lei de Direitos Autorais (9.610/98)
- ✅ Lei de Software (9.609/98)
- ✅ Avisos de penalidades por plágio

---

## 📡 API Endpoints

### Autenticação
```
POST   /api/auth/register   - Criar conta
POST   /api/auth/login      - Login
GET    /api/auth/me         - Dados do usuário logado
```

### Admin (requer role: admin)
```
GET    /api/admin/dashboard              - Estatísticas gerais
GET    /api/admin/clientes               - Listar clientes
GET    /api/admin/clientes/:id           - Detalhes do cliente
PATCH  /api/admin/clientes/:id/status    - Ativar/desativar cliente
GET    /api/admin/pagamentos             - Listar pagamentos
POST   /api/admin/pagamentos             - Registrar pagamento
PATCH  /api/admin/pagamentos/:id/aprovar - Aprovar pagamento
PATCH  /api/admin/pagamentos/:id/recusar - Recusar pagamento
GET    /api/admin/notas-fiscais          - Listar notas fiscais
GET    /api/admin/notas-fiscais/:id      - Detalhes da nota
POST   /api/admin/notas-fiscais          - Emitir nota fiscal
PATCH  /api/admin/notas-fiscais/:id/cancelar - Cancelar nota
GET    /api/admin/relatorio-financeiro   - Relatório financeiro
GET    /api/admin/logs                   - Logs de auditoria
```

### Clientes (requer role: user/cliente)
```
GET    /api/alunos          - Listar alunos do cliente
POST   /api/alunos          - Criar aluno
GET    /api/alunos/:id      - Buscar aluno
PUT    /api/alunos/:id      - Atualizar aluno
DELETE /api/alunos/:id      - Deletar aluno
GET    /api/alunos/search   - Buscar alunos
```

### Licenças
```
GET    /api/licenses/my     - Minha licença
POST   /api/licenses        - Criar licença (admin only)
```

---

## 🔧 Configurações Importantes

### Valores de licenças

Edite em `server/controllers/adminController.js`:

```javascript
// Exemplo no registrarPagamento:
const precos = {
    'mensal': 29.90,
    'anual': 299.90,
    'vitalicia': 999.90
};
```

### Dados da sua empresa (Notas Fiscais)

Edite em `server/models/NotaFiscal.js`:

```javascript
prestador: {
    nome: 'SUA EMPRESA LTDA',
    cnpj: '00.000.000/0001-00',
    inscricaoMunicipal: '000000',
    // ... outros dados
}
```

### Recursos das licenças

Edite em `server/models/Licenca.js`:

```javascript
recursos: {
    multiplosTemplates: Boolean,
    templatesCustomizados: Boolean,
    exportacaoPDF: Boolean,
    historicosEscolares: Boolean,
    marcaDagua: Boolean
}
```

---

## 📦 Estrutura do Projeto

```
projeto/
├── server/
│   ├── models/
│   │   ├── Usuario.js         - Model de usuários
│   │   ├── Aluno.js          - Model de alunos
│   │   ├── Licenca.js        - Model de licenças
│   │   ├── Pagamento.js      - Model de pagamentos
│   │   ├── NotaFiscal.js     - Model de notas fiscais
│   │   ├── Log.js            - Model de logs
│   │   └── Certificado.js    - Model de certificados
│   ├── controllers/
│   │   ├── authController.js - Lógica de autenticação
│   │   ├── alunoController.js - Lógica de alunos
│   │   ├── adminController.js - Lógica administrativa
│   │   └── licenseController.js - Lógica de licenças
│   ├── routes/
│   │   ├── auth.js           - Rotas de autenticação
│   │   ├── alunos.js         - Rotas de alunos
│   │   ├── admin.js          - Rotas administrativas
│   │   └── licenses.js       - Rotas de licenças
│   ├── middlewares/
│   │   ├── auth.js           - Middlewares de autenticação
│   │   └── logger.js         - Middleware de logging
│   └── server.js             - Servidor principal
├── public/
│   ├── login.html            - Página de login/registro
│   ├── admin.html            - Painel administrativo
│   ├── termos.html           - Termos de uso
│   ├── auth.js               - JavaScript de autenticação
│   ├── admin.js              - JavaScript do painel admin
│   └── protection.js         - Proteções anti-plágio
├── index.html                - Gerador de certificados
├── app.js                    - JavaScript principal
├── styles.css                - Estilos
├── package.json              - Dependências
└── .env                      - Variáveis de ambiente
```

---

## 🚀 Deploy em Produção

### 1. MongoDB Atlas (recomendado)

1. Crie conta em https://www.mongodb.com/atlas
2. Crie cluster gratuito
3. Pegue string de conexão
4. Atualize `.env`:
```
MONGODB_URI=mongodb+srv://usuario:senha@cluster.mongodb.net/certificados
```

### 2. Hospedagem do servidor

Opções gratuitas/baratas:
- **Heroku** - fácil, integração Git
- **Railway** - moderno, rápido
- **Render** - gratuito, confiável
- **DigitalOcean** - VPS, mais controle

### 3. Frontend

Opções:
- **Vercel** - Ótimo para static files
- **Netlify** - Simples e rápido
- **GitHub Pages** - Gratuito
- Ou sirva do mesmo servidor Node.js

### 4. Variáveis de ambiente

**IMPORTANTE em produção:**
```
NODE_ENV=production
JWT_SECRET=[senha forte aleatória 32+ caracteres]
LICENSE_ENCRYPTION_KEY=[outra senha forte aleatória]
MONGODB_URI=[string de conexão do Atlas]
PORT=5000
```

---

## 🆘 Solução de Problemas

### MongoDB não conecta
```bash
# Verifique se está rodando:
mongod --version

# Inicie manualmente:
mongod

# Ou verifique serviço Windows:
services.msc → MongoDB Server
```

### Erro "Token inválido"
- Limpe localStorage do navegador
- Faça login novamente
- Verifique se `JWT_SECRET` não mudou

### Admin não consegue acessar painel
- Confirme `role: 'admin'` no banco de dados
- Use MongoDB Compass para verificar
- Limpe cache e faça login novamente

### Cliente não consegue gerar certificados
- Verifique se licença está ativa
- Verifique data de expiração
- Veja se não atingiu limite de certificados

---

## 📞 Suporte

Para dúvidas ou problemas:
1. Verifique os logs do servidor no console
2. Verifique logs de auditoria no painel admin
3. Use MongoDB Compass para inspecionar banco de dados

---

## 📝 Licença do Código

© 2024 - Todos os direitos reservados.

Sistema protegido pelas seguintes leis:
- Lei 9.609/98 (Lei do Software)
- Lei 9.610/98 (Lei de Direitos Autorais)

**Uso não autorizado, cópia, modificação ou distribuição deste software é crime e está sujeito a penalidades civis e criminais.**

---

## ✨ Recursos Futuros

- [ ] Integração com gateways de pagamento (MercadoPago, PagSeguro)
- [ ] Geração automática de PDF de notas fiscais
- [ ] Gráficos financeiros com Chart.js
- [ ] Sistema de notificações por email
- [ ] API de webhooks para pagamentos automáticos
- [ ] Painel de métricas avançadas
- [ ] Exportação de relatórios em Excel
- [ ] Sistema de cupons de desconto
- [ ] Programa de afiliados

---

**Desenvolvido com ❤️ para venda profissional de licenças**

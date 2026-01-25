# 🚀 Guia Completo de Deploy

Este guia contém instruções detalhadas para fazer o deploy do Sistema de Geração de Certificados em diferentes plataformas.

---

## 📋 Pré-requisitos

Antes de fazer o deploy, certifique-se de ter:

- [ ] Conta no MongoDB Atlas (gratuita)
- [ ] Código versionado no Git/GitHub
- [ ] Variáveis de ambiente configuradas
- [ ] Dependências testadas localmente

---

## 🗄️ Configuração do Banco de Dados (MongoDB Atlas)

### Passo 1: Criar Cluster no MongoDB Atlas

1. Acesse [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Crie uma conta gratuita
3. Crie um novo cluster (M0 - Free Tier)
4. Configure o usuário do banco de dados:
   - Username: `admin_certificados`
   - Password: (Gere uma senha segura)
5. Configure Network Access:
   - Adicione `0.0.0.0/0` para permitir acesso de qualquer IP

### Passo 2: Obter String de Conexão

1. Clique em "Connect" no seu cluster
2. Escolha "Connect your application"
3. Copie a string de conexão:
   ```
   mongodb+srv://admin_certificados:<password>@cluster0.xxxxx.mongodb.net/certificados_db?retryWrites=true&w=majority
   ```
4. Substitua `<password>` pela senha real
5. Substitua `certificados_db` pelo nome do seu banco

---

## 🎯 Opções de Deploy

### Opção 1: Render.com (Recomendado - Gratuito)

#### Vantagens
- ✅ Gratuito
- ✅ Deploy automático do GitHub
- ✅ SSL incluído
- ✅ Fácil configuração

#### Passos:

1. **Criar Repositório no GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/seu-usuario/seu-repo.git
   git push -u origin main
   ```

2. **Configurar no Render**
   - Acesse [Render.com](https://render.com)
   - Clique em "New +" → "Web Service"
   - Conecte seu repositório GitHub
   - Configure:
     - **Name**: gerador-certificados
     - **Environment**: Node
     - **Build Command**: `npm install`
     - **Start Command**: `npm start`
     - **Plan**: Free

3. **Configurar Variáveis de Ambiente**
   
   No Render, vá em "Environment" e adicione:
   
   ```env
   NODE_ENV=production
   PORT=10000
   MONGODB_URI=mongodb+srv://seu-usuario:senha@cluster.mongodb.net/certificados_db
   JWT_SECRET=sua_chave_jwt_super_secreta_de_32_caracteres_minimo
   LICENSE_ENCRYPTION_KEY=sua_chave_de_criptografia_super_secreta_32_chars
   ALLOWED_ORIGINS=https://seu-app.onrender.com
   ```

4. **Deploy**
   - Clique em "Create Web Service"
   - Aguarde o build e deploy (3-5 minutos)
   - Acesse sua URL: `https://seu-app.onrender.com`

---

### Opção 2: Railway.app (Muito Fácil)

#### Vantagens
- ✅ $5 de crédito gratuito por mês
- ✅ Deploy direto do GitHub
- ✅ Interface simples

#### Passos:

1. **Acessar Railway**
   - Acesse [Railway.app](https://railway.app)
   - Faça login com GitHub

2. **Criar Novo Projeto**
   - Clique em "New Project"
   - Selecione "Deploy from GitHub repo"
   - Escolha seu repositório

3. **Configurar Variáveis**
   
   Adicione as variáveis de ambiente:
   
   ```env
   NODE_ENV=production
   MONGODB_URI=sua_string_de_conexao_mongodb
   JWT_SECRET=sua_chave_jwt_secreta
   LICENSE_ENCRYPTION_KEY=sua_chave_criptografia
   ALLOWED_ORIGINS=${{RAILWAY_PUBLIC_DOMAIN}}
   ```

4. **Deploy Automático**
   - O Railway detecta automaticamente o Node.js
   - Deploy inicia automaticamente
   - URL gerada: `https://seu-app.up.railway.app`

---

### Opção 3: Heroku (Clássico)

#### Nota: Heroku não tem mais plano gratuito

#### Passos:

1. **Instalar Heroku CLI**
   ```bash
   # Windows (via Chocolatey)
   choco install heroku-cli
   
   # Ou baixar em: https://devcenter.heroku.com/articles/heroku-cli
   ```

2. **Login e Criar App**
   ```bash
   heroku login
   heroku create nome-do-seu-app
   ```

3. **Configurar Variáveis**
   ```bash
   heroku config:set NODE_ENV=production
   heroku config:set MONGODB_URI="sua_string_mongodb"
   heroku config:set JWT_SECRET="sua_chave_jwt"
   heroku config:set LICENSE_ENCRYPTION_KEY="sua_chave_cripto"
   heroku config:set ALLOWED_ORIGINS="https://nome-do-seu-app.herokuapp.com"
   ```

4. **Deploy**
   ```bash
   git push heroku main
   heroku open
   ```

---

### Opção 4: Vercel (Limitações)

⚠️ **Atenção**: Vercel é ideal para frontend, mas tem limitações para aplicações Node.js com banco de dados persistente.

#### Passos:

1. **Instalar Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Deploy**
   ```bash
   vercel
   ```

3. **Configurar Variáveis**
   - Acesse o dashboard do Vercel
   - Vá em Settings → Environment Variables
   - Adicione todas as variáveis do `.env.example`

---

### Opção 5: Docker (Para qualquer servidor)

#### Para deploy em VPS ou servidor próprio:

1. **Build da Imagem**
   ```bash
   docker build -t gerador-certificados .
   ```

2. **Executar com Docker Compose**
   ```bash
   # Criar arquivo .env com suas variáveis
   docker-compose up -d
   ```

3. **Verificar Status**
   ```bash
   docker-compose ps
   docker-compose logs -f
   ```

---

## 🔐 Geração de Chaves Secretas

Para gerar chaves seguras para JWT e criptografia:

### Método 1: Node.js
```javascript
// Execute no Node.js
require('crypto').randomBytes(32).toString('hex')
```

### Método 2: PowerShell
```powershell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 255 }))
```

### Método 3: Online
Use [RandomKeygen](https://randomkeygen.com/) - CodeIgniter Encryption Keys

---

## ✅ Checklist Pós-Deploy

Após fazer o deploy, verifique:

- [ ] Aplicação está acessível pela URL
- [ ] Consegue fazer login
- [ ] Banco de dados está conectado
- [ ] Rotas da API funcionam
- [ ] CORS está configurado corretamente
- [ ] SSL/HTTPS está ativo
- [ ] Logs não mostram erros
- [ ] Criar usuário admin inicial

---

## 🔧 Criando Usuário Admin em Produção

Após o deploy, crie o primeiro usuário admin:

### Método 1: Via Script (Recomendado)

1. **No Render/Railway**: Use o Shell/Terminal
   ```bash
   node criar-admin.js
   ```

### Método 2: MongoDB Atlas
1. Acesse MongoDB Atlas
2. Vá em Collections → usuarios
3. Insira documento manualmente:
   ```json
   {
     "email": "admin@certificados.com",
     "senha": "$2a$10$hashBcryptDaSenha...",
     "nome": "Administrador",
     "role": "admin",
     "ativo": true,
     "dataCriacao": "2026-01-24T00:00:00.000Z"
   }
   ```

### Método 3: API
Use Postman/Thunder Client para chamar:
```
POST https://seu-app.onrender.com/api/auth/register
{
  "email": "admin@certificados.com",
  "senha": "SenhaForte123!",
  "nome": "Administrador"
}
```

Depois, promova para admin direto no banco.

---

## 🐛 Troubleshooting

### Erro: Cannot connect to MongoDB
- Verifique se a string de conexão está correta
- Confirme que o IP `0.0.0.0/0` está liberado no Atlas
- Verifique se a senha não tem caracteres especiais sem encoding

### Erro: Application Error
- Verifique os logs: `heroku logs --tail` ou no dashboard
- Confirme que todas as variáveis de ambiente estão configuradas
- Verifique se o `PORT` está correto

### Erro: CORS
- Adicione o domínio correto em `ALLOWED_ORIGINS`
- Para múltiplos domínios: `https://dominio1.com,https://dominio2.com`

### App está lento
- Planos gratuitos têm limitações
- Render/Railway dormem após inatividade (warm-up na primeira requisição)
- Considere upgrade para plano pago

---

## 📊 Monitoramento

### Logs em Tempo Real

**Render**:
```bash
# No dashboard → Logs tab
```

**Railway**:
```bash
# No dashboard → Deployments → View Logs
```

**Heroku**:
```bash
heroku logs --tail
```

### Métricas
- Acesse o dashboard da plataforma
- Monitore uso de memória, CPU e requests
- Configure alertas se disponível

---

## 🔄 Atualizações

Para atualizar a aplicação em produção:

1. **Commit alterações**
   ```bash
   git add .
   git commit -m "Descrição das mudanças"
   git push origin main
   ```

2. **Deploy Automático**
   - Render/Railway detectam push e fazem deploy automático
   - Aguarde 3-5 minutos

3. **Deploy Manual (Heroku)**
   ```bash
   git push heroku main
   ```

---

## 💰 Custos Estimados

| Plataforma | Plano Gratuito | Plano Básico Pago |
|------------|----------------|-------------------|
| Render     | ✅ Sim ($0)    | $7/mês            |
| Railway    | $5 crédito/mês | $5/mês + uso      |
| Heroku     | ❌ Não         | $5-7/mês          |
| MongoDB Atlas | ✅ 512MB gratuito | $9/mês (2GB)   |

---

## 📞 Suporte

Se encontrar problemas:

1. Verifique os logs da aplicação
2. Consulte a documentação da plataforma
3. Verifique as variáveis de ambiente
4. Teste localmente primeiro

---

## 🎉 Deploy Bem-Sucedido!

Após seguir este guia, sua aplicação estará:
- ✅ Rodando em produção
- ✅ Com banco de dados na nuvem
- ✅ Com SSL/HTTPS
- ✅ Pronta para uso

**URL da Aplicação**: `https://seu-app.plataforma.com`

Bom deploy! 🚀

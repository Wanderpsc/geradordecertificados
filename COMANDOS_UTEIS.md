# 🛠️ Comandos Úteis - Deploy e Manutenção

## 📦 NPM Scripts Disponíveis

### Desenvolvimento Local
```bash
# Iniciar em modo desenvolvimento (com auto-reload)
npm run dev

# Iniciar em modo produção
npm start
```

### Validação e Deploy
```bash
# Validar se o projeto está pronto para deploy
npm run validate

# Executar validação antes do deploy (automático)
npm run predeploy
```

### Docker
```bash
# Construir imagem Docker
npm run docker:build

# Iniciar containers (app + MongoDB)
npm run docker:run

# Parar containers
npm run docker:stop

# Ver logs dos containers
npm run docker:logs
```

---

## 🐳 Comandos Docker Diretos

### Build e Run
```bash
# Build da imagem
docker build -t gerador-certificados .

# Executar container individual
docker run -p 5000:5000 --env-file .env gerador-certificados

# Executar com docker-compose
docker-compose up -d

# Parar tudo
docker-compose down

# Ver logs em tempo real
docker-compose logs -f

# Reconstruir após mudanças
docker-compose up -d --build
```

### Manutenção
```bash
# Listar containers
docker ps -a

# Remover containers parados
docker container prune

# Remover imagens não utilizadas
docker image prune

# Entrar no container em execução
docker exec -it <container_id> sh

# Ver uso de recursos
docker stats
```

---

## 🚀 Git e Deploy

### Workflow Normal
```bash
# Verificar status
git status

# Adicionar alterações
git add .

# Commit
git commit -m "Descrição das mudanças"

# Push para GitHub (deploy automático)
git push origin main
```

### Branches e Versões
```bash
# Criar branch de feature
git checkout -b feature/nova-funcionalidade

# Merge de volta para main
git checkout main
git merge feature/nova-funcionalidade

# Criar tag de versão
git tag -a v1.0.0 -m "Versão 1.0.0"
git push origin v1.0.0

# Listar tags
git tag
```

### Desfazer Mudanças
```bash
# Desfazer último commit (mantém alterações)
git reset --soft HEAD~1

# Desfazer último commit (remove alterações)
git reset --hard HEAD~1

# Reverter arquivo específico
git checkout -- arquivo.js

# Voltar para commit específico
git checkout <commit_hash>
```

---

## 🗄️ MongoDB - Comandos Úteis

### Backup e Restore
```bash
# Backup do banco (MongoDB local)
mongodump --db certificados_db --out ./backup

# Restore do backup
mongorestore --db certificados_db ./backup/certificados_db

# Backup do MongoDB Atlas
# Use MongoDB Compass ou faça via Atlas dashboard
```

### Queries Diretas (MongoDB Shell)
```bash
# Conectar ao MongoDB local
mongosh

# Conectar ao MongoDB Atlas
mongosh "mongodb+srv://cluster.mongodb.net/certificados_db" --username seu_usuario

# Usar banco de dados
use certificados_db

# Listar collections
show collections

# Contar documentos
db.usuarios.countDocuments()

# Buscar usuários admin
db.usuarios.find({role: "admin"})

# Atualizar usuário para admin
db.usuarios.updateOne(
  {email: "usuario@email.com"},
  {$set: {role: "admin"}}
)

# Deletar usuário
db.usuarios.deleteOne({email: "usuario@email.com"})

# Ver todos os alunos
db.alunos.find().limit(10)

# Limpar collection (CUIDADO!)
db.alunos.deleteMany({})
```

---

## 🔧 Node.js - Comandos de Manutenção

### Gerenciamento de Dependências
```bash
# Instalar todas as dependências
npm install

# Instalar dependência específica
npm install express

# Instalar como dev dependency
npm install --save-dev nodemon

# Atualizar todas as dependências
npm update

# Verificar dependências desatualizadas
npm outdated

# Auditar vulnerabilidades
npm audit

# Corrigir vulnerabilidades automaticamente
npm audit fix

# Limpar cache do npm
npm cache clean --force

# Reinstalar tudo do zero
rm -rf node_modules package-lock.json
npm install
```

### Gerenciamento de Processos
```bash
# Verificar processos Node rodando
tasklist | findstr node

# Matar processo na porta 5000 (Windows)
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Ver uso de memória/CPU (Windows)
wmic process where name="node.exe" get ProcessId,WorkingSetSize,PercentProcessorTime
```

---

## 🌐 Render.com - CLI

### Instalação
```bash
npm install -g render-cli
render login
```

### Comandos
```bash
# Listar serviços
render services list

# Ver logs em tempo real
render logs <service-id>

# Forçar novo deploy
render deploy <service-id>

# Ver status
render status <service-id>
```

---

## 🚂 Railway - CLI

### Instalação
```bash
npm install -g @railway/cli
railway login
```

### Comandos
```bash
# Link projeto local com Railway
railway link

# Ver logs
railway logs

# Executar comando no ambiente Railway
railway run node criar-admin.js

# Ver variáveis de ambiente
railway variables

# Abrir no dashboard
railway open
```

---

## ☁️ Heroku - CLI

### Instalação
```bash
# Windows (Chocolatey)
choco install heroku-cli
```

### Comandos Básicos
```bash
# Login
heroku login

# Criar app
heroku create nome-do-app

# Deploy
git push heroku main

# Ver logs
heroku logs --tail

# Abrir app no navegador
heroku open

# Executar comando no dyno
heroku run node criar-admin.js

# Reiniciar app
heroku restart

# Ver status
heroku ps
```

### Variáveis de Ambiente
```bash
# Listar variáveis
heroku config

# Adicionar variável
heroku config:set CHAVE=valor

# Remover variável
heroku config:unset CHAVE

# Adicionar múltiplas
heroku config:set VAR1=valor1 VAR2=valor2
```

---

## 🔐 Geração de Chaves Seguras

### No Node.js
```javascript
// Executar no Node REPL
require('crypto').randomBytes(32).toString('hex')

// Ou criar arquivo generate-keys.js
const crypto = require('crypto');
console.log('JWT_SECRET:', crypto.randomBytes(32).toString('hex'));
console.log('LICENSE_KEY:', crypto.randomBytes(32).toString('hex'));
```

### No PowerShell
```powershell
# Gerar chave de 32 bytes
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 255 }))
```

### No Linux/Mac
```bash
# Gerar chave hexadecimal
openssl rand -hex 32

# Gerar chave base64
openssl rand -base64 32
```

---

## 📊 Monitoramento e Logs

### Ver logs em produção

**Render**:
- Dashboard → Logs tab
- Ou via CLI: `render logs <service-id>`

**Railway**:
- Dashboard → Deployments → View Logs
- Ou via CLI: `railway logs`

**Heroku**:
```bash
heroku logs --tail
heroku logs --source app --tail
heroku logs --num 100
```

### Filtrar logs
```bash
# Heroku - ver apenas erros
heroku logs --source app | grep ERROR

# Heroku - ver logs específicos
heroku logs --dyno web.1
```

---

## 🧪 Testes e Debugging

### Testar endpoints localmente
```bash
# Com curl (PowerShell)
curl http://localhost:5000/api/auth/login `
  -Method POST `
  -ContentType "application/json" `
  -Body '{"email":"admin@email.com","senha":"senha123"}'

# Com Invoke-WebRequest
Invoke-WebRequest -Uri "http://localhost:5000/api/alunos" `
  -Method GET `
  -Headers @{"Authorization"="Bearer SEU_TOKEN"}
```

### Debugging
```bash
# Executar com debug
node --inspect server/server.js

# Com breakpoint específico
node --inspect-brk server/server.js
```

---

## 📝 Atalhos e Aliases Úteis

Adicione ao seu perfil do PowerShell (`$PROFILE`):

```powershell
# Atalhos do projeto
function Start-Dev { npm run dev }
function Start-Prod { npm start }
function Validate-Deploy { npm run validate }
function Docker-Up { docker-compose up -d }
function Docker-Down { docker-compose down }
function Docker-Logs { docker-compose logs -f }
function Git-Deploy { git add . ; git commit -m $args[0] ; git push origin main }

# Aliases
Set-Alias dev Start-Dev
Set-Alias prod Start-Prod
Set-Alias validate Validate-Deploy
Set-Alias dup Docker-Up
Set-Alias ddown Docker-Down
Set-Alias dlogs Docker-Logs
```

Uso:
```bash
dev          # npm run dev
validate     # npm run validate
dup          # docker-compose up -d
dlogs        # docker-compose logs -f
```

---

## 💡 Dicas Rápidas

### Verificar se porta está em uso
```powershell
# Windows
netstat -ano | findstr :5000

# Matar processo na porta
$pid = (Get-NetTCPConnection -LocalPort 5000).OwningProcess
Stop-Process -Id $pid -Force
```

### Testar conectividade MongoDB
```javascript
// test-db.js
require('dotenv').config();
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('✅ MongoDB conectado com sucesso!');
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Erro ao conectar:', err.message);
    process.exit(1);
  });
```

```bash
node test-db.js
```

### Limpar tudo e recomeçar
```bash
# Remover node_modules e reinstalar
rm -rf node_modules package-lock.json
npm install

# Limpar containers Docker
docker-compose down -v
docker system prune -a
```

---

## 📚 Links Úteis

- [Render Docs](https://render.com/docs)
- [Railway Docs](https://docs.railway.app)
- [Heroku Dev Center](https://devcenter.heroku.com)
- [MongoDB Atlas Docs](https://docs.atlas.mongodb.com)
- [Docker Docs](https://docs.docker.com)
- [Express.js Guide](https://expressjs.com/en/guide/routing.html)
- [Mongoose Docs](https://mongoosejs.com/docs/guide.html)

---

**Mantenha este arquivo como referência rápida!** 🚀

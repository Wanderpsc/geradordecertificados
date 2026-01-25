# ✅ Checklist de Deploy - Gerador de Certificados

Use esta checklist para garantir um deploy sem problemas!

---

## 🎯 Fase 1: Preparação (Local)

### Código e Dependências
- [ ] Todas as alterações commitadas
- [ ] `npm install` executado sem erros
- [ ] Aplicação rodando localmente sem problemas
- [ ] Testar todas as funcionalidades principais

### Arquivos de Deploy
- [ ] `Procfile` presente
- [ ] `Dockerfile` presente  
- [ ] `render.yaml` ou `railway.json` presente
- [ ] `.env.example` atualizado com todas as variáveis
- [ ] `.gitignore` configurado (não commitar `.env`)

### Validação
```bash
npm run validate
```
- [ ] Script de validação passou sem erros críticos

---

## 🗄️ Fase 2: Banco de Dados (MongoDB Atlas)

### Criar Conta e Cluster
- [ ] Conta criada em https://www.mongodb.com/cloud/atlas
- [ ] Cluster gratuito (M0) criado
- [ ] Região escolhida (preferir mais próxima)

### Configurar Acesso
- [ ] Usuário do banco criado
  - Username: `admin_certificados`
  - Password: (anotar senha segura)
- [ ] Network Access configurado
  - Adicionar `0.0.0.0/0` para acesso global
- [ ] String de conexão copiada
  ```
  mongodb+srv://usuario:senha@cluster.mongodb.net/certificados_db
  ```

### Testar Conexão (Opcional)
- [ ] Testar conexão local com a string do Atlas
- [ ] Criar collections iniciais se necessário

---

## 🔐 Fase 3: Variáveis de Ambiente

### Gerar Chaves Seguras

No Node.js, execute para cada chave:
```javascript
require('crypto').randomBytes(32).toString('hex')
```

- [ ] `JWT_SECRET` gerada (32+ caracteres)
- [ ] `LICENSE_ENCRYPTION_KEY` gerada (32+ caracteres)
- [ ] Chaves anotadas em local seguro

### Lista de Variáveis Necessárias

```env
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://...
JWT_SECRET=chave_gerada_jwt
LICENSE_ENCRYPTION_KEY=chave_gerada_license
ALLOWED_ORIGINS=https://seu-app.plataforma.com
```

- [ ] Todas as variáveis preparadas
- [ ] Valores copiados para notepad/documento seguro

---

## 📦 Fase 4: Repositório GitHub

### Inicializar Git (se ainda não fez)
```bash
git init
git add .
git commit -m "Initial commit - pronto para deploy"
```

### Criar Repositório no GitHub
- [ ] Repositório criado no GitHub
- [ ] Repositório configurado como público ou privado
- [ ] README.md atualizado (opcional)

### Push do Código
```bash
git remote add origin https://github.com/seu-usuario/seu-repo.git
git branch -M main
git push -u origin main
```

- [ ] Código enviado para GitHub
- [ ] Verificar que arquivos sensíveis não foram commitados (`.env`)

---

## 🚀 Fase 5: Deploy (Render.com - Recomendado)

### Criar Conta
- [ ] Conta criada em https://render.com
- [ ] Login com GitHub feito

### Criar Web Service
- [ ] Clicar em "New +" → "Web Service"
- [ ] Repositório GitHub conectado
- [ ] Configurações básicas:
  - **Name**: `gerador-certificados`
  - **Environment**: `Node`
  - **Branch**: `main`
  - **Build Command**: `npm install`
  - **Start Command**: `npm start`
  - **Plan**: `Free`

### Configurar Variáveis de Ambiente
No painel do Render, adicionar cada variável:

- [ ] `NODE_ENV` = `production`
- [ ] `PORT` = `10000`
- [ ] `MONGODB_URI` = (sua string do Atlas)
- [ ] `JWT_SECRET` = (chave gerada)
- [ ] `LICENSE_ENCRYPTION_KEY` = (chave gerada)
- [ ] `ALLOWED_ORIGINS` = (URL do seu app Render)

### Iniciar Deploy
- [ ] Clicar em "Create Web Service"
- [ ] Aguardar build (3-5 minutos)
- [ ] Verificar logs para erros

---

## ✅ Fase 6: Verificação Pós-Deploy

### Testar Aplicação
- [ ] URL acessível: `https://seu-app.onrender.com`
- [ ] Página de login carrega
- [ ] Assets (CSS, JS) carregando corretamente
- [ ] Sem erros no console do navegador

### Testar Conexão com Banco
- [ ] Fazer requisição de teste
- [ ] Verificar logs do servidor
- [ ] Confirmar conexão com MongoDB nos logs

### Criar Usuário Admin

**Opção 1: Via Shell do Render**
```bash
node criar-admin.js
```

**Opção 2: Via MongoDB Atlas**
- [ ] Acessar Collections → usuarios
- [ ] Inserir documento admin manualmente

**Opção 3: Via API**
```bash
POST https://seu-app.onrender.com/api/auth/register
{
  "email": "admin@certificados.com",
  "senha": "SenhaForte123!",
  "nome": "Administrador"
}
```

- [ ] Usuário admin criado
- [ ] Promovido para role `admin` no banco

### Testar Funcionalidades
- [ ] Login funciona
- [ ] Dashboard carrega
- [ ] CRUD de alunos funciona
- [ ] Geração de certificado funciona
- [ ] Sistema de licenças funciona

---

## 📊 Fase 7: Monitoramento

### Configurar Alertas (Opcional)
- [ ] Alertas de downtime configurados
- [ ] Email de notificação configurado

### Verificar Logs
- [ ] Logs acessíveis no dashboard
- [ ] Sem erros críticos nos logs
- [ ] Performance aceitável

### Documentar
- [ ] URL de produção anotada
- [ ] Credenciais admin anotadas
- [ ] Documentação de manutenção criada

---

## 🔄 Fase 8: Atualizações Futuras

### Processo de Atualização
```bash
# 1. Fazer alterações localmente
# 2. Testar localmente
npm run dev

# 3. Commit e push
git add .
git commit -m "Descrição das mudanças"
git push origin main

# 4. Deploy automático no Render
# Aguardar 3-5 minutos
```

- [ ] Processo de atualização documentado
- [ ] Equipe treinada para fazer updates

---

## 🎉 Deploy Completo!

Parabéns! Seu sistema está em produção!

### Informações Importantes

- **URL Produção**: `https://seu-app.onrender.com`
- **Admin Email**: `admin@certificados.com`
- **Admin Senha**: (anotada em local seguro)
- **MongoDB**: MongoDB Atlas (gerenciado)
- **Plataforma**: Render.com (free tier)

### Próximos Passos
- [ ] Configurar domínio customizado (opcional)
- [ ] Configurar SSL customizado (opcional)
- [ ] Implementar backup do banco (recomendado)
- [ ] Configurar monitoring/analytics
- [ ] Treinar usuários finais

---

## 📞 Suporte

Se encontrar problemas:

1. ✅ Verificar logs no dashboard da plataforma
2. ✅ Verificar variáveis de ambiente
3. ✅ Testar conexão com MongoDB Atlas
4. ✅ Consultar `DEPLOY_GUIDE.md`
5. ✅ Verificar issues conhecidas no GitHub

---

**Data do Deploy**: _________________
**Responsável**: _________________
**Plataforma**: _________________
**URL**: _________________

---

🚀 **Happy Deploying!**

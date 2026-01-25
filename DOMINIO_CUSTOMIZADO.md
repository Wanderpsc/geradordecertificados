# 🌐 Configuração de Domínio Customizado

Guia para configurar seu próprio domínio (ex: certificados.com.br) ao invés de usar o domínio da plataforma.

---

## 📋 Pré-requisitos

- [ ] Aplicação já em produção (Render, Railway, Heroku, etc.)
- [ ] Domínio registrado (GoDaddy, Registro.br, Hostinger, etc.)
- [ ] Acesso ao painel de DNS do domínio

---

## 🎯 Opção 1: Render.com

### Passo 1: Acessar Configurações
1. Acesse o dashboard do Render
2. Selecione seu serviço
3. Vá em **Settings** → **Custom Domain**

### Passo 2: Adicionar Domínio
1. Clique em **Add Custom Domain**
2. Digite seu domínio: `certificados.seudominio.com` ou `seudominio.com`
3. Render fornecerá valores de DNS

### Passo 3: Configurar DNS

**Para subdomínio (certificados.seudominio.com)**:
```
Tipo: CNAME
Nome: certificados
Valor: seu-app.onrender.com
TTL: 3600
```

**Para domínio raiz (seudominio.com)**:
```
Tipo: A
Nome: @
Valor: (IP fornecido pelo Render)
TTL: 3600

Tipo: AAAA (IPv6)
Nome: @
Valor: (IPv6 fornecido pelo Render)
TTL: 3600
```

### Passo 4: Verificar
- Aguarde propagação DNS (5min - 48h)
- Render detecta automaticamente
- SSL é provisionado automaticamente (Let's Encrypt)

### Passo 5: Atualizar Variáveis
Atualize `ALLOWED_ORIGINS`:
```
ALLOWED_ORIGINS=https://certificados.seudominio.com
```

---

## 🚂 Opção 2: Railway.app

### Passo 1: Acessar Settings
1. Dashboard do Railway
2. Selecione seu projeto
3. **Settings** → **Domains**

### Passo 2: Adicionar Domínio
1. Clique em **+ Add Domain**
2. Escolha **Custom Domain**
3. Digite: `certificados.seudominio.com`

### Passo 3: Configurar DNS

Railway fornece os valores:
```
Tipo: CNAME
Nome: certificados
Valor: fornecido-pelo-railway.up.railway.app
TTL: 3600
```

### Passo 4: Verificação Automática
- Railway verifica DNS automaticamente
- SSL provisionado quando DNS propagar

---

## ☁️ Opção 3: Heroku

### Passo 1: Adicionar Domínio via CLI
```bash
heroku domains:add certificados.seudominio.com
```

Ou pelo Dashboard:
1. Settings → Domains
2. Add domain

### Passo 2: Obter DNS Target
```bash
heroku domains
```

Exemplo de output:
```
=== nome-app Domain Names
certificados.seudominio.com  DNS Target: warm-reef-abc123.herokudns.com
```

### Passo 3: Configurar DNS
```
Tipo: CNAME
Nome: certificados
Valor: warm-reef-abc123.herokudns.com
TTL: 3600
```

### Passo 4: SSL (Automático)
- Heroku provisiona SSL automaticamente
- Aguarde alguns minutos após DNS propagar

---

## 🔧 Opção 4: Vercel

### Passo 1: Dashboard
1. Acesse projeto no Vercel
2. Settings → Domains

### Passo 2: Adicionar Domínio
1. Digite seu domínio
2. Vercel fornece instruções

### Passo 3: DNS
```
Tipo: CNAME
Nome: certificados (ou @)
Valor: cname.vercel-dns.com
TTL: 3600
```

---

## 🏢 Provedores de Domínio Comuns

### Registro.br (Brasil)

1. Acesse https://registro.br
2. Faça login
3. **Meus Domínios** → Selecione o domínio
4. **DNS** → **Modo Avançado**
5. Adicione os registros CNAME/A conforme plataforma

### GoDaddy

1. Acesse https://godaddy.com
2. **Meus Produtos** → **DNS**
3. Clique em **Gerenciar DNS**
4. **Adicionar** → Escolha tipo (CNAME/A)
5. Preencha com valores da plataforma

### Hostinger

1. Acesse painel Hostinger
2. **Domínios** → Selecione domínio
3. **DNS / Nameservers** → **Gerenciar DNS**
4. Adicione registros

### Namecheap

1. Dashboard → Domain List
2. Selecione domínio → **Manage**
3. **Advanced DNS**
4. **Add New Record**

### Cloudflare (Proxy)

1. Adicione site no Cloudflare
2. Configure nameservers no registrador
3. DNS → Add Record
4. **Proxy status**: Orange (com CDN) ou Gray (DNS only)

---

## ⚙️ Configurações DNS Completas

### Configuração Mínima (Subdomínio)
```dns
certificados.seudominio.com    CNAME    seu-app.plataforma.com    3600
```

### Configuração Completa (Domínio + WWW)
```dns
@                              A        IP-da-plataforma         3600
www                            CNAME    seu-app.plataforma.com   3600
certificados                   CNAME    seu-app.plataforma.com   3600
```

### Com Email (Opcional)
```dns
@                              MX       10 mail.seudominio.com   3600
mail                           A        IP-do-servidor-email     3600
```

---

## 🔐 SSL/HTTPS

### Automático (Recomendado)
Todas as plataformas modernas provisionam SSL automaticamente via **Let's Encrypt**:
- ✅ Render
- ✅ Railway
- ✅ Heroku
- ✅ Vercel

**Aguarde**: 5 minutos a 2 horas após DNS propagar

### Verificar SSL
```bash
# PowerShell
Invoke-WebRequest -Uri "https://certificados.seudominio.com"

# Curl
curl -I https://certificados.seudominio.com
```

### Forçar HTTPS
Adicione ao seu `server.js`:

```javascript
// Middleware para forçar HTTPS em produção
if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    if (req.header('x-forwarded-proto') !== 'https') {
      res.redirect(`https://${req.header('host')}${req.url}`);
    } else {
      next();
    }
  });
}
```

---

## 📊 Verificação e Troubleshooting

### Verificar Propagação de DNS

**Online**:
- https://dnschecker.org
- https://whatsmydns.net

**CLI**:
```bash
# PowerShell
nslookup certificados.seudominio.com

# Com DNS específico (Google)
nslookup certificados.seudominio.com 8.8.8.8

# Dig (se disponível)
dig certificados.seudominio.com
```

### Problemas Comuns

#### DNS não propaga
- **Causa**: TTL alto ou cache
- **Solução**: Aguarde ou limpe cache DNS
  ```bash
  ipconfig /flushdns
  ```

#### Erro: "Domain not verified"
- **Causa**: DNS ainda não propagou
- **Solução**: Aguarde mais tempo (até 48h)

#### SSL não provisiona
- **Causa**: DNS incorreto ou não propagado
- **Solução**: 
  1. Verifique registros DNS
  2. Aguarde propagação completa
  3. Tente remover e adicionar domínio novamente

#### Redirecionamento infinito
- **Causa**: Conflito HTTPS
- **Solução**: Verifique middleware de redirecionamento

#### CORS errors com novo domínio
- **Causa**: `ALLOWED_ORIGINS` desatualizado
- **Solução**: Atualize variável de ambiente
  ```env
  ALLOWED_ORIGINS=https://certificados.seudominio.com,https://www.seudominio.com
  ```

---

## 📧 Email Profissional (Opcional)

Para ter email como `admin@seudominio.com`:

### Opção 1: Google Workspace (Pago)
- $6/mês por usuário
- Gmail interface
- https://workspace.google.com

### Opção 2: Microsoft 365 (Pago)
- $5/mês por usuário
- Outlook interface

### Opção 3: Zoho Mail (Gratuito/Pago)
- Plano gratuito: 1 domínio, 5 usuários
- https://www.zoho.com/mail

### Opção 4: Provedor do Domínio
- Muitos incluem email gratuito
- Verifique seu registrador

**Configuração DNS para Email**:
```dns
@           MX    10    mail.seudominio.com
mail        A          IP-do-servidor
```

---

## ✅ Checklist Pós-Configuração

- [ ] Domínio propagado (verificado em dnschecker.org)
- [ ] Site acessível via domínio customizado
- [ ] HTTPS funcionando
- [ ] SSL válido (cadeado verde)
- [ ] WWW redireciona para domínio principal (ou vice-versa)
- [ ] CORS configurado com novo domínio
- [ ] Variáveis de ambiente atualizadas
- [ ] Domínio antigo (da plataforma) ainda funciona (backup)

---

## 💰 Custos

| Item | Custo Anual (Estimado) |
|------|------------------------|
| Domínio .com | $10-15 |
| Domínio .com.br | R$40-60 |
| Domínio .app | $15-20 |
| SSL (Let's Encrypt) | Gratuito ✅ |
| Hosting (Render/Railway) | Gratuito - $7/mês |
| Email profissional | $0-72/ano |

---

## 🎉 Configuração Completa!

Seu sistema agora está acessível em:
- ✅ `https://certificados.seudominio.com`
- ✅ Com SSL válido
- ✅ Domínio profissional

### Próximos Passos
- [ ] Atualizar materiais de marketing com novo domínio
- [ ] Configurar Google Analytics (opcional)
- [ ] Adicionar ao Google Search Console (SEO)
- [ ] Configurar email profissional
- [ ] Compartilhar com usuários!

---

**Dúvidas?** Consulte a documentação da sua plataforma de deploy e do registrador de domínio.

🌐 **Bom domínio!**

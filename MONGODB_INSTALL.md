# 🚀 INSTALAÇÃO DO MONGODB

## Windows

### Opção 1: Instalação Local (Recomendado para Desenvolvimento)

1. **Download**
   - Acesse: https://www.mongodb.com/try/download/community
   - Selecione: Windows / Version: 7.0 (Current) / Package: msi
   - Clique em "Download"

2. **Instalação**
   - Execute o arquivo `.msi` baixado
   - Escolha "Complete" installation
   - **IMPORTANTE**: Marque "Install MongoDB as a Service"
   - Deixe as outras opções padrão
   - Clique em "Install"

3. **Verificar Instalação**
   ```bash
   mongod --version
   ```

### Opção 2: MongoDB Atlas (Cloud - GRÁTIS)

1. **Criar Conta**
   - Acesse: https://www.mongodb.com/cloud/atlas/register
   - Registre-se gratuitamente

2. **Criar Cluster**
   - Clique em "Build a Database"
   - Escolha "M0 FREE"
   - Selecione região mais próxima (ex: São Paulo)
   - Clique em "Create"

3. **Configurar Acesso**
   - Crie um usuário e senha (anote!)
   - Em "Network Access", adicione `0.0.0.0/0` (permite qualquer IP)

4. **Obter Connection String**
   - Clique em "Connect"
   - Escolha "Connect your application"
   - Copie a connection string
   - Exemplo: `mongodb+srv://usuario:senha@cluster.mongodb.net/certificados_db`

5. **Configurar no Projeto**
   - Abra o arquivo `.env`
   - Substitua o valor de `MONGODB_URI` pela connection string
   - **IMPORTANTE**: Substitua `<password>` pela sua senha

## Depois da Instalação

Execute no terminal:

```bash
npm start
```

Acesse: http://localhost:5000/login.html

---

## 📊 Comparação

| Recurso | Local | Atlas (Cloud) |
|---------|-------|---------------|
| **Preço** | Grátis | Grátis (512MB) |
| **Velocidade** | Muito rápida | Depende da internet |
| **Backup** | Manual | Automático |
| **Acesso remoto** | Não | Sim |
| **Melhor para** | Desenvolvimento | Produção |

## 💡 Recomendação

- **Desenvolvimento/Testes**: Use instalação local
- **Produção/Venda**: Use MongoDB Atlas

---

**Dúvidas?** Consulte o README.md principal!

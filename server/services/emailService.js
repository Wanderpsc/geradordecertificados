const nodemailer = require('nodemailer');

// ─── Criar transporter ────────────────────────────────────────────────────────
function criarTransporter() {
    const host   = process.env.EMAIL_HOST || 'smtp.gmail.com';
    const port   = parseInt(process.env.EMAIL_PORT || '587');
    const user   = process.env.EMAIL_USER;
    const pass   = process.env.EMAIL_PASS;

    if (!user || !pass) {
        console.warn('⚠️  EMAIL_USER / EMAIL_PASS não configurados — emails desativados.');
        return null;
    }

    return nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass },
        tls: { rejectUnauthorized: false }
    });
}

const FROM = () =>
    `"Gerador de Certificados" <${process.env.EMAIL_USER || 'noreply@geradordecertificados.com'}>`;

// ─── Helpers HTML ─────────────────────────────────────────────────────────────
function wrapEmail(titulo, corpo) {
    return `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8">
<style>
  body{margin:0;padding:0;background:#f0f4ff;font-family:'Segoe UI',Arial,sans-serif}
  .wrap{max-width:560px;margin:32px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(30,64,175,.12)}
  .header{background:linear-gradient(135deg,#1e40af,#1e3a8a);color:#fff;padding:32px 32px 24px;text-align:center}
  .header h1{margin:0;font-size:1.5rem}
  .header p{margin:8px 0 0;opacity:.85;font-size:14px}
  .body{padding:28px 32px;color:#1e293b;font-size:14.5px;line-height:1.7}
  .cta{display:inline-block;margin:18px 0;padding:13px 28px;background:linear-gradient(135deg,#1e40af,#3b82f6);color:#fff;text-decoration:none;border-radius:10px;font-weight:700;font-size:15px}
  .box{background:#eff6ff;border-radius:10px;padding:16px 20px;margin:16px 0;font-size:13.5px}
  .footer{background:#f8fafc;padding:16px 32px;text-align:center;color:#94a3b8;font-size:12px;border-top:1px solid #e2e8f0}
</style>
</head><body>
<div class="wrap">
  <div class="header">
    <div style="font-size:2.5rem;margin-bottom:8px">📜</div>
    <h1>Gerador de Certificados</h1>
    <p>Sistema Profissional de Certificados Escolares</p>
  </div>
  <div class="body">
    <h2 style="color:#1e3a8a;margin-top:0">${titulo}</h2>
    ${corpo}
  </div>
  <div class="footer">© 2026 Wander Pires Silva Coelho · <a href="mailto:wanderpsc@gmail.com" style="color:#1e40af">wanderpsc@gmail.com</a></div>
</div>
</body></html>`;
}

// ─── Enviar email genérico ────────────────────────────────────────────────────
async function enviar({ para, assunto, html }) {
    const transporter = criarTransporter();
    if (!transporter) return;
    try {
        await transporter.sendMail({ from: FROM(), to: para, subject: assunto, html });
        console.log(`📧 Email enviado para ${para}: ${assunto}`);
    } catch (err) {
        console.error(`❌ Erro ao enviar email para ${para}:`, err.message);
    }
}

// ─── 1. Boas-vindas (pós-registro) ───────────────────────────────────────────
async function enviarBoasVindas({ nome, email, instituicao }) {
    const corpo = `
        <p>Olá, <strong>${nome}</strong>! 🎉</p>
        <p>Seja bem-vindo(a) ao <strong>Gerador de Certificados Escolares</strong>!</p>
        <p>Sua conta foi criada com sucesso${instituicao ? ` para <strong>${instituicao}</strong>` : ''}.</p>
        <div class="box">
            <strong>O que você pode fazer agora:</strong><br>
            • Criar certificados em PDF com templates personalizados<br>
            • Gerar históricos do Ensino Fundamental e Médio<br>
            • Gerenciar alunos e turmas
        </div>
        <a href="https://gerador-certificados.surge.sh/index.html" class="cta">Acessar o Sistema →</a>
        <p style="color:#64748b;font-size:13px">Dúvidas? Responda este email ou acesse nossa página de planos para desbloquear recursos extras.</p>`;
    await enviar({
        para: email,
        assunto: '🎓 Bem-vindo(a) ao Gerador de Certificados!',
        html: wrapEmail('Bem-vindo(a)!', corpo)
    });
}

// ─── 2. Confirmação de pagamento (comprador) ──────────────────────────────────
async function enviarConfirmacaoPagamento({ nome, email, plano, valor, metodo, expiracao }) {
    const metodoLabel = metodo === 'pix' ? 'PIX' : 'Cartão de Crédito';
    const expiracaoStr = expiracao
        ? new Date(expiracao).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
        : '—';
    const corpo = `
        <p>Olá, <strong>${nome}</strong>! ✅</p>
        <p>Seu pagamento foi <strong>confirmado</strong> com sucesso!</p>
        <div class="box">
            <strong>📋 Detalhes da compra:</strong><br>
            <br>
            🎓 Plano: <strong>${plano}</strong><br>
            💰 Valor: <strong>R$ ${Number(valor).toFixed(2).replace('.', ',')}</strong><br>
            💳 Forma de pagamento: <strong>${metodoLabel}</strong><br>
            📅 Licença válida até: <strong>${expiracaoStr}</strong>
        </div>
        <p>Sua licença já está ativa! Acesse o sistema agora para começar a usar:</p>
        <a href="https://gerador-certificados.surge.sh/index.html" class="cta">Acessar o Sistema →</a>
        <p style="color:#64748b;font-size:13px">Guarde este email como comprovante. Em caso de dúvidas, entre em contato: <a href="mailto:wanderpsc@gmail.com">wanderpsc@gmail.com</a></p>`;
    await enviar({
        para: email,
        assunto: `✅ Pagamento confirmado — ${plano}`,
        html: wrapEmail('Pagamento Confirmado!', corpo)
    });
}

// ─── 3. Notificação de nova venda (admin) ─────────────────────────────────────
async function enviarNotificacaoVenda({ compradorNome, compradorEmail, plano, valor, metodo }) {
    const adminEmail = process.env.EMAIL_ADMIN || process.env.EMAIL_USER;
    if (!adminEmail) return;
    const metodoLabel = metodo === 'pix' ? 'PIX' : 'Cartão de Crédito';
    const corpo = `
        <p>🎉 Nova venda realizada no Gerador de Certificados!</p>
        <div class="box">
            <strong>👤 Comprador:</strong> ${compradorNome} (${compradorEmail})<br>
            <strong>🎓 Plano:</strong> ${plano}<br>
            <strong>💰 Valor:</strong> R$ ${Number(valor).toFixed(2).replace('.', ',')}<br>
            <strong>💳 Método:</strong> ${metodoLabel}<br>
            <strong>🕐 Data:</strong> ${new Date().toLocaleString('pt-BR')}
        </div>
        <a href="https://gerador-certificados.onrender.com/api/admin/dashboard" class="cta">Ver no Admin →</a>`;
    await enviar({
        para: adminEmail,
        assunto: `💰 Nova venda: ${plano} — ${compradorNome}`,
        html: wrapEmail('Nova Venda!', corpo)
    });
}

// ─── 4. PIX expirado / lembrete ───────────────────────────────────────────────
async function enviarLembretePix({ nome, email, plano, valor }) {
    const corpo = `
        <p>Olá, <strong>${nome}</strong>!</p>
        <p>Notamos que você iniciou a compra do plano <strong>${plano}</strong> mas o pagamento PIX ainda não foi confirmado.</p>
        <div class="box">
            💡 O QR Code PIX expira em <strong>30 minutos</strong>. Se precisar, volte à vitrine e gere um novo código.
        </div>
        <a href="https://gerador-certificados.surge.sh/comprar.html" class="cta">Voltar à vitrine →</a>`;
    await enviar({
        para: email,
        assunto: `⏳ Seu pagamento PIX está pendente — ${plano}`,
        html: wrapEmail('Pagamento PIX Pendente', corpo)
    });
}

module.exports = {
    enviarBoasVindas,
    enviarConfirmacaoPagamento,
    enviarNotificacaoVenda,
    enviarLembretePix
};

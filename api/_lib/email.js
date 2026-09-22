// Envio do código de login por e-mail — SÓ SERVIDOR.
// Usa Resend (HTTP, sem dependência) ou SMTP (nodemailer, se instalado).
// Se nenhum provedor estiver configurado, LANÇA erro — o backend então invalida
// o desafio e NÃO anuncia sucesso. SMTP do Auth do Supabase NÃO serve aqui:
// aquele SMTP é para as mensagens do próprio Auth, não expõe API de envio custom.
import { env } from './env.js';

function corpo(codigo, minutos) {
  const texto =
    `Seu código de acesso ao Peneiras On é: ${codigo}\n\n` +
    `Ele expira em ${minutos} minutos. Se você não tentou entrar, ignore este e-mail.`;
  const html =
    `<div style="font-family:Arial,Helvetica,sans-serif;max-width:480px;margin:auto">
       <h2 style="margin:0 0 8px">Peneiras On — código de acesso</h2>
       <p style="color:#444">Use o código abaixo para concluir seu login:</p>
       <p style="font-size:30px;letter-spacing:8px;font-weight:bold;margin:16px 0">${codigo}</p>
       <p style="color:#777;font-size:13px">Expira em ${minutos} minutos. Se você não tentou entrar, ignore este e-mail.</p>
     </div>`;
  return { texto, html };
}

export async function enviarCodigoLogin(destino, codigo, minutos) {
  const { texto, html } = corpo(codigo, minutos);
  const assunto = `Peneiras On · código ${codigo}`;

  if (env.resendKey) {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${env.resendKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: env.mailFrom, to: [destino], subject: assunto, text: texto, html }),
    });
    if (!r.ok) {
      const detalhe = await r.text().catch(() => '');
      throw new Error(`Falha ao enviar e-mail (Resend ${r.status}): ${detalhe.slice(0, 200)}`);
    }
    return;
  }

  if (env.smtp) {
    let nodemailer;
    try { nodemailer = (await import('nodemailer')).default; }
    catch { throw new Error('SMTP configurado mas dependência "nodemailer" não instalada.'); }
    const t = nodemailer.createTransport({
      host: env.smtp.host, port: env.smtp.port, secure: env.smtp.secure,
      auth: env.smtp.user ? { user: env.smtp.user, pass: env.smtp.pass } : undefined,
    });
    await t.sendMail({ from: env.mailFrom, to: destino, subject: assunto, text: texto, html });
    return;
  }

  throw new Error('Nenhum provedor de e-mail configurado (defina RESEND_API_KEY ou SMTP_*).');
}

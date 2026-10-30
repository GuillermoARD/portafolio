import { appendFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import nodemailer from 'nodemailer';
import { config } from './config.js';
import type { ContactInput } from './schema.js';

type Message = Omit<ContactInput, 'website'>;

const outboxDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'outbox');

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function buildEmail(msg: Message) {
  const subject = `[Portafolio] ${msg.subject || `Nuevo mensaje de ${msg.name}`}`;
  const text = `Nombre: ${msg.name}\nCorreo: ${msg.email}\nAsunto: ${msg.subject || '(sin asunto)'}\n\n${msg.message}`;
  const html = `
    <div style="font-family:system-ui,sans-serif;line-height:1.5;color:#0b1624">
      <h2 style="margin:0 0 12px">Nuevo mensaje desde tu portafolio</h2>
      <p><strong>Nombre:</strong> ${escapeHtml(msg.name)}<br>
      <strong>Correo:</strong> ${escapeHtml(msg.email)}<br>
      <strong>Asunto:</strong> ${escapeHtml(msg.subject || '(sin asunto)')}</p>
      <p style="white-space:pre-wrap;border-left:3px solid #38d6ff;padding-left:12px">${escapeHtml(msg.message)}</p>
    </div>`;
  return { subject, text, html };
}

async function sendWithResend(msg: Message) {
  const { subject, text, html } = buildEmail(msg);
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.mail.resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: config.mail.from,
      to: [config.mail.to],
      reply_to: msg.email,
      subject,
      text,
      html,
    }),
  });
  if (!res.ok) {
    throw new Error(`Resend respondió ${res.status}: ${await res.text()}`);
  }
}

let transporter: ReturnType<typeof nodemailer.createTransport> | undefined;

async function sendWithSmtp(msg: Message) {
  const { smtp } = config.mail;
  transporter ??= nodemailer.createTransport({
    host: smtp.host,
    port: smtp.port,
    secure: smtp.secure,
    auth: { user: smtp.user, pass: smtp.pass },
  });
  const { subject, text, html } = buildEmail(msg);
  await transporter.sendMail({
    from: config.mail.from,
    to: config.mail.to,
    replyTo: msg.email,
    subject,
    text,
    html,
  });
}

async function saveToOutbox(msg: Message) {
  await mkdir(outboxDir, { recursive: true });
  const entry = { receivedAt: new Date().toISOString(), ...msg };
  await appendFile(path.join(outboxDir, 'messages.jsonl'), JSON.stringify(entry) + '\n', 'utf8');
  console.log('\n[mail:test] Mensaje recibido (no se envió ningún correo):');
  console.log(buildEmail(msg).text);
  console.log(`[mail:test] Guardado en ${path.join(outboxDir, 'messages.jsonl')}\n`);
}

export async function sendContactMessage(msg: Message) {
  switch (config.mail.provider) {
    case 'resend':
      return sendWithResend(msg);
    case 'smtp':
      return sendWithSmtp(msg);
    default:
      return saveToOutbox(msg);
  }
}

import { NextResponse } from 'next/server';

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8914558540:AAEyWm_D1b2IVuu8Z19e3DELbmr-j57ENWI8';
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

export async function POST(req) {
  try {
    const body = await req.json();

    if (body.event === 'messages.upsert' || body.event === 'MESSAGES_UPSERT') {
      const messageData = body.data;

      if (messageData.key?.fromMe) {
        return NextResponse.json({ status: 'ignored_from_me' });
      }

      const remoteJid = messageData.key?.remoteJid || '';
      const messageText = 
        messageData.message?.conversation || 
        messageData.message?.extendedTextMessage?.text || 
        messageData.message?.imageMessage?.caption || 
        '';

      // Loga para ajudarmos a validar no painel da Vercel
      console.log("Recebido de remoteJid:", remoteJid, "| Texto:", messageText);

      // Se por acaso vier de outro lugar e quisermos capturar o JID correto na primeira mensagem, 
      // descomente a linha abaixo temporariamente se precisar ver o ID exato nos logs da Vercel:
      // if (!remoteJid.endsWith('@g.us')) return NextResponse.json({ status: 'not_a_group' });

      if (messageText && TELEGRAM_CHAT_ID) {
        await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: TELEGRAM_CHAT_ID,
            text: messageText,
          }),
        });
      }
    }

    return NextResponse.json({ status: 'success' });
  } catch (error) {
    console.error("Erro no webhook:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

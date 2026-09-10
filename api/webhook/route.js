import { NextResponse } from 'next/server';

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8914558540:AAEyWm_D1b2IVuu8Z19e3DELbmrj57ENWI8';
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

export async function POST(req) {
  try {
    const body = await req.json();

    if (body.event === 'messages.upsert' || body.event === 'MESSAGES_UPSERT') {
      const messageData = body.data;

      if (messageData.key?.fromMe) {
        return NextResponse.json({ status: 'ignored_from_me' });
      }

      const messageText =
        messageData.message?.conversation ||
        messageData.message?.extendedTextMessage?.text ||
        messageData.message?.imageMessage?.caption ||
        '';

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
    console.error('Erro ao processar Webhook:', error);
    return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
  }
}

import { getClient, unauthorized } from '@/lib/getClient';
import { NextRequest, NextResponse } from 'next/server';


export async function POST(req: NextRequest) {
  let client; try { client = await getClient(req); } catch { return unauthorized(); }
  const { text, targetLang } = await req.json();
  if (!text?.trim()) {
    return NextResponse.json({ error: 'No text provided' }, { status: 400 });
  }

  const langLabel = targetLang === 'zh' ? 'Traditional Chinese (繁體中文)' : 'English';

  const message = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 4096,
    messages: [
      {
        role: 'user',
        content: `Translate the following text to ${langLabel}. Return only the translated text, nothing else.\n\n${text}`,
      },
    ],
  });

  const translated = message.content[0].type === 'text' ? message.content[0].text : '';
  return NextResponse.json({ translated });
}

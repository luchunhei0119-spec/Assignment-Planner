import { getClient, unauthorized } from '@/lib/getClient';
import { NextRequest } from 'next/server';

export async function POST(req: NextRequest) {
  let client; try { client = getClient(req); } catch { return unauthorized(); }
  const { docText, messages } = await req.json();
  if (!messages?.length) {
    return new Response(JSON.stringify({ error: 'No messages provided' }), { status: 400 });
  }

  const stream = client.messages.stream({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    system: `You are a helpful study assistant. Answer questions about the document below clearly and helpfully.

After your English answer, add a separator line "---" then provide the same answer in Traditional Chinese (繁體中文).

Document:
${docText}`,
    messages,
  });

  const readable = new ReadableStream({
    async start(controller) {
      const enc = new TextEncoder();
      for await (const chunk of stream) {
        if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
          controller.enqueue(enc.encode(chunk.delta.text));
        }
      }
      controller.close();
    },
  });

  return new Response(readable, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
}

import { getClient, unauthorized } from '@/lib/getClient';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  let client; try { client = await getClient(req, { cache: true }); } catch { return unauthorized(); }
  const { text: rawText, keyPointCount = 10, part = 'all' } = await req.json();
  if (!rawText?.trim()) {
    return NextResponse.json({ error: 'No text provided' }, { status: 400 });
  }
  const text = rawText.slice(0, 25000);

  const docBlock = {
    type: 'text' as const,
    text: `Document:\n${text}`,
    cache_control: { type: 'ephemeral' as const },
  };

  if (part === 'summary') {
    const msg = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      temperature: 0,
      messages: [{
        role: 'user',
        content: [
          docBlock,
          { type: 'text', text: 'Write a detailed summary of this document (4-6 sentences) using only information explicitly stated in the text. Cover the main topic, key arguments or findings, and any important conclusions. Return a JSON object with "en" (English summary) and "zh" (Traditional Chinese 繁體中文 translation of the same summary). Return only valid JSON.' },
        ],
      }],
    });
    const raw = msg.content[0].type === 'text' ? msg.content[0].text.trim() : '';
    const match = raw.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        const parsed = JSON.parse(match[0]);
        return NextResponse.json({ summary: parsed.en ?? raw, summaryZh: parsed.zh ?? '' });
      } catch { /* fall through */ }
    }
    return NextResponse.json({ summary: raw, summaryZh: '' });
  }

  if (part === 'keypoints') {
    const msg = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 8096,
      temperature: 0.3,
      messages: [{
        role: 'user',
        content: [
          docBlock,
          {
            type: 'text',
            text: `Extract exactly ${keyPointCount} key points from this document.

Return a JSON object with:
- "keyPoints": array of exactly ${keyPointCount} objects, each with:
  - "en": key point in English (1 clear sentence, strictly from the document)
  - "zh": same in Traditional Chinese (繁體中文)
  - "detail": 2 sentences — first sentence must be grounded in the document; second sentence may extend with a brief real-world analogy, example, or context to aid understanding
  - "detailZh": same in Traditional Chinese (繁體中文)
  - "source": a short verbatim quote (≤ 20 words) from the document that supports this key point
- "highlights": array of exact verbatim sentences copied from the document that are most important

Return only valid JSON, no explanation.`,
          },
        ],
      }],
    });
    const raw = msg.content[0].type === 'text' ? msg.content[0].text : '';
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) return NextResponse.json({ error: 'Could not parse response' }, { status: 500 });
    try {
      return NextResponse.json(JSON.parse(match[0]));
    } catch {
      const kpMatch = raw.match(/"keyPoints"\s*:\s*(\[[\s\S]*?\])\s*[,}]/);
      if (kpMatch) {
        try { return NextResponse.json({ keyPoints: JSON.parse(kpMatch[1]), highlights: [] }); }
        catch { /* fall through */ }
      }
      return NextResponse.json({ error: 'Response was too long, try fewer key points' }, { status: 500 });
    }
  }

  const msg = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 8096,
    temperature: 0.3,
    messages: [{
      role: 'user',
      content: [
        docBlock,
        {
          type: 'text',
          text: `Analyze this document. Return a JSON object with:
- "summary": a detailed 4-6 sentence overview grounded in the document, covering main topic, key arguments/findings, and conclusions
- "keyPoints": array of exactly ${keyPointCount} objects, each with "en","zh","detail" (first sentence from document, second may extend with analogy/example),"detailZh","source" (short verbatim quote ≤ 20 words)
- "highlights": array of exact verbatim sentences from the document that are most important

Return only valid JSON.`,
        },
      ],
    }],
  });
  const raw = msg.content[0].type === 'text' ? msg.content[0].text : '';
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) return NextResponse.json({ error: 'Could not parse response' }, { status: 500 });
  return NextResponse.json(JSON.parse(match[0]));
}

import { getClient, unauthorized } from '@/lib/getClient';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  let client; try { client = await getClient(req); } catch { return unauthorized(); }
  const { wrongAnswers } = await req.json();
  if (!wrongAnswers?.length) {
    return NextResponse.json({ error: 'No wrong answers provided' }, { status: 400 });
  }

  const summary = wrongAnswers.map((a: { question: string; correctAnswer: string }, i: number) =>
    `${i + 1}. Q: ${a.question}\n   Correct: ${a.correctAnswer}`
  ).join('\n');

  const msg = await client.messages.create({
    model: 'claude-haiku-4-5',
    max_tokens: 1024,
    messages: [{
      role: 'user',
      content: `Analyze these wrong answers from a student's quiz and identify their weak topic areas.

Wrong answers:
${summary}

Return a JSON object with:
- "topics": array of objects, each with:
  - "name": topic name in English (short, 2-4 words)
  - "nameZh": topic name in Traditional Chinese (繁體中文)
  - "count": number of wrong answers related to this topic
  - "advice": one sentence of specific study advice in English
  - "adviceZh": same advice in Traditional Chinese (繁體中文)

Group related questions into the same topic. Return 2-5 topics maximum. Return only valid JSON.`,
    }],
  });

  const raw = msg.content[0].type === 'text' ? msg.content[0].text : '';
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) return NextResponse.json({ error: 'Could not parse response' }, { status: 500 });
  try {
    return NextResponse.json(JSON.parse(match[0]));
  } catch {
    return NextResponse.json({ error: 'Could not parse response' }, { status: 500 });
  }
}

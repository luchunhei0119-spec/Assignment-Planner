import { getClient, unauthorized } from '@/lib/getClient';
import { NextRequest, NextResponse } from 'next/server';


export async function POST(req: NextRequest) {
  let client; try { client = getClient(req); } catch { return unauthorized(); }
  const { question, modelAnswer, userAnswer, questionType, lang = 'en' } = await req.json();
  if (!userAnswer?.trim()) {
    return NextResponse.json({ error: 'No answer provided' }, { status: 400 });
  }

  const isShort = questionType === 'short';
  const isZh = lang === 'zh';

  const message = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: isZh
          ? `你是批改老師，正在批改以下${isShort ? '簡答題' : '論述題'}。

題目：${question}
參考答案：${modelAnswer}
學生答案：${userAnswer}

返回 JSON 物件：
- "score": 0 至 10 的分數
- "feedback": 1-2 句繁體中文評語
- "feedbackZh": 同上（繁體中文）
- "modelAnswer": 繁體中文參考答案
- "modelAnswerZh": 同上（繁體中文）

只返回有效 JSON。`
          : `You are grading a student's ${isShort ? 'short' : 'long'} answer question.

Question: ${question}
Model Answer: ${modelAnswer}
Student's Answer: ${userAnswer}

Return a JSON object with:
- "score": a number from 0 to 10
- "feedback": 1-2 sentences of feedback in English
- "feedbackZh": the same feedback in Traditional Chinese (繁體中文)
- "modelAnswer": the model answer in English
- "modelAnswerZh": the model answer in Traditional Chinese (繁體中文)

Return only valid JSON.`,
      },
    ],
  });

  const raw = message.content[0].type === 'text' ? message.content[0].text : '';
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    return NextResponse.json({ error: 'Could not parse response' }, { status: 500 });
  }

  return NextResponse.json(JSON.parse(jsonMatch[0]));
}

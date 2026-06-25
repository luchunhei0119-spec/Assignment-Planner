import { getClient, unauthorized, handleClientError } from '@/lib/getClient';
import { NextRequest, NextResponse } from 'next/server';

function detectLang(text: string): 'zh' | 'en' {
  const chinese = (text.match(/[一-鿿㐀-䶿豈-﫿]/g) || []).length;
  const total = text.replace(/\s/g, '').length;
  return total > 0 && chinese / total > 0.15 ? 'zh' : 'en';
}

export async function POST(req: NextRequest) {
  let client; try { client = await getClient(req); } catch (e) { return handleClientError(e); }
  const { text, count = 10, questionType = 'mc' } = await req.json();
  if (!text?.trim()) {
    return NextResponse.json({ error: 'No text provided' }, { status: 400 });
  }

  const lang = detectLang(text);
  const isZh = lang === 'zh';

  let prompt = '';

  if (questionType === 'mc') {
    if (isZh) {
      prompt = `根據以下文件，嚴格生成 ${count} 條選擇題。每條題目及答案必須有文件明確支持，不可加入外部知識。

只返回 JSON 陣列，不要解釋。每個元素必須有：
- "question": 題目（繁體中文）
- "options": 剛好 4 個選項，分別以「A. 」「B. 」「C. 」「D. 」開頭（繁體中文）
- "answer": 正確答案字母，如「A」
- "explanation": 一句話說明正確答案，引用文件相關部分（繁體中文）
- "explanationZh": 同上（繁體中文，與 explanation 相同）

例子：[{"question":"...","options":["A. ...","B. ...","C. ...","D. ..."],"answer":"B","explanation":"...","explanationZh":"..."}]`;
    } else {
      prompt = `Generate ${count} multiple choice questions strictly based on the document below. Every question and answer must be directly supported by the document — no outside knowledge.

Return a JSON array only, no explanation. Each item must have:
- "question": a specific question whose answer is clearly stated in the document
- "options": exactly 4 strings, each starting with "A. ", "B. ", "C. ", "D. "
- "answer": the correct letter, e.g. "A"
- "explanation": one sentence citing the document that supports the correct answer
- "explanationZh": the same explanation in Traditional Chinese (繁體中文)

Example: [{"question":"...","options":["A. ...","B. ...","C. ...","D. ..."],"answer":"B","explanation":"...","explanationZh":"..."}]`;
    }
  } else if (questionType === 'short') {
    if (isZh) {
      prompt = `根據以下文件，嚴格生成 ${count} 條簡答題。每條題目必須能用文件內容作答。

只返回 JSON 陣列，不要解釋。每個元素必須有：
- "question": 題目（繁體中文，可用 1-3 句回答）
- "modelAnswer": 參考答案（繁體中文，1-3 句，只用文件內容）

例子：[{"question":"...","modelAnswer":"..."}]`;
    } else {
      prompt = `Generate ${count} short answer questions strictly based on the document below. Every question must be answerable using only information in the document.

Return a JSON array only, no explanation. Each item must have:
- "question": a focused question answerable in 1-3 sentences from the document
- "modelAnswer": a concise model answer (1-3 sentences) using only document content

Example: [{"question":"...","modelAnswer":"..."}]`;
    }
  } else if (questionType === 'long') {
    if (isZh) {
      prompt = `根據以下文件，嚴格生成 ${count} 條論述題。每條題目必須能用文件內容詳細作答。

只返回 JSON 陣列，不要解釋。每個元素必須有：
- "question": 題目（繁體中文，需要詳細結構化回答）
- "modelAnswer": 參考答案（繁體中文，3-6 句，只用文件內容）

例子：[{"question":"...","modelAnswer":"..."}]`;
    } else {
      prompt = `Generate ${count} essay questions strictly based on the document below. Every question must be answerable using only information in the document.

Return a JSON array only, no explanation. Each item must have:
- "question": a detailed question requiring a structured response grounded in the document
- "modelAnswer": a comprehensive model answer (3-6 sentences) using only document content

Example: [{"question":"...","modelAnswer":"..."}]`;
    }
  }

  const message = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 4096,
    temperature: 0,
    messages: [{ role: 'user', content: `${prompt}\n\n文件 / Document:\n${text.slice(0, 20000)}` }],
  });

  const raw = message.content[0].type === 'text' ? message.content[0].text : '';
  const jsonMatch = raw.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    return NextResponse.json({ error: 'Could not parse AI response' }, { status: 500 });
  }

  return NextResponse.json({ questions: JSON.parse(jsonMatch[0]), questionType, lang });
}

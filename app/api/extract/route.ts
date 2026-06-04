import { getClient, unauthorized } from '@/lib/getClient';
import { NextRequest, NextResponse } from 'next/server';


export async function POST(req: NextRequest) {
  let client; try { client = await getClient(req); } catch { return unauthorized(); }
  const { syllabus } = await req.json();
  if (!syllabus?.trim()) {
    return NextResponse.json({ error: 'No syllabus text provided' }, { status: 400 });
  }

  const message = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 2048,
    messages: [
      {
        role: 'user',
        content: `Extract all assignments and deadlines from this course syllabus. Return a JSON array only, no explanation.

Each item must have:
- title: assignment name
- course: course name (infer from context if not explicit)
- deadline: ISO date string (YYYY-MM-DD), use current year ${new Date().getFullYear()} if year not specified
- difficulty: "easy" | "medium" | "hard" (estimate based on type/weight)
- description: brief description of what needs to be done

Return only valid JSON array, example: [{"title":"...","course":"...","deadline":"2024-11-15","difficulty":"medium","description":"..."}]

Syllabus:
${syllabus}`,
      },
    ],
  });

  const text = message.content[0].type === 'text' ? message.content[0].text : '';
  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    return NextResponse.json({ error: 'Could not parse AI response' }, { status: 500 });
  }

  const assignments = JSON.parse(jsonMatch[0]);
  return NextResponse.json({ assignments });
}

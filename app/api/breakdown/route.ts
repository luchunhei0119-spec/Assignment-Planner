import { getClient, unauthorized } from '@/lib/getClient';
import { NextRequest, NextResponse } from 'next/server';


export async function POST(req: NextRequest) {
  let client; try { client = getClient(req); } catch { return unauthorized(); }
  const { title, description, difficulty, deadline } = await req.json();

  const message = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: `Break down this university assignment into actionable sub-tasks. Return JSON array only.

Assignment: ${title}
Description: ${description}
Difficulty: ${difficulty}
Deadline: ${deadline}

Each sub-task must have:
- id: unique string like "task-1", "task-2"
- title: clear action item (start with a verb)
- estimatedHours: number (realistic estimate)
- completed: false

Return only JSON array, no explanation. Example:
[{"id":"task-1","title":"Research topic and gather sources","estimatedHours":2,"completed":false}]`,
      },
    ],
  });

  const text = message.content[0].type === 'text' ? message.content[0].text : '';
  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    return NextResponse.json({ error: 'Could not parse AI response' }, { status: 500 });
  }

  const subTasks = JSON.parse(jsonMatch[0]);
  return NextResponse.json({ subTasks });
}

import { getClient, unauthorized } from '@/lib/getClient';
import { NextRequest, NextResponse } from 'next/server';


export async function POST(req: NextRequest) {
  let client; try { client = await getClient(req); } catch { return unauthorized(); }
  const { title, subTasks, deadline, difficulty } = await req.json();

  const totalHours = subTasks.reduce((sum: number, t: { estimatedHours: number }) => sum + t.estimatedHours, 0);
  const today = new Date().toISOString().split('T')[0];

  const message = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: `Create a study plan for this assignment. Return JSON array only.

Assignment: ${title}
Difficulty: ${difficulty}
Deadline: ${deadline}
Today: ${today}
Total estimated hours: ${totalHours}
Sub-tasks: ${subTasks.map((t: { title: string; estimatedHours: number }) => `${t.title} (${t.estimatedHours}h)`).join(', ')}

Create a day-by-day study plan from today to 2 days before the deadline. Spread tasks evenly, max 3 hours per day.

Each session must have:
- date: ISO date string (YYYY-MM-DD)
- tasks: array of task names to work on that day
- hours: total hours for that day

Return only JSON array. Example:
[{"date":"2024-11-01","tasks":["Research topic","Find sources"],"hours":2}]`,
      },
    ],
  });

  const text = message.content[0].type === 'text' ? message.content[0].text : '';
  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    return NextResponse.json({ error: 'Could not parse AI response' }, { status: 500 });
  }

  const studyPlan = JSON.parse(jsonMatch[0]);
  return NextResponse.json({ studyPlan });
}

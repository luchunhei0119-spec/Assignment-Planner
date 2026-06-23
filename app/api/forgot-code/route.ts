import { NextResponse } from 'next/server';

export async function POST() {
  const accessCode = process.env.OWNER_ACCESS_CODE;
  const resendApiKey = process.env.RESEND_API_KEY;
  const ownerEmail = process.env.OWNER_EMAIL ?? 'luchunhei0119@gmail.com';

  if (!accessCode || !resendApiKey) {
    return NextResponse.json({ error: 'Not configured' }, { status: 500 });
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'StudyAI <onboarding@resend.dev>',
      to: [ownerEmail],
      subject: 'Your StudyAI Access Code',
      html: `
        <div style="font-family:sans-serif;max-width:400px;margin:0 auto;padding:24px">
          <h2 style="color:#7c3aed">StudyAI</h2>
          <p>你好，以下係你的 access code：</p>
          <div style="background:#f5f3ff;border-radius:12px;padding:16px;text-align:center;font-size:24px;font-weight:bold;letter-spacing:4px;color:#7c3aed">
            ${accessCode}
          </div>
          <p style="color:#9ca3af;font-size:12px;margin-top:24px">如果你冇申請重設，請忽略此郵件。</p>
        </div>
      `,
    }),
  });

  if (!res.ok) {
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

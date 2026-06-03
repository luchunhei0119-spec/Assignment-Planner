import { NextRequest, NextResponse } from 'next/server';
import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get('file') as File | null;
  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const name = file.name.toLowerCase();
  let text = '';

  if (name.endsWith('.pdf')) {
    const result = await pdfParse(buffer);
    text = result.text;
  } else if (name.endsWith('.docx')) {
    const result = await mammoth.extractRawText({ buffer });
    text = result.value;
  } else if (name.endsWith('.txt')) {
    text = buffer.toString('utf-8');
  } else {
    return NextResponse.json({ error: 'Unsupported file type. Please upload PDF, DOCX, or TXT.' }, { status: 400 });
  }

  if (!text.trim()) {
    return NextResponse.json({ error: 'Could not extract text from file.' }, { status: 400 });
  }

  return NextResponse.json({ text });
}

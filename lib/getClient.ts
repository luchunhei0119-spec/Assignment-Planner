import Anthropic from '@anthropic-ai/sdk';
import { NextRequest } from 'next/server';

export function getClient(req: NextRequest, opts?: { cache?: boolean }): Anthropic {
  const userKey = req.headers.get('x-user-api-key');
  if (userKey) {
    return new Anthropic({ apiKey: userKey });
  }

  const accessCode = req.headers.get('x-access-code');
  if (accessCode && process.env.OWNER_ACCESS_CODE && accessCode === process.env.OWNER_ACCESS_CODE) {
    const headers: Record<string, string> = {};
    if (opts?.cache) headers['anthropic-beta'] = 'prompt-caching-2024-07-31';
    return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY, defaultHeaders: headers });
  }

  throw new Error('UNAUTHORIZED');
}

export function unauthorized() {
  return new Response(JSON.stringify({ error: 'No API key or access code provided. Please go to Settings.' }), {
    status: 401,
    headers: { 'Content-Type': 'application/json' },
  });
}

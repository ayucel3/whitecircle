import { NextRequest, NextResponse } from 'next/server';
import { detectPIICore } from '@/lib/pii-detector';

export const runtime = 'nodejs'; // LLM calls work better on Node.js than Edge for longer timeouts

export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json();

    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return NextResponse.json({ detections: [] });
    }

    const detections = await detectPIICore(text);
    return NextResponse.json({ detections: detections.sort((a, b) => a.start - b.start) });
    
  } catch (error) {
    console.error('PII detection route error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


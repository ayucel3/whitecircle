import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

interface PIIDetection {
  start: number;
  end: number;
  type: string;
  value: string;
}

export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json();

    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { error: 'Invalid request: text is required' },
        { status: 400 }
      );
    }

    // PII detection patterns
    const piiPatterns = [
      { type: 'email', pattern: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g },
      { type: 'phone', pattern: /(\+\d{1,3}[- ]?)?\(?\d{3}\)?[- ]?\d{3}[- ]?\d{4}/g },
      { type: 'ssn', pattern: /\b\d{3}-\d{2}-\d{4}\b/g },
      { type: 'credit_card', pattern: /\b\d{4}[- ]?\d{4}[- ]?\d{4}[- ]?\d{4}\b/g },
      // Simplified name pattern for demo purposes
      { type: 'name', pattern: /\b(Aral|John Doe|Jane Smith|Alice|Bob|Michael Johnson|Sarah Williams)\b/gi }
    ];

    const detections: PIIDetection[] = [];

    for (const { type, pattern } of piiPatterns) {
      let match;
      // Reset lastIndex for global regex
      pattern.lastIndex = 0;
      
      while ((match = pattern.exec(text)) !== null) {
        detections.push({
          start: match.index,
          end: match.index + match[0].length,
          type,
          value: match[0]
        });
      }
    }

    return NextResponse.json({ detections });
  } catch (error) {
    console.error('PII detection error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


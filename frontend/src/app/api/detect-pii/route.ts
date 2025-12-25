import { NextRequest, NextResponse } from 'next/server';
import { generateObject } from 'ai';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';

export const runtime = 'nodejs'; // LLM calls work better on Node.js than Edge for longer timeouts

const piiSchema = z.object({
  piiItems: z.array(z.object({
    value: z.string().describe('The exact text value of the PII found in the text'),
    type: z.enum(['email', 'phone', 'name']).describe('The type of PII'),
  })).describe('List of all sensitive information found')
});

export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json();

    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return NextResponse.json({ detections: [] });
    }

    try {
      // 1. Ask LLM to identify the VALUES
      const { object } = await generateObject({
        model: openai('gpt-4o-mini'),
        schema: piiSchema,
        prompt: `Find all emails, phone numbers, and people's names in this text. 
        Return only the items that appear EXACTLY as they are in the text.
        
        Text: "${text}"`,
      });

      // 2. Precisely find the offsets of these values in the actual text
      interface Detection {
        start: number;
        end: number;
        type: string;
        value: string;
      }
      const detections: Detection[] = [];
      const piiItems = object.piiItems;
      const uniqueValues = Array.from(new Set(piiItems.map(item => item.value)));
      
      uniqueValues.forEach(value => {
        const type = piiItems.find(item => item.value === value)?.type || 'name';
        const escapedValue = value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(escapedValue, 'g');
        
        let match;
        while ((match = regex.exec(text)) !== null) {
          detections.push({
            start: match.index,
            end: match.index + value.length,
            type,
            value: match[0]
          });
        }
      });

      return NextResponse.json({ detections: detections.sort((a, b) => a.start - b.start) });

    } catch (llmError) {
      console.error('LLM PII detection failed, falling back to regex:', llmError);
      
      // Fallback regex patterns
      const piiPatterns = [
        { type: 'email', pattern: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g },
        { type: 'phone', pattern: /(\+\d{1,3}[- ]?)?\(?\d{3}\)?[- ]?\d{3}[- ]?\d{4}/g },
        { type: 'name', pattern: /\b(Aral|James|John|Robert|Michael|William|David|Richard|Joseph|Thomas|Charles|Mary|Patricia|Jennifer|Linda|Barbara|Elizabeth|Susan|Jessica|Sarah|Karen)\b/gi }
      ];

      interface FallbackDetection {
        start: number;
        end: number;
        type: string;
        value: string;
      }
      const detections: FallbackDetection[] = [];
      for (const { type, pattern } of piiPatterns) {
        let match;
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
      return NextResponse.json({ detections: detections.sort((a, b) => a.start - b.start) });
    }
  } catch (error) {
    console.error('PII detection route error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


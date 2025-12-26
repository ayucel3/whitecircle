/**
 * PII Detection Service
 * Core logic that leverages LLMs (GPT-4o-mini) for accurate detection of sensitive information.
 */

import { generateObject } from 'ai';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';

export interface PIIMatch {
  type: 'email' | 'phone' | 'name';
  start: number;
  end: number;
  text: string;
}

const piiSchema = z.object({
  piiItems: z.array(z.object({
    value: z.string().describe('The exact text value of the PII found in the text'),
    type: z.enum(['email', 'phone', 'name']).describe('The type of PII'),
  })).describe('List of all sensitive information found')
});

/**
 * Core PII detection logic - can be used server-side or client-side
 */
export async function detectPIICore(text: string): Promise<Array<{start: number; end: number; type: string; value: string}>> {
  if (!text || typeof text !== 'string' || text.trim().length === 0) {
    return [];
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
    const detections: Array<{start: number; end: number; type: string; value: string}> = [];
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

    return detections;

  } catch (llmError) {
    console.error('LLM PII detection failed, falling back to regex:', llmError);
    
    // Fallback regex patterns
    const piiPatterns = [
      { type: 'email', pattern: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g },
      { type: 'phone', pattern: /(\+\d{1,3}[- ]?)?\(?\d{3}\)?[- ]?\d{3}[- ]?\d{4}/g },
      { type: 'name', pattern: /\b(Aral|James|John|Robert|Michael|William|David|Richard|Joseph|Thomas|Charles|Mary|Patricia|Jennifer|Linda|Barbara|Elizabeth|Susan|Jessica|Sarah|Karen)\b/gi }
    ];

    const detections: Array<{start: number; end: number; type: string; value: string}> = [];
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
    return detections;
  }
}

/**
 * Fast regex-only PII detection for real-time streaming
 * Much faster than LLM-based detection, used during streaming
 */
export function detectPIIRegex(text: string): Array<{start: number; end: number; type: string; value: string}> {
  const piiPatterns = [
    { type: 'email', pattern: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g },
    { type: 'phone', pattern: /(\+\d{1,3}[- ]?)?\(?\d{3}\)?[- ]?\d{3}[- ]?\d{4}/g },
  ];

  const detections: Array<{start: number; end: number; type: string; value: string}> = [];
  
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
  
  return detections;
}

/**
 * Client-side PII detection - calls the API route
 * For use in React components
 */
export async function detectPIIAsync(text: string): Promise<PIIMatch[]> {
  try {
    const response = await fetch('/api/detect-pii', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });

    if (!response.ok) {
      throw new Error(`PII service error: ${response.statusText}`);
    }

    const { detections } = await response.json();
    
    // Map service response to our PIIMatch interface
    return detections.map((d: {type: string; start: number; end: number; value: string}) => ({
      type: d.type as 'email' | 'phone' | 'name',
      start: d.start,
      end: d.end,
      text: d.value,
    }));
  } catch (error) {
    console.error('Failed to use PII API route:', error);
    return [];
  }
}



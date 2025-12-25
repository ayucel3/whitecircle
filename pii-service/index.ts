import Fastify from 'fastify';
import cors from '@fastify/cors';
import { generateObject } from 'ai';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';
import * as dotenv from 'dotenv';
import path from 'path';

// Load environment variables from frontend/.env
dotenv.config({ path: path.join(__dirname, '../frontend/.env') });

const fastify = Fastify({
  logger: true
});

fastify.register(cors);

const piiSchema = z.object({
  piiItems: z.array(z.object({
    value: z.string().describe('The exact text value of the PII found in the text'),
    type: z.enum(['email', 'phone', 'name']).describe('The type of PII'),
  })).describe('List of all sensitive information found')
});

fastify.post('/detect-pii', async (request, reply) => {
  const { text } = request.body as { text: string };
  
  if (!text || text.trim().length === 0) {
    return { detections: [] };
  }

  try {
    // 1. Ask LLM to identify the VALUES, not the offsets (LLMs are bad at counting)
    const { object } = await generateObject({
      model: openai('gpt-4o-mini'),
      schema: piiSchema,
      prompt: `Find all emails, phone numbers, and people's names in this text. 
      Return only the items that appear EXACTLY as they are in the text.
      
      Text: "${text}"`,
    });

    // 2. Precisely find the offsets of these values in the actual text
    const detections: any[] = [];
    const piiItems = object.piiItems;

    // Use a Set to avoid duplicate processing of the same value
    const uniqueValues = Array.from(new Set(piiItems.map(item => item.value)));
    
    uniqueValues.forEach(value => {
      const type = piiItems.find(item => item.value === value)?.type || 'name';
      
      // Escape special characters for regex
      const escapedValue = value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(escapedValue, 'g');
      
      let match;
      while ((match = regex.exec(text)) !== null) {
        detections.push({
          start: match.index,
          end: match.index + value.length,
          type,
          value
        });
      }
    });

    // Sort by start position
    return { detections: detections.sort((a, b) => a.start - b.start) };

  } catch (error) {
    console.error('LLM PII detection failed, falling back to regex:', error);
    
    // Fallback regex patterns
    const piiPatterns = [
      { type: 'email', pattern: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g },
      { type: 'phone', pattern: /(\+\d{1,3}[- ]?)?\(?\d{3}\)?[- ]?\d{3}[- ]?\d{4}/g },
      { type: 'name', pattern: /\b(Aral|John Doe|Jane Smith|Alice|Bob|Charlie|David|Eve|Frank|Grace|Henry|Ivy|Jack|Kelly|Liam|Mia|Noah|Olivia|Peter|Quinn|Rose|Sam|Tina|Uma|Victor|Wendy|Xander|Yara|Zane)\b/g }
    ];

    const detections: any[] = [];
    for (const { type, pattern } of piiPatterns) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        detections.push({
          start: match.index,
          end: match.index + match[0].length,
          type,
          value: match[0]
        });
      }
    }
    return { detections: detections.sort((a, b) => a.start - b.start) };
  }
});

const start = async () => {
  try {
    const port = process.env.PII_SERVICE_PORT ? parseInt(process.env.PII_SERVICE_PORT) : 3001;
    await fastify.listen({ port, host: '0.0.0.0' });
    console.log(`PII service listening on port ${port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();

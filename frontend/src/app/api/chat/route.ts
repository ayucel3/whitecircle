import { openai } from '@ai-sdk/openai';
import {
  createUIMessageStream,
  createUIMessageStreamResponse,
  streamText,
  convertToModelMessages,
} from 'ai';
import type { ChatUIMessage } from '@/lib/types';
import { detectPIICore, detectPIIRegex } from '@/lib/pii-detector';
import { saveMessages } from '@/lib/db';

export async function POST(req: Request) {
  const { messages, conversationId } = await req.json();

  if (!conversationId) {
    return Response.json({ error: 'Conversation ID is required' }, { status: 400 });
  }

  const stream = createUIMessageStream<ChatUIMessage>({
    execute: async ({ writer }) => {
      // Buffer to accumulate text for PII detection
      let textBuffer = '';
      let lastProcessedLength = 0;

      const result = streamText({
        model: openai('gpt-4o-mini'),
        system: 'You are a helpful AI assistant. Answer questions naturally and provide useful information. You can discuss any topic the user asks about, including handling personal information when requested for legitimate purposes like examples or demonstrations.',
        messages: await convertToModelMessages(messages),
        async onChunk({ chunk }) {
          // Accumulate text chunks
          if (chunk.type === 'text-delta') {
            textBuffer += chunk.text;

            // Fast regex-based PII detection during streaming (every 30 chars for instant feedback)
            // This provides immediate masking without waiting for LLM
            if (textBuffer.length - lastProcessedLength >= 30) {
              lastProcessedLength = textBuffer.length;
              // Use fast regex detection (milliseconds vs seconds for LLM)
              const piiMatches = detectPIIRegex(textBuffer);
              
              if (piiMatches.length > 0) {
                writer.write({
                  type: 'data-pii-mask',
                  data: {
                    masks: piiMatches.map((match) => ({
                      type: match.type,
                      start: match.start,
                      end: match.end,
                    })),
                  },
                });
              }
            }
          }
        },
        async onFinish() {
          // Final LLM-based detection for better accuracy (catches names and complex patterns)
          // This upgrades the regex-based masks with AI-powered detection
          if (textBuffer.length > 0) {
            try {
              const piiMatches = await detectPIICore(textBuffer);
              
              if (piiMatches.length > 0) {
                // Send final comprehensive PII mask data
                writer.write({
                  type: 'data-pii-mask',
                  data: {
                    masks: piiMatches.map(match => ({
                      type: match.type,
                      start: match.start,
                      end: match.end,
                    })),
                  },
                });
              }
            } catch (error) {
              console.error('PII detection error:', error);
            }
          }
        },
      });

      // Merge the LLM stream into our custom stream
      writer.merge(result.toUIMessageStream());
    },
    originalMessages: messages,
    onFinish: async ({ messages: updatedMessages }) => {
      // Save messages to database
      try {
        await saveMessages(conversationId, updatedMessages);
      } catch (error) {
        console.error('Failed to save messages:', error);
      }
    },
  });

  return createUIMessageStreamResponse({ stream });
}

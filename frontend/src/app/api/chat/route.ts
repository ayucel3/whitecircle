import { openai } from '@ai-sdk/openai';
import {
  createUIMessageStream,
  createUIMessageStreamResponse,
  streamText,
  convertToModelMessages,
} from 'ai';
import type { ChatUIMessage } from '@/lib/types';
import { detectPIIAsync } from '@/lib/pii-detector';
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
        messages: await convertToModelMessages(messages),
        async onChunk({ chunk }) {
          // Accumulate text chunks
          if (chunk.type === 'text-delta') {
            textBuffer += chunk.text;

            // Periodically detect PII while streaming for better UX
            // Every 100 characters or so to avoid too many calls
            if (textBuffer.length - lastProcessedLength >= 100) {
              lastProcessedLength = textBuffer.length;
              detectPIIAsync(textBuffer).then((piiMatches) => {
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
              }).catch(console.error);
            }
          }
        },
        async onFinish() {
          // Final check to ensure all PII is detected in the complete response
          if (textBuffer.length > 0) {
            try {
              const piiMatches = await detectPIIAsync(textBuffer);
              
              if (piiMatches.length > 0) {
                // Send final PII mask data part
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

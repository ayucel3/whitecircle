import type { UIMessage } from 'ai';

/**
 * Custom message type with PII mask data parts
 */
export type ChatUIMessage = UIMessage<
  any, // metadata type
  {
    'pii-mask': {
      masks: Array<{
        type: 'email' | 'phone' | 'name';
        start: number;
        end: number;
      }>;
    };
  }
>;


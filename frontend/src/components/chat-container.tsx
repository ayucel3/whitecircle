'use client';

import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageItem } from '@/components/message-item';
import { useEffect, useRef, useState } from 'react';
import { SendIcon, LoaderIcon } from 'lucide-react';
import type { ChatUIMessage } from '@/lib/types';

interface ChatContainerProps {
  conversationId: string;
  initialMessages?: ChatUIMessage[];
}

export function ChatContainer({ conversationId, initialMessages = [] }: ChatContainerProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [inputValue, setInputValue] = useState('');

  const { messages, sendMessage, status } = useChat<ChatUIMessage>({
    id: conversationId,
    messages: initialMessages,
    transport: new DefaultChatTransport({
      api: '/api/chat',
      body: {
        conversationId,
      },
    }),
  });

  const isLoading = status === 'streaming' || status === 'submitted';
  const isSubmitting = status === 'submitted';

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim() && !isLoading) {
      sendMessage({ text: inputValue });
      setInputValue('');
    }
  };

  return (
    <div className="flex h-full flex-col">
      {/* Messages Area */}
      <ScrollArea className="flex-1 px-4">
        <div ref={scrollRef} className="mx-auto max-w-3xl space-y-4 py-8">
          {messages.length === 0 && (
            <div className="flex h-[60vh] items-center justify-center">
              <div className="text-center">
                <h2 className="text-2xl font-semibold text-white">Start a conversation</h2>
                <p className="mt-2 text-sm text-gray-400">
                  Type a message below to begin. PII will be automatically detected and masked.
                </p>
              </div>
            </div>
          )}
          {messages.map((message) => (
            <MessageItem key={message.id} message={message} />
          ))}
          {isSubmitting && (
            <div className="flex justify-start">
              <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white">
                <LoaderIcon className="h-4 w-4 animate-spin" />
                <span>Thinking...</span>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="border-t border-white/10 bg-black px-4 py-4">
        <form onSubmit={handleSubmit} className="mx-auto flex max-w-3xl gap-2">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 border-white/10 bg-white/5 text-white placeholder:text-gray-500 focus:border-white/20"
            disabled={isLoading}
          />
          <Button
            type="submit"
            disabled={isLoading || !inputValue.trim()}
            className="bg-white text-black hover:bg-gray-200"
          >
            <SendIcon className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}


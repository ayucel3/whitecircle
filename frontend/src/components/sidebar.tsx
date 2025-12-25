'use client';

import { Trash2Icon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PlusIcon, MessageSquareIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Conversation {
  id: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
}

interface SidebarProps {
  conversations: Conversation[];
  activeConversationId: string | null;
  onNewChat: () => void;
  onSelectChat: (id: string) => void;
  onDeleteChat: (id: string) => void;
}

export function Sidebar({ 
  conversations, 
  activeConversationId, 
  onNewChat, 
  onSelectChat,
  onDeleteChat 
}: SidebarProps) {
  return (
    <div className="flex h-full w-64 flex-col border-r border-border bg-black">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <h2 className="text-sm font-semibold text-white">Chats</h2>
        <Button
          onClick={onNewChat}
          size="sm"
          variant="ghost"
          className="h-8 w-8 p-0 hover:bg-white/10"
        >
          <PlusIcon className="h-4 w-4" />
        </Button>
      </div>

      {/* Conversations List */}
      <ScrollArea className="flex-1">
        <div className="space-y-1 p-2">
          {conversations.length === 0 ? (
            <div className="px-3 py-8 text-center text-sm text-muted-foreground">
              No conversations yet
            </div>
          ) : (
            conversations.map((conversation) => (
              <div
                key={conversation.id}
                className={cn(
                  'group flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors',
                  'hover:bg-white/5',
                  activeConversationId === conversation.id
                    ? 'bg-white/10 text-white'
                    : 'text-gray-400'
                )}
              >
                <button
                  onClick={() => onSelectChat(conversation.id)}
                  className="flex flex-1 items-center gap-3 overflow-hidden text-left"
                >
                  <MessageSquareIcon className="h-4 w-4 shrink-0" />
                  <span className="truncate">{conversation.title}</span>
                </button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm('Are you sure you want to delete this chat?')) {
                      onDeleteChat(conversation.id);
                    }
                  }}
                  className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 hover:bg-red-500/20 hover:text-red-500"
                >
                  <Trash2Icon className="h-4 w-4" />
                </Button>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

'use client';

import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/sidebar';
import { ChatContainer } from '@/components/chat-container';
import type { ChatUIMessage } from '@/lib/types';

interface Conversation {
  id: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
}

interface ChatLayoutProps {
  conversationId: string;
  initialMessages: ChatUIMessage[];
  conversations: Conversation[];
}

export function ChatLayout({ conversationId, initialMessages, conversations }: ChatLayoutProps) {
  const router = useRouter();

  const handleNewChat = () => {
    router.push('/chat');
  };

  const handleSelectChat = (id: string) => {
    router.push(`/chat/${id}`);
  };

  const handleDeleteChat = async (id: string) => {
    try {
      const response = await fetch(`/api/conversations/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete chat');
      }

      // If the deleted chat was the active one, redirect to a new chat
      if (id === conversationId) {
        router.push('/chat');
      } else {
        // Otherwise just refresh the data
        router.refresh();
      }
    } catch (error) {
      console.error('Error deleting chat:', error);
      alert('Failed to delete chat');
    }
  };

  return (
    <div className="flex h-screen bg-black">
      <Sidebar
        conversations={conversations}
        activeConversationId={conversationId}
        onNewChat={handleNewChat}
        onSelectChat={handleSelectChat}
        onDeleteChat={handleDeleteChat}
      />
      <div className="flex-1">
        <ChatContainer
          conversationId={conversationId}
          initialMessages={initialMessages}
        />
      </div>
    </div>
  );
}


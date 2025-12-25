import { notFound } from 'next/navigation';
import { getConversationById, convertToUIMessages, getAllConversations } from '@/lib/db';
import { ChatLayout } from '@/components/chat-layout';

// Force dynamic rendering - don't try to generate this page statically at build time
export const dynamic = 'force-dynamic';

interface ChatPageProps {
  params: Promise<{ id: string }>;
}

export default async function ChatPage({ params }: ChatPageProps) {
  const { id } = await params;

  // Load the conversation
  const conversation = await getConversationById(id);
  
  if (!conversation) {
    notFound();
  }

  // Load all conversations for the sidebar
  const allConversations = await getAllConversations();

  // Convert messages to UI format
  const initialMessages = convertToUIMessages(conversation.messages);

  return (
    <ChatLayout
      conversationId={id}
      initialMessages={initialMessages}
      conversations={allConversations}
    />
  );
}


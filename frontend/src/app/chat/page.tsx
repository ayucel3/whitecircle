import { redirect } from 'next/navigation';
import { createConversation } from '@/lib/db';

export default async function NewChatPage() {
  // Create a new conversation
  const conversation = await createConversation('New Chat');
  
  // Redirect to the new chat
  redirect(`/chat/${conversation.id}`);
}


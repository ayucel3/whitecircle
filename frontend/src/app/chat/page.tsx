import { redirect } from 'next/navigation';
import { createConversation } from '@/lib/db';

// Force dynamic rendering - don't try to generate this page statically at build time
export const dynamic = 'force-dynamic';

export default async function NewChatPage() {
  // Create a new conversation
  const conversation = await createConversation('New Chat');
  
  // Redirect to the new chat
  redirect(`/chat/${conversation.id}`);
}


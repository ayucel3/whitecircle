import { prisma } from './prisma';
import type { UIMessage } from 'ai';
import type { ChatUIMessage } from './types';

export interface ConversationWithMessages {
  id: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
  messages: {
    id: string;
    role: string;
    content: string;
    createdAt: Date;
  }[];
}

/**
 * Fetch all conversations ordered by most recent
 */
export async function getAllConversations() {
  return await prisma.conversation.findMany({
    orderBy: {
      updatedAt: 'desc',
    },
    select: {
      id: true,
      title: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}

/**
 * Fetch a specific conversation with all its messages
 */
export async function getConversationById(id: string): Promise<ConversationWithMessages | null> {
  return await prisma.conversation.findUnique({
    where: { id },
    include: {
      messages: {
        orderBy: {
          createdAt: 'asc',
        },
      },
    },
  });
}

/**
 * Create a new conversation
 */
export async function createConversation(title: string = 'New Chat') {
  return await prisma.conversation.create({
    data: {
      title,
    },
  });
}

/**
 * Save messages to a conversation (replaces all messages)
 */
export async function saveMessages(conversationId: string, messages: UIMessage[]) {
  // Delete existing messages first
  await prisma.message.deleteMany({
    where: { conversationId },
  });

  // Insert new messages
  await prisma.message.createMany({
    data: messages.map((msg) => ({
      id: msg.id,
      conversationId,
      role: msg.role,
      content: JSON.stringify(msg.parts),
      createdAt: new Date(),
    })),
  });

  // Update conversation timestamp
  await prisma.conversation.update({
    where: { id: conversationId },
    data: { updatedAt: new Date() },
  });
}

/**
 * Update conversation title
 */
export async function updateConversationTitle(id: string, title: string) {
  return await prisma.conversation.update({
    where: { id },
    data: { title },
  });
}

/**
 * Delete a conversation
 */
export async function deleteConversation(id: string) {
  return await prisma.conversation.delete({
    where: { id },
  });
}

/**
 * Convert stored messages to UIMessage format
 */
export function convertToUIMessages(messages: { id: string; role: string; content: string }[]): ChatUIMessage[] {
  return messages.map((msg) => ({
    id: msg.id,
    role: msg.role as 'user' | 'assistant',
    parts: JSON.parse(msg.content),
  })) as ChatUIMessage[];
}


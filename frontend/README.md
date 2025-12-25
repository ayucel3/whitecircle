# AI Chat with PII Protection

A professional chat interface with automatic PII detection and masking, built with Next.js, Vercel AI SDK, and Prisma.

## Features

- 🤖 **AI-Powered Chat**: Streaming responses from OpenAI GPT-4
- 🔒 **PII Protection**: Automatic detection and masking of sensitive information (emails, phone numbers, names)
- 💾 **Persistent History**: SQLite database for conversation storage
- 🎨 **Modern UI**: Dark theme with smooth animations
- ⚡ **Real-time Streaming**: See responses as they're generated

## Setup

1. **Install dependencies**:
   ```bash
   pnpm install
   ```

2. **Set up environment variables**:
   Create a `.env` file in the frontend directory:
   ```env
   OPENAI_API_KEY=your_openai_api_key_here
   ```

3. **Initialize the database**:
   ```bash
   pnpm prisma generate
   pnpm prisma migrate dev
   ```

4. **Run the development server**:
   ```bash
   pnpm dev
   ```

5. **Open your browser**:
   Navigate to [http://localhost:3000](http://localhost:3000)

## How PII Masking Works

1. User sends a message
2. AI responds with streaming text
3. As text streams, PII detection runs asynchronously
4. When PII is detected (emails, phone numbers, names), those parts are automatically blurred
5. Click on blurred text to reveal/hide the sensitive information
6. All conversations are saved to your local database

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Styling**: Tailwind CSS
- **UI Components**: Shadcn UI
- **AI**: Vercel AI SDK + OpenAI
- **Database**: Prisma + SQLite
- **Language**: TypeScript

## Project Structure

```
frontend/
├── src/
│   ├── app/
│   │   ├── api/chat/          # Chat API route handler
│   │   ├── chat/[id]/         # Chat page with conversation ID
│   │   └── page.tsx           # Home page (redirects to new chat)
│   ├── components/
│   │   ├── ui/                # Shadcn UI components
│   │   ├── sidebar.tsx        # Chat history sidebar
│   │   ├── chat-container.tsx # Main chat interface
│   │   ├── message-item.tsx   # Message with PII masking
│   │   └── chat-layout.tsx    # Layout wrapper
│   └── lib/
│       ├── db.ts              # Database utilities
│       ├── pii-detector.ts    # PII detection logic
│       ├── prisma.ts          # Prisma client
│       └── types.ts           # TypeScript types
└── prisma/
    └── schema.prisma          # Database schema
```

## License

MIT

# WhiteCircle

A Next.js application with AI-powered chat and PII detection capabilities.

## Project Structure

```
whitecircle/
├── frontend/          # Next.js frontend application
├── pii-service/       # PII detection service (standalone LLM-based)
└── scripts/           # Deployment and setup scripts
```

## Prerequisites

- Node.js 18+ or later
- pnpm 8.15.0+
- PostgreSQL database (for production) or SQLite (for development)

## Local Development

1. **Install dependencies:**
   ```bash
   pnpm install
   ```

2. **Set up environment variables:**
   
   Copy `.env.example` to `.env` in the root directory and fill in your values:
   ```bash
   cp .env.example .env
   ```

   For the frontend, create `frontend/.env.local`:
   ```bash
   OPENAI_API_KEY=your_openai_api_key
   DATABASE_URL="file:./dev.db"
   ```

3. **Run database migrations:**
   ```bash
   pnpm db:migrate
   ```

4. **Start the development servers:**
   ```bash
   pnpm dev
   ```

   This will start:
   - Frontend: http://localhost:3000
   - PII Service: http://localhost:3001

## Deployment to Vercel

### Prerequisites

1. A Vercel account
2. A PostgreSQL database (recommended: Vercel Postgres)
3. OpenAI API key

### Deployment Steps

1. **Install Vercel CLI (optional):**
   ```bash
   npm i -g vercel
   ```

2. **Connect to Vercel:**
   ```bash
   vercel login
   ```

3. **Use setup script (recommended):**
   ```bash
   ./scripts/vercel-setup.sh
   ```
   This script will help you set up environment variables on Vercel.

4. **Deploy:**
   ```bash
   vercel --prod
   ```

   Or push to your connected Git repository (GitHub, GitLab, Bitbucket) and Vercel will automatically deploy.

### Post-Deployment

1. **Run database migrations on production:**
   
   Use the provided migration script:
   ```bash
   ./scripts/migrate-production.sh
   ```
   This script will pull your production env and run migrations.

2. **Verify deployment:**
   - Test the chat functionality
   - Verify PII detection is working

## Database Setup

### Development (SQLite)

The project uses SQLite for local development by default. The database file is `frontend/dev.db`.

### Production (PostgreSQL)

For Vercel deployment, you should use PostgreSQL:

1. **Create a Vercel Postgres database:**
   - Go to your Vercel project
   - Navigate to the "Storage" tab
   - Create a new Postgres database
   - Copy the connection string

2. **Update environment variables:**
   - Add `DATABASE_URL` to your Vercel project settings

3. **Update Prisma schema** (if needed):
   
   The `frontend/prisma/schema.prisma` should use `postgresql`:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```

## Features

- AI-powered chat interface
- Real-time PII detection and redaction
- Message persistence with Prisma
- Responsive UI with Tailwind CSS and Radix UI

## Scripts

- `pnpm dev` - Start all development servers
- `pnpm build` - Build all packages
- `pnpm start` - Start production servers
- `pnpm db:migrate` - Run database migrations
- `pnpm db:studio` - Open Prisma Studio

## Tech Stack

- **Frontend:** Next.js 16, React 19, TypeScript
- **Styling:** Tailwind CSS, Radix UI, Framer Motion
- **AI:** Vercel AI SDK, OpenAI
- **Database:** Prisma, PostgreSQL (production) / SQLite (dev)
- **Deployment:** Vercel

## Notes

- The PII service runs as a Next.js API route (`/api/detect-pii`) in production
- For local development, you can still use the standalone Fastify service in `pii-service/`
- Make sure to set up your PostgreSQL database before deploying to production
- The application requires an OpenAI API key to function properly

## Troubleshooting

### Database Connection Issues

If you encounter database connection issues:
- Verify your `DATABASE_URL` is correct
- Ensure the database is accessible from your deployment region
- Check that SSL mode is enabled for production databases

### Build Errors

If you encounter build errors:
- Clear the `.next` cache: `rm -rf frontend/.next`
- Reinstall dependencies: `rm -rf node_modules && pnpm install`
- Ensure all environment variables are set correctly

## License

ISC

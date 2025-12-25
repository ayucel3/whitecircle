import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="flex h-screen items-center justify-center bg-black">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-white">404</h1>
        <p className="mt-4 text-lg text-gray-400">Conversation not found</p>
        <Button asChild className="mt-8 bg-white text-black hover:bg-gray-200">
          <Link href="/chat">Start a new chat</Link>
        </Button>
      </div>
    </div>
  );
}


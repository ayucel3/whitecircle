'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to a new chat on initial load
    router.push('/chat');
  }, [router]);

  return (
    <div className="flex h-screen items-center justify-center bg-black">
      <div className="text-center">
        <h1 className="text-2xl font-semibold text-white">Loading...</h1>
      </div>
    </div>
  );
}

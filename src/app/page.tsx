"use client";

import { useEffect } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { useRouter } from 'next/navigation';

export default function RootPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (user) {
        router.push('/journal');
      } else {
        router.push('/auth');
      }
    }
  }, [user, loading, router]);

  // Show loading spinner while checking auth
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#CCDAD1]">
      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#38302E]"></div>
    </div>
  );
}


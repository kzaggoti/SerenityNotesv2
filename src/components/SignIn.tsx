"use client";

import { useAuth } from '@/lib/hooks/useAuth';

export default function SignIn() {
  const { signInWithGoogle } = useAuth();

  return (
    <div className="flex justify-center items-center p-8">
      <button
        onClick={signInWithGoogle}
        className="bg-[#9CAEA9] text-[#38302E] px-6 py-3 rounded-lg hover:bg-[#788585] transition-colors"
      >
        Sign in with Google
      </button>
    </div>
  );
} 
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function SettingsPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.push('/login'); return; }
      setEmail(user.email ?? '');
      setLoading(false);
    });
  }, []);

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push('/login');
  }

  if (loading) return null;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-md mx-auto">
        <button onClick={() => router.push('/')} className="text-sm text-gray-500 hover:text-gray-800 mb-8 flex items-center gap-1.5 transition">
          ← Back
        </button>
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Settings</h1>
        <p className="text-sm text-gray-400 mb-8">Manage your account</p>

        <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-11 h-11 bg-violet-100 rounded-full flex items-center justify-center text-violet-700 font-bold text-lg">
              {email[0]?.toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-800">{email}</p>
              <p className="text-xs text-gray-400">Logged in</p>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="w-full py-2.5 rounded-xl border border-red-200 text-red-500 text-sm font-medium hover:bg-red-50 transition"
          >
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}

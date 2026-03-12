'use client';

import { Suspense, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useMutation } from '@apollo/client/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Header } from '@/app/components/organisms/header';
import { Heading } from '@/app/components/atoms/heading';
import { Button } from '@/app/components/atoms/button';
import { SIGN_IN } from '@/app/lib/mutations/auth';
import { useAuth } from '@/app/contexts/UserContext';
import { AuthPayload } from '@/app/lib/types';

interface SignInData {
  signIn: AuthPayload;
}

function VerifyAuthContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setUser } = useAuth();
  const token = searchParams.get('token');
  const nextPath = searchParams.get('next') || '/';
  const hasAttempted = useRef(false);

  const [signIn, { loading, error, data }] = useMutation<SignInData>(SIGN_IN, {
    onCompleted: (result) => {
      const payload = result.signIn;
      localStorage.setItem('authToken', payload.authToken);
      setUser(payload.user);
      router.replace(nextPath);
    },
  });

  useEffect(() => {
    if (!token || hasAttempted.current) {
      return;
    }

    hasAttempted.current = true;
    signIn({ variables: { token } });
  }, [signIn, token]);

  return (
    <div className="mx-auto max-w-md rounded-lg border border-gray-200 bg-white p-8 shadow-sm">
      <Heading level={1} className="mb-4">
        Verifying Sign-In
      </Heading>

      {!token && (
        <div className="space-y-4">
          <p className="text-gray-600">
            The verification link is missing its token. Request a new magic link to continue.
          </p>
          <Link href={`/auth/sign-in?next=${encodeURIComponent(nextPath)}`}>
            <Button variant="primary">Request New Link</Button>
          </Link>
        </div>
      )}

      {token && loading && (
        <p className="text-gray-600">
          Exchanging your magic link for a session and redirecting you back into the app.
        </p>
      )}

      {error && (
        <div className="space-y-4">
          <div className="rounded-lg border border-red-200 bg-red-50 p-4">
            <p className="text-sm text-red-600">{error.message}</p>
          </div>
          <Link href={`/auth/sign-in?next=${encodeURIComponent(nextPath)}`}>
            <Button variant="primary">Request New Link</Button>
          </Link>
        </div>
      )}

      {data && !loading && !error && (
        <p className="text-gray-600">Sign-in complete. Redirecting...</p>
      )}
    </div>
  );
}

export default function VerifyAuthPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="container mx-auto px-4 py-16">
        <Suspense fallback={<div className="mx-auto max-w-md text-center text-gray-600">Loading verification...</div>}>
          <VerifyAuthContent />
        </Suspense>
      </main>
    </div>
  );
}

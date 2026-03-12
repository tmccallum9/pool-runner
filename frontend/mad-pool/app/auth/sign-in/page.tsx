'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useMutation } from '@apollo/client/react';
import { useSearchParams } from 'next/navigation';
import { Header } from '@/app/components/organisms/header';
import { Heading } from '@/app/components/atoms/heading';
import { Input } from '@/app/components/atoms/input';
import { Button } from '@/app/components/atoms/button';
import { Label } from '@/app/components/atoms/label';
import { SEND_MAGIC_LINK } from '@/app/lib/mutations/auth';

interface SendMagicLinkData {
  sendMagicLink: {
    success: boolean;
  };
}

function SignInContent() {
  const searchParams = useSearchParams();
  const nextPath = searchParams.get('next') || '/';
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const [sendMagicLink, { loading }] = useMutation<SendMagicLinkData>(SEND_MAGIC_LINK, {
    onCompleted: (data) => {
      if (!data.sendMagicLink.success) {
        setSubmitError('Magic link request failed.');
        return;
      }
      setSubmitted(true);
      setSubmitError('');
    },
    onError: (error) => {
      setSubmitError(error.message);
    },
  });

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitError('');
    await sendMagicLink({ variables: { email } });
  };

  return (
    <div className="mx-auto max-w-md">
      <div className="mb-8">
        <Heading level={1} className="mb-2">
          Sign In
        </Heading>
        <p className="text-gray-600">
          Enter your email to request a magic link and restore access to your pools.
        </p>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-8 shadow-sm">
        {submitted ? (
          <div className="space-y-4">
            <div className="rounded-lg border border-green-200 bg-green-50 p-4">
              <p className="text-sm text-green-700">
                Magic link requested for <span className="font-semibold">{email}</span>.
              </p>
            </div>
            <p className="text-sm text-gray-600">
              If SendGrid is not configured, the backend logs the magic link URL. Open the Render logs,
              copy the link, and visit it to finish sign-in.
            </p>
            <p className="text-sm text-gray-600">
              After sign-in, you will be returned to <span className="font-medium">{nextPath}</span>.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="email" required>
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                helperText="Use the same email address you want associated with your pools."
                required
              />
            </div>

            {submitError && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                <p className="text-sm text-red-600">{submitError}</p>
              </div>
            )}

            <Button type="submit" variant="primary" size="lg" className="w-full" disabled={loading || !email}>
              {loading ? 'Sending Magic Link...' : 'Send Magic Link'}
            </Button>
          </form>
        )}
      </div>

      <div className="mt-6 rounded-lg border border-blue-100 bg-blue-50 p-4">
        <Heading level={4} className="mb-2 text-blue-900">
          Debug Sign-In
        </Heading>
        <p className="text-sm text-blue-800">
          The callback route is <code>/auth/verify</code>. When the backend fallback is active, the logs print a
          URL like <code>/auth/verify?token=...</code> that you can open directly.
        </p>
        <Link href={nextPath} className="mt-3 inline-block text-sm font-medium text-blue-700 hover:text-blue-800">
          Return without signing in
        </Link>
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="container mx-auto px-4 py-16">
        <Suspense fallback={<div className="mx-auto max-w-md text-center text-gray-600">Loading sign-in...</div>}>
          <SignInContent />
        </Suspense>
      </main>
    </div>
  );
}

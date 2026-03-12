'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useMutation } from '@apollo/client/react';
import { usePathname, useRouter } from 'next/navigation';
import { Header } from '@/app/components/organisms/header';
import { Heading } from '@/app/components/atoms/heading';
import { Input } from '@/app/components/atoms/input';
import { Button } from '@/app/components/atoms/button';
import { Label } from '@/app/components/atoms/label';
import { JOIN_POOL } from '@/app/lib/mutations/pool';
import { useAuth } from '@/app/contexts/UserContext';
import { PoolMembership } from '@/app/lib/types';

interface JoinPoolData {
  joinPool: {
    membership: PoolMembership;
  };
}

export default function JoinPoolPage() {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [poolSlug, setPoolSlug] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const signInHref = `/auth/sign-in?next=${encodeURIComponent(pathname || '/pools/join')}`;

  const [joinPool, { loading }] = useMutation<JoinPoolData>(JOIN_POOL, {
    onCompleted: (data) => {
      router.push(`/pools/${data.joinPool.membership.pool.id}`);
    },
    onError: (error) => {
      setErrors({ submit: error.message });
    },
  });

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!poolSlug.trim()) {
      newErrors.poolSlug = 'Pool name/slug is required';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      await joinPool({
        variables: {
          urlSlug: poolSlug,
          password,
        },
      });
    } catch (error) {
      console.error('Join pool error:', error);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="container mx-auto px-4 py-16">
          <div className="mx-auto max-w-md text-center">
            <p className="text-gray-600">Loading...</p>
          </div>
        </main>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="container mx-auto px-4 py-16">
          <div className="mx-auto max-w-md rounded-lg border border-gray-200 bg-white p-8 shadow-sm">
            <Heading level={2} className="mb-3">
              Sign In Required
            </Heading>
            <p className="mb-6 text-gray-600">
              Join requests now use your authenticated account so draft picks and standings are attached to the
              correct member.
            </p>
            <Link href={signInHref}>
              <Button variant="primary" size="lg" className="w-full">
                Sign In to Join a Pool
              </Button>
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="container mx-auto px-4 py-16">
        <div className="mx-auto max-w-md">
          <div className="mb-8">
            <Heading level={1} className="mb-2">
              Join a Pool
            </Heading>
            <p className="text-gray-600">
              Enter the pool name and password to join an existing March Madness pool.
            </p>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-8 shadow-sm">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="poolSlug" required>
                  Pool Name
                </Label>
                <Input
                  id="poolSlug"
                  type="text"
                  value={poolSlug}
                  onChange={(event) => setPoolSlug(event.target.value)}
                  placeholder="pool-name"
                  error={errors.poolSlug}
                  helperText="Enter the pool name or URL slug"
                />
              </div>

              <div>
                <Label htmlFor="password" required>
                  Pool Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Enter password"
                  error={errors.password}
                  helperText="Ask the pool owner for the password"
                />
              </div>

              {errors.submit && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                  <p className="text-sm text-red-600">{errors.submit}</p>
                </div>
              )}

              <Button type="submit" variant="primary" size="lg" className="w-full" disabled={loading}>
                {loading ? 'Joining Pool...' : 'Join Pool'}
              </Button>
            </form>
          </div>

          <div className="mt-6 rounded-lg border border-gray-100 bg-gray-50 p-4">
            <Heading level={4} className="mb-2 text-gray-900">
              Need a Pool Link?
            </Heading>
            <p className="text-sm text-gray-600">
              If you have a direct invitation link, click it to join automatically. Otherwise, ask the pool
              owner for the pool name and password.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

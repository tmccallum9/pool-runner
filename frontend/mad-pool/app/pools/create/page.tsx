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
import { CREATE_POOL } from '@/app/lib/mutations/pool';
import { useAuth } from '@/app/contexts/UserContext';
import { Pool } from '@/app/lib/types';

interface CreatePoolData {
  createPool: {
    pool: Pool;
  };
}

export default function CreatePoolPage() {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [poolName, setPoolName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const signInHref = `/auth/sign-in?next=${encodeURIComponent(pathname || '/pools/create')}`;

  const [createPool, { loading }] = useMutation<CreatePoolData>(CREATE_POOL, {
    onCompleted: (data) => {
      router.push(`/pools/${data.createPool.pool.id}`);
    },
    onError: (error) => {
      setErrors({ submit: error.message });
    },
  });

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!poolName.trim()) {
      newErrors.poolName = 'Pool name is required';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 4) {
      newErrors.password = 'Password must be at least 4 characters';
    }

    if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
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
      await createPool({
        variables: {
          name: poolName,
          password,
        },
      });
    } catch (error) {
      console.error('Create pool error:', error);
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
              Create a pool with a real account so ownership, invitations, and draft actions are tied to the
              correct user.
            </p>
            <Link href={signInHref}>
              <Button variant="primary" size="lg" className="w-full">
                Sign In to Create a Pool
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
              Create a Pool
            </Heading>
            <p className="text-gray-600">
              Set up a new March Madness pool and invite your friends to join.
            </p>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-8 shadow-sm">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="poolName" required>
                  Pool Name
                </Label>
                <Input
                  id="poolName"
                  type="text"
                  value={poolName}
                  onChange={(event) => setPoolName(event.target.value)}
                  placeholder="My March Madness Pool"
                  error={errors.poolName}
                  helperText="Choose a unique name for your pool"
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
                  helperText="Members will need this to join your pool"
                />
              </div>

              <div>
                <Label htmlFor="confirmPassword" required>
                  Confirm Password
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  placeholder="Confirm password"
                  error={errors.confirmPassword}
                />
              </div>

              {errors.submit && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                  <p className="text-sm text-red-600">{errors.submit}</p>
                </div>
              )}

              <Button type="submit" variant="primary" size="lg" className="w-full" disabled={loading}>
                {loading ? 'Creating Pool...' : 'Create Pool'}
              </Button>
            </form>
          </div>

          <div className="mt-6 rounded-lg border border-blue-100 bg-blue-50 p-4">
            <Heading level={4} className="mb-2 text-blue-900">
              Pool Owner Benefits
            </Heading>
            <ul className="space-y-1 text-sm text-blue-800">
              <li>• Randomize draft order for all members</li>
              <li>• Start and complete the draft</li>
              <li>• Update tournament results</li>
              <li>• Participate in drafting teams</li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}

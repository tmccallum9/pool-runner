'use client';

import { useState } from 'react';
import { useMutation } from '@apollo/client/react';
import { useRouter } from 'next/navigation';
import { Header } from '@/app/components/organisms/header';
import { Heading } from '@/app/components/atoms/heading';
import { Input } from '@/app/components/atoms/input';
import { Button } from '@/app/components/atoms/button';
import { Label } from '@/app/components/atoms/label';
import { JOIN_POOL } from '@/app/lib/mutations/pool';
import { useAuth } from '@/app/contexts/UserContext';

export default function JoinPoolPage() {
  const router = useRouter();
  const { user, isAuthenticated, setUser } = useAuth();
  const [poolSlug, setPoolSlug] = useState('');
  const [password, setPassword] = useState('');
  const [mockEmail, setMockEmail] = useState('');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const [joinPool, { loading }] = useMutation(JOIN_POOL, {
    onCompleted: (data) => {
      // Redirect to pool dashboard on success
      router.push(`/pools/${data.joinPool.pool.id}`);
    },
    onError: (error) => {
      setErrors({ submit: error.message });
    },
  });

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!isAuthenticated && !mockEmail.trim()) {
      newErrors.mockEmail = 'Email is required';
    }

    if (!poolSlug.trim()) {
      newErrors.poolSlug = 'Pool name/slug is required';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    // If not authenticated, set mock user first
    if (!isAuthenticated && mockEmail) {
      setUser({
        id: `mock-${Date.now()}`,
        email: mockEmail,
        createdAt: new Date().toISOString(),
      });
    }

    try {
      await joinPool({
        variables: {
          urlSlug: poolSlug,
          password: password,
        },
      });
    } catch (error) {
      // Error handling is done in onError callback
      console.error('Join pool error:', error);
    }
  };

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
              {/* Mock Email (only show if not authenticated) */}
              {!isAuthenticated && (
                <div>
                  <Label htmlFor="mockEmail" required>
                    Your Email
                  </Label>
                  <Input
                    id="mockEmail"
                    type="email"
                    value={mockEmail}
                    onChange={(e) => setMockEmail(e.target.value)}
                    placeholder="your@email.com"
                    error={errors.mockEmail}
                    helperText="Mock authentication - enter any email"
                  />
                </div>
              )}

              {/* Pool Name/Slug */}
              <div>
                <Label htmlFor="poolSlug" required>
                  Pool Name
                </Label>
                <Input
                  id="poolSlug"
                  type="text"
                  value={poolSlug}
                  onChange={(e) => setPoolSlug(e.target.value)}
                  placeholder="pool-name"
                  error={errors.poolSlug}
                  helperText="Enter the pool name or URL slug"
                />
              </div>

              {/* Password */}
              <div>
                <Label htmlFor="password" required>
                  Pool Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  error={errors.password}
                  helperText="Ask the pool owner for the password"
                />
              </div>

              {/* Submit Error */}
              {errors.submit && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                  <p className="text-sm text-red-600">{errors.submit}</p>
                </div>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full"
                disabled={loading}
              >
                {loading ? 'Joining Pool...' : 'Join Pool'}
              </Button>
            </form>
          </div>

          {/* Info Box */}
          <div className="mt-6 rounded-lg border border-gray-100 bg-gray-50 p-4">
            <Heading level={4} className="mb-2 text-gray-900">
              Need a Pool Link?
            </Heading>
            <p className="text-sm text-gray-600">
              If you have a direct invitation link, click it to join automatically.
              Otherwise, ask the pool owner for the pool name and password.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

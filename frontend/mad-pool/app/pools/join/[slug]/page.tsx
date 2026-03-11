'use client';

import { useState } from 'react';
import { useMutation } from '@apollo/client/react';
import { useRouter, useParams } from 'next/navigation';
import { Header } from '@/app/components/organisms/header';
import { Heading } from '@/app/components/atoms/heading';
import { Input } from '@/app/components/atoms/input';
import { Button } from '@/app/components/atoms/button';
import { Label } from '@/app/components/atoms/label';
import { JOIN_POOL } from '@/app/lib/mutations/pool';
import { useAuth } from '@/app/contexts/UserContext';

export default function JoinPoolBySlugPage() {
  const router = useRouter();
  const params = useParams();
  const slug = params.slug as string;

  const { user, isAuthenticated, setUser, loading: authLoading } = useAuth();
  const [password, setPassword] = useState('');
  const [mockEmail, setMockEmail] = useState('');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const [joinPool, { loading }] = useMutation(JOIN_POOL, {
    onCompleted: (data) => {
      // Redirect to pool dashboard on success
      router.push(`/pools/${data.joinPool.membership.pool.id}`);
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

    // If not authenticated with JWT, set mock user first
    const hasAuthToken = typeof window !== 'undefined' && !!localStorage.getItem('authToken');
    if (!hasAuthToken && !isAuthenticated && mockEmail) {
      setUser({
        id: `mock-${Date.now()}`,
        email: mockEmail,
        createdAt: new Date().toISOString(),
      });
    }

    try {
      await joinPool({
        variables: {
          urlSlug: slug,
          password: password,
        },
      });
    } catch (error) {
      // Error handling is done in onError callback
      console.error('Join pool error:', error);
    }
  };

  // Show loading while checking authentication
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

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="container mx-auto px-4 py-16">
        <div className="mx-auto max-w-md">
          <div className="mb-8">
            <Heading level={1} className="mb-2">
              Join Pool
            </Heading>
            <p className="text-gray-600">
              You've been invited to join <span className="font-semibold">{slug}</span>
            </p>
            {isAuthenticated && user && (
              <p className="mt-2 text-sm text-green-600">
                Joining as: {user.email}
              </p>
            )}
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-8 shadow-sm">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Pool Slug (Display Only) */}
              <div>
                <Label htmlFor="poolSlug">Pool Name</Label>
                <Input
                  id="poolSlug"
                  type="text"
                  value={slug}
                  disabled
                  helperText="This pool's unique identifier"
                />
              </div>

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
                  helperText="Enter the password provided by the pool owner"
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
          <div className="mt-6 rounded-lg border border-green-100 bg-green-50 p-4">
            <Heading level={4} className="mb-2 text-green-900">
              What Happens Next?
            </Heading>
            <ul className="space-y-1 text-sm text-green-800">
              <li>• Wait for the pool owner to start the draft</li>
              <li>• Draft 5 teams when it's your turn</li>
              <li>• Earn points as your teams win games</li>
              <li>• Compete on the leaderboard</li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}

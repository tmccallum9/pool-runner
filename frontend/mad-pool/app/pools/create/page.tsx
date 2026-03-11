'use client';

import { useState } from 'react';
import { useMutation } from '@apollo/client/react';
import { useRouter } from 'next/navigation';
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
  const { user, isAuthenticated, setUser, loading: authLoading } = useAuth();
  const [poolName, setPoolName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [mockEmail, setMockEmail] = useState('');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const [createPool, { loading }] = useMutation<CreatePoolData>(CREATE_POOL, {
    onCompleted: (data) => {
      // Redirect to pool dashboard on success
      router.push(`/pools/${data.createPool.pool.id}`);
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
      await createPool({
        variables: {
          name: poolName,
          password: password,
        },
      });
    } catch (error) {
      // Error handling is done in onError callback
      console.error('Create pool error:', error);
    }
  };

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

              {/* Pool Name */}
              <div>
                <Label htmlFor="poolName" required>
                  Pool Name
                </Label>
                <Input
                  id="poolName"
                  type="text"
                  value={poolName}
                  onChange={(e) => setPoolName(e.target.value)}
                  placeholder="My March Madness Pool"
                  error={errors.poolName}
                  helperText="Choose a unique name for your pool"
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
                  helperText="Members will need this to join your pool"
                />
              </div>

              {/* Confirm Password */}
              <div>
                <Label htmlFor="confirmPassword" required>
                  Confirm Password
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm password"
                  error={errors.confirmPassword}
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
                {loading ? 'Creating Pool...' : 'Create Pool'}
              </Button>
            </form>
          </div>

          {/* Info Box */}
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

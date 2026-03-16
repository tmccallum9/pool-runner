'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Header } from '@/app/components/organisms/header';
import { Sidebar } from '@/app/components/organisms/sidebar';
import { useAuth } from '@/app/contexts/UserContext';
import { usePool, usePoolMembers } from '@/app/lib/hooks';

export default function PoolLayout({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const router = useRouter();
  const poolIdOrSlug = params.poolId as string;
  const { user, isAuthenticated } = useAuth();
  const { pool, loading, error } = usePool(poolIdOrSlug);

  // Wait for pool to load before fetching members (need the actual UUID)
  const { members, loading: membersLoading } = usePoolMembers(pool?.id || '');

  // Redirect to homepage if not authenticated
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, loading, router]);

  // Show loading state
  if (loading || membersLoading || !pool) {
    return (
      <div className="flex min-h-screen flex-col bg-gray-50">
        <Header />
        <div className="flex flex-1 items-center justify-center">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
            <p className="mt-4 text-gray-600">Loading pool...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="flex min-h-screen flex-col bg-gray-50">
        <Header />
        <div className="flex flex-1 items-center justify-center p-4">
          <div className="max-w-md rounded-lg border border-red-200 bg-red-50 p-6 text-center">
            <h2 className="mb-2 text-lg font-semibold text-red-900">
              Error Loading Pool
            </h2>
            <p className="mb-4 text-sm text-red-600">{error.message}</p>
            <button
              onClick={() => router.push('/')}
              className="rounded-lg bg-red-600 px-4 py-2 text-white hover:bg-red-700"
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Check if user is a member of the pool
  const isMember = members.some((member) => member.user.id === user?.id);
  const isOwner = pool.owner.id === user?.id;

  if (!isMember && !isOwner) {
    return (
      <div className="flex min-h-screen flex-col bg-gray-50">
        <Header />
        <div className="flex flex-1 items-center justify-center p-4">
          <div className="max-w-md rounded-lg border border-yellow-200 bg-yellow-50 p-6 text-center">
            <h2 className="mb-2 text-lg font-semibold text-yellow-900">
              Access Denied
            </h2>
            <p className="mb-4 text-sm text-yellow-700">
              You are not a member of this pool.
            </p>
            <button
              onClick={() => router.push('/')}
              className="rounded-lg bg-yellow-600 px-4 py-2 text-white hover:bg-yellow-700"
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <Header />
      <div className="flex flex-1">
        <Sidebar
          poolId={pool.id}
          poolName={pool.name}
          draftStatus={pool.draftStatus}
          isOwner={isOwner}
        />
        <main className="flex-1 overflow-auto">
          <div className="container mx-auto p-6">{children}</div>
        </main>
      </div>
    </div>
  );
}

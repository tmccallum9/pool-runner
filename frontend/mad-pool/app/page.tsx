'use client';

import Link from 'next/link';
import { useQuery } from '@apollo/client/react';
import { Header } from './components/organisms/header';
import { Heading } from './components/atoms/heading';
import { Button } from './components/atoms/button';
import { PoolCard } from './components/molecules/pool-card';
import { useAuth } from './contexts/UserContext';
import { GET_USER_POOLS } from './lib/queries/pool';
import { Pool } from './lib/types';

interface UserPoolsData {
  getUserPools: Pool[];
}

interface UserPoolsVars {
  userId: string;
}

export default function Home() {
  const { isAuthenticated, user } = useAuth();

  // Fetch user's pools
  const { data: poolsData, loading: poolsLoading } = useQuery<UserPoolsData, UserPoolsVars>(
    GET_USER_POOLS,
    {
      variables: { userId: user?.id || '' },
      skip: !user?.id,
      fetchPolicy: 'cache-and-network',
    }
  );

  const userPools = poolsData?.getUserPools || [];

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="mb-16 text-center">
          <Heading level={1} className="mb-4">
            March Madness Pool Runner
          </Heading>
          <p className="mx-auto max-w-2xl text-xl text-gray-600">
            Create and join basketball tournament pools with friends. Draft teams,
            track scores, and compete on the leaderboard.
          </p>
        </div>

        {isAuthenticated ? (
          /* Authenticated User View */
          <div className="mx-auto max-w-4xl">
            <Heading level={2} className="mb-6">
              Welcome back, {user?.email}!
            </Heading>

            <div className="mb-8 grid gap-6 md:grid-cols-2">
              {/* Create Pool Card */}
              <Link href="/pools/create">
                <div className="cursor-pointer rounded-lg border-2 border-blue-200 bg-white p-8 shadow-sm transition-shadow hover:border-blue-400 hover:shadow-md">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                    <span className="text-2xl">+</span>
                  </div>
                  <Heading level={3} className="mb-2">
                    Create a Pool
                  </Heading>
                  <p className="text-gray-600">
                    Start a new March Madness pool and invite your friends to join.
                  </p>
                </div>
              </Link>

              {/* Join Pool Card */}
              <Link href="/pools/join">
                <div className="cursor-pointer rounded-lg border-2 border-green-200 bg-white p-8 shadow-sm transition-shadow hover:border-green-400 hover:shadow-md">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                    <span className="text-2xl">→</span>
                  </div>
                  <Heading level={3} className="mb-2">
                    Join a Pool
                  </Heading>
                  <p className="text-gray-600">
                    Enter a pool name and password to join an existing pool.
                  </p>
                </div>
              </Link>
            </div>

            {/* User's Pools Section */}
            <div className="rounded-lg border border-gray-200 bg-white p-8">
              <Heading level={3} className="mb-4">
                My Pools
              </Heading>

              {poolsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
                  <span className="ml-3 text-gray-600">Loading pools...</span>
                </div>
              ) : userPools.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2">
                  {userPools.map((pool) => (
                    <PoolCard
                      key={pool.id}
                      id={pool.id}
                      name={pool.name}
                      draftStatus={pool.draftStatus}
                      memberCount={pool.memberCount || 0}
                      maxMembers={pool.maxMembers}
                      isOwner={pool.owner.id === user?.id}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">
                  Your pools will appear here once you create or join one.
                </p>
              )}
            </div>
          </div>
        ) : (
          /* Unauthenticated User View */
          <div className="mx-auto max-w-2xl">
            <div className="rounded-lg border border-gray-200 bg-white p-12 shadow-sm">
              <Heading level={2} className="mb-6 text-center">
                Get Started
              </Heading>
              <p className="mb-8 text-center text-gray-600">
                Sign in with a mock email to create or join a pool. (Magic link
                authentication will be added later)
              </p>

              <div className="flex flex-col gap-4">
                <Link href="/pools/create" className="w-full">
                  <Button variant="primary" size="lg" className="w-full">
                    Create a Pool
                  </Button>
                </Link>
                <Link href="/pools/join" className="w-full">
                  <Button variant="outline" size="lg" className="w-full">
                    Join a Pool
                  </Button>
                </Link>
              </div>
            </div>

            {/* Features Section */}
            <div className="mt-16 grid gap-8 md:grid-cols-3">
              <div className="text-center">
                <div className="mb-3 text-4xl">🏀</div>
                <Heading level={4} className="mb-2">
                  Draft Teams
                </Heading>
                <p className="text-sm text-gray-600">
                  Snake draft format with 5 rounds and seed group constraints.
                </p>
              </div>
              <div className="text-center">
                <div className="mb-3 text-4xl">📊</div>
                <Heading level={4} className="mb-2">
                  Track Scores
                </Heading>
                <p className="text-sm text-gray-600">
                  Automatic point calculation based on team seed and tournament round.
                </p>
              </div>
              <div className="text-center">
                <div className="mb-3 text-4xl">🏆</div>
                <Heading level={4} className="mb-2">
                  Compete
                </Heading>
                <p className="text-sm text-gray-600">
                  Live leaderboard showing rankings and total points earned.
                </p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

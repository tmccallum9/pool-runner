'use client';

import { useParams } from 'next/navigation';
import { Heading } from '@/app/components/atoms/heading';
import { Leaderboard } from '@/app/components/organisms/leaderboard';
import { UserTeams } from '@/app/components/organisms/user-teams';
import { useAuth } from '@/app/contexts/UserContext';
import { useLeaderboard, usePool } from '@/app/lib/hooks';

export default function LeaderboardPage() {
  const params = useParams();
  const poolIdOrSlug = params.poolId as string;
  const { user } = useAuth();
  const { pool, loading: poolLoading } = usePool(poolIdOrSlug);
  const { standings, loading: standingsLoading } = useLeaderboard(pool?.id || '', true);

  if (poolLoading || standingsLoading || !pool) {
    return <div className="text-gray-600">Loading leaderboard...</div>;
  }

  const currentMember = standings.find((member) => member.user.id === user?.id);

  return (
    <div className="space-y-8">
      <div>
        <Heading level={1} className="mb-2">
          Leaderboard
        </Heading>
        <p className="text-gray-600">
          Live standings for {pool.name}. Points update as tournament results are recorded.
        </p>
      </div>

      <Leaderboard standings={standings} currentUserId={user?.id} />

      {user?.id && currentMember && (
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <UserTeams poolId={pool.id} userId={user.id} title="Your Drafted Teams" />
        </div>
      )}
    </div>
  );
}

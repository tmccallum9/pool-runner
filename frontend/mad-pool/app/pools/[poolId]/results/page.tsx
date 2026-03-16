'use client';

import React, { use } from 'react';
import { useAuth } from '@/app/contexts/UserContext';
import { usePool } from '@/app/lib/hooks/usePool';
import { usePoolTeams } from '@/app/lib/hooks/usePoolTeams';
import { usePoolResults } from '@/app/lib/hooks/usePoolResults';
import { Heading } from '@/app/components/atoms/heading';
import { TeamResultsEditor } from '@/app/components/organisms/team-results-editor';

interface ResultsPageProps {
  params: Promise<{
    poolId: string;
  }>;
}

export default function ResultsPage({ params }: ResultsPageProps) {
  const resolvedParams = use(params);
  const { poolId } = resolvedParams;
  const { user } = useAuth();
  const { pool, loading: poolLoading } = usePool(poolId);
  const { teams, loading: teamsLoading, refetch: refetchTeams } = usePoolTeams(poolId);
  const { refetch: refetchResults } = usePoolResults(poolId);

  const isOwner = pool && user && pool.owner.id === user.id;
  const loading = poolLoading || teamsLoading;

  const handleUpdate = async () => {
    // Refetch both teams and results to get updated data
    await Promise.all([refetchTeams(), refetchResults()]);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  if (!pool) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-red-600">Pool not found</div>
      </div>
    );
  }

  if (!isOwner) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="rounded-lg bg-red-50 p-6 text-center">
          <Heading level={2} className="mb-2 text-red-800">
            Access Denied
          </Heading>
          <p className="text-red-600">
            Only the pool owner can manage tournament results.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl p-6">
      <div className="mb-8">
        <Heading level={1} className="mb-2">
          Tournament Results
        </Heading>
        <p className="text-gray-600">
          Mark wins and losses for each team in the tournament. Points are automatically
          calculated as: <strong>Seed Rank + Tournament Round</strong>
        </p>
      </div>

      {teams.length === 0 ? (
        <div className="rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
          <p className="text-gray-600">No teams have been added to this pool yet.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {teams.map(team => (
            <TeamResultsEditor
              key={team.id}
              team={team}
              poolId={poolId}
              onUpdate={handleUpdate}
            />
          ))}
        </div>
      )}

      <div className="mt-8 rounded-lg bg-blue-50 p-4">
        <Heading level={3} className="mb-2 text-blue-900">
          Tournament Round Guide
        </Heading>
        <ul className="space-y-1 text-sm text-blue-800">
          <li><strong>Round 1:</strong> Round of 64</li>
          <li><strong>Round 2:</strong> Round of 32</li>
          <li><strong>Round 3:</strong> Sweet 16</li>
          <li><strong>Round 4:</strong> Elite 8</li>
          <li><strong>Round 5:</strong> Final 4</li>
          <li><strong>Round 6:</strong> Championship</li>
        </ul>
      </div>
    </div>
  );
}

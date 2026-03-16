'use client';

import React from 'react';
import { TeamCard } from '../molecules/team-card';
import { useUserDraftPicks } from '@/app/lib/hooks/useUserDraftPicks';
import { getTeamStatus } from '@/app/lib/types';
import { Heading } from '../atoms/heading';

interface UserTeamsProps {
  poolId: string;
  userId: string;
  title?: string;
  className?: string;
  refreshKey?: number;
}

export const UserTeams: React.FC<UserTeamsProps> = ({
  poolId,
  userId,
  title = 'My Teams',
  className = '',
  refreshKey = 0,
}) => {
  const { draftPicks, loading, error, refetch } = useUserDraftPicks(poolId, userId, refreshKey);

  if (loading) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
          <p className="mt-4 text-gray-600">Loading your teams...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`rounded-lg border-2 border-red-200 bg-red-50 p-6 ${className}`}>
        <Heading level={3} className="mb-2 text-red-800">
          Error Loading Your Teams
        </Heading>
        <p className="mb-4 text-red-600">{error.message}</p>
        <button
          onClick={() => refetch()}
          className="rounded-lg bg-red-600 px-4 py-2 text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!draftPicks || draftPicks.length === 0) {
    return (
      <div className={`rounded-lg border-2 border-gray-200 bg-gray-50 p-8 text-center ${className}`}>
        <Heading level={3} className="mb-2 text-gray-700">
          No Teams Drafted
        </Heading>
        <p className="text-gray-600">You haven&apos;t drafted any teams yet.</p>
      </div>
    );
  }

  // Sort by draft round
  const sortedPicks = [...draftPicks].sort((a, b) => a.draftRound - b.draftRound);

  return (
    <div className={className}>
      <Heading level={2} className="mb-6">
        {title}
      </Heading>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {sortedPicks.map((pick) => (
          <div key={pick.id} className="relative">
            <TeamCard
              name={pick.team.name}
              seedRank={pick.team.seedRank}
              region={pick.team.region}
              status={getTeamStatus(pick.team.results || [])}
            />
            <div className="absolute right-2 top-2 rounded-full bg-blue-600 px-2 py-1 text-xs font-semibold text-white">
              Round {pick.draftRound}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default UserTeams;

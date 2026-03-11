'use client';

import React from 'react';
import { TeamCard } from '../molecules/team-card';
import { usePoolTeams } from '@/app/lib/hooks/usePoolTeams';
import { getTeamStatus } from '@/app/lib/types';
import { Heading } from '../atoms/heading';

interface TeamsListProps {
  poolId: string;
  title?: string;
  className?: string;
}

export const TeamsList: React.FC<TeamsListProps> = ({
  poolId,
  title = 'All Teams',
  className = '',
}) => {
  const { teams, loading, error, refetch } = usePoolTeams(poolId);

  if (loading) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
          <p className="mt-4 text-gray-600">Loading teams...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`rounded-lg border-2 border-red-200 bg-red-50 p-6 ${className}`}>
        <Heading level={3} className="mb-2 text-red-800">
          Error Loading Teams
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

  if (!teams || teams.length === 0) {
    return (
      <div className={`rounded-lg border-2 border-gray-200 bg-gray-50 p-8 text-center ${className}`}>
        <Heading level={3} className="mb-2 text-gray-700">
          No Teams Found
        </Heading>
        <p className="text-gray-600">There are no teams in this pool yet.</p>
      </div>
    );
  }

  return (
    <div className={className}>
      <Heading level={2} className="mb-6">
        {title}
      </Heading>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {teams.map((team) => (
          <TeamCard
            key={team.id}
            name={team.name}
            seedRank={team.seedRank}
            region={team.region}
            status={getTeamStatus(team.results)}
          />
        ))}
      </div>
    </div>
  );
};

export default TeamsList;

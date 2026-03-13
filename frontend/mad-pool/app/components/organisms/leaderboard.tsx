'use client';

import React from 'react';
import { Heading } from '../atoms/heading';
import { PoolMembership } from '@/app/lib/types';

interface LeaderboardProps {
  standings: PoolMembership[];
  currentUserId?: string;
  className?: string;
}

export const Leaderboard: React.FC<LeaderboardProps> = ({
  standings,
  currentUserId,
  className = '',
}) => {
  const ranked = [...standings].sort((a, b) => {
    if (b.totalPoints !== a.totalPoints) {
      return b.totalPoints - a.totalPoints;
    }

    if (a.draftPosition === null) {
      return 1;
    }

    if (b.draftPosition === null) {
      return -1;
    }

    return a.draftPosition - b.draftPosition;
  });

  return (
    <div className={className}>
      <div className="mb-4 flex items-center justify-between">
        <Heading level={3}>Leaderboard</Heading>
        <span className="text-sm text-gray-600">{ranked.length} members</span>
      </div>

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Rank</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Member</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Draft Slot</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Teams</th>
              <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Points</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {ranked.map((member, index) => {
              const isCurrentUser = member.user.id === currentUserId;

              return (
                <tr key={member.id} className={isCurrentUser ? 'bg-blue-50' : 'hover:bg-gray-50'}>
                  <td className="px-4 py-3 text-sm font-semibold text-gray-900">#{index + 1}</td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    <div className="flex items-center gap-2">
                      <span>{member.user.email}</span>
                      {isCurrentUser && (
                        <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700">
                          You
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {member.draftPosition ? `#${member.draftPosition}` : 'Not set'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {(member.picks || []).map((pick) => pick.team.name).join(', ') || 'No picks yet'}
                  </td>
                  <td className="px-4 py-3 text-right text-sm font-semibold text-gray-900">
                    {member.totalPoints}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {ranked.length === 0 && (
          <div className="p-8 text-center text-gray-500">No standings available yet.</div>
        )}
      </div>
    </div>
  );
};

export default Leaderboard;

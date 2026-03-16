'use client';

import React, { useState } from 'react';
import { Heading } from '../atoms/heading';
import { PoolMembership, ResultEnum } from '@/app/lib/types';

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
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const toggleRow = (memberId: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(memberId)) {
      newExpanded.delete(memberId);
    } else {
      newExpanded.add(memberId);
    }
    setExpandedRows(newExpanded);
  };

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
              const isExpanded = expandedRows.has(member.id);
              const hasTeams = member.picks && member.picks.length > 0;

              return (
                <React.Fragment key={member.id}>
                  <tr className={isCurrentUser ? 'bg-blue-50' : 'hover:bg-gray-50'}>
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
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <span className="text-sm font-semibold text-gray-900">
                          {member.totalPoints}
                        </span>
                        {hasTeams && (
                          <button
                            onClick={() => toggleRow(member.id)}
                            className="ml-2 text-gray-400 hover:text-gray-600"
                            aria-label={isExpanded ? 'Collapse details' : 'Expand details'}
                          >
                            {isExpanded ? '▼' : '▶'}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                  {isExpanded && hasTeams && (
                    <tr className={isCurrentUser ? 'bg-blue-50' : 'bg-gray-50'}>
                      <td colSpan={5} className="px-4 py-3">
                        <div className="rounded-lg bg-white p-4">
                          <h4 className="mb-3 text-sm font-semibold text-gray-700">Points Breakdown</h4>
                          <div className="space-y-2">
                            {member.picks.map((pick) => {
                              const teamResults = pick.team.results || [];
                              const wins = teamResults.filter(r => r.result === ResultEnum.WON);
                              const teamPoints = wins.reduce((sum, r) => sum + r.pointsAwarded, 0);
                              const isEliminated = teamResults.some(r => r.result === ResultEnum.LOST);

                              return (
                                <div
                                  key={pick.id}
                                  className="flex items-center justify-between rounded border border-gray-200 p-3"
                                >
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                      <span className="font-medium text-gray-900">{pick.team.name}</span>
                                      <span className="text-xs text-gray-500">Seed {pick.team.seedRank}</span>
                                      {isEliminated && (
                                        <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                                          Eliminated
                                        </span>
                                      )}
                                    </div>
                                    {wins.length > 0 && (
                                      <div className="mt-1 text-xs text-gray-600">
                                        {wins.length} {wins.length === 1 ? 'win' : 'wins'}:{' '}
                                        {wins.map(w => `R${w.tournamentRound} (+${w.pointsAwarded})`).join(', ')}
                                      </div>
                                    )}
                                  </div>
                                  <div className="text-right">
                                    <span className="font-semibold text-gray-900">
                                      {teamPoints} pts
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
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

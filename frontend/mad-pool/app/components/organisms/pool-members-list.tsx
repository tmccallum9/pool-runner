'use client';

import React from 'react';
import { usePoolMembers } from '@/app/lib/hooks';
import { Heading } from '../atoms/heading';

interface PoolMembersListProps {
  poolId: string;
  className?: string;
}

export const PoolMembersList: React.FC<PoolMembersListProps> = ({
  poolId,
  className = '',
}) => {
  const { members, loading, error } = usePoolMembers(poolId);

  if (loading) {
    return (
      <div className={className}>
        <Heading level={3} className="mb-4">
          Pool Members
        </Heading>
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <p className="text-sm text-gray-500">Loading members...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={className}>
        <Heading level={3} className="mb-4">
          Pool Members
        </Heading>
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-600">Error loading members: {error.message}</p>
        </div>
      </div>
    );
  }

  // Sort members by draft position (nulls at the end)
  const sortedMembers = [...members].sort((a, b) => {
    if (a.draftPosition === null) return 1;
    if (b.draftPosition === null) return -1;
    return a.draftPosition - b.draftPosition;
  });

  return (
    <div className={className}>
      <Heading level={3} className="mb-4">
        Pool Members ({members.length})
      </Heading>

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                Draft Position
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                Email
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                Teams Picked
              </th>
              <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">
                Total Points
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {sortedMembers.map((member) => (
              <tr key={member.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm">
                  {member.draftPosition ? (
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 font-semibold text-blue-800">
                      {member.draftPosition}
                    </span>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </td>
                <td className="px-4 py-3 text-sm text-gray-900">
                  {member.user.email}
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  {member.picks?.length || 0} / 5
                </td>
                <td className="px-4 py-3 text-right text-sm font-semibold text-gray-900">
                  {member.totalPoints}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {members.length === 0 && (
          <div className="p-8 text-center">
            <p className="text-gray-500">No members yet</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PoolMembersList;

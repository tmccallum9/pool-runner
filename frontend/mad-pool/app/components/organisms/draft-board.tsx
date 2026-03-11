'use client';

import React from 'react';
import { Heading } from '../atoms/heading';
import { DraftPick } from '@/app/lib/types';

interface DraftBoardProps {
  draftPicks: DraftPick[];
  totalMembers: number;
  className?: string;
}

export const DraftBoard: React.FC<DraftBoardProps> = ({
  draftPicks,
  totalMembers,
  className = '',
}) => {
  // Sort picks by pick order
  const sortedPicks = [...draftPicks].sort((a, b) => a.pickOrder - b.pickOrder);

  // Calculate expected total picks (5 rounds * members)
  const expectedPicks = totalMembers * 5;

  return (
    <div className={className}>
      <div className="mb-4 flex items-center justify-between">
        <Heading level={3}>Draft Board</Heading>
        <span className="text-sm text-gray-600">
          {draftPicks.length} / {expectedPicks} picks
        </span>
      </div>

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
        {/* Header */}
        <div className="border-b border-gray-200 bg-gray-50 px-4 py-3">
          <div className="grid grid-cols-12 gap-4 text-xs font-semibold uppercase text-gray-700">
            <div className="col-span-1">Pick</div>
            <div className="col-span-1">Round</div>
            <div className="col-span-4">Team</div>
            <div className="col-span-1">Seed</div>
            <div className="col-span-2">Region</div>
            <div className="col-span-3">Picked By</div>
          </div>
        </div>

        {/* Picks List */}
        <div className="max-h-96 overflow-y-auto">
          {sortedPicks.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No picks yet. Waiting for draft to begin...
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {sortedPicks.map((pick) => (
                <div
                  key={pick.id}
                  className="grid grid-cols-12 gap-4 px-4 py-3 text-sm hover:bg-gray-50"
                >
                  <div className="col-span-1 font-semibold text-gray-900">
                    {pick.pickOrder}
                  </div>
                  <div className="col-span-1">
                    <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-800">
                      {pick.draftRound}
                    </span>
                  </div>
                  <div className="col-span-4 font-medium text-gray-900">
                    {pick.team.name}
                  </div>
                  <div className="col-span-1">
                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-gray-100 text-xs font-semibold text-gray-800">
                      {pick.team.seedRank}
                    </span>
                  </div>
                  <div className="col-span-2 text-gray-600">
                    {pick.team.region || '-'}
                  </div>
                  <div className="col-span-3 text-gray-600">
                    {pick.user.email}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DraftBoard;

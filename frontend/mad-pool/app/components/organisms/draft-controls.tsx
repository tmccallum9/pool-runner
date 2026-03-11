'use client';

import React, { useState } from 'react';
import { useMutation } from '@apollo/client/react';
import { Button } from '../atoms/button';
import { Heading } from '../atoms/heading';
import { DraftStatus } from '@/app/lib/types';
import {
  RANDOMIZE_DRAFT_ORDER,
  START_DRAFT,
  COMPLETE_DRAFT,
} from '@/app/lib/mutations/pool';

interface DraftControlsProps {
  poolId: string;
  draftStatus: DraftStatus;
  memberCount: number;
  totalPicks: number;
  onUpdate?: () => void;
  className?: string;
}

export const DraftControls: React.FC<DraftControlsProps> = ({
  poolId,
  draftStatus,
  memberCount,
  totalPicks,
  onUpdate,
  className = '',
}) => {
  const [error, setError] = useState<string | null>(null);

  const [randomizeDraftOrder, { loading: randomizing }] = useMutation(
    RANDOMIZE_DRAFT_ORDER,
    {
      onCompleted: () => {
        setError(null);
        onUpdate?.();
      },
      onError: (err) => setError(err.message),
    }
  );

  const [startDraft, { loading: starting }] = useMutation(START_DRAFT, {
    onCompleted: () => {
      setError(null);
      onUpdate?.();
    },
    onError: (err) => setError(err.message),
  });

  const [completeDraft, { loading: completing }] = useMutation(COMPLETE_DRAFT, {
    onCompleted: () => {
      setError(null);
      onUpdate?.();
    },
    onError: (err) => setError(err.message),
  });

  const handleRandomize = () => {
    if (confirm('Randomize draft order for all members?')) {
      randomizeDraftOrder({ variables: { poolId } });
    }
  };

  const handleStartDraft = () => {
    if (confirm('Start the draft? Members will be able to pick teams.')) {
      startDraft({ variables: { poolId } });
    }
  };

  const handleCompleteDraft = () => {
    const expectedPicks = memberCount * 5;
    if (totalPicks < expectedPicks) {
      setError(
        `Cannot complete draft: ${totalPicks}/${expectedPicks} picks made. All members must pick 5 teams.`
      );
      return;
    }

    if (
      confirm(
        'Complete the draft? This will lock all teams and prevent further picks.'
      )
    ) {
      completeDraft({ variables: { poolId } });
    }
  };

  const loading = randomizing || starting || completing;

  return (
    <div className={`rounded-lg border border-gray-200 bg-white p-6 ${className}`}>
      <Heading level={3} className="mb-4">
        Owner Controls
      </Heading>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <div className="space-y-3">
        {/* Randomize Draft Order */}
        {draftStatus === DraftStatus.NOT_STARTED && (
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <p className="font-medium text-gray-900">Randomize Draft Order</p>
              <p className="text-sm text-gray-600">
                Assign random draft positions (1-{memberCount}) to all members
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRandomize}
              disabled={loading || memberCount === 0}
            >
              {randomizing ? 'Randomizing...' : 'Randomize'}
            </Button>
          </div>
        )}

        {/* Start Draft */}
        {draftStatus === DraftStatus.NOT_STARTED && (
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <p className="font-medium text-gray-900">Start Draft</p>
              <p className="text-sm text-gray-600">
                Begin the snake draft - members will pick teams in order
              </p>
            </div>
            <Button
              variant="primary"
              size="sm"
              onClick={handleStartDraft}
              disabled={loading}
            >
              {starting ? 'Starting...' : 'Start Draft'}
            </Button>
          </div>
        )}

        {/* Complete Draft */}
        {draftStatus === DraftStatus.IN_PROGRESS && (
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <p className="font-medium text-gray-900">Complete Draft</p>
              <p className="text-sm text-gray-600">
                Lock all teams and end the draft ({totalPicks}/{memberCount * 5}{' '}
                picks made)
              </p>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleCompleteDraft}
              disabled={loading}
            >
              {completing ? 'Completing...' : 'Complete Draft'}
            </Button>
          </div>
        )}

        {/* Draft Completed Message */}
        {draftStatus === DraftStatus.COMPLETED && (
          <div className="rounded-lg border border-green-200 bg-green-50 p-4">
            <p className="font-medium text-green-900">Draft Completed</p>
            <p className="text-sm text-green-700">
              All teams are locked. Tournament is in progress!
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DraftControls;

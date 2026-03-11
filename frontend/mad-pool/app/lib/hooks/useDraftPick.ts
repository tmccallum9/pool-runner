'use client';

import { useMutation } from '@apollo/client/react';
import { MAKE_DRAFT_PICK } from '../mutations/draft';
import { DraftPick } from '../types';

interface DraftPickData {
  makeDraftPick: {
    draftPick: DraftPick;
  };
}

interface DraftPickVars {
  poolId: string;
  teamId: string;
}

export function useDraftPick(onSuccess?: () => void) {
  const [makeDraftPick, { loading, error, data }] = useMutation<
    DraftPickData,
    DraftPickVars
  >(MAKE_DRAFT_PICK, {
    onCompleted: () => {
      onSuccess?.();
    },
  });

  const draftTeam = async (poolId: string, teamId: string) => {
    try {
      await makeDraftPick({
        variables: {
          poolId,
          teamId,
        },
      });
    } catch (err) {
      // Error is handled by Apollo Client
      console.error('Draft pick error:', err);
    }
  };

  return {
    draftTeam,
    loading,
    error,
    pick: data?.makeDraftPick?.draftPick,
  };
}

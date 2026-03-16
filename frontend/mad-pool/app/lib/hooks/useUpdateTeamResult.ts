'use client';

import { useMutation } from '@apollo/client/react';
import { UPDATE_TEAM_RESULT } from '../mutations/draft';
import { TeamGameResult } from '../types';

interface UpdateTeamResultData {
  updateTeamResult: {
    teamResult: TeamGameResult;
  };
}

interface UpdateTeamResultVars {
  poolId: string;
  teamId: string;
  tournamentRound: number;
  result: 'WON' | 'LOST' | 'NOT_PLAYED';
}

export function useUpdateTeamResult(onSuccess?: () => void) {
  const [updateTeamResult, { loading, error, data }] = useMutation<
    UpdateTeamResultData,
    UpdateTeamResultVars
  >(UPDATE_TEAM_RESULT, {
    onCompleted: () => {
      onSuccess?.();
    },
  });

  const updateResult = async (
    poolId: string,
    teamId: string,
    tournamentRound: number,
    result: 'WON' | 'LOST' | 'NOT_PLAYED'
  ) => {
    try {
      await updateTeamResult({
        variables: {
          poolId,
          teamId,
          tournamentRound,
          result,
        },
        // Refetch queries to update UI
        refetchQueries: ['GetPoolResults', 'GetPoolStandings'],
      });
    } catch (err) {
      // Error is handled by Apollo Client
      console.error('Update team result error:', err);
    }
  };

  return {
    updateResult,
    loading,
    error,
    teamResult: data?.updateTeamResult?.teamResult,
  };
}

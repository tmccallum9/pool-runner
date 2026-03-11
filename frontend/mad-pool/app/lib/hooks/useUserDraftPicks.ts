'use client';

import { useQuery } from '@apollo/client/react';
import { GET_USER_DRAFT_PICKS } from '../queries/teams';
import { DraftPick } from '../types';

interface UserDraftPicksData {
  getUserDraftPicks: DraftPick[];
}

interface UserDraftPicksVars {
  poolId: string;
  userId: string;
}

export function useUserDraftPicks(poolId: string, userId: string) {
  const { data, loading, error, refetch } = useQuery<UserDraftPicksData, UserDraftPicksVars>(
    GET_USER_DRAFT_PICKS,
    {
      variables: { poolId, userId },
      skip: !poolId || !userId,
      fetchPolicy: 'cache-and-network',
    }
  );

  return {
    draftPicks: data?.getUserDraftPicks || [],
    loading,
    error,
    refetch,
  };
}

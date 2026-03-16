'use client';

import { useEffect } from 'react';
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

export function useUserDraftPicks(poolId: string, userId: string, refreshKey = 0) {
  const { data, loading, error, refetch } = useQuery<UserDraftPicksData, UserDraftPicksVars>(
    GET_USER_DRAFT_PICKS,
    {
      variables: { poolId, userId },
      skip: !poolId || !userId,
      fetchPolicy: 'cache-and-network',
    }
  );

  useEffect(() => {
    if (!poolId || !userId || refreshKey === 0) {
      return;
    }

    refetch();
  }, [poolId, refreshKey, refetch, userId]);

  return {
    draftPicks: data?.getUserDraftPicks || [],
    loading,
    error,
    refetch,
  };
}

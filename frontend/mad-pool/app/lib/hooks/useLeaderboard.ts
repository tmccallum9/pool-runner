'use client';

import { useQuery } from '@apollo/client/react';
import { GET_POOL_STANDINGS } from '../queries/pool';
import { PoolMembership } from '../types';
import { useEffect } from 'react';

interface LeaderboardData {
  getPoolStandings: PoolMembership[];
}

interface LeaderboardVars {
  poolId: string;
}

export function useLeaderboard(poolId: string, enablePolling = false) {
  const { data, loading, error, refetch, startPolling, stopPolling } = useQuery<
    LeaderboardData,
    LeaderboardVars
  >(GET_POOL_STANDINGS, {
    variables: { poolId },
    skip: !poolId,
    fetchPolicy: 'cache-and-network',
  });

  // Start/stop polling based on enablePolling prop
  useEffect(() => {
    if (enablePolling && poolId) {
      startPolling(5000); // Poll every 5 seconds
    } else {
      stopPolling();
    }

    return () => {
      stopPolling();
    };
  }, [enablePolling, poolId, startPolling, stopPolling]);

  return {
    standings: data?.getPoolStandings || [],
    loading,
    error,
    refetch,
  };
}

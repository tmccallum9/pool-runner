'use client';

import { useQuery } from '@apollo/client/react';
import { GET_POOL_RESULTS } from '../queries/teams';
import { TeamGameResult } from '../types';

interface PoolResultsData {
  getPoolResults: TeamGameResult[];
}

interface PoolResultsVars {
  poolId: string;
}

export function usePoolResults(poolId: string) {
  const { data, loading, error, refetch } = useQuery<PoolResultsData, PoolResultsVars>(
    GET_POOL_RESULTS,
    {
      variables: { poolId },
      skip: !poolId, // Skip query if no poolId provided
      fetchPolicy: 'cache-and-network', // Get cached data first, then fetch from network
    }
  );

  return {
    results: data?.getPoolResults || [],
    loading,
    error,
    refetch,
  };
}

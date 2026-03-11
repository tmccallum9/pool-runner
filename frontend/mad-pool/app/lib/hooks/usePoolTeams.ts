'use client';

import { useQuery } from '@apollo/client/react';
import { GET_POOL_TEAMS } from '../queries/teams';
import { Team } from '../types';

interface PoolTeamsData {
  getPool: {
    id: string;
    name: string;
    teams: Team[];
  };
}

interface PoolTeamsVars {
  poolId: string;
}

export function usePoolTeams(poolId: string) {
  const { data, loading, error, refetch } = useQuery<PoolTeamsData, PoolTeamsVars>(
    GET_POOL_TEAMS,
    {
      variables: { poolId },
      skip: !poolId, // Skip query if no poolId provided
      fetchPolicy: 'cache-and-network', // Get cached data first, then fetch from network
    }
  );

  return {
    teams: data?.getPool?.teams || [],
    poolName: data?.getPool?.name,
    loading,
    error,
    refetch,
  };
}

'use client';

import { useQuery } from '@apollo/client/react';
import { GET_USER_POOLS } from '../queries/pool';
import { Pool } from '../types';

interface UserPoolsData {
  getUserPools: Pool[];
}

interface UserPoolsVars {
  userId: string;
}

export function useUserPools(userId: string) {
  const { data, loading, error, refetch } = useQuery<UserPoolsData, UserPoolsVars>(
    GET_USER_POOLS,
    {
      variables: { userId },
      skip: !userId,
      fetchPolicy: 'cache-and-network',
    }
  );

  return {
    pools: data?.getUserPools || [],
    loading,
    error,
    refetch,
  };
}

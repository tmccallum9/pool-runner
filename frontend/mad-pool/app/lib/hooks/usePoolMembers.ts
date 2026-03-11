'use client';

import { useQuery } from '@apollo/client/react';
import { GET_POOL_MEMBERS } from '../queries/pool';
import { PoolMembership } from '../types';

interface PoolMembersData {
  getPoolMembers: PoolMembership[];
}

interface PoolMembersVars {
  poolId: string;
}

export function usePoolMembers(poolId: string) {
  // Validate that poolId is a UUID (required by backend)
  const isValidUUID = poolId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(poolId);

  const { data, loading, error, refetch } = useQuery<PoolMembersData, PoolMembersVars>(
    GET_POOL_MEMBERS,
    {
      variables: { poolId },
      skip: !isValidUUID, // Only query if we have a valid UUID
      fetchPolicy: 'cache-and-network',
    }
  );

  return {
    members: data?.getPoolMembers || [],
    loading: !isValidUUID ? false : loading, // Don't show loading if we're skipping
    error,
    refetch,
  };
}

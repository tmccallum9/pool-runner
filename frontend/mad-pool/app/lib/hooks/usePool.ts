'use client';

import { useQuery } from '@apollo/client/react';
import { GET_POOL } from '../queries/pool';
import { Pool } from '../types';

interface PoolData {
  getPool: Pool;
}

interface PoolVars {
  id?: string;
  urlSlug?: string;
}

export function usePool(poolId?: string, urlSlug?: string) {
  // Determine if poolId is a UUID or a URL slug
  // UUIDs have format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx (8-4-4-4-12)
  const isUUID = poolId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(poolId);

  // If poolId looks like a UUID, use it as id; otherwise treat it as urlSlug
  const variables = isUUID
    ? { id: poolId }
    : poolId
    ? { urlSlug: poolId }
    : urlSlug
    ? { urlSlug }
    : {};

  const { data, loading, error, refetch } = useQuery<PoolData, PoolVars>(
    GET_POOL,
    {
      variables,
      skip: !poolId && !urlSlug,
      fetchPolicy: 'cache-and-network',
    }
  );

  return {
    pool: data?.getPool,
    loading,
    error,
    refetch,
  };
}

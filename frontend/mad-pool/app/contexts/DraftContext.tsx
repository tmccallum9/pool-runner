'use client';

import React, { createContext, useContext, useEffect } from 'react';
import { useQuery } from '@apollo/client/react';
import { GET_DRAFT_PICKS, GET_CURRENT_DRAFT_TURN } from '../lib/queries/teams';
import { GET_POOL } from '../lib/queries/pool';
import { DraftPick, PoolMembership, DraftStatus, Pool } from '../lib/types';

interface DraftContextType {
  draftPicks: DraftPick[];
  currentTurn: PoolMembership | null;
  pool: Pool | null;
  loading: boolean;
  error: any;
  refetchDraft: () => void;
}

const DraftContext = createContext<DraftContextType | undefined>(undefined);

interface DraftProviderProps {
  poolId: string;
  children: React.ReactNode;
}

export function DraftProvider({ poolId, children }: DraftProviderProps) {
  // Fetch pool to get draft status
  const {
    data: poolData,
    refetch: refetchPool,
  } = useQuery<{ getPool: Pool }>(GET_POOL, {
    variables: { id: poolId },
    skip: !poolId,
    fetchPolicy: 'cache-and-network',
  });

  const pool = poolData?.getPool;
  const draftStatus = pool?.draftStatus;

  // Fetch draft picks with polling when draft is in progress
  const {
    data: picksData,
    loading: picksLoading,
    error: picksError,
    refetch: refetchPicks,
    startPolling,
    stopPolling,
  } = useQuery<{ getDraftPicks: DraftPick[] }>(GET_DRAFT_PICKS, {
    variables: { poolId },
    skip: !poolId,
    fetchPolicy: 'cache-and-network',
  });

  // Fetch current turn with polling when draft is in progress
  const {
    data: turnData,
    loading: turnLoading,
    error: turnError,
    refetch: refetchTurn,
    startPolling: startTurnPolling,
    stopPolling: stopTurnPolling,
  } = useQuery<{ getCurrentDraftTurn: PoolMembership }>(GET_CURRENT_DRAFT_TURN, {
    variables: { poolId },
    skip: !poolId || draftStatus !== DraftStatus.IN_PROGRESS,
    fetchPolicy: 'cache-and-network',
  });

  // Start/stop polling based on draft status
  useEffect(() => {
    if (draftStatus === DraftStatus.IN_PROGRESS && poolId) {
      // Poll every 3 seconds during active draft
      startPolling(3000);
      startTurnPolling(3000);
    } else {
      stopPolling();
      stopTurnPolling();
    }

    return () => {
      stopPolling();
      stopTurnPolling();
    };
  }, [draftStatus, poolId, startPolling, stopPolling, startTurnPolling, stopTurnPolling]);

  const refetchDraft = () => {
    refetchPool();
    refetchPicks();
    refetchTurn();
  };

  const value: DraftContextType = {
    draftPicks: picksData?.getDraftPicks || [],
    currentTurn: turnData?.getCurrentDraftTurn || null,
    pool: pool || null,
    loading: picksLoading || turnLoading,
    error: picksError || turnError,
    refetchDraft,
  };

  return <DraftContext.Provider value={value}>{children}</DraftContext.Provider>;
}

export function useDraft(): DraftContextType {
  const context = useContext(DraftContext);
  if (context === undefined) {
    throw new Error('useDraft must be used within a DraftProvider');
  }
  return context;
}

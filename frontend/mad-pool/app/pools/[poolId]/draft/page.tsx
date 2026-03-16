'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@apollo/client/react';
import { useParams } from 'next/navigation';
import { Heading } from '@/app/components/atoms/heading';
import { Button } from '@/app/components/atoms/button';
import { DraftBoard } from '@/app/components/organisms/draft-board';
import { DraftTurnIndicator } from '@/app/components/molecules/draft-turn-indicator';
import { UserTeams } from '@/app/components/organisms/user-teams';
import { useAuth } from '@/app/contexts/UserContext';
import { usePool, usePoolMembers, useDraftPick } from '@/app/lib/hooks';
import { DraftPick, PoolMembership, Team, DraftStatus } from '@/app/lib/types';
import { GET_AVAILABLE_TEAMS, GET_CURRENT_DRAFT_TURN, GET_DRAFT_PICKS } from '@/app/lib/queries/teams';

interface DraftPicksData {
  getDraftPicks: DraftPick[];
}

interface CurrentTurnData {
  getCurrentDraftTurn: PoolMembership | null;
}

interface AvailableTeamsData {
  getAvailableTeams: Team[];
}

export default function DraftPage() {
  const params = useParams();
  const poolIdOrSlug = params.poolId as string;
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [userTeamsRefreshKey, setUserTeamsRefreshKey] = useState(0);
  const { pool, loading: poolLoading, refetch: refetchPool } = usePool(poolIdOrSlug);
  const { members, loading: membersLoading, refetch: refetchMembers } = usePoolMembers(pool?.id || '');

  const {
    data: picksData,
    loading: picksLoading,
    refetch: refetchPicks,
  } = useQuery<DraftPicksData>(GET_DRAFT_PICKS, {
    variables: { poolId: pool?.id || '' },
    skip: !pool?.id,
    fetchPolicy: 'cache-and-network',
  });

  const {
    data: turnData,
    loading: turnLoading,
    refetch: refetchTurn,
  } = useQuery<CurrentTurnData>(GET_CURRENT_DRAFT_TURN, {
    variables: { poolId: pool?.id || '' },
    skip: !pool?.id || pool.draftStatus !== DraftStatus.IN_PROGRESS,
    fetchPolicy: 'cache-and-network',
  });

  const {
    data: availableTeamsData,
    loading: teamsLoading,
    refetch: refetchAvailableTeams,
  } = useQuery<AvailableTeamsData>(GET_AVAILABLE_TEAMS, {
    variables: { poolId: pool?.id || '' },
    skip: !pool?.id,
    fetchPolicy: 'cache-and-network',
  });

  const refetchDraftState = async () => {
    const refreshCalls: Promise<any>[] = [refetchPool(), refetchPicks(), refetchAvailableTeams()];

    if (pool?.id) {
      refreshCalls.push(refetchMembers());
    }

    if (pool?.draftStatus === DraftStatus.IN_PROGRESS) {
      refreshCalls.push(refetchTurn());
    }

    await Promise.all(refreshCalls);
    setUserTeamsRefreshKey((current) => current + 1);
  };

  const { draftTeam, loading: drafting, error: draftError } = useDraftPick(refetchDraftState);

  const handleRefresh = async () => {
    setRefreshing(true);

    try {
      await refetchDraftState();
    } finally {
      setRefreshing(false);
    }
  };

  const currentTurn = turnData?.getCurrentDraftTurn || null;
  const draftPicks = picksData?.getDraftPicks || [];
  const availableTeams = availableTeamsData?.getAvailableTeams || [];
  const memberCount = members.length;

  const isMyTurn = currentTurn?.user.id === user?.id;
  const currentMembership = useMemo(
    () => members.find((member) => member.user.id === user?.id),
    [members, user?.id]
  );

  if (poolLoading || membersLoading || picksLoading || turnLoading || teamsLoading || !pool) {
    return <div className="text-gray-600">Loading draft...</div>;
  }

  return (
    <div className="space-y-8">
      <div>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <Heading level={1} className="mb-2">
              Draft Room
            </Heading>
            <p className="text-gray-600">
              {pool.name} • {memberCount} members • {draftPicks.length} total picks
            </p>
          </div>

          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={refreshing || poolLoading || membersLoading || picksLoading || turnLoading || teamsLoading}
          >
            {refreshing ? 'Refreshing...' : 'Refresh Draft'}
          </Button>
        </div>
      </div>

      <DraftTurnIndicator
        currentUserEmail={user?.email || ''}
        draftingUserEmail={currentTurn?.user.email || null}
        isMyTurn={Boolean(isMyTurn)}
        draftPosition={currentTurn?.draftPosition}
      />

      {draftError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-600">{draftError.message}</p>
        </div>
      )}

      {pool.draftStatus !== DraftStatus.IN_PROGRESS && (
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
          <p className="text-sm text-yellow-800">
            The draft is currently <span className="font-semibold">{pool.draftStatus.toLowerCase().replace('_', ' ')}</span>.
            The pool owner must start the draft before picks can be made.
          </p>
        </div>
      )}

      <div className="grid gap-8 xl:grid-cols-[1.7fr_1fr]">
        <DraftBoard draftPicks={draftPicks} totalMembers={memberCount} />

        <div className="space-y-6">
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <Heading level={3} className="mb-4">
              Available Teams
            </Heading>
            <div className="max-h-[32rem] space-y-3 overflow-y-auto pr-1">
              {availableTeams.map((team) => (
                <div
                  key={team.id}
                  className="flex items-center justify-between rounded-lg border border-gray-200 px-4 py-3"
                >
                  <div>
                    <p className="font-medium text-gray-900">{team.name}</p>
                    <p className="text-sm text-gray-600">
                      Seed {team.seedRank} {team.region ? `• ${team.region}` : ''}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => draftTeam(pool.id, team.id)}
                    disabled={!isMyTurn || drafting || pool.draftStatus !== DraftStatus.IN_PROGRESS}
                  >
                    Draft
                  </Button>
                </div>
              ))}

              {availableTeams.length === 0 && (
                <p className="text-sm text-gray-500">No teams remaining.</p>
              )}
            </div>
          </div>

          {user?.id && currentMembership && (
            <div className="rounded-lg border border-gray-200 bg-white p-6">
              <UserTeams
                poolId={pool.id}
                userId={user.id}
                title="Your Picks"
                refreshKey={userTeamsRefreshKey}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/app/contexts/UserContext';
import { usePool, usePoolMembers } from '@/app/lib/hooks';
import { Heading } from '@/app/components/atoms/heading';
import { Button } from '@/app/components/atoms/button';
import { PoolMembersList } from '@/app/components/organisms/pool-members-list';
import { DraftControls } from '@/app/components/organisms/draft-controls';
import { DraftStatus } from '@/app/lib/types';

export default function PoolDashboardPage() {
  const params = useParams();
  const poolIdOrSlug = params.poolId as string;
  const { user } = useAuth();
  const { pool, loading, refetch } = usePool(poolIdOrSlug);

  // Wait for pool to load before fetching members (need the actual UUID)
  const { members, loading: membersLoading } = usePoolMembers(pool?.id || '');

  if (loading || membersLoading || !pool) {
    return null; // Layout handles loading state
  }

  const isOwner = pool.owner.id === user?.id;
  const memberCount = members.length;

  // Calculate total picks made
  const totalPicks = members.reduce(
    (sum, member) => sum + (member.picks?.length || 0),
    0
  );

  // Get pool invitation URL
  const inviteUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/pools/join/${pool.urlSlug}`
      : '';

  const copyInviteLink = () => {
    navigator.clipboard.writeText(inviteUrl);
    alert('Invite link copied to clipboard!');
  };

  return (
    <div className="space-y-8">
      {/* Pool Header */}
      <div>
        <Heading level={1} className="mb-2">
          {pool.name}
        </Heading>
        <p className="text-gray-600">
          Owner: {pool.owner.email} • {memberCount} / {pool.maxMembers} members
        </p>
      </div>

      {/* Invite Link Section */}
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-6">
        <Heading level={3} className="mb-3 text-blue-900">
          Invite Members
        </Heading>
        <p className="mb-4 text-sm text-blue-700">
          Share this link with friends to invite them to your pool:
        </p>
        <div className="flex gap-2">
          <input
            type="text"
            value={inviteUrl}
            readOnly
            className="flex-1 rounded-lg border border-blue-300 bg-white px-3 py-2 text-sm"
          />
          <Button variant="primary" size="sm" onClick={copyInviteLink}>
            Copy Link
          </Button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Link href={`/pools/${pool.id}/draft`}>
          <div className="cursor-pointer rounded-lg border-2 border-gray-200 bg-white p-6 transition-all hover:border-blue-400 hover:shadow-md">
            <div className="mb-2 text-3xl">🏀</div>
            <Heading level={4} className="mb-1">
              Draft Teams
            </Heading>
            <p className="text-sm text-gray-600">
              {pool.draftStatus === DraftStatus.NOT_STARTED &&
                'Waiting to start'}
              {pool.draftStatus === DraftStatus.IN_PROGRESS &&
                'Draft in progress'}
              {pool.draftStatus === DraftStatus.COMPLETED && 'Draft completed'}
            </p>
          </div>
        </Link>

        <Link href={`/pools/${pool.id}/leaderboard`}>
          <div className="cursor-pointer rounded-lg border-2 border-gray-200 bg-white p-6 transition-all hover:border-blue-400 hover:shadow-md">
            <div className="mb-2 text-3xl">🏆</div>
            <Heading level={4} className="mb-1">
              Leaderboard
            </Heading>
            <p className="text-sm text-gray-600">
              View standings and team performance
            </p>
          </div>
        </Link>

        <div className="rounded-lg border-2 border-gray-200 bg-white p-6">
          <div className="mb-2 text-3xl">📊</div>
          <Heading level={4} className="mb-1">
            Draft Progress
          </Heading>
          <p className="text-sm text-gray-600">
            {totalPicks} / {memberCount * 5} picks made
          </p>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-gray-200">
            <div
              className="h-full bg-blue-600 transition-all"
              style={{
                width: `${memberCount > 0 ? (totalPicks / (memberCount * 5)) * 100 : 0}%`,
              }}
            ></div>
          </div>
        </div>
      </div>

      {/* Owner Controls */}
      {isOwner && (
        <DraftControls
          poolId={pool.id}
          draftStatus={pool.draftStatus}
          memberCount={memberCount}
          totalPicks={totalPicks}
          onUpdate={refetch}
        />
      )}

      {/* Pool Members */}
      <PoolMembersList poolId={pool.id} />

      {/* Pool Info */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <Heading level={3} className="mb-4">
          Pool Information
        </Heading>
        <dl className="grid gap-4 md:grid-cols-2">
          <div>
            <dt className="text-sm font-medium text-gray-500">Pool Name</dt>
            <dd className="mt-1 text-sm text-gray-900">{pool.name}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">URL Slug</dt>
            <dd className="mt-1 text-sm text-gray-900">{pool.urlSlug}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Created</dt>
            <dd className="mt-1 text-sm text-gray-900">
              {new Date(pool.createdAt).toLocaleDateString()}
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Draft Status</dt>
            <dd className="mt-1 text-sm text-gray-900">
              {pool.draftStatus.replace('_', ' ')}
            </dd>
          </div>
        </dl>
      </div>
    </div>
  );
}

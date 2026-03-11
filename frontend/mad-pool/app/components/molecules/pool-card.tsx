import React from 'react';
import Link from 'next/link';
import { Heading } from '../atoms/heading';
import { DraftStatus } from '@/app/lib/types';

export interface PoolCardProps {
  id: string;
  name: string;
  draftStatus: DraftStatus;
  memberCount: number;
  maxMembers: number;
  isOwner: boolean;
  className?: string;
}

export const PoolCard: React.FC<PoolCardProps> = ({
  id,
  name,
  draftStatus,
  memberCount,
  maxMembers,
  isOwner,
  className = '',
}) => {
  const statusConfig = {
    [DraftStatus.NOT_STARTED]: {
      label: 'Not Started',
      bgColor: 'bg-gray-100',
      textColor: 'text-gray-800',
      borderColor: 'border-gray-200',
    },
    [DraftStatus.IN_PROGRESS]: {
      label: 'Drafting',
      bgColor: 'bg-blue-100',
      textColor: 'text-blue-800',
      borderColor: 'border-blue-200',
    },
    [DraftStatus.COMPLETED]: {
      label: 'Active',
      bgColor: 'bg-green-100',
      textColor: 'text-green-800',
      borderColor: 'border-green-200',
    },
  };

  const config = statusConfig[draftStatus];

  return (
    <Link href={`/pools/${id}`}>
      <div
        className={`cursor-pointer rounded-lg border-2 bg-white p-6 shadow-sm transition-all hover:border-blue-400 hover:shadow-md ${className}`}
      >
        <div className="mb-4 flex items-start justify-between">
          <div className="flex-1">
            <Heading level={3} className="mb-1 text-xl">
              {name}
            </Heading>
            {isOwner && (
              <span className="inline-block rounded-full bg-purple-100 px-2 py-0.5 text-xs font-semibold text-purple-800">
                Owner
              </span>
            )}
          </div>
          <div
            className={`flex-shrink-0 rounded-full border px-3 py-1 text-xs font-semibold ${config.bgColor} ${config.textColor} ${config.borderColor}`}
          >
            {config.label}
          </div>
        </div>

        <div className="flex items-center gap-4 text-sm text-gray-600">
          <div className="flex items-center gap-1">
            <span className="font-medium">{memberCount}</span>
            <span>/</span>
            <span>{maxMembers}</span>
            <span>members</span>
          </div>

          {draftStatus === DraftStatus.IN_PROGRESS && (
            <div className="flex items-center gap-1 text-blue-600">
              <div className="h-2 w-2 animate-pulse rounded-full bg-blue-600"></div>
              <span className="font-medium">Draft in progress</span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
};

export default PoolCard;

import React from 'react';
import { Heading } from '../atoms/heading';

export type TeamStatus = 'active' | 'eliminated';

export interface TeamCardProps {
  name: string;
  seedRank: number;
  region?: string;
  status: TeamStatus;
  className?: string;
}

export const TeamCard: React.FC<TeamCardProps> = ({
  name,
  seedRank,
  region,
  status,
  className = '',
}) => {
  const statusConfig = {
    active: {
      label: 'Active',
      bgColor: 'bg-green-100',
      textColor: 'text-green-800',
      borderColor: 'border-green-200',
    },
    eliminated: {
      label: 'Eliminated',
      bgColor: 'bg-red-100',
      textColor: 'text-red-800',
      borderColor: 'border-red-200',
    },
  };

  const config = statusConfig[status];

  return (
    <div
      className={`rounded-lg border-2 bg-white p-4 shadow-sm transition-shadow hover:shadow-md ${className}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <Heading level={3} className="mb-1 text-lg">
            {name}
          </Heading>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span className="font-medium">Seed: {seedRank}</span>
            {region && (
              <>
                <span className="text-gray-400">&middot;</span>
                <span>{region}</span>
              </>
            )}
          </div>
        </div>
        <div
          className={`flex-shrink-0 rounded-full border px-3 py-1 text-xs font-semibold ${config.bgColor} ${config.textColor} ${config.borderColor}`}
        >
          {config.label}
        </div>
      </div>
    </div>
  );
};

export default TeamCard;

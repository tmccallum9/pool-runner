import React from 'react';
import { Heading } from '../atoms/heading';

export interface DraftTurnIndicatorProps {
  currentUserEmail: string;
  draftingUserEmail: string | null;
  isMyTurn: boolean;
  draftPosition?: number | null;
  className?: string;
}

export const DraftTurnIndicator: React.FC<DraftTurnIndicatorProps> = ({
  currentUserEmail,
  draftingUserEmail,
  isMyTurn,
  draftPosition,
  className = '',
}) => {
  if (!draftingUserEmail) {
    return (
      <div className={`rounded-lg border border-gray-200 bg-gray-50 p-4 ${className}`}>
        <p className="text-center text-gray-600">Waiting for draft to start...</p>
      </div>
    );
  }

  return (
    <div
      className={`rounded-lg border-2 p-6 ${
        isMyTurn
          ? 'border-green-400 bg-green-50'
          : 'border-blue-200 bg-blue-50'
      } ${className}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          {isMyTurn ? (
            <>
              <Heading level={3} className="mb-1 text-green-900">
                Your Turn!
              </Heading>
              <p className="text-sm text-green-700">
                Select a team from the available teams below
              </p>
            </>
          ) : (
            <>
              <Heading level={4} className="mb-1 text-blue-900">
                Waiting for {draftingUserEmail}
              </Heading>
              <p className="text-sm text-blue-700">
                {draftPosition && `Draft Position: ${draftPosition}`}
              </p>
            </>
          )}
        </div>

        {isMyTurn && (
          <div className="ml-4 flex h-12 w-12 items-center justify-center">
            <span className="relative flex h-10 w-10">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex h-10 w-10 items-center justify-center rounded-full bg-green-500 text-xl">
                ⏰
              </span>
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default DraftTurnIndicator;

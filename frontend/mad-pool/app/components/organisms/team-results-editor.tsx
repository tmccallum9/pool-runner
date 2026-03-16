'use client';

import React, { useState, useEffect } from 'react';
import { Team, TeamGameResult, ResultEnum, getTeamStatus } from '@/app/lib/types';
import { Heading } from '../atoms/heading';
import { Button } from '../atoms/button';
import { useUpdateTeamResult } from '@/app/lib/hooks/useUpdateTeamResult';

interface TeamResultsEditorProps {
  team: Team;
  poolId: string;
  onUpdate?: () => void;
}

interface RoundResult {
  round: number;
  result: ResultEnum;
  pointsAwarded: number;
  resultId?: string;
}

const ROUND_NAMES: Record<number, string> = {
  1: 'Round of 64',
  2: 'Round of 32',
  3: 'Sweet 16',
  4: 'Elite 8',
  5: 'Final 4',
  6: 'Championship',
};

export const TeamResultsEditor: React.FC<TeamResultsEditorProps> = ({
  team,
  poolId,
  onUpdate,
}) => {
  const { updateResult, loading } = useUpdateTeamResult(onUpdate);
  const [roundResults, setRoundResults] = useState<RoundResult[]>([]);
  const teamStatus = getTeamStatus(team.results || []);

  // Initialize round results from team data
  useEffect(() => {
    const results: RoundResult[] = [];
    for (let round = 1; round <= 6; round++) {
      const existingResult = team.results?.find(r => r.tournamentRound === round);
      results.push({
        round,
        result: existingResult?.result || ResultEnum.NOT_PLAYED,
        pointsAwarded: existingResult?.pointsAwarded || 0,
        resultId: existingResult?.id,
      });
    }
    setRoundResults(results);
  }, [team.results]);

  const handleResultChange = async (round: number, result: ResultEnum) => {
    // Check if team is already eliminated
    const previousRounds = roundResults.filter(r => r.round < round);
    const isEliminated = previousRounds.some(r => r.result === ResultEnum.LOST);

    if (isEliminated && result === ResultEnum.WON) {
      alert('Cannot mark team as winning - they are already eliminated');
      return;
    }

    // Update the result
    await updateResult(poolId, team.id, round, result);
  };

  const getResultButtonClass = (currentResult: ResultEnum, buttonResult: ResultEnum) => {
    if (currentResult === buttonResult) {
      switch (buttonResult) {
        case ResultEnum.WON:
          return 'bg-green-600 text-white hover:bg-green-700';
        case ResultEnum.LOST:
          return 'bg-red-600 text-white hover:bg-red-700';
        case ResultEnum.NOT_PLAYED:
          return 'bg-gray-600 text-white hover:bg-gray-700';
      }
    }
    return 'bg-gray-200 text-gray-700 hover:bg-gray-300';
  };

  const calculatePoints = (round: number): number => {
    return team.seedRank + round;
  };

  return (
    <div className="rounded-lg border-2 border-gray-200 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <Heading level={3} className="mb-1">
            {team.name}
          </Heading>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span className="font-medium">Seed: {team.seedRank}</span>
            {team.region && (
              <>
                <span className="text-gray-400">&middot;</span>
                <span>{team.region}</span>
              </>
            )}
          </div>
        </div>
        <div
          className={`rounded-full border px-3 py-1 text-xs font-semibold ${
            teamStatus === 'active'
              ? 'border-green-200 bg-green-100 text-green-800'
              : 'border-red-200 bg-red-100 text-red-800'
          }`}
        >
          {teamStatus === 'active' ? 'Active' : 'Eliminated'}
        </div>
      </div>

      <div className="space-y-3">
        {roundResults.map(({ round, result, pointsAwarded }) => {
          const isPreviousRoundLost = roundResults
            .filter(r => r.round < round)
            .some(r => r.result === ResultEnum.LOST);

          return (
            <div
              key={round}
              className={`rounded-lg border p-4 ${
                isPreviousRoundLost ? 'border-gray-200 bg-gray-50' : 'border-gray-300 bg-white'
              }`}
            >
              <div className="mb-2 flex items-center justify-between">
                <div>
                  <span className="font-medium text-gray-900">{ROUND_NAMES[round]}</span>
                  {result === ResultEnum.WON && (
                    <span className="ml-2 text-sm font-semibold text-green-600">
                      +{pointsAwarded} pts
                    </span>
                  )}
                  {result === ResultEnum.NOT_PLAYED && (
                    <span className="ml-2 text-xs text-gray-500">
                      ({calculatePoints(round)} pts if won)
                    </span>
                  )}
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  size="sm"
                  className={getResultButtonClass(result, ResultEnum.WON)}
                  onClick={() => handleResultChange(round, ResultEnum.WON)}
                  disabled={loading || isPreviousRoundLost}
                >
                  Won
                </Button>
                <Button
                  size="sm"
                  className={getResultButtonClass(result, ResultEnum.LOST)}
                  onClick={() => handleResultChange(round, ResultEnum.LOST)}
                  disabled={loading || isPreviousRoundLost}
                >
                  Lost
                </Button>
                <Button
                  size="sm"
                  className={getResultButtonClass(result, ResultEnum.NOT_PLAYED)}
                  onClick={() => handleResultChange(round, ResultEnum.NOT_PLAYED)}
                  disabled={loading || isPreviousRoundLost}
                >
                  Not Played
                </Button>
              </div>

              {isPreviousRoundLost && (
                <p className="mt-2 text-xs text-gray-500">
                  Team eliminated in previous round
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TeamResultsEditor;

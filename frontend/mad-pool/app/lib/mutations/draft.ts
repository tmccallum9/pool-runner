import { gql } from '@apollo/client';

// Make a draft pick
export const MAKE_DRAFT_PICK = gql`
  mutation MakeDraftPick($poolId: UUID!, $teamId: UUID!) {
    makeDraftPick(poolId: $poolId, teamId: $teamId) {
      draftPick {
        id
        team {
          id
          name
          seedRank
          region
        }
        user {
          id
          email
        }
        draftRound
        pickOrder
        createdAt
      }
    }
  }
`;

// Update team tournament result (owner only)
export const UPDATE_TEAM_RESULT = gql`
  mutation UpdateTeamResult(
    $poolId: UUID!
    $teamId: UUID!
    $tournamentRound: Int!
    $result: ResultEnum!
  ) {
    updateTeamResult(
      poolId: $poolId
      teamId: $teamId
      tournamentRound: $tournamentRound
      result: $result
    ) {
      teamResult {
        id
        team {
          id
          name
        }
        tournamentRound
        result
        pointsAwarded
        updatedAt
      }
    }
  }
`;

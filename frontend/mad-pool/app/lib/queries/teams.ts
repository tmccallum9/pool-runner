import { gql } from '@apollo/client';

// Fragment for Team data
export const TEAM_FRAGMENT = gql`
  fragment TeamData on Team {
    id
    name
    seedRank
    region
    createdAt
    results {
      id
      tournamentRound
      result
      pointsAwarded
      updatedAt
    }
  }
`;

// Get all teams in a pool
export const GET_POOL_TEAMS = gql`
  ${TEAM_FRAGMENT}
  query GetPoolTeams($poolId: UUID!) {
    getPool(id: $poolId) {
      id
      name
      teams {
        ...TeamData
      }
    }
  }
`;

// Get available teams (not yet drafted) in a pool
export const GET_AVAILABLE_TEAMS = gql`
  ${TEAM_FRAGMENT}
  query GetAvailableTeams($poolId: UUID!) {
    getAvailableTeams(poolId: $poolId) {
      ...TeamData
    }
  }
`;

// Get a user's drafted teams in a pool
export const GET_USER_DRAFT_PICKS = gql`
  ${TEAM_FRAGMENT}
  query GetUserDraftPicks($poolId: UUID!, $userId: UUID!) {
    getUserDraftPicks(poolId: $poolId, userId: $userId) {
      id
      team {
        ...TeamData
      }
      draftRound
      pickOrder
      createdAt
    }
  }
`;

// Get all draft picks in a pool (for displaying all drafted teams)
export const GET_DRAFT_PICKS = gql`
  ${TEAM_FRAGMENT}
  query GetDraftPicks($poolId: UUID!) {
    getDraftPicks(poolId: $poolId) {
      id
      team {
        ...TeamData
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
`;

// Get current draft turn for a pool
export const GET_CURRENT_DRAFT_TURN = gql`
  query GetCurrentDraftTurn($poolId: UUID!) {
    getCurrentDraftTurn(poolId: $poolId) {
      id
      draftPosition
      user {
        id
        email
      }
    }
  }
`;

// Get all tournament results for a pool
export const GET_POOL_RESULTS = gql`
  query GetPoolResults($poolId: UUID!) {
    getPoolResults(poolId: $poolId) {
      id
      team {
        id
        name
        seedRank
        region
      }
      tournamentRound
      result
      pointsAwarded
      updatedAt
    }
  }
`;

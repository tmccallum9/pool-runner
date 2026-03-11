import { gql } from '@apollo/client';

// Get a single pool by ID or URL slug
export const GET_POOL = gql`
  query GetPool($id: UUID, $urlSlug: String) {
    getPool(id: $id, urlSlug: $urlSlug) {
      id
      name
      urlSlug
      draftStatus
      maxMembers
      memberCount
      createdAt
      updatedAt
      owner {
        id
        email
      }
    }
  }
`;

// Get all members of a pool with their details
export const GET_POOL_MEMBERS = gql`
  query GetPoolMembers($poolId: UUID!) {
    getPoolMembers(poolId: $poolId) {
      id
      draftPosition
      totalPoints
      user {
        id
        email
      }
      picks {
        id
        team {
          id
          name
          seedRank
        }
        draftRound
      }
      createdAt
    }
  }
`;

// Get all pools that a user is part of (owner or member)
export const GET_USER_POOLS = gql`
  query GetUserPools($userId: UUID!) {
    getUserPools(userId: $userId) {
      id
      name
      urlSlug
      draftStatus
      maxMembers
      memberCount
      owner {
        id
        email
      }
      createdAt
      updatedAt
    }
  }
`;

// Get pool standings (leaderboard)
export const GET_POOL_STANDINGS = gql`
  query GetPoolStandings($poolId: UUID!) {
    getPoolStandings(poolId: $poolId) {
      id
      draftPosition
      totalPoints
      user {
        id
        email
      }
      picks {
        id
        team {
          id
          name
          seedRank
          region
          results {
            id
            tournamentRound
            result
            pointsAwarded
          }
        }
        draftRound
      }
    }
  }
`;

// Get current draft turn
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

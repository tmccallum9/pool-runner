import { gql } from '@apollo/client';

// Create a new pool
export const CREATE_POOL = gql`
  mutation CreatePool($name: String!, $password: String!) {
    createPool(name: $name, password: $password) {
      pool {
        id
        name
        urlSlug
        draftStatus
        maxMembers
        owner {
          id
          email
        }
        createdAt
      }
    }
  }
`;

// Join an existing pool
export const JOIN_POOL = gql`
  mutation JoinPool($urlSlug: String!, $password: String!) {
    joinPool(urlSlug: $urlSlug, password: $password) {
      membership {
        id
        pool {
          id
          name
          urlSlug
          draftStatus
        }
        user {
          id
          email
        }
        draftPosition
        totalPoints
        createdAt
      }
    }
  }
`;

// Randomize draft order for pool members
export const RANDOMIZE_DRAFT_ORDER = gql`
  mutation RandomizeDraftOrder($poolId: UUID!) {
    randomizeDraftOrder(poolId: $poolId) {
      memberships {
        id
        draftPosition
        user {
          id
          email
        }
      }
    }
  }
`;

// Start the draft
export const START_DRAFT = gql`
  mutation StartDraft($poolId: UUID!) {
    startDraft(poolId: $poolId) {
      pool {
        id
        name
        draftStatus
      }
    }
  }
`;

// Complete the draft and lock teams
export const COMPLETE_DRAFT = gql`
  mutation CompleteDraft($poolId: UUID!) {
    completeDraft(poolId: $poolId) {
      pool {
        id
        name
        draftStatus
      }
    }
  }
`;

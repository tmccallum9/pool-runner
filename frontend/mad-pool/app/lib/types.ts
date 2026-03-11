// GraphQL Schema Types based on requirements.md

export type UUID = string;

// Enums
export enum DraftStatus {
  NOT_STARTED = 'NOT_STARTED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
}

export enum ResultEnum {
  WON = 'WON',
  LOST = 'LOST',
  NOT_PLAYED = 'NOT_PLAYED',
}

// User
export interface User {
  id: UUID;
  email: string;
  createdAt: string;
  pools?: Pool[];
}

// Pool
export interface Pool {
  id: UUID;
  name: string;
  urlSlug: string;
  owner: User;
  draftStatus: DraftStatus;
  maxMembers: number;
  memberCount?: number; // Total count of members in the pool
  members?: PoolMembership[]; // Optional - fetch separately with getPoolMembers
  teams?: Team[]; // Optional - fetch separately with getAvailableTeams
  createdAt: string;
  updatedAt?: string;
}

// PoolMembership
export interface PoolMembership {
  id: UUID;
  pool: Pool;
  user: User;
  draftPosition: number | null;
  totalPoints: number;
  picks: DraftPick[];
  createdAt: string;
}

// Team
export interface Team {
  id: UUID;
  name: string;
  seedRank: number;
  region?: string;
  results: TeamGameResult[];
  createdAt: string;
}

// DraftPick
export interface DraftPick {
  id: UUID;
  pool: Pool;
  user: User;
  team: Team;
  draftRound: number;
  pickOrder: number;
  createdAt: string;
}

// TeamGameResult
export interface TeamGameResult {
  id: UUID;
  team: Team;
  tournamentRound: number;
  result: ResultEnum;
  pointsAwarded: number;
  updatedAt: string;
}

// Auth
export interface AuthPayload {
  user: User;
  authToken: string;
}

// Helper type for team status
export type TeamStatus = 'active' | 'eliminated';

// Helper function to determine team status
export function getTeamStatus(results: TeamGameResult[]): TeamStatus {
  if (!results || results.length === 0) {
    return 'active';
  }

  // Check if team has lost any game
  const hasLost = results.some(result => result.result === ResultEnum.LOST);
  return hasLost ? 'eliminated' : 'active';
}

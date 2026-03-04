export interface Team {
  id: number;
  city: string;
  nickname: string;
}

export interface Player {
  name: string;
  position: string;
}

export interface LeagueConfig {
  positions: string[];
  positionMap: Record<string, string[]>;
  live: boolean;
}

export type Roster = Record<string, string>;

export type GameState = 'league-select' | 'spinning' | 'drafting' | 'complete';

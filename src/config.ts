import { LeagueConfig } from './types';

export const LEAGUE_CONFIGS: Record<string, LeagueConfig> = {
  NBA: {
    positions: ['PG', 'SG', 'SF', 'PF', 'C'],
    positionMap: {
      PG: ['G', 'G-F', 'F-G'],
      SG: ['G', 'G-F', 'F-G'],
      SF: ['F', 'G-F', 'F-G', 'F-C', 'C-F'],
      PF: ['F', 'F-C', 'C-F'],
      C: ['C', 'F-C', 'C-F'],
    },
    live: true,
  },
  EPL: {
    positions: ['GK', 'DEF', 'MID1', 'MID2', 'FWD1', 'FWD2'],
    positionMap: {
      GK: ['GK'],
      DEF: ['DEF'],
      MID1: ['MID'],
      MID2: ['MID'],
      FWD1: ['FWD'],
      FWD2: ['FWD'],
    },
    live: true,
  },
  NFL: {
    positions: ['QB', 'RB', 'WR1', 'WR2', 'TE', 'DEF'],
    positionMap: {
      QB: ['QB'],
      RB: ['RB'],
      WR1: ['WR'],
      WR2: ['WR'],
      TE: ['TE'],
      DEF: ['DEF'],
    },
    live: false,
  },
  NHL: {
    positions: ['C', 'F1', 'F2', 'D', 'G'],
    positionMap: {
      C: ['C'],
      F1: ['F', 'W', 'LW', 'RW'],
      F2: ['F', 'W', 'LW', 'RW'],
      D: ['D'],
      G: ['G'],
    },
    live: false,
  },
  MLB: {
    positions: ['P1', 'P2', 'INF1', 'INF2', 'OF1', 'OF2'],
    positionMap: {
      P1: ['P', 'SP', 'RP'],
      P2: ['P', 'SP', 'RP'],
      INF1: ['1B', '2B', '3B', 'SS'],
      INF2: ['1B', '2B', '3B', 'SS'],
      OF1: ['OF', 'LF', 'CF', 'RF'],
      OF2: ['OF', 'LF', 'CF', 'RF'],
    },
    live: false,
  },
};

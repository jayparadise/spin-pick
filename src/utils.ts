import { Player, Roster } from './types';
import { LEAGUE_CONFIGS } from './config';
import { getTeamRoster } from './api';

export function createEmptyRoster(league: string): Roster {
  const positions = LEAGUE_CONFIGS[league].positions;
  return positions.reduce((acc, pos) => {
    acc[pos] = '---';
    return acc;
  }, {} as Roster);
}

export function isRosterComplete(roster: Roster): boolean {
  return Object.values(roster).every((player) => player !== '---');
}

export function filterEligiblePlayers(
  players: Player[],
  position: string,
  league: string
): Player[] {
  const allowedPositions = LEAGUE_CONFIGS[league].positionMap[position] || [];
  return players.filter((player) =>
    allowedPositions.some((pos) => player.position.includes(pos))
  );
}

export async function generateAIDraft(league: string, teams: any[]): Promise<Roster> {
  const positions = LEAGUE_CONFIGS[league].positions;
  const roster: Roster = {};

  for (const pos of positions) {
    let drafted = false;
    let attempts = 0;
    const maxAttempts = 50;

    while (!drafted && attempts < maxAttempts) {
      const randomTeam = teams[Math.floor(Math.random() * teams.length)];
      try {
        const teamRoster = await getTeamRoster(league, randomTeam.id);
        const eligible = filterEligiblePlayers(teamRoster, pos, league);

        if (eligible.length > 0) {
          const randomPlayer = eligible[Math.floor(Math.random() * eligible.length)];
          roster[pos] = randomPlayer.name;
          drafted = true;
        }
      } catch (error) {
        console.error('AI draft error:', error);
      }
      attempts++;
    }

    if (!drafted) {
      roster[pos] = `AI ${pos} Player`;
    }
  }

  return roster;
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

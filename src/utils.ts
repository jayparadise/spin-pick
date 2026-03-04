import { Player, Roster } from './types';
import { LEAGUE_CONFIGS } from './config';
import { getTeamRoster } from './api';
import { getPlayerStats } from './playerStats';

export function createEmptyRoster(league: string): Roster {
  const positions = LEAGUE_CONFIGS[league].positions;
  return positions.reduce((acc, pos) => {
    acc[pos] = '---';
    return acc;
  }, {} as Roster);
}

export function isRosterComplete(roster: Roster): boolean {
  return Object.values(roster).every((player) => {
    if (typeof player === 'string') return player !== '---';
    return player.name !== '---';
  });
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
    const candidatePlayers: Array<{ player: Player; team: any }> = [];

    const randomTeams = teams.sort(() => Math.random() - 0.5).slice(0, 3);

    for (const randomTeam of randomTeams) {
      try {
        const teamRoster = await getTeamRoster(league, randomTeam.id);
        const eligible = filterEligiblePlayers(teamRoster, pos, league);

        for (const player of eligible) {
          candidatePlayers.push({
            player,
            team: randomTeam,
          });
        }
      } catch (error) {
        console.error('AI draft error:', error);
      }
    }

    if (candidatePlayers.length > 0) {
      const playersWithStats = await Promise.all(
        candidatePlayers.map(async (candidate) => {
          const teamName = `${candidate.team.city} ${candidate.team.nickname}`;
          const stats = await getPlayerStats(candidate.player.name, teamName);
          return {
            ...candidate,
            fantasyPoints: stats?.fantasy_points_per_game || 12.0,
          };
        })
      );

      playersWithStats.sort((a, b) => b.fantasyPoints - a.fantasyPoints);

      const topPlayers = playersWithStats.slice(0, 3);
      const selectedCandidate = topPlayers[Math.floor(Math.random() * topPlayers.length)];

      roster[pos] = {
        name: selectedCandidate.player.name,
        team: `${selectedCandidate.team.city} ${selectedCandidate.team.nickname}`
      };
      drafted = true;
    }

    if (!drafted) {
      roster[pos] = { name: `AI ${pos} Player`, team: 'Unknown' };
    }
  }

  return roster;
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

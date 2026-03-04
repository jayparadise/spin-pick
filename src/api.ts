import { Team, Player } from './types';

const NBA_API_BASE = 'https://stats.nba.com/stats';
const FPL_API_BASE = 'https://fantasy.premierleague.com/api';

const NBA_TEAMS_CACHE: Team[] = [
  { id: 1610612737, city: 'Atlanta', nickname: 'Hawks' },
  { id: 1610612738, city: 'Boston', nickname: 'Celtics' },
  { id: 1610612751, city: 'Brooklyn', nickname: 'Nets' },
  { id: 1610612766, city: 'Charlotte', nickname: 'Hornets' },
  { id: 1610612741, city: 'Chicago', nickname: 'Bulls' },
  { id: 1610612739, city: 'Cleveland', nickname: 'Cavaliers' },
  { id: 1610612742, city: 'Dallas', nickname: 'Mavericks' },
  { id: 1610612743, city: 'Denver', nickname: 'Nuggets' },
  { id: 1610612765, city: 'Detroit', nickname: 'Pistons' },
  { id: 1610612744, city: 'Golden State', nickname: 'Warriors' },
  { id: 1610612745, city: 'Houston', nickname: 'Rockets' },
  { id: 1610612754, city: 'Indiana', nickname: 'Pacers' },
  { id: 1610612746, city: 'LA', nickname: 'Clippers' },
  { id: 1610612747, city: 'Los Angeles', nickname: 'Lakers' },
  { id: 1610612763, city: 'Memphis', nickname: 'Grizzlies' },
  { id: 1610612748, city: 'Miami', nickname: 'Heat' },
  { id: 1610612749, city: 'Milwaukee', nickname: 'Bucks' },
  { id: 1610612750, city: 'Minnesota', nickname: 'Timberwolves' },
  { id: 1610612740, city: 'New Orleans', nickname: 'Pelicans' },
  { id: 1610612752, city: 'New York', nickname: 'Knicks' },
  { id: 1610612760, city: 'Oklahoma City', nickname: 'Thunder' },
  { id: 1610612753, city: 'Orlando', nickname: 'Magic' },
  { id: 1610612755, city: 'Philadelphia', nickname: '76ers' },
  { id: 1610612756, city: 'Phoenix', nickname: 'Suns' },
  { id: 1610612757, city: 'Portland', nickname: 'Trail Blazers' },
  { id: 1610612758, city: 'Sacramento', nickname: 'Kings' },
  { id: 1610612759, city: 'San Antonio', nickname: 'Spurs' },
  { id: 1610612761, city: 'Toronto', nickname: 'Raptors' },
  { id: 1610612762, city: 'Utah', nickname: 'Jazz' },
  { id: 1610612764, city: 'Washington', nickname: 'Wizards' },
];

export async function getTeams(league: string): Promise<Team[]> {
  if (league === 'NBA') {
    return NBA_TEAMS_CACHE;
  }

  if (league === 'EPL') {
    try {
      const response = await fetch(`${FPL_API_BASE}/bootstrap-static/`, {
        headers: { 'User-Agent': 'Mozilla/5.0' },
      });
      const data = await response.json();
      return data.teams.map((t: { id: number; short_name: string; name: string }) => ({
        id: t.id,
        city: t.short_name,
        nickname: t.name,
      }));
    } catch (error) {
      console.error('EPL API error:', error);
      return generateMockTeams();
    }
  }

  return generateMockTeams();
}

export async function getTeamRoster(league: string, teamId: number): Promise<Player[]> {
  if (league === 'NBA') {
    return getNBARoster(teamId);
  }

  if (league === 'EPL') {
    return getEPLRoster(teamId);
  }

  return generateMockRoster(league);
}

async function getNBARoster(teamId: number): Promise<Player[]> {
  try {
    const response = await fetch(
      `${NBA_API_BASE}/commonteamroster?Season=2024-25&TeamID=${teamId}`,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0',
          'Referer': 'https://stats.nba.com/',
        },
      }
    );
    const data = await response.json();
    const players = data.resultSets[0].rowSet;
    return players.map((p: string[]) => ({
      name: p[3],
      position: p[4],
    }));
  } catch (error) {
    console.error('NBA API error:', error);
    return generateMockRoster('NBA');
  }
}

async function getEPLRoster(teamId: number): Promise<Player[]> {
  try {
    const response = await fetch(`${FPL_API_BASE}/bootstrap-static/`, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
    });
    const data = await response.json();
    const posMap: Record<number, string> = { 1: 'GK', 2: 'DEF', 3: 'MID', 4: 'FWD' };
    return data.elements
      .filter((p: { team: number }) => p.team === teamId)
      .map((p: { first_name: string; second_name: string; element_type: number }) => ({
        name: `${p.first_name} ${p.second_name}`,
        position: posMap[p.element_type] || 'UNKNOWN',
      }));
  } catch (error) {
    console.error('EPL API error:', error);
    return generateMockRoster('EPL');
  }
}

function generateMockTeams(): Team[] {
  const cities = ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Miami', 'Dallas', 'Boston', 'Seattle'];
  const names = ['Strikers', 'Vipers', 'Knights', 'Titans', 'Spartans', 'Rebels', 'Phantoms', 'Cosmos'];
  return Array.from({ length: 20 }, (_, i) => ({
    id: i + 1,
    city: cities[i % 8],
    nickname: `${names[i % 8]} ${Math.floor(i / 8) + 1}`,
  }));
}

function generateMockRoster(league: string): Player[] {
  const positions: Record<string, string[]> = {
    NBA: ['G', 'G', 'F', 'F', 'C'],
    NFL: ['QB', 'RB', 'WR', 'TE', 'DEF'],
    NHL: ['C', 'F', 'F', 'D', 'G'],
    EPL: ['GK', 'DEF', 'MID', 'FWD'],
    MLB: ['P', '1B', '2B', '3B', 'SS', 'OF'],
  };

  const leaguePositions = positions[league] || ['POS'];
  const roster: Player[] = [];

  leaguePositions.forEach((pos, idx) => {
    for (let i = 1; i <= 3; i++) {
      roster.push({
        name: `Mock ${pos} Player ${idx + i}`,
        position: pos,
      });
    }
  });

  return roster;
}

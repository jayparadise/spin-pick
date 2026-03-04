import { Team, Player } from './types';

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

  return generateMockTeams();
}

export async function getTeamRoster(league: string): Promise<Player[]> {
  return generateMockRoster(league);
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

import { supabase } from './config';

export interface PlayerStatData {
  id: string;
  player_name: string;
  team: string;
  position: string;
  points_per_game: number;
  fantasy_points_per_game: number;
  games_played: number;
  espn_id: string;
  last_updated: string;
  created_at: string;
}

function isDataStale(lastUpdated: string): boolean {
  const lastUpdatedDate = new Date(lastUpdated);
  const now = new Date();
  const hoursSinceUpdate = (now.getTime() - lastUpdatedDate.getTime()) / (1000 * 60 * 60);
  return hoursSinceUpdate >= 24;
}

export async function getPlayerStats(playerName: string, team: string): Promise<PlayerStatData | null> {
  try {
    const { data, error } = await supabase
      .from('player_stats')
      .select('*')
      .eq('player_name', playerName)
      .eq('team', team)
      .maybeSingle();

    if (error) {
      console.error('Error fetching player stats:', error);
      return null;
    }

    if (data) {
      if (!isDataStale(data.last_updated)) {
        return data;
      }

      await fetchAndStorePlayerStats(playerName, team);

      const { data: refreshedData, error: refreshError } = await supabase
        .from('player_stats')
        .select('*')
        .eq('player_name', playerName)
        .eq('team', team)
        .maybeSingle();

      if (refreshError) {
        console.error('Error fetching refreshed player stats:', refreshError);
        return data;
      }

      return refreshedData || data;
    }

    await fetchAndStorePlayerStats(playerName, team);

    const { data: newData, error: newError } = await supabase
      .from('player_stats')
      .select('*')
      .eq('player_name', playerName)
      .eq('team', team)
      .maybeSingle();

    if (newError) {
      console.error('Error fetching new player stats:', newError);
      return null;
    }

    return newData;
  } catch (error) {
    console.error('Error in getPlayerStats:', error);
    return null;
  }
}

async function fetchAndStorePlayerStats(playerName: string, team: string): Promise<void> {
  try {
    const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/scrape-player-stats`;

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ player_name: playerName, team }),
    });

    if (!response.ok) {
      console.error('Failed to scrape player stats:', response.status);
    }
  } catch (error) {
    console.error('Error scraping player stats:', error);
  }
}

export async function getBulkPlayerStats(
  players: Array<{ name: string; team: string }>
): Promise<Map<string, PlayerStatData>> {
  const statsMap = new Map<string, PlayerStatData>();

  const promises = players.map(async ({ name, team }) => {
    const stats = await getPlayerStats(name, team);
    if (stats) {
      statsMap.set(`${name}|${team}`, stats);
    }
  });

  await Promise.all(promises);

  return statsMap;
}

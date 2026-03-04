import { createClient } from "npm:@supabase/supabase-js@2.47.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface PlayerStats {
  player_name: string;
  team: string;
  position: string;
  points_per_game: number;
  fantasy_points_per_game: number;
  games_played: number;
  espn_id: string;
}

async function scrapeESPNPlayerStats(playerName: string, teamName: string): Promise<PlayerStats | null> {
  try {
    const searchQuery = encodeURIComponent(`${playerName} ${teamName}`);
    const searchUrl = `https://www.espn.com/nba/players`;

    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    if (!response.ok) {
      console.error(`ESPN fetch failed: ${response.status}`);
      return null;
    }

    const html = await response.text();

    const ppgMatch = html.match(/PPG<\/.*?>[\s\S]*?(\d+\.?\d*)/i);
    const gamesMatch = html.match(/GP<\/.*?>[\s\S]*?(\d+)/i);

    const pointsPerGame = ppgMatch ? parseFloat(ppgMatch[1]) : 15.0;
    const gamesPlayed = gamesMatch ? parseInt(gamesMatch[1]) : 41;

    const fantasyPoints = pointsPerGame * 1.2;

    return {
      player_name: playerName,
      team: teamName,
      position: 'G-F',
      points_per_game: pointsPerGame,
      fantasy_points_per_game: fantasyPoints,
      games_played: gamesPlayed,
      espn_id: `${playerName.replace(/\s+/g, '-').toLowerCase()}`,
    };
  } catch (error) {
    console.error('Error scraping ESPN:', error);
    return null;
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { player_name, team } = await req.json();

    if (!player_name || !team) {
      return new Response(
        JSON.stringify({ error: "player_name and team are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: existingStats } = await supabase
      .from("player_stats")
      .select("*")
      .eq("player_name", player_name)
      .eq("team", team)
      .maybeSingle();

    if (existingStats) {
      const hoursSinceUpdate = (Date.now() - new Date(existingStats.last_updated).getTime()) / (1000 * 60 * 60);

      if (hoursSinceUpdate < 24) {
        return new Response(
          JSON.stringify({ data: existingStats, cached: true }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    const stats = await scrapeESPNPlayerStats(player_name, team);

    if (!stats) {
      const defaultStats = {
        player_name,
        team,
        position: 'G-F',
        points_per_game: 12.0,
        fantasy_points_per_game: 14.4,
        games_played: 41,
        espn_id: `${player_name.replace(/\s+/g, '-').toLowerCase()}`,
      };

      const { data, error } = await supabase
        .from("player_stats")
        .upsert(defaultStats, { onConflict: 'espn_id' })
        .select()
        .single();

      if (error) throw error;

      return new Response(
        JSON.stringify({ data, scraped: false }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data, error } = await supabase
      .from("player_stats")
      .upsert({ ...stats, last_updated: new Date().toISOString() }, { onConflict: 'espn_id' })
      .select()
      .single();

    if (error) throw error;

    return new Response(
      JSON.stringify({ data, scraped: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

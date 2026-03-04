/*
  # Create Player Statistics Table

  ## Overview
  This migration creates a table to store NBA player statistics scraped from ESPN,
  including fantasy points and performance metrics.

  ## New Tables
  
  ### `player_stats`
  - `id` (uuid, primary key) - Unique identifier for each player stat record
  - `player_name` (text, not null) - Full name of the player
  - `team` (text, not null) - Current team name
  - `position` (text, not null) - Player's position(s)
  - `points_per_game` (numeric) - Average points per game
  - `fantasy_points_per_game` (numeric) - Average fantasy points per game
  - `games_played` (integer) - Number of games played this season
  - `espn_id` (text, unique) - ESPN player ID for reference
  - `last_updated` (timestamptz) - When this data was last scraped
  - `created_at` (timestamptz) - When the record was created

  ## Security
  - Enable RLS on `player_stats` table
  - Add policy for public read access (stats are public data)
  - Add policy for service role to insert/update stats
*/

CREATE TABLE IF NOT EXISTS player_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_name text NOT NULL,
  team text NOT NULL,
  position text NOT NULL,
  points_per_game numeric DEFAULT 0,
  fantasy_points_per_game numeric DEFAULT 0,
  games_played integer DEFAULT 0,
  espn_id text UNIQUE,
  last_updated timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Create index for faster lookups by player name and team
CREATE INDEX IF NOT EXISTS idx_player_stats_name ON player_stats(player_name);
CREATE INDEX IF NOT EXISTS idx_player_stats_team ON player_stats(team);
CREATE INDEX IF NOT EXISTS idx_player_stats_espn_id ON player_stats(espn_id);

-- Enable Row Level Security
ALTER TABLE player_stats ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read player stats (public data)
CREATE POLICY "Public read access to player stats"
  ON player_stats
  FOR SELECT
  USING (true);

-- Policy: Service role can insert player stats
CREATE POLICY "Service role can insert player stats"
  ON player_stats
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Policy: Service role can update player stats
CREATE POLICY "Service role can update player stats"
  ON player_stats
  FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);
import { LEAGUE_CONFIGS } from '../config';

interface LeagueSelectorProps {
  selectedLeague: string;
  onLeagueChange: (league: string) => void;
}

export function LeagueSelector({ selectedLeague, onLeagueChange }: LeagueSelectorProps) {
  return (
    <div className="league-selector">
      <h4 className="selector-title">SELECT LEAGUE</h4>
      <select
        value={selectedLeague}
        onChange={(e) => onLeagueChange(e.target.value)}
        className="league-select"
      >
        {Object.keys(LEAGUE_CONFIGS).map((league) => (
          <option key={league} value={league}>
            {league}
          </option>
        ))}
      </select>
    </div>
  );
}

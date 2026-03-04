import { Roster } from '../types';

interface RosterCardProps {
  roster: Roster;
  title: string;
  isAI?: boolean;
}

export function RosterCard({ roster, title, isAI = false }: RosterCardProps) {
  const cardClass = isAI ? 'roster-card-ai' : 'roster-card';
  const headerClass = isAI ? 'roster-header-ai' : 'roster-header';

  return (
    <div className={cardClass}>
      <div className={headerClass}>{title}</div>
      {Object.entries(roster).map(([pos, player]) => {
        const playerName = typeof player === 'string' ? player : player.name;
        const teamName = typeof player === 'string' ? null : player.team;
        const fantasyScore = typeof player === 'string' ? null : player.fantasyScore;

        return (
          <div key={pos} className="roster-row">
            <span className="pos-label">{pos}</span>
            <div className="player-info">
              <span className="player-name">
                {playerName || '---'}
                {fantasyScore !== null && fantasyScore !== undefined && (
                  <span style={{ color: '#888', marginLeft: '8px', fontSize: '0.9em' }}>
                    ({fantasyScore.toFixed(1)} FPG)
                  </span>
                )}
              </span>
              {teamName && <span className="player-team">{teamName}</span>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

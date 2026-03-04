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
      {Object.entries(roster).map(([pos, player]) => (
        <div key={pos} className="roster-row">
          <span className="pos-label">{pos}</span>
          <span className="player-name">{player || '---'}</span>
        </div>
      ))}
    </div>
  );
}

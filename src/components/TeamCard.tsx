import { Team } from '../types';

interface TeamCardProps {
  team: Team;
  isSpinning?: boolean;
}

export function TeamCard({ team, isSpinning = false }: TeamCardProps) {
  const cardStyle = isSpinning
    ? 'team-card-spinning'
    : 'team-card';

  return (
    <div className={cardStyle}>
      <div className="team-city">{team.city}</div>
      <div className="team-name">{team.nickname}</div>
    </div>
  );
}

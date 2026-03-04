import { useState } from 'react';
import { Team, Player, Roster } from '../types';
import { TeamCard } from './TeamCard';
import { filterEligiblePlayers } from '../utils';

interface DraftInterfaceProps {
  team: Team;
  roster: Roster;
  teamRoster: Player[];
  league: string;
  onDraftPlayer: (position: string, player: string) => void;
  onReSpin: () => void;
}

export function DraftInterface({
  team,
  roster,
  teamRoster,
  league,
  onDraftPlayer,
  onReSpin,
}: DraftInterfaceProps) {
  const availablePositions = Object.entries(roster)
    .filter(([, player]) => player === '---')
    .map(([pos]) => pos);

  const [selectedPosition, setSelectedPosition] = useState(availablePositions[0] || '');
  const [selectedPlayer, setSelectedPlayer] = useState('');

  const eligiblePlayers = selectedPosition
    ? filterEligiblePlayers(teamRoster, selectedPosition, league).sort((a, b) => {
        const scoreA = a.fantasyScore ?? 0;
        const scoreB = b.fantasyScore ?? 0;
        return scoreB - scoreA;
      })
    : [];

  const handleConfirm = () => {
    if (selectedPosition && selectedPlayer) {
      onDraftPlayer(selectedPosition, selectedPlayer);
      setSelectedPosition('');
      setSelectedPlayer('');
    }
  };

  return (
    <div className="draft-interface">
      <TeamCard team={team} />

      {availablePositions.length > 0 && (
        <div className="draft-controls">
          <div className="draft-step">
            <label className="draft-label">1. SELECT POSITION TO FILL</label>
            <select
              value={selectedPosition}
              onChange={(e) => {
                setSelectedPosition(e.target.value);
                setSelectedPlayer('');
              }}
              className="draft-select"
            >
              {availablePositions.map((pos) => (
                <option key={pos} value={pos}>
                  {pos}
                </option>
              ))}
            </select>
          </div>

          {selectedPosition && (
            <>
              {eligiblePlayers.length === 0 ? (
                <div className="no-players-warning">
                  <p>No eligible {selectedPosition}s on this roster!</p>
                  <button onClick={onReSpin} className="btn-secondary">
                    RE-SPIN TEAM
                  </button>
                </div>
              ) : (
                <>
                  <div className="draft-step">
                    <label className="draft-label">2. DRAFT PLAYER</label>
                    <select
                      value={selectedPlayer}
                      onChange={(e) => setSelectedPlayer(e.target.value)}
                      className="draft-select"
                    >
                      <option value="">Select a player...</option>
                      {eligiblePlayers.map((player) => (
                        <option key={player.name} value={player.name}>
                          {player.name}
                          {player.fantasyScore !== undefined
                            ? ` (${player.fantasyScore.toFixed(1)} FPG)`
                            : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  {selectedPlayer && (
                    <button onClick={handleConfirm} className="btn-primary">
                      CONFIRM PICK
                    </button>
                  )}
                </>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

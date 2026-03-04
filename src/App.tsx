import { useState, useEffect } from 'react';
import { Team, Player, Roster, GameState } from './types';
import { LEAGUE_CONFIGS } from './config';
import { getTeams, getTeamRoster } from './api';
import { createEmptyRoster, isRosterComplete, generateAIDraft, sleep } from './utils';
import { getBulkPlayerStats } from './playerStats';
import { LeagueSelector } from './components/LeagueSelector';
import { RosterCard } from './components/RosterCard';
import { TeamCard } from './components/TeamCard';
import { DraftInterface } from './components/DraftInterface';
import './App.css';

function App() {
  const [selectedLeague, setSelectedLeague] = useState('NBA');
  const [gameState, setGameState] = useState<GameState>('league-select');
  const [teams, setTeams] = useState<Team[]>([]);
  const [spunTeam, setSpunTeam] = useState<Team | null>(null);
  const [spinningTeam, setSpinningTeam] = useState<Team | null>(null);
  const [teamRoster, setTeamRoster] = useState<Player[]>([]);
  const [playerRoster, setPlayerRoster] = useState<Roster>(createEmptyRoster('NBA'));
  const [aiRoster, setAiRoster] = useState<Roster>(createEmptyRoster('NBA'));
  const [isLoadingRoster, setIsLoadingRoster] = useState(false);
  const [isDraftingAI, setIsDraftingAI] = useState(false);

  useEffect(() => {
    loadTeams(selectedLeague);
  }, [selectedLeague]);

  useEffect(() => {
    if (isRosterComplete(playerRoster) && !isDraftingAI) {
      performAIDraft();
    }
  }, [playerRoster]);

  async function loadTeams(league: string) {
    const loadedTeams = await getTeams(league);
    setTeams(loadedTeams);
  }

  function handleLeagueChange(league: string) {
    setSelectedLeague(league);
    setPlayerRoster(createEmptyRoster(league));
    setAiRoster(createEmptyRoster(league));
    setSpunTeam(null);
    setTeamRoster([]);
    setGameState('league-select');
    setIsDraftingAI(false);
  }

  async function handleSpin() {
    if (teams.length === 0) return;

    setGameState('spinning');

    for (let i = 0; i < 8; i++) {
      const randomTeam = teams[Math.floor(Math.random() * teams.length)];
      setSpinningTeam(randomTeam);
      await sleep(Math.max(30, i * 15));
    }

    const finalTeam = teams[Math.floor(Math.random() * teams.length)];
    setSpunTeam(finalTeam);
    setSpinningTeam(null);

    setIsLoadingRoster(true);
    const roster = await getTeamRoster(selectedLeague, finalTeam.id);

    const teamName = `${finalTeam.city} ${finalTeam.nickname}`;
    const playerStats = await getBulkPlayerStats(
      roster.map(player => ({ name: player.name, team: teamName }))
    );

    const rosterWithStats = roster.map(player => ({
      ...player,
      fantasyScore: playerStats.get(`${player.name}|${teamName}`)?.fantasy_points_per_game
    }));

    setTeamRoster(rosterWithStats);
    setIsLoadingRoster(false);

    setGameState('drafting');
  }

  function handleDraftPlayer(position: string, player: string) {
    const teamName = spunTeam ? `${spunTeam.city} ${spunTeam.nickname}` : 'Unknown';
    const draftedPlayer = teamRoster.find(p => p.name === player);
    const updatedRoster = {
      ...playerRoster,
      [position]: {
        name: player,
        team: teamName,
        fantasyScore: draftedPlayer?.fantasyScore
      }
    };
    setPlayerRoster(updatedRoster);

    if (isRosterComplete(updatedRoster)) {
      setSpunTeam(null);
      setTeamRoster([]);
    } else {
      setSpunTeam(null);
      setTeamRoster([]);
      setGameState('league-select');
    }
  }

  function handleReSpin() {
    setSpunTeam(null);
    setTeamRoster([]);
    setGameState('league-select');
  }

  async function performAIDraft() {
    setIsDraftingAI(true);
    await sleep(1500);
    const aiDraft = await generateAIDraft(selectedLeague, teams);
    setAiRoster(aiDraft);
    setGameState('complete');
    setIsDraftingAI(false);
  }

  async function handleAutoDraft() {
    if (teams.length === 0) return;

    const positions = LEAGUE_CONFIGS[selectedLeague].positions;
    const newRoster: Roster = {};

    for (const pos of positions) {
      let drafted = false;
      let attempts = 0;

      while (!drafted && attempts < 20) {
        const randomTeam = teams[Math.floor(Math.random() * teams.length)];
        try {
          const roster = await getTeamRoster(selectedLeague, randomTeam.id);
          const eligiblePlayers = roster.filter((player) => {
            const allowedPositions = LEAGUE_CONFIGS[selectedLeague].positionMap[pos] || [];
            return allowedPositions.some((position) => player.position.includes(position));
          });

          if (eligiblePlayers.length > 0) {
            const randomPlayer = eligiblePlayers[Math.floor(Math.random() * eligiblePlayers.length)];
            const teamName = `${randomTeam.city} ${randomTeam.nickname}`;

            const playerStats = await getBulkPlayerStats([{ name: randomPlayer.name, team: teamName }]);
            const fantasyScore = playerStats.get(`${randomPlayer.name}|${teamName}`)?.fantasy_points_per_game;

            newRoster[pos] = {
              name: randomPlayer.name,
              team: teamName,
              fantasyScore
            };
            drafted = true;
          }
        } catch (error) {
          console.error('Auto draft error:', error);
        }
        attempts++;
      }

      if (!drafted) {
        newRoster[pos] = { name: `Auto ${pos} Player`, team: 'Unknown' };
      }
    }

    setPlayerRoster(newRoster);
  }

  function handleNewGame() {
    setPlayerRoster(createEmptyRoster(selectedLeague));
    setAiRoster(createEmptyRoster(selectedLeague));
    setSpunTeam(null);
    setTeamRoster([]);
    setGameState('league-select');
    setIsDraftingAI(false);
  }

  const showLiveDataWarning = !LEAGUE_CONFIGS[selectedLeague].live;

  return (
    <div className="app">
      <div className="container">
        <h1 className="app-title">DRAFT SHOWDOWN</h1>

        {gameState === 'complete' ? (
          <>
            <h3 className="section-title">FINAL MATCHUP</h3>
            <div className="matchup-grid">
              <RosterCard roster={playerRoster} title="PLAYER 1" />
              <RosterCard roster={aiRoster} title="AI OPPONENT" isAI />
            </div>
            <button onClick={handleNewGame} className="btn-primary">
              START NEW MATCHUP
            </button>
          </>
        ) : (
          <>
            <LeagueSelector
              selectedLeague={selectedLeague}
              onLeagueChange={handleLeagueChange}
            />

            {showLiveDataWarning && (
              <div className="warning-banner">
                {selectedLeague} API integration pending. Using Mock Data for UI testing.
              </div>
            )}

            <div className="divider" />

            {isDraftingAI ? (
              <div className="ai-drafting">
                <div className="spinner" />
                <p>AI is analyzing rosters and making its picks...</p>
              </div>
            ) : (
              <>
                <h3 className="section-title">PLAYER 1's DRAFT</h3>
                <RosterCard roster={playerRoster} title="PLAYER 1" />

                {gameState === 'spinning' && spinningTeam && (
                  <TeamCard team={spinningTeam} isSpinning />
                )}

                {gameState === 'drafting' && spunTeam && !isLoadingRoster && (
                  <DraftInterface
                    team={spunTeam}
                    roster={playerRoster}
                    teamRoster={teamRoster}
                    league={selectedLeague}
                    onDraftPlayer={handleDraftPlayer}
                    onReSpin={handleReSpin}
                  />
                )}

                {gameState === 'league-select' && !spunTeam && (
                  <div className="button-group">
                    <button onClick={handleSpin} className="btn-primary btn-spin">
                      SPIN
                    </button>
                    <button onClick={handleAutoDraft} className="btn-secondary">
                      AUTO-DRAFT
                    </button>
                  </div>
                )}

                {isLoadingRoster && (
                  <div className="loading">
                    <div className="spinner" />
                    <p>Loading roster...</p>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default App;

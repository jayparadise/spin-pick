import { useState, useEffect } from 'react';
import { Team, Player, Roster, GameState } from './types';
import { LEAGUE_CONFIGS } from './config';
import { getTeams, getTeamRoster } from './api';
import { createEmptyRoster, isRosterComplete, generateAIDraft, sleep } from './utils';
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

    for (let i = 0; i < 15; i++) {
      const randomTeam = teams[Math.floor(Math.random() * teams.length)];
      setSpinningTeam(randomTeam);
      await sleep(Math.max(50, i * 20));
    }

    const finalTeam = teams[Math.floor(Math.random() * teams.length)];
    setSpunTeam(finalTeam);
    setSpinningTeam(null);

    setIsLoadingRoster(true);
    const roster = await getTeamRoster(selectedLeague, finalTeam.id);
    setTeamRoster(roster);
    setIsLoadingRoster(false);

    setGameState('drafting');
  }

  function handleDraftPlayer(position: string, player: string) {
    const updatedRoster = { ...playerRoster, [position]: player };
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
                  <button onClick={handleSpin} className="btn-primary btn-spin">
                    SPIN
                  </button>
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

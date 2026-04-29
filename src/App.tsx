/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, 
  Trophy, 
  History as HistoryIcon, 
  Plus, 
  Play, 
  UserMinus, 
  UserCheck, 
  Trash2, 
  Coins, 
  CheckCircle2,
  XCircle,
  ArrowRight,
  LayoutDashboard,
  Sword
} from 'lucide-react';

// --- Types ---

interface Player {
  id: string;
  name: string;
  active: boolean;
  wins: number;
  losses: number;
  earnings: number;
}

interface MatchRecord {
  winner: string;
  loser: string;
  score: string;
  stake: number;
  date: string;
}

interface Move {
  id: string;
  player: 'j1' | 'j2';
  points: number;
}

interface CountedOut {
  player: 'j1' | 'j2';
  margin: number;
}

type View = 'players' | 'match' | 'ranking' | 'history';

// --- Main App ---

export default function App() {
  const [activeView, setActiveView] = useState<View>('players');
  const [players, setPlayers] = useState<Player[]>([]);
  const [nameInput, setNameInput] = useState('');
  const [stake, setStake] = useState(1000);
  const [pointsInput, setPointsInput] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentMatch, setCurrentMatch] = useState<{ j1: Player; j2: Player } | null>(null);
  const [scores, setScores] = useState({ j1: 0, j2: 0 });
  const [currentTurn, setCurrentTurn] = useState<'j1' | 'j2'>('j1');
  const [matchMoves, setMatchMoves] = useState<Move[]>([]);
  const [showAudit, setShowAudit] = useState(false);
  const [countedOut, setCountedOut] = useState<CountedOut | null>(null);
  const [currentMatchStake, setCurrentMatchStake] = useState(1000);
  const [showReplayPrompt, setShowReplayPrompt] = useState(false);
  const [lastDrawScores, setLastDrawScores] = useState({ j1: 0, j2: 0 });
  const [rankingSearch, setRankingSearch] = useState('');
  const [archive, setArchive] = useState<MatchRecord[]>([]);
  const [showNextPrompt, setShowNextPrompt] = useState(false);
  const [victoryState, setVictoryState] = useState<{ show: boolean; name: string; winnerId?: string }>({ show: false, name: '' });
  const [currentKingId, setCurrentKingId] = useState<string | null>(null);
  const [showStakePrompt, setShowStakePrompt] = useState(false);
  const [pendingMatchDetails, setPendingMatchDetails] = useState<any>(null);
  const alertIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Load from Local Storage on Mount
  useEffect(() => {
    const savedPlayers = localStorage.getItem('scrabble-players');
    const savedArchive = localStorage.getItem('scrabble-archive');
    if (savedPlayers) {
      const parsed = JSON.parse(savedPlayers);
      setPlayers(parsed);
    }
    if (savedArchive) setArchive(JSON.parse(savedArchive));

    return () => {
      if (alertIntervalRef.current) clearInterval(alertIntervalRef.current);
    };
  }, []);

  // Save to Local Storage
  useEffect(() => {
    localStorage.setItem('scrabble-players', JSON.stringify(players));
    localStorage.setItem('scrabble-archive', JSON.stringify(archive));
  }, [players, archive]);

  const addPlayer = () => {
    if (!nameInput.trim()) return;
    const newPlayer: Player = {
      id: Math.random().toString(36).substr(2, 9),
      name: nameInput.trim(),
      active: true,
      wins: 0,
      losses: 0,
      earnings: 0,
    };
    setPlayers([...players, newPlayer]);
    setNameInput('');
  };

  const removePlayer = (id: string) => {
    setPlayers(players.filter(p => p.id !== id));
  };

  const togglePlayerActive = (id: string) => {
    setPlayers(players.map(p => p.id === id ? { ...p, active: !p.active } : p));
  };

  const startTournament = () => {
    const active = players.filter(p => p.active);
    if (active.length < 2) {
      alert("Pas assez de joueurs actifs (minimum 2)");
      return;
    }
    
    // First match is 0 vs 1
    const j1 = active[0];
    const j2 = active[1];
    
    setPendingMatchDetails({
      j1,
      j2,
      nextIdx: 2 % active.length,
      isInitial: true
    });
    setShowStakePrompt(true);
  };

  const confirmStakeAndStart = (matchStake: number) => {
    if (!pendingMatchDetails) return;
    
    const { j1, j2, nextIdx, isInitial } = pendingMatchDetails;
    
    if (isInitial) {
      setCurrentKingId(null);
    }
    
    setCurrentIndex(nextIdx);
    setCurrentMatch({ j1, j2 });
    setScores({ j1: 0, j2: 0 });
    setCurrentTurn('j1');
    setMatchMoves([]);
    setCountedOut(null);
    setCurrentMatchStake(matchStake);
    
    setActiveView('match');
    setShowNextPrompt(false);
    setShowReplayPrompt(false);
    setVictoryState({ show: false, name: '' });
    setShowStakePrompt(false);
    setPendingMatchDetails(null);
  };

  const setupNextMatch = (index: number, initialStake: number) => {
    const active = players.filter(p => p.active);
    if (active.length < 2) return;

    const j1 = active[index % active.length];
    const j2 = active[(index + 1) % active.length];

    setCurrentMatch({ j1, j2 });
    setScores({ j1: 0, j2: 0 });
    setCurrentTurn('j1');
    setMatchMoves([]);
    setCountedOut(null);
    setCurrentMatchStake(initialStake);
  };

  const endMatchEarly = () => {
    if (!currentMatch) return;
    stopAlertLoop();
    if (scores.j1 === scores.j2) {
      handleDraw(scores);
      return;
    }
    const winner = scores.j1 > scores.j2 ? currentMatch.j1 : currentMatch.j2;
    const loser = scores.j1 > scores.j2 ? currentMatch.j2 : currentMatch.j1;
    endMatch(winner, loser, scores);
  };

  const handleDraw = (finalScores: { j1: number; j2: number }) => {
    stopAlertLoop();
    setLastDrawScores(finalScores);
    setShowReplayPrompt(true);
    // Move currentMatch to a temp state if needed, or just don't null it yet
    // For now, we'll assume the currentMatch was active.
  };

  const replayMatch = (boost: number = 0) => {
    if (!currentMatch) return;
    setShowReplayPrompt(false);
    const newStake = currentMatchStake + boost;
    
    // We keep the same participants
    setScores({ j1: 0, j2: 0 });
    setMatchMoves([]);
    setCurrentMatchStake(newStake);
    setCurrentTurn('j1');
    setCountedOut(null);
  };

  const endAsDraw = () => {
    setShowReplayPrompt(false);
    const record: MatchRecord = {
      winner: 'Nul',
      loser: 'Nul',
      score: `${lastDrawScores.j1}-${lastDrawScores.j2}`,
      stake: 0,
      date: new Date().toLocaleString(),
    };
    setArchive([record, ...archive]);
    setCurrentMatch(null); // Now we clear the match UI
    setShowNextPrompt(true);
  };

  const submitPoints = () => {
    const pts = parseInt(pointsInput);
    if (isNaN(pts)) return;

    const newMove: Move = {
      id: Math.random().toString(36).substr(2, 9),
      player: currentTurn,
      points: pts
    };

    const updatedMoves = [...matchMoves, newMove];
    setMatchMoves(updatedMoves);
    
    // Recalculate scores and turn
    recomputeMatchState(updatedMoves);
    setPointsInput('');
  };

  const updateMove = (moveId: string, newPoints: number) => {
    const updatedMoves = matchMoves.map(m => m.id === moveId ? { ...m, points: newPoints } : m);
    setMatchMoves(updatedMoves);
    recomputeMatchState(updatedMoves);
  };

  const deleteMove = (moveId: string) => {
    const updatedMoves = matchMoves.filter(m => m.id !== moveId);
    setMatchMoves(updatedMoves);
    recomputeMatchState(updatedMoves);
  };

  const stopAlertLoop = () => {
    if (alertIntervalRef.current) {
      clearInterval(alertIntervalRef.current);
      alertIntervalRef.current = null;
    }
  };

  const startAlertLoop = () => {
    if (alertIntervalRef.current) return;
    
    // Use a shared context if possible, but browsers often require user gesture per context
    // We'll create one and keep it alive for the duration of the alert loop
    let audioCtx: AudioContext | null = null;
    
    const playOne = () => {
      try {
        const AudioContextClass = (window as any).AudioContext || (window as any).webkitAudioContext;
        if (!AudioContextClass) return;
        if (!audioCtx || audioCtx.state === 'closed') {
          audioCtx = new AudioContextClass();
        } else if (audioCtx.state === 'suspended') {
          audioCtx.resume();
        }
        
        const ctx = audioCtx!;
        
        const beep = (freq: number, startTime: number, duration: number) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, startTime);
          
          gain.gain.setValueAtTime(0.1, startTime);
          gain.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
          
          osc.connect(gain);
          gain.connect(ctx.destination);
          
          osc.start(startTime);
          osc.stop(startTime + duration);
        };

        // Double beep pattern
        beep(880, ctx.currentTime, 0.1);
        beep(880, ctx.currentTime + 0.2, 0.1);
      } catch (e) {
        console.error("Audio error:", e);
      }
    };

    playOne();
    alertIntervalRef.current = setInterval(playOne, 1200);
  };

  const recomputeMatchState = (moves: Move[]) => {
    const newScores = moves.reduce((acc, m) => {
      acc[m.player] += m.points;
      return acc;
    }, { j1: 0, j2: 0 });

    setScores(newScores);
    
    const diff = Math.abs(newScores.j1 - newScores.j2);
    const leader = newScores.j1 > newScores.j2 ? 'j1' : 'j2';
    const trailer = leader === 'j1' ? 'j2' : 'j1';
    
    // Switch turn
    if (moves.length > 0) {
      const lastPlayer = moves[moves.length - 1].player;
      setCurrentTurn(lastPlayer === 'j1' ? 'j2' : 'j1');
      
      // Handle "Counted Out" Rule
      if (diff >= 150) {
        if (leader === 'j2') {
          // Rule: If J2 leads by 150+, instant win, no alert.
          stopAlertLoop();
          if (currentMatch) endMatch(currentMatch.j2, currentMatch.j1, newScores);
          setCountedOut(null);
          return;
        }

        if (lastPlayer === leader) {
          // Leader (J1) just scored, trailer (J2) is now "counted out"
          setCountedOut({ player: trailer, margin: diff - 150 });
          startAlertLoop();
        } else {
          // Trailer (J1) just played. If gap still >= 150, they lose.
          stopAlertLoop();
          if (currentMatch) endMatch(leader === 'j1' ? currentMatch.j1 : currentMatch.j2, leader === 'j1' ? currentMatch.j2 : currentMatch.j1, newScores);
          setCountedOut(null);
        }
      } else {
        // Gap is closed below 150, normal play continues
        setCountedOut(null);
        stopAlertLoop();
      }
    } else {
      setCurrentTurn('j1');
      setCountedOut(null);
      stopAlertLoop();
    }
  };

  const endMatch = (winner: Player, loser: Player, finalScores: { j1: number; j2: number }) => {
    stopAlertLoop();
    const updatedPlayers = players.map(p => {
      if (p.id === winner.id) return { ...p, wins: p.wins + 1, earnings: p.earnings + currentMatchStake };
      if (p.id === loser.id) return { ...p, losses: p.losses + 1, earnings: p.earnings - currentMatchStake };
      return p;
    });

    setPlayers(updatedPlayers);

    const record: MatchRecord = {
      winner: winner.name,
      loser: loser.name,
      score: `${finalScores.j1}-${finalScores.j2}`,
      stake: currentMatchStake,
      date: new Date().toLocaleString(),
    };
    setArchive([record, ...archive]);
    setVictoryState({ show: true, name: winner.name, winnerId: winner.id });
    setCurrentKingId(winner.id);
    setCurrentMatch(null);
  };

  const handleKingDecision = (continueAsKing: boolean) => {
    if (!continueAsKing) {
      setCurrentKingId(null);
    }
    setVictoryState({ show: false, name: '', winnerId: undefined });
    setShowNextPrompt(true);
  };

  const handleStartNext = () => {
    setShowNextPrompt(false);
    const active = players.filter(p => p.active);
    if (active.length < 2) return;

    let p1: Player, p2: Player;
    let nextIdx = currentIndex;

    if (currentKingId) {
      // Scenario: King (A) stays. They face the next person in list (C).
      const king = active.find(p => p.id === currentKingId);
      if (king) {
        p1 = king;
        
        // Ensure we don't pick the King as their own challenger
        let attempts = 0;
        while (active[nextIdx % active.length].id === currentKingId && attempts < active.length) {
          nextIdx = (nextIdx + 1) % active.length;
          attempts++;
        }
        
        p2 = active[nextIdx % active.length];
        nextIdx = (nextIdx + 1) % active.length;
      } else {
        p1 = active[nextIdx % active.length];
        p2 = active[(nextIdx + 1) % active.length];
        nextIdx = (nextIdx + 2) % active.length;
      }
    } else {
      // Scenario: King leaves (or draw passed). Next two in sequence (C vs D).
      p1 = active[nextIdx % active.length];
      p2 = active[(nextIdx + 1) % active.length];
      nextIdx = (nextIdx + 2) % active.length;
    }

    setPendingMatchDetails({ j1: p1, j2: p2, nextIdx, isInitial: false });
    setShowStakePrompt(true);
  };

  const sortedPlayers = [...players].sort((a, b) => b.earnings - a.earnings);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-primary text-white py-6 px-4 shadow-lg sticky top-0 z-40">
        <div className="max-w-xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Trophy className="w-8 h-8 text-yellow-300" />
            <h1 className="text-xl font-display font-bold tracking-tight">O'Kpêtê</h1>
          </div>
          <div className="flex items-center gap-2 bg-black/10 px-3 py-1 rounded-full text-xs font-bold">
            <Coins className="w-3 h-3 text-yellow-400" />
            <span className="text-white/90">Mise de base: {stake.toLocaleString()} FCFA</span>
          </div>
        </div>
      </header>

      {/* Stake Adjustment Modal */}
      <AnimatePresence>
        {showStakePrompt && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-slate-800 rounded-3xl p-6 w-full max-w-sm shadow-2xl space-y-6"
            >
              <div className="text-center space-y-2">
                <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center text-primary mx-auto">
                  <Coins className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-display font-bold">Prêt pour le match ?</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  {pendingMatchDetails?.j1.name} <span className="text-primary italic">vs</span> {pendingMatchDetails?.j2.name}
                </p>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">Modifier la mise pour ce match</label>
                <div className="relative">
                  <Coins className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 dark:text-slate-500" />
                  <input
                    type="number"
                    value={stake}
                    onChange={(e) => setStake(Number(e.target.value))}
                    className="w-full bg-slate-50 dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-2xl py-4 pl-12 pr-4 font-black text-slate-900 dark:text-slate-100 focus:border-primary focus:ring-0 transition-all text-lg"
                  />
                </div>
              </div>

              <button
                onClick={() => confirmStakeAndStart(stake)}
                className="w-full bg-primary text-white py-4 rounded-2xl font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all"
              >
                Lancer le match
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Main Container */}
      <main className="flex-1 max-w-xl w-full mx-auto p-4 mb-24 overflow-x-hidden">
        <AnimatePresence mode="wait">
          {activeView === 'players' && (
            <PlayersPage 
              players={players}
              nameInput={nameInput}
              setNameInput={setNameInput}
              addPlayer={addPlayer}
              togglePlayerActive={togglePlayerActive}
              removePlayer={removePlayer}
              startTournament={startTournament}
              stake={stake}
              setStake={setStake}
              currentKingId={currentKingId}
            />
          )}

          {activeView === 'match' && (
            <MatchPage 
              currentMatch={currentMatch}
              scores={scores}
              pointsInput={pointsInput}
              setPointsInput={setPointsInput}
              submitPoints={submitPoints}
              currentTurn={currentTurn}
              matchMoves={matchMoves}
              updateMove={updateMove}
              deleteMove={deleteMove}
              countedOut={countedOut}
              endMatchEarly={endMatchEarly}
              showNextPrompt={showNextPrompt}
              handleStartNext={handleStartNext}
              showReplayPrompt={showReplayPrompt}
              replayMatch={replayMatch}
              endAsDraw={endAsDraw}
              lastDrawScores={lastDrawScores}
              currentMatchStake={currentMatchStake}
              showAudit={showAudit}
              setShowAudit={setShowAudit}
              currentKingId={currentKingId}
            />
          )}

          {activeView === 'ranking' && (
            <RankingPage 
              players={players} 
              rankingSearch={rankingSearch}
              setRankingSearch={setRankingSearch}
            />
          )}

          {activeView === 'history' && (
            <HistoryPage archive={archive} />
          )}
        </AnimatePresence>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-2 py-3 z-50 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
        <div className="max-w-xl mx-auto flex justify-around items-center">
          <NavButton 
            active={activeView === 'players'} 
            onClick={() => setActiveView('players')} 
            icon={<Users className="w-6 h-6" />} 
            label="Joueurs" 
          />
          <NavButton 
            active={activeView === 'match'} 
            onClick={() => setActiveView('match')} 
            icon={<Sword className="w-6 h-6" />} 
            label="Match" 
          />
          <NavButton 
            active={activeView === 'ranking'} 
            onClick={() => setActiveView('ranking')} 
            icon={<Trophy className="w-6 h-6" />} 
            label="Gains" 
          />
          <NavButton 
            active={activeView === 'history'} 
            onClick={() => setActiveView('history')} 
            icon={<HistoryIcon className="w-6 h-6" />} 
            label="Historique" 
          />
        </div>
      </nav>

      {/* Victory Overlay */}
      <AnimatePresence>
        {victoryState.show && (
          <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[9999] flex items-center justify-center p-6 text-center">
            <motion.div 
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="bg-white rounded-3xl p-8 shadow-2xl relative overflow-hidden max-w-sm w-full"
            >
              <div className="mb-4 inline-flex items-center justify-center w-20 h-20 bg-yellow-100 rounded-full">
                <Trophy className="w-10 h-10 text-yellow-600" />
              </div>
              <h2 className="text-3xl font-display font-black text-slate-900 mb-2">Victoire !</h2>
              <p className="text-xl text-slate-600 mb-2">
                <span className="text-primary font-bold">{victoryState.name}</span> remporte le match !
              </p>
              <div className="text-sm font-black text-yellow-600 uppercase tracking-widest mb-6 flex items-center justify-center gap-2">
                👑 Demeure Roi de la table
              </div>
              
              <div className="space-y-3">
                <p className="text-slate-500 text-sm font-medium">Voulez-vous poursuivre en tant que Roi ?</p>
                <div className="flex gap-3">
                  <button 
                    onClick={() => handleKingDecision(true)}
                    className="flex-1 bg-primary text-white font-black py-4 rounded-2xl shadow-lg ring-4 ring-primary/20 hover:scale-[1.02] active:scale-95 transition-all text-sm uppercase tracking-widest"
                  >
                    Oui, je reste
                  </button>
                  <button 
                    onClick={() => handleKingDecision(false)}
                    className="flex-1 bg-slate-100 text-slate-600 font-black py-4 rounded-2xl hover:bg-slate-200 transition-all text-sm uppercase tracking-widest"
                  >
                    Non, je passe
                  </button>
                </div>
              </div>

              {[...Array(30)].map((_, i) => (
                <div 
                  key={i}
                  className="confetti"
                  style={{
                    left: `${Math.random() * 100}%`,
                    background: ['#2e7d32', '#ff9800', '#e53935', '#2196f3', '#9c27b0'][Math.floor(Math.random() * 5)],
                    animationDelay: `${Math.random() * 0.5}s`
                  }}
                />
              ))}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// --- Sub-Components ---

function NavButton({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button 
      onClick={onClick}
      className={`flex flex-col items-center gap-1 p-2 min-w-[70px] transition-all relative ${active ? 'text-primary' : 'text-slate-400 hover:text-slate-600'}`}
    >
      {active && (
        <motion.div 
          layoutId="nav-glow"
          className="absolute -top-3 w-8 h-1 bg-primary rounded-full shadow-[0_0_10px_#2e7d32]"
        />
      )}
      {icon}
      <span className="text-[10px] font-bold uppercase tracking-wider">{label}</span>
    </button>
  );
}

const pageTransition = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 },
  transition: { duration: 0.2 }
};

// 1. Players Module
function PlayersPage({ 
  players, nameInput, setNameInput, addPlayer, togglePlayerActive, removePlayer, startTournament, stake, setStake, currentKingId 
}: any) {
  return (
    <motion.div {...pageTransition} className="space-y-6">
      <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Users className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-display">Gestion des Joueurs</h2>
        </div>
        
        <div className="flex gap-2 mb-6">
          <input 
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addPlayer()}
            placeholder="Nom du joueur..."
            className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
          />
          <button 
            onClick={addPlayer}
            className="bg-primary text-white p-2 rounded-xl"
          >
            <Plus className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-2 mb-8 max-h-[40vh] overflow-y-auto pr-1">
          {players.map((p: any) => (
            <motion.div 
              key={p.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100"
            >
              <div className="flex items-center gap-3">
                <span className={`w-2.5 h-2.5 rounded-full ${p.active ? 'bg-green-500 shadow-[0_0_8px_#4caf50]' : 'bg-slate-300'}`} />
                <span className={`font-semibold ${!p.active && 'text-slate-400 line-through'}`}>{p.name}</span>
                {currentKingId === p.id && <span className="text-xs" title="Roi de la table">👑</span>}
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => togglePlayerActive(p.id)} className={`p-1.5 rounded-lg border ${p.active ? 'bg-white text-slate-500' : 'bg-green-50 text-green-600 border-green-200'}`}>
                  {p.active ? <UserMinus className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                </button>
                <button onClick={() => removePlayer(p.id)} className="p-1.5 rounded-lg border bg-white text-red-400 hover:text-red-600">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ))}
          {players.length === 0 && (
            <div className="text-center py-10 text-slate-400 italic text-sm">Prêt à ajouter vos champions ?</div>
          )}
        </div>

        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 mb-6">
          <div className="flex items-center justify-between gap-3 mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Mise de base</span>
            <div className="flex items-center gap-1">
              <input 
                type="number" 
                value={stake}
                onChange={(e) => setStake(parseInt(e.target.value) || 0)}
                className="w-20 text-right font-black text-xl bg-transparent outline-none text-primary"
              />
              <span className="text-[10px] font-bold text-slate-400">FCFA</span>
            </div>
          </div>
          <p className="text-[10px] text-slate-400 text-center leading-relaxed italic">
            Cette mise sera proposée par défaut avant chaque match.
          </p>
        </div>

        <button 
          onClick={startTournament}
          className="w-full flex items-center justify-center gap-2 bg-secondary py-4 rounded-2xl text-white font-black uppercase tracking-widest hover:brightness-105 active:scale-95 transition-all shadow-lg"
        >
          <Play className="w-5 h-5 fill-current" />
          Lancer la Partie
        </button>
      </section>
    </motion.div>
  );
}

interface MatchPageProps {
  currentMatch: { j1: Player; j2: Player } | null;
  scores: { j1: number; j2: number };
  pointsInput: string;
  setPointsInput: (val: string) => void;
  submitPoints: () => void;
  currentTurn: 'j1' | 'j2';
  matchMoves: Move[];
  updateMove: (moveId: string, newPoints: number) => void;
  deleteMove: (moveId: string) => void;
  countedOut: CountedOut | null;
  endMatchEarly: () => void;
  showNextPrompt: boolean;
  handleStartNext: () => void;
  showReplayPrompt: boolean;
  replayMatch: (boost?: number) => void;
  endAsDraw: () => void;
  lastDrawScores: { j1: number; j2: number };
  currentMatchStake: number;
  showAudit: boolean;
  setShowAudit: (val: boolean) => void;
  currentKingId: string | null;
}

// 2. Match Module
function MatchPage({ 
  currentMatch, scores, pointsInput, setPointsInput, submitPoints, currentTurn, matchMoves, updateMove, deleteMove, countedOut, endMatchEarly, showNextPrompt, handleStartNext,
  showReplayPrompt, replayMatch, endAsDraw, lastDrawScores, currentMatchStake, showAudit, setShowAudit, currentKingId
}: MatchPageProps) {
  if (showReplayPrompt) {
    return (
      <motion.div {...pageTransition} className="flex flex-col items-center justify-center py-10 text-center space-y-6">
        <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center text-orange-500">
          <Sword className="w-10 h-10" />
        </div>
        <div className="space-y-2 px-4">
          <h3 className="text-xl font-display font-bold">Match Nul ({lastDrawScores.j1} - {lastDrawScores.j2})</h3>
          <p className="text-sm text-slate-400">Voulez-vous rejouer le match ou accepter le nul ?</p>
        </div>
        <div className="grid grid-cols-1 gap-3 w-full px-6">
          <button 
            onClick={() => replayMatch(currentMatchStake)}
            className="w-full bg-secondary text-white py-4 rounded-2xl font-black uppercase tracking-widest shadow-lg flex items-center justify-center gap-2"
          >
            Rejouer (Mise Double: {currentMatchStake * 2})
          </button>
          <button 
            onClick={() => replayMatch(0)}
            className="w-full bg-primary text-white py-4 rounded-2xl font-black uppercase tracking-widest shadow-lg"
          >
            Rejouer (Mise Normale: {currentMatchStake})
          </button>
          <button 
            onClick={endAsDraw}
            className="w-full bg-slate-200 text-slate-600 py-3 rounded-2xl font-bold uppercase tracking-widest text-xs"
          >
            Passer (Nul - 0 FCFA)
          </button>
        </div>
      </motion.div>
    );
  }

  if (showNextPrompt) {
    return (
      <motion.div {...pageTransition} className="flex flex-col items-center justify-center py-20 text-center space-y-6">
        <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center text-primary">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <div className="space-y-2">
          <h3 className="text-xl font-display font-bold">Match Terminé !</h3>
          <p className="text-sm text-slate-400">Voulez-vous lancer le match suivant ?</p>
        </div>
        <div className="flex gap-4 w-full">
          <button 
            onClick={handleStartNext}
            className="flex-1 bg-primary text-white py-4 rounded-2xl font-black uppercase tracking-widest shadow-lg shadow-primary/20"
          >
            Lancer suivant
          </button>
        </div>
      </motion.div>
    );
  }

  if (!currentMatch) {
    return (
      <motion.div {...pageTransition} className="flex flex-col items-center justify-center py-20 text-center space-y-4">
        <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center text-slate-300">
          <Sword className="w-10 h-10" />
        </div>
        <h3 className="text-lg font-bold text-slate-500">Aucun match actif</h3>
        <p className="text-sm text-slate-400 max-w-[250px]">Allez dans l'onglet "Joueurs" pour démarrer un tournoi.</p>
      </motion.div>
    );
  }

  return (
    <motion.div {...pageTransition} className="space-y-6">
      <section className="bg-white rounded-3xl shadow-xl border-2 border-primary/5 p-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-30" />
        
        <div className="flex items-center justify-between mb-8 px-2">
          <h3 className="text-primary font-black uppercase tracking-widest text-[10px]">Match en cours</h3>
          <button 
            onClick={endMatchEarly}
            className="text-[10px] font-black text-red-400 uppercase tracking-widest hover:text-red-600 transition-colors bg-red-50 px-2 py-1 rounded"
          >
            Terminer le match
          </button>
        </div>

        <AnimatePresence>
          {countedOut && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-6 text-center"
            >
              <div className="flex items-center justify-center gap-2 text-red-600 font-black text-xs uppercase tracking-widest animate-pulse">
                <XCircle className="w-4 h-4" />
                Attention : Joueur {countedOut.player === 'j1' ? '1' : '2'} est compté de {countedOut.margin}
              </div>
              <p className="text-[10px] text-red-400 mt-1 font-bold">
                Réduisez l&apos;écart à moins de 150 points ce tour !
              </p>
            </motion.div>
          )}
        </AnimatePresence>
        
        <div className="flex justify-between items-stretch gap-4 mb-4">
          {/* Player 1 Block */}
          <motion.div 
            animate={currentTurn === 'j1' ? { scale: [1, 1.02, 1], borderColor: '#2e7d32' } : { scale: 1, borderColor: '#f1f5f9' }}
            transition={currentTurn === 'j1' ? { repeat: Infinity, duration: 2 } : {}}
            className={`flex-1 flex flex-col items-center text-center p-4 rounded-2xl border-2 transition-all ${currentTurn === 'j1' ? 'bg-primary/5 border-primary shadow-sm' : 'bg-slate-50 border-slate-100'}`}
          >
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm mb-3 transition-colors ${currentTurn === 'j1' ? 'bg-primary text-white' : 'bg-slate-200 text-slate-500'}`}>
              1
            </div>
            <div className={`text-sm font-black mb-2 line-clamp-1 transition-colors ${currentTurn === 'j1' ? 'text-primary' : 'text-slate-400'}`}>
              {currentMatch.j1.name} {currentKingId === currentMatch.j1.id && '👑'}
            </div>
            <div className={`text-4xl font-display font-black drop-shadow-sm ${currentTurn === 'j1' ? 'text-primary' : 'text-slate-900'}`}>{scores.j1}</div>
          </motion.div>

          <div className="flex flex-col justify-center items-center px-1">
            <div className="font-display font-black text-slate-200 text-xl italic tracking-tighter">VS</div>
          </div>

          {/* Player 2 Block */}
          <motion.div 
            animate={currentTurn === 'j2' ? { scale: [1, 1.02, 1], borderColor: '#4f46e5' } : { scale: 1, borderColor: '#f1f5f9' }}
            transition={currentTurn === 'j2' ? { repeat: Infinity, duration: 2 } : {}}
            className={`flex-1 flex flex-col items-center text-center p-4 rounded-2xl border-2 transition-all ${currentTurn === 'j2' ? 'bg-indigo-50 border-indigo-500 shadow-sm' : 'bg-slate-50 border-slate-100'}`}
          >
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm mb-3 transition-colors ${currentTurn === 'j2' ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-500'}`}>
              2
            </div>
            <div className={`text-sm font-black mb-2 line-clamp-1 transition-colors ${currentTurn === 'j2' ? 'text-indigo-600' : 'text-slate-400'}`}>
              {currentMatch.j2.name} {currentKingId === currentMatch.j2.id && '👑'}
            </div>
            <div className={`text-4xl font-display font-black drop-shadow-sm ${currentTurn === 'j2' ? 'text-indigo-600' : 'text-slate-900'}`}>{scores.j2}</div>
          </motion.div>
        </div>

        {/* Lead Indicator */}
        <div className="text-center mb-8 h-6">
          <AnimatePresence mode="wait">
            {scores.j1 !== scores.j2 ? (
              <motion.div 
                key={scores.j1 > scores.j2 ? 'j1-lead' : 'j2-lead'}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className={`text-[11px] font-bold inline-block px-4 py-1 rounded-full uppercase tracking-widest ${scores.j1 > scores.j2 ? 'text-primary bg-primary/5' : 'text-indigo-600 bg-indigo-50'}`}
              >
                {scores.j1 > scores.j2 ? currentMatch.j1.name : currentMatch.j2.name} mène de {Math.abs(scores.j1 - scores.j2)} points
              </motion.div>
            ) : scores.j1 > 0 ? (
              <motion.div 
                key="draw"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-[11px] font-bold text-slate-400 uppercase tracking-widest"
              >
                Égalité parfaite
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>

        <div className="space-y-4 max-w-xs mx-auto">
          <div className="relative">
            <input 
              type="number" 
              value={pointsInput}
              onChange={(e) => setPointsInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && submitPoints()}
              placeholder="Saisir les points..."
              className={`w-full bg-slate-50 border-2 rounded-2xl px-4 py-4 outline-none text-center text-2xl font-black text-slate-800 transition-all ${currentTurn === 'j1' ? 'border-primary/20 focus:border-primary focus:ring-primary/5' : 'border-indigo-200 focus:border-indigo-500 focus:ring-indigo-500/5'}`}
            />
            <div className={`absolute top-1/2 -translate-y-1/2 right-4 text-[10px] font-black pointer-events-none uppercase tracking-tighter px-2 py-1 rounded-lg ${currentTurn === 'j1' ? 'text-primary bg-primary/10' : 'text-indigo-600 bg-indigo-100'}`}>
              {currentTurn === 'j1' ? 'J1' : 'J2'}
            </div>
          </div>
          
          <button 
            onClick={submitPoints}
            className={`w-full py-4 rounded-2xl text-white font-black uppercase tracking-[0.2em] shadow-lg hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-3 ${currentTurn === 'j1' ? 'bg-primary shadow-primary/20' : 'bg-indigo-600 shadow-indigo-600/20'}`}
          >
            <Plus className="w-5 h-5" />
            Ajouter les points
          </button>
          
          <div className="flex items-center justify-center gap-2 text-[10px] font-bold text-slate-300 uppercase tracking-widest mt-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-green-500/50" />
            Victoire à +150 d&apos;écart
          </div>
        </div>
      </section>

      {/* Match History (Moves) */}
      <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <HistoryIcon className="w-4 h-4 text-slate-400" />
            <h3 className="text-sm font-display font-bold uppercase tracking-widest text-slate-500">Historique des coups</h3>
          </div>
          <button 
            onClick={() => setShowAudit(!showAudit)}
            className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest transition-all ${showAudit ? 'bg-primary text-white' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}
          >
            {showAudit ? 'Masquer Audit' : 'Audit'}
          </button>
        </div>

        <AnimatePresence>
          {showAudit && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1 pt-2">
                {[...matchMoves].reverse().map((m, i) => {
                  const actualIndex = matchMoves.length - i;
                  // Calculate player-specific move count
                  const playerMovesUpToNow = matchMoves.slice(0, actualIndex).filter(prev => prev.player === m.player).length;
                  
                  return (
                    <MoveItem 
                      key={m.id} 
                      move={m} 
                      number={playerMovesUpToNow}
                      playerName={m.player === 'j1' ? currentMatch.j1.name : currentMatch.j2.name}
                      onUpdate={(val: number) => updateMove(m.id, val)}
                      onDelete={() => deleteMove(m.id)}
                    />
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {!showAudit && matchMoves.length > 0 && (
          <div className="text-center py-2 text-slate-300 text-[10px] font-bold uppercase tracking-widest italic">
            Cliquez sur Audit pour voir les {matchMoves.length} coups
          </div>
        )}

        {!showAudit && matchMoves.length === 0 && (
          <div className="text-center py-6 text-slate-300 text-xs italic">Saisissez les premiers points...</div>
        )}
      </section>
    </motion.div>
  );
}

interface MoveItemProps {
  key?: string | number;
  move: Move;
  number: number;
  playerName: string;
  onUpdate: (val: number) => void;
  onDelete: () => void;
}

function MoveItem({ move, number, playerName, onUpdate, onDelete }: MoveItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [val, setVal] = useState(move.points.toString());

  const handleUpdate = () => {
    const n = parseInt(val);
    if (!isNaN(n)) onUpdate(n);
    setIsEditing(false);
  };

  const isJ1 = move.player === 'j1';

  return (
    <motion.div 
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 10 }}
      className={`flex items-center justify-between p-3 rounded-xl border transition-colors ${isJ1 ? 'bg-primary/[0.02] border-primary/10' : 'bg-indigo-50/30 border-indigo-100'}`}
    >
      <div className="flex items-center gap-3 min-w-0">
        <span className={`text-[9px] font-black w-12 flex-shrink-0 tracking-tighter ${isJ1 ? 'text-primary/40' : 'text-indigo-300'}`}>COUP {number}</span>
        <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${isJ1 ? 'bg-primary' : 'bg-indigo-500'}`} />
        <span className={`text-xs font-bold truncate max-w-[100px] ${isJ1 ? 'text-slate-700' : 'text-indigo-900'}`}>{playerName}</span>
      </div>

      <div className="flex items-center gap-4">
        {isEditing ? (
          <div className="flex items-center gap-1">
            <input 
              autoFocus
              type="number"
              value={val}
              onChange={(e) => setVal(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleUpdate()}
              className={`w-16 bg-white border rounded px-1 text-right text-xs font-black outline-none ${isJ1 ? 'border-primary/30' : 'border-indigo-300'}`}
            />
            <button onClick={handleUpdate} className="text-green-500 p-1 hover:bg-green-50 rounded"><CheckCircle2 className="w-3 h-3" /></button>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <span className={`text-sm font-black ${isJ1 ? 'text-primary' : 'text-indigo-600'}`}>+{move.points}</span>
            <div className="flex items-center gap-1">
              <button onClick={() => setIsEditing(true)} className="p-1 px-2 text-[10px] font-bold text-slate-400 hover:text-primary transition-colors hover:bg-white rounded">Edit</button>
              <button onClick={onDelete} className="p-1 text-slate-300 hover:text-red-500 transition-colors"><Trash2 className="w-3 h-3" /></button>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// 3. Ranking Module
function RankingPage({ players, rankingSearch, setRankingSearch }: { players: Player[], rankingSearch: string, setRankingSearch: (val: string) => void }) {
  const sortedPlayers = [...players]
    .filter(p => p.name.toLowerCase().includes(rankingSearch.toLowerCase()))
    .sort((a, b) => b.earnings - a.earnings);

  return (
    <motion.div {...pageTransition} className="space-y-6">
      <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <LayoutDashboard className="w-5 h-5 text-yellow-500" />
            <h2 className="text-xl font-display lowercase first-letter:uppercase">Le Tableau des Gains</h2>
          </div>
          <span className="bg-yellow-50 text-yellow-700 text-[10px] font-black px-2 py-1 rounded-full uppercase tracking-widest leading-none">
            {players.length} Joueurs
          </span>
        </div>

        {/* Search Bar */}
        <div className="relative mb-6">
          <input 
            type="text"
            value={rankingSearch}
            onChange={(e) => setRankingSearch(e.target.value)}
            placeholder="Rechercher un joueur..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/10 transition-all font-medium"
          />
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            <Users className="w-4 h-4" />
          </div>
          {rankingSearch && (
            <button 
              onClick={() => setRankingSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400 uppercase tracking-tighter hover:text-slate-600"
            >
              Effacer
            </button>
          )}
        </div>
        
        <div className="space-y-4">
          {sortedPlayers.map((p, i) => (
            <motion.div 
              key={p.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`group relative flex items-center gap-4 p-4 rounded-2xl border transition-all shadow-sm ${
                i === 0 && !rankingSearch ? 'bg-yellow-50/50 border-yellow-200 ring-4 ring-yellow-50' : 'bg-slate-50 border-slate-100 hover:border-primary/20 hover:bg-white'
              }`}
            >
              <div className={`w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-xl font-black text-sm shadow-sm ${
                i === 0 && !rankingSearch ? 'bg-yellow-400 text-white' : 
                i === 1 && !rankingSearch ? 'bg-slate-300 text-white' :
                i === 2 && !rankingSearch ? 'bg-orange-300 text-white' : 'bg-white text-slate-300'
              }`}>
                {i + 1}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-slate-900 text-lg truncate flex items-center gap-2">
                  {p.name}
                  {i === 0 && p.earnings > 0 && !rankingSearch && <span className="inline-block w-2 h-2 bg-green-500 rounded-full animate-pulse" />}
                </div>
                <div className="flex items-center gap-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  <span className="flex items-center gap-1"><Trophy className="w-2.5 h-2.5 text-green-500" /> {p.wins} W</span>
                  <span className="flex items-center gap-1"><XCircle className="w-2.5 h-2.5 text-red-400" /> {p.losses} L</span>
                </div>
              </div>
              <div className="text-right">
                <div className={`text-xl font-display font-black leading-tight ${p.earnings >= 0 ? 'text-primary' : 'text-red-500'}`}>
                  {p.earnings > 0 ? '+' : ''}{p.earnings.toLocaleString()}
                </div>
                <div className="text-[9px] font-black text-slate-300 uppercase tracking-widest">FCFA</div>
              </div>
            </motion.div>
          ))}
          {sortedPlayers.length === 0 && (
            <div className="text-center py-20 text-slate-300 space-y-4">
              <Trophy className="w-12 h-12 mx-auto stroke-slate-200" />
              <p className="font-medium">{rankingSearch ? "Aucun joueur ne correspond à votre recherche" : "Pas encore de compétition."}</p>
            </div>
          )}
        </div>
      </section>
    </motion.div>
  );
}

// 4. History Module
function HistoryPage({ archive }: any) {
  return (
    <motion.div {...pageTransition} className="space-y-6">
      <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center gap-2 mb-6">
          <HistoryIcon className="w-5 h-5 text-slate-400" />
          <h2 className="text-xl font-display">Archives des Duels</h2>
        </div>
        
        <div className="space-y-4">
          {archive.map((a: any, i: number) => (
            <div key={i} className="group border-l-4 border-primary/20 pl-4 py-3 relative bg-slate-50/50 rounded-r-xl transition-all hover:bg-white hover:shadow-md border border-slate-100">
              <div className="flex items-center justify-between text-[10px] text-slate-400 font-black mb-2 uppercase tracking-widest">
                <span>{a.date}</span>
                <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-full">{a.stake} FCFA</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 flex-wrap min-w-0 pr-4">
                  <span className="font-black text-slate-900 truncate max-w-[100px]">{a.winner}</span>
                  <div className="bg-green-100 p-0.5 rounded shadow-sm text-green-600">
                    <CheckCircle2 className="w-3 h-3" />
                  </div>
                  <ArrowRight className="w-3 h-3 text-slate-300" />
                  <span className="text-slate-400 text-sm italic truncate max-w-[100px] opacity-70">{a.loser}</span>
                </div>
                <div className="font-display font-black text-primary text-xl tracking-tighter whitespace-nowrap">
                  {a.score}
                </div>
              </div>
            </div>
          ))}
          {archive.length === 0 && (
            <div className="text-center py-20 text-slate-300 italic">L&apos;histoire s&apos;écrit maintenant...</div>
          )}
        </div>
      </section>
    </motion.div>
  );
}

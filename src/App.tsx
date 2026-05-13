/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  Sword,
  Download,
  Archive,
  Info,
  Copy,
  Check,
  Edit3,
  Volume2,
  VolumeX
} from 'lucide-react';

// --- Types ---

type Role = 'Joueur' | 'Admin';

interface Player {
  id: string;
  name: string;
  role: Role;
  active: boolean;
  wins: number;
  losses: number;
  earnings: number;
  createdAt: string;
}

interface ExternalBet {
  id: string;
  betterAId: string;
  betterBId: string;
  amount: number;
  betOnPlayerId: string;
}

interface MatchRecord {
  id: string;
  winnerId: string | 'draw';
  loserId: string | 'draw';
  winner: string;
  loser: string;
  score: string;
  stake: number;
  date: string;
  externalBets: ExternalBet[];
  arbiterId?: string;
}

interface SessionRecord {
  id: string;
  name: string;
  date: string;
  players: Player[];
  archive: MatchRecord[];
}

interface Move {
  id: string;
  player: 'j1' | 'j2';
  points: number;
  timestamp?: string;
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
  const [sessions, setSessions] = useState<SessionRecord[]>([]);
  const [showNextPrompt, setShowNextPrompt] = useState(false);
  const [victoryState, setVictoryState] = useState<{ show: boolean; name: string; winnerId?: string }>({ show: false, name: '' });
  const [currentKingId, setCurrentKingId] = useState<string | null>(null);
  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false);
  const [showStakePrompt, setShowStakePrompt] = useState(false);
  const [currentExternalBets, setCurrentExternalBets] = useState<ExternalBet[]>([]);
  const [pendingExternalBets, setPendingExternalBets] = useState<ExternalBet[]>([]);
  const [pendingMatchDetails, setPendingMatchDetails] = useState<any>(null);
  const [pendingEndMatch, setPendingEndMatch] = useState<{ winner: Player; loser: Player; scores: { j1: number; j2: number } } | null>(null);
  const [showWorkflowModal, setShowWorkflowModal] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(true);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);

  // Load from Local Storage on Mount
  useEffect(() => {
    const savedPlayers = localStorage.getItem('okpete-players');
    const savedArchive = localStorage.getItem('okpete-archive');
    const savedSessions = localStorage.getItem('okpete-sessions');
    const savedActiveView = localStorage.getItem('okpete-active-view');
    const savedCurrentMatch = localStorage.getItem('okpete-current-match');
    const savedScores = localStorage.getItem('okpete-scores');
    const savedMatchMoves = localStorage.getItem('okpete-match-moves');
    const savedCurrentIndex = localStorage.getItem('okpete-current-index');
    const savedStake = localStorage.getItem('okpete-current-match-stake');
    const savedExternalBets = localStorage.getItem('okpete-current-external-bets');
    const savedPendingMatch = localStorage.getItem('okpete-pending-match');
    const savedPendingEndMatch = localStorage.getItem('okpete-pending-end-match');
    const savedKingId = localStorage.getItem('okpete-current-king-id');
    const savedVoice = localStorage.getItem('okpete-voice-enabled');

    if (savedPlayers) {
      try {
        const parsed = JSON.parse(savedPlayers);
        if (Array.isArray(parsed)) {
          const migration = parsed.map((p: any) => ({
            id: p.id || Math.random().toString(36).substr(2, 9),
            name: p.name || 'Joueur',
            active: p.active ?? true,
            wins: p.wins ?? 0,
            losses: p.losses ?? 0,
            earnings: p.earnings ?? 0,
            createdAt: p.createdAt || new Date().toISOString()
          }));
          setPlayers(migration);
        }
      } catch (e) {
        console.error("Failed to parse players", e);
        setPlayers([]);
      }
    }
    if (savedArchive) setArchive(JSON.parse(savedArchive));
    if (savedSessions) setSessions(JSON.parse(savedSessions));
    if (savedActiveView) setActiveView(savedActiveView as any);
    if (savedCurrentMatch) setCurrentMatch(JSON.parse(savedCurrentMatch));
    if (savedScores) setScores(JSON.parse(savedScores));
    if (savedMatchMoves) setMatchMoves(JSON.parse(savedMatchMoves));
    if (savedCurrentIndex) setCurrentIndex(parseInt(savedCurrentIndex));
    if (savedStake) setCurrentMatchStake(parseInt(savedStake));
    if (savedExternalBets) setCurrentExternalBets(JSON.parse(savedExternalBets));
    if (savedPendingMatch) setPendingMatchDetails(JSON.parse(savedPendingMatch));
    if (savedPendingEndMatch) setPendingEndMatch(JSON.parse(savedPendingEndMatch));
    if (savedKingId && savedKingId !== 'null') setCurrentKingId(savedKingId);
    if (savedVoice !== null) setIsVoiceEnabled(savedVoice === 'true');

    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  // Save to Local Storage
  useEffect(() => {
    localStorage.setItem('okpete-players', JSON.stringify(players));
    localStorage.setItem('okpete-archive', JSON.stringify(archive));
    localStorage.setItem('okpete-sessions', JSON.stringify(sessions));
    localStorage.setItem('okpete-active-view', activeView);
    localStorage.setItem('okpete-current-match', JSON.stringify(currentMatch));
    localStorage.setItem('okpete-scores', JSON.stringify(scores));
    localStorage.setItem('okpete-match-moves', JSON.stringify(matchMoves));
    localStorage.setItem('okpete-current-index', currentIndex.toString());
    localStorage.setItem('okpete-current-match-stake', currentMatchStake.toString());
    localStorage.setItem('okpete-current-external-bets', JSON.stringify(currentExternalBets));
    localStorage.setItem('okpete-pending-match', JSON.stringify(pendingMatchDetails));
    localStorage.setItem('okpete-pending-end-match', JSON.stringify(pendingEndMatch));
    localStorage.setItem('okpete-current-king-id', currentKingId || 'null');
    localStorage.setItem('okpete-voice-enabled', isVoiceEnabled.toString());
  }, [players, archive, sessions, activeView, currentMatch, scores, matchMoves, currentIndex, currentMatchStake, currentExternalBets, pendingMatchDetails, currentKingId, isVoiceEnabled, pendingEndMatch]);

  const addPlayer = () => {
    if (!nameInput.trim()) return;
    const newPlayer: Player = {
      id: Math.random().toString(36).substr(2, 9),
      name: nameInput.trim(),
      role: 'Joueur',
      active: true,
      wins: 0,
      losses: 0,
      earnings: 0,
      createdAt: new Date().toISOString()
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

  const startTournament = (forceNew: boolean = false) => {
    const active = players.filter(p => p.active);
    if (active.length < 2) {
      alert("Pas assez de joueurs actifs (minimum 2)");
      return;
    }

    const hasData = archive.length > 0 || players.some(p => p.earnings !== 0);
    
    if (hasData && forceNew) {
      setShowArchiveConfirm(true);
      return;
    }
    
    // Normal start or resume - if match exists, just go there
    if (currentMatch && !forceNew) {
      setActiveView('match');
      return;
    }

    const j1 = active[0];
    const j2 = active[1];
    
    setPendingExternalBets([]);
    setPendingMatchDetails({
      j1,
      j2,
      nextIdx: 2 % active.length,
      isInitial: true
    });
    setShowStakePrompt(true);
  };

  const confirmArchiveAndNew = () => {
    const newSession: SessionRecord = {
      id: Math.random().toString(36).substr(2, 9),
      name: `Session ${sessions.length + 1}`,
      date: new Date().toLocaleString(),
      players: [...players],
      archive: [...archive]
    };
    
    setSessions([newSession, ...sessions]);
    setArchive([]);
    
    // Reset all player stats but keep the players list
    const resetPlayers = players.map(p => ({
      ...p,
      wins: 0,
      losses: 0,
      earnings: 0
    }));
    
    setPlayers(resetPlayers);
    setCurrentIndex(0);
    setCurrentKingId(null);
    setCurrentMatch(null);
    setPendingMatchDetails(null);
    setShowArchiveConfirm(false);
    setActiveView('players'); // Stay on players page to allow management
  };

  const deleteSession = (id: string) => {
    if (confirm("Supprimer cette archive définitivement ?")) {
      setSessions(sessions.filter(s => s.id !== id));
    }
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
    setCurrentExternalBets([...pendingExternalBets]);
    
    setActiveView('match');
    setShowNextPrompt(false);
    setShowReplayPrompt(false);
    setVictoryState({ show: false, name: '' });
    setShowStakePrompt(false);
    setPendingMatchDetails(null);
  };

  const handleInstallApp = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstallable(false);
    }
    setDeferredPrompt(null);
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
    if (scores.j1 === scores.j2) {
      handleDraw(scores);
      return;
    }
    const winner = scores.j1 > scores.j2 ? currentMatch.j1 : currentMatch.j2;
    const loser = scores.j1 > scores.j2 ? currentMatch.j2 : currentMatch.j1;
    setPendingEndMatch({ winner, loser, scores });
  };

  const handleDraw = (finalScores: { j1: number; j2: number }) => {
    setLastDrawScores(finalScores);
    setShowReplayPrompt(true);
  };

  const replayMatch = (boost: number = 0) => {
    if (!currentMatch) return;
    
    const newStake = currentMatchStake + boost;
    setShowReplayPrompt(false);
    
    setScores({ j1: 0, j2: 0 });
    setMatchMoves([]);
    setCurrentMatchStake(newStake);
    setCurrentTurn('j1');
    setCountedOut(null);
  };

  const endAsDraw = () => {
    setShowReplayPrompt(false);
    // Already refunded in handleDraw, so we just clear bets and record.
    
    const savedBets = [...currentExternalBets];
    setCurrentExternalBets([]);

    const record: MatchRecord = {
      id: Math.random().toString(36).substr(2, 9),
      winnerId: 'draw',
      loserId: 'draw',
      winner: 'Nul',
      loser: 'Nul',
      score: `${lastDrawScores.j1}-${lastDrawScores.j2}`,
      stake: 0,
      date: new Date().toLocaleString(),
      externalBets: [],
      arbiterId: 'system'
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
      points: pts,
      timestamp: new Date().toISOString()
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
          if (currentMatch) setPendingEndMatch({ winner: currentMatch.j2, loser: currentMatch.j1, scores: newScores });
          setCountedOut(null);
          return;
        }

        if (lastPlayer === leader) {
          // Leader (J1) just scored, trailer (J2) is now "counted out"
          setCountedOut({ player: trailer, margin: diff - 150 });
        } else {
          // Trailer (J1) just played. If gap still >= 150, they lose.
          if (currentMatch) {
            const winner = leader === 'j1' ? currentMatch.j1 : currentMatch.j2;
            const loser = leader === 'j1' ? currentMatch.j2 : currentMatch.j1;
            setPendingEndMatch({ winner, loser, scores: newScores });
          }
          setCountedOut(null);
        }
      } else {
        // Gap is closed below 150, normal play continues
        setCountedOut(null);
      }
    } else {
      setCurrentTurn('j1');
      setCountedOut(null);
    }
  };

  const endMatch = (winner: Player, loser: Player, finalScores: { j1: number; j2: number }) => {
    const updatedPlayers = players.map(p => {
      let earnings = p.earnings;
      let wins = p.wins;
      let losses = p.losses;

      // Match result
      if (p.id === winner.id) {
        wins += 1;
        earnings += currentMatchStake; // Recrée la logique "Gagne la mise"
      }
      if (p.id === loser.id) {
        losses += 1;
        earnings -= currentMatchStake; // "Perd sa mise"
      }

      // Resolve external bets
      currentExternalBets.forEach(bet => {
        const isBetterAWinner = bet.betOnPlayerId === winner.id;
        
        if (p.id === bet.betterAId) {
          earnings += isBetterAWinner ? bet.amount : -bet.amount;
        } else if (p.id === bet.betterBId) {
          earnings += !isBetterAWinner ? bet.amount : -bet.amount;
        }
      });

      return { 
        ...p, 
        wins, 
        losses, 
        earnings
      };
    });

    setPlayers(updatedPlayers);
    setCurrentExternalBets([]); // Reset bets

    const record: MatchRecord = {
      id: Math.random().toString(36).substr(2, 9),
      winnerId: winner.id,
      loserId: loser.id,
      winner: winner.name,
      loser: loser.name,
      score: `${finalScores.j1}-${finalScores.j2}`,
      stake: currentMatchStake,
      date: new Date().toLocaleString(),
      externalBets: [...currentExternalBets]
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

    setPendingExternalBets([]);
    setPendingMatchDetails({ j1: p1, j2: p2, nextIdx, isInitial: false });
    setShowStakePrompt(true);
  };

  const workflowText = `
WORKFLOW COMPLET - O'KPÊTÊ (SCRABBLE & PARIS)

1. GESTION DES JOUEURS
- Ajoutez des joueurs pour la session.
- Seuls les joueurs "Actifs" participent aux rotations de matchs.

2. LANCEMENT DU MATCH & MISES
- Le système propose un match entre deux joueurs selon une file d'attente circulaire.
- Avant le début, vous validez la mise du match.
- Duel de Paris Extérieurs : Les spectateurs peuvent parier entre eux sur l'un des deux joueurs. Le perdant du pari paie le gagnant.

3. DÉROULEMENT DU MATCH
- Saisissez les points à chaque tour. Le score se met à jour en temps réel.
- Règle du 'Counted Out' (Sursis) :
  • Si J1 mène de 150 points ou plus, J2 entre en sursis (Alerte sonore).
  • Si J2 ne réduit pas l'écart en dessous de 150 lors de son tour, il perd par KO (pas d'autre tour).
  • Si J2 mène de 150 points ou plus, il gagne immédiatement par KO.

4. GESTION DU MATCH NUL
- En cas de match nul (scores identiques en fin de partie) :
  • Aucun gain ni perte n'est comptabilisé.
- Les joueurs ont le choix :
  • Rejouer : Relance le match (avec possibilité de booster la mise).
  • Terminer sur un nul : Le match est archivé sans vainqueur.

5. VICTOIRE ET ROI (KING)
- Le gagnant remporte la mise (+ mise du match) et l'adversaire la perd.
- Le gagnant devient le "ROI" (👑).
- Le Roi a le privilège de rester pour le match suivant ou de passer son tour.
- S'il reste, il affronte le prochain challenger.

6. ARCHIVAGE ET SESSIONS
- Tous les matchs sont enregistrés dans l'Historique.
- Vous pouvez archiver une session complète pour repartir à zéro.
`.trim();

  const copyToClipboard = () => {
    navigator.clipboard.writeText(workflowText);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-primary text-white py-6 px-4 shadow-lg sticky top-0 z-40">
        <div className="max-w-xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Trophy className="w-8 h-8 text-yellow-300" />
            <h1 className="text-xl font-display font-bold tracking-tight">O'Kpêtê</h1>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setShowWorkflowModal(true)}
              className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-all text-white/80 hover:text-white"
              title="Workflow & Règles"
            >
              <Info className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 bg-black/10 px-3 py-1 rounded-full text-xs font-bold">
              <Coins className="w-3 h-3 text-yellow-400" />
              <span className="text-white/90">Mise: {stake.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Archive Confirmation Modal */}
      <AnimatePresence>
        {showArchiveConfirm && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-slate-800 rounded-3xl p-6 w-full max-w-sm shadow-2xl space-y-6"
            >
              <div className="text-center space-y-2">
                <div className="w-16 h-16 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center text-red-500 mx-auto">
                  <Archive className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-display font-bold">Nouvelle session ?</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  La session actuelle sera archivée et tous les scores seront remis à zéro.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-3">
                <button
                  onClick={confirmArchiveAndNew}
                  className="w-full bg-red-500 text-white py-4 rounded-2xl font-black uppercase tracking-widest shadow-lg shadow-red-500/20"
                >
                  Confirmer et archiver
                </button>
                <button
                  onClick={() => setShowArchiveConfirm(false)}
                  className="w-full bg-slate-100 text-slate-600 py-3 rounded-2xl font-bold uppercase tracking-widest text-xs"
                >
                  Annuler
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Stake Adjustment Modal */}
      <AnimatePresence>
        {showStakePrompt && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-slate-800 rounded-3xl p-6 w-full max-w-sm shadow-2xl space-y-6 my-auto"
            >
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center text-primary mx-auto">
                  <Coins className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-display font-bold">Prêt pour le match ?</h3>
                
                <div className="grid grid-cols-1 gap-4 text-left">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">Joueur 1 (Local)</label>
                    <select 
                      value={pendingMatchDetails?.j1.id}
                      onChange={(e) => {
                        const newJ1 = players.find(p => p.id === e.target.value);
                        if (newJ1) {
                          setPendingMatchDetails({ ...pendingMatchDetails, j1: newJ1 });
                        }
                      }}
                      className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl py-3 px-4 font-bold text-slate-700 outline-none focus:border-primary transition-all"
                    >
                      {players.filter(p => p.active).map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">Joueur 2 (Challenger)</label>
                    <select 
                      value={pendingMatchDetails?.j2.id}
                      onChange={(e) => {
                        const newJ2 = players.find(p => p.id === e.target.value);
                        if (newJ2) {
                          setPendingMatchDetails({ ...pendingMatchDetails, j2: newJ2 });
                        }
                      }}
                      className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl py-3 px-4 font-bold text-slate-700 outline-none focus:border-primary transition-all"
                    >
                      {players.filter(p => p.active).map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">Mise du match (FCFA)</label>
                <div className="relative">
                  <Coins className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="number"
                    value={stake}
                    onChange={(e) => setStake(Number(e.target.value))}
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-4 pl-12 pr-4 font-black text-slate-900 focus:border-primary focus:ring-0 transition-all text-lg"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between px-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Duels de Paris</label>
                  <button 
                    onClick={() => {
                      const activePlayers = players.filter(p => p.active);
                      if (activePlayers.length < 2) return;
                      const newBet: ExternalBet = {
                        id: Math.random().toString(36).substr(2, 9),
                        betterAId: activePlayers[0].id,
                        betterBId: activePlayers[1].id,
                        amount: 500,
                        betOnPlayerId: pendingMatchDetails?.j1.id || ''
                      };
                      setPendingExternalBets([...pendingExternalBets, newBet]);
                    }}
                    className="flex items-center gap-1 bg-primary/10 text-primary px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-primary hover:text-white transition-all shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5" /> Ajouter un Duel
                  </button>
                </div>

                <div className="space-y-3 max-h-40 overflow-y-auto pr-1">
                  {pendingExternalBets.map((bet, idx) => (
                    <div key={bet.id} className="bg-slate-50 border border-slate-100 rounded-2xl p-4 space-y-4 relative group">
                      <button 
                        onClick={() => setPendingExternalBets(pendingExternalBets.filter((_, i) => i !== idx))}
                        className="absolute right-3 top-3 p-2 text-slate-300 hover:text-red-500 transition-all rounded-full hover:bg-red-50"
                        title="Supprimer ce pari"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Parieur A</label>
                          <select 
                            value={bet.betterAId}
                            onChange={(e) => {
                              const newBets = [...pendingExternalBets];
                              newBets[idx].betterAId = e.target.value;
                              setPendingExternalBets(newBets);
                            }}
                            className="w-full bg-white border border-slate-200 rounded-xl py-2 px-2 font-bold text-slate-700 text-[10px] outline-none"
                          >
                            {players.filter(p => p.active).map(p => (
                              <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Parieur B</label>
                          <select 
                            value={bet.betterBId}
                            onChange={(e) => {
                              const newBets = [...pendingExternalBets];
                              newBets[idx].betterBId = e.target.value;
                              setPendingExternalBets(newBets);
                            }}
                            className="w-full bg-white border border-slate-200 rounded-xl py-2 px-2 font-bold text-slate-700 text-[10px] outline-none"
                          >
                            {players.filter(p => p.active).map(p => (
                              <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Soutien</label>
                          <select 
                            value={bet.betOnPlayerId}
                            onChange={(e) => {
                              const newBets = [...pendingExternalBets];
                              newBets[idx].betOnPlayerId = e.target.value;
                              setPendingExternalBets(newBets);
                            }}
                            className="w-full bg-white border border-slate-200 rounded-xl py-2 px-2 font-bold text-slate-700 text-[10px] outline-none"
                          >
                            <option value={pendingMatchDetails?.j1.id}>{pendingMatchDetails?.j1.name} (J1)</option>
                            <option value={pendingMatchDetails?.j2.id}>{pendingMatchDetails?.j2.name} (J2)</option>
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Mise Duel</label>
                          <input 
                            type="number"
                            value={bet.amount}
                            onChange={(e) => {
                              const newBets = [...pendingExternalBets];
                              newBets[idx].amount = Number(e.target.value);
                              setPendingExternalBets(newBets);
                            }}
                            className="w-full bg-white border border-slate-200 rounded-xl py-2 px-2 font-bold text-slate-700 text-[10px] outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  ))}

                  {pendingExternalBets.length === 0 && (
                    <div className="text-center py-6 border-2 border-dashed border-slate-100 rounded-2xl">
                      <p className="text-[9px] font-black text-slate-300 uppercase tracking-tighter">Aucun duel en attente</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-2">
                <button
                  onClick={() => confirmStakeAndStart(stake)}
                  disabled={pendingMatchDetails?.j1.id === pendingMatchDetails?.j2.id}
                  className="w-full bg-primary text-white py-4 rounded-2xl font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  {pendingMatchDetails?.j1.id === pendingMatchDetails?.j2.id ? "Choisir 2 joueurs différents" : "Confirmer et Lancer"}
                </button>
                <button 
                  onClick={() => {
                    setShowStakePrompt(false);
                    setPendingExternalBets([]);
                  }}
                  className="w-full bg-slate-100 text-slate-500 py-3 rounded-2xl font-bold uppercase tracking-widest text-[10px]"
                >
                  Annuler
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Main Container */}
      <main className="flex-1 max-w-2xl w-full mx-auto p-4 overflow-x-hidden md:py-8">
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
              isInstallable={isInstallable}
              handleInstallApp={handleInstallApp}
              archive={archive}
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
              setCurrentMatchStake={setCurrentMatchStake}
              showAudit={showAudit}
              setShowAudit={setShowAudit}
              currentKingId={currentKingId}
              currentExternalBets={currentExternalBets}
              players={players}
              isVoiceEnabled={isVoiceEnabled}
              setIsVoiceEnabled={setIsVoiceEnabled}
              pendingEndMatch={pendingEndMatch}
              onFinalizeMatch={() => {
                if (!currentMatch) return;
                const winner = scores.j1 > scores.j2 ? currentMatch.j1 : currentMatch.j2;
                const loser = scores.j1 > scores.j2 ? currentMatch.j2 : currentMatch.j1;
                
                if (scores.j1 === scores.j2) {
                  handleDraw(scores);
                } else {
                  endMatch(winner, loser, scores);
                }
                setPendingEndMatch(null);
                setShowAudit(false);
              }}
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
            <HistoryPage 
              archive={archive} 
              sessions={sessions} 
              onDeleteSession={deleteSession}
              players={players}
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showWorkflowModal && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
              <motion.div 
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                className="bg-white dark:bg-slate-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
              >
                <div className="bg-primary p-6 text-white flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Info className="w-6 h-6" />
                    <h3 className="text-xl font-display font-bold">Guide & Workflow</h3>
                  </div>
                  <button 
                    onClick={copyToClipboard}
                    className="flex items-center gap-2 bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all"
                  >
                    {copySuccess ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    {copySuccess ? 'Copié !' : 'Copier'}
                  </button>
                </div>
                
                <div className="p-6 overflow-y-auto space-y-6">
                  <div className="prose prose-slate prose-sm max-w-none text-slate-600 dark:text-slate-300">
                    <div className="space-y-4">
                      <section>
                        <h4 className="flex items-center gap-2 text-slate-900 dark:text-white font-black uppercase text-xs tracking-widest">
                          <Users className="w-4 h-4 text-primary" /> 1. Gestion des Joueurs
                        </h4>
                        <p className="pl-6 text-sm leading-relaxed">
                          Ajoutez vos joueurs pour la session. Seuls les joueurs <strong>Actifs</strong> sont sélectionnés pour les matchs.
                        </p>
                      </section>

                      <section>
                        <h4 className="flex items-center gap-2 text-slate-900 dark:text-white font-black uppercase text-xs tracking-widest">
                          <Coins className="w-4 h-4 text-primary" /> 2. Mises & Gains
                        </h4>
                        <p className="pl-6 text-sm leading-relaxed">
                          La mise du match est définie au début. Le gagnant remporte la mise (+{stake}) et le perdant la perd (-{stake}). Aucun portefeuille n'est nécessaire, on suit les gains nets.
                        </p>
                      </section>

                      <section>
                        <h4 className="flex items-center gap-2 text-slate-900 dark:text-white font-black uppercase text-xs tracking-widest">
                          <Sword className="w-4 h-4 text-primary" /> 3. Règle du Sursis (150 pts)
                        </h4>
                        <p className="pl-6 text-sm leading-relaxed">
                          Un écart de 150 points déclenche une alerte. Si le poursuivant ne recolle pas au score lors de son tour, le match se termine par KO technique (Défense impossible).
                        </p>
                      </section>

                      <section className="bg-orange-50 dark:bg-orange-900/10 p-4 rounded-xl border border-orange-100 dark:border-orange-900/20">
                        <h4 className="flex items-center gap-2 text-orange-700 dark:text-orange-400 font-black uppercase text-xs tracking-widest">
                          <XCircle className="w-4 h-4" /> 4. Cas de Match Nul
                        </h4>
                        <p className="text-sm leading-relaxed text-orange-800/80 dark:text-orange-300/80 mt-2">
                          <strong>Remboursement Total :</strong> En cas de nul, toutes les mises (joueurs) et les paris (extérieurs) sont instantanément recrédités. Vous pouvez ensuite choisir de rejouer immédiatement.
                        </p>
                      </section>

                      <section>
                        <h4 className="flex items-center gap-2 text-slate-900 dark:text-white font-black uppercase text-xs tracking-widest">
                          <Trophy className="w-4 h-4 text-primary" /> 5. Le Trône (Le Roi)
                        </h4>
                        <p className="pl-6 text-sm leading-relaxed">
                          Le gagnant devient le <strong>Roi</strong>. Il peut choisir de rester pour affronter le challenger suivant ou de passer sa place.
                        </p>
                      </section>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800">
                  <button
                    onClick={() => setShowWorkflowModal(false)}
                    className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 py-3 rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg"
                  >
                    Fermer
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        <footer className="py-12 pb-32 text-center">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
            made by Evariste GNONSKAN
          </p>
        </footer>
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
            icon={<LayoutDashboard className="w-6 h-6" />} 
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
  players, nameInput, setNameInput, addPlayer, togglePlayerActive, removePlayer, startTournament, stake, setStake, currentKingId,
  isInstallable, handleInstallApp, archive
}: any) {
  const hasCurrentSessionData = archive.length > 0 || players.some((p: any) => p.earnings !== 0);

  return (
    <motion.div {...pageTransition} className="space-y-6">
      {isInstallable && (
        <section className="bg-gradient-to-r from-primary to-green-600 rounded-2xl p-6 text-white shadow-lg shadow-primary/20">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
              <Download className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-lg leading-tight text-white">Installer l&apos;application</h3>
              <p className="text-white/80 text-xs">Accédez à O&apos;Kpêtê plus rapidement et hors-ligne.</p>
            </div>
            <button 
              onClick={handleInstallApp}
              className="bg-white text-primary font-black px-4 py-2 rounded-xl text-xs uppercase tracking-widest shadow-sm hover:scale-105 transition-all"
            >
              Installer
            </button>
          </div>
        </section>
      )}
      <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Users className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-display">Gestion des Joueurs</h2>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2 mb-6">
          <input 
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addPlayer()}
            placeholder="Nom du joueur..."
            className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary/20 transition-all font-black text-slate-800 text-sm sm:text-base"
          />
          <button 
            onClick={addPlayer}
            className="bg-primary text-white py-3 px-6 sm:px-4 rounded-xl shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2 shrink-0"
          >
            <Plus className="w-5 h-5 sm:w-6 sm:h-6" />
            <span className="sm:hidden font-black uppercase text-xs tracking-widest">Ajouter un joueur</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-8 max-h-[60vh] overflow-y-auto pr-1">
          {players.map((p: any) => (
            <motion.div 
              key={p.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-4 bg-white rounded-2xl border transition-all flex flex-col justify-between gap-3 shadow-sm hover:border-primary/20 ${p.active ? 'border-slate-100' : 'border-slate-100 opacity-50 grayscale'}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-[10px] ${p.active ? 'bg-primary text-white' : 'bg-slate-200 text-slate-500'}`}>
                    {(p.name || '').substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="text-xs font-black text-slate-800 flex items-center gap-2">
                       {p.name || 'Sans nom'}
                       {currentKingId === p.id && <span className="text-[10px]">👑</span>}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-1.5">
                  <button onClick={() => togglePlayerActive(p.id)} className={`p-1.5 rounded-lg transition-all ${p.active ? 'bg-slate-50 text-slate-400 border border-slate-100' : 'bg-green-50 text-green-600 border border-green-200'}`}>
                    {p.active ? <UserMinus className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                  </button>
                  <button onClick={() => removePlayer(p.id)} className="p-1.5 rounded-lg bg-slate-50 text-red-300 hover:text-red-500 border border-slate-100 transition-all">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-2">
                <div className="bg-slate-50 rounded-xl p-2 border border-slate-100">
                   <div className="text-[7px] font-black text-slate-400 uppercase mb-0.5">Gains Totaux</div>
                   <div className={`text-[10px] font-black ${(p.earnings ?? 0) >= 0 ? 'text-green-600' : 'text-red-500'}`}>{(p.earnings ?? 0).toLocaleString()} FCFA</div>
                </div>
              </div>
            </motion.div>
          ))}
          {players.length === 0 && (
            <div className="text-center py-10 text-slate-400 italic text-sm">Prêt à ajouter vos champions ?</div>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 mb-8">
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
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
            <p className="text-[9px] text-slate-400 leading-relaxed italic">
              Proposée par défaut avant chaque match.
            </p>
          </div>
        </div>

        <div className={`grid gap-3 ${hasCurrentSessionData ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'}`}>
          {hasCurrentSessionData && (
            <button 
              onClick={() => startTournament(false)}
              className="flex items-center justify-center gap-2 bg-secondary py-4 rounded-2xl text-white font-black uppercase tracking-widest hover:brightness-105 active:scale-95 transition-all shadow-lg"
            >
              <Play className="w-5 h-5 fill-current" />
              Reprendre
            </button>
          )}

          <button 
            onClick={() => startTournament(hasCurrentSessionData)}
            className={`flex items-center justify-center gap-2 py-4 rounded-2xl text-white font-black uppercase tracking-widest hover:brightness-105 active:scale-95 transition-all shadow-lg ${hasCurrentSessionData ? 'bg-indigo-600' : 'bg-secondary'}`}
          >
            {hasCurrentSessionData ? <Plus className="w-5 h-5" /> : <Play className="w-5 h-5 fill-current" />}
            {hasCurrentSessionData ? 'Nouvelle Session' : 'Lancer la Partie'}
          </button>
        </div>
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
  setCurrentMatchStake: (stake: number) => void;
  showAudit: boolean;
  setShowAudit: (val: boolean) => void;
  currentKingId: string | null;
  currentExternalBets: ExternalBet[];
  players: Player[];
  isVoiceEnabled: boolean;
  setIsVoiceEnabled: (val: boolean) => void;
  pendingEndMatch: { winner: Player; loser: Player; scores: { j1: number; j2: number } } | null;
  onFinalizeMatch: () => void;
}

// 2. Match Module
function MatchPage({ 
  currentMatch, scores, pointsInput, setPointsInput, submitPoints, currentTurn, matchMoves, updateMove, deleteMove, countedOut, endMatchEarly, showNextPrompt, handleStartNext,
  showReplayPrompt, replayMatch, endAsDraw, lastDrawScores, currentMatchStake, setCurrentMatchStake, showAudit, setShowAudit, currentKingId, currentExternalBets, players,
  isVoiceEnabled, setIsVoiceEnabled, pendingEndMatch, onFinalizeMatch
}: MatchPageProps) {
  const [isEditingStake, setIsEditingStake] = useState(false);
  const [newStakeInput, setNewStakeInput] = useState(currentMatchStake.toString());

  // Text-to-speech for the lead message and alerts
  useEffect(() => {
    if (!isVoiceEnabled || !currentMatch) return;

    let text = "";
    
    if (countedOut) {
      const pName = countedOut.player === 'j1' ? currentMatch.j1.name : currentMatch.j2.name;
      text = `Attention : ${pName} doit jouer ${countedOut.margin + 1} points`;
    } else if (scores.j1 !== scores.j2 && (scores.j1 > 0 || scores.j2 > 0)) {
      const leaderName = scores.j1 > scores.j2 ? currentMatch.j1.name : currentMatch.j2.name;
      const gap = Math.abs(scores.j1 - scores.j2);
      text = `${leaderName} mène de ${gap} points`;
    }

    if (text) {
      const speak = () => {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'fr-FR';
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(utterance);
      };

      // Small delay to ensure UI transition completes
      const timer = setTimeout(speak, 500);
      return () => clearTimeout(timer);
    }
  }, [scores.j1, scores.j2, isVoiceEnabled, currentMatch, countedOut]);

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

  if (pendingEndMatch && !showAudit) {
    const leaderName = scores.j1 > scores.j2 ? currentMatch?.j1.name : currentMatch?.j2.name;
    const isDraw = scores.j1 === scores.j2;

    return (
      <motion.div {...pageTransition} className="flex flex-col items-center justify-center py-20 text-center space-y-8 px-6">
        <div className="w-24 h-24 bg-yellow-100 rounded-full flex items-center justify-center text-yellow-600 shadow-inner">
          <Trophy className="w-12 h-12" />
        </div>
        <div className="space-y-3">
          <h3 className="text-2xl font-black uppercase tracking-tight text-slate-800">Match Terminé !</h3>
          <p className="text-slate-500 font-medium">
            {isDraw ? 'Score d\'égalité' : <>Vainqueur : <span className="text-primary font-black">{leaderName}</span></>}
          </p>
          <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">
            Score Final : {scores.j1} - {scores.j2}
          </p>
        </div>

        <div className="w-full space-y-4">
          <button 
            onClick={() => setShowAudit(true)}
            className="w-full bg-slate-800 text-white py-5 rounded-2xl font-black uppercase tracking-widest shadow-xl flex items-center justify-center gap-3 active:scale-95 transition-all"
          >
            <HistoryIcon className="w-5 h-5" />
            Vérifier les scores (Audit)
          </button>
          
          <button 
            onClick={() => onFinalizeMatch()}
            className="w-full bg-primary text-white py-5 rounded-2xl font-black uppercase tracking-widest shadow-lg shadow-primary/20 active:scale-95 transition-all"
          >
            {isDraw ? 'Confirmer le Nul' : 'Confirmer & Déclarer'}
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
          <div className="flex flex-col">
            <h3 className="text-primary font-black uppercase tracking-widest text-[10px]">Match en cours</h3>
            <div className="flex items-center gap-2 mt-1">
              {isEditingStake ? (
                <div className="flex items-center gap-1">
                  <input 
                    type="number"
                    value={newStakeInput}
                    onChange={(e) => setNewStakeInput(e.target.value)}
                    className="w-20 bg-slate-50 border border-slate-200 rounded px-2 py-0.5 text-xs font-black text-primary outline-none"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        setCurrentMatchStake(parseInt(newStakeInput) || 0);
                        setIsEditingStake(false);
                      }
                      if (e.key === 'Escape') {
                        setIsEditingStake(false);
                        setNewStakeInput(currentMatchStake.toString());
                      }
                    }}
                    autoFocus
                  />
                  <button 
                    onClick={() => {
                      setCurrentMatchStake(parseInt(newStakeInput) || 0);
                      setIsEditingStake(false);
                    }}
                    className="text-[10px] bg-primary text-white px-1.5 py-0.5 rounded font-black"
                  >
                    OK
                  </button>
                </div>
              ) : (
                <button 
                  onClick={() => {
                    setNewStakeInput(currentMatchStake.toString());
                    setIsEditingStake(true);
                  }}
                  className="flex items-center gap-1 px-2 py-0.5 rounded-lg hover:bg-slate-50 transition-colors group"
                >
                  <Coins className="w-3 h-3 text-orange-400" />
                  <span className="text-xs font-black text-slate-700">{currentMatchStake.toLocaleString()} FCFA</span>
                  <Edit3 className="w-2.5 h-2.5 text-slate-300 group-hover:text-primary transition-colors" />
                </button>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={endMatchEarly}
              className="text-[10px] font-black text-red-400 uppercase tracking-widest hover:text-red-600 transition-colors bg-red-50 px-2 py-1 rounded"
            >
              Terminer le match
            </button>
          </div>
        </div>

        <AnimatePresence>
          {countedOut && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6 text-center"
            >
              <div className="flex items-center justify-center gap-2 text-amber-600 font-black text-sm uppercase tracking-tight animate-pulse">
                <XCircle className="w-5 h-5 flex-shrink-0" />
                <span>
                  Attention : <span className="underline decoration-2">{countedOut.player === 'j1' ? currentMatch.j1.name : currentMatch.j2.name}</span> doit jouer <span className="text-lg">{countedOut.margin + 1}</span> points
                </span>
              </div>
              <p className="text-[10px] text-amber-500 mt-1 font-bold italic">
                Réduisez l&apos;écart pour rester dans le match !
              </p>
            </motion.div>
          )}
        </AnimatePresence>
        
        <div className="flex justify-between items-stretch gap-4 mb-4">
          {/* Player 1 Block */}
          <motion.div 
            animate={currentTurn === 'j1' ? { scale: [1, 1.02, 1], borderColor: '#2e7d32' } : { scale: 1, borderColor: '#f1f5f9' }}
            transition={currentTurn === 'j1' ? { repeat: Infinity, duration: 2, ease: "easeInOut" } : {}}
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
            transition={currentTurn === 'j2' ? { repeat: Infinity, duration: 2, ease: "easeInOut" } : {}}
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

        {/* Lead Indicator & Voice Toggle */}
        <div className="flex flex-col items-center gap-3 mb-10">
          <div className="h-16 flex items-center justify-center">
            <AnimatePresence mode="wait">
              {scores.j1 !== scores.j2 ? (
                <motion.div 
                  key={`${scores.j1 > scores.j2 ? 'j1' : 'j2'}-${Math.abs(scores.j1 - scores.j2)}`}
                  initial={{ opacity: 0, y: 20, scale: 0.4 }}
                  animate={{ 
                    opacity: 1, 
                    y: 0, 
                    scale: [0.6, 1.15, 1],
                  }}
                  transition={{
                    scale: { duration: 0.5, times: [0, 0.6, 1], ease: "easeOut" },
                    y: { type: 'spring', damping: 10, stiffness: 200 },
                    opacity: { duration: 0.2 }
                  }}
                  exit={{ opacity: 0, scale: 0.6, transition: { duration: 0.1 } }}
                  className={`inline-flex items-center gap-3 px-6 py-2.5 rounded-2xl shadow-lg border-2 ${
                    scores.j1 > scores.j2 
                      ? 'bg-amber-50 border-amber-500' 
                      : 'bg-blue-50 border-blue-500'
                  }`}
                >
                  <span className={`text-lg font-black uppercase tracking-tighter ${scores.j1 > scores.j2 ? 'text-amber-600' : 'text-[#2979ff]'}`}>
                    {scores.j1 > scores.j2 ? currentMatch.j1.name : currentMatch.j2.name}
                  </span>
                  <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest px-1">mène de</span>
                  <motion.span 
                    animate={{ scale: [1, 1.2, 1], rotate: [-5, 5, 0] }}
                    transition={{ duration: 0.5, ease: "easeInOut" }}
                    className={`text-3xl font-black italic drop-shadow-md ${scores.j1 > scores.j2 ? 'text-amber-600' : 'text-[#2979ff]'}`}
                  >
                    {Math.abs(scores.j1 - scores.j2)}
                  </motion.span>
                  <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">points</span>
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

          <button 
            onClick={() => setIsVoiceEnabled(!isVoiceEnabled)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-all border shadow-sm ${
              isVoiceEnabled 
                ? 'bg-primary/5 text-primary border-primary/20' 
                : 'bg-slate-50 text-slate-400 border-slate-200'
            }`}
            title={isVoiceEnabled ? "Désactiver l'audio" : "Activer l'audio"}
          >
            {isVoiceEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            <span className="text-[9px] font-black uppercase tracking-[0.15em]">
              {isVoiceEnabled ? "Lecture Active" : "Lecture Muette"}
            </span>
          </button>
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

        {/* Display Active External Bets */}
        {currentExternalBets.length > 0 && (
          <div className="mt-8 pt-6 border-t border-slate-100">
            <div className="flex items-center gap-2 mb-3">
              <Sword className="w-3 h-3 text-orange-500" />
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Paris Extérieurs Actifs</h4>
            </div>
            <div className="grid grid-cols-1 gap-2">
              {currentExternalBets.map(bet => {
                const bA = players.find(p => p.id === bet.betterAId);
                const bB = players.find(p => p.id === bet.betterBId);
                const supported = players.find(p => p.id === bet.betOnPlayerId);
                
                return (
                  <div key={bet.id} className="bg-slate-50 rounded-xl p-3 border border-slate-100 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-black text-slate-700">{bA?.name}</span>
                        <span className="text-[8px] font-black text-slate-300 uppercase">VS</span>
                        <span className="text-xs font-black text-slate-700">{bB?.name}</span>
                      </div>
                      <div className="text-[10px] font-black text-primary">{bet.amount.toLocaleString()} FCFA</div>
                    </div>
                    <div className="text-[9px] font-black uppercase tracking-widest pt-1 border-t border-slate-200/50">
                       {bA?.name} soutient {supported?.name}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
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

              {pendingEndMatch && (
                <div className="mt-8 pt-6 border-t border-slate-100">
                  <button 
                    onClick={() => onFinalizeMatch()}
                    className="w-full bg-primary text-white py-5 rounded-2xl font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-[1.01] active:scale-95 transition-all"
                  >
                    {scores.j1 === scores.j2 ? 'Confirmer le Match Nul' : 'Confirmer et Déclarer le Vainqueur'}
                  </button>
                  <div className="flex items-center justify-center gap-2 mt-4">
                    <div className="h-[1px] flex-1 bg-slate-100" />
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                       {scores.j1 === scores.j2 ? 'Match Nul' : `Félicitations ${scores.j1 > scores.j2 ? currentMatch?.j1.name : currentMatch?.j2.name}`}
                    </span>
                    <div className="h-[1px] flex-1 bg-slate-100" />
                  </div>
                </div>
              )}
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
                <div className={`text-xl font-display font-black leading-tight ${(p.earnings ?? 0) >= 0 ? 'text-primary' : 'text-red-500'}`}>
                  {(p.earnings ?? 0) > 0 ? '+' : ''}{(p.earnings ?? 0).toLocaleString()}
                </div>
                <div className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Gains (FCFA)</div>
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
function HistoryPage({ archive, sessions, onDeleteSession, players }: any) {
  const [sessionDetail, setSessionDetail] = useState<SessionRecord | null>(null);

  const renderExternalBets = (bets: ExternalBet[], currentPlayers: Player[], winnerId: string) => {
    if (!bets || bets.length === 0) return null;
    return (
      <div className="mt-2 pt-2 border-t border-slate-100 space-y-1">
        <div className="flex items-center gap-1.5 mb-1">
          <Sword className="w-2.5 h-2.5 text-orange-400" />
          <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Paris duels</span>
        </div>
        {bets.map((bet) => {
          const bA = currentPlayers.find(p => p.id === bet.betterAId);
          const bB = currentPlayers.find(p => p.id === bet.betterBId);
          const bAName = bA?.name || "??";
          const bBName = bB?.name || "??";
          
          let status = "";
          if (winnerId === 'draw') {
             status = "Remboursé";
          } else {
             const aWon = bet.betOnPlayerId === winnerId;
             status = aWon ? `${bAName} Gagne` : `${bBName} Gagne`;
          }
          
          return (
            <div key={bet.id} className="flex items-center justify-between text-[9px] font-bold">
              <div className="flex items-center gap-1">
                <span className="text-slate-600 truncate max-w-[60px]">{bAName}</span>
                <span className="text-slate-300 italic">vs</span>
                <span className="text-slate-600 truncate max-w-[60px]">{bBName}</span>
                <span className="text-[7px] text-primary/60 ml-1">({status})</span>
              </div>
              <div className="text-primary">{bet.amount} <span className="text-[7px] text-slate-300">FCFA</span></div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <motion.div {...pageTransition} className="space-y-6">
      {/* Current Duel Archive */}
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
                  {a.winner !== 'Nul' && (
                    <div className="bg-green-100 p-0.5 rounded shadow-sm text-green-600">
                      <CheckCircle2 className="w-3 h-3" />
                    </div>
                  )}
                  <ArrowRight className="w-3 h-3 text-slate-300" />
                  <span className="text-slate-400 text-sm italic truncate max-w-[100px] opacity-70">{a.loser}</span>
                </div>
                <div className="font-display font-black text-primary text-xl tracking-tighter whitespace-nowrap">
                  {a.score}
                </div>
              </div>
              {renderExternalBets(a.externalBets, players, a.winnerId)}
            </div>
          ))}
          {archive.length === 0 && (
            <div className="text-center py-10 text-slate-300 italic text-sm">L&apos;histoire s&apos;écrit maintenant...</div>
          )}
        </div>
      </section>

      {/* Archived Sessions */}
      {sessions.length > 0 && (
        <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center gap-2 mb-6">
            <Trophy className="w-5 h-5 text-yellow-500" />
            <h2 className="text-xl font-display">Sessions Archivées</h2>
          </div>

          <div className="space-y-3">
            {sessions.map((session: SessionRecord) => (
              <div key={session.id} className="bg-slate-50 border border-slate-100 rounded-2xl p-4 transition-all hover:bg-white hover:shadow-md">
                <div className="flex items-center justify-between mb-2">
                  <div className="space-y-0.5">
                    <h3 className="font-bold text-slate-900">{session.name}</h3>
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{session.date}</p>
                  </div>
                  <button 
                    onClick={() => onDeleteSession(session.id)}
                    className="p-2 text-red-300 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">{session.archive.length} matchs joués</span>
                  <button 
                    onClick={() => setSessionDetail(session)}
                    className="text-primary font-black uppercase tracking-widest text-[9px] hover:underline"
                  >
                    Voir détails
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Session Details Modal */}
      <AnimatePresence>
        {sessionDetail && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-slate-800 rounded-3xl p-6 w-full max-w-lg shadow-2xl space-y-6 max-h-[85vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-display font-bold">{sessionDetail.name}</h3>
                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{sessionDetail.date}</p>
                </div>
                <button 
                  onClick={() => setSessionDetail(null)}
                  className="p-2 bg-slate-100 rounded-full text-slate-500"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b pb-1">Classement Final</h4>
                <div className="space-y-2">
                  {sessionDetail.players.sort((a,b) => b.earnings - a.earnings).map((p, i) => (
                    <div key={p.id} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0 text-sm">
                      <div className="flex items-center gap-3">
                        <span className="w-4 text-slate-300 font-black">{i+1}</span>
                        <span className="font-bold text-slate-700">{p.name}</span>
                      </div>
                      <span className={`font-black ${(p.earnings ?? 0) >= 0 ? 'text-primary' : 'text-red-500'}`}>
                        {(p.earnings ?? 0) > 0 ? '+' : ''}{(p.earnings ?? 0).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>

                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b pb-1 mt-6">Matchs de la session</h4>
                <div className="space-y-4 pt-2">
                  {sessionDetail.archive.map((match, idx) => (
                    <div key={idx} className="space-y-2 pb-3 border-b border-slate-50 last:border-0 last:pb-0">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-slate-700">{match.winner}</span>
                          <ArrowRight className="w-2.5 h-2.5 text-slate-300" />
                          <span className="text-slate-400 text-xs">{match.loser}</span>
                        </div>
                        <span className="font-mono font-black text-primary text-sm">{match.score}</span>
                      </div>
                      {renderExternalBets(match.externalBets, sessionDetail.players, match.winnerId)}
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

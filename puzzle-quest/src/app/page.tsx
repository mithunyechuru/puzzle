"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Gamepad2,
  Users,
  Copy,
  Check,
  Play,
  ArrowRight,
  LogOut,
  Trophy,
  Loader2,
  Lock,
  Compass,
  AlertCircle
} from "lucide-react";
import { useGameState } from "@/hooks/useGameState";
import { BackgroundParticles } from "@/components/BackgroundParticles";
import { NeonButton } from "@/components/NeonButton";
import { GlassCard } from "@/components/GlassCard";
import { PuzzleGrid } from "@/components/PuzzleGrid";
import { QuestionModal } from "@/components/QuestionModal";
import { Leaderboard } from "@/components/Leaderboard";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  const {
    gameSettings,
    teams,
    currentTeamId,
    playerName,
    isAdmin,
    activeQuestion,
    createTeam,
    joinTeam,
    enterAsAdmin,
    leaveGame,
    startQuestion
  } = useGameState();

  // Navigation / Local Flow States
  const [localScreen, setLocalScreen] = useState<"landing" | "team_select">("landing");
  
  // Input form states
  const [createPlayerName, setCreatePlayerName] = useState("");
  const [createTeamName, setCreateTeamName] = useState("");
  const [joinPlayerName, setJoinPlayerName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [formError, setFormError] = useState<{ type: "create" | "join"; msg: string } | null>(null);

  // Copy state
  const [copiedCode, setCopiedCode] = useState(false);

  // Reset errors on input changes
  useEffect(() => {
    setFormError(null);
  }, [createPlayerName, createTeamName, joinPlayerName, joinCode]);

  // Determine actual view based on state
  // If player is already logged in, skip landing/team select
  const currentTeam = teams.find((t) => t.id === currentTeamId);

  const getActiveView = () => {
    if (playerName && currentTeamId && currentTeam) {
      if (gameSettings.status === "idle") {
        return "waiting_room";
      } else {
        return "game_screen";
      }
    }
    if (localScreen === "team_select") {
      return "team_select";
    }
    return "landing";
  };

  const activeView = getActiveView();

  // Actions
  const handleCreateTeamSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!createPlayerName.trim()) {
      setFormError({ type: "create", msg: "Player name is required" });
      return;
    }
    if (!createTeamName.trim()) {
      setFormError({ type: "create", msg: "Team name is required" });
      return;
    }
    createTeam(createPlayerName.trim(), createTeamName.trim());
  };

  const handleJoinTeamSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinPlayerName.trim()) {
      setFormError({ type: "join", msg: "Player name is required" });
      return;
    }
    if (!joinCode.trim()) {
      setFormError({ type: "join", msg: "Team code is required" });
      return;
    }

    const success = joinTeam(joinPlayerName.trim(), joinCode.trim());
    if (!success) {
      const match = teams.find(t => t.id === joinCode.trim().toUpperCase());
      if (!match) {
        setFormError({ type: "join", msg: "Invalid Code. Team not found." });
      } else {
        setFormError({ type: "join", msg: "Team Full. Max 6 players." });
      }
    }
  };

  const copyToClipboard = () => {
    if (!currentTeamId) return;
    navigator.clipboard.writeText(currentTeamId);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // Format Timer to MM:SS
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  // SVG Floating Pieces definitions
  const floatingPieces = [
    { d: "M10 10 H90 V90 H10 Z", style: "top-10 left-10 text-cyan-500/10 w-24 h-24 animate-float-1" },
    { d: "M50 0 L100 86 L0 86 Z", style: "bottom-20 left-20 text-purple-500/10 w-28 h-28 animate-float-2" },
    { d: "M50 0 L90 30 L90 80 L50 100 L10 80 L10 30 Z", style: "top-20 right-20 text-pink-500/10 w-20 h-20 animate-float-3" }
  ];

  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen p-4 overflow-hidden z-10 select-none">
      {/* Dynamic particles background */}
      <BackgroundParticles />

      {/* Floating vector puzzle-like SVGs in the background */}
      <div className="absolute inset-0 pointer-events-none z-0">
        {floatingPieces.map((piece, index) => (
          <svg
            key={index}
            className={`absolute fill-current ${piece.style}`}
            viewBox="0 0 100 100"
          >
            <path d={piece.d} />
          </svg>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* 1. LANDING SCREEN */}
        {activeView === "landing" && (
          <motion.div
            key="landing"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, y: -20 }}
            className="w-full max-w-lg z-10 flex flex-col items-center text-center px-4"
          >
            {/* Immersive Game Icon */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 40, ease: "linear" }}
              className="relative w-28 h-28 mb-6 flex items-center justify-center"
            >
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-tr from-neon-purple to-neon-blue opacity-20 blur-xl" />
              <div className="w-20 h-20 rounded-2xl glass-panel-glow-blue flex items-center justify-center border border-neon-blue/40">
                <Gamepad2 className="w-10 h-10 text-neon-blue filter drop-shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
              </div>
            </motion.div>

            {/* Title & Subtitle */}
            <h1 className="text-5xl md:text-6xl font-extrabold tracking-tighter text-white mb-2 font-sans select-none">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-neon-blue via-neon-purple to-neon-pink drop-shadow-[0_0_20px_rgba(168,85,247,0.45)]">
                PUZZLE QUEST
              </span>
            </h1>
            <p className="text-slate-400 font-mono text-sm tracking-widest uppercase mb-10">
              A Real-Time Puzzle Challenge
            </p>

            {/* Buttons */}
            <div className="flex flex-col gap-4 w-full max-w-xs">
              <NeonButton
                variant="purple"
                size="lg"
                glow
                onClick={() => setLocalScreen("team_select")}
              >
                Enter Game <ArrowRight className="w-4 h-4" />
              </NeonButton>

              <button
                onClick={() => {
                  enterAsAdmin();
                  router.push("/admin");
                }}
                className="text-xs font-mono text-slate-500 hover:text-neon-blue uppercase tracking-widest transition-colors py-2 cursor-pointer"
              >
                Go to Admin Portal
              </button>
            </div>
          </motion.div>
        )}

        {/* 2. TEAM SYSTEM PAGE (SPLIT GLASS LAYOUT) */}
        {activeView === "team_select" && (
          <motion.div
            key="team_select"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full max-w-4xl z-10"
          >
            {/* Header */}
            <div className="text-center mb-8">
              <h2 className="text-3xl font-extrabold tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-neon-blue to-neon-purple">
                CONNECT TO GRID
              </h2>
              <p className="text-slate-400 text-xs font-mono tracking-widest uppercase mt-1">
                Create a squad or enter an active squad code
              </p>
            </div>

            {/* Grid Panels */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* CREATE TEAM PANEL */}
              <GlassCard variant="blue" animate={false}>
                <h3 className="text-xl font-bold mb-6 text-neon-blue flex items-center gap-2">
                  <Play className="w-5 h-5 text-neon-blue" /> CREATE TEAM
                </h3>

                <form onSubmit={handleCreateTeamSubmit} className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] uppercase font-mono tracking-widest text-slate-400">
                      Player Name
                    </label>
                    <input
                      type="text"
                      maxLength={14}
                      placeholder="e.g. Neo"
                      value={createPlayerName}
                      onChange={(e) => setCreatePlayerName(e.target.value)}
                      className="w-full p-3 rounded-lg text-sm text-white neon-input"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] uppercase font-mono tracking-widest text-slate-400">
                      Team Name
                    </label>
                    <input
                      type="text"
                      maxLength={18}
                      placeholder="e.g. Cyber Hunters"
                      value={createTeamName}
                      onChange={(e) => setCreateTeamName(e.target.value)}
                      className="w-full p-3 rounded-lg text-sm text-white neon-input"
                    />
                  </div>

                  {formError?.type === "create" && (
                    <div className="text-xs text-neon-red font-mono flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5" />
                      {formError.msg}
                    </div>
                  )}

                  <NeonButton variant="blue" type="submit" fullWidth className="mt-2">
                    Create Team
                  </NeonButton>
                </form>
              </GlassCard>

              {/* JOIN TEAM PANEL */}
              <GlassCard variant="purple" animate={false}>
                <h3 className="text-xl font-bold mb-6 text-neon-purple flex items-center gap-2">
                  <Users className="w-5 h-5 text-neon-purple" /> JOIN TEAM
                </h3>

                <form onSubmit={handleJoinTeamSubmit} className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] uppercase font-mono tracking-widest text-slate-400">
                      Player Name
                    </label>
                    <input
                      type="text"
                      maxLength={14}
                      placeholder="e.g. Trinity"
                      value={joinPlayerName}
                      onChange={(e) => setJoinPlayerName(e.target.value)}
                      className="w-full p-3 rounded-lg text-sm text-white neon-input neon-input-purple"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] uppercase font-mono tracking-widest text-slate-400">
                      Team Code
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. ABCD"
                      value={joinCode}
                      onChange={(e) => setJoinCode(e.target.value)}
                      className="w-full p-3 rounded-lg text-sm text-white uppercase font-mono neon-input neon-input-purple"
                    />
                  </div>

                  {formError?.type === "join" && (
                    <div className="text-xs text-neon-red font-mono flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5" />
                      {formError.msg}
                    </div>
                  )}

                  <NeonButton variant="purple" type="submit" fullWidth className="mt-2">
                    Join Team
                  </NeonButton>
                </form>
              </GlassCard>
            </div>

            {/* Back to landing */}
            <div className="text-center mt-6">
              <button
                onClick={() => setLocalScreen("landing")}
                className="text-xs font-mono text-slate-500 hover:text-slate-300 uppercase tracking-widest transition-colors py-2 cursor-pointer"
              >
                Back to Title
              </button>
            </div>
          </motion.div>
        )}

        {/* 3. WAITING ROOM (CENTERED GLASS CARD) */}
        {activeView === "waiting_room" && (
          <motion.div
            key="waiting"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full max-w-lg z-10"
          >
            <GlassCard variant="purple" className="relative p-8 overflow-hidden" animate={false}>
              {/* Top border pulse */}
              <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-neon-blue via-neon-purple to-neon-pink opacity-80" />

              {/* Header */}
              <div className="text-center mb-6">
                <span className="inline-flex items-center rounded-full bg-neon-purple/15 px-3 py-1 text-xs font-bold uppercase tracking-widest text-neon-purple border border-neon-purple/20 mb-3">
                  SQUAD TERMINAL
                </span>
                <h2 className="text-3xl font-black text-white neon-text-purple tracking-wide">
                  {currentTeam?.name}
                </h2>
              </div>

              {/* Team Code Display */}
              <div className="bg-slate-900/60 rounded-xl p-4 border border-slate-800 text-center mb-6 flex flex-col items-center">
                <span className="text-[10px] font-mono tracking-widest text-slate-500 uppercase mb-1">
                  Team Code Share
                </span>
                <div className="flex items-center gap-3">
                  <span className="text-2xl font-black tracking-widest font-mono text-neon-blue drop-shadow-[0_0_6px_rgba(6,182,212,0.4)]">
                    {currentTeamId}
                  </span>
                  <button
                    onClick={copyToClipboard}
                    className="p-1.5 rounded-md hover:bg-slate-800 text-slate-400 hover:text-neon-blue transition-colors cursor-pointer"
                  >
                    {copiedCode ? <Check className="w-4 h-4 text-neon-green" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Members List */}
              <div className="mb-8">
                <h4 className="text-xs uppercase font-mono tracking-widest text-slate-400 mb-3 flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-neon-pink" /> Squad Roster ({currentTeam?.members.length}/6)
                </h4>

                <div className="flex flex-wrap gap-2 justify-center py-2">
                  <AnimatePresence>
                    {currentTeam?.members.map((member, idx) => {
                      const initials = member.substring(0, 2).toUpperCase();
                      const isMe = member === playerName;
                      return (
                        <motion.div
                          key={member}
                          initial={{ scale: 0.7, opacity: 0, y: 10 }}
                          animate={{ scale: 1, opacity: 1, y: 0 }}
                          exit={{ scale: 0.7, opacity: 0 }}
                          className={`flex items-center gap-2 rounded-full px-3 py-1.5 border text-xs font-semibold ${
                            isMe
                              ? "border-neon-blue bg-neon-blue/10 text-white shadow-[0_0_8px_rgba(6,182,212,0.25)]"
                              : "border-slate-800 bg-slate-900/40 text-slate-300"
                          }`}
                        >
                          <span className={`flex h-5 w-5 items-center justify-center rounded-full text-[9px] font-black ${
                            isMe ? "bg-neon-blue text-slate-950" : "bg-slate-800 text-slate-400"
                          }`}>
                            {initials}
                          </span>
                          {member}
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              </div>

              {/* Status Pulse */}
              <div className="flex flex-col items-center justify-center text-center p-3 rounded-lg bg-slate-950/40 border border-slate-900">
                <div className="flex items-center gap-2 text-slate-400 text-xs font-mono tracking-widest uppercase">
                  <Loader2 className="w-3.5 h-3.5 text-neon-pink animate-spin" />
                  <span>Waiting for admin to start</span>
                </div>
                <p className="text-[10px] text-slate-600 mt-1 font-mono">
                  Keep this tab open. The game board will sync automatically.
                </p>
              </div>

              {/* Disconnect */}
              <div className="text-center mt-6">
                <button
                  onClick={leaveGame}
                  className="inline-flex items-center gap-1 text-xs font-mono text-slate-500 hover:text-neon-red uppercase tracking-widest transition-colors cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" /> Disconnect Squad
                </button>
              </div>
            </GlassCard>
          </motion.div>
        )}

        {/* 4. GAMEBOARD PLAYING SCREEN */}
        {activeView === "game_screen" && (
          <motion.div
            key="game"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full max-w-6xl z-10 flex flex-col gap-6"
          >
            {/* Top Bar Dashboard */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-4 rounded-xl border border-slate-800/80 bg-slate-950/60 backdrop-blur-md">
              {/* Left Team Info */}
              <div className="flex items-center gap-3">
                <div className={`h-3 w-3 rounded-full bg-neon-${currentTeam?.color} animate-[pulse_1.5s_infinite] shadow-neon-${currentTeam?.color}`} />
                <div>
                  <h2 className="text-lg font-bold text-white tracking-wide uppercase">
                    {currentTeam?.name}
                  </h2>
                  <p className="text-[10px] font-mono text-slate-500">
                    Player: <span className="text-neon-blue font-semibold">{playerName}</span> | Code: {currentTeamId}
                  </p>
                </div>
              </div>

              {/* Middle Timer */}
              <div className="flex flex-col items-center min-w-[120px] bg-slate-900/50 rounded-lg px-4 py-1.5 border border-slate-800">
                <span className="text-[9px] uppercase font-mono tracking-widest text-slate-500">
                  Time Remaining
                </span>
                <span className={`text-xl font-bold font-mono tracking-wider ${
                  gameSettings.timer <= 30 ? "text-neon-red animate-[pulse_0.5s_infinite]" : "text-neon-blue"
                }`}>
                  {formatTime(gameSettings.timer)}
                </span>
              </div>

              {/* Right Points Score */}
              <div className="flex items-center gap-6">
                <div className="text-right">
                  <span className="text-[9px] uppercase font-mono tracking-widest text-slate-500 block">
                    Points Score
                  </span>
                  <span className="text-2xl font-black font-mono tracking-wider text-neon-green neon-text-green">
                    {currentTeam?.points}
                  </span>
                </div>

                <button
                  onClick={leaveGame}
                  className="p-2 rounded-lg hover:bg-slate-800/80 text-slate-400 hover:text-neon-red transition-colors cursor-pointer"
                  title="Leave game"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Game timer progress line bar */}
            <div className="w-full h-1 bg-slate-900 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: "100%" }}
                animate={{ width: `${(gameSettings.timer / gameSettings.duration) * 100}%` }}
                transition={{ duration: 1, ease: "linear" }}
                className={`h-full ${
                  gameSettings.timer <= 30 ? "bg-neon-red" : "bg-neon-blue"
                }`}
              />
            </div>

            {/* Main Grid + Leaderboard Panel Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
              {/* Puzzle Grid Column */}
              <div className="lg:col-span-2 flex flex-col items-center gap-4">
                {gameSettings.status === "paused" ? (
                  <div className="flex flex-col h-[480px] w-full max-w-[500px] items-center justify-center rounded-2xl border border-neon-purple/20 bg-slate-950/70 p-6 text-center">
                    <Loader2 className="w-10 h-10 text-neon-purple animate-spin mb-4" />
                    <h3 className="text-xl font-extrabold text-neon-purple tracking-wider uppercase mb-1">
                      GRID SIGNAL PAUSED
                    </h3>
                    <p className="text-xs text-slate-400 font-mono">
                      Waiting for Director to resume telemetry.
                    </p>
                  </div>
                ) : (
                  <PuzzleGrid onCellClick={startQuestion} />
                )}

                <div className="text-center font-mono text-[11px] text-slate-500">
                  * Click on a locked block to reveal a question and claim coordinates.
                </div>
              </div>

              {/* Leaderboard Column */}
              <div className="w-full">
                <GlassCard variant="default" className="h-[480px] flex flex-col p-5 overflow-hidden" animate={false}>
                  <Leaderboard className="h-full" />
                </GlassCard>
              </div>
            </div>

            {/* QUESTION POPUP MODAL */}
            {activeQuestion && <QuestionModal />}

            {/* GAME ENDED OVERLAY CARD */}
            {gameSettings.status === "ended" && (
              <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md">
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="w-full max-w-lg rounded-2xl border border-amber-400/40 bg-slate-950 p-8 text-center shadow-[0_0_50px_rgba(251,191,36,0.15)]"
                >
                  <Trophy className="w-14 h-14 text-amber-400 mx-auto mb-4 animate-[bounce_1s_infinite]" />
                  <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500 tracking-wide uppercase mb-1">
                    CHALLENGE COMPLETED
                  </h2>
                  <p className="text-xs text-slate-400 font-mono tracking-widest uppercase mb-6">
                    Telemetry Terminal Closed
                  </p>

                  <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 mb-8 flex flex-col gap-4 text-left font-mono">
                    <h4 className="text-xs text-slate-500 uppercase tracking-widest border-b border-slate-800 pb-2">
                      Final Scoreboard
                    </h4>
                    {[...teams]
                      .sort((a, b) => b.points - a.points)
                      .map((t, idx) => (
                        <div key={t.id} className="flex justify-between items-center text-sm">
                          <span className="flex items-center gap-2">
                            <span className="text-slate-500">#{idx + 1}</span>
                            <span className={`font-bold text-neon-${t.color}`}>{t.name}</span>
                            {t.id === currentTeamId && <span className="text-[10px] text-neon-blue">(You)</span>}
                          </span>
                          <span className="font-extrabold text-white">{t.points} pts</span>
                        </div>
                      ))}
                  </div>

                  <div className="flex gap-4">
                    <NeonButton variant="blue" fullWidth onClick={leaveGame}>
                      Exit to Terminal
                    </NeonButton>
                  </div>
                </motion.div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

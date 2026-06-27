"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Settings,
  Activity,
  Sliders,
  Play,
  Pause,
  RotateCcw,
  Upload,
  Image as ImageIcon,
  HelpCircle,
  Users,
  Grid,
  Trophy,
  CheckCircle,
  Database,
  ArrowLeft,
  ToggleLeft,
  ToggleRight,
  RefreshCw,
  Lock,
  Unlock
} from "lucide-react";
import { useGameState, Question } from "@/hooks/useGameState";
import { BackgroundParticles } from "@/components/BackgroundParticles";
import { NeonButton } from "@/components/NeonButton";
import { GlassCard } from "@/components/GlassCard";
import { Leaderboard } from "@/components/Leaderboard";
import Link from "next/link";

export default function AdminPage() {
  const {
    gameSettings,
    teams,
    questions,
    enterAsAdmin,
    adminStartGame,
    adminPauseGame,
    adminResetGame,
    adminUpdateSettings,
    adminResetGridCell,
    adminUpdateQuestions
  } = useGameState();

  const [activeTab, setActiveTab] = useState<"dashboard" | "settings" | "controls">("dashboard");
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const jsonInputRef = useRef<HTMLInputElement | null>(null);

  // Auto-login as admin when visiting this page
  useEffect(() => {
    enterAsAdmin();
  }, []);

  // Stats calculation
  const totalTeams = teams.length;
  const totalPlayers = teams.reduce((acc, t) => acc + t.members.length, 0);
  
  const totalGridCells = gameSettings.gridSize * gameSettings.gridSize;
  const totalUnlockedCells = teams.reduce(
    (acc, t) => acc + t.gridState.filter(Boolean).length,
    0
  );
  const totalPossibleCells = totalTeams * totalGridCells;
  const avgCompletion = totalPossibleCells > 0 
    ? Math.round((totalUnlockedCells / totalPossibleCells) * 100)
    : 0;

  const avgPoints = totalTeams > 0
    ? Math.round(teams.reduce((acc, t) => acc + t.points, 0) / totalTeams)
    : 0;

  // Handle Custom Image Base64 Upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const base64 = uploadEvent.target?.result as string;
      adminUpdateSettings({ imageUrl: base64 });
    };
    reader.readAsDataURL(file);
  };

  // Handle JSON Question Upload
  const handleJsonUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      try {
        const json = JSON.parse(uploadEvent.target?.result as string);
        if (Array.isArray(json)) {
          // Simple validation
          const valid = json.every(
            (q: any) =>
              q.id &&
              q.category &&
              q.difficulty &&
              q.text &&
              Array.isArray(q.options) &&
              q.options.length === 4 &&
              typeof q.correctAnswer === "number"
          );

          if (valid) {
            adminUpdateQuestions(json as Question[]);
            alert(`Success! Loaded ${json.length} custom questions.`);
          } else {
            alert(
              "Invalid question format. Each object must contain: id, category, difficulty, text, options (array of 4 strings), and correctAnswer (index 0-3)."
            );
          }
        } else {
          alert("JSON file must be an array of questions.");
        }
      } catch (err) {
        alert("Failed to parse JSON. Please check file formatting.");
      }
    };
    reader.readAsText(file);
  };

  // Format timer
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="relative flex flex-col min-h-screen p-4 overflow-hidden z-10 select-none bg-cyber-bg">
      {/* Background visual particles */}
      <BackgroundParticles />

      {/* Main Admin Dashboard Wrap */}
      <div className="w-full max-w-7xl mx-auto flex flex-col gap-6 z-10 flex-grow">
        {/* Top Header Row */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-4 rounded-xl border border-slate-800/80 bg-slate-950/60 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <Link href="/" className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <h1 className="text-xl font-black text-white tracking-wider flex items-center gap-2">
                PUZZLE QUEST <span className="text-xs bg-neon-pink/15 text-neon-pink px-2.5 py-0.5 border border-neon-pink/30 rounded-md font-mono uppercase">DIRECTOR PORTAL</span>
              </h1>
              <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mt-0.5">
                Central Broadcast & Telemetry Command
              </p>
            </div>
          </div>

          {/* Quick status displays */}
          <div className="flex items-center gap-4">
            <div className="bg-slate-900/60 rounded-lg px-4 py-1.5 border border-slate-800 text-center font-mono">
              <span className="text-[9px] uppercase tracking-widest text-slate-500 block">
                Broadcast Link
              </span>
              <span className="text-xs text-neon-green font-bold flex items-center justify-center gap-1.5 mt-0.5">
                <span className="h-1.5 w-1.5 rounded-full bg-neon-green animate-ping" />
                ACTIVE SYNC
              </span>
            </div>

            <div className="bg-slate-900/60 rounded-lg px-4 py-1.5 border border-slate-800 text-center font-mono">
              <span className="text-[9px] uppercase tracking-widest text-slate-500 block">
                Game Timer
              </span>
              <span className={`text-sm font-bold ${
                gameSettings.status === "playing" ? "text-neon-blue" : "text-slate-400"
              }`}>
                {formatTime(gameSettings.timer)}
              </span>
            </div>
          </div>
        </div>

        {/* Dashboard Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start flex-grow">
          {/* Sidebar Menu Panel */}
          <GlassCard variant="default" className="lg:col-span-1 p-4 flex flex-col gap-2" animate={false}>
            <span className="text-[10px] font-mono tracking-widest text-slate-500 uppercase px-3 mb-2 block">
              Menu Navigation
            </span>

            <button
              onClick={() => setActiveTab("dashboard")}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-bold tracking-wide uppercase transition-all duration-300 text-left w-full cursor-pointer ${
                activeTab === "dashboard"
                  ? "bg-neon-blue/15 text-neon-blue border border-neon-blue/20 shadow-neon-blue-sm"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/40 border border-transparent"
              }`}
            >
              <Activity className="w-4 h-4" /> Telemetry Dashboard
            </button>

            <button
              onClick={() => setActiveTab("settings")}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-bold tracking-wide uppercase transition-all duration-300 text-left w-full cursor-pointer ${
                activeTab === "settings"
                  ? "bg-neon-purple/15 text-neon-purple border border-neon-purple/20 shadow-neon-purple-sm"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/40 border border-transparent"
              }`}
            >
              <Settings className="w-4 h-4" /> Grid Configuration
            </button>

            <button
              onClick={() => setActiveTab("controls")}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-bold tracking-wide uppercase transition-all duration-300 text-left w-full cursor-pointer ${
                activeTab === "controls"
                  ? "bg-neon-pink/15 text-neon-pink border border-neon-pink/20 shadow-neon-pink-sm"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/40 border border-transparent"
              }`}
            >
              <Sliders className="w-4 h-4" /> Game Director Controls
            </button>

            <div className="mt-8 border-t border-slate-900 pt-4 flex flex-col gap-2 text-[10px] font-mono text-slate-500 px-3">
              <div>Telemetry Status: OK</div>
              <div>Connected Peers: {totalTeams}</div>
              <div>Active Roster: {totalPlayers} players</div>
            </div>
          </GlassCard>

          {/* Main Area View */}
          <div className="lg:col-span-3 flex flex-col gap-6">
            <AnimatePresence mode="wait">
              {/* TAB 1: TELEMETRY DASHBOARD */}
              {activeTab === "dashboard" && (
                <motion.div
                  key="dashboard"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex flex-col gap-6"
                >
                  {/* Stats Row */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-slate-950/50 border border-slate-800 p-4 rounded-xl flex flex-col">
                      <span className="text-[10px] font-mono tracking-widest text-slate-500 uppercase mb-1">
                        Active Squads
                      </span>
                      <span className="text-2xl font-black text-white">{totalTeams}</span>
                    </div>

                    <div className="bg-slate-950/50 border border-slate-800 p-4 rounded-xl flex flex-col">
                      <span className="text-[10px] font-mono tracking-widest text-slate-500 uppercase mb-1">
                        Total Players
                      </span>
                      <span className="text-2xl font-black text-white">{totalPlayers}</span>
                    </div>

                    <div className="bg-slate-950/50 border border-slate-800 p-4 rounded-xl flex flex-col">
                      <span className="text-[10px] font-mono tracking-widest text-slate-500 uppercase mb-1">
                        Average Points
                      </span>
                      <span className="text-2xl font-black text-neon-green">{avgPoints}</span>
                    </div>

                    <div className="bg-slate-950/50 border border-slate-800 p-4 rounded-xl flex flex-col">
                      <span className="text-[10px] font-mono tracking-widest text-slate-500 uppercase mb-1">
                        Total Grid Solved
                      </span>
                      <span className="text-2xl font-black text-neon-blue">{avgCompletion}%</span>
                    </div>
                  </div>

                  {/* Grids and Leaderboard Split */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Live Grids Grid */}
                    <GlassCard variant="default" className="md:col-span-2 p-5 flex flex-col gap-4" animate={false}>
                      <h3 className="text-sm font-bold uppercase tracking-widest text-slate-300 flex items-center gap-2 mb-2">
                        <Grid className="w-4 h-4 text-neon-blue animate-pulse" /> LIVE TELEMETRY GRIDS
                      </h3>

                      {teams.length === 0 ? (
                        <div className="flex h-48 items-center justify-center rounded-xl border border-dashed border-slate-800 text-slate-500 text-xs font-mono">
                          No active squads linked. Use Player Portal to create teams.
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[420px] overflow-y-auto pr-1">
                          {teams.map((team) => (
                            <div
                              key={team.id}
                              className="border border-slate-800/80 bg-slate-950/40 rounded-xl p-3 flex flex-col gap-3"
                            >
                              <div className="flex items-center justify-between border-b border-slate-900 pb-1.5">
                                <span className={`text-xs font-bold text-neon-${team.color}`}>
                                  {team.name}
                                </span>
                                <span className="text-[10px] text-slate-500 font-mono">
                                  {team.points} pts
                                </span>
                              </div>

                              {/* Mini representation of team grid state */}
                              <div
                                className="grid gap-1 bg-slate-900/60 p-1.5 rounded-lg border border-slate-900 aspect-square max-w-[120px] mx-auto"
                                style={{
                                  gridTemplateColumns: `repeat(${gameSettings.gridSize}, minmax(0, 1fr))`
                                }}
                              >
                                {team.gridState.map((unlocked, cIdx) => (
                                  <button
                                    key={cIdx}
                                    onClick={() => {
                                      if (unlocked) {
                                        if (confirm(`Reset cell ${cIdx + 1} for team ${team.name}?`)) {
                                          adminResetGridCell(team.id, cIdx);
                                        }
                                      }
                                    }}
                                    disabled={!unlocked}
                                    className={`w-full aspect-square rounded transition-all duration-300 ${
                                      unlocked
                                        ? `bg-neon-${team.color} shadow-[0_0_8px_rgba(255,255,255,0.2)] cursor-pointer hover:opacity-50`
                                        : "bg-slate-800/50 cursor-default"
                                    }`}
                                    title={unlocked ? "Click to lock cell" : "Locked"}
                                  />
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </GlassCard>

                    {/* Compact Leaderboard Panel */}
                    <div className="w-full">
                      <GlassCard variant="default" className="h-[520px] flex flex-col p-5 overflow-hidden" animate={false}>
                        <Leaderboard className="h-full" />
                      </GlassCard>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* TAB 2: CONFIGURATION & SETTINGS */}
              {activeTab === "settings" && (
                <motion.div
                  key="settings"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex flex-col gap-6"
                >
                  <GlassCard variant="purple" className="p-6 flex flex-col gap-6" animate={false}>
                    <h2 className="text-lg font-bold text-neon-purple tracking-wide flex items-center gap-2 border-b border-slate-900 pb-3 uppercase">
                      <Sliders className="w-5 h-5" /> Grid Telemetry Settings
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Grid Size Select */}
                      <div className="flex flex-col gap-2">
                        <label className="text-xs uppercase font-mono tracking-widest text-slate-400">
                          Matrix Dimension (Grid Size)
                        </label>
                        <select
                          value={gameSettings.gridSize}
                          onChange={(e) => adminUpdateSettings({ gridSize: parseInt(e.target.value) })}
                          disabled={gameSettings.status !== "idle"}
                          className="w-full p-3 rounded-lg text-sm bg-slate-900/60 border border-slate-800 text-white font-mono outline-none focus:border-neon-purple transition-all"
                        >
                          <option value={3}>3 x 3 Matrix (9 cells)</option>
                          <option value={4}>4 x 4 Matrix (16 cells)</option>
                          <option value={5}>5 x 5 Matrix (25 cells)</option>
                        </select>
                        <span className="text-[10px] text-slate-500 font-mono">
                          * Can only modify grid size in IDLE status. Modifying resets active grid unlocks.
                        </span>
                      </div>

                      {/* Game Duration */}
                      <div className="flex flex-col gap-2">
                        <label className="text-xs uppercase font-mono tracking-widest text-slate-400">
                          Telemetry Duration Limit
                        </label>
                        <select
                          value={gameSettings.duration}
                          onChange={(e) => adminUpdateSettings({ duration: parseInt(e.target.value) })}
                          className="w-full p-3 rounded-lg text-sm bg-slate-900/60 border border-slate-800 text-white font-mono outline-none focus:border-neon-purple transition-all"
                        >
                          <option value={60}>1 Minute (Test run)</option>
                          <option value={180}>3 Minutes</option>
                          <option value={300}>5 Minutes (Standard)</option>
                          <option value={600}>10 Minutes (Hardcore)</option>
                        </select>
                      </div>

                      {/* Image Upload */}
                      <div className="flex flex-col gap-2">
                        <label className="text-xs uppercase font-mono tracking-widest text-slate-400">
                          Grid Wallpaper Graphic
                        </label>
                        <div className="flex gap-3">
                          <button
                            onClick={() => fileInputRef.current?.click()}
                            className="flex items-center gap-2 px-4 py-3 rounded-lg text-xs font-bold bg-slate-900 text-neon-blue border border-neon-blue/20 hover:bg-slate-800/80 transition-all uppercase tracking-wider cursor-pointer"
                          >
                            <ImageIcon className="w-3.5 h-3.5" /> Select Custom Image
                          </button>
                          <button
                            onClick={() => adminUpdateSettings({ imageUrl: "/puzzle-default.png" })}
                            className="flex items-center gap-2 px-3 py-3 rounded-lg text-xs font-bold bg-slate-950 text-slate-400 border border-slate-800 hover:text-slate-200 transition-all uppercase tracking-wider cursor-pointer"
                          >
                            Reset Default
                          </button>
                        </div>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                        />
                        <span className="text-[10px] text-slate-500 font-mono truncate">
                          Active: {gameSettings.imageUrl.startsWith("data:") ? "Custom base64 payload" : gameSettings.imageUrl}
                        </span>
                      </div>

                      {/* Bot Simulation Toggle */}
                      <div className="flex flex-col gap-2">
                        <label className="text-xs uppercase font-mono tracking-widest text-slate-400">
                          Simulate AI Bot Teams
                        </label>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => adminUpdateSettings({ simulateBots: !gameSettings.simulateBots })}
                            className="text-slate-300 hover:text-white flex items-center gap-2 font-mono text-xs cursor-pointer"
                          >
                            {gameSettings.simulateBots ? (
                              <>
                                <ToggleRight className="w-7 h-7 text-neon-green" />
                                <span className="text-neon-green font-bold">SIMULATION ACTIVE</span>
                              </>
                            ) : (
                              <>
                                <ToggleLeft className="w-7 h-7 text-slate-500" />
                                <span>SIMULATION DEACTIVATED</span>
                              </>
                            )}
                          </button>
                        </div>
                        <span className="text-[10px] text-slate-500 font-mono">
                          * Toggles background bots that periodically unlock random cells to simulate tournament play.
                        </span>
                      </div>

                      {/* Question Uploader */}
                      <div className="flex flex-col gap-2">
                        <label className="text-xs uppercase font-mono tracking-widest text-slate-400">
                          Hot-Load Question File (JSON)
                        </label>
                        <div className="flex gap-3">
                          <button
                            onClick={() => jsonInputRef.current?.click()}
                            className="flex items-center gap-2 px-4 py-3 rounded-lg text-xs font-bold bg-slate-900 text-neon-purple border border-neon-purple/20 hover:bg-slate-800/80 transition-all uppercase tracking-wider cursor-pointer"
                          >
                            <Database className="w-3.5 h-3.5" /> Upload Question JSON
                          </button>
                        </div>
                        <input
                          ref={jsonInputRef}
                          type="file"
                          accept=".json"
                          onChange={handleJsonUpload}
                          className="hidden"
                        />
                        <span className="text-[10px] text-slate-500 font-mono">
                          Active Question Set: {questions.length} items loaded.
                        </span>
                      </div>
                    </div>
                  </GlassCard>
                </motion.div>
              )}

              {/* TAB 3: GAME CONTROLS */}
              {activeTab === "controls" && (
                <motion.div
                  key="controls"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex flex-col gap-6"
                >
                  <GlassCard variant="pink" className="p-6 flex flex-col gap-6" animate={false}>
                    <h2 className="text-lg font-bold text-neon-pink tracking-wide flex items-center gap-2 border-b border-slate-900 pb-3 uppercase">
                      <Activity className="w-5 h-5 text-neon-pink" /> Broadcast Controls
                    </h2>

                    <div className="flex flex-col gap-6">
                      {/* Active Status Banner */}
                      <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-center font-mono">
                        <span className="text-xs text-slate-400 uppercase tracking-widest block">
                          Current Game Status
                        </span>
                        <span className={`text-2xl font-black tracking-widest ${
                          gameSettings.status === "playing"
                            ? "text-neon-green neon-text-green"
                            : gameSettings.status === "paused"
                            ? "text-neon-yellow"
                            : gameSettings.status === "ended"
                            ? "text-neon-red shadow-neon-red"
                            : "text-slate-400"
                        }`}>
                          {gameSettings.status.toUpperCase()}
                        </span>
                      </div>

                      {/* Primary Actions Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Start Button */}
                        <NeonButton
                          variant="green"
                          size="lg"
                          disabled={gameSettings.status === "playing" || gameSettings.status === "paused"}
                          onClick={adminStartGame}
                          className={gameSettings.status === "playing" || gameSettings.status === "paused" ? "opacity-30 cursor-not-allowed" : ""}
                        >
                          <Play className="w-5 h-5 fill-current" /> START BROADCAST
                        </NeonButton>

                        {/* Pause Button */}
                        <NeonButton
                          variant="purple"
                          size="lg"
                          disabled={gameSettings.status === "idle" || gameSettings.status === "ended"}
                          onClick={adminPauseGame}
                          className={gameSettings.status === "idle" || gameSettings.status === "ended" ? "opacity-30 cursor-not-allowed" : ""}
                        >
                          <Pause className="w-5 h-5" /> {gameSettings.status === "paused" ? "RESUME BROADCAST" : "PAUSE TELEMETRY"}
                        </NeonButton>

                        {/* Reset Button */}
                        <NeonButton variant="red" size="lg" onClick={adminResetGame}>
                          <RotateCcw className="w-5 h-5" /> RESET SESSION
                        </NeonButton>
                      </div>

                      <div className="p-4 rounded-xl bg-slate-950 border border-slate-900 text-xs text-slate-400 font-mono flex flex-col gap-2">
                        <span className="font-bold text-neon-pink flex items-center gap-1.5 uppercase">
                          <HelpCircle className="w-4 h-4" /> Telemetry Protocol Guide
                        </span>
                        <p>
                          1. **START BROADCAST** pushes all connected players from the Wait Lobby into the Puzzle Grid and fires their client countdowns.
                        </p>
                        <p>
                          2. **PAUSE TELEMETRY** blocks client grid interactions but preserves scores and clock values.
                        </p>
                        <p>
                          3. **RESET SESSION** returns the game status to IDLE, resets all team scores, and clears player grids to let a new round begin.
                        </p>
                      </div>
                    </div>
                  </GlassCard>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}

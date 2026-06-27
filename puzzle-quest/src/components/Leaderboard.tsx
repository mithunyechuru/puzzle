"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Users, CheckCircle2 } from "lucide-react";
import { useGameState, Team } from "../hooks/useGameState";

interface LeaderboardProps {
  className?: string;
  limit?: number;
}

export const Leaderboard: React.FC<LeaderboardProps> = ({ className = "", limit }) => {
  const { teams } = useGameState();

  // Sort teams by points descending
  const sortedTeams = [...teams].sort((a, b) => b.points - a.points);
  
  // Apply limit if specified
  const displayedTeams = limit ? sortedTeams.slice(0, limit) : sortedTeams;

  // Color scheme matching helper
  const getColorStyles = (color: string) => {
    switch (color) {
      case "blue":
        return "text-neon-blue border-neon-blue/30 bg-neon-blue/5 shadow-[0_0_10px_rgba(6,182,212,0.1)]";
      case "purple":
        return "text-neon-purple border-neon-purple/30 bg-neon-purple/5 shadow-[0_0_10px_rgba(168,85,247,0.1)]";
      case "pink":
        return "text-neon-pink border-neon-pink/30 bg-neon-pink/5 shadow-[0_0_10px_rgba(236,72,153,0.15)]";
      case "green":
        return "text-neon-green border-neon-green/30 bg-neon-green/5 shadow-[0_0_10px_rgba(16,185,129,0.1)]";
      default:
        return "text-slate-400 border-slate-800 bg-slate-900/40";
    }
  };

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Title */}
      <div className="flex items-center gap-2 mb-4">
        <Trophy className="w-5 h-5 text-amber-400 animate-bounce" />
        <h3 className="text-sm font-bold uppercase tracking-widest text-slate-300">
          Leaderboard
        </h3>
      </div>

      {teams.length === 0 ? (
        <div className="flex flex-col items-center justify-center flex-grow p-6 rounded-xl border border-slate-800 bg-slate-950/20 text-slate-500">
          <Users className="w-8 h-8 mb-2 opacity-50" />
          <p className="text-xs text-center font-mono">Waiting for teams to join...</p>
        </div>
      ) : (
        /* Team Listing */
        <div className="flex flex-col gap-2 overflow-y-auto max-h-[400px] pr-1">
          <AnimatePresence>
            {displayedTeams.map((team, index) => {
              const rank = index + 1;
              const isTop = rank === 1;

              // Rank decoration
              let rankStyle = "border-slate-800 text-slate-400 bg-slate-900/40";
              if (rank === 1) {
                rankStyle = "border-amber-400 text-amber-400 bg-amber-400/10 shadow-[0_0_12px_rgba(251,191,36,0.3)]";
              } else if (rank === 2) {
                rankStyle = "border-slate-300 text-slate-300 bg-slate-300/10 shadow-[0_0_10px_rgba(226,232,240,0.2)]";
              } else if (rank === 3) {
                rankStyle = "border-orange-500 text-orange-400 bg-orange-500/10 shadow-[0_0_10px_rgba(249,115,22,0.2)]";
              }

              const teamTheme = getColorStyles(team.color);

              // Percentage of grid completed
              const unlockedCells = team.gridState.filter(Boolean).length;
              const percentComplete = Math.round((unlockedCells / team.gridState.length) * 100);

              return (
                <motion.div
                  key={team.id}
                  layout
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{
                    type: "spring",
                    stiffness: 300,
                    damping: 30,
                    opacity: { duration: 0.2 }
                  }}
                  className={`
                    flex items-center justify-between rounded-xl border p-3.5 transition-all duration-300 glass-card
                    ${isTop ? "border-amber-400/40 bg-slate-950/65 shadow-[0_0_20px_rgba(251,191,36,0.08)]" : "border-slate-800/80 bg-slate-950/45"}
                  `}
                >
                  <div className="flex items-center gap-3">
                    {/* Rank Circle */}
                    <div className={`flex h-7 w-7 items-center justify-center rounded-full border text-xs font-bold font-mono ${rankStyle}`}>
                      {rank}
                    </div>

                    {/* Team Name and Stats */}
                    <div className="flex flex-col">
                      <div className="flex items-center gap-1.5">
                        <span className={`text-sm font-bold tracking-wide ${teamTheme.split(" ")[0]}`}>
                          {team.name}
                        </span>
                        {isTop && (
                          <span className="inline-flex items-center rounded bg-amber-400/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-amber-400 border border-amber-400/20">
                            Leader
                          </span>
                        )}
                      </div>
                      
                      {/* Members & Completion */}
                      <span className="text-[10px] text-slate-500 font-mono flex items-center gap-2 mt-0.5">
                        <span className="flex items-center gap-0.5">
                          <Users className="w-3 h-3" />
                          {team.members.length} {team.members.length === 1 ? "player" : "players"}
                        </span>
                        <span className="text-slate-600">•</span>
                        <span className="flex items-center gap-0.5 text-slate-400">
                          <CheckCircle2 className="w-3 h-3 text-neon-green" />
                          {percentComplete}% Solved
                        </span>
                      </span>
                    </div>
                  </div>

                  {/* Points */}
                  <div className="flex flex-col items-end">
                    <span className={`text-base font-extrabold font-mono tracking-wider ${teamTheme.split(" ")[0]} neon-text-${team.color}`}>
                      {team.points}
                    </span>
                    <span className="text-[9px] text-slate-500 uppercase tracking-widest font-mono">
                      PTS
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};

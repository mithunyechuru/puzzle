"use client";

import React from "react";
import { motion } from "framer-motion";
import { Lock, Unlock } from "lucide-react";
import { useGameState } from "../hooks/useGameState";

interface PuzzleGridProps {
  onCellClick: (index: number) => void;
  // If true, shows the current team's private grid. If false, shows the overall unified board.
  teamId?: string | null;
}

export const PuzzleGrid: React.FC<PuzzleGridProps> = ({ onCellClick, teamId }) => {
  const { gameSettings, teams, currentTeamId, activeLeftoverQuestion, submitLeftoverAnswer } = useGameState();
  const { gridSize, imageUrl } = gameSettings;

  const [submitting, setSubmitting] = React.useState(false);

  // Find the target team (either prop teamId or client player's team)
  const activeTeamId = teamId || currentTeamId;
  const team = teams.find((t) => t.id === activeTeamId);

  if (!team) {
    return (
      <div className="flex h-64 items-center justify-center rounded-xl border border-dashed border-slate-700 text-slate-400">
        No team found. Select a team to view the grid.
      </div>
    );
  }

  const handleOptionSelect = async (optionIdx: number) => {
    if (submitting) return;
    setSubmitting(true);
    await submitLeftoverAnswer(optionIdx);
    setSubmitting(false);
  };

  // If team is finished, show the solved state and leftover questions panel
  if (team.isFinished) {
    return (
      <div className="flex flex-col gap-6 w-full max-w-[500px] mx-auto">
        {/* Solved Revealed Puzzle Image */}
        <div 
          className="relative aspect-square w-full rounded-2xl border-2 border-neon-green overflow-hidden shadow-2xl"
          style={{ boxShadow: "0 0 25px rgba(16, 185, 129, 0.4)" }}
        >
          <img
            src={imageUrl}
            alt="Solved Puzzle"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent flex flex-col justify-end p-6">
            <span className="text-neon-green font-mono text-xs tracking-widest uppercase">Grid Cleared</span>
            <h3 className="text-xl font-bold text-white uppercase tracking-wider">Mission Accomplished</h3>
          </div>
        </div>

        {/* Leftover Question Area */}
        <div className="glass-card rounded-2xl border border-slate-800 p-6 flex flex-col gap-4 relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-neon-green/5 rounded-full blur-2xl" />
          
          <div className="border-b border-slate-800 pb-3 flex justify-between items-center">
            <h4 className="text-xs font-mono text-neon-green uppercase tracking-widest font-bold">
              🚀 Leftover Question Multiplier
            </h4>
            <span className="text-[10px] text-slate-500 font-mono">
              +200 pts bonus
            </span>
          </div>

          {activeLeftoverQuestion ? (
            <div className="flex flex-col gap-4">
              <div className="flex justify-between items-center">
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-neon-blue/15 text-neon-blue border border-neon-blue/20 uppercase">
                  {activeLeftoverQuestion.category}
                </span>
                <span className="text-xs font-mono text-neon-pink font-semibold">
                  {activeLeftoverQuestion.secondsLeft}s remaining
                </span>
              </div>

              <h4 className="text-sm font-semibold text-slate-100 leading-relaxed">
                {activeLeftoverQuestion.text}
              </h4>

              {/* Progress bar */}
              <div className="w-full h-1 bg-slate-900 rounded-full overflow-hidden">
                <div
                  className="h-full bg-neon-pink transition-all duration-1000 ease-linear"
                  style={{ width: `${(activeLeftoverQuestion.secondsLeft / 60) * 100}%` }}
                />
              </div>

              <div className="grid grid-cols-1 gap-2 mt-2">
                {activeLeftoverQuestion.options.map((option, oIdx) => (
                  <button
                    key={oIdx}
                    onClick={() => handleOptionSelect(oIdx)}
                    disabled={submitting}
                    className="w-full py-2.5 px-4 rounded-xl border border-slate-850 bg-slate-950/40 hover:bg-slate-900/60 hover:border-neon-blue/40 text-left text-xs text-slate-300 hover:text-white transition-all duration-300 cursor-pointer disabled:opacity-50"
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-6 text-center">
              <div className="w-8 h-8 rounded-full border-2 border-t-neon-green border-r-transparent border-b-transparent border-l-transparent animate-spin mb-3" />
              <span className="text-xs font-mono text-slate-400 tracking-wider">
                SCANNING FOR PUZZLE DEBRIS...
              </span>
              <p className="text-[10px] text-slate-600 mt-1 max-w-[280px]">
                Waiting for the next available leftover question. Priority queue is based on grid clearance speed.
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  const gridCellsCount = gridSize * gridSize;

  // Get grid dimensions template
  const gridStyle = {
    gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))`,
    gridTemplateRows: `repeat(${gridSize}, minmax(0, 1fr))`
  };

  // Color mappings
  const colorMap = {
    blue: {
      border: "border-neon-blue",
      shadow: "shadow-neon-blue",
      glow: "rgba(6, 182, 212, 0.4)"
    },
    purple: {
      border: "border-neon-purple",
      shadow: "shadow-neon-purple",
      glow: "rgba(168, 85, 247, 0.4)"
    },
    pink: {
      border: "border-neon-pink",
      shadow: "shadow-neon-pink",
      glow: "rgba(236, 72, 153, 0.4)"
    },
    green: {
      border: "border-neon-green",
      shadow: "shadow-neon-green",
      glow: "rgba(16, 185, 129, 0.4)"
    },
    red: {
      border: "border-neon-red",
      shadow: "shadow-neon-red",
      glow: "rgba(239, 68, 68, 0.4)"
    }
  };

  const activeColor = colorMap[team.color as keyof typeof colorMap] || colorMap.blue;

  return (
    <div className="relative mx-auto aspect-square w-full max-w-[500px]">
      {/* Blurred background image backdrop representing the target solution */}
      <div
        className="absolute inset-0 rounded-2xl bg-cover bg-center opacity-10 blur-[12px] transition-all duration-700 pointer-events-none border border-slate-800"
        style={{ backgroundImage: `url(${imageUrl})` }}
      />

      {/* Interactive Grid container */}
      <div
        className="relative grid h-full w-full gap-2 rounded-2xl border border-slate-800 bg-slate-950/60 p-2 shadow-2xl overflow-hidden"
        style={gridStyle}
      >
        {Array.from({ length: gridCellsCount }).map((_, idx) => {
          const isUnlocked = team.gridState[idx];

          // Calculate position
          const row = Math.floor(idx / gridSize);
          const col = idx % gridSize;

          // CSS Background calculations
          const bgSizeX = gridSize * 100;
          const bgSizeY = gridSize * 100;
          const bgPosX = gridSize > 1 ? (col / (gridSize - 1)) * 100 : 0;
          const bgPosY = gridSize > 1 ? (row / (gridSize - 1)) * 100 : 0;

          return (
            <div key={idx} className="relative w-full h-full">
              {isUnlocked ? (
                // UNLOCKED CELL: Reveals the corresponding sub-slice of image
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 150, damping: 12 }}
                  className={`w-full h-full rounded-lg bg-no-repeat overflow-hidden border-2 ${activeColor.border} relative`}
                  style={{
                    backgroundImage: `url(${imageUrl})`,
                    backgroundSize: `${bgSizeX}% ${bgSizeY}%`,
                    backgroundPosition: `${bgPosX}% ${bgPosY}%`,
                    boxShadow: `0 0 15px ${activeColor.glow}`
                  }}
                >
                  {/* Neon scan lines or check indicators */}
                  <div className="absolute top-1 right-1 rounded-full bg-slate-950/80 p-0.5 border border-white/20">
                    <Unlock className={`w-3 h-3 text-neon-green`} />
                  </div>
                </motion.div>
              ) : (
                // LOCKED CELL: Frosted glass shimmer pattern
                <motion.button
                  whileHover={{ scale: 1.025, zIndex: 10 }}
                  onClick={() => onCellClick(idx)}
                  className="w-full h-full rounded-lg glass-card flex flex-col items-center justify-center cursor-pointer relative overflow-hidden transition-all duration-300 border border-slate-800/80 hover:border-neon-blue/40 hover:bg-slate-900/60 group"
                >
                  {/* Shimmer background animation */}
                  <span className="absolute inset-0 w-full h-full pointer-events-none">
                    <span className="absolute block w-[200%] h-full top-0 left-[-100%] bg-gradient-to-r from-transparent via-white/5 to-transparent -skew-x-12 animate-[shimmer_3s_infinite_linear]" />
                  </span>

                  <Lock className="w-5 h-5 text-slate-500 group-hover:text-neon-blue transition-colors duration-300 group-hover:scale-110" />
                  <span className="text-[10px] text-slate-600 mt-1 font-mono tracking-widest group-hover:text-neon-blue/80 transition-colors duration-300">
                    {row + 1}-{col + 1}
                  </span>
                </motion.button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Timer, AlertTriangle, CheckCircle, XCircle, RefreshCw } from "lucide-react";
import { useGameState } from "../hooks/useGameState";

export const QuestionModal: React.FC = () => {
  const { activeQuestion, submitAnswer, closeQuestionModal } = useGameState();
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<"correct" | "incorrect" | null>(null);
  const [shake, setShake] = useState(false);

  useEffect(() => {
    // Reset local states when activeQuestion changes
    setSelectedOption(null);
    setFeedback(null);
    setShake(false);
  }, [activeQuestion?.question.id]);

  if (!activeQuestion) return null;

  const { question, secondsLeft, attemptsLeft } = activeQuestion;
  const totalTime = 60; // Backend-driven question timer limit is exactly 60 seconds
  const timerPercentage = (secondsLeft / totalTime) * 100;

  // Timer Bar Color Logic
  let timerColor = "bg-neon-green shadow-[0_0_10px_#10b981]";
  if (timerPercentage <= 25) {
    timerColor = "bg-neon-red shadow-[0_0_10px_#ef4444]";
  } else if (timerPercentage <= 50) {
    timerColor = "bg-neon-yellow shadow-[0_0_10px_#f59e0b]";
  }

  const handleOptionClick = async (idx: number) => {
    if (feedback === "correct" || selectedOption !== null) return;

    setSelectedOption(idx);
    
    // Await the asynchronous answer verification from the server
    const result = await submitAnswer(idx);

    if (result.isCorrect) {
      setFeedback("correct");
    } else {
      setFeedback("incorrect");
      setShake(true);
      setTimeout(() => setShake(false), 400);

      // Let user retry after a short delay if attempts remain
      setTimeout(() => {
        if (result.attemptsLeft > 0) {
          setSelectedOption(null);
          setFeedback(null);
        }
      }, 1000);
    }
  };

  const getDifficultyStyles = (diff: string) => {
    switch (diff) {
      case "Easy":
        return "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30";
      case "Medium":
        return "bg-amber-500/10 text-amber-400 border border-amber-500/30";
      case "Hard":
        return "bg-rose-500/10 text-rose-400 border border-rose-500/30";
      default:
        return "bg-slate-500/10 text-slate-400 border border-slate-500/30";
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
      <AnimatePresence>
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className={`relative w-full max-w-lg overflow-hidden rounded-2xl glass-card border border-slate-700/60 p-6 shadow-2xl ${
            shake ? "shake-animation" : ""
          } ${
            feedback === "correct"
              ? "shadow-[0_0_40px_rgba(16,185,129,0.25)] border-neon-green/40"
              : feedback === "incorrect"
              ? "shadow-[0_0_40px_rgba(239,68,68,0.25)] border-neon-red/40"
              : ""
          }`}
        >
          {/* Top Timer Progress Bar */}
          <div className="absolute top-0 left-0 h-1.5 w-full bg-slate-800">
            <motion.div
              initial={{ width: "100%" }}
              animate={{ width: `${timerPercentage}%` }}
              transition={{ duration: 1, ease: "linear" }}
              className={`h-full transition-colors duration-500 ${timerColor}`}
            />
          </div>

          {/* Header */}
          <div className="mb-6 mt-2 flex items-center justify-between">
            <div className="flex gap-2">
              <span className="rounded-md bg-neon-blue/10 px-2.5 py-1 text-xs font-semibold tracking-wider text-neon-blue border border-neon-blue/20">
                {question.category}
              </span>
              <span className={`rounded-md px-2.5 py-1 text-xs font-semibold tracking-wider ${getDifficultyStyles(question.difficulty)}`}>
                {question.difficulty}
              </span>
            </div>

            <div className="flex items-center gap-1.5 text-slate-400 font-mono text-sm">
              <Timer className="w-4 h-4 text-neon-blue animate-[pulse_1s_infinite]" />
              <span className={secondsLeft <= 10 ? "text-neon-red font-bold animate-[pulse_0.5s_infinite]" : ""}>{secondsLeft}s</span>
            </div>
          </div>

          {/* Question Text */}
          <h2 className="mb-6 text-lg font-bold leading-relaxed text-slate-100">
            {question.text}
          </h2>

          {/* Option Grid */}
          <div className="grid grid-cols-1 gap-3">
            {question.options.map((option, idx) => {
              const isSelected = selectedOption === idx;
              let btnStyle = "border-slate-800 bg-slate-900/40 text-slate-300 hover:border-neon-blue/40 hover:bg-slate-900/80 hover:text-white";
              let icon = null;

              if (isSelected) {
                if (feedback === "correct") {
                  btnStyle = "border-neon-green bg-neon-green/10 text-neon-green shadow-neon-green";
                  icon = <CheckCircle className="w-5 h-5 text-neon-green" />;
                } else if (feedback === "incorrect") {
                  btnStyle = "border-neon-red bg-neon-red/10 text-neon-red shadow-neon-red";
                  icon = <XCircle className="w-5 h-5 text-neon-red animate-[shake_0.2s]" />;
                }
              }

              return (
                <motion.button
                  key={idx}
                  whileHover={feedback === null ? { scale: 1.02, x: 4 } : {}}
                  whileTap={feedback === null ? { scale: 0.99 } : {}}
                  onClick={() => handleOptionClick(idx)}
                  disabled={feedback !== null || selectedOption !== null}
                  className={`w-full flex items-center justify-between rounded-xl border p-4 text-left font-medium transition-all duration-300 cursor-pointer ${btnStyle}`}
                >
                  <span className="flex items-center gap-3">
                    <span className="flex h-6 w-6 items-center justify-center rounded-md bg-slate-800 text-xs font-bold text-slate-400 group-hover:text-neon-blue">
                      {String.fromCharCode(65 + idx)}
                    </span>
                    {option}
                  </span>
                  {icon}
                </motion.button>
              );
            })}
          </div>

          {/* Footer Info / Retries */}
          <div className="mt-6 flex items-center justify-between border-t border-slate-800/80 pt-4 text-xs">
            <div className="flex items-center gap-1.5 text-slate-400 font-medium">
              <RefreshCw className="w-3.5 h-3.5 text-neon-pink" />
              <span>
                {attemptsLeft > 0 ? (
                  <span className="text-neon-pink font-semibold">{attemptsLeft} / 3 attempts remaining</span>
                ) : (
                  <span className="text-neon-red font-semibold">Grid locked! Points docked.</span>
                )}
              </span>
            </div>

            <button
              onClick={closeQuestionModal}
              className="text-slate-500 hover:text-slate-300 font-semibold tracking-wider uppercase transition-colors"
            >
              Skip Block
            </button>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

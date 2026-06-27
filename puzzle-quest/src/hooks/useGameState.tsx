"use client";

import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import confetti from "canvas-confetti";
import socket from "@/lib/socket";

// Types
export interface Question {
  id: string;
  category: string;
  difficulty: "Easy" | "Medium" | "Hard";
  text: string;
  options: string[];
  correctAnswer?: number; // Optional, as backend strips it for security
}

export interface Player {
  name: string;
  isMe: boolean;
}

export interface Team {
  id: string;
  name: string;
  members: string[];
  points: number;
  gridState: boolean[]; // Array representing locked (false) or unlocked (true) cells
  color: string; // Tailwind color name like 'blue', 'purple', 'pink', 'green'
  rawMembers?: any[]; // Keep the raw members list with their answers
  isFinished?: boolean;
}

export interface GameSettings {
  status: "idle" | "playing" | "paused" | "ended";
  gridSize: number; // 3 (3x3), 4 (4x4), 5 (5x5)
  imageUrl: string;
  duration: number; // Game length in seconds (default 300)
  timer: number; // Remaining time in seconds
  simulateBots: boolean; // Admin can toggle bot simulation
}

interface GameState {
  gameSettings: GameSettings;
  teams: Team[];
  questions: Question[];
  currentTeamId: string | null;
  playerName: string | null;
  isAdmin: boolean;
  activeQuestion: {
    cellIndex: number;
    question: Question;
    secondsLeft: number;
    attemptsLeft: number;
  } | null;
  activeLeftoverQuestion: {
    id: string;
    category: string;
    difficulty: string;
    text: string;
    options: string[];
    secondsLeft: number;
  } | null;
}

interface GameContextType extends GameState {
  createTeam: (playerName: string, teamName: string) => void;
  joinTeam: (playerName: string, teamCode: string) => Promise<boolean>;
  enterAsAdmin: () => void;
  leaveGame: () => void;
  startQuestion: (cellIndex: number) => void;
  submitAnswer: (optionIndex: number) => Promise<{ isCorrect: boolean; attemptsLeft: number }>;
  closeQuestionModal: () => void;
  submitLeftoverAnswer: (optionIndex: number) => Promise<{ isCorrect: boolean }>;
  adminStartGame: () => void;
  adminPauseGame: () => void;
  adminResetGame: () => void;
  adminUpdateSettings: (settings: Partial<GameSettings>) => void;
  adminResetGridCell: (teamId: string, cellIndex: number) => void;
  adminUpdateQuestions: (questions: Question[]) => void;
}

const DEFAULT_QUESTIONS: Question[] = [
  {
    id: "q1",
    category: "Tech",
    difficulty: "Easy",
    text: "What does HTML stand for?",
    options: [
      "Hypertext Markup Language",
      "Hyperlink and Text Markup Language",
      "Home Tool Markup Language",
      "Hypertech Modern Makeup Language"
    ]
  }
];

const GameContext = createContext<GameContextType | undefined>(undefined);

// Helper to map backend team object to frontend format
const mapBackendTeam = (bTeam: any, gridSize: number): Team => {
  const gridState = Array(gridSize * gridSize).fill(false);
  if (bTeam.unlockedBlocks) {
    bTeam.unlockedBlocks.forEach((idx: number) => {
      if (idx < gridState.length) {
        gridState[idx] = true;
      }
    });
  }
  return {
    id: bTeam.teamCode,
    name: bTeam.teamName,
    members: bTeam.members.map((m: any) => m.playerName),
    points: bTeam.points,
    gridState,
    color: bTeam.color || "blue",
    rawMembers: bTeam.members,
    isFinished: bTeam.isFinished
  };
};

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 1. Initial State
  const [gameSettings, setGameSettings] = useState<GameSettings>({
    status: "idle",
    gridSize: 4,
    imageUrl: "/puzzle-default.png",
    duration: 300,
    timer: 300,
    simulateBots: false
  });

  const [teams, setTeams] = useState<Team[]>([]);
  const [questions, setQuestions] = useState<Question[]>(DEFAULT_QUESTIONS);
  const [currentTeamId, setCurrentTeamId] = useState<string | null>(null);
  const [playerName, setPlayerName] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [activeQuestion, setActiveQuestion] = useState<GameState["activeQuestion"]>(null);
  const [activeLeftoverQuestion, setActiveLeftoverQuestion] = useState<GameState["activeLeftoverQuestion"]>(null);

  // Sync refs to prevent stale closure issues
  const gameSettingsRef = useRef<GameSettings>(gameSettings);
  const teamsRef = useRef<Team[]>(teams);
  const currentTeamIdRef = useRef<string | null>(currentTeamId);
  const playerNameRef = useRef<string | null>(playerName);

  useEffect(() => {
    gameSettingsRef.current = gameSettings;
  }, [gameSettings]);

  useEffect(() => {
    teamsRef.current = teams;
  }, [teams]);

  useEffect(() => {
    currentTeamIdRef.current = currentTeamId;
  }, [currentTeamId]);

  useEffect(() => {
    playerNameRef.current = playerName;
  }, [playerName]);

  // Load client settings on mount & auto-reconnect to team on backend
  useEffect(() => {
    const savedName = localStorage.getItem("pq_player_name");
    const savedTeamId = localStorage.getItem("pq_team_id");
    const savedIsAdmin = localStorage.getItem("pq_is_admin") === "true";

    if (savedIsAdmin) {
      setIsAdmin(true);
      setPlayerName("Game Director");
    } else if (savedName && savedTeamId) {
      setPlayerName(savedName);
      setCurrentTeamId(savedTeamId);

      socket.emit("join_team", { playerName: savedName, teamCode: savedTeamId }, (response: any) => {
        if (!response.success) {
          console.warn("Auto-rejoin failed:", response.error);
          localStorage.removeItem("pq_player_name");
          localStorage.removeItem("pq_team_id");
          setPlayerName(null);
          setCurrentTeamId(null);
        }
      });
    }
  }, []);

  // 2. Socket.io Listeners Setup
  useEffect(() => {
    socket.on("game_started", (data: any) => {
      setGameSettings((prev) => ({
        ...prev,
        status: data.isStarted ? (data.isPaused ? "paused" : "playing") : "idle",
        timer: data.settings ? data.settings.timer : prev.timer,
        simulateBots: data.settings ? data.settings.simulateBots : prev.simulateBots,
        gridSize: data.settings ? data.settings.gridSize : prev.gridSize,
        duration: data.settings ? data.settings.duration : prev.duration
      }));
    });

    socket.on("timer_sync", ({ timer }: { timer: number }) => {
      setGameSettings((prev) => ({
        ...prev,
        timer
      }));
    });

    socket.on("game_ended", (data: any) => {
      setGameSettings((prev) => ({
        ...prev,
        status: "ended",
        timer: 0
      }));
    });

    socket.on("settings_updated", (settings: any) => {
      setGameSettings((prev) => ({
        ...prev,
        ...settings
      }));
    });

    socket.on("question_assigned", (data: any) => {
      setQuestions(data.questions);
    });

    socket.on("team_updated", (updatedTeam: any) => {
      setTeams((prev) => {
        const mapped = mapBackendTeam(updatedTeam, gameSettingsRef.current.gridSize);
        const exists = prev.some((t) => t.id === mapped.id);
        if (exists) {
          return prev.map((t) => (t.id === mapped.id ? mapped : t));
        }
        return [...prev, mapped];
      });
    });

    socket.on("team_deleted", ({ teamCode }: { teamCode: string }) => {
      setTeams((prev) => prev.filter((t) => t.id !== teamCode));
      if (currentTeamIdRef.current === teamCode) {
        leaveGame();
      }
    });

    socket.on("block_unlocked", (data: any) => {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    });

    socket.on("question_timer_sync", ({ blockIndex, secondsLeft }: { blockIndex: number; secondsLeft: number }) => {
      setActiveQuestion((prev) => {
        if (prev && prev.cellIndex === blockIndex) {
          return {
            ...prev,
            secondsLeft
          };
        }
        return prev;
      });
    });

    socket.on("question_expired", ({ blockIndex }: { blockIndex: number }) => {
      setActiveQuestion((prev) => {
        if (prev && prev.cellIndex === blockIndex) {
          alert("Time limit exceeded (60 seconds)!");
          return null;
        }
        return prev;
      });
    });

    // Leftovers events listeners
    socket.on("leftover_assigned", ({ question, secondsLeft }: any) => {
      setActiveLeftoverQuestion({
        ...question,
        secondsLeft
      });
    });

    socket.on("leftover_timer_sync", ({ questionId, secondsLeft }: any) => {
      setActiveLeftoverQuestion((prev) => {
        if (prev && prev.id === questionId) {
          return { ...prev, secondsLeft };
        }
        return prev;
      });
    });

    socket.on("leftover_expired", ({ questionId }: any) => {
      setActiveLeftoverQuestion((prev) => {
        if (prev && prev.id === questionId) {
          alert("Leftover question expired! Passed to another team.");
          return null;
        }
        return prev;
      });
    });

    return () => {
      socket.off("game_started");
      socket.off("timer_sync");
      socket.off("game_ended");
      socket.off("settings_updated");
      socket.off("question_assigned");
      socket.off("team_updated");
      socket.off("team_deleted");
      socket.off("block_unlocked");
      socket.off("question_timer_sync");
      socket.off("question_expired");
      socket.off("leftover_assigned");
      socket.off("leftover_timer_sync");
      socket.off("leftover_expired");
    };
  }, []);

  // 4. Actions Implementation

  // Create Team
  const createTeam = (pName: string, tName: string) => {
    socket.emit("create_team", { playerName: pName, teamName: tName }, (response: any) => {
      if (response.success) {
        setPlayerName(pName);
        setCurrentTeamId(response.team.teamCode);
        setIsAdmin(false);

        localStorage.setItem("pq_player_name", pName);
        localStorage.setItem("pq_team_id", response.team.teamCode);
        localStorage.setItem("pq_is_admin", "false");
      } else {
        alert(`Failed to create team: ${response.error}`);
      }
    });
  };

  // Join Team
  const joinTeam = (pName: string, teamCode: string): Promise<boolean> => {
    return new Promise((resolve) => {
      socket.emit("join_team", { playerName: pName, teamCode }, (response: any) => {
        if (response.success) {
          setPlayerName(pName);
          setCurrentTeamId(response.team.teamCode);
          setIsAdmin(false);

          localStorage.setItem("pq_player_name", pName);
          localStorage.setItem("pq_team_id", response.team.teamCode);
          localStorage.setItem("pq_is_admin", "false");
          resolve(true);
        } else {
          alert(`Failed to join team: ${response.error}`);
          resolve(false);
        }
      });
    });
  };

  // Enter as Admin
  const enterAsAdmin = () => {
    setIsAdmin(true);
    setPlayerName("Game Director");
    setCurrentTeamId(null);
    localStorage.setItem("pq_is_admin", "true");
    localStorage.setItem("pq_player_name", "Game Director");
    localStorage.removeItem("pq_team_id");
  };

  // Leave Game
  const leaveGame = () => {
    setPlayerName(null);
    setCurrentTeamId(null);
    setIsAdmin(false);
    setActiveLeftoverQuestion(null);
    localStorage.removeItem("pq_player_name");
    localStorage.removeItem("pq_team_id");
    localStorage.removeItem("pq_is_admin");
  };

  // Start Question Modal (Grid click)
  const startQuestion = (cellIndex: number) => {
    if (gameSettings.status !== "playing") return;
    if (!currentTeamId) return;

    const team = teams.find((t) => t.id === currentTeamId);
    if (!team) return;
    if (team.gridState[cellIndex]) return;

    const myMember = team.rawMembers?.find((m: any) => m.playerName === playerName);
    if (myMember?.answers && myMember.answers[cellIndex]?.isCorrect) {
      alert("You have already answered this block correctly! Waiting for team members.");
      return;
    }

    socket.emit(
      "start_question",
      { teamCode: currentTeamId, playerName, blockIndex: cellIndex },
      (response: any) => {
        if (response.success) {
          setActiveQuestion({
            cellIndex,
            question: response.question,
            secondsLeft: response.secondsLeft,
            attemptsLeft: response.attemptsRemaining
          });
        } else {
          alert(`Failed to start question: ${response.error}`);
        }
      }
    );
  };

  // Submit Answer in Modal
  const submitAnswer = (optionIndex: number): Promise<{ isCorrect: boolean; attemptsLeft: number }> => {
    return new Promise((resolve) => {
      if (!activeQuestion || !currentTeamId || !playerName) {
        resolve({ isCorrect: false, attemptsLeft: 0 });
        return;
      }

      socket.emit(
        "submit_answer",
        {
          teamCode: currentTeamId,
          playerName,
          blockIndex: activeQuestion.cellIndex,
          answerIndex: optionIndex
        },
        (response: any) => {
          if (response && response.success) {
            if (response.isCorrect) {
              confetti({
                particleCount: 80,
                spread: 60,
                origin: { y: 0.6 }
              });
              setActiveQuestion(null);
              resolve({ isCorrect: true, attemptsLeft: 0 });
            } else {
              const attemptsLeft = response.attemptsRemaining;
              if (attemptsLeft <= 0) {
                alert("Out of attempts! A new question has been assigned.");
                setActiveQuestion(null);
              } else {
                setActiveQuestion((prev) => {
                  if (!prev) return null;
                  return { ...prev, attemptsLeft };
                });
              }
              resolve({ isCorrect: false, attemptsLeft });
            }
          } else {
            alert(`Submission failed: ${response?.error || "Unknown error"}`);
            setActiveQuestion(null);
            resolve({ isCorrect: false, attemptsLeft: 0 });
          }
        }
      );
    });
  };

  // Submit leftover answer
  const submitLeftoverAnswer = (optionIndex: number): Promise<{ isCorrect: boolean }> => {
    return new Promise((resolve) => {
      if (!activeLeftoverQuestion || !currentTeamId || !playerName) {
        resolve({ isCorrect: false });
        return;
      }

      socket.emit(
        "submit_leftover_answer",
        {
          teamCode: currentTeamId,
          playerName,
          questionId: activeLeftoverQuestion.id,
          answerIndex: optionIndex
        },
        (response: any) => {
          if (response && response.success) {
            if (response.isCorrect) {
              confetti({
                particleCount: 120,
                spread: 80,
                origin: { y: 0.6 }
              });
              setActiveLeftoverQuestion(null);
              resolve({ isCorrect: true });
            } else {
              alert("Answer incorrect! Leftover question passed to another team.");
              setActiveLeftoverQuestion(null);
              resolve({ isCorrect: false });
            }
          } else {
            alert(`Leftover submission failed: ${response?.error || "Unknown error"}`);
            setActiveLeftoverQuestion(null);
            resolve({ isCorrect: false });
          }
        }
      );
    });
  };

  const closeQuestionModal = () => {
    setActiveQuestion(null);
  };

  // Admin Actions
  const adminStartGame = () => {
    socket.emit("start_game", (response: any) => {
      if (!response.success) {
        alert(`Failed to start game: ${response.error}`);
      }
    });
  };

  const adminPauseGame = () => {
    socket.emit("admin_pause_game", (response: any) => {
      if (!response.success) {
        alert(`Failed to pause game: ${response.error}`);
      }
    });
  };

  const adminResetGame = () => {
    socket.emit("admin_reset_game", (response: any) => {
      if (!response.success) {
        alert(`Failed to reset game: ${response.error}`);
      }
    });
  };

  const adminUpdateSettings = (settings: Partial<GameSettings>) => {
    socket.emit("admin_update_settings", settings, (response: any) => {
      if (!response.success) {
        alert(`Failed to update settings: ${response.error}`);
      }
    });
  };

  const adminResetGridCell = (teamId: string, cellIndex: number) => {
    socket.emit("admin_reset_grid_cell", { teamCode: teamId, blockIndex: cellIndex }, (response: any) => {
      if (!response.success) {
        alert(`Failed to reset cell: ${response.error}`);
      }
    });
  };

  const adminUpdateQuestions = (newQuestions: Question[]) => {
    setQuestions(newQuestions);
  };

  return (
    <GameContext.Provider
      value={{
        gameSettings,
        teams,
        questions,
        currentTeamId,
        playerName,
        isAdmin,
        activeQuestion,
        activeLeftoverQuestion,
        createTeam,
        joinTeam,
        enterAsAdmin,
        leaveGame,
        startQuestion,
        submitAnswer,
        closeQuestionModal,
        submitLeftoverAnswer,
        adminStartGame,
        adminPauseGame,
        adminResetGame,
        adminUpdateSettings,
        adminResetGridCell,
        adminUpdateQuestions
      }}
    >
      {children}
    </GameContext.Provider>
  );
};

export const useGameState = () => {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error("useGameState must be used within a GameProvider");
  }
  return context;
};

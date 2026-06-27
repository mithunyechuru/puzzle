const { puzzleA, puzzleB } = require("./config");

// In-Memory Database
const teams = {}; // Keyed by teamCode
const gameState = {
  isStarted: false,
  isPaused: false,
  puzzles: {
    A: puzzleA,
    B: puzzleB
  },
  leaderboard: [],
  settings: {
    gridSize: 4,
    imageUrl: "/puzzle-default.png",
    duration: 300,
    timer: 300,
    simulateBots: true
  },
  leftoverQueue: [] // Key leftover question structures
};

let gameStartTime = null;

// Helper to generate unique team code (4 uppercase letters)
function generateTeamCode() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let code;
  do {
    code = "";
    for (let i = 0; i < 4; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
  } while (teams[code]);
  return code;
}

// Create team
function createTeam(playerName, teamName, socketId) {
  if (!playerName || !teamName) {
    throw new Error("Player name and Team name are required");
  }

  const teamCode = generateTeamCode();
  const puzzleAssigned = Math.random() < 0.5 ? "A" : "B";
  const colors = ["blue", "purple", "pink", "green"];
  const color = colors[Object.keys(teams).length % colors.length];

  const newTeam = {
    teamCode,
    teamName,
    members: [
      {
        socketId,
        playerName,
        answers: {}, // blockIndex -> { isCorrect: boolean, answeredAt: number, questionId }
        attempts: {}, // blockIndex -> total attempts used on current question
        failedQuestionIds: [], // question IDs this player has exhausted attempts on
        currentQuestionId: {}, // blockIndex -> current assigned question ID
        activeQuestion: null, // { blockIndex, questionId, difficulty, attemptsRemaining, startTime, endTime }
        memberDifficultyIndex: 0 // 0=Easy, 1=Medium, 2=Hard
      }
    ],
    points: 0,
    puzzleAssigned,
    unlockedBlocks: [], // track list of unlocked block indices
    color,
    isFinished: false,
    finishedAt: null,
    activeLeftoverQuestion: null
  };

  teams[teamCode] = newTeam;
  updateLeaderboard();

  return newTeam;
}

// Join team
function joinTeam(playerName, teamCode, socketId) {
  if (!playerName || !teamCode) {
    throw new Error("Player name and Team code are required");
  }

  const code = teamCode.trim().toUpperCase();
  const team = teams[code];

  if (!team) {
    throw new Error("Team not found");
  }

  if (team.members.length >= 3) {
    throw new Error("Team is full (maximum 3 members)");
  }

  // Prevent duplicate player names within the same team
  const nameExists = team.members.some(
    (m) => m.playerName.toLowerCase() === playerName.toLowerCase()
  );
  if (nameExists) {
    throw new Error("Name already taken in this team");
  }

  team.members.push({
    socketId,
    playerName,
    answers: {},
    attempts: {},
    failedQuestionIds: [],
    currentQuestionId: {},
    activeQuestion: null,
    memberDifficultyIndex: 0
  });

  updateLeaderboard();
  return team;
}

// Start game
function startGame() {
  if (gameState.isStarted) {
    return false;
  }
  gameState.isStarted = true;
  gameState.isPaused = false;
  gameState.settings.timer = gameState.settings.duration;
  gameStartTime = Date.now();
  return true;
}

// Pause / Resume game
function togglePauseGame() {
  if (!gameState.isStarted) return false;
  gameState.isPaused = !gameState.isPaused;
  return true;
}

// Reset game session
function resetGame() {
  gameState.isStarted = false;
  gameState.isPaused = false;
  gameState.settings.timer = gameState.settings.duration;
  gameStartTime = null;
  gameState.leftoverQueue = [];

  // Reset all teams' points, answers, and unlocked status
  for (const code in teams) {
    teams[code].points = 0;
    teams[code].unlockedBlocks = [];
    teams[code].isFinished = false;
    teams[code].finishedAt = null;
    teams[code].activeLeftoverQuestion = null;
    teams[code].members.forEach((m) => {
      m.answers = {};
      m.attempts = {};
      m.failedQuestionIds = [];
      m.currentQuestionId = {};
      m.activeQuestion = null;
      m.memberDifficultyIndex = 0;
    });
  }

  updateLeaderboard();
}

// Update game settings
function updateSettings(newSettings) {
  gameState.settings = {
    ...gameState.settings,
    ...newSettings
  };
  if (newSettings.duration !== undefined) {
    gameState.settings.timer = newSettings.duration;
  }
  return gameState.settings;
}

// Populate leftover question queue
function populateLeftoverQueue(team) {
  const puzzleSet = team.puzzleAssigned === "A" ? gameState.puzzles.A : gameState.puzzles.B;
  const solvedIds = team.members.flatMap((m) => Object.values(m.answers).map((a) => a.questionId)).filter(Boolean);

  puzzleSet.forEach((q) => {
    if (!solvedIds.includes(q.id)) {
      const exists = gameState.leftoverQueue.some((lq) => lq.questionId === q.id);
      if (!exists) {
        gameState.leftoverQueue.push({
          questionId: q.id,
          puzzleType: team.puzzleAssigned,
          questionObj: q,
          attemptedByTeams: [],
          assignedTo: null,
          isSolved: false,
          startTime: null,
          endTime: null
        });
      }
    }
  });
}

// Assign leftover questions to finished teams based on priority
function assignLeftoverQuestions() {
  const finishedTeams = Object.values(teams)
    .filter((t) => t.isFinished)
    .sort((a, b) => a.finishedAt - b.finishedAt);

  finishedTeams.forEach((team) => {
    // If team already has an active assignment, skip
    const currentAssignment = gameState.leftoverQueue.find(
      (lq) => lq.assignedTo === team.teamCode && !lq.isSolved
    );
    
    if (currentAssignment) {
      team.activeLeftoverQuestion = {
        id: currentAssignment.questionObj.id,
        category: currentAssignment.questionObj.category,
        difficulty: currentAssignment.questionObj.difficulty,
        text: currentAssignment.questionObj.text,
        options: currentAssignment.questionObj.options,
        secondsLeft: Math.max(0, Math.ceil((currentAssignment.endTime - Date.now()) / 1000))
      };
      return;
    }

    // Find first unassigned, unsolved question not attempted by this team
    const nextQ = gameState.leftoverQueue.find(
      (lq) =>
        !lq.isSolved &&
        lq.assignedTo === null &&
        !lq.attemptedByTeams.includes(team.teamCode)
    );

    if (nextQ) {
      nextQ.assignedTo = team.teamCode;
      nextQ.startTime = Date.now();
      nextQ.endTime = Date.now() + 60000;

      team.activeLeftoverQuestion = {
        id: nextQ.questionObj.id,
        category: nextQ.questionObj.category,
        difficulty: nextQ.questionObj.difficulty,
        text: nextQ.questionObj.text,
        options: nextQ.questionObj.options,
        secondsLeft: 60
      };
      console.log(`Leftover question ${nextQ.questionId} assigned to team ${team.teamCode}`);
    } else {
      team.activeLeftoverQuestion = null;
    }
  });
}

// Submit leftover question answer
function submitLeftoverAnswer(teamCode, playerName, questionId, answerIndex) {
  if (!gameState.isStarted || gameState.isPaused) {
    throw new Error("Game is not active");
  }

  const team = teams[teamCode];
  if (!team) {
    throw new Error("Team not found");
  }

  const lq = gameState.leftoverQueue.find(
    (q) => q.questionId === questionId && q.assignedTo === teamCode && !q.isSolved
  );
  if (!lq) {
    throw new Error("No active leftover question assigned to this team");
  }

  const now = Date.now();
  if (now > lq.endTime) {
    lq.attemptedByTeams.push(teamCode);
    lq.assignedTo = null;
    team.activeLeftoverQuestion = null;
    assignLeftoverQuestions();
    updateLeaderboard();
    throw new Error("Time limit exceeded");
  }

  const isCorrect = lq.questionObj.correctAnswer === parseInt(answerIndex);
  let pointsAwarded = 0;

  if (isCorrect) {
    lq.isSolved = true;
    lq.assignedTo = null;
    pointsAwarded = 200; // 200 points bonus!
    team.points += pointsAwarded;
    console.log(`Leftover Q ${questionId} solved correctly by ${teamCode}`);
  } else {
    lq.attemptedByTeams.push(teamCode);
    lq.assignedTo = null;
    console.log(`Leftover Q ${questionId} answer incorrect for team ${teamCode}`);
  }

  // Refresh allocations
  assignLeftoverQuestions();
  updateLeaderboard();

  return {
    isCorrect,
    pointsAwarded,
    team
  };
}

// Start active question session for a player on a block
// Returns { question, attemptsRemaining, secondsLeft }
function startQuestionSession(teamCode, playerName, blockIndex) {
  if (!gameState.isStarted) {
    throw new Error("Game has not started yet");
  }
  if (gameState.isPaused) {
    throw new Error("Game is currently paused");
  }

  const team = teams[teamCode];
  if (!team) {
    throw new Error("Team not found");
  }

  const member = team.members.find((m) => m.playerName === playerName);
  if (!member) {
    throw new Error("Member not found in team");
  }

  const idx = parseInt(blockIndex);
  if (isNaN(idx) || idx < 0 || idx >= 25) {
    throw new Error("Invalid block index");
  }

  // Check if this block is already unlocked for the team
  if (team.unlockedBlocks.includes(idx)) {
    throw new Error("Block already unlocked by team");
  }

  // Check if player has already answered correctly
  if (member.answers[idx] && member.answers[idx].isCorrect) {
    throw new Error("You have already answered this block correctly");
  }

  // Initialize helper fields if missing
  if (!member.attempts) member.attempts = {};
  if (!member.failedQuestionIds) member.failedQuestionIds = [];
  if (!member.currentQuestionId) member.currentQuestionId = {};
  if (member.memberDifficultyIndex === undefined) member.memberDifficultyIndex = 0;

  let aq = member.activeQuestion;
  const now = Date.now();

  const puzzleSet = team.puzzleAssigned === "A" ? gameState.puzzles.A : gameState.puzzles.B;
  const defaultQuestion = puzzleSet[idx];
  if (!defaultQuestion) {
    throw new Error("Question not found for this block index");
  }

  // Find difficulty target: Easy -> Medium -> Hard -> repeat
  const difficulties = ["Easy", "Medium", "Hard"];
  const targetDifficulty = difficulties[member.memberDifficultyIndex];

  // If there is an active question for this block, it is unexpired, attempts remain, and difficulty matches:
  if (aq && aq.blockIndex === idx && now < aq.endTime && aq.attemptsRemaining > 0 && aq.difficulty === targetDifficulty) {
    const question = puzzleSet.find((q) => q.id === aq.questionId);
    return {
      question: {
        id: question.id,
        category: question.category,
        difficulty: question.difficulty,
        text: question.text,
        options: question.options
      },
      attemptsRemaining: aq.attemptsRemaining,
      secondsLeft: Math.ceil((aq.endTime - now) / 1000)
    };
  }

  // Otherwise, start a new 60-second window. Select the appropriate question.
  let selectedQuestion;
  let attemptsRemaining = 3;

  const solvedIds = Object.values(member.answers).map((a) => a.questionId).filter(Boolean);
  const failedIds = member.failedQuestionIds || [];

  // If they previously exhausted all attempts (attempts count >= 3) on the current question:
  if (member.attempts[idx] >= 3) {
    const oldQuestionId = member.currentQuestionId[idx];
    if (oldQuestionId && !member.failedQuestionIds.includes(oldQuestionId)) {
      member.failedQuestionIds.push(oldQuestionId);
    }

    let choices = puzzleSet.filter(
      (q) => q.difficulty === targetDifficulty && !member.failedQuestionIds.includes(q.id) && !solvedIds.includes(q.id)
    );

    if (choices.length > 0) {
      selectedQuestion = choices[Math.floor(Math.random() * choices.length)];
    } else {
      // Reset failed list for this difficulty
      member.failedQuestionIds = member.failedQuestionIds.filter((id) => {
        const qObj = puzzleSet.find((q) => q.id === id);
        return qObj && qObj.difficulty !== targetDifficulty;
      });
      const fallbackChoices = puzzleSet.filter(
        (q) => q.difficulty === targetDifficulty && q.id !== oldQuestionId && !solvedIds.includes(q.id)
      );
      selectedQuestion = fallbackChoices.length > 0 ? fallbackChoices[Math.floor(Math.random() * fallbackChoices.length)] : defaultQuestion;
    }

    member.attempts[idx] = 0;
  } else {
    // Keep working on the same question if it exists and matches the target difficulty
    const savedQuestionId = member.currentQuestionId[idx];
    if (savedQuestionId) {
      const qObj = puzzleSet.find((q) => q.id === savedQuestionId);
      if (qObj && qObj.difficulty === targetDifficulty) {
        selectedQuestion = qObj;
      }
    }

    if (!selectedQuestion) {
      // Find any question matching targetDifficulty not solved/failed
      let choices = puzzleSet.filter(
        (q) => q.difficulty === targetDifficulty && !member.failedQuestionIds.includes(q.id) && !solvedIds.includes(q.id)
      );
      if (choices.length === 0) {
        choices = puzzleSet.filter((q) => q.difficulty === targetDifficulty);
      }
      selectedQuestion = choices[Math.floor(Math.random() * choices.length)] || defaultQuestion;

      member.attempts[idx] = 0;
    }

    const used = member.attempts[idx] || 0;
    attemptsRemaining = Math.max(1, 3 - used);
  }

  member.currentQuestionId[idx] = selectedQuestion.id;

  member.activeQuestion = {
    blockIndex: idx,
    questionId: selectedQuestion.id,
    difficulty: selectedQuestion.difficulty,
    attemptsRemaining,
    startTime: now,
    endTime: now + 60000 // 60 seconds question limit
  };

  return {
    question: {
      id: selectedQuestion.id,
      category: selectedQuestion.category,
      difficulty: selectedQuestion.difficulty,
      text: selectedQuestion.text,
      options: selectedQuestion.options
    },
    attemptsRemaining,
    secondsLeft: 60
  };
}

// Submit answer
// Returns: { isCorrect, blockUnlocked, pointsAwarded, attemptsRemaining, team }
function submitAnswer(teamCode, playerName, blockIndex, answerIndex) {
  if (!gameState.isStarted) {
    throw new Error("Game has not started yet");
  }
  if (gameState.isPaused) {
    throw new Error("Game is currently paused");
  }

  const team = teams[teamCode];
  if (!team) {
    throw new Error("Team not found");
  }

  const member = team.members.find((m) => m.playerName === playerName);
  if (!member) {
    throw new Error("Member not found in team");
  }

  const idx = parseInt(blockIndex);
  if (isNaN(idx) || idx < 0 || idx >= 25) {
    throw new Error("Invalid block index");
  }

  // Check if this block is already unlocked for the team
  if (team.unlockedBlocks.includes(idx)) {
    return { isCorrect: false, blockUnlocked: false, pointsAwarded: 0, attemptsRemaining: 0, team };
  }

  const aq = member.activeQuestion;
  if (!aq || aq.blockIndex !== idx) {
    throw new Error("No active question session for this block. Re-click the cell.");
  }

  // Check if time limit exceeded
  const now = Date.now();
  if (now > aq.endTime) {
    member.activeQuestion = null;
    throw new Error("Time limit exceeded (60 seconds). Click the block to try again.");
  }

  const puzzleSet = team.puzzleAssigned === "A" ? puzzleA : puzzleB;
  const question = puzzleSet.find((q) => q.id === aq.questionId);
  if (!question) {
    throw new Error("Question not found in database");
  }

  const isCorrect = question.correctAnswer === parseInt(answerIndex);

  // Initialize helper fields if missing
  if (!member.attempts) member.attempts = {};
  if (!member.failedQuestionIds) member.failedQuestionIds = [];

  let pointsAwarded = 0;
  let blockUnlocked = false;

  if (isCorrect) {
    // Save correct answer with the questionId
    member.answers[idx] = {
      isCorrect: true,
      answeredAt: now,
      questionId: aq.questionId
    };

    // Points based on difficulty + remaining seconds bonus
    let basePoints = 75;
    if (question.difficulty === "Medium") basePoints = 100;
    if (question.difficulty === "Hard") basePoints = 150;

    const secondsRemaining = Math.max(0, Math.ceil((aq.endTime - now) / 1000));
    const timeBonus = secondsRemaining * 2; // up to 120 pts

    pointsAwarded = basePoints + timeBonus;
    team.points += pointsAwarded;

    // Check if ALL members in the team have answered this block correctly
    const allMembersCorrect = team.members.every((m) => m.answers[idx] && m.answers[idx].isCorrect);

    if (allMembersCorrect) {
      blockUnlocked = true;
      team.unlockedBlocks.push(idx);

      // Check if team has finished all blocks
      const totalBlocks = gameState.settings.gridSize * gameState.settings.gridSize;
      if (team.unlockedBlocks.length === totalBlocks && !team.isFinished) {
        team.isFinished = true;
        team.finishedAt = Date.now();
        console.log(`Team ${teamCode} marked as finished at ${team.finishedAt}`);
        populateLeftoverQueue(team);
        assignLeftoverQuestions();
      }
    }

    // Increment difficulty rotation index!
    member.memberDifficultyIndex = ((member.memberDifficultyIndex || 0) + 1) % 3;

    // Clear active question session
    member.activeQuestion = null;
  } else {
    aq.attemptsRemaining -= 1;
    member.attempts[idx] = (member.attempts[idx] || 0) + 1;

    if (aq.attemptsRemaining <= 0) {
      if (!member.failedQuestionIds.includes(aq.questionId)) {
        member.failedQuestionIds.push(aq.questionId);
      }

      // Reset attempts to 3 (which forces a new question selection on startQuestionSession)
      member.attempts[idx] = 3;
      member.activeQuestion = null;

      pointsAwarded = -30;
      team.points = Math.max(0, team.points + pointsAwarded);
    }
  }

  updateLeaderboard();

  return {
    isCorrect,
    blockUnlocked,
    pointsAwarded,
    attemptsRemaining: aq ? aq.attemptsRemaining : 0,
    team
  };
}

// Compute/update leaderboard
function updateLeaderboard() {
  const sorted = Object.values(teams)
    .map((t) => ({
      teamName: t.teamName,
      points: t.points,
      teamCode: t.teamCode
    }))
    .sort((a, b) => b.points - a.points);

  gameState.leaderboard = sorted;
  return sorted;
}

// Remove member on disconnect
// Returns the team if updated, or null if team was deleted or socket didn't belong to a team
function removeMember(socketId) {
  for (const code in teams) {
    const team = teams[code];
    const memberIndex = team.members.findIndex((m) => m.socketId === socketId);

    if (memberIndex !== -1) {
      team.members.splice(memberIndex, 1);

      // If team has no members left, delete it
      if (team.members.length === 0) {
        delete teams[code];
        updateLeaderboard();
        return { teamDeleted: true, teamCode: code };
      }

      updateLeaderboard();
      return { teamDeleted: false, team };
    }
  }
  return null;
}

// Get team by code
function getTeam(teamCode) {
  return teams[teamCode];
}

// Get overall game state
function getGameState() {
  return {
    isStarted: gameState.isStarted,
    isPaused: gameState.isPaused,
    leaderboard: gameState.leaderboard,
    settings: gameState.settings
  };
}

module.exports = {
  teams,
  gameState,
  createTeam,
  joinTeam,
  startGame,
  togglePauseGame,
  resetGame,
  updateSettings,
  startQuestionSession,
  submitAnswer,
  updateLeaderboard,
  removeMember,
  getTeam,
  getGameState,
  assignLeftoverQuestions,
  submitLeftoverAnswer
};

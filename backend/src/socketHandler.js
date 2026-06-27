const gameLogic = require("./gameLogic");

let timerInterval = null;

module.exports = (io) => {
  // Helper to sync leftover question assignments to rooms
  const updateLeftoverBroadcasts = () => {
    Object.values(gameLogic.teams).forEach((team) => {
      if (team.isFinished && team.activeLeftoverQuestion) {
        io.to(`team_${team.teamCode}`).emit("leftover_assigned", {
          question: team.activeLeftoverQuestion,
          secondsLeft: team.activeLeftoverQuestion.secondsLeft
        });
      }
    });
  };

  // Master countdown timer logic
  const startServerTimer = () => {
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = setInterval(() => {
      const state = gameLogic.gameState;
      if (state.isStarted && !state.isPaused) {
        if (state.settings.timer <= 0) {
          clearInterval(timerInterval);
          state.isStarted = false;
          io.emit("game_ended", gameLogic.getGameState());
          console.log("Game timer elapsed. Game ended.");
        } else {
          state.settings.timer -= 1;
          io.emit("timer_sync", { timer: state.settings.timer });
        }

        const now = Date.now();

        // Enforce strict question timers per player on the server
        Object.values(gameLogic.teams).forEach((team) => {
          team.members.forEach((member) => {
            if (member.activeQuestion) {
              const aq = member.activeQuestion;
              if (now >= aq.endTime) {
                const expiredBlockIdx = aq.blockIndex;
                member.activeQuestion = null;

                member.attempts[expiredBlockIdx] = (member.attempts[expiredBlockIdx] || 0) + 1;

                if ((member.attempts[expiredBlockIdx] || 0) >= 3) {
                  member.attempts[expiredBlockIdx] = 3;
                  team.points = Math.max(0, team.points - 30);
                  
                  io.emit("team_updated", team);
                  io.emit("leaderboard_update", gameLogic.gameState.leaderboard);
                }

                io.to(member.socketId).emit("question_expired", {
                  blockIndex: expiredBlockIdx
                });
                console.log(`Question expired for ${member.playerName} on block ${expiredBlockIdx}`);
              } else {
                const secondsLeft = Math.max(0, Math.ceil((aq.endTime - now) / 1000));
                io.to(member.socketId).emit("question_timer_sync", {
                  blockIndex: aq.blockIndex,
                  secondsLeft
                });
              }
            }
          });
        });

        // Enforce strict leftover question timers
        gameLogic.gameState.leftoverQueue.forEach((lq) => {
          if (lq.assignedTo && !lq.isSolved && now >= lq.endTime) {
            const teamCode = lq.assignedTo;
            lq.attemptedByTeams.push(teamCode);
            lq.assignedTo = null;

            const team = gameLogic.teams[teamCode];
            if (team) {
              team.activeLeftoverQuestion = null;
              io.to(`team_${teamCode}`).emit("leftover_expired", { questionId: lq.questionId });
              io.emit("team_updated", team);
            }

            console.log(`Leftover question ${lq.questionId} expired for team ${teamCode}`);

            // Reallocate
            gameLogic.assignLeftoverQuestions();
            updateLeftoverBroadcasts();
          } else if (lq.assignedTo && !lq.isSolved) {
            const teamCode = lq.assignedTo;
            const secondsLeft = Math.max(0, Math.ceil((lq.endTime - now) / 1000));
            io.to(`team_${teamCode}`).emit("leftover_timer_sync", {
              questionId: lq.questionId,
              secondsLeft
            });
          }
        });
      }
    }, 1000);
  };

  io.on("connection", (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    // Send initial states
    socket.emit("game_started", gameLogic.getGameState());
    socket.emit("settings_updated", gameLogic.gameState.settings);
    socket.emit("leaderboard_update", gameLogic.gameState.leaderboard);
    
    Object.values(gameLogic.teams).forEach((team) => {
      socket.emit("team_updated", team);
    });

    const handleError = (callback, errorMsg) => {
      console.error(`Socket Error [${socket.id}]: ${errorMsg}`);
      if (typeof callback === "function") {
        callback({ success: false, error: errorMsg });
      } else {
        socket.emit("error_message", { error: errorMsg });
      }
    };

    // 1. Create Team
    socket.on("create_team", ({ playerName, teamName }, callback) => {
      try {
        const team = gameLogic.createTeam(playerName, teamName, socket.id);
        const teamCode = team.teamCode;

        socket.join(`team_${teamCode}`);
        socket.teamCode = teamCode;
        socket.playerName = playerName;

        console.log(`Team created: ${teamCode} by ${playerName}`);

        if (typeof callback === "function") {
          callback({ success: true, team });
        }

        io.emit("team_updated", team);
        io.emit("leaderboard_update", gameLogic.gameState.leaderboard);
      } catch (err) {
        handleError(callback, err.message);
      }
    });

    // 2. Join Team
    socket.on("join_team", ({ playerName, teamCode }, callback) => {
      try {
        const team = gameLogic.joinTeam(playerName, teamCode, socket.id);
        const code = team.teamCode;

        socket.join(`team_${code}`);
        socket.teamCode = code;
        socket.playerName = playerName;

        console.log(`Player ${playerName} joined team ${code}`);

        if (typeof callback === "function") {
          callback({ success: true, team });
        }

        io.emit("team_updated", team);
        io.emit("leaderboard_update", gameLogic.gameState.leaderboard);
        
        // Broadcast active leftover details if they are rejoin-assigned
        if (team.isFinished && team.activeLeftoverQuestion) {
          socket.emit("leftover_assigned", {
            question: team.activeLeftoverQuestion,
            secondsLeft: team.activeLeftoverQuestion.secondsLeft
          });
        }
      } catch (err) {
        handleError(callback, err.message);
      }
    });

    // 3. Start Game
    socket.on("start_game", (callback) => {
      try {
        const started = gameLogic.startGame();

        if (started) {
          console.log("Game started globally!");
          startServerTimer();

          io.emit("game_started", gameLogic.getGameState());

          Object.keys(gameLogic.teams).forEach((code) => {
            const team = gameLogic.teams[code];
            const questions = team.puzzleAssigned === "A" 
              ? gameLogic.gameState.puzzles.A 
              : gameLogic.gameState.puzzles.B;
            
            io.to(`team_${code}`).emit("question_assigned", {
              puzzleType: team.puzzleAssigned,
              questions: questions.map(q => ({
                id: q.id,
                category: q.category,
                difficulty: q.difficulty,
                text: q.text,
                options: q.options
              }))
            });
          });

          if (typeof callback === "function") {
            callback({ success: true });
          }
        } else {
          throw new Error("Game has already been started");
        }
      } catch (err) {
        handleError(callback, err.message);
      }
    });

    // 4. Start Question
    socket.on("start_question", ({ teamCode, playerName, blockIndex }, callback) => {
      try {
        const result = gameLogic.startQuestionSession(teamCode, playerName, blockIndex);
        if (typeof callback === "function") {
          callback({
            success: true,
            question: result.question,
            attemptsRemaining: result.attemptsRemaining,
            secondsLeft: result.secondsLeft
          });
        }
      } catch (err) {
        handleError(callback, err.message);
      }
    });

    // 5. Submit Answer
    socket.on("submit_answer", ({ teamCode, playerName, blockIndex, answerIndex }, callback) => {
      try {
        const result = gameLogic.submitAnswer(teamCode, playerName, blockIndex, answerIndex);

        if (typeof callback === "function") {
          callback({
            success: true,
            isCorrect: result.isCorrect,
            blockUnlocked: result.blockUnlocked,
            pointsAwarded: result.pointsAwarded,
            attemptsRemaining: result.attemptsRemaining
          });
        }

        io.emit("team_updated", result.team);

        if (result.blockUnlocked) {
          console.log(`Block ${blockIndex} unlocked for Team ${teamCode}`);
          io.to(`team_${teamCode}`).emit("block_unlocked", {
            blockIndex,
            pointsAwarded: result.pointsAwarded
          });
        }

        if (result.team.isFinished) {
          updateLeftoverBroadcasts();
        }

        io.emit("leaderboard_update", gameLogic.gameState.leaderboard);
      } catch (err) {
        handleError(callback, err.message);
      }
    });

    // 6. Admin Pause Game
    socket.on("admin_pause_game", (callback) => {
      try {
        const success = gameLogic.togglePauseGame();
        if (success) {
          io.emit("game_started", gameLogic.getGameState());
          if (typeof callback === "function") {
            callback({ success: true, gameState: gameLogic.getGameState() });
          }
        } else {
          throw new Error("Cannot pause game because it has not started yet");
        }
      } catch (err) {
        handleError(callback, err.message);
      }
    });

    // 7. Admin Reset Game
    socket.on("admin_reset_game", (callback) => {
      try {
        gameLogic.resetGame();
        if (timerInterval) clearInterval(timerInterval);
        io.emit("game_started", gameLogic.getGameState());
        if (typeof callback === "function") {
          callback({ success: true, gameState: gameLogic.getGameState() });
        }
      } catch (err) {
        handleError(callback, err.message);
      }
    });

    // 8. Admin Update Settings
    socket.on("admin_update_settings", (newSettings, callback) => {
      try {
        const settings = gameLogic.updateSettings(newSettings);
        io.emit("settings_updated", settings);
        if (typeof callback === "function") {
          callback({ success: true, settings });
        }
      } catch (err) {
        handleError(callback, err.message);
      }
    });

    // 9. Admin Reset Grid Cell
    socket.on("admin_reset_grid_cell", ({ teamCode, blockIndex }, callback) => {
      try {
        const team = gameLogic.teams[teamCode];
        if (team) {
          team.unlockedBlocks = team.unlockedBlocks.filter(idx => idx !== parseInt(blockIndex));
          team.isFinished = false;
          team.finishedAt = null;
          team.activeLeftoverQuestion = null;
          
          team.members.forEach(m => {
            if (m.answers) delete m.answers[blockIndex];
            if (m.attempts) delete m.attempts[blockIndex];
            if (m.currentQuestionId) delete m.currentQuestionId[blockIndex];
          });
          
          console.log(`Reset cell ${blockIndex} for team ${teamCode}`);
          io.emit("team_updated", team);
          if (typeof callback === "function") {
            callback({ success: true, team });
          }
        } else {
          throw new Error("Team not found");
        }
      } catch (err) {
        handleError(callback, err.message);
      }
    });

    // 10. Submit Leftover Answer
    socket.on("submit_leftover_answer", ({ teamCode, playerName, questionId, answerIndex }, callback) => {
      try {
        const result = gameLogic.submitLeftoverAnswer(teamCode, playerName, questionId, answerIndex);
        
        if (typeof callback === "function") {
          callback({
            success: true,
            isCorrect: result.isCorrect,
            pointsAwarded: result.pointsAwarded
          });
        }

        io.emit("team_updated", result.team);
        io.emit("leaderboard_update", gameLogic.gameState.leaderboard);
        
        updateLeftoverBroadcasts();
      } catch (err) {
        handleError(callback, err.message);
      }
    });

    // 11. Disconnect
    socket.on("disconnect", () => {
      console.log(`Socket disconnected: ${socket.id}`);
      const result = gameLogic.removeMember(socket.id);

      if (result) {
        if (result.teamDeleted) {
          io.emit("team_deleted", { teamCode: result.teamCode });
        } else {
          io.emit("team_updated", result.team);
        }
        io.emit("leaderboard_update", gameLogic.gameState.leaderboard);
      }
    });
  });
};

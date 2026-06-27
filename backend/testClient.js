const { io } = require("socket.io-client");
const { puzzleA, puzzleB } = require("./src/config");

const SERVER_URL = "http://localhost:4000";

function createClient(playerName) {
  return io(SERVER_URL, {
    autoConnect: false,
    transports: ["websocket"]
  });
}

async function runTests() {
  console.log("🚀 Starting Puzzle Quest Backend leftovers and rotation integration tests...\n");

  const client1 = createClient("Neo");
  const client2 = createClient("Trinity");
  const client3 = createClient("Morpheus");

  let teamCode = null;
  let puzzleAssigned = null;

  // Helper promise to wait for a socket event
  const waitForEvent = (socket, event) => {
    return new Promise((resolve) => {
      socket.once(event, (data) => {
        resolve(data);
      });
    });
  };

  try {
    // Connect client 1
    client1.connect();
    await new Promise((r) => client1.on("connect", r));
    console.log("✅ Neo connected to socket server");

    // 1. Create Team
    const createResult = await new Promise((resolve) => {
      client1.emit("create_team", { playerName: "Neo", teamName: "Nebuchadnezzar" }, (response) => {
        resolve(response);
      });
    });

    if (!createResult.success) {
      throw new Error(`Create team failed: ${createResult.error}`);
    }

    teamCode = createResult.team.teamCode;
    puzzleAssigned = createResult.team.puzzleAssigned;
    console.log(`✅ Team created successfully. Code: ${teamCode}`);
    console.log(`   Puzzle assigned: ${puzzleAssigned}`);

    // Connect client 2
    client2.connect();
    await new Promise((r) => client2.on("connect", r));
    console.log("✅ Trinity connected");

    // Join Team (2nd member)
    const joinResult2 = await new Promise((resolve) => {
      client2.emit("join_team", { playerName: "Trinity", teamCode }, (response) => {
        resolve(response);
      });
    });
    if (!joinResult2.success) {
      throw new Error(`Trinity failed to join: ${joinResult2.error}`);
    }

    // Connect client 3
    client3.connect();
    await new Promise((r) => client3.on("connect", r));
    console.log("✅ Morpheus connected");

    // Join Team (3rd member)
    const joinResult3 = await new Promise((resolve) => {
      client3.emit("join_team", { playerName: "Morpheus", teamCode }, (response) => {
        resolve(response);
      });
    });
    if (!joinResult3.success) {
      throw new Error(`Morpheus failed to join: ${joinResult3.error}`);
    }

    // 2. Set grid size to 1 for fast completion testing
    console.log("\n⚙️ Setting grid size to 1 for fast completion test...");
    await new Promise((resolve) => {
      client1.emit("admin_update_settings", { gridSize: 1 }, resolve);
    });

    // Start Game
    console.log("⏱️ Starting game...");
    const gameStartPromise1 = waitForEvent(client1, "game_started");
    const startResult = await new Promise((resolve) => {
      client1.emit("start_game", (response) => {
        resolve(response);
      });
    });
    if (!startResult.success) {
      throw new Error(`Failed to start game: ${startResult.error}`);
    }
    await gameStartPromise1;

    // 3. Complete all cells (since gridSize = 1, only index 0 needs solving by all members)
    console.log("\n🧪 Solving block 0 for all 3 members to trigger finished state...");

    const puzzleSet = puzzleAssigned === "A" ? puzzleA : puzzleB;

    // Neo solves block 0
    const startNeo = await new Promise((resolve) => {
      client1.emit("start_question", { teamCode, playerName: "Neo", blockIndex: 0 }, resolve);
    });
    const qNeo = puzzleSet.find(q => q.id === startNeo.question.id);
    const ansNeo = await new Promise((resolve) => {
      client1.emit("submit_answer", { teamCode, playerName: "Neo", blockIndex: 0, answerIndex: qNeo.correctAnswer }, resolve);
    });
    console.log(`   Neo solved block 0: isCorrect=${ansNeo.isCorrect}`);

    // Trinity solves block 0
    const startTrinity = await new Promise((resolve) => {
      client2.emit("start_question", { teamCode, playerName: "Trinity", blockIndex: 0 }, resolve);
    });
    const qTrinity = puzzleSet.find(q => q.id === startTrinity.question.id);
    const ansTrinity = await new Promise((resolve) => {
      client2.emit("submit_answer", { teamCode, playerName: "Trinity", blockIndex: 0, answerIndex: qTrinity.correctAnswer }, resolve);
    });
    console.log(`   Trinity solved block 0: isCorrect=${ansTrinity.isCorrect}`);

    // Morpheus solves block 0 (triggers team finished)
    const startMorpheus = await new Promise((resolve) => {
      client3.emit("start_question", { teamCode, playerName: "Morpheus", blockIndex: 0 }, resolve);
    });
    const qMorpheus = puzzleSet.find(q => q.id === startMorpheus.question.id);

    const leftoverAssignedPromise = waitForEvent(client1, "leftover_assigned");

    const ansMorpheus = await new Promise((resolve) => {
      client3.emit("submit_answer", { teamCode, playerName: "Morpheus", blockIndex: 0, answerIndex: qMorpheus.correctAnswer }, resolve);
    });
    console.log(`   Morpheus solved block 0: isCorrect=${ansMorpheus.isCorrect}, blockUnlocked=${ansMorpheus.blockUnlocked}`);

    // 4. Verify Leftover Question Assigned
    console.log("\n🧪 Verifying leftover question assignment...");
    const leftoverPayload = await leftoverAssignedPromise;
    console.log(`✅ Leftover assigned received! Question ID: ${leftoverPayload.question.id}, Text: "${leftoverPayload.question.text}"`);

    // 5. Test Submitting Wrong Answer to Leftover (should forward / recycle)
    console.log("\n🧪 Testing Submit Wrong Answer to Leftover...");
    const wrongAnsIndex = 3; // index 3 is always incorrect or we can find it
    const leftoverQObj = puzzleSet.find(q => q.id === leftoverPayload.question.id);
    const wrongIndex = leftoverQObj.correctAnswer === 3 ? 2 : 3;

    const nextLeftoverPromise = waitForEvent(client1, "leftover_assigned");

    const leftoverWrongResult = await new Promise((resolve) => {
      client1.emit("submit_leftover_answer", {
        teamCode,
        playerName: "Neo",
        questionId: leftoverPayload.question.id,
        answerIndex: wrongIndex
      }, resolve);
    });

    console.log(`   Wrong leftover answer status: isCorrect=${leftoverWrongResult.isCorrect}`);
    if (leftoverWrongResult.isCorrect) {
      throw new Error("Wrong leftover answer accepted as correct!");
    }

    // Wait for the next leftover question to be assigned (failed moves to next team or re-assigns a different one)
    const nextLeftoverPayload = await nextLeftoverPromise;
    console.log(`✅ Successfully assigned next leftover question! ID: ${nextLeftoverPayload.question.id}`);
    if (nextLeftoverPayload.question.id === leftoverPayload.question.id) {
      throw new Error("Failed to assign a different leftover question after incorrect answer!");
    }

    // 6. Test Submitting Correct Answer to Leftover (should award 200 points)
    console.log("\n🧪 Testing Submit Correct Answer to Leftover...");
    const targetQId = nextLeftoverPayload.question.id;
    const targetQObj = puzzleSet.find(q => q.id === targetQId);
    const correctIndex = targetQObj.correctAnswer;

    // Capture the team updated event to verify points change
    const teamUpdatePromise = waitForEvent(client1, "team_updated");

    const leftoverCorrectResult = await new Promise((resolve) => {
      client1.emit("submit_leftover_answer", {
        teamCode,
        playerName: "Neo",
        questionId: targetQId,
        answerIndex: correctIndex
      }, resolve);
    });

    console.log(`   Correct leftover answer status: isCorrect=${leftoverCorrectResult.isCorrect}, pointsAwarded=${leftoverCorrectResult.pointsAwarded}`);
    if (!leftoverCorrectResult.isCorrect) {
      throw new Error("Correct leftover answer rejected!");
    }
    if (leftoverCorrectResult.pointsAwarded !== 200) {
      throw new Error(`Expected 200 bonus points, got ${leftoverCorrectResult.pointsAwarded}`);
    }

    const teamUpdatePayload = await teamUpdatePromise;
    console.log(`✅ Success! Team points updated. New points: ${teamUpdatePayload.points}`);

    // Clean up
    console.log("\n🧹 Cleaning up connections...");
    client1.disconnect();
    client2.disconnect();
    client3.disconnect();

    console.log("\n⭐️ ALL LEFTOVER QUESTION INTEGRATION TESTS PASSED SUCCESSFULY! ⭐️");
  } catch (error) {
    console.error("\n❌ TEST FAILED:", error);
    client1.disconnect();
    client2.disconnect();
    client3.disconnect();
    process.exit(1);
  }
}

runTests();

// frontend/js/main.js

// Define the base URL for your backend API
// IMPORTANT: Ensure this matches your Render backend's public URL followed by /api/match
const API_BASE_URL = 'https://cricket-backend-slb4.onrender.com/api/match'; // This should be correct if your backend routes are prefixed with /api/match

// Global variables for game state
let currentGameState = null;
let matchId = null; // Unique ID for the current match, provided by backend
let isViewer = false; // Flag to determine if the user is a viewer (read-only)

// DOM Elements
const configSection = document.getElementById('config-section');
const joinMatchSection = document.getElementById('join-match-section'); // New
const tossSection = document.getElementById('toss-section');
const gameplaySection = document.getElementById('gameplay-section');
const resultSection = document.getElementById('result-section');

const oversInput = document.getElementById('overs-input');
const wicketsInput = document.getElementById('wickets-input');
const startMatchBtn = document.getElementById('start-match-btn');

const roomCodeInput = document.getElementById('room-code-input'); // New
const joinMatchBtn = document.getElementById('join-match-btn'); // New
const roomCodeDisplayEl = document.querySelector('#room-code-display span'); // New

const tossMessage = document.getElementById('toss-message');
const callHeadsBtn = document.getElementById('call-heads-btn');
const callTailsBtn = document.getElementById('call-tails-btn');
const tossWinnerOptions = document.getElementById('toss-winner-options');
const tossWinnerMessage = document.getElementById('toss-winner-message');
const chooseBatBtn = document.getElementById('choose-bat-btn');
const chooseFieldBtn = document.getElementById('choose-field-btn');

const currentInningsTitle = document.getElementById('current-innings-title');
const team1Scorecard = document.getElementById('team1-scorecard');
const team2Scorecard = document.getElementById('team2-scorecard');
const team1NameEl = document.getElementById('team1-name');
const team2NameEl = document.getElementById('team2-name');
const team1ScoreEl = document.getElementById('team1-score');
const team2ScoreEl = document.getElementById('team2-score');
const team1OversEl = document.getElementById('team1-overs');
const team2OversEl = document.getElementById('team2-overs');
const totalOversDisplay1 = document.getElementById('total-overs-display');
const totalOversDisplay2 = document.getElementById('total-overs-display2');
const team1PlayerScoresEl = document.getElementById('team1-player-scores');
const team2PlayerScoresEl = document.getElementById('team2-player-scores');
const team1StrikePlayerSelect = document.getElementById('team1-strike-player');
const team2StrikePlayerSelect = document.getElementById('team2-strike-player');
const team1CurrentOverBallsEl = document.getElementById('team1-current-over-balls');
const team2CurrentOverBallsEl = document.getElementById('team2-current-over-balls');


const runButtons = document.querySelectorAll('.controls button[data-runs]');
const wicketBtn = document.getElementById('wicket-btn');
const extraBtn = document.getElementById('extra-btn');
const noBallBtn = document.getElementById('no-ball-btn');
const wideBtn = document.getElementById('wide-btn');
const undoBtn = document.getElementById('undo-btn');
const endInningsBtn = document.getElementById('end-innings-btn');
const endMatchHomeBtn = document.getElementById('end-match-home-btn');

const resultMessageEl = document.getElementById('match-result-message');
const finalTeam1NameEl = document.getElementById('final-team1-name');
const finalTeam2NameEl = document.getElementById('final-team2-name');
const finalTeam1ScoreEl = document.getElementById('final-team1-score');
const finalTeam2ScoreEl = document.getElementById('final-team2-score');
const finalTeam1OversEl = document.getElementById('final-team1-overs');
const finalTeam2OversEl = document.getElementById('final-team2-overs');
const finalTeam1PlayerScoresEl = document.getElementById('final-team1-player-scores');
const finalTeam2PlayerScoresEl = document.getElementById('final-team2-player-scores');
const resetMatchBtn = document.getElementById('reset-match-btn');

const messageBox = document.getElementById('message-box');
const messageText = document.getElementById('message-text');
const messageOkBtn = document.getElementById('message-ok-btn');

let confirmCallback = null; // Callback for message box confirmation

/**
 * Sends a request to the backend API.
 * @param {string} endpoint - The API endpoint (e.g., '/start', '/action').
 * @param {object} [data={}] - The data payload to send.
 * @param {string} [method='POST'] - The HTTP method.
 * @returns {Promise<object>} - The JSON response from the backend.
 */
async function callBackend(endpoint, data = {}, method = 'POST') {
    try {
        let url = `${API_BASE_URL}${endpoint}`;
        const options = {
            method: method,
            headers: {
                'Content-Type': 'application/json',
            },
        };

        if (method === 'GET') {
            // For GET requests, append data as query parameters
            const params = new URLSearchParams(data).toString();
            if (params) {
                url = `${url}?${params}`;
            }
        } else {
            options.body = JSON.stringify({ matchId: matchId, ...data }); // Always send matchId for non-GET
        }

        const response = await fetch(url, options);
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error("Backend API call failed:", error);
        showMessage(`Error: ${error.message}. Please check console for details.`);
        throw error;
    }
}

/**
 * Updates the UI based on the current game state received from the backend.
 * @param {object} gameState - The full game state object from the backend.
 */
function updateUI(gameState) {
    if (!gameState) {
        console.warn("Attempted to update UI with null gameState.");
        return;
    }
    currentGameState = gameState; // Update local state copy

    const { totalOvers, totalWickets, currentInnings, battingTeamId, matchEnded, superOverActive, teams, roomCode } = gameState;

    // Display Room Code
    if (roomCode) {
        roomCodeDisplayEl.textContent = roomCode;
        document.getElementById('room-code-display').classList.remove('hidden');
    } else {
        document.getElementById('room-code-display').classList.add('hidden');
    }

    // Determine current batting and bowling teams from the state
    const battingTeam = teams[battingTeamId];
    const bowlingTeamId = battingTeamId === 'team1' ? 'team2' : 'team1';
    const bowlingTeam = teams[bowlingTeamId];

    // Update main scorecards
    team1NameEl.textContent = teams.team1.name;
    team2NameEl.textContent = teams.team2.name;

    team1ScoreEl.innerHTML = `${teams.team1.score}<small>/${teams.team1.wickets}</small>`;
    team1OversEl.textContent = `${Math.floor(teams.team1.balls / 6)}.${teams.team1.balls % 6}`;
    totalOversDisplay1.textContent = superOverActive ? gameState.SUPER_OVER_OVERS : totalOvers;

    team2ScoreEl.innerHTML = `${teams.team2.score}<small>/${teams.team2.wickets}</small>`;
    team2OversEl.textContent = `${Math.floor(teams.team2.balls / 6)}.${teams.team2.balls % 6}`;
    totalOversDisplay2.textContent = superOverActive ? gameState.SUPER_OVER_OVERS : totalOvers;

    if (battingTeamId) {
        currentInningsTitle.textContent = `Innings ${currentInnings}: ${battingTeam.name} Batting` + (superOverActive ? ' (Super Over)' : '');
    }


    // Update player lists and strike player selects
    updatePlayerListAndSelect(teams.team1, team1PlayerScoresEl, team1StrikePlayerSelect);
    updatePlayerListAndSelect(teams.team2, team2PlayerScoresEl, team2StrikePlayerSelect);

    // Update current over balls display
    updateCurrentOverBallsDisplay(teams.team1, team1CurrentOverBallsEl);
    updateCurrentOverBallsDisplay(teams.team2, team2CurrentOverBallsEl);

    // Adjust scorecard visibility for second innings (if needed, though both are usually visible)
    if (currentInnings === 2 && teams.team1.inningsComplete) {
        team1Scorecard.classList.remove('hidden');
        team2Scorecard.classList.remove('hidden');
    }

    // Set strike player select visibility based on current batting team
    if (battingTeamId) {
        if (battingTeamId === 'team1') {
            team2StrikePlayerSelect.classList.add('hidden');
            team1StrikePlayerSelect.classList.remove('hidden');
        } else {
            team1StrikePlayerSelect.classList.add('hidden');
            team2StrikePlayerSelect.classList.remove('hidden');
        }
    } else {
        team1StrikePlayerSelect.classList.remove('hidden');
        team2StrikePlayerSelect.classList.remove('hidden');
    }

    // Handle section visibility
    if (matchEnded) {
        configSection.classList.add('hidden');
        joinMatchSection.classList.add('hidden');
        tossSection.classList.add('hidden');
        gameplaySection.classList.add('hidden');
        resultSection.classList.remove('hidden');
        resultMessageEl.textContent = gameState.matchResultMessage || "Match Ended. Check scores below!";
        populateFinalPlayerScores(teams.team1, finalTeam1PlayerScoresEl);
        populateFinalPlayerScores(teams.team2, finalTeam2PlayerScoresEl);
        finalTeam1NameEl.textContent = teams.team1.name;
        finalTeam1ScoreEl.innerHTML = `${teams.team1.score}<small>/${teams.team1.wickets}</small>`;
        finalTeam1OversEl.textContent = `${Math.floor(teams.team1.balls / 6)}.${teams.team1.balls % 6}`;
        finalTeam2NameEl.textContent = teams.team2.name;
        finalTeam2ScoreEl.innerHTML = `${teams.team2.score}<small>/${teams.team2.wickets}</small>`;
        finalTeam2OversEl.textContent = `${Math.floor(teams.team2.balls / 6)}.${teams.team2.balls % 6}`;

    } else if (currentInnings >= 1) {
        configSection.classList.add('hidden');
        joinMatchSection.classList.add('hidden');
        tossSection.classList.add('hidden');
        gameplaySection.classList.remove('hidden');
        resultSection.classList.add('hidden');
    } else if (gameState.tossWinnerTeam) {
        configSection.classList.add('hidden');
        joinMatchSection.classList.add('hidden');
        tossSection.classList.remove('hidden');
        gameplaySection.classList.add('hidden');
        resultSection.classList.add('hidden');
        tossWinnerOptions.classList.remove('hidden');
        tossMessage.textContent = `It's ${gameState.tossResult}! ${teams[gameState.tossWinnerTeam].name} won the toss.`;
        tossWinnerMessage.textContent = `${teams[gameState.tossWinnerTeam].name}, choose to Bat or Field:`;
        callHeadsBtn.disabled = true;
        callTailsBtn.disabled = true;
    } else {
        configSection.classList.remove('hidden');
        joinMatchSection.classList.remove('hidden'); // Show join section on initial load
        tossSection.classList.add('hidden');
        gameplaySection.classList.add('hidden');
        resultSection.classList.add('hidden');
    }

    // Disable controls if viewer
    setControlsDisabled(isViewer);
}

/**
 * Helper to update player list and select dropdown.
 * @param {object} team - The team object.
 * @param {HTMLElement} playerListEl - The UL element for player scores.
 * @param {HTMLElement} strikePlayerSelectEl - The SELECT element for strike player.
 */
function updatePlayerListAndSelect(team, playerListEl, strikePlayerSelectEl) {
    playerListEl.innerHTML = '';
    strikePlayerSelectEl.innerHTML = '';
    let playersInPlay = [];

    team.players.forEach((player, index) => {
        let status = '';
        if (player.isOut) {
            status = ` (${player.dismissalType})`;
        } else if (team.currentBatsmen.includes(index)) {
            status = ' (Batting)';
            playersInPlay.push({ index, name: player.name });
        }

        const strikeRate = player.ballsFaced > 0 ? ((player.runs / player.ballsFaced) * 100).toFixed(1) : '0.0';

        const listItem = document.createElement('li');
        listItem.innerHTML = `
            <div class="player-main-info">
                <span>${player.name}${status}</span>
                <span>${player.runs} (${player.ballsFaced} balls)</span>
            </div>
            <div class="player-stats">
                <span>4s: ${player.fours}</span>
                <span>6s: ${player.sixes}</span>
                <span>SR: ${strikeRate}</span>
            </div>
        `;
        playerListEl.appendChild(listItem);
    });

    if (playersInPlay.length > 0) {
        playersInPlay.forEach(player => {
            const option = document.createElement('option');
            option.value = player.index;
            option.textContent = player.name;
            strikePlayerSelectEl.appendChild(option);
        });
        // Set the selected value to the current striker
        if (team.currentBatsmen.length > 0 && strikePlayerSelectEl.options.length > 0) {
            strikePlayerSelectEl.value = team.currentBatsmen[0];
        }
    }
}

/**
 * Helper to update current over balls display.
 * @param {object} team - The team object.
 * @param {HTMLElement} currentOverBallsDisplayEl - The DIV element for current over balls.
 */
function updateCurrentOverBallsDisplay(team, currentOverBallsDisplayEl) {
    currentOverBallsDisplayEl.innerHTML = '';
    team.currentOverBalls.forEach(ball => {
        const ballEl = document.createElement('span');
        ballEl.classList.add('current-over-ball');
        if (ball === 'W') {
            ballEl.classList.add('wicket');
        } else if (ball.startsWith('Extra')) {
            ballEl.classList.add('extra');
            ball = ball.replace('Extra', 'E');
        } else if (ball.startsWith('No-Ball')) {
            ballEl.classList.add('no-ball');
            ball = ball.replace('No-Ball', 'NB');
        } else if (ball.startsWith('Wide')) {
            ballEl.classList.add('wide');
            ball = ball.replace('Wide', 'WD');
        }
        ballEl.textContent = ball;
        currentOverBallsDisplayEl.appendChild(ballEl);
    });
}

/**
 * Displays a custom message box for simple alerts.
 * @param {string} message - The message to display.
 */
function showMessage(message) {
    messageText.textContent = message;
    messageBox.classList.remove('hidden');
    messageOkBtn.textContent = 'OK';
    const existingCancelBtn = document.getElementById('message-cancel-btn');
    if (existingCancelBtn) existingCancelBtn.remove();
    confirmCallback = null;
}

/**
 * Displays a custom message box for confirmations (Yes/No).
 * @param {string} message - The message to display.
 * @param {function} onConfirm - Callback function to execute if 'Yes' is clicked.
 */
function showConfirmBox(message, onConfirm) {
    messageText.textContent = message;
    messageBox.classList.remove('hidden');
    messageOkBtn.textContent = 'Yes';

    const existingCancelBtn = document.getElementById('message-cancel-btn');
    if (existingCancelBtn) {
        existingCancelBtn.remove();
    }

    let cancelBtn = document.createElement('button');
    cancelBtn.id = 'message-cancel-btn';
    cancelBtn.className = 'btn btn-secondary ml-4';
    cancelBtn.textContent = 'No';
    messageBox.appendChild(cancelBtn);

    confirmCallback = onConfirm;

    cancelBtn.onclick = () => {
        hideMessageBox();
        confirmCallback = null;
    };
}

/**
 * Hides the custom message box.
 */
function hideMessageBox() {
    messageBox.classList.add('hidden');
    const existingCancelBtn = document.getElementById('message-cancel-btn');
    if (existingCancelBtn) existingCancelBtn.remove();
}

/**
 * Populates player scores for the final result display.
 * @param {object} team - The team object.
 * @param {HTMLElement} listElement - The UL element to populate.
 */
function populateFinalPlayerScores(team, listElement) {
    listElement.innerHTML = '';
    team.players.forEach(player => {
        const listItem = document.createElement('li');
        let status = '';
        if (player.isOut) {
            status = ` (Out - ${player.dismissalType})`;
        } else if (currentGameState && currentGameState.battingTeamId && team.currentBatsmen.includes(team.players.indexOf(player)) && !team.inningsComplete) {
            status = ' (Not Out)';
        } else if (currentGameState && !player.isOut && !team.inningsComplete && team.players.indexOf(player) >= team.battingOrder[0]) { // Corrected logic for "Did not bat"
            // This logic is tricky. A player "did not bat" if they weren't out, and the innings completed,
            // and they weren't one of the current batsmen, and they were in the batting order.
            // For simplicity, let's assume if they are not out and the innings is complete, and they weren't on the field
            // they didn't bat.
            const isCurrentlyBatting = currentGameState.teams[currentGameState.battingTeamId]?.currentBatsmen.includes(team.players.indexOf(player));
            if (!player.isOut && team.inningsComplete && !isCurrentlyBatting) {
                status = ' (Did not bat)';
            }
        }
        const strikeRate = player.ballsFaced > 0 ? ((player.runs / player.ballsFaced) * 100).toFixed(1) : '0.0';

        listItem.innerHTML = `
            <div class="player-main-info">
                <span>${player.name}${status}</span>
                <span>${player.runs} (${player.ballsFaced} balls)</span>
            </div>
            <div class="player-stats">
                <span>4s: ${player.fours}</span>
                <span>6s: ${player.sixes}</span>
                <span>SR: ${strikeRate}</span>
            </div>
        `;
        listElement.appendChild(listItem);
    });
}

/**
 * Disables or enables all control buttons and select elements.
 * @param {boolean} disabled - True to disable, false to enable.
 */
function setControlsDisabled(disabled) {
    runButtons.forEach(btn => btn.disabled = disabled);
    wicketBtn.disabled = disabled;
    extraBtn.disabled = disabled;
    noBallBtn.disabled = disabled;
    wideBtn.disabled = disabled;
    undoBtn.disabled = disabled;
    endInningsBtn.disabled = disabled;
    endMatchHomeBtn.disabled = disabled;
    team1StrikePlayerSelect.disabled = disabled;
    team2StrikePlayerSelect.disabled = disabled;
}

/**
 * Resets the game UI to its initial state (client-side only).
 */
function resetGameUI() {
    currentGameState = null;
    matchId = null;
    isViewer = false; // Reset viewer status

    configSection.classList.remove('hidden');
    joinMatchSection.classList.remove('hidden'); // Show join section
    tossSection.classList.add('hidden');
    gameplaySection.classList.add('hidden');
    resultSection.classList.add('hidden');

    oversInput.value = 20;
    wicketsInput.value = 10;
    roomCodeInput.value = ''; // Clear room code input

    team1ScoreEl.innerHTML = '0<small>/0</small>';
    team2ScoreEl.innerHTML = '0<small>/0</small>';
    team1OversEl.textContent = '0.0';
    team2OversEl.textContent = '0.0';
    team1PlayerScoresEl.innerHTML = '';
    team2PlayerScoresEl.innerHTML = '';
    team1StrikePlayerSelect.innerHTML = '';
    team2StrikePlayerSelect.innerHTML = '';
    team1CurrentOverBallsEl.innerHTML = '';
    team2CurrentOverBallsEl.innerHTML = '';
    team1Scorecard.classList.remove('hidden');
    team2Scorecard.classList.remove('hidden');
    team1StrikePlayerSelect.classList.remove('hidden');
    team2StrikePlayerSelect.classList.remove('hidden');

    tossMessage.textContent = `Team A calls...`;
    tossWinnerOptions.classList.add('hidden');
    callHeadsBtn.disabled = false;
    callTailsBtn.disabled = false;

    setControlsDisabled(false); // Ensure controls are enabled for new match creation
    roomCodeDisplayEl.textContent = ''; // Clear room code display
    document.getElementById('room-code-display').classList.add('hidden');
}

// --- Event Listeners ---

// Create Match Button
startMatchBtn.addEventListener('click', async () => {
    const overs = parseInt(oversInput.value);
    const wickets = parseInt(wicketsInput.value);

    if (isNaN(overs) || overs <= 0 || isNaN(wickets) || wickets < 0) {
        showMessage("Please enter valid numbers for Overs (min 1) and Wickets (min 0).");
        return;
    }

    try {
        const response = await callBackend('/start', { overs, wickets });
        matchId = response.matchId;
        isViewer = false; // This client is the creator
        updateUI(response.gameState);

        configSection.classList.add('hidden');
        joinMatchSection.classList.add('hidden'); // Hide join section
        tossSection.classList.remove('hidden');
        tossWinnerOptions.classList.add('hidden');
        tossMessage.textContent = `${response.gameState.teams.team1.name} calls...`;
        showMessage(`Match created! Share this Room Code: ${response.roomCode}`);
        // Update URL with room code for easy sharing
        history.pushState({ roomCode: response.roomCode }, '', `?room=${response.roomCode}`);

    } catch (error) {
        // Error handled by callBackend
    }
});

// Join Match Button
joinMatchBtn.addEventListener('click', async () => {
    const roomCode = roomCodeInput.value.trim().toUpperCase();
    if (!roomCode) {
        showMessage("Please enter a room code.");
        return;
    }

    try {
        const response = await callBackend(`/join`, { roomCode: roomCode }, 'GET');
        matchId = response.matchId;
        isViewer = true; // This client is a viewer
        updateUI(response.gameState);

        configSection.classList.add('hidden');
        joinMatchSection.classList.add('hidden');
        tossSection.classList.add('hidden');
        gameplaySection.classList.remove('hidden');
        resultSection.classList.add('hidden');

        showMessage(`Joined match with Room Code: ${roomCode}. You are in view-only mode.`);
        // Update URL with room code for easy sharing
        history.pushState({ roomCode: roomCode }, '', `?room=${roomCode}`);

    } catch (error) {
        showMessage(error.message || "Failed to join match. Please check the room code.");
    }
});


// Toss Buttons
callHeadsBtn.addEventListener('click', async () => handleTossCall('Heads'));
callTailsBtn.addEventListener('click', async () => handleTossCall('Tails'));

async function handleTossCall(call) {
    if (isViewer) { showMessage("You are in view-only mode."); return; }
    try {
        const response = await callBackend('/toss', { call });
        updateUI(response.gameState);

        const { tossWinnerTeam, teams } = response.gameState;

        tossMessage.textContent = response.message;
        tossWinnerMessage.textContent = `${teams[tossWinnerTeam].name}, choose to Bat or Field:`;
        tossWinnerOptions.classList.remove('hidden');
        callHeadsBtn.disabled = true;
        callTailsBtn.disabled = true;

        // The backend now handles the transition to gameplay after choice,
        // so this check might be redundant here if tossWinnerChoice is not set yet.
        // It's better to rely on updateUI's section handling.
        // if (response.gameState.tossWinnerChoice) {
        //     tossSection.classList.add('hidden');
        //     gameplaySection.classList.remove('hidden');
        //     showMessage(`Match starts! ${teams[response.gameState.battingTeamId].name} will bat first.`);
        // }
    } catch (error) {
        // Error handled by callBackend
    }
}

// Toss Winner Choice Buttons
chooseBatBtn.addEventListener('click', async () => handleTossChoice('bat'));
chooseFieldBtn.addEventListener('click', async () => handleTossChoice('field'));

async function handleTossChoice(choice) {
    if (isViewer) { showMessage("You are in view-only mode."); return; }
    try {
        const response = await callBackend('/toss-choice', { choice });
        updateUI(response.gameState);

        tossSection.classList.add('hidden');
        gameplaySection.classList.remove('hidden');
        showMessage(`Match starts! ${response.gameState.teams[response.gameState.battingTeamId].name} will bat first.`);
    } catch (error) {
        // Error handled by callBackend
    }
}

// Run Buttons
runButtons.forEach(button => {
    button.addEventListener('click', async (event) => {
        if (isViewer) { showMessage("You are in view-only mode."); return; }
        const runs = parseInt(event.target.dataset.runs);
        try {
            const response = await callBackend('/action', { actionType: 'runs', runs });
            updateUI(response.gameState);
            if (response.message) showMessage(response.message);
        } catch (error) {
            // Error handled by callBackend
        }
    });
});

// Wicket Button
wicketBtn.addEventListener('click', async () => {
    if (isViewer) { showMessage("You are in view-only mode."); return; }
    try {
        const response = await callBackend('/action', { actionType: 'wicket' });
        updateUI(response.gameState);
        if (response.message) showMessage(response.message);
    } catch (error) {
        // Error handled by callBackend
    }
});

// Extra Button
extraBtn.addEventListener('click', async () => {
    if (isViewer) { showMessage("You are in view-only mode."); return; }
    try {
        const response = await callBackend('/action', { actionType: 'extra', runs: 1 });
        updateUI(response.gameState);
        if (response.message) showMessage(response.message);
    } catch (error) {
        // Error handled by callBackend
    }
});

// No-Ball Button
noBallBtn.addEventListener('click', async () => {
    if (isViewer) { showMessage("You are in view-only mode."); return; }
    try {
        const response = await callBackend('/action', { actionType: 'no-ball', runs: 1 });
        updateUI(response.gameState);
        if (response.message) showMessage(response.message);
    } catch (error) {
        // Error handled by callBackend
    }
});

// Wide Button
wideBtn.addEventListener('click', async () => {
    if (isViewer) { showMessage("You are in view-only mode."); return; }
    try {
        const response = await callBackend('/action', { actionType: 'wide', runs: 1 });
        updateUI(response.gameState);
        if (response.message) showMessage(response.message);
    } catch (error) {
        // Error handled by callBackend
    }
});

// Undo Button
undoBtn.addEventListener('click', async () => {
    if (isViewer) { showMessage("You are in view-only mode."); return; }
    try {
        const response = await callBackend('/undo');
        updateUI(response.gameState);
        if (response.message) showMessage(response.message);
    } catch (error) {
        // Error handled by callBackend
    }
});

// End Innings Button
endInningsBtn.addEventListener('click', () => {
    if (isViewer) { showMessage("You are in view-only mode."); return; }
    showConfirmBox("Are you sure you want to end the current innings?", async () => {
        try {
            const response = await callBackend('/end-innings');
            updateUI(response.gameState);
            if (response.message) showMessage(response.message);
        } catch (error) {
            // Error handled by callBackend
        }
    });
});

// End Match and go to Home (Setup) Page button
endMatchHomeBtn.addEventListener('click', () => {
    showConfirmBox("Are you sure you want to end the match and go to the home page? All current scores will be lost.", () => {
        resetGameUI();
        showMessage("Match ended. Returning to setup.");
        // Clear URL parameters
        history.pushState({}, '', window.location.pathname);
    });
});

// Reset Match Button (from result screen)
resetMatchBtn.addEventListener('click', async () => {
    resetGameUI();
    showMessage("Ready for a new match!");
    // Clear URL parameters
    history.pushState({}, '', window.location.pathname);
});

// Message Box OK Button
messageOkBtn.addEventListener('click', () => {
    hideMessageBox();
    if (confirmCallback) {
        confirmCallback();
        confirmCallback = null;
    }
});

// Player Select Change (for changing strike batsman)
team1StrikePlayerSelect.addEventListener('change', async (event) => {
    if (isViewer) { showMessage("You are in view-only mode."); return; }
    const newStrikerIndex = parseInt(event.target.value);
    try {
        const response = await callBackend('/switch-strike', { teamId: 'team1', newStrikerIndex });
        updateUI(response.gameState);
    } catch (error) {
        // Error handled by callBackend
    }
});

team2StrikePlayerSelect.addEventListener('change', async (event) => {
    if (isViewer) { showMessage("You are in view-only mode."); return; }
    const newStrikerIndex = parseInt(event.target.value);
    try {
        const response = await callBackend('/switch-strike', { teamId: 'team2', newStrikerIndex });
        updateUI(response.gameState);
    } catch (error) {
        // Error handled by callBackend
    }
});

// Initial load: Check for room code in URL
async function loadInitialGameState() {
    const urlParams = new URLSearchParams(window.location.search);
    const roomCodeFromURL = urlParams.get('room');

    if (roomCodeFromURL) {
        roomCodeInput.value = roomCodeFromURL; // Populate input
        try {
            const response = await callBackend(`/join`, { roomCode: roomCodeFromURL }, 'GET');
            matchId = response.matchId;
            isViewer = true; // This client is a viewer
            updateUI(response.gameState);
            showMessage(`Joined match with Room Code: ${roomCodeFromURL}. You are in view-only mode.`);
        } catch (error) {
            showMessage(error.message || "Failed to load match from URL. Please check the room code.");
            resetGameUI(); // Go back to initial setup if load fails
        }
    } else {
        resetGameUI(); // Start fresh if no room code in URL
    }
}

loadInitialGameState(); // Call on page load

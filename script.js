        // Game state variables
        let gameStarted = false;
        let timer;
        let timeLeft;
        let moves = 0;
        let score = 0;
        let flippedCards = [];
        let matchedPairs = 0;
        let totalPairs = 0;
        let currentDifficulty = 'easy';
        let soundEnabled = true;
        let playerName = "Player";
        let specialCardsCount = 1;
        
        // DOM elements
        const gameBoard = document.getElementById('game-board');
        const movesElement = document.getElementById('moves');
        const timerElement = document.getElementById('timer');
        const scoreElement = document.getElementById('score');
        const startBtn = document.getElementById('start-btn');
        const resetBtn = document.getElementById('reset-btn');
        const difficultyBtns = document.querySelectorAll('.difficulty-btn');
        const gameOverModal = document.getElementById('game-over-modal');
        const modalTitle = document.getElementById('modal-title');
        const modalMessage = document.getElementById('modal-message');
        const modalBtn = document.getElementById('modal-btn');
        const soundToggle = document.getElementById('sound-toggle');
        const playerNameInput = document.getElementById('player-name');
        const timeLimitInput = document.getElementById('time-limit');
        const specialCardsSelect = document.getElementById('special-cards');
        
        // Sound elements
        const flipSound = document.getElementById('flip-sound');
        const matchSound = document.getElementById('match-sound');
        const bombSound = document.getElementById('bomb-sound');
        const clockSound = document.getElementById('clock-sound');
        const shuffleSound = document.getElementById('shuffle-sound');
        const winSound = document.getElementById('win-sound');
        const loseSound = document.getElementById('lose-sound');
        
        // Difficulty settings
        const difficultySettings = {
            easy: { pairs: 8, time: 60 },
            medium: { pairs: 10, time: 75 },
            hard: { pairs: 12, time: 90 }
        };
        
        // Card symbols (emojis)
        const cardSymbols = ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🐔', '🐧', '🐦'];
        
        // Special card types
        const specialCards = [
            { type: 'bomb', symbol: '💣', effect: 'Lose 10 seconds' },
            { type: 'clock', symbol: '⏱️', effect: 'Gain 15 seconds' },
            { type: 'shuffle', symbol: '🔀', effect: 'Shuffle all cards' }
        ];
        
        // Initialize the game
        function initGame() {
            resetGame();
            setupEventListeners();
        }
        
        // Set up event listeners
        function setupEventListeners() {
            startBtn.addEventListener('click', startGame);
            resetBtn.addEventListener('click', resetGame);
            modalBtn.addEventListener('click', () => {
                gameOverModal.classList.remove('active');
                resetGame();
            });
            
            difficultyBtns.forEach(btn => {
                btn.addEventListener('click', () => {
                    if (gameStarted) return;
                    
                    difficultyBtns.forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    currentDifficulty = btn.dataset.difficulty;
                    
                    // Update game board class for responsive layout
                    gameBoard.className = 'game-board ' + currentDifficulty;
                    
                    generateCards();
                });
            });
            
            soundToggle.addEventListener('change', () => {
                soundEnabled = soundToggle.checked;
            });
            
            playerNameInput.addEventListener('change', () => {
                playerName = playerNameInput.value || "Player";
            });
            
            timeLimitInput.addEventListener('change', () => {
                const time = parseInt(timeLimitInput.value);
                if (time >= 30 && time <= 300) {
                    difficultySettings.easy.time = time;
                    difficultySettings.medium.time = Math.floor(time * 1.25);
                    difficultySettings.hard.time = Math.floor(time * 1.5);
                    timeLeft = difficultySettings[currentDifficulty].time;
                    updateTimer();
                }
            });
            
            specialCardsSelect.addEventListener('change', () => {
                specialCardsCount = parseInt(specialCardsSelect.value);
                if (!gameStarted) {
                    generateCards();
                }
            });
        }
        
        // Start the game
        function startGame() {
            if (gameStarted) return;
            
            gameStarted = true;
            startBtn.disabled = true;
            
            const settings = difficultySettings[currentDifficulty];
            timeLeft = settings.time;
            updateTimer();
            
            timer = setInterval(() => {
                timeLeft--;
                updateTimer();
                
                if (timeLeft <= 0) {
                    endGame(false);
                } else if (timeLeft <= 10) {
                    timerElement.classList.add('timer-warning');
                }
            }, 1000);
        }
        
        // Reset the game
        function resetGame() {
            clearInterval(timer);
            gameStarted = false;
            startBtn.disabled = false;
            
            const settings = difficultySettings[currentDifficulty];
            timeLeft = settings.time;
            moves = 0;
            score = 0;
            flippedCards = [];
            matchedPairs = 0;
            
            updateTimer();
            updateMoves();
            updateScore();
            
            timerElement.classList.remove('timer-warning');
            gameOverModal.classList.remove('active');
            
            generateCards();
        }
        
        // Generate cards for the current difficulty
        function generateCards() {
            gameBoard.innerHTML = '';
            flippedCards = [];
            matchedPairs = 0;
            
            const settings = difficultySettings[currentDifficulty];
            totalPairs = settings.pairs;
            
            // Get symbols for the current game
            const gameSymbols = [...cardSymbols]
                .sort(() => Math.random() - 0.5)
                .slice(0, settings.pairs);
            
            // Create card pairs
            let cards = [];
            gameSymbols.forEach(symbol => {
                cards.push({ type: 'normal', symbol });
                cards.push({ type: 'normal', symbol });
            });
            
            // Add special cards
            for (let i = 0; i < specialCardsCount; i++) {
                const specialCard = {...specialCards[i % specialCards.length]};
                cards.push(specialCard);
                cards.push(specialCard);
                totalPairs++; // Special cards also count as pairs
            }
            
            // Shuffle the cards
            cards = cards.sort(() => Math.random() - 0.5);
            
            // Create card elements
            cards.forEach((card, index) => {
                const cardElement = document.createElement('div');
                cardElement.className = 'card';
                cardElement.dataset.index = index;
                cardElement.dataset.type = card.type;
                cardElement.dataset.symbol = card.symbol;
                
                if (card.type !== 'normal') {
                    cardElement.classList.add('special');
                }
                
                cardElement.innerHTML = `
                    <div class="card-face card-front">${card.symbol}</div>
                    <div class="card-face card-back">?</div>
                `;
                
                cardElement.addEventListener('click', () => flipCard(cardElement));
                gameBoard.appendChild(cardElement);
            });
        }
        
        // Flip a card
        function flipCard(card) {
            if (!gameStarted) {
                startGame();
            }
            
            // If already flipped or matched, do nothing
            if (card.classList.contains('flipped') || card.classList.contains('matched')) {
                return;
            }
            
            // If two cards are already flipped, do nothing
            if (flippedCards.length === 2) {
                return;
            }
            
            // Play flip sound
            if (soundEnabled) {
                flipSound.currentTime = 0;
                flipSound.play();
            }
            
            // Flip the card
            card.classList.add('flipped');
            flippedCards.push(card);
            
            // If two cards are flipped, check for match
            if (flippedCards.length === 2) {
                moves++;
                updateMoves();
                
                setTimeout(checkMatch, 700);
            }
        }
        
        // Check if flipped cards match
        function checkMatch() {
            const card1 = flippedCards[0];
            const card2 = flippedCards[1];
            
            const isMatch = card1.dataset.symbol === card2.dataset.symbol;
            
            if (isMatch) {
                // Cards match
                card1.classList.add('matched');
                card2.classList.add('matched');
                
                // Play match sound
                if (soundEnabled) {
                    matchSound.currentTime = 0;
                    matchSound.play();
                }
                
                // Handle special cards
                if (card1.dataset.type !== 'normal') {
                    handleSpecialCard(card1.dataset.type);
                }
                
                // Update score and matched pairs
                score += 100;
                matchedPairs++;
                updateScore();
                
                // Check for win
                if (matchedPairs === totalPairs) {
                    endGame(true);
                }
            } else {
                // Cards don't match - flip them back
                card1.classList.remove('flipped');
                card2.classList.remove('flipped');
            }
            
            // Reset flipped cards
            flippedCards = [];
        }
        
        // Handle special card effects
        function handleSpecialCard(type) {
            switch (type) {
                case 'bomb':
                    // Lose 10 seconds
                    timeLeft = Math.max(5, timeLeft - 10);
                    updateTimer();
                    if (soundEnabled) {
                        bombSound.currentTime = 0;
                        bombSound.play();
                    }
                    break;
                    
                case 'clock':
                    // Gain 15 seconds
                    timeLeft += 15;
                    updateTimer();
                    if (soundEnabled) {
                        clockSound.currentTime = 0;
                        clockSound.play();
                    }
                    break;
                    
                case 'shuffle':
                    // Shuffle all unmatched cards
                    if (soundEnabled) {
                        shuffleSound.currentTime = 0;
                        shuffleSound.play();
                    }
                    setTimeout(shuffleCards, 500);
                    break;
            }
        }
        
        // Shuffle all unmatched cards
        function shuffleCards() {
            const unmatchedCards = Array.from(document.querySelectorAll('.card:not(.matched)'));
            const shuffledSymbols = unmatchedCards.map(card => card.dataset.symbol).sort(() => Math.random() - 0.5);
            
            unmatchedCards.forEach((card, index) => {
                card.classList.remove('flipped');
                card.dataset.symbol = shuffledSymbols[index];
                card.querySelector('.card-front').textContent = shuffledSymbols[index];
            });
        }
        
        // End the game
        function endGame(isWin) {
            clearInterval(timer);
            gameStarted = false;
            startBtn.disabled = false;
            
            if (soundEnabled) {
                if (isWin) {
                    winSound.currentTime = 0;
                    winSound.play();
                } else {
                    loseSound.currentTime = 0;
                    loseSound.play();
                }
            }
            
            if (isWin) {
                // Bonus points for time left
                score += timeLeft * 10;
                updateScore();
                
                modalTitle.textContent = 'Congratulations ' + playerName + '!';
                modalMessage.textContent = `You found all pairs with ${moves} moves and scored ${score} points.`;
            } else {
                modalTitle.textContent = 'Game Over';
                modalMessage.textContent = `Time's up ${playerName}! You scored ${score} points. Try again!`;
            }
            
            gameOverModal.classList.add('active');
        }
        
        // Update timer display
        function updateTimer() {
            timerElement.textContent = timeLeft;
        }
        
        // Update moves display
        function updateMoves() {
            movesElement.textContent = moves;
        }
        
        // Update score display
        function updateScore() {
            scoreElement.textContent = score;
        }
        
        // Initialize the game when the page loads
        window.addEventListener('load', initGame);

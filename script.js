class FlipFusionGame {
    constructor() {
        this.config = {
            boardSize: 'large',
            matchablePairs: 1,
            cardSet: 'ace-spades'
        };
        
        this.gameState = {
            cards: [],
            flippedCards: [],
            matchedPairs: 0,
            moves: 0,
            timer: 0,
            gameStarted: false,
            gameInterval: null,
            isPaused: false
        };
        
        this.cardTypes = ['ace-spades', 'strawberry', 'hedgehog', 'owl', 'king', 'knight'];
        this.boardSizes = {
            small: { rows: 3, cols: 4, total: 12 },
            medium: { rows: 4, cols: 6, total: 24 },
            large: { rows: 6, cols: 8, total: 48 }
        };
        
        this.init();
    }
    
    init() {
        this.loadConfig();
        this.bindEvents();
        this.updateConfigDisplay();
    }
    
    loadConfig() {
        const saved = localStorage.getItem('flipfusion-config');
        if (saved) {
            this.config = { ...this.config, ...JSON.parse(saved) };
        }
    }
    
    saveConfig() {
        localStorage.setItem('flipfusion-config', JSON.stringify(this.config));
    }
    
    bindEvents() {
        // Home screen configuration
        document.querySelectorAll('[data-size]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('[data-size]').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.config.boardSize = e.target.dataset.size;
                this.saveConfig();
            });
        });
        
        document.querySelectorAll('[data-pairs]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('[data-pairs]').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.config.matchablePairs = parseInt(e.target.dataset.pairs);
                this.saveConfig();
            });
        });
        
        document.querySelectorAll('[data-card]').forEach(preview => {
            preview.addEventListener('click', (e) => {
                document.querySelectorAll('[data-card]').forEach(p => p.classList.remove('active'));
                e.currentTarget.classList.add('active');
                this.config.cardSet = e.currentTarget.dataset.card;
                this.saveConfig();
            });
        });
        
        // Game controls
        document.getElementById('start-btn').addEventListener('click', () => this.startGame());
        document.getElementById('pause-btn').addEventListener('click', () => this.togglePause());
        document.getElementById('home-btn').addEventListener('click', () => this.goHome());
        document.getElementById('new-game-btn').addEventListener('click', () => this.startGame());
        
        // Modal controls
        document.getElementById('play-again-btn').addEventListener('click', () => {
            this.hideWinModal();
            this.startGame();
        });
        
        document.getElementById('back-home-btn').addEventListener('click', () => {
            this.hideWinModal();
            this.goHome();
        });
    }
    
    updateConfigDisplay() {
        // Update button states
        document.querySelectorAll('[data-size]').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.size === this.config.boardSize);
        });
        
        document.querySelectorAll('[data-pairs]').forEach(btn => {
            btn.classList.toggle('active', parseInt(btn.dataset.pairs) === this.config.matchablePairs);
        });
        
        document.querySelectorAll('[data-card]').forEach(preview => {
            preview.classList.toggle('active', preview.dataset.card === this.config.cardSet);
        });
    }
    
    startGame() {
        this.showGameScreen();
        this.initializeGame();
        this.createGameBoard();
        this.startTimer();
    }
    
    initializeGame() {
        this.gameState = {
            cards: [],
            flippedCards: [],
            matchedPairs: 0,
            moves: 0,
            timer: 0,
            gameStarted: true,
            gameInterval: null,
            isPaused: false
        };
        
        this.updateGameDisplay();
    }
    
    createGameBoard() {
        const boardConfig = this.boardSizes[this.config.boardSize];
        const totalCards = boardConfig.total;
        const pairsNeeded = totalCards / 2;
        
        // Create card pairs
        const cards = [];
        const availableCards = [...this.cardTypes];
        
        for (let i = 0; i < pairsNeeded; i++) {
            const cardType = availableCards[i % availableCards.length];
            cards.push(cardType, cardType);
        }
        
        // Shuffle cards
        this.shuffleArray(cards);
        
        // Create game board HTML
        const gameBoard = document.getElementById('game-board');
        gameBoard.className = `game-board ${this.config.boardSize}`;
        gameBoard.innerHTML = '';
        
        cards.forEach((cardType, index) => {
            const cardElement = this.createCardElement(cardType, index);
            gameBoard.appendChild(cardElement);
        });
        
        this.gameState.cards = cards;
    }
    
    createCardElement(cardType, index) {
        const card = document.createElement('div');
        card.className = 'game-card';
        card.dataset.index = index;
        card.dataset.type = cardType;
        
        card.innerHTML = `
            <div class="card-inner">
                <div class="card-back"></div>
                <div class="card-front">
                    <img src="assets/${cardType}.svg" alt="${cardType}">
                </div>
            </div>
        `;
        
        card.addEventListener('click', () => this.flipCard(card));
        
        return card;
    }
    
    flipCard(cardElement) {
        if (this.gameState.isPaused || 
            cardElement.classList.contains('flipped') || 
            cardElement.classList.contains('matched') ||
            this.gameState.flippedCards.length >= 2) {
            return;
        }
        
        cardElement.classList.add('flipped');
        this.gameState.flippedCards.push(cardElement);
        
        if (this.gameState.flippedCards.length === 2) {
            this.gameState.moves++;
            this.updateGameDisplay();
            
            setTimeout(() => this.checkMatch(), 1000);
        }
    }
    
    checkMatch() {
        const [card1, card2] = this.gameState.flippedCards;
        const type1 = card1.dataset.type;
        const type2 = card2.dataset.type;
        
        if (type1 === type2) {
            // Match found
            card1.classList.add('matched');
            card2.classList.add('matched');
            this.gameState.matchedPairs++;
            
            if (this.gameState.matchedPairs === this.gameState.cards.length / 2) {
                this.endGame();
            }
        } else {
            // No match
            card1.classList.remove('flipped');
            card2.classList.remove('flipped');
        }
        
        this.gameState.flippedCards = [];
    }
    
    startTimer() {
        this.gameState.gameInterval = setInterval(() => {
            if (!this.gameState.isPaused) {
                this.gameState.timer++;
                this.updateGameDisplay();
            }
        }, 1000);
    }
    
    stopTimer() {
        if (this.gameState.gameInterval) {
            clearInterval(this.gameState.gameInterval);
            this.gameState.gameInterval = null;
        }
    }
    
    togglePause() {
        this.gameState.isPaused = !this.gameState.isPaused;
        const pauseBtn = document.getElementById('pause-btn');
        pauseBtn.textContent = this.gameState.isPaused ? '▶' : '⏸';
        
        // Hide/show cards when paused
        const gameBoard = document.getElementById('game-board');
        gameBoard.style.opacity = this.gameState.isPaused ? '0.3' : '1';
        gameBoard.style.pointerEvents = this.gameState.isPaused ? 'none' : 'auto';
    }
    
    endGame() {
        this.stopTimer();
        this.showWinModal();
    }
    
    updateGameDisplay() {
        document.getElementById('timer').textContent = this.formatTime(this.gameState.timer);
        document.getElementById('moves').textContent = this.gameState.moves;
    }
    
    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    
    showGameScreen() {
        document.getElementById('home-screen').classList.remove('active');
        document.getElementById('game-screen').classList.add('active');
    }
    
    showHomeScreen() {
        document.getElementById('game-screen').classList.remove('active');
        document.getElementById('home-screen').classList.add('active');
    }
    
    showWinModal() {
        document.getElementById('final-time').textContent = this.formatTime(this.gameState.timer);
        document.getElementById('final-moves').textContent = this.gameState.moves;
        document.getElementById('win-modal').classList.add('active');
    }
    
    hideWinModal() {
        document.getElementById('win-modal').classList.remove('active');
    }
    
    goHome() {
        this.stopTimer();
        this.showHomeScreen();
        this.hideWinModal();
    }
    
    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }
}

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new FlipFusionGame();
});

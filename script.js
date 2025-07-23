class AssetLoader {
    constructor() {
        this.cacheVersion = 'flipfusion-v1-assets';
        this.maxRetries = 3;
        this.assetList = [];
        this.loadedAssets = 0;
        this.totalAssets = 0;
        
        this.generateAssetList();
    }
    
    generateAssetList() {
        // Core assets
        this.assetList = [
            '/styles.css',
            '/script.js',
            '/assets/fonts/font1.ttf',
            '/assets/fonts/font2.ttf'
        ];
        
        // Card set configurations (reordered)
        const cardSets = {
            monsters: { count: 25, extension: 'png' },
            classic: { count: 100, extension: 'svg' },
            flags: { count: 100, extension: 'svg' }
        };
        
        // Add card back images
        Object.keys(cardSets).forEach(setName => {
            this.assetList.push(`/assets/cards_set_${setName}/${setName}_cards_back.svg`);
        });
        
        // Add card images (sample a reasonable number for initial loading)
        Object.entries(cardSets).forEach(([setName, config]) => {
            const loadCount = Math.min(config.count, setName === 'classic' || setName === 'flags' ? 32 : config.count);
            for (let i = 1; i <= loadCount; i++) {
                const prefix = setName === 'classic' ? 'classic' :
                             setName === 'flags' ? 'flag' : 'monster';
                this.assetList.push(`/assets/cards_set_${setName}/${prefix}${i}.${config.extension}`);
            }
        });
        
        this.totalAssets = this.assetList.length;
    }
    
    async loadAssets() {
        try {
            this.updateProgress(0, 'Checking cache...');
            
            const cache = await caches.open(this.cacheVersion);
            const cachedUrls = await cache.keys();
            const cachedPaths = cachedUrls.map(req => new URL(req.url).pathname);
            
            // Filter assets that need to be loaded
            const assetsToLoad = this.assetList.filter(asset => !cachedPaths.includes(asset));
            
            if (assetsToLoad.length === 0) {
                this.updateProgress(100, 'Assets ready!');
                return true;
            }
            
            this.updateProgress(10, `Loading ${assetsToLoad.length} assets...`);
            
            // Load assets in batches for better performance
            const batchSize = 5;
            let loadedCount = cachedPaths.length;
            
            for (let i = 0; i < assetsToLoad.length; i += batchSize) {
                const batch = assetsToLoad.slice(i, i + batchSize);
                await Promise.all(batch.map(async (asset) => {
                    await this.loadAndCacheAsset(cache, asset);
                    loadedCount++;
                    const progress = Math.round((loadedCount / this.totalAssets) * 100);
                    this.updateProgress(progress, `Loading assets... ${loadedCount}/${this.totalAssets}`);
                }));
            }
            
            this.updateProgress(100, 'All assets cached!');
            return true;
            
        } catch (error) {
            console.error('Asset loading failed:', error);
            this.updateProgress(0, 'Loading failed. Retrying...');
            return false;
        }
    }
    
    async loadAndCacheAsset(cache, assetPath, retries = 0) {
        try {
            const response = await fetch(assetPath);
            if (!response.ok) {
                throw new Error(`Failed to fetch ${assetPath}: ${response.status}`);
            }
            
            await cache.put(assetPath, response.clone());
            return response;
            
        } catch (error) {
            if (retries < this.maxRetries) {
                console.warn(`Retrying ${assetPath} (attempt ${retries + 1}/${this.maxRetries})`);
                await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
                return this.loadAndCacheAsset(cache, assetPath, retries + 1);
            } else {
                console.error(`Failed to load ${assetPath} after ${this.maxRetries} attempts:`, error);
                throw error;
            }
        }
    }
    
    updateProgress(percentage, text) {
        const progressFill = document.getElementById('progress-fill');
        const loadingText = document.getElementById('loading-text');
        const loadingPercentage = document.getElementById('loading-percentage');
        
        if (progressFill) progressFill.style.width = `${percentage}%`;
        if (loadingText) loadingText.textContent = text;
        if (loadingPercentage) loadingPercentage.textContent = `${percentage}%`;
    }
    
    // Override fetch to always use cache when available
    static setupCacheInterception() {
        const originalFetch = window.fetch;
        window.fetch = async (input, init) => {
            try {
                const cache = await caches.open('flipfusion-v1-assets');
                const cachedResponse = await cache.match(input);
                if (cachedResponse) {
                    return cachedResponse.clone();
                }
            } catch (error) {
                console.warn('Cache lookup failed, falling back to network:', error);
            }
            return originalFetch(input, init);
        };
    }
}

class FlipFusionGame {
    constructor() {
        this.config = {
            boardSize: 'medium',
            matchablePairs: 1,
            cardSet: 'monsters',
            mode: 'casual'
        };
        
        this.gameState = {
            cards: [],
            flippedCards: [],
            matchedPairs: 0,
            moves: 0,
            timer: 0,
            gameStarted: false,
            gameInterval: null,
            isPaused: false,
            isGameOver: false,
            gameWon: false,
            movesRemaining: 0,
            timeRemaining: 0
        };
        
        // Card set configurations with extensions and counts (reordered)
        this.cardSetConfigs = {
            monsters: { extension: 'png', count: 25, prefix: 'monster' }, // Updated with many cards
            classic: { extension: 'svg', count: 100, prefix: 'classic' }, // Updated with many cards
            flags: { extension: 'svg', count: 100, prefix: 'flag' } // Updated with many cards  
        };
        
        // Generate card arrays dynamically
        this.cardSets = {};
        for (const [setName, config] of Object.entries(this.cardSetConfigs)) {
            this.cardSets[setName] = [];
            for (let i = 1; i <= config.count; i++) {
                this.cardSets[setName].push(`${config.prefix}${i}`);
            }
        }
        this.boardSizes = {
            small: { rows: 4, cols: 4, total: 16 },
            medium: { rows: 4, cols: 8, total: 32 },
            large: { rows: 8, cols: 8, total: 64 }
        };
        
        // Difficulty configurations with time and move limits per board size
        this.modeConfigs = {
            rush: {
                small: { timeLimit: 180 }, // 3 minutes for small board
                medium: { timeLimit: 300 }, // 5 minutes for medium board
                large: { timeLimit: 480 } // 8 minutes for large board
            },
            moves: {
                small: { moveLimit: 25 }, // 25 moves for 16 cards (small)
                medium: { moveLimit: 50 }, // 50 moves for 32 cards (medium)
                large: { moveLimit: 100 } // 100 moves for 64 cards (large)
            },
            casual: {} // No limits
        };
        
        this.init();
    }
    
    async init() {
        // Only initialize game logic, don't show home screen yet
        this.loadConfig();
        this.bindEvents();
        this.updateConfigDisplay();
    }
    
    showHomeScreen() {
        document.getElementById('loading-screen').classList.remove('active');
        document.getElementById('home-screen').classList.add('active');
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
        
        document.querySelectorAll('[data-mode]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('[data-mode]').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.config.mode = e.target.dataset.mode;
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
        
        document.querySelectorAll('[data-mode]').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.mode === this.config.mode);
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
            isPaused: false,
            isGameOver: false,
            gameWon: false,
            movesRemaining: 0,
            timeRemaining: 0
        };
        
        // Initialize based on game mode
        if (this.config.mode === 'rush') {
            const modeConfig = this.modeConfigs.rush[this.config.boardSize];
            this.gameState.timeRemaining = modeConfig.timeLimit;
            this.gameState.timer = modeConfig.timeLimit;
        } else if (this.config.mode === 'moves') {
            const modeConfig = this.modeConfigs.moves[this.config.boardSize];
            this.gameState.movesRemaining = modeConfig.moveLimit;
        }
        
        this.updateGameDisplay();
        this.updateDisplayLabels();
    }
    
    updateDisplayLabels() {
        const timerLabel = document.getElementById('timer-label');
        const movesLabel = document.getElementById('moves-label');
        
        if (this.config.mode === 'rush') {
            timerLabel.textContent = 'Time Left';
            movesLabel.textContent = 'Moves';
        } else if (this.config.mode === 'moves') {
            timerLabel.textContent = 'Time';
            movesLabel.textContent = 'Moves Left';
        } else {
            timerLabel.textContent = 'Time';
            movesLabel.textContent = 'Moves';
        }
    }
    
    createGameBoard() {
        const boardConfig = this.boardSizes[this.config.boardSize];
        const totalCards = boardConfig.total;
        const pairsNeeded = totalCards / 2;
        
        // Create card pairs
        const cards = [];
        const availableCards = [...this.cardSets[this.config.cardSet]];
        
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
        
        // Get the correct file extension for this card set
        const cardSetConfig = this.cardSetConfigs[this.config.cardSet];
        const extension = cardSetConfig.extension;
        
        card.innerHTML = `
            <div class="card-inner">
                <div class="card-back">
                    <img src="assets/cards_set_${this.config.cardSet}/${this.config.cardSet}_cards_back.svg" alt="Card Back">
                </div>
                <div class="card-front">
                    <img src="assets/cards_set_${this.config.cardSet}/${cardType}.${extension}" alt="${cardType}">
                </div>
            </div>
        `;
        
        card.addEventListener('click', () => this.flipCard(card));
        
        return card;
    }
    
    flipCard(cardElement) {
        if (this.gameState.isPaused || 
            this.gameState.isGameOver ||
            cardElement.classList.contains('flipped') || 
            cardElement.classList.contains('matched') ||
            this.gameState.flippedCards.length >= 2) {
            return;
        }
        
        // Use requestAnimationFrame for smoother animations
        requestAnimationFrame(() => {
            cardElement.classList.add('flipped');
            this.gameState.flippedCards.push(cardElement);
            
            if (this.gameState.flippedCards.length === 2) {
                this.gameState.moves++;
                
                // Update moves remaining for moves mode
                if (this.config.mode === 'moves') {
                    this.gameState.movesRemaining--;
                }
                
                this.updateGameDisplay();
                
                // Check if out of moves in moves mode
                if (this.config.mode === 'moves' && this.gameState.movesRemaining <= 0) {
                    setTimeout(() => this.endGame(false), 800);
                    return;
                }
                
                setTimeout(() => this.checkMatch(), 800);
            }
        });
    }
    
    checkMatch() {
        const [card1, card2] = this.gameState.flippedCards;
        const type1 = card1.dataset.type;
        const type2 = card2.dataset.type;
        
        if (type1 === type2) {
            // Match found
            requestAnimationFrame(() => {
                card1.classList.add('matched');
                card2.classList.add('matched');
                this.gameState.matchedPairs++;
                
                if (this.gameState.matchedPairs === this.gameState.cards.length / 2) {
                    // Small delay before showing win modal for better UX
                    setTimeout(() => this.endGame(true), 300);
                }
            });
        } else {
            // No match - flip back with slight delay for better visibility
            requestAnimationFrame(() => {
                card1.classList.remove('flipped');
                card2.classList.remove('flipped');
            });
        }
        
        this.gameState.flippedCards = [];
    }
    
    startTimer() {
        this.gameState.gameInterval = setInterval(() => {
            if (!this.gameState.isPaused && !this.gameState.isGameOver) {
                if (this.config.mode === 'rush') {
                    // Count down for rush mode
                    this.gameState.timeRemaining--;
                    this.gameState.timer = this.gameState.timeRemaining;
                    
                    if (this.gameState.timeRemaining <= 0) {
                        this.endGame(false);
                        return;
                    }
                } else {
                    // Count up for casual and moves mode
                    this.gameState.timer++;
                }
                
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
    
    endGame(won = true) {
        this.gameState.isGameOver = true;
        this.gameState.gameWon = won;
        this.stopTimer();
        this.showWinModal(won);
    }
    
    updateGameDisplay() {
        // Update timer display based on mode
        let timerValue = this.gameState.timer;
        if (this.config.mode === 'rush') {
            timerValue = Math.max(0, this.gameState.timeRemaining);
        }
        
        document.getElementById('timer').textContent = this.formatTime(timerValue);
        
        // Update moves display based on mode
        let movesValue = this.gameState.moves;
        if (this.config.mode === 'moves') {
            movesValue = Math.max(0, this.gameState.movesRemaining);
        }
        document.getElementById('moves').textContent = movesValue;
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
    
    showHomeScreenFromGame() {
        document.getElementById('game-screen').classList.remove('active');
        document.getElementById('home-screen').classList.add('active');
    }
    
    showWinModal(won = true) {
        const resultTitle = document.getElementById('result-title');
        const resultMessage = document.getElementById('result-message');
        const finalTime = document.getElementById('final-time');
        const finalMoves = document.getElementById('final-moves');
        const finalMode = document.getElementById('final-mode');
        
        // Set appropriate time display (elapsed time, not remaining)
        let timeToShow = this.gameState.timer;
        if (this.config.mode === 'rush') {
            const originalTime = this.modeConfigs.rush[this.config.boardSize].timeLimit;
            timeToShow = originalTime - Math.max(0, this.gameState.timeRemaining);
        }
        
        finalTime.textContent = this.formatTime(timeToShow);
        finalMoves.textContent = this.gameState.moves;
        // Display proper difficulty names
        const difficultyNames = {
            'casual': 'Casual',
            'rush': 'Time',
            'moves': 'Moves'
        };
        finalMode.textContent = difficultyNames[this.config.mode] || 'Casual';
        
        if (won) {
            resultTitle.textContent = 'Congratulations!';
            resultMessage.textContent = 'You completed the game!';
        } else {
            resultTitle.textContent = 'Game Over!';
            if (this.config.mode === 'rush') {
                resultMessage.textContent = "Time's up!";
            } else if (this.config.mode === 'moves') {
                resultMessage.textContent = "No more moves!";
            }
        }
        
        document.getElementById('win-modal').classList.add('active');
    }
    
    hideWinModal() {
        document.getElementById('win-modal').classList.remove('active');
    }
    
    goHome() {
        this.stopTimer();
        this.showHomeScreenFromGame();
        this.hideWinModal();
    }
    
    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }
}

// Browser interaction disabling functions
function disableBrowserInteractions() {
    // Prevent all scrolling behaviors
    document.addEventListener('wheel', (e) => e.preventDefault(), { passive: false });
    document.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });
    document.addEventListener('scroll', (e) => e.preventDefault(), { passive: false });
    
    // Prevent keyboard navigation that causes scrolling
    document.addEventListener('keydown', (e) => {
        // Allow game-specific keys but prevent browser shortcuts
        const preventKeys = [
            'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
            'PageUp', 'PageDown', 'Home', 'End', 'Space'
        ];
        
        // Only prevent specific browser shortcuts that interfere with game, allow Windows shortcuts
        if ((e.ctrlKey || e.metaKey) && (
            e.key === '+' || e.key === '-' || e.key === '=' || 
            e.key === '0' // Only prevent zoom-related shortcuts, allow other Ctrl shortcuts
        )) {
            e.preventDefault();
        }
        
        // Allow function keys - removed F key blocking
        
        if (preventKeys.includes(e.key)) {
            e.preventDefault();
        }
    }, { passive: false });
    
    // Prevent right-click context menu
    document.addEventListener('contextmenu', (e) => e.preventDefault());
    
    // Prevent text selection and dragging
    document.addEventListener('selectstart', (e) => e.preventDefault());
    document.addEventListener('dragstart', (e) => e.preventDefault());
    
    // Prevent zoom gestures
    document.addEventListener('gesturestart', (e) => e.preventDefault());
    document.addEventListener('gesturechange', (e) => e.preventDefault());
    document.addEventListener('gestureend', (e) => e.preventDefault());
    
    // Prevent double-tap zoom on mobile
    let lastTouchEnd = 0;
    document.addEventListener('touchend', (e) => {
        const now = (new Date()).getTime();
        if (now - lastTouchEnd <= 300) {
            e.preventDefault();
        }
        lastTouchEnd = now;
    }, { passive: false });
    
    // Prevent pinch zoom
    document.addEventListener('touchstart', (e) => {
        if (e.touches.length > 1) {
            e.preventDefault();
        }
    }, { passive: false });
    
    // Additional mobile zoom prevention
    document.addEventListener('touchmove', (e) => {
        if (e.scale !== 1) {
            e.preventDefault();
        }
    }, { passive: false });
}

// Enhanced responsive viewport adjustment for both fullscreen and windowed modes
function handleViewportResize() {
    // Update CSS custom properties for dynamic sizing
    const vh = window.innerHeight * 0.01;
    const vw = window.innerWidth * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
    document.documentElement.style.setProperty('--vw', `${vw}px`);
    
    // Detect if we're in fullscreen mode
    const isFullscreen = window.innerHeight === screen.height || 
                        document.fullscreenElement ||
                        document.webkitFullscreenElement ||
                        document.mozFullScreenElement ||
                        document.msFullscreenElement;
    
    // Adjust body and screen heights appropriately
    const targetHeight = isFullscreen ? '100vh' : `${window.innerHeight}px`;
    document.body.style.height = targetHeight;
    document.body.style.minHeight = targetHeight;
    
    // Update all screen elements
    const screens = document.querySelectorAll('.screen');
    screens.forEach(screen => {
        screen.style.height = targetHeight;
        screen.style.minHeight = targetHeight;
    });
}

// Initialize the asset loading and game when the page loads
document.addEventListener('DOMContentLoaded', async () => {
    // Disable all browser interactions immediately
    disableBrowserInteractions();
    
    // Setup enhanced viewport handling for both fullscreen and windowed modes
    handleViewportResize();
    window.addEventListener('resize', handleViewportResize);
    window.addEventListener('orientationchange', () => {
        setTimeout(handleViewportResize, 100);
    });
    
    // Handle fullscreen changes
    document.addEventListener('fullscreenchange', handleViewportResize);
    document.addEventListener('webkitfullscreenchange', handleViewportResize);
    document.addEventListener('mozfullscreenchange', handleViewportResize);
    document.addEventListener('MSFullscreenChange', handleViewportResize);
    
    // Setup cache interception for future requests
    AssetLoader.setupCacheInterception();
    
    // Start asset loading
    const assetLoader = new AssetLoader();
    let loadSuccess = false;
    let attempts = 0;
    const maxAttempts = 3;
    
    while (!loadSuccess && attempts < maxAttempts) {
        attempts++;
        try {
            loadSuccess = await assetLoader.loadAssets();
        } catch (error) {
            console.error(`Asset loading attempt ${attempts} failed:`, error);
            if (attempts < maxAttempts) {
                assetLoader.updateProgress(0, `Retrying... (${attempts}/${maxAttempts})`);
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
        }
    }
    
    if (!loadSuccess) {
        assetLoader.updateProgress(0, 'Loading failed. Starting with limited assets...');
        await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    // Initialize the game
    const game = new FlipFusionGame();
    await game.init();
    
    // Small delay for smooth transition
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Show home screen
    game.showHomeScreen();
});

# FlipFusion - Memory Matching Game

## Overview

FlipFusion is a browser-based memory matching card game built with vanilla HTML, CSS, and JavaScript. Players configure game settings (board size, matchable pairs, card sets) and then play a classic memory game where they flip cards to find matching pairs. The game features multiple difficulty levels, different card themes, and tracks player progress with moves and timer.

## User Preferences

Preferred communication style: Simple, everyday language.
Performance requirement: Game must be responsive for all devices without any lag and issues.

## System Architecture

### Frontend Architecture
- **Pure Vanilla JavaScript**: Single-page application using ES6 class-based architecture
- **Component-based Design**: Modular screen management system with distinct game states
- **Local Storage Persistence**: Client-side configuration saving without external database requirements
- **Responsive CSS**: Flexbox-based layout with mobile-first design principles

### Key Design Decisions
- **No Framework Dependencies**: Chosen for simplicity, fast loading, and minimal complexity
- **Class-based Game Logic**: Encapsulates game state and behavior in a single `FlipFusionGame` class
- **Screen State Management**: Simple show/hide mechanism for different game phases (home, game, results)
- **SVG Assets**: Vector graphics for scalable card images across different screen sizes
- **Performance Optimizations**: GPU acceleration, requestAnimationFrame, and optimized CSS transitions for lag-free experience
- **Responsive Design**: Multiple breakpoints (1200px, 768px, 480px, 320px) ensuring smooth gameplay on all devices

## Key Components

### 1. Asset Loading System
- **Loading Screen**: Visually appealing progress interface during asset caching
- **Cache Storage API**: Versioned asset caching (flipfusion-v1-assets) for offline capability
- **Progressive Loading**: Batched downloads with real-time progress feedback
- **Retry Logic**: Automatic retry for failed downloads with fallback handling
- **Cache-First Strategy**: Always serve from cache when available, even online

### 2. Game Configuration System
- **Board Size Options**: Small (4×4), Medium (4×8), Large (8×8) grids
- **Matchable Pairs**: 1 or 2 pairs per card type for difficulty variation
- **Difficulty Modes**: Time (time-limited), Moves (move-limited), Casual (unlimited)
- **Card Set Selection**: Multiple themed card sets with dynamic loading (flags, classic, monsters, animals, maths)
- **Persistent Settings**: Configuration saved to localStorage for user convenience

### 3. Game Engine
- **Card Management**: Dynamic card generation based on configuration
- **Flip Logic**: Two-card selection with match validation
- **State Tracking**: Moves counter, timer, and progress monitoring
- **Game Flow**: Start → Play → Pause/Resume → Complete cycle

### 4. User Interface
- **Configuration Screen**: Visual card set previews and intuitive controls
- **Game Board**: Dynamic grid layout adapting to selected board size
- **Progress Indicators**: Real-time move counter and elapsed time display
- **Results Screen**: Game completion statistics and replay options

## Data Flow

1. **Initialization**: Load saved configuration from localStorage
2. **Configuration**: User selects board size, pairs, and card set
3. **Game Generation**: Create card array based on configuration parameters
4. **Gameplay Loop**: 
   - Player clicks card → Flip animation
   - Two cards flipped → Match validation
   - Match found → Cards stay revealed, increment progress
   - No match → Cards flip back after delay
5. **Game Completion**: All pairs matched → Show results screen
6. **Persistence**: Save configuration changes to localStorage

## External Dependencies

### Assets Required
- **SVG Card Images**: Located in `assets/` directory
  - `ace-spades.svg`, `strawberry.svg`, `hedgehog.svg`
  - `owl.svg`, `king.svg`, `knight.svg`
- **No External Libraries**: Pure vanilla JavaScript implementation
- **No API Dependencies**: Fully client-side application

### Browser Requirements
- **Modern Browser Support**: ES6 class syntax and localStorage API
- **CSS Flexbox**: Layout system compatibility
- **SVG Support**: For scalable card graphics

## Deployment Strategy

### Static Hosting
- **File Structure**: Standard HTML/CSS/JS with assets folder
- **No Build Process**: Direct deployment of source files
- **No Server Requirements**: Pure client-side application

### Hosting Options
- **GitHub Pages**: Simple static hosting for the repository
- **Netlify/Vercel**: Automatic deployment from repository
- **Any Web Server**: Standard static file serving capability

### Performance Considerations
- **Minimal Bundle Size**: No framework overhead
- **Fast Initial Load**: Simple HTML structure with inline assets
- **Local Storage Only**: No network requests during gameplay
- **Responsive Design**: Single codebase for all device sizes

## Development Notes

### File Structure
- `index.html`: Main page with all screen templates
- `script.js`: Complete game logic and state management
- `styles.css`: All styling including responsive design
- `assets/`: SVG card images directory

### Extensibility
- **New Card Sets**: Add image files and update cardSetConfigs object with proper extensions
- **Board Sizes**: Modify boardSizes configuration object
- **Game Modes**: Extend config object for additional options
- **Themes**: CSS custom properties for easy theme switching

### Recent Changes

**July 23, 2025:**
- **Project Migration**: Successfully migrated from Replit Agent to standard Replit environment with Python 3.11 HTTP server
- **Card Set Cleanup**: Removed animals, maths card sets and coming soon placeholder - now features only classic, flags, and monsters card sets
- **Default Configuration**: Updated default card set to classic cards for better user experience
- **UI Improvements**: Centered card set previews in a 3-column grid layout for cleaner appearance
- **Board Size Updates**: Changed to Small (4×4, 16 cards), Medium (4×8, 32 cards), Large (5×8, 40 cards)
- **Fully Responsive Game Screen**: Made game board completely responsive across all devices with dynamic card sizing and grid layouts optimized for different screen sizes
- **Dynamic Card Loading**: Implemented dynamic card loading system with proper file extension detection
- **Enhanced Card Sets**: Updated flags, classic, and monsters sets with 100, 100, and 25 cards respectively
- **Card Back Display**: Fixed card back images to show themed SVGs when cards are face-down
- **Rectangular Card Design**: Updated cards to rectangular aspect ratio (5:6) with rounded corners for better visual appeal
- **Optimized Card Padding**: Reduced inner padding to make card images appear larger and more prominent
- **Difficulty Selection Feature**: Implemented Time, Moves, and Casual difficulty modes with different win/loss conditions
- **Difficulty-Specific UI**: Added dynamic timer and moves labels based on selected difficulty
- **Comprehensive Game Logic**: Time mode with countdown timer, Moves mode with move limits, Casual mode unlimited
- **Asset Loading System**: Implemented comprehensive loading screen with Cache Storage API for offline capability
- **Performance Optimization**: All assets cached on first load, subsequent loads served from cache for instant performance
- **Progressive Loading**: Batched asset loading with progress feedback and retry logic for failed downloads
- **Full-Screen Immersive Experience**: Disabled browser interactions that interfere with gameplay (scrolling, context menus, zooming, text selection) while preserving function keys and Windows shortcuts for accessibility
- **Advanced Event Prevention**: Selective keyboard, mouse, and touch event handling to prevent browser interference while maintaining essential system functionality
- **Perfect Viewport Fitting**: Game scales to 100% viewport coverage with no scrollbars on any device or screen size using fixed positioning and dynamic viewport units
- **Ultra-Responsive Design**: Pure viewport units (vw, vh) without fixed sizes or scrollbars for seamless scaling across all devices and orientations
- **Mobile-First Optimization**: Comprehensive breakpoints from 320px to 1200px+ with orientation-aware layouts and viewport-relative sizing
- **Touch-Optimized Controls**: Disabled pinch-zoom, double-tap zoom, and gesture conflicts for smooth mobile gameplay with passive event prevention
- **Dynamic Viewport Management**: JavaScript-powered viewport resize handling for perfect fit across device rotations and browser UI changes
- **Fluid Responsive Layout**: All elements use relative units (vw, vh) eliminating need for scrollbars or fixed dimensions
- **Card Set Reordering**: Updated card set order to Monsters (first), Classic (second), Flags (third) with Monsters as default selection
- **Default Configuration Updates**: Set board size to Medium, matchable pairs to 1, difficulty to Casual, and card set to Monsters
- **Large Board Optimization**: Reduced large board from 8×8 (64 cards) to 5×8 (40 cards) for better gameplay balance with adjusted time/move limits
- **Timer Logic Fixes**: Completely rebuilt timer system to properly handle all three game modes with correct countdown/count-up behavior
- **Game State Reset**: Added proper game state reset functionality when returning to home screen or starting new games
- **Timer Start Behavior**: Timer now only starts when player flips the first card, not immediately on game load
- **Complete Reset Functionality**: Home button and reset button fully clear all game states and wait for first card flip to restart timer
- **Initial Display Logic**: Time Mode shows time limit, Moves Mode shows move limit, Casual Mode shows zeros before first card flip
# CLAUDE.md - Project Guide for Claude Code

## Project Overview

**School Escape** is a browser-based action arcade game where players control a student trying to escape from teachers in a procedurally generated school building. The game is built with vanilla HTML5, CSS3, and JavaScript using a modular file structure.

**Copyright:** Ilja Livenson and Mark Livenson (2025)
**License:** MIT

## Architecture

### Modular File Structure

```
/
├── index.html              # HTML structure only (~385 lines)
├── css/
│   └── styles.css          # All CSS styles (~520 lines)
└── js/
    ├── game.js             # Main game logic, constants, rendering (~2200 lines)
    ├── translations.js     # Language strings for 5 languages (~900 lines)
    ├── audio.js            # Web Audio API sound system (~250 lines)
    ├── map.js              # Procedural map generation (~550 lines)
    ├── multiplayer.js      # Liveblocks real-time integration (~750 lines)
    └── ui.js               # UI management and menus (~550 lines)
```

### Module Responsibilities

| File | Purpose |
|------|---------|
| `index.html` | HTML structure, canvas elements, menu screens, script loading |
| `css/styles.css` | Layout, UI components, menu screens, HUD, animations |
| `js/game.js` | Constants, game state, player/teacher objects, LEVELS, RANDOM_EVENTS, game loop, update functions, collision detection, rendering, initialization |
| `js/translations.js` | Translation strings object, `t()` helper function |
| `js/audio.js` | Web Audio API setup, sound effects, background music |
| `js/map.js` | Map generation with grid/labyrinth/open-plan topologies, room placement, obstacle generation |
| `js/multiplayer.js` | Liveblocks client, room management, state synchronization, player rendering |
| `js/ui.js` | Menu management, language switching, avatar preview, campaign progress |

### Script Loading Order

Scripts are loaded in this order (defined in `index.html`):
1. `js/game.js` - Defines core state and constants
2. `js/translations.js` - Translation system
3. `js/audio.js` - Audio system
4. `js/multiplayer.js` - Multiplayer integration
5. `js/map.js` - Map generation
6. `js/ui.js` - UI functions

## Core Systems

### Game Modes
1. **Campaign Mode:** 17 progressive levels (Grade 1 → Master Year 2)
2. **Free Play Mode:** Customizable difficulty settings
3. **Multiplayer Mode:** Real-time cooperative play with 2-8 players

### Level Configuration (`js/game.js` - LEVELS array)
Each level defines:
- `mapSize: { w, h }` - Map dimensions
- `teachers` - Number of enemies
- `speed` - Teacher speed multiplier (0.6 to 1.4)
- `collectibles` - Items to collect
- `schoolType` - Affects room/obstacle generation

### Map Generation Pipeline (`js/map.js`)
```
generateMap() → generateCorridors() → generateRooms() → addObstacles()
             → placeExit() → placePlayer() → placeCollectibles()
             → placePowerups() → placeTeachers()
```

### Tile Types (`js/game.js` - TILES constant)
- `FLOOR (0)` - Walkable
- `WALL (1)` - Solid boundary
- `DESK (2)` - Obstacle in classrooms
- `LOCKER (3)` - Corridor obstacle
- `WET_FLOOR (4)` - Slippery surface
- `EXIT (5)` - Level exit (green when unlocked)
- `DOOR (6)` - Room entrance

### Teacher AI Types (`js/map.js` - createTeacher())
- **Patrol:** Follows predefined routes
- **Hunter:** Actively chases player when in sight
- **Fast:** Quicker but predictable movement

### Power-ups
| Type | Effect | Duration |
|------|--------|----------|
| Hall Pass | Invincibility | 5 seconds |
| Energy Drink | Super speed | 8 seconds |
| Stink Bomb | Stuns teachers | 4 seconds |
| Skateboard | Speed boost | 10 seconds |

### Random Events (`js/game.js` - RANDOM_EVENTS array)
12 events including UFO Abduction, Dinosaur Stampede, Power Outage, etc. that temporarily modify gameplay.

### Multiplayer System

The game supports real-time multiplayer using [Liveblocks](https://liveblocks.io/) for synchronization.

**Architecture:**
- **Host/Guest Model:** One player hosts, others join via 3-character room code
- **Map Synchronization:** Host generates the map and broadcasts complete map data to guests
- **State Sync:** Player positions, collectibles, powerups, and teacher positions are synchronized

**Key Components (`js/multiplayer.js`):**
- `mpState` - Multiplayer state object (room, players, host status)
- `liveblocksClient` - Liveblocks client for real-time sync
- `PLAYER_COLORS` - 8 predefined colors for multiplayer players
- `AVATAR_TYPES` - Player avatar configurations
- Room codes: 3-character alphanumeric (e.g., "A7K")

**Synchronization Flow:**
1. Host creates room and generates map
2. Host broadcasts `GAME_START` event with full map data (tiles, collectibles, powerups, teachers, player spawn)
3. Guests receive map data and apply it via `applyMapData()`
4. During gameplay:
   - Player positions sync via Liveblocks presence (~30fps)
   - Host broadcasts teacher positions (~10fps)
   - Collectible/powerup pickups broadcast as events
   - Stink bomb effects sync to all players

**Key Functions:**
| Function | File | Purpose |
|----------|------|---------|
| `initLiveblocks()` | multiplayer.js | Initialize Liveblocks client from CDN |
| `createMultiplayerRoom()` | multiplayer.js | Create room and become host |
| `joinMultiplayerRoom()` | multiplayer.js | Join existing room as guest |
| `hostStartGame()` | multiplayer.js | Generate map and broadcast to guests |
| `serializeMapData()` | multiplayer.js | Package map data for transmission |
| `applyMapData()` | multiplayer.js | Apply received map data on guest |
| `updateMyPresence()` | multiplayer.js | Broadcast local player position |
| `broadcastTeacherPositions()` | multiplayer.js | Host syncs teacher state |
| `drawOtherPlayers()` | multiplayer.js | Render other players on canvas |

### Mobile Controls System

The game includes touch-friendly controls for mobile devices, automatically detected and shown on touch-capable devices.

**Components:**
- **Virtual Joystick:** Left side analog stick for 8-directional movement
- **Dash Button:** Right side button for quick speed burst (shows cooldown state)
- **Power-up Button:** Right side button to use first available power-up (shows current power-up icon)
- **Pause Button:** Top-right button to pause/resume game

**Key State:**
- `mobileInput.active` - Whether mobile controls are being used
- `mobileInput.joystick.x/y` - Joystick position (-1 to 1 range)
- `mobileInput.isTouchDevice` - Auto-detected touch device flag

**CSS Classes:**
- `.mobile-controls` - Main container (hidden on desktop)
- `.joystick-container/.joystick-base/.joystick-knob` - Virtual joystick
- `.mobile-action-btn` - Action buttons
- `.dash-btn.cooldown` - Dash button during cooldown
- `.powerup-btn.has-powerup/.empty` - Power-up button states

## Key Functions by Module

### js/game.js
| Function | Purpose |
|----------|---------|
| `init()` | Initialize game, set up event listeners |
| `startGame()` | Start new game/level |
| `update(deltaTime)` | Main game logic update |
| `render()` | Canvas rendering |
| `gameLoop(timestamp)` | RequestAnimationFrame loop |
| `updatePlayer(deltaTime)` | Player movement & input |
| `updateTeachers(deltaTime)` | Enemy AI |
| `checkCollisions()` | Collision detection |
| `drawMap()` | Render map tiles |
| `drawPlayer()` | Render player character |
| `drawTeachers()` | Render teacher enemies |
| `initMobileControls()` | Initialize touch controls for mobile |
| `showMobileControls()` | Show mobile controls overlay |
| `hideMobileControls()` | Hide mobile controls overlay |
| `updateMobilePowerupButton()` | Update powerup button state/icon |
| `updateMobileDashButton()` | Update dash button cooldown state |

### js/map.js
| Function | Purpose |
|----------|---------|
| `generateMap()` | Main procedural map generation |
| `generateCorridors()` | Create corridor network |
| `generateGridCorridors()` | Grid topology corridors |
| `generateLabyrinth()` | Maze topology corridors |
| `generateOpenPlan()` | Open plan topology |
| `generateRooms()` | Add rooms to map |
| `placeTeachers()` | Spawn teacher entities |
| `createTeacher()` | Create teacher with AI type |

### js/audio.js
| Function | Purpose |
|----------|---------|
| `initAudio()` | Initialize Web Audio context |
| `playSound(type)` | Play sound effect |
| `playTone()` | Generate tone sound |
| `playSweep()` | Generate frequency sweep |
| `playNoise()` | Generate noise burst |
| `startMusic()` | Start background music |
| `stopMusic()` | Stop background music |

### js/ui.js
| Function | Purpose |
|----------|---------|
| `updateUI()` | Update HUD elements |
| `showMessage()` | Display popup message |
| `showMenu()` | Show specific menu screen |
| `hideAllMenus()` | Hide all menu screens |
| `updateLanguage()` | Apply language to UI |
| `setLanguage()` | Change current language |
| `updateAvatarPreview()` | Render avatar in preview canvas |

### js/translations.js
| Function | Purpose |
|----------|---------|
| `t(key)` | Get translated string for key |

## Localization

The game supports 5 languages via the `translations` object in `js/translations.js`:
- English (`en`)
- Estonian (`et`)
- Latvian (`lv`)
- Lithuanian (`lt`)
- Russian (`ru`)

Helper: `t(key)` function returns translated string.

## State Management

### Global State Objects (js/game.js)
- `gameState` - Core game state (score, lives, map, particles)
- `player` - Player position, velocity, power-up status
- `teachers` - Array of teacher entities
- `settings` - User preferences
- `currentEvent` / `eventTimer` - Random event tracking
- `gameMode` - Current game mode (campaign/freeplay/multiplayer)
- `currentLevel` - Current campaign level index

### Persistence
Campaign progress saved to `localStorage`:
- `schoolEscape_currentLevel` - Current level index
- `schoolEscape_totalScore` - Accumulated score
- `schoolEscape_playerAvatar` - Selected avatar

## Development Guidelines

### Running the Game
Simply open `index.html` in any modern browser. No build process or dependencies required.

### Adding New Features

**New Power-up:**
1. Add to `powerupTypes` array in `placePowerups()` in `js/map.js`
2. Add handling in `collectPowerup()` and `usePowerup()` in `js/game.js`
3. Add icon in `drawPowerups()` in `js/game.js`
4. Add translation keys in `js/translations.js` for all 5 languages

**New Teacher Type:**
1. Add type in `createTeacher()` in `js/map.js`
2. Implement behavior in `updateTeachers()` in `js/game.js`
3. Add drawing in `drawTeachers()` in `js/game.js`
4. Add translation for label in `js/translations.js`

**New Random Event:**
1. Add to `RANDOM_EVENTS` array in `js/game.js`
2. Initialize state in `initEventState()` in `js/game.js`
3. Update in `updateCurrentEvent()` in `js/game.js`
4. Handle entities in `updateEventEntities()` in `js/game.js`
5. End in `endCurrentEvent()` in `js/game.js`
6. Add translations for event name in `js/translations.js`

**New Language:**
1. Add language option to HTML select in `index.html`
2. Add complete translation object in `js/translations.js`
3. Ensure all keys match existing languages

### Code Style
- Vanilla JavaScript (ES6+)
- No external dependencies (except Liveblocks CDN for multiplayer)
- Canvas-based rendering with 2D context
- Web Audio API for sounds
- requestAnimationFrame for game loop
- Global functions and variables (no module system)

### Testing

**Automated Testing (Playwright):**
```bash
# Install dependencies
npm install

# Run all tests
npm test

# Run tests with browser visible
npm run test:headed

# Run only mobile tests
npm run test:mobile

# Run only desktop tests
npm run test:desktop

# Debug tests
npm run test:debug
```

**Test Files:**
- `tests/game-init.spec.js` - Game initialization, menus, settings
- `tests/game-play.spec.js` - Game modes, keyboard controls, game state
- `tests/mobile.spec.js` - Mobile controls, touch events (runs on mobile emulation)
- `tests/responsive.spec.js` - Viewport sizes, fullscreen, responsive layout

**CI/CD:**
Tests run automatically via GitHub Actions on push/PR to main branch.
- Runs on desktop browsers (Chromium, Firefox, WebKit)
- Runs on mobile emulation (Pixel 5, iPhone 12, iPad)
- Uploads test reports and screenshots on failure

**Manual Testing:**
For features not covered by automated tests:
- All game modes work
- Language switching functions correctly
- Audio toggles work
- Campaign progress saves/loads
- All power-ups function
- Random events trigger and complete properly
- **Multiplayer:** Test with 2+ browser windows:
  - Host can create room and see room code
  - Guest can join with room code
  - Both players see identical maps (walls, collectibles, powerups, teachers)
  - Player positions sync correctly (no drift or double-speed movement)
  - Collectible pickups sync (item disappears for all players)
  - Teacher positions sync (host controls AI, guests receive updates)
  - Stink bomb affects all players' view of teachers

## Common Modifications

### Adjusting Difficulty
Modify the `LEVELS` array in `js/game.js` to change:
- Map size, teacher count, speed multiplier, collectible count

### Changing Canvas Size
Update canvas element attributes in `index.html` and adjust camera calculations in `updateCamera()` in `js/game.js`.

### Adding Sound Effects
Use `playTone()`, `playSweep()`, or `playNoise()` in the `playSound()` function in `js/audio.js`.

### Adding CSS Styles
Add new styles to `css/styles.css`. Key class prefixes:
- `.menu-` - Menu screens
- `.settings-` - Settings panels
- `.player-` - Multiplayer player elements
- `.mp-` - Multiplayer HUD elements

# CLAUDE.md - Project Guide for Claude Code

## Project Overview

**School Escape** is a browser-based action arcade game where players control a student trying to escape from teachers in a procedurally generated school building. The game is built entirely with vanilla HTML5, CSS3, and JavaScript in a single file.

**Copyright:** Ilja Livenson and Mark Livenson (2025)
**License:** MIT

## Architecture

### Single-File Structure

The entire game is contained in `index.html` (~4200 lines):
- **Lines 1-316:** HTML structure and CSS styling
- **Lines 317-493:** HTML menu screens and UI elements
- **Lines 495-4226:** JavaScript game logic

### Key Components

```
index.html
├── CSS Styles (lines 12-316)
│   ├── Layout & UI components
│   ├── Menu screens
│   ├── Game HUD
│   └── Animations
├── HTML Structure (lines 318-493)
│   ├── Game canvas (800x600)
│   ├── Minimap canvas (150x112)
│   ├── Main menu
│   ├── Settings panels
│   └── Game screens (pause, game over, level complete)
└── JavaScript (lines 495-4226)
    ├── Constants & Game State
    ├── Translations (5 languages)
    ├── Audio System (Web Audio API)
    ├── Random Events System
    ├── Map Generation
    ├── Game Logic (update, render)
    └── UI Management
```

## Core Systems

### Game Modes
1. **Campaign Mode:** 17 progressive levels (Grade 1 → Master Year 2)
2. **Free Play Mode:** Customizable difficulty settings
3. **Multiplayer Mode:** Real-time cooperative play with 2-8 players

### Level Configuration (LEVELS array, line ~598)
Each level defines:
- `mapSize: { w, h }` - Map dimensions
- `teachers` - Number of enemies
- `speed` - Teacher speed multiplier (0.6 to 1.4)
- `collectibles` - Items to collect
- `schoolType` - Affects room/obstacle generation

### Map Generation Pipeline (line ~2344)
```
generateMap() → generateCorridors() → generateRooms() → addObstacles()
             → placeExit() → placePlayer() → placeCollectibles()
             → placePowerups() → placeTeachers()
```

### Tile Types (TILES constant, line ~511)
- `FLOOR (0)` - Walkable
- `WALL (1)` - Solid boundary
- `DESK (2)` - Obstacle in classrooms
- `LOCKER (3)` - Corridor obstacle
- `WET_FLOOR (4)` - Slippery surface
- `EXIT (5)` - Level exit (green when unlocked)
- `DOOR (6)` - Room entrance

### Teacher AI Types (line ~2649)
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

### Random Events (12 events, line ~578)
Events like UFO Abduction, Dinosaur Stampede, Power Outage, etc. that temporarily modify gameplay.

### Multiplayer System

The game supports real-time multiplayer using [Liveblocks](https://liveblocks.io/) for synchronization.

**Architecture:**
- **Host/Guest Model:** One player hosts, others join via 3-character room code
- **Map Synchronization:** Host generates the map and broadcasts complete map data to guests
- **State Sync:** Player positions, collectibles, powerups, and teacher positions are synchronized

**Key Components:**
- `mpState` - Multiplayer state object (room, players, host status)
- `liveblocksClient` - Liveblocks client for real-time sync
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
| Function | Purpose |
|----------|---------|
| `initLiveblocks()` | Initialize Liveblocks client from CDN |
| `hostCreateRoom()` | Create room and become host |
| `guestJoinRoom()` | Join existing room as guest |
| `hostStartGame()` | Generate map and broadcast to guests |
| `serializeMapData()` | Package map data for transmission |
| `applyMapData()` | Apply received map data on guest |
| `updateMyPresence()` | Broadcast local player position |
| `broadcastTeacherPositions()` | Host syncs teacher state |
| `drawOtherPlayers()` | Render other players on canvas |

**Player Colors:** 8 predefined colors for multiplayer players (defined in `PLAYER_COLORS` array)

## Key Functions

| Function | Line | Purpose |
|----------|------|---------|
| `init()` | ~4055 | Initialize game, set up event listeners |
| `startGame()` | ~3990 | Start new game/level |
| `generateMap()` | ~2344 | Procedural map generation |
| `update(deltaTime)` | ~2700 | Main game logic update |
| `render()` | ~3300 | Canvas rendering |
| `gameLoop(timestamp)` | ~3981 | RequestAnimationFrame loop |
| `updatePlayer(deltaTime)` | ~2779 | Player movement & input |
| `updateTeachers(deltaTime)` | ~2848 | Enemy AI |
| `checkCollisions()` | ~3014 | Collision detection |
| `playSound(type)` | ~1435 | Web Audio sound effects |

## Localization

The game supports 5 languages via the `translations` object (line ~632):
- English (`en`)
- Estonian (`et`)
- Latvian (`lv`)
- Lithuanian (`lt`)
- Russian (`ru`)

Helper: `t(key)` function (line ~1323) returns translated string.

## State Management

### Global State Objects
- `gameState` (line ~522) - Core game state (score, lives, map, particles)
- `player` (line ~543) - Player position, velocity, power-up status
- `teachers` (line ~561) - Array of teacher entities
- `settings` (line ~567) - User preferences
- `currentEvent` / `eventTimer` (line ~593) - Random event tracking

### Persistence
Campaign progress saved to `localStorage`:
- `schoolEscapeCampaignLevel` - Current level index
- `schoolEscapeTotalScore` - Accumulated score

## Development Guidelines

### Running the Game
Simply open `index.html` in any modern browser. No build process or dependencies required.

### Adding New Features

**New Power-up:**
1. Add to `powerupTypes` array in `placePowerups()` (~2597)
2. Add handling in `collectPowerup()` (~3083) and `usePowerup()` (~3106)
3. Add icon in `drawPowerups()` (~3479)
4. Add translation keys for all 5 languages

**New Teacher Type:**
1. Add type in `createTeacher()` (~2649)
2. Implement behavior in `updateTeachers()` (~2848)
3. Add drawing in `drawTeachers()` (~3532)
4. Add translation for label

**New Random Event:**
1. Add to `RANDOM_EVENTS` array (~578)
2. Initialize state in `initEventState()` (~1752)
3. Update in `updateCurrentEvent()` (~1870)
4. Handle entities in `updateEventEntities()` (~1896)
5. End in `endCurrentEvent()` (~2104)
6. Add translations for event name

**New Language:**
1. Add language option to HTML select (~397)
2. Add complete translation object in `translations` (~632)
3. Ensure all keys match existing languages

### Code Style
- Vanilla JavaScript (ES6+)
- No external dependencies
- Canvas-based rendering with 2D context
- Web Audio API for sounds
- requestAnimationFrame for game loop

### Testing
Manual testing in browser. Check:
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
Modify the `LEVELS` array (~598) to change:
- Map size, teacher count, speed multiplier, collectible count

### Changing Canvas Size
Update canvas element attributes (line ~333) and adjust camera calculations in `updateCamera()` (~3280).

### Adding Sound Effects
Use `playTone()` (~1527), `playSweep()` (~1548), or `playNoise()` (~1568) in the `playSound()` function.

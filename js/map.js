/*
 * School Escape - Map Generation
 * Copyright (c) 2025 Ilja Livenson and Mark Livenson
 */

// ============================================
// MAP GENERATION
// ============================================

function generateMap() {
    const sizeConfigs = {
        small: { width: 25, height: 19 },
        medium: { width: 35, height: 27 },
        large: { width: 50, height: 38 }
    };

    const schoolConfigs = {
        elementary: { roomChance: 0.3, obstacleChance: 0.1, corridorWidth: 3 },
        middle: { roomChance: 0.4, obstacleChance: 0.15, corridorWidth: 2 },
        high: { roomChance: 0.5, obstacleChance: 0.2, corridorWidth: 2 },
        university: { roomChance: 0.6, obstacleChance: 0.25, corridorWidth: 2 }
    };

    let size, config, numTeachers, numCollectibles, speedMultiplier;

    if (gameMode === 'campaign') {
        const level = LEVELS[currentLevel];
        size = { width: level.mapSize.w, height: level.mapSize.h };
        config = schoolConfigs[level.schoolType];
        numTeachers = level.teachers;
        numCollectibles = level.collectibles;
        speedMultiplier = level.speed;
        gameState.level = level.id;
    } else {
        size = sizeConfigs[settings.mapSize];
        config = schoolConfigs[settings.schoolType];
        numTeachers = settings.teacherCount;
        numCollectibles = Math.floor(size.width * size.height / 30) + 10;
        speedMultiplier = 1.0;
    }

    // Get map generation settings (applies to both modes)
    const topology = settings.mapTopology;
    const corridorDensity = settings.corridorDensity;
    const roomDensity = settings.roomDensity;

    gameState.mapWidth = size.width;
    gameState.mapHeight = size.height;

    // Initialize map with walls
    gameState.map = Array(size.height).fill(null).map(() =>
        Array(size.width).fill(TILES.WALL)
    );

    // Generate main corridors with topology
    generateCorridors(config.corridorWidth, topology, corridorDensity);

    // Generate rooms with density
    generateRooms(config.roomChance, roomDensity);

    // Add obstacles
    addObstacles(config.obstacleChance);

    // Place exit
    placeExit();

    // Place player start
    placePlayer();

    // Place breakable walls (after player/exit so we know their positions)
    placeBreakableWalls();

    // Compute reachable tiles from player position
    const reachable = computeReachableTiles();

    // Place collectibles (only on reachable tiles)
    placeCollectibles(numCollectibles, reachable);

    // Place power-ups (only on reachable tiles)
    placePowerups(reachable);

    // Place teachers
    placeTeachers(numTeachers, speedMultiplier);
}

function generateCorridors(width, topology, density) {
    const mapW = gameState.mapWidth;
    const mapH = gameState.mapHeight;

    // Density multipliers for corridor count
    const densityMultipliers = { low: 0.6, medium: 1.0, high: 1.5 };
    const densityMult = densityMultipliers[density] || 1.0;

    switch (topology) {
        case 'labyrinth':
            generateLabyrinth(width, densityMult);
            break;
        case 'openPlan':
            generateOpenPlan(width, densityMult);
            break;
        case 'grid':
        default:
            generateGridCorridors(width, densityMult);
            break;
    }
}

// Classic grid layout with main corridors
function generateGridCorridors(width, densityMult) {
    const mapW = gameState.mapWidth;
    const mapH = gameState.mapHeight;

    // Main horizontal corridor
    const mainY = Math.floor(mapH / 2);
    for (let x = 1; x < mapW - 1; x++) {
        for (let dy = -Math.floor(width / 2); dy <= Math.floor(width / 2); dy++) {
            if (mainY + dy > 0 && mainY + dy < mapH - 1) {
                gameState.map[mainY + dy][x] = TILES.FLOOR;
            }
        }
    }

    // Vertical corridors - more with higher density
    const baseVertical = Math.floor(mapW / 10) + 1;
    const numVertical = Math.floor(baseVertical * densityMult);
    for (let i = 0; i < numVertical; i++) {
        const x = Math.floor((i + 0.5) * mapW / numVertical);
        for (let y = 1; y < mapH - 1; y++) {
            for (let dx = -Math.floor(width / 2); dx <= Math.floor(width / 2); dx++) {
                if (x + dx > 0 && x + dx < mapW - 1) {
                    gameState.map[y][x + dx] = TILES.FLOOR;
                }
            }
        }
    }

    // Additional horizontal corridors based on density
    const numHorizontal = Math.floor(Math.max(0, (mapH - 15) / 8) * densityMult);
    for (let i = 0; i < numHorizontal; i++) {
        const y = Math.floor((i + 1) * mapH / (numHorizontal + 2));
        if (Math.abs(y - mainY) > 3) { // Don't overlap with main corridor
            for (let x = 1; x < mapW - 1; x++) {
                for (let dy = -Math.floor(width / 2); dy <= Math.floor(width / 2); dy++) {
                    if (y + dy > 0 && y + dy < mapH - 1) {
                        gameState.map[y + dy][x] = TILES.FLOOR;
                    }
                }
            }
        }
    }
}

// Maze-like labyrinth using recursive backtracking
function generateLabyrinth(width, densityMult) {
    const mapW = gameState.mapWidth;
    const mapH = gameState.mapHeight;

    // Use a cell-based approach for maze generation
    const baseCellSize = 3;
    const adjustedCellSize = Math.max(baseCellSize + 1, Math.floor(baseCellSize / Math.sqrt(densityMult)) + 1);
    const cellW = Math.floor((mapW - 2) / adjustedCellSize);
    const cellH = Math.floor((mapH - 2) / adjustedCellSize);

    // Track visited cells
    const visited = Array(cellH).fill(null).map(() => Array(cellW).fill(false));
    const stack = [];

    // Start from center
    let cx = Math.floor(cellW / 2);
    let cy = Math.floor(cellH / 2);
    visited[cy][cx] = true;
    stack.push({ x: cx, y: cy });

    const halfCell = Math.floor(baseCellSize / 2);
    const carveCell = (cellX, cellY) => {
        const px = 1 + cellX * adjustedCellSize + halfCell;
        const py = 1 + cellY * adjustedCellSize + halfCell;
        for (let dy = -halfCell; dy <= halfCell; dy++) {
            for (let dx = -halfCell; dx <= halfCell; dx++) {
                if (py + dy > 0 && py + dy < mapH - 1 && px + dx > 0 && px + dx < mapW - 1) {
                    gameState.map[py + dy][px + dx] = TILES.FLOOR;
                }
            }
        }
    };

    // Carve passage between cells
    const carvePassage = (x1, y1, x2, y2) => {
        const px1 = 1 + x1 * adjustedCellSize + halfCell;
        const py1 = 1 + y1 * adjustedCellSize + halfCell;
        const px2 = 1 + x2 * adjustedCellSize + halfCell;
        const py2 = 1 + y2 * adjustedCellSize + halfCell;

        const minX = Math.min(px1, px2);
        const maxX = Math.max(px1, px2);
        const minY = Math.min(py1, py2);
        const maxY = Math.max(py1, py2);

        for (let y = minY; y <= maxY; y++) {
            for (let x = minX; x <= maxX; x++) {
                if (y > 0 && y < mapH - 1 && x > 0 && x < mapW - 1) {
                    gameState.map[y][x] = TILES.FLOOR;
                }
            }
        }
    };

    carveCell(cx, cy);

    // Recursive backtracking
    while (stack.length > 0) {
        const current = stack[stack.length - 1];
        const neighbors = [];

        const dirs = [
            { dx: 0, dy: -1 },
            { dx: 1, dy: 0 },
            { dx: 0, dy: 1 },
            { dx: -1, dy: 0 }
        ];

        for (const dir of dirs) {
            const nx = current.x + dir.dx;
            const ny = current.y + dir.dy;
            if (nx >= 0 && nx < cellW && ny >= 0 && ny < cellH && !visited[ny][nx]) {
                neighbors.push({ x: nx, y: ny });
            }
        }

        if (neighbors.length > 0) {
            const next = neighbors[Math.floor(Math.random() * neighbors.length)];
            visited[next.y][next.x] = true;
            carvePassage(current.x, current.y, next.x, next.y);
            carveCell(next.x, next.y);
            stack.push(next);
        } else {
            stack.pop();
        }
    }

    // Ensure left and right sides are accessible (for player start and exit)
    const midY = Math.floor(mapH / 2);
    for (let x = 1; x < 4; x++) {
        gameState.map[midY][x] = TILES.FLOOR;
        if (midY > 1) gameState.map[midY - 1][x] = TILES.FLOOR;
        if (midY < mapH - 2) gameState.map[midY + 1][x] = TILES.FLOOR;
    }
    for (let x = mapW - 4; x < mapW - 1; x++) {
        gameState.map[midY][x] = TILES.FLOOR;
        if (midY > 1) gameState.map[midY - 1][x] = TILES.FLOOR;
        if (midY < mapH - 2) gameState.map[midY + 1][x] = TILES.FLOOR;
    }
}

// Open plan with large open areas and minimal walls
function generateOpenPlan(width, densityMult) {
    const mapW = gameState.mapWidth;
    const mapH = gameState.mapHeight;

    const baseMarginX = Math.floor(mapW * 0.1) + 1;
    const baseMarginY = Math.floor(mapH * 0.1) + 1;
    const marginX = Math.max(1, Math.floor(baseMarginX / densityMult));
    const marginY = Math.max(1, Math.floor(baseMarginY / densityMult));

    for (let y = marginY; y < mapH - marginY; y++) {
        for (let x = marginX; x < mapW - marginX; x++) {
            gameState.map[y][x] = TILES.FLOOR;
        }
    }

    // Add some structural pillars/walls for visual interest
    const numPillars = Math.floor((mapW * mapH) / 80 * densityMult);
    for (let i = 0; i < numPillars; i++) {
        const px = Math.floor(Math.random() * (mapW - marginX * 2 - 4)) + marginX + 2;
        const py = Math.floor(Math.random() * (mapH - marginY * 2 - 4)) + marginY + 2;
        const pillarSize = Math.floor(Math.random() * 2) + 2;

        for (let dy = 0; dy < pillarSize; dy++) {
            for (let dx = 0; dx < pillarSize; dx++) {
                if (py + dy < mapH - marginY && px + dx < mapW - marginX) {
                    gameState.map[py + dy][px + dx] = TILES.WALL;
                }
            }
        }
    }

    // Ensure edges are accessible
    const midY = Math.floor(mapH / 2);
    for (let x = 1; x < marginX + 2; x++) {
        for (let dy = -1; dy <= 1; dy++) {
            if (midY + dy > 0 && midY + dy < mapH - 1) {
                gameState.map[midY + dy][x] = TILES.FLOOR;
            }
        }
    }
    for (let x = mapW - marginX - 2; x < mapW - 1; x++) {
        for (let dy = -1; dy <= 1; dy++) {
            if (midY + dy > 0 && midY + dy < mapH - 1) {
                gameState.map[midY + dy][x] = TILES.FLOOR;
            }
        }
    }
}

function generateRooms(roomChance, roomDensity) {
    const mapW = gameState.mapWidth;
    const mapH = gameState.mapHeight;
    const roomSizes = [
        { w: 5, h: 4 },
        { w: 6, h: 5 },
        { w: 7, h: 5 },
        { w: 8, h: 6 }
    ];

    // Room density multipliers
    const densityMultipliers = { few: 0.5, normal: 1.0, many: 1.8 };
    const densityMult = densityMultipliers[roomDensity] || 1.0;

    const numRooms = Math.floor(mapW * mapH * roomChance * densityMult / 30);

    for (let i = 0; i < numRooms; i++) {
        const roomSize = roomSizes[Math.floor(Math.random() * roomSizes.length)];
        const roomX = Math.floor(Math.random() * (mapW - roomSize.w - 2)) + 1;
        const roomY = Math.floor(Math.random() * (mapH - roomSize.h - 2)) + 1;

        // Check if room overlaps corridor
        let touchesCorridor = false;
        for (let y = roomY; y < roomY + roomSize.h && !touchesCorridor; y++) {
            for (let x = roomX; x < roomX + roomSize.w; x++) {
                if (gameState.map[y][x] === TILES.FLOOR) {
                    touchesCorridor = true;
                    break;
                }
            }
        }

        if (touchesCorridor) {
            // Carve out the room
            for (let y = roomY; y < roomY + roomSize.h; y++) {
                for (let x = roomX; x < roomX + roomSize.w; x++) {
                    gameState.map[y][x] = TILES.FLOOR;
                }
            }

            // Add desks in classroom pattern
            if (Math.random() < 0.7) {
                for (let y = roomY + 1; y < roomY + roomSize.h - 1; y += 2) {
                    for (let x = roomX + 1; x < roomX + roomSize.w - 1; x += 2) {
                        if (Math.random() < 0.6) {
                            gameState.map[y][x] = TILES.DESK;
                        }
                    }
                }
            }
        }
    }
}

// Place breakable walls by creating tunnels through wall barriers
function placeBreakableWalls() {
    const mapW = gameState.mapWidth;
    const mapH = gameState.mapHeight;

    // Get player spawn position for distance check
    const playerTileX = Math.floor(player.x / TILE_SIZE);
    const playerTileY = Math.floor(player.y / TILE_SIZE);

    // Find exit position
    let exitX = mapW - 2, exitY = Math.floor(mapH / 2);
    for (let y = 0; y < mapH; y++) {
        for (let x = 0; x < mapW; x++) {
            if (gameState.map[y][x] === TILES.EXIT) {
                exitX = x;
                exitY = y;
            }
        }
    }

    // Find potential tunnel locations - floor tiles next to walls that could tunnel through
    const tunnelCandidates = [];

    for (let y = 3; y < mapH - 3; y++) {
        for (let x = 3; x < mapW - 3; x++) {
            if (gameState.map[y][x] !== TILES.FLOOR) continue;

            // Skip tiles too close to player spawn or exit
            const distToPlayer = Math.abs(x - playerTileX) + Math.abs(y - playerTileY);
            const distToExit = Math.abs(x - exitX) + Math.abs(y - exitY);
            if (distToPlayer < 5 || distToExit < 4) continue;

            // Check for horizontal tunnel opportunity (walls to the right, floor beyond)
            // Look for pattern: FLOOR | WALL WALL | FLOOR (tunnel length 2)
            for (let tunnelLen = 2; tunnelLen <= 3; tunnelLen++) {
                let canTunnelRight = true;
                // Check walls in tunnel
                for (let dx = 1; dx <= tunnelLen; dx++) {
                    if (gameState.map[y][x + dx] !== TILES.WALL) {
                        canTunnelRight = false;
                        break;
                    }
                }
                // Check floor at end
                if (canTunnelRight && x + tunnelLen + 1 < mapW &&
                    gameState.map[y][x + tunnelLen + 1] === TILES.FLOOR) {
                    tunnelCandidates.push({
                        x: x + 1,
                        y: y,
                        direction: 'horizontal',
                        length: tunnelLen,
                        score: tunnelLen
                    });
                }
            }

            // Check for vertical tunnel opportunity (walls below, floor beyond)
            for (let tunnelLen = 2; tunnelLen <= 3; tunnelLen++) {
                let canTunnelDown = true;
                for (let dy = 1; dy <= tunnelLen; dy++) {
                    if (gameState.map[y + dy][x] !== TILES.WALL) {
                        canTunnelDown = false;
                        break;
                    }
                }
                if (canTunnelDown && y + tunnelLen + 1 < mapH &&
                    gameState.map[y + tunnelLen + 1][x] === TILES.FLOOR) {
                    tunnelCandidates.push({
                        x: x,
                        y: y + 1,
                        direction: 'vertical',
                        length: tunnelLen,
                        score: tunnelLen
                    });
                }
            }
        }
    }

    // Sort by tunnel length (prefer longer tunnels - more meaningful shortcuts)
    tunnelCandidates.sort((a, b) => b.score - a.score);

    // Place tunnels, avoiding overlaps
    const targetTunnels = Math.max(2, Math.floor(mapW * mapH / 200));
    let placed = 0;
    const usedTiles = new Set();

    for (const tunnel of tunnelCandidates) {
        if (placed >= targetTunnels) break;

        // Check no overlap with already placed tunnels
        let overlaps = false;
        const tilesToUse = [];

        if (tunnel.direction === 'horizontal') {
            for (let dx = 0; dx < tunnel.length; dx++) {
                const key = `${tunnel.x + dx},${tunnel.y}`;
                if (usedTiles.has(key)) {
                    overlaps = true;
                    break;
                }
                tilesToUse.push({ x: tunnel.x + dx, y: tunnel.y, key });
            }
        } else {
            for (let dy = 0; dy < tunnel.length; dy++) {
                const key = `${tunnel.x},${tunnel.y + dy}`;
                if (usedTiles.has(key)) {
                    overlaps = true;
                    break;
                }
                tilesToUse.push({ x: tunnel.x, y: tunnel.y + dy, key });
            }
        }

        if (!overlaps) {
            // Place the breakable wall tunnel
            for (const tile of tilesToUse) {
                gameState.map[tile.y][tile.x] = TILES.BREAKABLE_WALL;
                usedTiles.add(tile.key);
            }
            placed++;
        }
    }
}

function addObstacles(obstacleChance) {
    const mapW = gameState.mapWidth;
    const mapH = gameState.mapHeight;

    for (let y = 1; y < mapH - 1; y++) {
        for (let x = 1; x < mapW - 1; x++) {
            if (gameState.map[y][x] === TILES.FLOOR && Math.random() < obstacleChance * 0.3) {
                // Check it's not blocking a corridor completely
                const neighbors = [
                    gameState.map[y - 1][x],
                    gameState.map[y + 1][x],
                    gameState.map[y][x - 1],
                    gameState.map[y][x + 1]
                ];
                const floorNeighbors = neighbors.filter(t => t === TILES.FLOOR || t === TILES.DESK).length;

                if (floorNeighbors >= 2) {
                    const obstacleType = Math.random();
                    if (obstacleType < 0.4) {
                        gameState.map[y][x] = TILES.LOCKER;
                    } else if (obstacleType < 0.6) {
                        gameState.map[y][x] = TILES.WET_FLOOR;
                    }
                }
            }
        }
    }
}

// Flood-fill to find all tiles reachable from player position
function computeReachableTiles() {
    const mapW = gameState.mapWidth;
    const mapH = gameState.mapHeight;
    const reachable = Array(mapH).fill(null).map(() => Array(mapW).fill(false));

    // Get player tile position
    const startX = Math.floor(player.x / TILE_SIZE);
    const startY = Math.floor(player.y / TILE_SIZE);

    // Walkable tiles (player can walk on these)
    const isWalkable = (tile) => tile === TILES.FLOOR || tile === TILES.WET_FLOOR || tile === TILES.EXIT;

    // BFS flood-fill
    const queue = [{ x: startX, y: startY }];
    reachable[startY][startX] = true;

    while (queue.length > 0) {
        const { x, y } = queue.shift();
        const directions = [
            { dx: 0, dy: -1 },
            { dx: 0, dy: 1 },
            { dx: -1, dy: 0 },
            { dx: 1, dy: 0 }
        ];

        for (const { dx, dy } of directions) {
            const nx = x + dx;
            const ny = y + dy;
            if (nx >= 0 && nx < mapW && ny >= 0 && ny < mapH &&
                !reachable[ny][nx] && isWalkable(gameState.map[ny][nx])) {
                reachable[ny][nx] = true;
                queue.push({ x: nx, y: ny });
            }
        }
    }

    return reachable;
}

function placeExit() {
    const mapW = gameState.mapWidth;
    const mapH = gameState.mapHeight;

    // Place exit on the opposite side from where player will start
    for (let x = mapW - 2; x > mapW / 2; x--) {
        for (let y = 1; y < mapH - 1; y++) {
            if (gameState.map[y][x] === TILES.FLOOR) {
                gameState.map[y][x] = TILES.EXIT;
                return;
            }
        }
    }
}

function placePlayer() {
    const mapH = gameState.mapHeight;

    // Find starting position on left side
    for (let x = 1; x < 5; x++) {
        for (let y = 1; y < mapH - 1; y++) {
            if (gameState.map[y][x] === TILES.FLOOR) {
                player.x = x * TILE_SIZE + TILE_SIZE / 2;
                player.y = y * TILE_SIZE + TILE_SIZE / 2;
                return;
            }
        }
    }
}

function placeCollectibles(count, reachable) {
    gameState.collectibles = [];
    const mapW = gameState.mapWidth;
    const mapH = gameState.mapHeight;

    const numCollectibles = count || Math.floor(mapW * mapH / 30) + 10;

    let placed = 0;
    let attempts = 0;
    while (placed < numCollectibles && attempts < 1000) {
        const x = Math.floor(Math.random() * (mapW - 2)) + 1;
        const y = Math.floor(Math.random() * (mapH - 2)) + 1;

        // Only place on floor tiles that are reachable from player start
        if (gameState.map[y][x] === TILES.FLOOR && reachable[y][x]) {
            // Check not too close to player
            const px = player.x / TILE_SIZE;
            const py = player.y / TILE_SIZE;
            if (Math.abs(x - px) + Math.abs(y - py) > 3) {
                gameState.collectibles.push({
                    id: placed, // ID for multiplayer sync
                    x: x * TILE_SIZE + TILE_SIZE / 2,
                    y: y * TILE_SIZE + TILE_SIZE / 2,
                    collected: false,
                    type: 'pizza',
                    animOffset: Math.random() * Math.PI * 2
                });
                placed++;
            }
        }
        attempts++;
    }
}

function placePowerups(reachable) {
    gameState.powerups = [];
    const mapW = gameState.mapWidth;
    const mapH = gameState.mapHeight;

    const powerupTypes = ['hallpass', 'energydrink', 'stinkbomb', 'skateboard'];
    const numPowerups = Math.floor(mapW * mapH / 80) + 3;

    let placed = 0;
    let attempts = 0;
    while (placed < numPowerups && attempts < 500) {
        const x = Math.floor(Math.random() * (mapW - 2)) + 1;
        const y = Math.floor(Math.random() * (mapH - 2)) + 1;

        // Only place on floor tiles that are reachable from player start
        if (gameState.map[y][x] === TILES.FLOOR && reachable[y][x]) {
            gameState.powerups.push({
                id: placed, // ID for multiplayer sync
                x: x * TILE_SIZE + TILE_SIZE / 2,
                y: y * TILE_SIZE + TILE_SIZE / 2,
                collected: false,
                type: powerupTypes[Math.floor(Math.random() * powerupTypes.length)],
                animOffset: Math.random() * Math.PI * 2
            });
            placed++;
        }
        attempts++;
    }
}

function placeTeachers(count, speedMultiplier = 1.0) {
    teachers = [];
    const mapW = gameState.mapWidth;
    const mapH = gameState.mapHeight;

    const teacherTypes = ['patrol', 'hunter', 'fast'];
    const numTeachers = count || settings.teacherCount;
    gameState.speedMultiplier = speedMultiplier;

    let placed = 0;
    let attempts = 0;
    while (placed < numTeachers && attempts < 500) {
        const x = Math.floor(Math.random() * (mapW - 4)) + 2;
        const y = Math.floor(Math.random() * (mapH - 4)) + 2;

        if (gameState.map[y][x] === TILES.FLOOR) {
            // Not too close to player start
            const px = player.x / TILE_SIZE;
            const py = player.y / TILE_SIZE;
            if (Math.abs(x - px) + Math.abs(y - py) > 8) {
                const type = teacherTypes[placed % teacherTypes.length];
                const teacher = createTeacher(x * TILE_SIZE + TILE_SIZE / 2, y * TILE_SIZE + TILE_SIZE / 2, type);
                teacher.id = placed; // ID for multiplayer sync
                teachers.push(teacher);
                placed++;
            }
        }
        attempts++;
    }
}

function createTeacher(x, y, type) {
    const baseSpeed = {
        patrol: 2,
        hunter: 2.5,
        fast: 3.5
    };

    const difficultyMultiplier = {
        elementary: 0.7,
        middle: 1,
        high: 1.2,
        university: 1.4
    };

    // Use campaign speed multiplier if in campaign mode
    const campaignMultiplier = gameState.speedMultiplier || 1.0;
    const schoolMultiplier = gameMode === 'campaign' ? 1.0 : difficultyMultiplier[settings.schoolType];

    return {
        x: x,
        y: y,
        vx: 0,
        vy: 0,
        speed: baseSpeed[type] * schoolMultiplier * campaignMultiplier,
        type: type,
        direction: Math.floor(Math.random() * 4),
        patrolTimer: 0,
        chaseTimer: 0,
        stunned: false,
        stunnedTimer: 0,
        seesPlayer: false,
        animFrame: 0,
        patrolPath: generatePatrolPath(x, y)
    };
}

function generatePatrolPath(startX, startY) {
    // Simple patrol: move in a square pattern
    const size = (Math.random() * 3 + 2) * TILE_SIZE;
    return [
        { x: startX, y: startY },
        { x: startX + size, y: startY },
        { x: startX + size, y: startY + size },
        { x: startX, y: startY + size }
    ];
}

function getRandomFloorPosition() {
    let attempts = 0;
    while (attempts < 100) {
        const x = Math.floor(Math.random() * gameState.mapWidth);
        const y = Math.floor(Math.random() * gameState.mapHeight);
        if (gameState.map[y] && gameState.map[y][x] === TILES.FLOOR) {
            return { x: x * TILE_SIZE + TILE_SIZE / 2, y: y * TILE_SIZE + TILE_SIZE / 2 };
        }
        attempts++;
    }
    return { x: player.x, y: player.y };
}

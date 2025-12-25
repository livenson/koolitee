/*
 * School Escape - Main Game Logic
 * Copyright (c) 2025 Ilja Livenson and Mark Livenson
 */

// ============================================
// CANVAS & CONSTANTS
// ============================================

const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const minimapCanvas = document.getElementById('minimap');
const minimapCtx = minimapCanvas.getContext('2d');

// Game constants
const TILE_SIZE = 32;
const PLAYER_SIZE = 24;
const TEACHER_SIZE = 28;

// Tile types
const TILES = {
    FLOOR: 0,
    WALL: 1,
    DESK: 2,
    LOCKER: 3,
    WET_FLOOR: 4,
    EXIT: 5,
    DOOR: 6
};

// ============================================
// GAME STATE
// ============================================

let gameState = {
    running: false,
    paused: false,
    score: 0,
    combo: 1,
    comboTimer: 0,
    lives: 3,
    level: 1,
    map: [],
    mapWidth: 0,
    mapHeight: 0,
    collectibles: [],
    powerups: [],
    activePowerups: [],
    playerPowerups: [null, null, null],
    particles: [],
    screenShake: 0,
    camera: { x: 0, y: 0 },
    reportedPlayerLocation: null
};

// Player object
let player = {
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    speed: 4,
    dashCooldown: 0,
    isDashing: false,
    dashTimer: 0,
    invincible: false,
    invincibleTimer: 0,
    speedBoost: false,
    speedBoostTimer: 0,
    direction: 0, // 0: right, 1: down, 2: left, 3: up
    animFrame: 0,
    superhero: false,
    canFly: false
};

// Teachers array
let teachers = [];

// Input state
const keys = {};

// Mobile controls state
let mobileInput = {
    active: false,
    joystick: { x: 0, y: 0 },
    isTouchDevice: false
};

// ============================================
// RESPONSIVE CANVAS
// ============================================

// Base resolution (internal game coordinates)
const BASE_WIDTH = 800;
const BASE_HEIGHT = 600;

// Track display scaling
let displayScale = 1;

function resizeCanvas() {
    const dpr = window.devicePixelRatio || 1;

    // Get available space
    const header = document.getElementById('game-header');
    const headerHeight = header ? header.offsetHeight + 10 : 60;

    const availableWidth = window.innerWidth - 20;
    const availableHeight = window.innerHeight - headerHeight - 20;

    // Calculate scale to fit while maintaining aspect ratio
    const scaleX = availableWidth / BASE_WIDTH;
    const scaleY = availableHeight / BASE_HEIGHT;
    displayScale = Math.min(scaleX, scaleY, 2); // Cap at 2x to prevent excessive scaling

    // Calculate display size
    const displayWidth = Math.floor(BASE_WIDTH * displayScale);
    const displayHeight = Math.floor(BASE_HEIGHT * displayScale);

    // Set CSS display size
    canvas.style.width = displayWidth + 'px';
    canvas.style.height = displayHeight + 'px';

    // Set internal resolution (higher for sharp rendering on high-DPI)
    const internalScale = Math.min(dpr, 2); // Cap internal scale for performance
    canvas.width = Math.floor(BASE_WIDTH * internalScale);
    canvas.height = Math.floor(BASE_HEIGHT * internalScale);

    // Scale the context to match base coordinates
    ctx.setTransform(internalScale, 0, 0, internalScale, 0, 0);
}

// Settings
let settings = {
    schoolType: 'middle',
    mapSize: 'medium',
    teacherCount: 4,
    soundEnabled: true,
    musicEnabled: false,
    language: 'en',
    eventsEnabled: false,
    playerAvatar: 'default',
    mapTopology: 'grid',
    corridorDensity: 'medium',
    roomDensity: 'normal'
};

// Random Events System
const RANDOM_EVENTS = [
    { id: 'ufo', name: 'ufoAbduction', duration: 6, minInterval: 30, icon: '🛸' },
    { id: 'dinosaur', name: 'dinosaurStampede', duration: 8, minInterval: 45, icon: '🦖' },
    { id: 'parents', name: 'parentsVisiting', duration: 15, minInterval: 40, icon: '👨‍👩‍👧' },
    { id: 'fireDrill', name: 'fireDrill', duration: 12, minInterval: 50, icon: '🚨' },
    { id: 'principal', name: 'principalInspection', duration: 10, minInterval: 35, icon: '🎩' },
    { id: 'powerOutage', name: 'powerOutage', duration: 12, minInterval: 40, icon: '💡' },
    { id: 'foodFight', name: 'foodFight', duration: 8, minInterval: 35, icon: '🍕' },
    { id: 'superhero', name: 'superheroStudent', duration: 6, minInterval: 45, icon: '🦸' },
    { id: 'ghost', name: 'ghostJanitor', duration: 10, minInterval: 40, icon: '👻' },
    { id: 'timeFreeze', name: 'timeFreeze', duration: 5, minInterval: 50, icon: '⏱️' },
    { id: 'earthquake', name: 'earthquake', duration: 3, minInterval: 60, icon: '🌋' },
    { id: 'pizza', name: 'pizzaDelivery', duration: 8, minInterval: 35, icon: '🍕' }
];

let currentEvent = null;
let eventTimer = 0;
let nextEventTime = 15;
let eventEntities = [];

// Level configuration
const LEVELS = [
    { id: 1,  name: 'grade1',     mapSize: { w: 20, h: 15 }, teachers: 2, speed: 0.6, collectibles: 8,  schoolType: 'elementary' },
    { id: 2,  name: 'grade2',     mapSize: { w: 22, h: 16 }, teachers: 2, speed: 0.65, collectibles: 10, schoolType: 'elementary' },
    { id: 3,  name: 'grade3',     mapSize: { w: 24, h: 17 }, teachers: 3, speed: 0.7, collectibles: 12, schoolType: 'elementary' },
    { id: 4,  name: 'grade4',     mapSize: { w: 26, h: 18 }, teachers: 3, speed: 0.75, collectibles: 14, schoolType: 'elementary' },
    { id: 5,  name: 'grade5',     mapSize: { w: 28, h: 19 }, teachers: 3, speed: 0.8, collectibles: 15, schoolType: 'middle' },
    { id: 6,  name: 'grade6',     mapSize: { w: 30, h: 20 }, teachers: 4, speed: 0.85, collectibles: 16, schoolType: 'middle' },
    { id: 7,  name: 'grade7',     mapSize: { w: 32, h: 22 }, teachers: 4, speed: 0.9, collectibles: 18, schoolType: 'middle' },
    { id: 8,  name: 'grade8',     mapSize: { w: 34, h: 24 }, teachers: 4, speed: 0.95, collectibles: 20, schoolType: 'middle' },
    { id: 9,  name: 'grade9',     mapSize: { w: 36, h: 25 }, teachers: 5, speed: 1.0, collectibles: 22, schoolType: 'middle' },
    { id: 10, name: 'gymnasium1', mapSize: { w: 38, h: 26 }, teachers: 5, speed: 1.05, collectibles: 24, schoolType: 'high' },
    { id: 11, name: 'gymnasium2', mapSize: { w: 40, h: 28 }, teachers: 5, speed: 1.1, collectibles: 26, schoolType: 'high' },
    { id: 12, name: 'gymnasium3', mapSize: { w: 42, h: 30 }, teachers: 6, speed: 1.15, collectibles: 28, schoolType: 'high' },
    { id: 13, name: 'bachelor1',  mapSize: { w: 44, h: 32 }, teachers: 6, speed: 1.2, collectibles: 30, schoolType: 'university' },
    { id: 14, name: 'bachelor2',  mapSize: { w: 46, h: 34 }, teachers: 6, speed: 1.25, collectibles: 32, schoolType: 'university' },
    { id: 15, name: 'bachelor3',  mapSize: { w: 48, h: 36 }, teachers: 7, speed: 1.3, collectibles: 34, schoolType: 'university' },
    { id: 16, name: 'master1',    mapSize: { w: 50, h: 38 }, teachers: 7, speed: 1.35, collectibles: 36, schoolType: 'university' },
    { id: 17, name: 'master2',    mapSize: { w: 55, h: 40 }, teachers: 8, speed: 1.4, collectibles: 40, schoolType: 'university' }
];

// Game mode
let gameMode = 'freeplay';
let currentLevel = 0;
let totalCampaignScore = 0;

// ============================================
// GAME LOGIC
// ============================================

function update(deltaTime) {
    if (!gameState.running || gameState.paused) return;

    // Update timers
    updateTimers(deltaTime);

    // Update random events
    updateEvents(deltaTime);

    // Update player
    updatePlayer(deltaTime);

    // Update teachers
    updateTeachers(deltaTime);

    // Check collisions
    checkCollisions();

    // Update particles
    updateParticles(deltaTime);

    // Update camera
    updateCamera();

    // Check win condition
    checkWinCondition();

    // Multiplayer updates
    if (mpState.active) {
        updateMyPresence();
        updateMultiplayerHUD();

        // Host broadcasts teacher positions periodically
        if (mpState.isHost) {
            mpState.teacherBroadcastTimer = (mpState.teacherBroadcastTimer || 0) + deltaTime;
            if (mpState.teacherBroadcastTimer > 0.1) {
                broadcastTeacherPositions();
                mpState.teacherBroadcastTimer = 0;
            }
        }
    }
}

function updateTimers(deltaTime) {
    // Combo timer
    if (gameState.comboTimer > 0) {
        gameState.comboTimer -= deltaTime;
        if (gameState.comboTimer <= 0) {
            gameState.combo = 1;
            updateUI();
        }
    }

    // Screen shake
    if (gameState.screenShake > 0) {
        gameState.screenShake -= deltaTime * 10;
    }

    // Player dash cooldown
    if (player.dashCooldown > 0) {
        player.dashCooldown -= deltaTime;
        updateMobileDashButton();
    }

    // Dash duration
    if (player.isDashing) {
        player.dashTimer -= deltaTime;
        if (player.dashTimer <= 0) {
            player.isDashing = false;
        }
    }

    // Invincibility
    if (player.invincible) {
        player.invincibleTimer -= deltaTime;
        if (player.invincibleTimer <= 0) {
            player.invincible = false;
        }
    }

    // Speed boost
    if (player.speedBoost) {
        player.speedBoostTimer -= deltaTime;
        if (player.speedBoostTimer <= 0) {
            player.speedBoost = false;
        }
    }

    // Active powerups
    gameState.activePowerups = gameState.activePowerups.filter(p => {
        p.timer -= deltaTime;
        return p.timer > 0;
    });
}

function updatePlayer(deltaTime) {
    // Get input (keyboard)
    let dx = 0, dy = 0;
    if (keys['ArrowLeft'] || keys['KeyA']) dx -= 1;
    if (keys['ArrowRight'] || keys['KeyD']) dx += 1;
    if (keys['ArrowUp'] || keys['KeyW']) dy -= 1;
    if (keys['ArrowDown'] || keys['KeyS']) dy += 1;

    // Mobile joystick input (overrides keyboard if active)
    if (mobileInput.active && (mobileInput.joystick.x !== 0 || mobileInput.joystick.y !== 0)) {
        dx = mobileInput.joystick.x;
        dy = mobileInput.joystick.y;
    }

    // Normalize diagonal movement (only for keyboard, joystick is already normalized)
    if (!mobileInput.active && dx !== 0 && dy !== 0) {
        dx *= 0.707;
        dy *= 0.707;
    }

    // Calculate speed
    let currentSpeed = player.speed;
    if (player.isDashing) currentSpeed *= 2.5;
    if (player.speedBoost) currentSpeed *= 1.5;
    if (player.superhero) currentSpeed *= 2.0;

    // Check for wet floor
    const tileX = Math.floor(player.x / TILE_SIZE);
    const tileY = Math.floor(player.y / TILE_SIZE);
    if (gameState.map[tileY] && gameState.map[tileY][tileX] === TILES.WET_FLOOR) {
        currentSpeed *= 1.3;
        player.vx += dx * currentSpeed * 0.3;
        player.vy += dy * currentSpeed * 0.3;
        player.vx *= 0.95;
        player.vy *= 0.95;
    } else {
        player.vx = dx * currentSpeed;
        player.vy = dy * currentSpeed;
    }

    // Update position with collision
    const newX = player.x + player.vx;
    const newY = player.y + player.vy;

    // Superhero can fly through walls
    if (player.canFly) {
        player.x = Math.max(PLAYER_SIZE, Math.min(newX, gameState.mapWidth * TILE_SIZE - PLAYER_SIZE));
        player.y = Math.max(PLAYER_SIZE, Math.min(newY, gameState.mapHeight * TILE_SIZE - PLAYER_SIZE));
    } else {
        if (!checkWallCollision(newX, player.y, PLAYER_SIZE)) {
            player.x = newX;
        }
        if (!checkWallCollision(player.x, newY, PLAYER_SIZE)) {
            player.y = newY;
        }
    }

    // Update direction
    if (dx > 0) player.direction = 0;
    else if (dx < 0) player.direction = 2;
    else if (dy > 0) player.direction = 1;
    else if (dy < 0) player.direction = 3;

    // Animation
    if (dx !== 0 || dy !== 0) {
        player.animFrame += 0.2;
    }

    // Dash particles
    if (player.isDashing) {
        spawnParticle(player.x, player.y, 'dash');
    }
}

function updateTeachers(deltaTime) {
    for (const teacher of teachers) {
        // Handle frozen state (from events)
        if (teacher.frozen) {
            teacher.vx = 0;
            teacher.vy = 0;
            continue;
        }

        if (teacher.stunned) {
            teacher.stunnedTimer -= deltaTime;
            if (teacher.stunnedTimer <= 0) {
                teacher.stunned = false;
            }
            continue;
        }

        // Handle scared state (from ghost)
        if (teacher.scaredTimer > 0) {
            teacher.scaredTimer -= deltaTime;
            const newX = teacher.x + teacher.vx * deltaTime * 60;
            const newY = teacher.y + teacher.vy * deltaTime * 60;
            if (!checkWallCollision(newX, teacher.y, TEACHER_SIZE)) teacher.x = newX;
            if (!checkWallCollision(teacher.x, newY, TEACHER_SIZE)) teacher.y = newY;
            continue;
        }

        // Handle pizza delivery event
        if (teacher.rushingToPizza && teacher.pizzaTarget) {
            const pdx = teacher.pizzaTarget.x - teacher.x;
            const pdy = teacher.pizzaTarget.y - teacher.y;
            const pDist = Math.sqrt(pdx * pdx + pdy * pdy);
            if (pDist > 20) {
                teacher.vx = (pdx / pDist) * teacher.speed * 1.5;
                teacher.vy = (pdy / pDist) * teacher.speed * 1.5;
            } else {
                teacher.vx = 0;
                teacher.vy = 0;
            }
            const newX = teacher.x + teacher.vx;
            const newY = teacher.y + teacher.vy;
            if (!checkWallCollision(newX, teacher.y, TEACHER_SIZE)) teacher.x = newX;
            if (!checkWallCollision(teacher.x, newY, TEACHER_SIZE)) teacher.y = newY;
            continue;
        }

        // Speed modifier from distraction
        const speedMod = teacher.distracted ? 0.5 : 1.0;

        // Check if teacher sees player
        const dx = player.x - teacher.x;
        const dy = player.y - teacher.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const sightRange = teacher.type === 'hunter' ? 200 : 150;
        const effectiveSightRange = gameState.powerOutage ? sightRange * 0.3 : sightRange;

        // Check vision cone
        const dirAngles = [0, Math.PI / 2, Math.PI, -Math.PI / 2];
        const faceAngle = dirAngles[teacher.direction];
        const angleToPlayer = Math.atan2(dy, dx);
        let angleDiff = angleToPlayer - faceAngle;
        while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
        while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;
        const inCone = Math.abs(angleDiff) <= Math.PI / 3;

        const nowSeesPlayer = dist < effectiveSightRange && inCone && hasLineOfSight(teacher.x, teacher.y, player.x, player.y);

        if (nowSeesPlayer && !teacher.seesPlayer) {
            playSound('alert');
        }
        teacher.seesPlayer = nowSeesPlayer;

        // Patrol teacher reports player location
        if (teacher.seesPlayer && teacher.type === 'patrol') {
            gameState.reportedPlayerLocation = {
                x: player.x,
                y: player.y,
                time: Date.now()
            };
        }

        // AI behavior
        if (teacher.seesPlayer && teacher.type !== 'patrol') {
            teacher.chaseTimer = 3;
            const angle = Math.atan2(dy, dx);
            teacher.vx = Math.cos(angle) * teacher.speed * 1.3 * speedMod;
            teacher.vy = Math.sin(angle) * teacher.speed * 1.3 * speedMod;
        } else if (teacher.chaseTimer > 0) {
            teacher.chaseTimer -= deltaTime;
        } else if (!teacher.seesPlayer && teacher.chaseTimer <= 0 && teacher.type !== 'patrol' && gameState.reportedPlayerLocation) {
            const report = gameState.reportedPlayerLocation;
            const reportAge = (Date.now() - report.time) / 1000;
            if (reportAge < 5) {
                const rdx = report.x - teacher.x;
                const rdy = report.y - teacher.y;
                const rdist = Math.sqrt(rdx * rdx + rdy * rdy);
                if (rdist > TILE_SIZE) {
                    const angle = Math.atan2(rdy, rdx);
                    teacher.vx = Math.cos(angle) * teacher.speed * speedMod;
                    teacher.vy = Math.sin(angle) * teacher.speed * speedMod;
                } else {
                    updatePatrol(teacher, deltaTime);
                    teacher.vx *= speedMod;
                    teacher.vy *= speedMod;
                }
            } else {
                updatePatrol(teacher, deltaTime);
                teacher.vx *= speedMod;
                teacher.vy *= speedMod;
            }
        } else {
            updatePatrol(teacher, deltaTime);
            teacher.vx *= speedMod;
            teacher.vy *= speedMod;
        }

        // Apply movement with collision
        const newX = teacher.x + teacher.vx;
        const newY = teacher.y + teacher.vy;

        let hitWall = false;
        if (!checkWallCollision(newX, teacher.y, TEACHER_SIZE)) {
            teacher.x = newX;
        } else {
            teacher.vx = -teacher.vx;
            hitWall = true;
        }
        if (!checkWallCollision(teacher.x, newY, TEACHER_SIZE)) {
            teacher.y = newY;
        } else {
            teacher.vy = -teacher.vy;
            hitWall = true;
        }

        if (hitWall && teacher.chaseTimer <= 0 && !teacher.seesPlayer) {
            teacher.patrolTimer = 3;
        }

        // Update direction based on velocity
        if (teacher.vx !== 0 || teacher.vy !== 0) {
            if (Math.abs(teacher.vx) > Math.abs(teacher.vy)) {
                teacher.direction = teacher.vx > 0 ? 0 : 2;
            } else {
                teacher.direction = teacher.vy > 0 ? 1 : 3;
            }
        }

        // Animation
        teacher.animFrame += 0.15;
    }
}

function updatePatrol(teacher, deltaTime) {
    teacher.patrolTimer += deltaTime;

    if (teacher.patrolTimer > 2) {
        teacher.patrolTimer = 0;
        teacher.direction = (teacher.direction + 1) % 4;
    }

    const speed = teacher.speed;
    switch (teacher.direction) {
        case 0: teacher.vx = speed; teacher.vy = 0; break;
        case 1: teacher.vx = 0; teacher.vy = speed; break;
        case 2: teacher.vx = -speed; teacher.vy = 0; break;
        case 3: teacher.vx = 0; teacher.vy = -speed; break;
    }
}

function hasLineOfSight(x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const steps = Math.ceil(dist / TILE_SIZE);

    for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const x = x1 + dx * t;
        const y = y1 + dy * t;
        const tileX = Math.floor(x / TILE_SIZE);
        const tileY = Math.floor(y / TILE_SIZE);

        if (gameState.map[tileY] && gameState.map[tileY][tileX] === TILES.WALL) {
            return false;
        }
    }
    return true;
}

function checkWallCollision(x, y, size) {
    const halfSize = size / 2;
    const corners = [
        { x: x - halfSize, y: y - halfSize },
        { x: x + halfSize, y: y - halfSize },
        { x: x - halfSize, y: y + halfSize },
        { x: x + halfSize, y: y + halfSize }
    ];

    for (const corner of corners) {
        const tileX = Math.floor(corner.x / TILE_SIZE);
        const tileY = Math.floor(corner.y / TILE_SIZE);

        if (tileX < 0 || tileX >= gameState.mapWidth ||
            tileY < 0 || tileY >= gameState.mapHeight) {
            return true;
        }

        const tile = gameState.map[tileY][tileX];
        if (tile === TILES.WALL || tile === TILES.LOCKER) {
            return true;
        }
    }
    return false;
}

function checkCollisions() {
    // Collectibles
    for (const item of gameState.collectibles) {
        if (item.collected) continue;

        const dx = player.x - item.x;
        const dy = player.y - item.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < PLAYER_SIZE) {
            item.collected = true;
            collectItem(item);
        }
    }

    // Power-ups
    for (const powerup of gameState.powerups) {
        if (powerup.collected) continue;

        const dx = player.x - powerup.x;
        const dy = player.y - powerup.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < PLAYER_SIZE) {
            powerup.collected = true;
            collectPowerup(powerup);
        }
    }

    // Teachers
    if (!player.invincible) {
        for (const teacher of teachers) {
            if (teacher.stunned) continue;

            const dx = player.x - teacher.x;
            const dy = player.y - teacher.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < (PLAYER_SIZE + TEACHER_SIZE) / 2) {
                playerCaught();
                break;
            }
        }
    }
}

function collectItem(item) {
    if (mpState.active) {
        broadcastCollectiblePickup(item.id);
    }

    gameState.combo = Math.min(gameState.combo + 1, 10);
    gameState.comboTimer = 2;

    const points = 100 * gameState.combo;
    gameState.score += points;

    playSound('collect', { combo: gameState.combo });

    for (let i = 0; i < 10; i++) {
        spawnParticle(item.x, item.y, 'collect');
    }

    spawnFloatingText(item.x, item.y, `+${points}`);
    updateUI();
}

function collectPowerup(powerup) {
    if (mpState.active) {
        broadcastPowerupPickup(powerup.id);
    }

    playSound('powerup');

    const emptySlot = gameState.playerPowerups.findIndex(p => p === null);
    if (emptySlot !== -1) {
        gameState.playerPowerups[emptySlot] = powerup.type;
        const powerupNames = { hallpass: t('hallPass'), energydrink: t('energyDrink'), stinkbomb: t('stinkBomb'), skateboard: t('skateboard') };
        showMessage(`${t('got')} ${powerupNames[powerup.type]}!`);
    } else {
        usePowerup(powerup.type);
    }

    for (let i = 0; i < 15; i++) {
        spawnParticle(powerup.x, powerup.y, 'powerup');
    }

    updateUI();
    updateMobilePowerupButton();
}

function usePowerup(type) {
    if (type !== 'stinkbomb') {
        playSound('powerup_use');
    }

    switch (type) {
        case 'hallpass':
            player.invincible = true;
            player.invincibleTimer = 5;
            showMessage(t('invincible'));
            break;
        case 'energydrink':
            player.speedBoost = true;
            player.speedBoostTimer = 8;
            showMessage(t('speedBoost'));
            break;
        case 'stinkbomb':
            playSound('stun');
            for (const teacher of teachers) {
                teacher.stunned = true;
                teacher.stunnedTimer = 4;
            }
            showMessage(t('stinkBombMsg'));
            gameState.screenShake = 5;
            if (mpState.active) {
                broadcastStinkBomb();
            }
            break;
        case 'skateboard':
            player.speedBoost = true;
            player.speedBoostTimer = 10;
            showMessage(t('skateboardMsg'));
            break;
    }
}

function playerCaught() {
    playSound('caught');

    gameState.lives--;
    gameState.combo = 1;
    gameState.screenShake = 10;

    for (let i = 0; i < 20; i++) {
        spawnParticle(player.x, player.y, 'hit');
    }

    if (gameState.lives <= 0) {
        gameOver(false);
    } else {
        player.invincible = true;
        player.invincibleTimer = 2;
        showMessage(`${t('caughtMsg')} ${gameState.lives} ${t('livesLeft')}`);
    }

    updateUI();
}

function checkWinCondition() {
    const collected = gameState.collectibles.filter(c => c.collected).length;
    const total = gameState.collectibles.length;

    if (collected === total) {
        const tileX = Math.floor(player.x / TILE_SIZE);
        const tileY = Math.floor(player.y / TILE_SIZE);

        if (gameState.map[tileY] && gameState.map[tileY][tileX] === TILES.EXIT) {
            gameOver(true);
        }
    }
}

function gameOver(won) {
    gameState.running = false;
    stopMusic();
    hideMobileControls();

    playSound(won ? 'win' : 'lose');

    if (won) {
        gameState.score += gameState.lives * 500;
    }

    const mpScores = mpState.active ? getAllPlayerScores() : null;

    if (mpState.active && mpState.isHost) {
        broadcastGameOver(won, mpScores);
    }

    if (gameMode === 'campaign' && won) {
        showLevelCompleteScreen(mpScores);
        return;
    }

    showMultiplayerGameOverScreen(won, mpScores);
}

// ============================================
// PARTICLES & EFFECTS
// ============================================

function spawnParticle(x, y, type) {
    const colors = {
        collect: ['#ffd700', '#ffec8b', '#fff'],
        powerup: ['#4ade80', '#22d3ee', '#a78bfa'],
        hit: ['#ff6b6b', '#ff0000', '#ff8888'],
        dash: ['#60a5fa', '#3b82f6', '#93c5fd']
    };

    const color = colors[type][Math.floor(Math.random() * colors[type].length)];
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 3 + 1;

    gameState.particles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        color: color,
        size: Math.random() * 6 + 2
    });
}

function spawnFloatingText(x, y, text) {
    gameState.particles.push({
        x: x,
        y: y,
        vx: 0,
        vy: -2,
        life: 1,
        text: text,
        isText: true
    });
}

function updateParticles(deltaTime) {
    gameState.particles = gameState.particles.filter(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.life -= deltaTime * 2;
        if (!p.isText) {
            p.size *= 0.95;
        }
        return p.life > 0;
    });
}

function updateCamera() {
    // Use base dimensions for consistent camera behavior across all screen sizes
    const targetX = player.x - BASE_WIDTH / 2;
    const targetY = player.y - BASE_HEIGHT / 2;

    gameState.camera.x += (targetX - gameState.camera.x) * 0.1;
    gameState.camera.y += (targetY - gameState.camera.y) * 0.1;

    const maxX = gameState.mapWidth * TILE_SIZE - BASE_WIDTH;
    const maxY = gameState.mapHeight * TILE_SIZE - BASE_HEIGHT;

    gameState.camera.x = Math.max(0, Math.min(maxX, gameState.camera.x));
    gameState.camera.y = Math.max(0, Math.min(maxY, gameState.camera.y));
}

// ============================================
// EVENTS SYSTEM
// ============================================

function updateEvents(deltaTime) {
    if (!settings.eventsEnabled || !gameState.running || gameState.paused) return;

    if (currentEvent) {
        eventTimer -= deltaTime;
        updateCurrentEvent(deltaTime);
        if (eventTimer <= 0) {
            endCurrentEvent();
        }
    } else {
        nextEventTime -= deltaTime;
        if (nextEventTime <= 0) {
            triggerRandomEvent();
        }
    }

    updateEventEntities(deltaTime);
}

function triggerRandomEvent() {
    const event = RANDOM_EVENTS[Math.floor(Math.random() * RANDOM_EVENTS.length)];
    currentEvent = { ...event };
    eventTimer = event.duration;
    nextEventTime = event.minInterval + Math.random() * 20;

    showMessage(`${event.icon} ${t(event.name)}!`);
    playSound('powerup');

    initEventState(event.id);
}

function initEventState(eventId) {
    eventEntities = [];

    switch (eventId) {
        case 'ufo':
            eventEntities.push({
                type: 'ufo',
                x: -100,
                y: Math.random() * gameState.mapHeight * TILE_SIZE,
                targetY: Math.random() * gameState.mapHeight * TILE_SIZE,
                speed: 150,
                beamActive: false,
                beamTimer: 0
            });
            break;

        case 'dinosaur':
            const numDinos = 3 + Math.floor(Math.random() * 3);
            for (let i = 0; i < numDinos; i++) {
                eventEntities.push({
                    type: 'dinosaur',
                    x: -50 - i * 80,
                    y: (Math.random() * 0.6 + 0.2) * gameState.mapHeight * TILE_SIZE,
                    speed: 200 + Math.random() * 100,
                    variant: Math.random() < 0.3 ? 'trex' : 'raptor'
                });
            }
            break;

        case 'parents':
            for (let i = 0; i < 5; i++) {
                const pos = getRandomFloorPosition();
                eventEntities.push({
                    type: 'parent',
                    x: pos.x,
                    y: pos.y,
                    wanderAngle: Math.random() * Math.PI * 2
                });
            }
            break;

        case 'fireDrill':
            gameState.fireDrillActive = true;
            teachers.forEach(t => t.speed *= 1.5);
            break;

        case 'principal':
            const principalPos = getRandomFloorPosition();
            eventEntities.push({
                type: 'principal',
                x: principalPos.x,
                y: principalPos.y,
                patrolAngle: 0
            });
            teachers.forEach(t => t.frozen = true);
            break;

        case 'powerOutage':
            gameState.powerOutage = true;
            break;

        case 'foodFight':
            gameState.foodFightActive = true;
            break;

        case 'superhero':
            player.superhero = true;
            player.canFly = true;
            player.invincible = true;
            player.invincibleTimer = 6;
            break;

        case 'ghost':
            const ghostPos = getRandomFloorPosition();
            eventEntities.push({
                type: 'ghost',
                x: ghostPos.x,
                y: ghostPos.y,
                targetX: ghostPos.x,
                targetY: ghostPos.y,
                alpha: 0.7
            });
            break;

        case 'timeFreeze':
            gameState.timeFreeze = true;
            teachers.forEach(t => t.frozen = true);
            break;

        case 'earthquake':
            gameState.earthquakeActive = true;
            createEarthquakeCracks();
            break;

        case 'pizza':
            const pizzaPos = getRandomFloorPosition();
            eventEntities.push({
                type: 'pizza',
                x: pizzaPos.x,
                y: pizzaPos.y
            });
            teachers.forEach(t => {
                t.rushingToPizza = true;
                t.pizzaTarget = { x: pizzaPos.x, y: pizzaPos.y };
            });
            break;
    }
}

function updateCurrentEvent(deltaTime) {
    if (!currentEvent) return;

    switch (currentEvent.id) {
        case 'foodFight':
            if (Math.random() < 0.1) {
                const foods = ['🍕', '🍔', '🍟', '🌭', '🥪', '🍩'];
                eventEntities.push({
                    type: 'food',
                    x: Math.random() * gameState.mapWidth * TILE_SIZE,
                    y: -20,
                    vy: 100 + Math.random() * 100,
                    foodType: foods[Math.floor(Math.random() * foods.length)]
                });
            }
            break;

        case 'earthquake':
            if (Math.random() < 0.02) {
                createEarthquakeCracks();
            }
            gameState.screenShake = 3;
            break;
    }
}

function updateEventEntities(deltaTime) {
    const toRemove = [];

    eventEntities.forEach((entity, index) => {
        switch (entity.type) {
            case 'ufo':
                entity.x += entity.speed * deltaTime;
                if (Math.abs(entity.y - entity.targetY) > 10) {
                    entity.y += (entity.targetY > entity.y ? 1 : -1) * 50 * deltaTime;
                } else if (Math.random() < 0.01) {
                    entity.targetY = Math.random() * gameState.mapHeight * TILE_SIZE;
                }

                entity.beamTimer -= deltaTime;
                if (entity.beamTimer <= 0) {
                    entity.beamActive = Math.random() < 0.3;
                    entity.beamTimer = Math.random() * 2 + 0.5;
                }

                if (entity.beamActive) {
                    teachers.forEach(teacher => {
                        if (Math.abs(teacher.x - entity.x) < 60 && teacher.y > entity.y) {
                            teacher.y -= 100 * deltaTime;
                        }
                    });
                }
                break;

            case 'dinosaur':
                entity.x += entity.speed * deltaTime;
                teachers.forEach(teacher => {
                    if (Math.abs(teacher.x - entity.x) < 50 && Math.abs(teacher.y - entity.y) < 50) {
                        teacher.stunned = true;
                        teacher.stunnedTimer = 3;
                    }
                });
                break;

            case 'parent':
                if (Math.random() < 0.02) {
                    entity.wanderAngle += (Math.random() - 0.5) * Math.PI / 2;
                }
                const parentSpeed = 30;
                const newPX = entity.x + Math.cos(entity.wanderAngle) * parentSpeed * deltaTime;
                const newPY = entity.y + Math.sin(entity.wanderAngle) * parentSpeed * deltaTime;
                if (!checkWallCollision(newPX, newPY, 20)) {
                    entity.x = newPX;
                    entity.y = newPY;
                } else {
                    entity.wanderAngle += Math.PI;
                }
                teachers.forEach(teacher => {
                    const dx = teacher.x - entity.x;
                    const dy = teacher.y - entity.y;
                    if (Math.sqrt(dx*dx + dy*dy) < 150) {
                        teacher.distracted = true;
                    }
                });
                break;

            case 'principal':
                entity.patrolAngle += deltaTime * 0.5;
                const radius = 100;
                entity.displayX = entity.x + Math.cos(entity.patrolAngle) * radius;
                entity.displayY = entity.y + Math.sin(entity.patrolAngle) * radius;
                break;

            case 'ghost':
                if (Math.random() < 0.02) {
                    let foundWetFloor = false;
                    for (let y = 0; y < gameState.mapHeight && !foundWetFloor; y++) {
                        for (let x = 0; x < gameState.mapWidth && !foundWetFloor; x++) {
                            if (gameState.map[y][x] === TILES.WET_FLOOR) {
                                entity.targetX = x * TILE_SIZE + TILE_SIZE/2;
                                entity.targetY = y * TILE_SIZE + TILE_SIZE/2;
                                foundWetFloor = true;
                            }
                        }
                    }
                    if (!foundWetFloor) {
                        const pos = getRandomFloorPosition();
                        entity.targetX = pos.x;
                        entity.targetY = pos.y;
                    }
                }

                const gdx = entity.targetX - entity.x;
                const gdy = entity.targetY - entity.y;
                const gDist = Math.sqrt(gdx*gdx + gdy*gdy);
                if (gDist > 5) {
                    entity.x += (gdx / gDist) * 80 * deltaTime;
                    entity.y += (gdy / gDist) * 80 * deltaTime;
                }

                const gTileX = Math.floor(entity.x / TILE_SIZE);
                const gTileY = Math.floor(entity.y / TILE_SIZE);
                if (gameState.map[gTileY] && gameState.map[gTileY][gTileX] === TILES.WET_FLOOR) {
                    gameState.map[gTileY][gTileX] = TILES.FLOOR;
                }

                teachers.forEach(teacher => {
                    const dx = teacher.x - entity.x;
                    const dy = teacher.y - entity.y;
                    const dist = Math.sqrt(dx*dx + dy*dy);
                    if (dist < 100) {
                        if (dist > 1) {
                            teacher.vx = (dx / dist) * teacher.speed * 3;
                            teacher.vy = (dy / dist) * teacher.speed * 3;
                        } else {
                            const angle = Math.random() * Math.PI * 2;
                            teacher.vx = Math.cos(angle) * teacher.speed * 3;
                            teacher.vy = Math.sin(angle) * teacher.speed * 3;
                        }
                        teacher.scaredTimer = 1;
                    }
                });

                entity.alpha = 0.5 + Math.sin(Date.now() / 200) * 0.3;
                break;

            case 'food':
                entity.y += entity.vy * deltaTime;
                const foodTileY = Math.floor(entity.y / TILE_SIZE);
                if (foodTileY >= 0 && foodTileY < gameState.mapHeight) {
                    teachers.forEach(teacher => {
                        const dx = teacher.x - entity.x;
                        const dy = teacher.y - entity.y;
                        if (Math.sqrt(dx*dx + dy*dy) < 30) {
                            teacher.stunned = true;
                            teacher.stunnedTimer = 2;
                            toRemove.push(index);
                        }
                    });

                    const pdx = player.x - entity.x;
                    const pdy = player.y - entity.y;
                    if (Math.sqrt(pdx*pdx + pdy*pdy) < 25 && !player.invincible) {
                        player.vx += (Math.random() - 0.5) * 100;
                        player.vy += (Math.random() - 0.5) * 100;
                        toRemove.push(index);
                    }

                    if (entity.y > foodTileY * TILE_SIZE + TILE_SIZE) {
                        const tileX = Math.floor(entity.x / TILE_SIZE);
                        if (gameState.map[foodTileY] && gameState.map[foodTileY][tileX] === TILES.FLOOR) {
                            gameState.map[foodTileY][tileX] = TILES.WET_FLOOR;
                        }
                        toRemove.push(index);
                    }
                }
                break;

            case 'pizza':
                entity.timer = (entity.timer || 0) + deltaTime;
                break;
        }
    });

    toRemove.sort((a, b) => b - a).forEach(idx => eventEntities.splice(idx, 1));
}

function endCurrentEvent() {
    if (!currentEvent) return;

    switch (currentEvent.id) {
        case 'principal':
        case 'timeFreeze':
            teachers.forEach(t => t.frozen = false);
            break;

        case 'powerOutage':
            gameState.powerOutage = false;
            break;

        case 'fireDrill':
            gameState.fireDrillActive = false;
            break;

        case 'foodFight':
            gameState.foodFightActive = false;
            break;

        case 'superhero':
            player.superhero = false;
            player.canFly = false;
            break;

        case 'earthquake':
            gameState.earthquakeActive = false;
            break;

        case 'pizza':
            teachers.forEach(t => {
                t.rushingToPizza = false;
                t.pizzaTarget = null;
            });
            break;

        case 'parents':
            teachers.forEach(t => t.distracted = false);
            break;
    }

    eventEntities = [];
    currentEvent = null;
    showMessage(t('eventEnded'));
}

function createEarthquakeCracks() {
    const numCracks = 3 + Math.floor(Math.random() * 3);
    for (let i = 0; i < numCracks; i++) {
        const x = Math.floor(Math.random() * (gameState.mapWidth - 2)) + 1;
        const y = Math.floor(Math.random() * (gameState.mapHeight - 2)) + 1;
        if (gameState.map[y][x] === TILES.WALL) {
            const hasFloorNeighbor =
                (gameState.map[y-1] && gameState.map[y-1][x] === TILES.FLOOR) ||
                (gameState.map[y+1] && gameState.map[y+1][x] === TILES.FLOOR) ||
                (gameState.map[y][x-1] === TILES.FLOOR) ||
                (gameState.map[y][x+1] === TILES.FLOOR);
            if (hasFloorNeighbor) {
                gameState.map[y][x] = TILES.FLOOR;
                spawnParticle(x * TILE_SIZE + TILE_SIZE/2, y * TILE_SIZE + TILE_SIZE/2, 'hit');
            }
        }
    }
}

// ============================================
// RENDERING
// ============================================

function render() {
    // Clear canvas (use base dimensions for consistent coordinate space)
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, BASE_WIDTH, BASE_HEIGHT);

    // Apply screen shake
    let shakeX = 0, shakeY = 0;
    if (gameState.screenShake > 0) {
        shakeX = (Math.random() - 0.5) * gameState.screenShake;
        shakeY = (Math.random() - 0.5) * gameState.screenShake;
    }

    ctx.save();
    ctx.translate(-gameState.camera.x + shakeX, -gameState.camera.y + shakeY);

    // Draw map
    drawMap();

    // Draw collectibles
    drawCollectibles();

    // Draw power-ups
    drawPowerups();

    // Draw teachers
    drawTeachers();

    // Draw player
    drawPlayer();

    // Draw other players (multiplayer)
    drawOtherPlayers();

    // Draw particles
    drawParticles();

    // Draw event entities (in world space)
    drawEventEntities(ctx);

    ctx.restore();

    // Draw event effects (in screen space - done inside drawEventEntities)

    // Draw minimap
    drawMinimap();

    requestAnimationFrame(render);
}

function drawMap() {
    const startX = Math.floor(gameState.camera.x / TILE_SIZE);
    const startY = Math.floor(gameState.camera.y / TILE_SIZE);
    // Use base dimensions for consistent tile rendering
    const endX = Math.min(startX + Math.ceil(BASE_WIDTH / TILE_SIZE) + 2, gameState.mapWidth);
    const endY = Math.min(startY + Math.ceil(BASE_HEIGHT / TILE_SIZE) + 2, gameState.mapHeight);

    for (let y = Math.max(0, startY); y < endY; y++) {
        for (let x = Math.max(0, startX); x < endX; x++) {
            const tile = gameState.map[y][x];
            const px = x * TILE_SIZE;
            const py = y * TILE_SIZE;

            switch (tile) {
                case TILES.FLOOR:
                    ctx.fillStyle = '#3d3d5c';
                    ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
                    // Floor pattern
                    ctx.fillStyle = '#4a4a6a';
                    if ((x + y) % 2 === 0) {
                        ctx.fillRect(px + 2, py + 2, TILE_SIZE - 4, TILE_SIZE - 4);
                    }
                    break;

                case TILES.WALL:
                    // Wall with gradient
                    const gradient = ctx.createLinearGradient(px, py, px, py + TILE_SIZE);
                    gradient.addColorStop(0, '#5c4033');
                    gradient.addColorStop(1, '#3d2817');
                    ctx.fillStyle = gradient;
                    ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
                    // Brick pattern
                    ctx.strokeStyle = '#2a1a0a';
                    ctx.lineWidth = 1;
                    ctx.strokeRect(px + 1, py + 1, TILE_SIZE - 2, TILE_SIZE - 2);
                    if (y % 2 === 0) {
                        ctx.beginPath();
                        ctx.moveTo(px + TILE_SIZE / 2, py);
                        ctx.lineTo(px + TILE_SIZE / 2, py + TILE_SIZE);
                        ctx.stroke();
                    }
                    break;

                case TILES.DESK:
                    // Floor underneath
                    ctx.fillStyle = '#3d3d5c';
                    ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
                    // Desk
                    ctx.fillStyle = '#8b4513';
                    ctx.fillRect(px + 4, py + 4, TILE_SIZE - 8, TILE_SIZE - 8);
                    ctx.fillStyle = '#a0522d';
                    ctx.fillRect(px + 6, py + 6, TILE_SIZE - 12, TILE_SIZE - 12);
                    break;

                case TILES.LOCKER:
                    ctx.fillStyle = '#3d3d5c';
                    ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
                    // Locker
                    ctx.fillStyle = '#4a90a4';
                    ctx.fillRect(px + 2, py + 2, TILE_SIZE - 4, TILE_SIZE - 4);
                    ctx.fillStyle = '#5ba3b8';
                    ctx.fillRect(px + 4, py + 4, TILE_SIZE - 8, 12);
                    ctx.fillRect(px + 4, py + 18, TILE_SIZE - 8, 12);
                    // Handle
                    ctx.fillStyle = '#333';
                    ctx.fillRect(px + TILE_SIZE - 10, py + 12, 4, 8);
                    break;

                case TILES.WET_FLOOR:
                    ctx.fillStyle = '#3d3d5c';
                    ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
                    // Water effect
                    ctx.fillStyle = 'rgba(100, 200, 255, 0.3)';
                    ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
                    // Caution pattern
                    ctx.fillStyle = '#ffd700';
                    ctx.beginPath();
                    ctx.moveTo(px + TILE_SIZE / 2, py + 4);
                    ctx.lineTo(px + TILE_SIZE - 4, py + TILE_SIZE - 4);
                    ctx.lineTo(px + 4, py + TILE_SIZE - 4);
                    ctx.closePath();
                    ctx.fill();
                    ctx.fillStyle = '#333';
                    ctx.font = '16px Arial';
                    ctx.fillText('!', px + TILE_SIZE / 2 - 3, py + TILE_SIZE - 8);
                    break;

                case TILES.EXIT:
                    ctx.fillStyle = '#3d3d5c';
                    ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
                    // Exit door
                    const allCollected = gameState.collectibles.every(c => c.collected);
                    ctx.fillStyle = allCollected ? '#4ade80' : '#666';
                    ctx.fillRect(px + 4, py + 2, TILE_SIZE - 8, TILE_SIZE - 4);
                    // EXIT sign
                    ctx.fillStyle = allCollected ? '#fff' : '#999';
                    ctx.font = 'bold 10px Arial';
                    ctx.fillText('EXIT', px + 6, py + TILE_SIZE / 2 + 3);
                    // Glow effect if active
                    if (allCollected) {
                        ctx.strokeStyle = '#4ade80';
                        ctx.lineWidth = 2;
                        ctx.strokeRect(px + 2, py, TILE_SIZE - 4, TILE_SIZE);
                    }
                    break;
            }
        }
    }
}

function drawCollectibles() {
    const time = Date.now() / 1000;

    for (const item of gameState.collectibles) {
        if (item.collected) continue;

        const bobY = Math.sin(time * 3 + item.animOffset) * 3;

        // Glow
        ctx.fillStyle = 'rgba(255, 215, 0, 0.3)';
        ctx.beginPath();
        ctx.arc(item.x, item.y + bobY, 15, 0, Math.PI * 2);
        ctx.fill();

        // Pizza slice icon
        ctx.save();
        ctx.translate(item.x, item.y + bobY);

        // Pizza slice (triangle shape)
        ctx.beginPath();
        ctx.moveTo(0, -12);  // Top point
        ctx.lineTo(-10, 10); // Bottom left
        ctx.lineTo(10, 10);  // Bottom right
        ctx.closePath();

        // Cheese/base color
        ctx.fillStyle = '#f4a460'; // Sandy brown crust
        ctx.fill();

        // Cheese topping
        ctx.beginPath();
        ctx.moveTo(0, -8);
        ctx.lineTo(-7, 7);
        ctx.lineTo(7, 7);
        ctx.closePath();
        ctx.fillStyle = '#ffd700'; // Golden cheese
        ctx.fill();

        // Pepperoni toppings
        ctx.fillStyle = '#c41e3a'; // Pepperoni red
        ctx.beginPath();
        ctx.arc(-2, 0, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(3, 4, 2.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }
}

function drawPowerups() {
    const time = Date.now() / 1000;

    for (const powerup of gameState.powerups) {
        if (powerup.collected) continue;

        const bobY = Math.sin(time * 2 + powerup.animOffset) * 4;
        const scale = 1 + Math.sin(time * 4) * 0.1;

        ctx.save();
        ctx.translate(powerup.x, powerup.y + bobY);
        ctx.scale(scale, scale);

        // Draw based on type
        ctx.font = '20px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        switch (powerup.type) {
            case 'hallpass':
                ctx.fillStyle = 'rgba(74, 222, 128, 0.3)';
                ctx.beginPath();
                ctx.arc(0, 0, 15, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillText('📜', 0, 0);
                break;
            case 'energydrink':
                ctx.fillStyle = 'rgba(251, 191, 36, 0.3)';
                ctx.beginPath();
                ctx.arc(0, 0, 15, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillText('⚡', 0, 0);
                break;
            case 'stinkbomb':
                ctx.fillStyle = 'rgba(167, 139, 250, 0.3)';
                ctx.beginPath();
                ctx.arc(0, 0, 15, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillText('💨', 0, 0);
                break;
            case 'skateboard':
                ctx.fillStyle = 'rgba(96, 165, 250, 0.3)';
                ctx.beginPath();
                ctx.arc(0, 0, 15, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillText('🛹', 0, 0);
                break;
        }

        ctx.restore();
    }
}

function drawTeachers() {
    for (const teacher of teachers) {
        const bobY = Math.sin(teacher.animFrame) * 2;

        ctx.save();
        ctx.translate(teacher.x, teacher.y + bobY);

        // Stunned effect
        if (teacher.stunned) {
            ctx.globalAlpha = 0.5;
            // Dizzy stars
            ctx.font = '12px Arial';
            const starAngle = Date.now() / 200;
            ctx.fillText('⭐', Math.cos(starAngle) * 15, -20 + Math.sin(starAngle) * 5);
            ctx.fillText('⭐', Math.cos(starAngle + Math.PI) * 15, -20 + Math.sin(starAngle + Math.PI) * 5);
        }

        // Vision cone / visibility circle
        if (!teacher.stunned) {
            const sightRange = teacher.type === 'hunter' ? 200 : 150;
            const dirAngles = [0, Math.PI / 2, Math.PI, -Math.PI / 2];
            const faceAngle = dirAngles[teacher.direction];

            // Draw vision cone
            ctx.save();
            ctx.globalAlpha = teacher.seesPlayer ? 0.5 : 0.3;

            // Create cone gradient
            const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, sightRange);
            if (teacher.seesPlayer) {
                gradient.addColorStop(0, 'rgba(255, 0, 0, 0.7)');
                gradient.addColorStop(1, 'rgba(255, 0, 0, 0.1)');
            } else {
                gradient.addColorStop(0, 'rgba(255, 255, 0, 0.6)');
                gradient.addColorStop(1, 'rgba(255, 255, 0, 0.1)');
            }

            ctx.fillStyle = gradient;
            ctx.beginPath();
            // Draw a cone in the facing direction
            ctx.moveTo(0, 0);
            ctx.arc(0, 0, sightRange, faceAngle - Math.PI / 3, faceAngle + Math.PI / 3);
            ctx.closePath();
            ctx.fill();

            // Draw outer edge of vision cone
            ctx.strokeStyle = teacher.seesPlayer ? 'rgba(255, 0, 0, 0.8)' : 'rgba(255, 255, 0, 0.6)';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(0, 0, sightRange, faceAngle - Math.PI / 3, faceAngle + Math.PI / 3);
            ctx.stroke();

            ctx.restore();
        }

        // Alert indicator
        if (teacher.seesPlayer && !teacher.stunned) {
            ctx.fillStyle = '#ff0000';
            ctx.font = 'bold 16px Arial';
            ctx.fillText('!', 0, -25);
        }

        // Teacher colors and styles
        const colors = {
            patrol: '#4a90a4',    // Blue - calm patrol
            hunter: '#c0392b',    // Red - aggressive hunter
            fast: '#9b59b6'       // Purple - speedy
        };

        // Shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.beginPath();
        ctx.ellipse(0, TEACHER_SIZE / 2 - 5, TEACHER_SIZE / 2, 5, 0, 0, Math.PI * 2);
        ctx.fill();

        // Body - different shapes for each type
        ctx.fillStyle = colors[teacher.type];
        if (teacher.type === 'patrol') {
            // Circle body (normal)
            ctx.beginPath();
            ctx.arc(0, 0, TEACHER_SIZE / 2, 0, Math.PI * 2);
            ctx.fill();
            // Clipboard accessory
            ctx.fillStyle = '#8B4513';
            ctx.fillRect(-8, 5, 6, 10);
            ctx.fillStyle = '#fff';
            ctx.fillRect(-7, 6, 4, 8);
        } else if (teacher.type === 'hunter') {
            // Square-ish body (intimidating)
            ctx.beginPath();
            ctx.roundRect(-TEACHER_SIZE / 2, -TEACHER_SIZE / 2, TEACHER_SIZE, TEACHER_SIZE, 6);
            ctx.fill();
            // Angry eyebrows
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(-6, -8);
            ctx.lineTo(-2, -5);
            ctx.moveTo(6, -8);
            ctx.lineTo(2, -5);
            ctx.stroke();
            // Whistle accessory
            ctx.fillStyle = '#ffd700';
            ctx.beginPath();
            ctx.arc(10, 5, 4, 0, Math.PI * 2);
            ctx.fill();
        } else if (teacher.type === 'fast') {
            // Oval body (aerodynamic)
            ctx.beginPath();
            ctx.ellipse(0, 0, TEACHER_SIZE / 2 - 2, TEACHER_SIZE / 2 + 3, 0, 0, Math.PI * 2);
            ctx.fill();
            // Speed lines
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(-TEACHER_SIZE / 2 - 5, -3);
            ctx.lineTo(-TEACHER_SIZE / 2 - 12, -3);
            ctx.moveTo(-TEACHER_SIZE / 2 - 3, 3);
            ctx.lineTo(-TEACHER_SIZE / 2 - 10, 3);
            ctx.stroke();
            // Sneakers (running shoes)
            ctx.fillStyle = '#fff';
            ctx.fillRect(-5, TEACHER_SIZE / 2 - 2, 10, 4);
        }

        // Face - eyes that look in movement direction
        const dirAngles = [0, Math.PI / 2, Math.PI, -Math.PI / 2];
        const faceAngle = dirAngles[teacher.direction];

        // Eyes
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(-4, -2, 5, 0, Math.PI * 2);
        ctx.arc(4, -2, 5, 0, Math.PI * 2);
        ctx.fill();

        // Pupils (look in direction of movement)
        ctx.fillStyle = '#333';
        const pupilOffset = 2;
        ctx.beginPath();
        ctx.arc(-4 + Math.cos(faceAngle) * pupilOffset, -2 + Math.sin(faceAngle) * pupilOffset, 2, 0, Math.PI * 2);
        ctx.arc(4 + Math.cos(faceAngle) * pupilOffset, -2 + Math.sin(faceAngle) * pupilOffset, 2, 0, Math.PI * 2);
        ctx.fill();

        // Type label above head
        ctx.font = 'bold 10px Arial';
        ctx.textAlign = 'center';
        ctx.fillStyle = colors[teacher.type];
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        const label = teacher.type === 'patrol' ? t('patrol') : teacher.type === 'hunter' ? t('hunter') : t('fast');
        ctx.strokeText(label, 0, -TEACHER_SIZE / 2 - 5);
        ctx.fillText(label, 0, -TEACHER_SIZE / 2 - 5);

        ctx.restore();
    }
}

function drawPlayer() {
    const time = Date.now() / 1000;

    // Get current avatar configuration
    const avatar = AVATAR_TYPES.find(a => a.id === settings.playerAvatar) || AVATAR_TYPES[0];

    ctx.save();
    ctx.translate(player.x, player.y);

    // Invincibility effect
    if (player.invincible) {
        ctx.globalAlpha = 0.5 + Math.sin(time * 10) * 0.3;
        // Shield effect
        ctx.strokeStyle = '#4ade80';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, 0, PLAYER_SIZE / 2 + 5, 0, Math.PI * 2);
        ctx.stroke();
    }

    // Speed effect
    if (player.speedBoost) {
        ctx.strokeStyle = '#fbbf24';
        ctx.lineWidth = 2;
        for (let i = 0; i < 3; i++) {
            ctx.globalAlpha = 0.3 - i * 0.1;
            ctx.beginPath();
            ctx.arc(-player.vx * (i + 1) * 2, -player.vy * (i + 1) * 2, PLAYER_SIZE / 2 - i * 2, 0, Math.PI * 2);
            ctx.stroke();
        }
        ctx.globalAlpha = 1;
    }

    // Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.beginPath();
    ctx.ellipse(0, PLAYER_SIZE / 2 - 3, PLAYER_SIZE / 2, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    // Player body - use avatar color
    ctx.fillStyle = avatar.bodyColor;
    ctx.beginPath();
    ctx.arc(0, 0, PLAYER_SIZE / 2, 0, Math.PI * 2);
    ctx.fill();

    // Backpack - use avatar backpack color
    ctx.fillStyle = avatar.backpackColor;
    ctx.fillRect(-PLAYER_SIZE / 2 - 3, -5, 6, 14);

    // Face
    const dirAngles = [0, Math.PI / 2, Math.PI, -Math.PI / 2];
    const faceAngle = dirAngles[player.direction];

    // Draw accessory before face (some accessories go behind)
    drawPlayerAccessory(avatar.accessory, faceAngle, 'behind');

    // Eyes
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(Math.cos(faceAngle) * 3 - 4, -2, 4, 0, Math.PI * 2);
    ctx.arc(Math.cos(faceAngle) * 3 + 4, -2, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#333';
    ctx.beginPath();
    ctx.arc(Math.cos(faceAngle) * 5 - 4, -2, 2, 0, Math.PI * 2);
    ctx.arc(Math.cos(faceAngle) * 5 + 4, -2, 2, 0, Math.PI * 2);
    ctx.fill();

    // Smile - goth has a frown
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.beginPath();
    if (avatar.id === 'goth') {
        ctx.arc(0, 8, 5, Math.PI + 0.2, -0.2);
    } else {
        ctx.arc(0, 2, 5, 0.2, Math.PI - 0.2);
    }
    ctx.stroke();

    // Draw accessory on top of face
    drawPlayerAccessory(avatar.accessory, faceAngle, 'front');

    ctx.restore();
}

function drawPlayerAccessory(accessory, faceAngle, layer) {
    if (!accessory) return;

    switch (accessory) {
        case 'glasses':
            if (layer === 'front') {
                // Nerd glasses
                ctx.strokeStyle = '#333';
                ctx.lineWidth = 2;
                // Left lens
                ctx.beginPath();
                ctx.arc(-4, -2, 5, 0, Math.PI * 2);
                ctx.stroke();
                // Right lens
                ctx.beginPath();
                ctx.arc(4, -2, 5, 0, Math.PI * 2);
                ctx.stroke();
                // Bridge
                ctx.beginPath();
                ctx.moveTo(-1, -2);
                ctx.lineTo(1, -2);
                ctx.stroke();
            }
            break;

        case 'headband':
            if (layer === 'front') {
                // Jock headband
                ctx.fillStyle = '#fff';
                ctx.fillRect(-PLAYER_SIZE / 2, -PLAYER_SIZE / 2 + 2, PLAYER_SIZE, 4);
                ctx.strokeStyle = '#ef4444';
                ctx.lineWidth = 1;
                ctx.strokeRect(-PLAYER_SIZE / 2, -PLAYER_SIZE / 2 + 2, PLAYER_SIZE, 4);
            }
            break;

        case 'spikes':
            if (layer === 'behind') {
                // Goth spikes (studded collar effect on top)
                ctx.fillStyle = '#9ca3af';
                for (let i = -2; i <= 2; i++) {
                    ctx.beginPath();
                    ctx.moveTo(i * 5, -PLAYER_SIZE / 2 - 2);
                    ctx.lineTo(i * 5 - 3, -PLAYER_SIZE / 2 + 4);
                    ctx.lineTo(i * 5 + 3, -PLAYER_SIZE / 2 + 4);
                    ctx.closePath();
                    ctx.fill();
                }
            }
            break;

        case 'beret':
            if (layer === 'front') {
                // Artist beret
                ctx.fillStyle = '#be185d';
                ctx.beginPath();
                ctx.ellipse(0, -PLAYER_SIZE / 2 + 2, PLAYER_SIZE / 2 + 3, 5, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.beginPath();
                ctx.arc(0, -PLAYER_SIZE / 2, 3, 0, Math.PI * 2);
                ctx.fill();
            }
            break;

        case 'cap':
            if (layer === 'front') {
                // Skater cap (backwards)
                ctx.fillStyle = '#0d9488';
                // Cap body
                ctx.beginPath();
                ctx.arc(0, -PLAYER_SIZE / 2 + 4, PLAYER_SIZE / 2, Math.PI, 0);
                ctx.fill();
                // Brim (backwards)
                ctx.fillStyle = '#115e59';
                ctx.fillRect(-4, -PLAYER_SIZE / 2 + 4, 8, 4);
            }
            break;

        case 'bowtie':
            if (layer === 'front') {
                // Preppy bowtie
                ctx.fillStyle = '#7c3aed';
                // Left wing
                ctx.beginPath();
                ctx.moveTo(0, PLAYER_SIZE / 2 - 6);
                ctx.lineTo(-8, PLAYER_SIZE / 2 - 10);
                ctx.lineTo(-8, PLAYER_SIZE / 2 - 2);
                ctx.closePath();
                ctx.fill();
                // Right wing
                ctx.beginPath();
                ctx.moveTo(0, PLAYER_SIZE / 2 - 6);
                ctx.lineTo(8, PLAYER_SIZE / 2 - 10);
                ctx.lineTo(8, PLAYER_SIZE / 2 - 2);
                ctx.closePath();
                ctx.fill();
                // Center knot
                ctx.fillStyle = '#5b21b6';
                ctx.beginPath();
                ctx.arc(0, PLAYER_SIZE / 2 - 6, 3, 0, Math.PI * 2);
                ctx.fill();
            }
            break;

        case 'mohawk':
            if (layer === 'behind') {
                // Punk mohawk
                ctx.fillStyle = '#84cc16';
                for (let i = 0; i < 5; i++) {
                    ctx.beginPath();
                    ctx.moveTo(-6 + i * 3, -PLAYER_SIZE / 2);
                    ctx.lineTo(-4 + i * 3, -PLAYER_SIZE / 2 - 10 - Math.sin(i) * 3);
                    ctx.lineTo(-2 + i * 3, -PLAYER_SIZE / 2);
                    ctx.closePath();
                    ctx.fill();
                }
            }
            break;
    }
}

function drawParticles() {
    for (const p of gameState.particles) {
        if (p.isText) {
            ctx.globalAlpha = p.life;
            ctx.fillStyle = '#ffd700';
            ctx.font = 'bold 16px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(p.text, p.x, p.y);
            ctx.globalAlpha = 1;
        } else {
            ctx.globalAlpha = p.life;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
        }
    }
}

function drawMinimap() {
    minimapCtx.fillStyle = '#1a1a2e';
    minimapCtx.fillRect(0, 0, minimapCanvas.width, minimapCanvas.height);

    const scaleX = minimapCanvas.width / (gameState.mapWidth * TILE_SIZE);
    const scaleY = minimapCanvas.height / (gameState.mapHeight * TILE_SIZE);

    // Draw map tiles
    for (let y = 0; y < gameState.mapHeight; y++) {
        for (let x = 0; x < gameState.mapWidth; x++) {
            const tile = gameState.map[y][x];
            const px = x * TILE_SIZE * scaleX;
            const py = y * TILE_SIZE * scaleY;
            const w = TILE_SIZE * scaleX;
            const h = TILE_SIZE * scaleY;

            if (tile === TILES.WALL) {
                minimapCtx.fillStyle = '#5c4033';
            } else if (tile === TILES.EXIT) {
                minimapCtx.fillStyle = '#4ade80';
            } else {
                minimapCtx.fillStyle = '#3d3d5c';
            }
            minimapCtx.fillRect(px, py, w, h);
        }
    }

    // Draw collectibles
    minimapCtx.fillStyle = '#ffd700';
    for (const item of gameState.collectibles) {
        if (!item.collected) {
            minimapCtx.beginPath();
            minimapCtx.arc(item.x * scaleX, item.y * scaleY, 2, 0, Math.PI * 2);
            minimapCtx.fill();
        }
    }

    // Draw teachers
    minimapCtx.fillStyle = '#ff6b6b';
    for (const teacher of teachers) {
        minimapCtx.beginPath();
        minimapCtx.arc(teacher.x * scaleX, teacher.y * scaleY, 3, 0, Math.PI * 2);
        minimapCtx.fill();
    }

    // Draw player
    minimapCtx.fillStyle = '#60a5fa';
    minimapCtx.beginPath();
    minimapCtx.arc(player.x * scaleX, player.y * scaleY, 4, 0, Math.PI * 2);
    minimapCtx.fill();

    // Draw viewport (use base dimensions for correct viewport rectangle)
    minimapCtx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    minimapCtx.lineWidth = 1;
    minimapCtx.strokeRect(
        gameState.camera.x * scaleX,
        gameState.camera.y * scaleY,
        BASE_WIDTH * scaleX,
        BASE_HEIGHT * scaleY
    );
}

function drawEventEntities(ctx) {
    eventEntities.forEach(entity => {
        const screenX = entity.x - gameState.camera.x;
        const screenY = entity.y - gameState.camera.y;

        switch (entity.type) {
            case 'ufo':
                // Draw UFO
                ctx.save();
                ctx.translate(screenX, screenY);

                // UFO body
                ctx.fillStyle = '#888';
                ctx.beginPath();
                ctx.ellipse(0, 0, 40, 15, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#4af';
                ctx.beginPath();
                ctx.ellipse(0, -8, 20, 12, 0, 0, Math.PI * 2);
                ctx.fill();

                // Beam
                if (entity.beamActive) {
                    ctx.fillStyle = 'rgba(100, 255, 100, 0.3)';
                    ctx.beginPath();
                    ctx.moveTo(-30, 15);
                    ctx.lineTo(30, 15);
                    ctx.lineTo(60, 200);
                    ctx.lineTo(-60, 200);
                    ctx.closePath();
                    ctx.fill();
                }
                ctx.restore();
                break;

            case 'dinosaur':
                ctx.save();
                ctx.translate(screenX, screenY);
                ctx.font = entity.variant === 'trex' ? '48px Arial' : '36px Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(entity.variant === 'trex' ? '🦖' : '🦕', 0, 0);
                ctx.restore();
                break;

            case 'parent':
                ctx.save();
                ctx.translate(screenX, screenY);
                ctx.font = '32px Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('👨‍👩‍👧', 0, 0);
                ctx.restore();
                break;

            case 'principal':
                const dispX = (entity.displayX || entity.x) - gameState.camera.x;
                const dispY = (entity.displayY || entity.y) - gameState.camera.y;
                ctx.save();
                ctx.translate(dispX, dispY);
                ctx.font = '36px Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('🎩', 0, -15);
                ctx.fillText('👔', 0, 10);
                ctx.restore();
                break;

            case 'ghost':
                ctx.save();
                ctx.globalAlpha = entity.alpha || 0.7;
                ctx.translate(screenX, screenY);
                ctx.font = '40px Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('👻', 0, 0);
                ctx.restore();
                break;

            case 'food':
                ctx.save();
                ctx.translate(screenX, screenY);
                ctx.font = '24px Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(entity.foodType, 0, 0);
                ctx.restore();
                break;

            case 'pizza':
                ctx.save();
                ctx.translate(screenX, screenY);
                ctx.font = '36px Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('🛵', 0, -10);
                ctx.fillText('🍕', 15, 5);
                ctx.restore();
                break;
        }
    });

    // Draw power outage effect
    if (gameState.powerOutage) {
        ctx.save();
        // Dark overlay with flashlight effect around player
        const playerScreenX = player.x - gameState.camera.x;
        const playerScreenY = player.y - gameState.camera.y;

        ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
        ctx.fillRect(0, 0, BASE_WIDTH, BASE_HEIGHT);

        // Flashlight circle
        ctx.globalCompositeOperation = 'destination-out';
        const gradient = ctx.createRadialGradient(playerScreenX, playerScreenY, 0, playerScreenX, playerScreenY, 120);
        gradient.addColorStop(0, 'rgba(0, 0, 0, 1)');
        gradient.addColorStop(0.7, 'rgba(0, 0, 0, 0.8)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(playerScreenX, playerScreenY, 120, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    // Draw time freeze effect
    if (gameState.timeFreeze) {
        ctx.save();
        ctx.fillStyle = 'rgba(100, 150, 255, 0.2)';
        ctx.fillRect(0, 0, BASE_WIDTH, BASE_HEIGHT);
        ctx.restore();
    }

    // Draw fire drill effect (flashing red)
    if (gameState.fireDrillActive && Math.floor(Date.now() / 200) % 2 === 0) {
        ctx.save();
        ctx.fillStyle = 'rgba(255, 0, 0, 0.1)';
        ctx.fillRect(0, 0, BASE_WIDTH, BASE_HEIGHT);
        ctx.restore();
    }

    // Draw current event indicator
    if (currentEvent) {
        ctx.save();
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(BASE_WIDTH / 2 - 80, 10, 160, 30);
        ctx.fillStyle = '#fff';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`${currentEvent.icon} ${Math.ceil(eventTimer)}s`, BASE_WIDTH / 2, 30);
        ctx.restore();
    }
}

// ============================================
// GAME LOOP & INITIALIZATION
// ============================================

let lastTime = 0;

function gameLoop(timestamp) {
    const deltaTime = (timestamp - lastTime) / 1000;
    lastTime = timestamp;

    update(Math.min(deltaTime, 0.1));

    requestAnimationFrame(gameLoop);
}

function startGame() {
    // Reset game state
    gameState = {
        running: true,
        paused: false,
        score: 0,
        combo: 1,
        comboTimer: 0,
        lives: 3,
        level: 1,
        map: [],
        mapWidth: 0,
        mapHeight: 0,
        collectibles: [],
        powerups: [],
        activePowerups: [],
        playerPowerups: [null, null, null],
        particles: [],
        screenShake: 0,
        camera: { x: 0, y: 0 },
        reportedPlayerLocation: null
    };

    // Reset player
    player = {
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        speed: 4,
        dashCooldown: 0,
        isDashing: false,
        dashTimer: 0,
        invincible: false,
        invincibleTimer: 0,
        speedBoost: false,
        speedBoostTimer: 0,
        direction: 0,
        animFrame: 0,
        superhero: false,
        canFly: false
    };

    // Reset events
    currentEvent = null;
    eventTimer = 0;
    nextEventTime = 15;
    eventEntities = [];

    // Generate map
    generateMap();

    // Update UI
    updateUI();
    hideAllMenus();

    // Initialize audio and start music
    initAudio();
    startMusic();

    // Start game
    gameState.running = true;
    showMessage(t('escape'));
    playSound('menu_click');

    // Show mobile controls if on touch device
    if (mobileInput.isTouchDevice) {
        showMobileControls();
    }
}

// ============================================
// MOBILE CONTROLS
// ============================================

function initMobileControls() {
    // Detect touch device
    mobileInput.isTouchDevice = ('ontouchstart' in window) ||
                                 (navigator.maxTouchPoints > 0) ||
                                 (navigator.msMaxTouchPoints > 0);

    // Get DOM elements
    const joystickContainer = document.getElementById('joystick-container');
    const joystickBase = document.getElementById('joystick-base');
    const joystickKnob = document.getElementById('joystick-knob');
    const dashBtn = document.getElementById('mobile-dash-btn');
    const powerupBtn = document.getElementById('mobile-powerup-btn');
    const pauseBtn = document.getElementById('mobile-pause-btn');
    const mobileControls = document.getElementById('mobile-controls');

    if (!joystickBase || !mobileControls) return;

    // Joystick state
    let joystickActive = false;
    let joystickTouchId = null;
    const baseRadius = 60; // Half of joystick base size
    const knobRadius = 25; // Half of knob size
    const maxDistance = baseRadius - knobRadius;

    // Get center of joystick base
    function getJoystickCenter() {
        const rect = joystickBase.getBoundingClientRect();
        return {
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height / 2
        };
    }

    // Handle joystick touch start
    function handleJoystickStart(e) {
        e.preventDefault();
        const touch = e.changedTouches[0];
        joystickTouchId = touch.identifier;
        joystickActive = true;
        mobileInput.active = true;
        joystickKnob.classList.add('active');
        handleJoystickMove(e);
    }

    // Handle joystick touch move
    function handleJoystickMove(e) {
        if (!joystickActive) return;
        e.preventDefault();

        let touch = null;
        for (let i = 0; i < e.touches.length; i++) {
            if (e.touches[i].identifier === joystickTouchId) {
                touch = e.touches[i];
                break;
            }
        }
        if (!touch) return;

        const center = getJoystickCenter();
        let deltaX = touch.clientX - center.x;
        let deltaY = touch.clientY - center.y;

        // Calculate distance from center
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

        // Clamp to max distance
        if (distance > maxDistance) {
            deltaX = (deltaX / distance) * maxDistance;
            deltaY = (deltaY / distance) * maxDistance;
        }

        // Update knob position
        joystickKnob.style.transform = `translate(${deltaX}px, ${deltaY}px)`;

        // Normalize to -1 to 1 range
        mobileInput.joystick.x = deltaX / maxDistance;
        mobileInput.joystick.y = deltaY / maxDistance;
    }

    // Handle joystick touch end
    function handleJoystickEnd(e) {
        for (let i = 0; i < e.changedTouches.length; i++) {
            if (e.changedTouches[i].identifier === joystickTouchId) {
                joystickActive = false;
                joystickTouchId = null;
                joystickKnob.classList.remove('active');
                joystickKnob.style.transform = 'translate(0, 0)';
                mobileInput.joystick.x = 0;
                mobileInput.joystick.y = 0;
                break;
            }
        }
    }

    // Joystick touch events
    joystickContainer.addEventListener('touchstart', handleJoystickStart, { passive: false });
    document.addEventListener('touchmove', handleJoystickMove, { passive: false });
    document.addEventListener('touchend', handleJoystickEnd, { passive: false });
    document.addEventListener('touchcancel', handleJoystickEnd, { passive: false });

    // Dash button
    if (dashBtn) {
        dashBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            if (gameState.running && !gameState.paused) {
                if (player.dashCooldown <= 0 && !player.isDashing) {
                    player.isDashing = true;
                    player.dashTimer = 0.2;
                    player.dashCooldown = 1;
                    gameState.screenShake = 3;
                    playSound('dash');
                }
            }
        }, { passive: false });
    }

    // Power-up button - cycles through and uses first available powerup
    if (powerupBtn) {
        powerupBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            if (gameState.running && !gameState.paused) {
                // Find first available powerup
                for (let i = 0; i < gameState.playerPowerups.length; i++) {
                    if (gameState.playerPowerups[i]) {
                        usePowerup(gameState.playerPowerups[i]);
                        gameState.playerPowerups[i] = null;
                        updateUI();
                        updateMobilePowerupButton();
                        break;
                    }
                }
            }
        }, { passive: false });
    }

    // Pause button
    if (pauseBtn) {
        pauseBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            if (gameState.running) {
                gameState.paused = !gameState.paused;
                if (gameState.paused) {
                    stopMusic();
                    playSound('menu_click');
                    showMenu('pause-screen');
                    hideMobileControls();
                } else {
                    playSound('menu_click');
                    startMusic();
                    hideAllMenus();
                    showMobileControls();
                }
            }
        }, { passive: false });
    }

    // Prevent default touch behavior on controls to avoid scrolling
    mobileControls.addEventListener('touchmove', (e) => {
        e.preventDefault();
    }, { passive: false });
}

function showMobileControls() {
    const mobileControls = document.getElementById('mobile-controls');
    if (mobileControls && mobileInput.isTouchDevice && gameState.running) {
        mobileControls.classList.remove('hidden');
        updateMobilePowerupButton();
    }
}

function hideMobileControls() {
    const mobileControls = document.getElementById('mobile-controls');
    if (mobileControls) {
        mobileControls.classList.add('hidden');
    }
}

function updateMobilePowerupButton() {
    const powerupBtn = document.getElementById('mobile-powerup-btn');
    const powerupIcon = document.getElementById('mobile-powerup-icon');
    if (!powerupBtn || !powerupIcon) return;

    // Find first available powerup
    let hasPowerup = false;
    let powerupType = null;
    for (let i = 0; i < gameState.playerPowerups.length; i++) {
        if (gameState.playerPowerups[i]) {
            hasPowerup = true;
            powerupType = gameState.playerPowerups[i];
            break;
        }
    }

    if (hasPowerup) {
        powerupBtn.classList.add('has-powerup');
        powerupBtn.classList.remove('empty');
        // Set icon based on powerup type
        const icons = {
            'hallpass': '📜',
            'energydrink': '⚡',
            'stinkbomb': '💨',
            'skateboard': '🛹'
        };
        powerupIcon.textContent = icons[powerupType] || '🎒';
    } else {
        powerupBtn.classList.remove('has-powerup');
        powerupBtn.classList.add('empty');
        powerupIcon.textContent = '🎒';
    }
}

function updateMobileDashButton() {
    const dashBtn = document.getElementById('mobile-dash-btn');
    if (!dashBtn) return;

    if (player.dashCooldown > 0) {
        dashBtn.classList.add('cooldown');
    } else {
        dashBtn.classList.remove('cooldown');
    }
}

function init() {
    // Settings controls
    document.getElementById('teacher-count').addEventListener('input', (e) => {
        settings.teacherCount = parseInt(e.target.value);
        document.getElementById('teacher-count-display').textContent = settings.teacherCount;
    });

    document.getElementById('school-type').addEventListener('change', (e) => {
        settings.schoolType = e.target.value;
    });

    document.getElementById('map-size').addEventListener('change', (e) => {
        settings.mapSize = e.target.value;
    });

    document.getElementById('map-topology').addEventListener('change', (e) => {
        settings.mapTopology = e.target.value;
    });

    document.getElementById('corridor-density').addEventListener('change', (e) => {
        settings.corridorDensity = e.target.value;
    });

    document.getElementById('room-density').addEventListener('change', (e) => {
        settings.roomDensity = e.target.value;
    });

    // Menu buttons
    document.getElementById('start-button').addEventListener('click', () => {
        initAudio();
        playSound('menu_click');
        startGame();
    });
    document.getElementById('how-to-play-button').addEventListener('click', () => {
        initAudio();
        playSound('menu_click');
        showMenu('how-to-play-screen');
    });
    document.getElementById('back-to-menu-button').addEventListener('click', () => {
        playSound('menu_click');
        showMenu('main-menu');
    });
    document.getElementById('resume-button').addEventListener('click', () => {
        playSound('menu_click');
        gameState.paused = false;
        hideAllMenus();
        startMusic();
        showMobileControls();
    });
    document.getElementById('quit-button').addEventListener('click', () => {
        playSound('menu_click');
        stopMusic();
        gameState.running = false;
        showMenu('main-menu');
    });
    document.getElementById('retry-button').addEventListener('click', () => {
        playSound('menu_click');
        startGame();
    });
    document.getElementById('menu-button').addEventListener('click', () => {
        playSound('menu_click');
        showMenu('main-menu');
    });

    // Campaign mode button
    document.getElementById('campaign-button').addEventListener('click', () => {
        playSound('menu_click');
        gameMode = 'campaign';
        document.getElementById('campaign-progress-display').style.display = 'block';
        document.getElementById('freeplay-settings').style.display = 'none';
        document.getElementById('start-button').style.display = 'block';
        document.getElementById('campaign-button').style.opacity = '1';
        document.getElementById('freeplay-button').style.opacity = '0.5';
        document.getElementById('multiplayer-button').style.opacity = '0.5';
        updateCampaignProgress();
    });

    // Free play mode button
    document.getElementById('freeplay-button').addEventListener('click', () => {
        playSound('menu_click');
        gameMode = 'freeplay';
        document.getElementById('campaign-progress-display').style.display = 'none';
        document.getElementById('freeplay-settings').style.display = 'block';
        document.getElementById('start-button').style.display = 'block';
        document.getElementById('campaign-button').style.opacity = '0.5';
        document.getElementById('freeplay-button').style.opacity = '1';
        document.getElementById('multiplayer-button').style.opacity = '0.5';
    });

    // Multiplayer button
    document.getElementById('multiplayer-button').addEventListener('click', () => {
        playSound('menu_click');
        document.getElementById('campaign-progress-display').style.display = 'none';
        document.getElementById('freeplay-settings').style.display = 'none';
        document.getElementById('start-button').style.display = 'none';
        document.getElementById('campaign-button').style.opacity = '0.5';
        document.getElementById('freeplay-button').style.opacity = '0.5';
        document.getElementById('multiplayer-button').style.opacity = '1';
        showMenu('multiplayer-menu-screen');
    });

    // Multiplayer - Create Room
    document.getElementById('create-room-button').addEventListener('click', () => {
        playSound('menu_click');
        showMenu('create-room-screen');
        createMultiplayerRoom();
    });

    // Multiplayer - Join Room button
    document.getElementById('join-room-button').addEventListener('click', () => {
        playSound('menu_click');
        showMenu('join-room-screen');
    });

    // Multiplayer - Back from menu
    document.getElementById('mp-back-to-menu').addEventListener('click', () => {
        playSound('menu_click');
        showMenu('main-menu');
    });

    // Multiplayer - Start game (host)
    document.getElementById('mp-start-game').addEventListener('click', () => {
        playSound('menu_click');
        hostStartGame();
    });

    // Multiplayer - Cancel hosting
    document.getElementById('mp-cancel-host').addEventListener('click', () => {
        playSound('menu_click');
        leaveMultiplayerRoom();
        showMenu('multiplayer-menu-screen');
    });

    // Multiplayer - Join room submit
    document.getElementById('mp-join-room').addEventListener('click', () => {
        playSound('menu_click');
        const code = document.getElementById('join-room-code').value.trim();
        if (code.length === 3) {
            joinMultiplayerRoom(code);
        }
    });

    // Multiplayer - Cancel join
    document.getElementById('mp-cancel-join').addEventListener('click', () => {
        playSound('menu_click');
        leaveMultiplayerRoom();
        showMenu('multiplayer-menu-screen');
    });

    // Multiplayer - Leave lobby
    document.getElementById('mp-leave-lobby').addEventListener('click', () => {
        playSound('menu_click');
        leaveMultiplayerRoom();
        showMenu('multiplayer-menu-screen');
    });

    // Multiplayer - Teacher count display
    document.getElementById('mp-teacher-count').addEventListener('input', (e) => {
        document.getElementById('mp-teacher-count-display').textContent = e.target.value;
    });

    // Next level button
    document.getElementById('next-level-button').addEventListener('click', () => {
        playSound('menu_click');
        currentLevel++;
        if (currentLevel >= LEVELS.length) {
            showGraduationScreen();
        } else {
            hideAllMenus();
            startGame();
        }
    });

    // Level complete - main menu button
    document.getElementById('level-menu-button').addEventListener('click', () => {
        playSound('menu_click');
        saveCampaignProgress();
        showMenu('main-menu');
    });

    // Graduation - new game button
    document.getElementById('new-game-button').addEventListener('click', () => {
        playSound('menu_click');
        currentLevel = 0;
        totalCampaignScore = 0;
        saveCampaignProgress();
        hideAllMenus();
        startGame();
    });

    // Graduation - main menu button
    document.getElementById('graduation-menu-button').addEventListener('click', () => {
        playSound('menu_click');
        showMenu('main-menu');
    });

    // Load campaign progress on init
    loadCampaignProgress();

    // Load saved avatar
    const savedAvatar = localStorage.getItem('schoolEscape_playerAvatar');
    if (savedAvatar && AVATAR_TYPES.find(a => a.id === savedAvatar)) {
        settings.playerAvatar = savedAvatar;
        document.getElementById('avatar-select').value = savedAvatar;
    }
    updateAvatarPreview();

    // Keyboard input
    document.addEventListener('keydown', (e) => {
        keys[e.code] = true;

        // Dash
        if (e.code === 'Space' && gameState.running && !gameState.paused) {
            if (player.dashCooldown <= 0 && !player.isDashing) {
                player.isDashing = true;
                player.dashTimer = 0.2;
                player.dashCooldown = 1;
                gameState.screenShake = 3;
                playSound('dash');
            }
            e.preventDefault();
        }

        // Pause
        if (e.code === 'Escape') {
            if (gameState.running) {
                gameState.paused = !gameState.paused;
                if (gameState.paused) {
                    stopMusic();
                    playSound('menu_click');
                    showMenu('pause-screen');
                } else {
                    playSound('menu_click');
                    startMusic();
                    hideAllMenus();
                }
            }
        }

        // Use powerups (1, 2, 3 or T, Y, U)
        const powerupKeyMap = {
            'Digit1': 0, 'Digit2': 1, 'Digit3': 2,
            'KeyT': 0, 'KeyY': 1, 'KeyU': 2
        };
        if (e.code in powerupKeyMap) {
            const slot = powerupKeyMap[e.code];
            if (gameState.playerPowerups[slot]) {
                usePowerup(gameState.playerPowerups[slot]);
                gameState.playerPowerups[slot] = null;
                updateUI();
            }
        }
    });

    document.addEventListener('keyup', (e) => {
        keys[e.code] = false;
    });

    // Initialize mobile controls
    initMobileControls();

    // Initialize language
    updateLanguage();

    // Initialize responsive canvas
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    window.addEventListener('orientationchange', () => {
        // Delay resize on orientation change to get correct dimensions
        setTimeout(resizeCanvas, 100);
    });

    // Start loops
    render();
    requestAnimationFrame(gameLoop);
}

// Start when page loads
window.addEventListener('load', init);

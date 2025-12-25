/*
 * School Escape - Multiplayer System (Liveblocks)
 * Copyright (c) 2025 Ilja Livenson and Mark Livenson
 */

// ============================================
// MULTIPLAYER SYSTEM (Liveblocks)
// ============================================

// Multiplayer state
let mpState = {
    active: false,
    isHost: false,
    roomCode: null,
    room: null,
    leaveRoom: null,
    myConnectionId: null,
    hostConnectionId: null,
    playerName: 'Player',
    playerColor: '#ff6b6b',
    otherPlayers: new Map(), // connectionId -> player data
    mapSeed: null,
    gameSettings: { mapSize: 'medium', teacherCount: 4 },
    lastPresenceUpdate: 0
};

// Player colors for multiplayer
const PLAYER_COLORS = [
    '#ff6b6b', '#4ade80', '#60a5fa', '#fbbf24',
    '#a78bfa', '#f472b6', '#34d399', '#fb923c'
];

// Avatar types for player customization
const AVATAR_TYPES = [
    { id: 'default', bodyColor: '#60a5fa', backpackColor: '#f97316', accessory: null },
    { id: 'nerd', bodyColor: '#a78bfa', backpackColor: '#6366f1', accessory: 'glasses' },
    { id: 'jock', bodyColor: '#ef4444', backpackColor: '#dc2626', accessory: 'headband' },
    { id: 'goth', bodyColor: '#1f2937', backpackColor: '#4b5563', accessory: 'spikes' },
    { id: 'artist', bodyColor: '#ec4899', backpackColor: '#be185d', accessory: 'beret' },
    { id: 'skater', bodyColor: '#14b8a6', backpackColor: '#0d9488', accessory: 'cap' },
    { id: 'preppy', bodyColor: '#fbbf24', backpackColor: '#d97706', accessory: 'bowtie' },
    { id: 'punk', bodyColor: '#84cc16', backpackColor: '#65a30d', accessory: 'mohawk' }
];

// Liveblocks client
let liveblocksClient = null;
let liveblocksModule = null;
let liveblocksLoading = null;

// Initialize Liveblocks client (async - loads module from CDN)
async function initLiveblocks() {
    if (liveblocksClient) return true;

    // If already loading, wait for it
    if (liveblocksLoading) {
        return liveblocksLoading;
    }

    liveblocksLoading = (async () => {
        try {
            // Dynamically import Liveblocks from esm.sh CDN
            liveblocksModule = await import('https://esm.sh/@liveblocks/client@2.15.0');

            liveblocksClient = liveblocksModule.createClient({
                publicApiKey: "pk_dev_7IfGTE86kE-WZ2BCeeK1dG0dNKHgPkbZsiCN0tOGMEiByC_gNuubIGBWxl4UCJsx",
            });
            console.log('Liveblocks client initialized');
            return true;
        } catch (e) {
            console.error('Failed to initialize Liveblocks:', e);
            liveblocksLoading = null;
            return false;
        }
    })();

    return liveblocksLoading;
}

// Generate a random room code
function generateRoomCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 3; i++) {
        code += chars[Math.floor(Math.random() * chars.length)];
    }
    return code;
}

// Generate a random funny player name based on current language
function generatePlayerName() {
    const funnyNames = {
        en: {
            adjectives: ['Homework-Eating', 'Chalk-Dusted', 'Detention-Dodging', 'Cafeteria-Lurking', 'Tardy', 'Sleepy', 'Snack-Hoarding', 'Doodling', 'Note-Passing', 'Backpack-Dragging'],
            nouns: ['Troublemaker', 'Prankster', 'Napper', 'Daydreamer', 'Scribbler', 'Snacker', 'Wanderer', 'Doodler', 'Whisperer', 'Yawner']
        },
        et: {
            adjectives: ['Kodutöö-Sööv', 'Kriidine', 'Hilinev', 'Unine', 'Näksiv', 'Joonistav', 'Sosistav', 'Haigutav', 'Sohisev', 'Pabistav'],
            nouns: ['Pahandustegija', 'Naljahambas', 'Uinuja', 'Unistaja', 'Kritseldaja', 'Näksija', 'Uitaja', 'Sosistaja', 'Haigutaja', 'Pomiseja']
        },
        lv: {
            adjectives: ['Mājasdarbu-Ēdošs', 'Krītains', 'Kavējošs', 'Miegains', 'Uzkodas-Krājošs', 'Zīmējošs', 'Čukstošs', 'Žāvājošs', 'Sapņojošs', 'Slinkojošs'],
            nouns: ['Nerātnis', 'Jokdaris', 'Snaudējs', 'Sapņotājs', 'Skricelētājs', 'Našķotājs', 'Klaiņotājs', 'Čukstētājs', 'Žāvātājs', 'Murmulētājs']
        },
        lt: {
            adjectives: ['Namų-Darbų-Valgantis', 'Kreidos', 'Vėluojantis', 'Mieguistas', 'Užkandžių-Kaupiantis', 'Piešiantis', 'Šnibždantis', 'Žiovuojantis', 'Svajojantis', 'Tingintis'],
            nouns: ['Išdykėlis', 'Pokštininkas', 'Snūduriuotojas', 'Svajotojas', 'Raižytojas', 'Užkandžiautojas', 'Bastūnas', 'Šnibždėtojas', 'Žiovuliukas', 'Murmėtojas']
        },
        ru: {
            adjectives: ['Домашку-Жующий', 'Мелом-Испачканный', 'Вечно-Опаздывающий', 'Сонный', 'Снеки-Прячущий', 'Рисующий', 'Шепчущий', 'Зевающий', 'Мечтающий', 'Ленивый'],
            nouns: ['Хулиган', 'Шутник', 'Соня', 'Мечтатель', 'Каракулист', 'Обжора', 'Бродяга', 'Шептун', 'Зевака', 'Бормотун']
        }
    };

    const lang = settings.language || 'en';
    const names = funnyNames[lang] || funnyNames.en;
    const adjective = names.adjectives[Math.floor(Math.random() * names.adjectives.length)];
    const noun = names.nouns[Math.floor(Math.random() * names.nouns.length)];

    // For languages with compound adjectives (hyphenated), use space; otherwise concatenate
    if (adjective.includes('-') || lang !== 'en') {
        return adjective + ' ' + noun;
    }
    return adjective + noun;
}

// Create a multiplayer room (host)
async function createMultiplayerRoom() {
    updateConnectionStatus('mp-connection-status', 'connecting', t('connecting'));

    const success = await initLiveblocks();
    if (!success || !liveblocksClient) {
        updateConnectionStatus('mp-connection-status', 'error', t('connectionError'));
        return;
    }

    mpState.roomCode = generateRoomCode();
    mpState.isHost = true;
    mpState.playerName = generatePlayerName();
    mpState.playerColor = PLAYER_COLORS[0];
    mpState.mapSeed = Math.floor(Math.random() * 1000000);

    document.getElementById('host-room-code').textContent = mpState.roomCode;
    updateConnectionStatus('mp-connection-status', 'connecting', t('connecting'));

    try {
        const roomId = `school-escape-${mpState.roomCode.toLowerCase()}`;
        const { room, leave } = liveblocksClient.enterRoom(roomId, {
            initialPresence: {
                name: mpState.playerName,
                color: mpState.playerColor,
                x: 0, y: 0,
                vx: 0, vy: 0,
                direction: 0,
                isDashing: false,
                invincible: false,
                lives: 3,
                isAlive: true,
                isHost: true,
                ready: false
            }
        });

        mpState.room = room;
        mpState.leaveRoom = leave;

        // Wait for connection
        room.subscribe('status', (status) => {
            console.log('Room status:', status);
            if (status === 'connected') {
                const self = room.getSelf();
                mpState.myConnectionId = self?.connectionId;
                mpState.hostConnectionId = self?.connectionId;
                updateConnectionStatus('mp-connection-status', 'connected', t('connected'));
                updateHostPlayerList();
            } else if (status === 'reconnecting') {
                updateConnectionStatus('mp-connection-status', 'connecting', t('connecting'));
            }
        });

        // Subscribe to others joining/leaving
        room.subscribe('others', (others, event) => {
            console.log('Others update:', others.length, event);
            updateHostPlayerList();

            if (event?.type === 'enter') {
                playSound('collect');
            } else if (event?.type === 'leave') {
                playSound('menu_click');
            }
        });

        // Subscribe to broadcast events
        room.subscribe('event', handleMultiplayerEvent);

        mpState.active = true;

    } catch (e) {
        console.error('Failed to create room:', e);
        updateConnectionStatus('mp-connection-status', 'error', t('connectionError'));
    }
}

// Join a multiplayer room
async function joinMultiplayerRoom(code) {
    updateConnectionStatus('join-connection-status', 'connecting', t('connecting'));

    const success = await initLiveblocks();
    if (!success || !liveblocksClient) {
        updateConnectionStatus('join-connection-status', 'error', t('connectionError'));
        return false;
    }

    mpState.roomCode = code.toUpperCase();
    mpState.isHost = false;
    mpState.playerName = generatePlayerName();
    mpState.playerColor = PLAYER_COLORS[Math.floor(Math.random() * PLAYER_COLORS.length)];

    try {
        const roomId = `school-escape-${mpState.roomCode.toLowerCase()}`;
        const { room, leave } = liveblocksClient.enterRoom(roomId, {
            initialPresence: {
                name: mpState.playerName,
                color: mpState.playerColor,
                x: 0, y: 0,
                vx: 0, vy: 0,
                direction: 0,
                isDashing: false,
                invincible: false,
                lives: 3,
                isAlive: true,
                isHost: false,
                ready: false
            }
        });

        mpState.room = room;
        mpState.leaveRoom = leave;

        // Subscribe to broadcast events IMMEDIATELY
        room.subscribe('event', (eventData) => {
            console.log('Guest received event:', eventData);
            handleMultiplayerEvent(eventData);
        });

        // Subscribe to others for player list updates
        room.subscribe('others', () => {
            if (mpState.active) {
                updateLobbyPlayerList();
            }
        });

        // Wait for connection and find host
        return new Promise((resolve) => {
            let connectionTimeout = setTimeout(() => {
                updateConnectionStatus('join-connection-status', 'error', 'Room not found');
                leaveMultiplayerRoom();
                resolve(false);
            }, 5000);

            room.subscribe('status', (status) => {
                console.log('Guest room status:', status);
                if (status === 'connected') {
                    const self = room.getSelf();
                    mpState.myConnectionId = self?.connectionId;
                    mpState.active = true;

                    // Check if there's a host
                    const checkForHost = () => {
                        const others = room.getOthers();
                        console.log('Looking for host, others:', others.length);
                        const host = others.find(o => o.presence?.isHost);
                        if (host) {
                            mpState.hostConnectionId = host.connectionId;
                            clearTimeout(connectionTimeout);
                            updateConnectionStatus('join-connection-status', 'connected', t('connected'));
                            document.getElementById('lobby-room-code').textContent = mpState.roomCode;
                            showMenu('multiplayer-lobby-screen');
                            updateLobbyPlayerList();
                            resolve(true);
                            return true;
                        }
                        return false;
                    };

                    // Try immediately, then retry after a delay
                    if (!checkForHost()) {
                        setTimeout(() => {
                            if (!checkForHost()) {
                                // Keep waiting - host might join later
                                console.log('No host yet, waiting...');
                            }
                        }, 1000);
                    }
                }
            });
        });

    } catch (e) {
        console.error('Failed to join room:', e);
        updateConnectionStatus('join-connection-status', 'error', t('connectionError'));
        return false;
    }
}

// Leave the multiplayer room
function leaveMultiplayerRoom() {
    if (mpState.leaveRoom) {
        mpState.leaveRoom();
    }
    mpState.active = false;
    mpState.room = null;
    mpState.leaveRoom = null;
    mpState.isHost = false;
    mpState.roomCode = null;
    mpState.hostConnectionId = null;
    mpState.otherPlayers.clear();

    // Hide multiplayer HUD
    document.getElementById('multiplayer-players-hud').style.display = 'none';
}

// Handle broadcast events from other players
function handleMultiplayerEvent({ event, user, connectionId }) {
    console.log('handleMultiplayerEvent called:', event);

    if (!event || !event.type) {
        console.warn('Invalid event received:', event);
        return;
    }

    switch (event.type) {
        case 'GAME_START':
            console.log('GAME_START received! isHost:', mpState.isHost);
            // Only guests should respond to this - receive map from host
            if (!mpState.isHost && event.mapData) {
                console.log('Guest receiving map data from host');
                mpState.gameSettings = event.settings;
                startMultiplayerGameAsGuest(event.mapData);
            }
            break;

        case 'COLLECTIBLE_PICKED':
            // Someone collected an item
            if (connectionId !== mpState.myConnectionId) {
                const item = gameState.collectibles.find(c => c.id === event.itemId);
                if (item && !item.collected) {
                    item.collected = true;
                    updateUI();
                    playSound('collect');
                }
            }
            break;

        case 'POWERUP_COLLECTED':
            // Someone collected a powerup
            if (connectionId !== mpState.myConnectionId) {
                const powerup = gameState.powerups.find(p => p.id === event.powerupId);
                if (powerup && !powerup.collected) {
                    powerup.collected = true;
                }
            }
            break;

        case 'STINK_BOMB':
            // Stink bomb used - stun teachers
            stunAllTeachers();
            showMessage(t('stinkBombMsg'));
            playSound('stinkbomb');
            break;

        case 'TEACHER_POSITIONS':
            // Host is broadcasting teacher positions
            if (!mpState.isHost && event.teachers) {
                updateTeachersFromHost(event.teachers);
            }
            break;

        case 'LEVEL_COMPLETE':
            // Level completed - show with multiplayer scores
            if (!mpState.isHost) {
                showLevelCompleteScreen(event.scores);
            }
            break;

        case 'GAME_OVER':
            // Game over - show with multiplayer scores
            if (!mpState.isHost) {
                showMultiplayerGameOverScreen(event.won, event.scores);
            }
            break;
    }
}

// Update teachers from host broadcast
function updateTeachersFromHost(teacherData) {
    for (const data of teacherData) {
        const teacher = teachers.find(t => t.id === data.id);
        if (teacher) {
            teacher.x = data.x;
            teacher.y = data.y;
            teacher.direction = data.direction;
            teacher.seesPlayer = data.seesPlayer;
            teacher.stunned = data.stunned;
        }
    }
}

// Stun all teachers (for stink bomb)
function stunAllTeachers() {
    for (const teacher of teachers) {
        teacher.stunned = true;
        teacher.stunnedTimer = 4;
    }
}

// Update connection status display
function updateConnectionStatus(elementId, status, text) {
    const el = document.getElementById(elementId);
    if (el) {
        el.textContent = text;
        el.className = 'multiplayer-status ' + status;
    }
}

// Update host's player list
function updateHostPlayerList() {
    if (!mpState.room) return;

    const container = document.getElementById('host-player-list');
    const self = mpState.room.getSelf();
    const others = mpState.room.getOthers();

    let html = '';

    // Add self (host)
    if (self) {
        html += createPlayerListItem(self.presence, true, true);
    }

    // Add others
    for (const other of others) {
        if (other.presence) {
            html += createPlayerListItem(other.presence, false, false);
        }
    }

    container.innerHTML = html || `<p style="color: #aaa; text-align: center;">${t('waitingForPlayers')}</p>`;
}

// Update lobby player list (for non-host)
function updateLobbyPlayerList() {
    if (!mpState.room) return;

    const container = document.getElementById('lobby-player-list');
    const self = mpState.room.getSelf();
    const others = mpState.room.getOthers();

    let html = '';

    // Add host first (find in others)
    const host = others.find(o => o.presence?.isHost);
    if (host) {
        html += createPlayerListItem(host.presence, false, true);
    }

    // Add self
    if (self) {
        html += createPlayerListItem(self.presence, true, false);
    }

    // Add other non-host players
    for (const other of others) {
        if (other.presence && !other.presence.isHost) {
            html += createPlayerListItem(other.presence, false, false);
        }
    }

    container.innerHTML = html;
}

// Create HTML for a player list item
function createPlayerListItem(presence, isYou, isHost) {
    return `
        <div class="player-item">
            <div class="player-color" style="background: ${presence.color}"></div>
            <span class="player-name">${presence.name}</span>
            ${isHost ? `<span class="player-host-badge">${t('host')}</span>` : ''}
            ${isYou ? `<span class="player-you-badge">${t('you')}</span>` : ''}
        </div>
    `;
}

// Start multiplayer game as guest (receives map from host)
function startMultiplayerGameAsGuest(mapData) {
    gameMode = 'multiplayer';

    // Apply game settings
    settings.mapSize = mpState.gameSettings.mapSize;
    settings.teacherCount = mpState.gameSettings.teacherCount;

    // Start the game (will generate a temporary map)
    hideAllMenus();
    startGame();

    // Apply the map data received from host (overwrites generated map)
    applyMapData(mapData);

    // Show multiplayer HUD
    document.getElementById('multiplayer-players-hud').style.display = 'block';
    updateMultiplayerHUD();
}

// Host broadcasts game start
function hostStartGame() {
    if (!mpState.room || !mpState.isHost) return;

    mpState.gameSettings = {
        mapSize: document.getElementById('mp-map-size').value,
        teacherCount: parseInt(document.getElementById('mp-teacher-count').value)
    };

    console.log('Host starting game and generating map...');

    // Start game for host first (this generates the map)
    startMultiplayerGameAsHost();

    // Small delay to ensure map is generated, then broadcast map data to all clients
    setTimeout(() => {
        const mapData = serializeMapData();
        console.log('Host broadcasting GAME_START with map data to guests');

        mpState.room.broadcastEvent({
            type: 'GAME_START',
            mapData: mapData,
            settings: mpState.gameSettings
        });
    }, 100);
}

// Start multiplayer game as host (generates map)
function startMultiplayerGameAsHost() {
    gameMode = 'multiplayer';

    // Apply game settings
    settings.mapSize = mpState.gameSettings.mapSize;
    settings.teacherCount = mpState.gameSettings.teacherCount;

    // Start the game (generates map)
    hideAllMenus();
    startGame();

    // Show multiplayer HUD
    document.getElementById('multiplayer-players-hud').style.display = 'block';
    updateMultiplayerHUD();
}

// Update my presence (called in game loop)
function updateMyPresence() {
    if (!mpState.active || !mpState.room) return;

    // Throttle presence updates to ~30fps
    const now = Date.now();
    if (now - mpState.lastPresenceUpdate < 33) return;
    mpState.lastPresenceUpdate = now;

    mpState.room.updatePresence({
        x: player.x,
        y: player.y,
        vx: player.vx,
        vy: player.vy,
        direction: player.direction,
        isDashing: player.isDashing,
        invincible: player.invincible,
        lives: gameState.lives,
        isAlive: gameState.lives > 0,
        score: gameState.score
    });
}

// Host broadcasts teacher positions
function broadcastTeacherPositions() {
    if (!mpState.active || !mpState.room || !mpState.isHost) return;

    const teacherData = teachers.map(t => ({
        id: t.id,
        x: t.x,
        y: t.y,
        direction: t.direction,
        seesPlayer: t.seesPlayer,
        stunned: t.stunned
    }));

    mpState.room.broadcastEvent({
        type: 'TEACHER_POSITIONS',
        teachers: teacherData
    });
}

// Broadcast collectible pickup
function broadcastCollectiblePickup(itemId) {
    if (!mpState.active || !mpState.room) return;

    mpState.room.broadcastEvent({
        type: 'COLLECTIBLE_PICKED',
        itemId: itemId
    });
}

// Broadcast powerup pickup
function broadcastPowerupPickup(powerupId) {
    if (!mpState.active || !mpState.room) return;

    mpState.room.broadcastEvent({
        type: 'POWERUP_COLLECTED',
        powerupId: powerupId
    });
}

// Broadcast stink bomb
function broadcastStinkBomb() {
    if (!mpState.active || !mpState.room) return;

    mpState.room.broadcastEvent({
        type: 'STINK_BOMB'
    });
}

// Serialize map data for sharing
function serializeMapData() {
    return {
        map: gameState.map,
        mapWidth: gameState.mapWidth,
        mapHeight: gameState.mapHeight,
        collectibles: gameState.collectibles.map(c => ({
            id: c.id,
            x: c.x,
            y: c.y,
            gridX: c.gridX,
            gridY: c.gridY,
            collected: c.collected,
            animOffset: c.animOffset
        })),
        powerups: gameState.powerups.map(p => ({
            id: p.id,
            x: p.x,
            y: p.y,
            gridX: p.gridX,
            gridY: p.gridY,
            type: p.type,
            collected: p.collected,
            animOffset: p.animOffset
        })),
        player: {
            x: player.x,
            y: player.y,
            gridX: player.gridX,
            gridY: player.gridY
        },
        teachers: teachers.map(t => ({
            id: t.id,
            x: t.x,
            y: t.y,
            type: t.type,
            direction: t.direction,
            speed: t.speed,
            patrolPath: t.patrolPath
        }))
    };
}

// Apply received map data from host
function applyMapData(mapData) {
    console.log('Applying map data from host:', mapData);

    // Apply map
    gameState.map = mapData.map;
    gameState.mapWidth = mapData.mapWidth;
    gameState.mapHeight = mapData.mapHeight;

    // Apply collectibles
    gameState.collectibles = mapData.collectibles.map(c => ({
        ...c,
        collected: false,
        animOffset: c.animOffset ?? Math.random() * Math.PI * 2
    }));

    // Apply powerups
    gameState.powerups = mapData.powerups.map(p => ({
        ...p,
        collected: false,
        animOffset: p.animOffset ?? Math.random() * Math.PI * 2
    }));

    // Apply player position
    player.x = mapData.player.x;
    player.y = mapData.player.y;
    player.gridX = mapData.player.gridX;
    player.gridY = mapData.player.gridY;

    // Apply teachers - create full teacher objects with all required fields
    teachers.length = 0;
    mapData.teachers.forEach(t => {
        teachers.push({
            id: t.id,
            x: t.x,
            y: t.y,
            vx: 0,
            vy: 0,
            speed: t.speed,
            type: t.type,
            direction: t.direction,
            patrolTimer: 0,
            chaseTimer: 0,
            stunned: false,
            stunnedTimer: 0,
            seesPlayer: false,
            animFrame: 0,
            patrolPath: t.patrolPath || []
        });
    });

    console.log('Map data applied successfully, teachers:', teachers.length);
}

// Get all player scores (self and others)
function getAllPlayerScores() {
    if (!mpState.active || !mpState.room) return [];

    const scores = [];
    const self = mpState.room.getSelf();
    const others = mpState.room.getOthers();

    // Add self
    if (self?.presence) {
        scores.push({
            name: self.presence.name,
            color: self.presence.color,
            score: gameState.score, // Use current gameState score for self
            isSelf: true
        });
    }

    // Add others
    for (const other of others) {
        if (other.presence) {
            scores.push({
                name: other.presence.name,
                color: other.presence.color,
                score: other.presence.score || 0,
                isSelf: false
            });
        }
    }

    // Sort by score descending
    scores.sort((a, b) => b.score - a.score);
    return scores;
}

// Broadcast game over event with scores
function broadcastGameOver(won, scores) {
    if (!mpState.active || !mpState.room) return;

    mpState.room.broadcastEvent({
        type: 'GAME_OVER',
        won: won,
        scores: scores
    });
}

// Broadcast level complete event with scores
function broadcastLevelComplete(scores) {
    if (!mpState.active || !mpState.room) return;

    mpState.room.broadcastEvent({
        type: 'LEVEL_COMPLETE',
        scores: scores
    });
}

// Update multiplayer HUD during game
function updateMultiplayerHUD() {
    if (!mpState.active || !mpState.room) return;

    const container = document.getElementById('multiplayer-players-hud');
    const self = mpState.room.getSelf();
    const others = mpState.room.getOthers();

    let html = `<div style="font-size: 12px; color: #aaa; margin-bottom: 5px;">${t('players')}</div>`;

    // Add self
    if (self?.presence) {
        html += `
            <div class="mp-player-hud-item">
                <div class="mp-player-hud-color" style="background: ${self.presence.color}"></div>
                <span>${self.presence.name}</span>
                <span class="mp-player-hud-lives">❤${gameState.lives}</span>
            </div>
        `;
    }

    // Add others
    for (const other of others) {
        if (other.presence) {
            html += `
                <div class="mp-player-hud-item">
                    <div class="mp-player-hud-color" style="background: ${other.presence.color}"></div>
                    <span>${other.presence.name}</span>
                    <span class="mp-player-hud-lives">❤${other.presence.lives || 0}</span>
                </div>
            `;
        }
    }

    container.innerHTML = html;
}

// Draw other players on the canvas
function drawOtherPlayers() {
    if (!mpState.active || !mpState.room) return;

    const others = mpState.room.getOthers();

    for (const other of others) {
        if (!other.presence || !other.presence.isAlive) continue;

        const p = other.presence;

        // Use presence position directly (world coordinates)
        const worldX = p.x;
        const worldY = p.y;

        // Skip if off screen (use BASE_WIDTH/HEIGHT for consistent culling)
        const viewX = worldX - gameState.camera.x;
        const viewY = worldY - gameState.camera.y;
        if (viewX < -50 || viewX > BASE_WIDTH + 50 ||
            viewY < -50 || viewY > BASE_HEIGHT + 50) continue;

        ctx.save();
        ctx.translate(worldX, worldY);

        // Draw dash trail
        if (p.isDashing) {
            ctx.fillStyle = p.color + '40';
            ctx.beginPath();
            ctx.arc(-5, 0, 15, 0, Math.PI * 2);
            ctx.fill();
        }

        // Invincibility effect
        if (p.invincible) {
            ctx.globalAlpha = 0.5 + Math.sin(Date.now() / 100) * 0.3;
            ctx.shadowColor = '#ffd700';
            ctx.shadowBlur = 15;
        }

        // Shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.beginPath();
        ctx.ellipse(0, PLAYER_SIZE / 2 - 5, PLAYER_SIZE / 2, 5, 0, 0, Math.PI * 2);
        ctx.fill();

        // Body (colored circle)
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(0, 0, PLAYER_SIZE / 2, 0, Math.PI * 2);
        ctx.fill();

        // Border
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Eyes
        const eyeOffsetX = p.direction === 0 ? 4 : (p.direction === 2 ? -4 : 0);
        const eyeOffsetY = p.direction === 1 ? 4 : (p.direction === 3 ? -4 : 0);

        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(-4 + eyeOffsetX, -3 + eyeOffsetY, 4, 0, Math.PI * 2);
        ctx.arc(4 + eyeOffsetX, -3 + eyeOffsetY, 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#333';
        ctx.beginPath();
        ctx.arc(-4 + eyeOffsetX * 1.5, -3 + eyeOffsetY * 1.5, 2, 0, Math.PI * 2);
        ctx.arc(4 + eyeOffsetX * 1.5, -3 + eyeOffsetY * 1.5, 2, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();

        // Draw name above player
        ctx.save();
        ctx.fillStyle = p.color;
        ctx.font = 'bold 10px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(p.name, worldX, worldY - PLAYER_SIZE / 2 - 8);
        ctx.restore();
    }
}

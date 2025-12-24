/*
 * School Escape - UI Management
 * Copyright (c) 2025 Ilja Livenson and Mark Livenson
 */

// ============================================
// UI & MENUS
// ============================================

function updateUI() {
    document.getElementById('score-display').textContent = `${t('score')}: ${gameState.score}`;

    const comboDisplay = document.getElementById('combo-display');
    comboDisplay.textContent = `${t('combo')}: x${gameState.combo}`;
    if (gameState.combo > 1) {
        comboDisplay.classList.add('pulse');
        setTimeout(() => comboDisplay.classList.remove('pulse'), 100);
    }

    if (gameMode === 'campaign') {
        const level = LEVELS[currentLevel];
        document.getElementById('level-display').textContent = t(level.name);
    } else {
        document.getElementById('level-display').textContent = `${t('level')} ${gameState.level}`;
    }

    const collected = gameState.collectibles.filter(c => c.collected).length;
    document.getElementById('items-display').textContent = `${t('items')}: ${collected}/${gameState.collectibles.length}`;

    // Update lives
    const livesContainer = document.getElementById('lives-display');
    livesContainer.innerHTML = '';
    for (let i = 0; i < 3; i++) {
        const life = document.createElement('div');
        life.className = 'life-icon' + (i >= gameState.lives ? ' lost' : '');
        livesContainer.appendChild(life);
    }

    // Update powerup slots
    for (let i = 0; i < 3; i++) {
        const slot = document.getElementById(`powerup-${i + 1}`);
        const powerup = gameState.playerPowerups[i];
        slot.className = 'powerup-slot' + (powerup ? ' active' : '');

        if (powerup) {
            const icons = {
                hallpass: '📜',
                energydrink: '⚡',
                stinkbomb: '💨',
                skateboard: '🛹'
            };
            slot.textContent = icons[powerup];
        } else {
            slot.textContent = '';
        }
    }
}

function showMessage(text) {
    const popup = document.getElementById('message-popup');
    popup.textContent = text;
    popup.classList.add('show');
    setTimeout(() => popup.classList.remove('show'), 1500);
}

function showMenu(id) {
    document.querySelectorAll('.menu-screen').forEach(m => m.classList.add('hidden'));
    document.getElementById(id).classList.remove('hidden');
    // Show help button on menu screens
    document.getElementById('how-to-play-button').style.display = 'flex';
}

function hideAllMenus() {
    document.querySelectorAll('.menu-screen').forEach(m => m.classList.add('hidden'));
    // Hide help button during gameplay
    document.getElementById('how-to-play-button').style.display = 'none';
}

// ============================================
// LANGUAGE FUNCTIONS
// ============================================

function updateLanguage() {
    // Update main menu
    document.querySelector('#main-menu h1').textContent = t('title');
    document.querySelector('#main-menu h2').textContent = t('subtitle');
    document.getElementById('start-button').textContent = t('startGame');
    // Help button just shows "?" - update title for accessibility
    document.getElementById('how-to-play-button').title = t('howToPlay');

    // Update settings labels using data-translate attributes
    document.querySelectorAll('[data-translate]').forEach(el => {
        const key = el.getAttribute('data-translate');
        if (translations[settings.language] && translations[settings.language][key]) {
            el.textContent = translations[settings.language][key];
        }
    });

    // Update school type options
    const schoolTypeSelect = document.getElementById('school-type');
    schoolTypeSelect.options[0].textContent = t('elementary');
    schoolTypeSelect.options[1].textContent = t('middleSchool');
    schoolTypeSelect.options[2].textContent = t('highSchool');
    schoolTypeSelect.options[3].textContent = t('university');

    // Update map size options
    const mapSizeSelect = document.getElementById('map-size');
    mapSizeSelect.options[0].textContent = t('small');
    mapSizeSelect.options[1].textContent = t('medium');
    mapSizeSelect.options[2].textContent = t('large');

    // Update avatar options
    const avatarSelect = document.getElementById('avatar-select');
    if (avatarSelect) {
        avatarSelect.options[0].textContent = t('avatarDefault');
        avatarSelect.options[1].textContent = t('avatarNerd');
        avatarSelect.options[2].textContent = t('avatarJock');
        avatarSelect.options[3].textContent = t('avatarGoth');
        avatarSelect.options[4].textContent = t('avatarArtist');
        avatarSelect.options[5].textContent = t('avatarSkater');
        avatarSelect.options[6].textContent = t('avatarPreppy');
        avatarSelect.options[7].textContent = t('avatarPunk');
    }

    // Update sound buttons
    updateSoundButtons();

    // Update campaign/freeplay/multiplayer buttons
    document.getElementById('campaign-button').innerHTML = `📚 ${t('campaign')}`;
    document.getElementById('freeplay-button').innerHTML = `🎮 ${t('freePlay')}`;
    document.getElementById('multiplayer-button').innerHTML = `👥 ${t('multiplayer')}`;

    // Update How To Play screen
    document.querySelector('#how-to-play-screen h2').textContent = t('howToPlay');
    document.getElementById('back-to-menu-button').textContent = t('backToMenu');

    // Update how to play content
    const howToPlayContent = document.querySelector('#how-to-play-screen .settings-panel');
    howToPlayContent.innerHTML = `
        <p style="margin-bottom: 15px;"><strong style="color: #4ade80;">${t('objective')}</strong> ${t('objectiveText')}</p>
        <p style="margin-bottom: 15px;"><strong style="color: #60a5fa;">${t('controls')}</strong></p>
        <ul style="margin-left: 20px; margin-bottom: 15px;">
            <li>${t('controlMove')}</li>
            <li>${t('controlDash')}</li>
            <li>${t('controlPowerup')}</li>
            <li>${t('controlPause')}</li>
        </ul>
        <p style="margin-bottom: 15px;"><strong style="color: #ffd700;">${t('powerups')}</strong></p>
        <ul style="margin-left: 20px; margin-bottom: 15px;">
            <li>📜 ${t('hallPassDesc')}</li>
            <li>⚡ ${t('energyDrinkDesc')}</li>
            <li>💨 ${t('stinkBombDesc')}</li>
            <li>🛹 ${t('skateboardDesc')}</li>
        </ul>
        <p style="margin-bottom: 15px;"><strong style="color: #ff6b6b;">${t('teachersTitle')}</strong></p>
        <ul style="margin-left: 20px; margin-bottom: 15px;">
            <li><span style="display:inline-block;width:16px;height:16px;background:#4a90a4;border-radius:50%;vertical-align:middle;margin-right:5px;"></span> ${t('patrolDesc')}</li>
            <li><span style="display:inline-block;width:16px;height:16px;background:#c0392b;border-radius:3px;vertical-align:middle;margin-right:5px;"></span> ${t('hunterDesc')}</li>
            <li><span style="display:inline-block;width:16px;height:12px;background:#9b59b6;border-radius:50%;vertical-align:middle;margin-right:5px;"></span> ${t('fastDesc')}</li>
        </ul>
        <p style="margin-bottom: 15px;"><strong style="color: #9ca3af;">${t('mapTiles')}</strong></p>
        <ul style="margin-left: 20px;">
            <li><span style="display:inline-block;width:16px;height:16px;background:#4a4a6a;vertical-align:middle;margin-right:5px;border-radius:2px;"></span> ${t('floorDesc')}</li>
            <li><span style="display:inline-block;width:16px;height:16px;background:linear-gradient(#5c4033, #3d2817);vertical-align:middle;margin-right:5px;border-radius:2px;"></span> ${t('wallDesc')}</li>
            <li><span style="display:inline-block;width:16px;height:16px;background:#8b4513;vertical-align:middle;margin-right:5px;border-radius:2px;"></span> ${t('deskDesc')}</li>
            <li><span style="display:inline-block;width:16px;height:16px;background:#4a90a4;vertical-align:middle;margin-right:5px;border-radius:2px;"></span> ${t('lockerDesc')}</li>
            <li><span style="display:inline-block;width:16px;height:16px;background:rgba(100,200,255,0.5);vertical-align:middle;margin-right:5px;border-radius:2px;"></span> ${t('wetFloorDesc')}</li>
            <li><span style="display:inline-block;width:16px;height:16px;background:#4ade80;vertical-align:middle;margin-right:5px;border-radius:2px;"></span> ${t('exitDesc')}</li>
        </ul>
    `;

    // Update Pause screen
    document.querySelector('#pause-screen h2').textContent = t('paused');
    document.getElementById('resume-button').textContent = t('resume');
    document.getElementById('quit-button').textContent = t('quitToMenu');

    // Update Game Over screen
    document.getElementById('retry-button').textContent = t('playAgain');
    document.getElementById('menu-button').textContent = t('mainMenu');

    // Update footer hints
    const footerHints = document.querySelectorAll('#game-footer .key-hint');
    if (footerHints[0]) footerHints[0].innerHTML = `<span class="key">WASD</span> / <span class="key">←↑↓→</span> ${t('move')}`;
    if (footerHints[1]) footerHints[1].innerHTML = `<span class="key">SPACE</span> ${t('dash')}`;
    if (footerHints[2]) footerHints[2].innerHTML = `<span class="key">1-3</span> ${t('usePowerup')}`;
    if (footerHints[3]) footerHints[3].innerHTML = `<span class="key">ESC</span> ${t('pause')}`;

    // Update power-up slot titles
    document.getElementById('powerup-1').title = t('hallPass');
    document.getElementById('powerup-2').title = t('energyDrink');
    document.getElementById('powerup-3').title = t('stinkBomb');

    // Update UI displays
    updateUI();
}

function setLanguage(lang) {
    settings.language = lang;
    updateLanguage();
    playSound('menu_click');
}

function setAvatar(avatarId) {
    settings.playerAvatar = avatarId;
    localStorage.setItem('schoolEscape_playerAvatar', avatarId);
    updateAvatarPreview();
    playSound('menu_click');
}

function updateAvatarPreview() {
    const previewCanvas = document.getElementById('avatar-preview');
    if (!previewCanvas) return;

    const previewCtx = previewCanvas.getContext('2d');
    const avatar = AVATAR_TYPES.find(a => a.id === settings.playerAvatar) || AVATAR_TYPES[0];

    // Clear canvas
    previewCtx.fillStyle = '#374151';
    previewCtx.fillRect(0, 0, previewCanvas.width, previewCanvas.height);

    previewCtx.save();
    previewCtx.translate(previewCanvas.width / 2, previewCanvas.height / 2);

    const size = 28; // Preview size

    // Shadow
    previewCtx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    previewCtx.beginPath();
    previewCtx.ellipse(0, size / 2 - 3, size / 2, 4, 0, 0, Math.PI * 2);
    previewCtx.fill();

    // Body
    previewCtx.fillStyle = avatar.bodyColor;
    previewCtx.beginPath();
    previewCtx.arc(0, 0, size / 2, 0, Math.PI * 2);
    previewCtx.fill();

    // Backpack
    previewCtx.fillStyle = avatar.backpackColor;
    previewCtx.fillRect(-size / 2 - 3, -5, 6, 14);

    // Draw accessory behind
    drawPreviewAccessory(previewCtx, avatar.accessory, size, 'behind');

    // Eyes
    previewCtx.fillStyle = '#fff';
    previewCtx.beginPath();
    previewCtx.arc(-4, -2, 4, 0, Math.PI * 2);
    previewCtx.arc(4, -2, 4, 0, Math.PI * 2);
    previewCtx.fill();

    previewCtx.fillStyle = '#333';
    previewCtx.beginPath();
    previewCtx.arc(-4, -2, 2, 0, Math.PI * 2);
    previewCtx.arc(4, -2, 2, 0, Math.PI * 2);
    previewCtx.fill();

    // Smile
    previewCtx.strokeStyle = '#333';
    previewCtx.lineWidth = 2;
    previewCtx.beginPath();
    if (avatar.id === 'goth') {
        previewCtx.arc(0, 8, 5, Math.PI + 0.2, -0.2);
    } else {
        previewCtx.arc(0, 2, 5, 0.2, Math.PI - 0.2);
    }
    previewCtx.stroke();

    // Draw accessory front
    drawPreviewAccessory(previewCtx, avatar.accessory, size, 'front');

    previewCtx.restore();
}

function drawPreviewAccessory(ctx, accessory, size, layer) {
    if (!accessory) return;

    switch (accessory) {
        case 'glasses':
            if (layer === 'front') {
                ctx.strokeStyle = '#333';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(-4, -2, 5, 0, Math.PI * 2);
                ctx.stroke();
                ctx.beginPath();
                ctx.arc(4, -2, 5, 0, Math.PI * 2);
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(-1, -2);
                ctx.lineTo(1, -2);
                ctx.stroke();
            }
            break;

        case 'headband':
            if (layer === 'front') {
                ctx.fillStyle = '#fff';
                ctx.fillRect(-size / 2, -size / 2 + 2, size, 4);
                ctx.strokeStyle = '#ef4444';
                ctx.lineWidth = 1;
                ctx.strokeRect(-size / 2, -size / 2 + 2, size, 4);
            }
            break;

        case 'spikes':
            if (layer === 'behind') {
                ctx.fillStyle = '#9ca3af';
                for (let i = -2; i <= 2; i++) {
                    ctx.beginPath();
                    ctx.moveTo(i * 5, -size / 2 - 2);
                    ctx.lineTo(i * 5 - 3, -size / 2 + 4);
                    ctx.lineTo(i * 5 + 3, -size / 2 + 4);
                    ctx.closePath();
                    ctx.fill();
                }
            }
            break;

        case 'beret':
            if (layer === 'front') {
                ctx.fillStyle = '#be185d';
                ctx.beginPath();
                ctx.ellipse(0, -size / 2 + 2, size / 2 + 3, 5, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.beginPath();
                ctx.arc(0, -size / 2, 3, 0, Math.PI * 2);
                ctx.fill();
            }
            break;

        case 'cap':
            if (layer === 'front') {
                ctx.fillStyle = '#0d9488';
                ctx.beginPath();
                ctx.arc(0, -size / 2 + 4, size / 2, Math.PI, 0);
                ctx.fill();
                ctx.fillStyle = '#115e59';
                ctx.fillRect(-4, -size / 2 + 4, 8, 4);
            }
            break;

        case 'bowtie':
            if (layer === 'front') {
                ctx.fillStyle = '#7c3aed';
                ctx.beginPath();
                ctx.moveTo(0, size / 2 - 6);
                ctx.lineTo(-8, size / 2 - 10);
                ctx.lineTo(-8, size / 2 - 2);
                ctx.closePath();
                ctx.fill();
                ctx.beginPath();
                ctx.moveTo(0, size / 2 - 6);
                ctx.lineTo(8, size / 2 - 10);
                ctx.lineTo(8, size / 2 - 2);
                ctx.closePath();
                ctx.fill();
                ctx.fillStyle = '#5b21b6';
                ctx.beginPath();
                ctx.arc(0, size / 2 - 6, 3, 0, Math.PI * 2);
                ctx.fill();
            }
            break;

        case 'mohawk':
            if (layer === 'behind') {
                ctx.fillStyle = '#84cc16';
                for (let i = 0; i < 5; i++) {
                    ctx.beginPath();
                    ctx.moveTo(-6 + i * 3, -size / 2);
                    ctx.lineTo(-4 + i * 3, -size / 2 - 10 - Math.sin(i) * 3);
                    ctx.lineTo(-2 + i * 3, -size / 2);
                    ctx.closePath();
                    ctx.fill();
                }
            }
            break;
    }
}

function toggleSettingsPanel() {
    const header = document.getElementById('settings-toggle');
    const content = document.getElementById('settings-content');
    if (header && content) {
        header.classList.toggle('expanded');
        content.classList.toggle('expanded');
        playSound('menu_click');
    }
}

function toggleMapConfigPanel() {
    const header = document.getElementById('map-config-toggle');
    const content = document.getElementById('map-config-content');
    if (header && content) {
        header.classList.toggle('expanded');
        content.classList.toggle('expanded');
        playSound('menu_click');
    }
}

function toggleFreeplayPanel() {
    const header = document.getElementById('freeplay-toggle');
    const content = document.getElementById('freeplay-content');
    if (header && content) {
        header.classList.toggle('expanded');
        content.classList.toggle('expanded');
        playSound('menu_click');
    }
}

// ============================================
// CAMPAIGN MODE FUNCTIONS
// ============================================

function updateCampaignProgress() {
    const level = LEVELS[currentLevel];
    document.getElementById('current-level-text').textContent = `${t('currentLevel')}: ${t(level.name)}`;
    document.getElementById('menu-progress-bar').style.width = `${(currentLevel / LEVELS.length) * 100}%`;
    document.getElementById('menu-progress-text').textContent = `${currentLevel}/${LEVELS.length} ${t('completed')}`;
}

function saveCampaignProgress() {
    localStorage.setItem('schoolEscape_currentLevel', currentLevel.toString());
    localStorage.setItem('schoolEscape_totalScore', totalCampaignScore.toString());
}

function loadCampaignProgress() {
    const savedLevel = localStorage.getItem('schoolEscape_currentLevel');
    const savedScore = localStorage.getItem('schoolEscape_totalScore');
    if (savedLevel !== null) {
        currentLevel = parseInt(savedLevel);
    }
    if (savedScore !== null) {
        totalCampaignScore = parseInt(savedScore);
    }
}

function showLevelCompleteScreen(scores) {
    const level = LEVELS[currentLevel];
    document.getElementById('level-complete-title').textContent = t('levelComplete');
    document.getElementById('level-name-display').textContent = t(level.name);
    document.getElementById('level-score').textContent = `${t('score')}: ${gameState.score}`;

    const progress = ((currentLevel + 1) / LEVELS.length) * 100;
    document.getElementById('progress-bar').style.width = `${progress}%`;
    document.getElementById('progress-text').textContent = `${currentLevel + 1}/${LEVELS.length}`;

    document.getElementById('next-level-button').textContent = t('nextLevel');
    document.getElementById('level-menu-button').textContent = t('mainMenu');

    // Show multiplayer scores if available
    const mpScoresContainer = document.getElementById('level-multiplayer-scores');
    const mpScoresList = document.getElementById('level-multiplayer-scores-list');
    if (scores && scores.length > 1) {
        mpScoresContainer.style.display = 'block';
        mpScoresList.innerHTML = renderMultiplayerScores(scores);
    } else {
        mpScoresContainer.style.display = 'none';
    }

    // Broadcast level complete to other players in multiplayer
    if (mpState.active && mpState.isHost) {
        broadcastLevelComplete(scores);
    }

    // Add score to campaign total
    totalCampaignScore += gameState.score;
    saveCampaignProgress();

    showMenu('level-complete-screen');
}

function showGraduationScreen() {
    document.getElementById('graduation-message').textContent = t('graduatedMsg');
    document.getElementById('total-score').textContent = `${t('totalScore')}: ${totalCampaignScore}`;
    document.getElementById('new-game-button').textContent = t('newGame');
    document.getElementById('graduation-menu-button').textContent = t('mainMenu');

    // Reset campaign progress
    currentLevel = 0;
    totalCampaignScore = 0;
    saveCampaignProgress();

    showMenu('graduation-screen');
}

// Show game over screen with optional multiplayer scores
function showMultiplayerGameOverScreen(won, scores) {
    const screen = document.getElementById('game-over-screen');
    const title = screen.querySelector('h2');
    const scoreDisplay = document.getElementById('final-score');
    const statsDisplay = document.getElementById('final-stats');
    const mpScoresContainer = document.getElementById('multiplayer-scores');
    const mpScoresList = document.getElementById('multiplayer-scores-list');

    if (won) {
        title.textContent = t('escaped');
        screen.className = 'menu-screen win';
    } else {
        title.textContent = t('caught');
        screen.className = 'menu-screen lose';
    }

    scoreDisplay.textContent = `${t('score')}: ${gameState.score}`;
    statsDisplay.innerHTML = `
        ${t('itemsCollected')}: ${gameState.collectibles.filter(c => c.collected).length}/${gameState.collectibles.length}<br>
        ${t('livesRemaining')}: ${gameState.lives}
    `;

    // Show multiplayer scores if available
    if (scores && scores.length > 1) {
        mpScoresContainer.style.display = 'block';
        mpScoresList.innerHTML = renderMultiplayerScores(scores);
    } else {
        mpScoresContainer.style.display = 'none';
    }

    screen.classList.remove('hidden');
}

// Render multiplayer scores list HTML
function renderMultiplayerScores(scores) {
    let html = '';
    scores.forEach((player, index) => {
        const rankEmoji = index === 0 ? '🥇' : (index === 1 ? '🥈' : (index === 2 ? '🥉' : ''));
        const selfStyle = player.isSelf ? 'font-weight: bold;' : '';
        html += `
            <div style="display: flex; align-items: center; gap: 8px; padding: 6px 0; border-bottom: 1px solid rgba(255,255,255,0.1); ${selfStyle}">
                <span style="width: 24px; text-align: center;">${rankEmoji || (index + 1)}</span>
                <div style="width: 12px; height: 12px; background: ${player.color}; border-radius: 50%; border: 1px solid #fff;"></div>
                <span style="flex: 1; color: ${player.isSelf ? '#4ade80' : '#fff'};">${player.name}${player.isSelf ? ' (you)' : ''}</span>
                <span style="color: #ffd700;">${player.score}</span>
            </div>
        `;
    });
    return html;
}

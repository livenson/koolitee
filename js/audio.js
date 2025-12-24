/*
 * School Escape - Audio System
 * Copyright (c) 2025 Ilja Livenson and Mark Livenson
 */

// ============================================
// SOUND SYSTEM
// ============================================

let audioCtx = null;
let musicOscillators = [];
let musicGain = null;

function initAudio() {
    if (audioCtx) return;
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
}

function playSound(type, options = {}) {
    if (!settings.soundEnabled || !audioCtx) return;

    // Resume audio context if suspended (browser autoplay policy)
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }

    const time = audioCtx.currentTime;

    switch (type) {
        case 'collect':
            // Cheerful ascending ding
            playTone(880 + (options.combo || 1) * 50, 0.1, 'sine', 0.3);
            playTone(1100 + (options.combo || 1) * 50, 0.1, 'sine', 0.25, 0.05);
            break;

        case 'powerup':
            // Magical ascending arpeggio
            playTone(400, 0.15, 'sine', 0.3);
            playTone(500, 0.15, 'sine', 0.25, 0.08);
            playTone(600, 0.15, 'sine', 0.2, 0.16);
            playTone(800, 0.2, 'sine', 0.3, 0.24);
            break;

        case 'powerup_use':
            // Activation whoosh
            playSweep(200, 800, 0.3, 'sawtooth', 0.2);
            break;

        case 'dash':
            // Quick whoosh
            playSweep(300, 150, 0.15, 'sawtooth', 0.15);
            break;

        case 'caught':
            // Alarming descending sound
            playTone(600, 0.15, 'square', 0.3);
            playTone(400, 0.15, 'square', 0.25, 0.1);
            playTone(200, 0.3, 'square', 0.2, 0.2);
            break;

        case 'alert':
            // Teacher spotted you - quick alarm beep
            playTone(800, 0.08, 'square', 0.15);
            playTone(1000, 0.08, 'square', 0.12, 0.1);
            break;

        case 'stun':
            // Stink bomb - bubbly explosion
            playNoise(0.3, 0.4);
            playSweep(400, 100, 0.4, 'sawtooth', 0.2);
            break;

        case 'win':
            // Victory fanfare
            const notes = [523, 659, 784, 1047]; // C E G C
            notes.forEach((freq, i) => {
                playTone(freq, 0.3, 'sine', 0.3, i * 0.15);
                playTone(freq * 1.5, 0.3, 'sine', 0.15, i * 0.15);
            });
            break;

        case 'lose':
            // Game over descending
            playTone(400, 0.3, 'sawtooth', 0.25);
            playTone(350, 0.3, 'sawtooth', 0.2, 0.25);
            playTone(300, 0.5, 'sawtooth', 0.15, 0.5);
            break;

        case 'footstep':
            // Soft footstep
            playNoise(0.03, 0.05);
            break;

        case 'slide':
            // Wet floor sliding
            playSweep(200, 400, 0.1, 'sine', 0.1);
            break;

        case 'menu_click':
            // UI click
            playTone(600, 0.05, 'sine', 0.2);
            break;

        case 'menu_hover':
            // UI hover
            playTone(400, 0.03, 'sine', 0.1);
            break;
    }
}

function playTone(frequency, duration, waveType = 'sine', volume = 0.3, delay = 0) {
    if (!audioCtx) return;

    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    oscillator.type = waveType;
    oscillator.frequency.value = frequency;

    const startTime = audioCtx.currentTime + delay;
    gainNode.gain.setValueAtTime(0, startTime);
    gainNode.gain.linearRampToValueAtTime(volume, startTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

    oscillator.start(startTime);
    oscillator.stop(startTime + duration + 0.1);
}

function playSweep(startFreq, endFreq, duration, waveType = 'sine', volume = 0.3) {
    if (!audioCtx) return;

    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    oscillator.type = waveType;
    oscillator.frequency.setValueAtTime(startFreq, audioCtx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(endFreq, audioCtx.currentTime + duration);

    gainNode.gain.setValueAtTime(volume, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);

    oscillator.start();
    oscillator.stop(audioCtx.currentTime + duration + 0.1);
}

function playNoise(duration, volume = 0.3) {
    if (!audioCtx) return;

    const bufferSize = audioCtx.sampleRate * duration;
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * volume;
    }

    const noise = audioCtx.createBufferSource();
    const gainNode = audioCtx.createGain();

    noise.buffer = buffer;
    noise.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    gainNode.gain.setValueAtTime(volume, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);

    noise.start();
}

// Background music using simple procedural generation
function startMusic() {
    if (!settings.musicEnabled || !audioCtx) return;
    stopMusic();

    // Resume AudioContext if suspended (browser autoplay policy)
    if (audioCtx.state === 'suspended') {
        audioCtx.resume().then(() => {
            actuallyStartMusic();
        });
    } else {
        actuallyStartMusic();
    }
}

function actuallyStartMusic() {
    if (!audioCtx || musicOscillators.length > 0) return;

    musicGain = audioCtx.createGain();
    musicGain.gain.value = 0.25;
    musicGain.connect(audioCtx.destination);

    // Create a simple bass line
    const bassNotes = [130.81, 146.83, 164.81, 146.83]; // C3, D3, E3, D3
    let noteIndex = 0;

    function playNextNote() {
        if (!settings.musicEnabled || musicOscillators.length === 0 || !audioCtx) return;

        const osc = audioCtx.createOscillator();
        const noteGain = audioCtx.createGain();

        osc.connect(noteGain);
        noteGain.connect(musicGain);

        osc.type = 'triangle';
        osc.frequency.value = bassNotes[noteIndex];

        noteGain.gain.setValueAtTime(0.4, audioCtx.currentTime);
        noteGain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.4);

        osc.start();
        osc.stop(audioCtx.currentTime + 0.5);

        noteIndex = (noteIndex + 1) % bassNotes.length;
    }

    // Start the loop
    const musicInterval = setInterval(() => {
        if (settings.musicEnabled && gameState.running && !gameState.paused && musicOscillators.length > 0) {
            playNextNote();
        }
    }, 500);

    musicOscillators.push({ interval: musicInterval });

    // Add ambient pad
    const padOsc = audioCtx.createOscillator();
    const padGain = audioCtx.createGain();
    const padFilter = audioCtx.createBiquadFilter();

    padOsc.connect(padFilter);
    padFilter.connect(padGain);
    padGain.connect(musicGain);

    padOsc.type = 'sawtooth';
    padOsc.frequency.value = 65.41; // C2
    padFilter.type = 'lowpass';
    padFilter.frequency.value = 300;
    padGain.gain.value = 0.3;

    padOsc.start();
    musicOscillators.push({ osc: padOsc, gain: padGain });
}

function stopMusic() {
    musicOscillators.forEach(item => {
        if (item.interval) clearInterval(item.interval);
        if (item.osc) {
            try {
                item.osc.stop();
            } catch (e) {}
        }
    });
    musicOscillators = [];
}

function toggleSound() {
    settings.soundEnabled = !settings.soundEnabled;
    updateSoundButtons();
    if (settings.soundEnabled) {
        playSound('menu_click');
    }
}

function toggleMusic() {
    settings.musicEnabled = !settings.musicEnabled;
    updateSoundButtons();
    if (settings.musicEnabled && gameState.running) {
        startMusic();
    } else {
        stopMusic();
    }
}

function toggleEvents() {
    settings.eventsEnabled = !settings.eventsEnabled;
    updateSoundButtons();
    playSound('menu_click');
}

function updateSoundButtons() {
    const soundBtn = document.getElementById('sound-toggle');
    const eventsBtn = document.getElementById('events-toggle');
    if (soundBtn) soundBtn.textContent = settings.soundEnabled ? t('soundOn') : t('soundOff');
    if (eventsBtn) eventsBtn.textContent = settings.eventsEnabled ? t('eventsOn') : t('eventsOff');
}

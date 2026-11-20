/**
 * AdMotion AI - Interactive Cinematic Video Preview & Audio Engine
 * Renders procedural cinematic scenes with Ken Burns camera motion,
 * synchronized subtitles, Web Speech API voiceover, and Web Audio synth BGM.
 */

class AdMotionPlayer {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
    this.project = null;
    this.currentTime = 0;
    this.totalDuration = 30;
    this.isPlaying = false;
    this.currentSceneIndex = 0;
    this.animationFrameId = null;
    this.lastTimestamp = null;

    // Audio states
    this.audioCtx = null;
    this.bgmGainNode = null;
    this.isMuted = false;
    this.hasSpokenSceneVO = {};

    // Particles for procedural visual effects
    this.particles = [];
    this.initParticles(60);

    // Bind UI elements
    this.playBtn = document.getElementById('playPauseBtn');
    this.progressBar = document.getElementById('previewProgressFill');
    this.progressTrack = document.getElementById('previewProgressTrack');
    this.timeReadout = document.getElementById('timeReadout');
    this.subtitlesEl = document.getElementById('hudSubtitles');
    this.scenePillEl = document.getElementById('hudScenePill');
    this.aspectFrame = document.getElementById('aspectFrame');

    this.bindEvents();
  }

  initParticles(count) {
    this.particles = [];
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: Math.random(),
        y: Math.random(),
        radius: Math.random() * 2.5 + 0.5,
        alpha: Math.random() * 0.6 + 0.2,
        speedX: (Math.random() - 0.5) * 0.0008,
        speedY: (Math.random() - 0.5) * 0.0008
      });
    }
  }

  bindEvents() {
    if (this.playBtn) {
      this.playBtn.addEventListener('click', () => this.togglePlay());
    }

    if (this.progressTrack) {
      this.progressTrack.addEventListener('click', (e) => {
        const rect = this.progressTrack.getBoundingClientRect();
        const clickRatio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
        this.seekTo(clickRatio * this.totalDuration);
      });
    }

    const muteBtn = document.getElementById('muteToggleBtn');
    if (muteBtn) {
      muteBtn.addEventListener('click', () => this.toggleMute());
    }

    const restartBtn = document.getElementById('restartBtn');
    if (restartBtn) {
      restartBtn.addEventListener('click', () => {
        this.seekTo(0);
        this.play();
      });
    }
  }

  loadProject(project) {
    this.pause();
    this.project = project;
    this.totalDuration = project.duration || 30;
    this.currentTime = 0;
    this.currentSceneIndex = 0;
    this.hasSpokenSceneVO = {};

    // Update aspect ratio frame sizing
    if (this.aspectFrame) {
      this.aspectFrame.className = 'aspect-frame';
      if (project.aspect_ratio === '9:16') {
        this.aspectFrame.classList.add('ratio-9-16');
      } else if (project.aspect_ratio === '1:1') {
        this.aspectFrame.classList.add('ratio-1-1');
      } else {
        this.aspectFrame.classList.add('ratio-16-9');
      }
    }

    this.resizeCanvas();
    this.updateHUD();
    this.renderFrame(0);
  }

  resizeCanvas() {
    if (!this.canvas) return;
    const rect = this.canvas.getBoundingClientRect();
    this.canvas.width = rect.width * window.devicePixelRatio || 640;
    this.canvas.height = rect.height * window.devicePixelRatio || 360;
  }

  togglePlay() {
    if (this.isPlaying) {
      this.pause();
    } else {
      this.play();
    }
  }

  play() {
    if (!this.project) return;
    if (this.currentTime >= this.totalDuration) {
      this.currentTime = 0;
      this.hasSpokenSceneVO = {};
    }
    this.isPlaying = true;
    this.lastTimestamp = performance.now();
    this.updatePlayBtnUI();
    this.initAudioContext();
    this.startBGM();

    // Trigger VO for the current scene if not spoken yet
    this.speakCurrentSceneVO();

    this.animationLoop();
  }

  pause() {
    this.isPlaying = false;
    this.updatePlayBtnUI();
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    this.stopBGM();
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }

  seekTo(seconds) {
    this.currentTime = Math.max(0, Math.min(seconds, this.totalDuration));
    this.hasSpokenSceneVO = {};
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    this.updateCurrentSceneIndex();
    this.updateHUD();
    this.renderFrame(0);
    if (this.isPlaying) {
      this.speakCurrentSceneVO();
    }
  }

  updatePlayBtnUI() {
    if (!this.playBtn) return;
    if (this.isPlaying) {
      this.playBtn.innerHTML = `
        <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
          <rect x="6" y="4" width="4" height="16" rx="1"></rect>
          <rect x="14" y="4" width="4" height="16" rx="1"></rect>
        </svg>
      `;
    } else {
      this.playBtn.innerHTML = `
        <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
          <polygon points="5 3 19 12 5 21 5 3"></polygon>
        </svg>
      `;
    }
  }

  animationLoop() {
    if (!this.isPlaying) return;

    const now = performance.now();
    const delta = (now - this.lastTimestamp) / 1000;
    this.lastTimestamp = now;

    this.currentTime += delta;

    if (this.currentTime >= this.totalDuration) {
      this.currentTime = this.totalDuration;
      this.pause();
      this.updateHUD();
      this.renderFrame(0);
      return;
    }

    const prevSceneIdx = this.currentSceneIndex;
    this.updateCurrentSceneIndex();

    // If transitioned to next scene, speak its VO
    if (this.currentSceneIndex !== prevSceneIdx) {
      this.speakCurrentSceneVO();
    }

    this.updateHUD();
    this.renderFrame(delta);

    this.animationFrameId = requestAnimationFrame(() => this.animationLoop());
  }

  updateCurrentSceneIndex() {
    if (!this.project || !this.project.scenes) return;
    let accumulated = 0;
    for (let i = 0; i < this.project.scenes.length; i++) {
      const dur = this.project.scenes[i].duration || 5;
      if (this.currentTime >= accumulated && this.currentTime < accumulated + dur) {
        this.currentSceneIndex = i;
        return;
      }
      accumulated += dur;
    }
    this.currentSceneIndex = this.project.scenes.length - 1;
  }

  getCurrentSceneProgress() {
    if (!this.project || !this.project.scenes) return { scene: null, progress: 0 };
    let accumulated = 0;
    for (let i = 0; i < this.project.scenes.length; i++) {
      const scene = this.project.scenes[i];
      const dur = scene.duration || 5;
      if (this.currentTime >= accumulated && this.currentTime < accumulated + dur) {
        const sceneLocalTime = this.currentTime - accumulated;
        return {
          scene,
          index: i,
          progress: Math.min(1, Math.max(0, sceneLocalTime / dur)),
          localTime: sceneLocalTime
        };
      }
      accumulated += dur;
    }
    const lastScene = this.project.scenes[this.project.scenes.length - 1];
    return { scene: lastScene, index: this.project.scenes.length - 1, progress: 1, localTime: lastScene.duration };
  }

  updateHUD() {
    // Update progress track
    if (this.progressBar) {
      const pct = (this.currentTime / this.totalDuration) * 100;
      this.progressBar.style.width = `${pct}%`;
    }

    // Time readout
    if (this.timeReadout) {
      const formatTime = (s) => {
        const mins = Math.floor(s / 60);
        const secs = Math.floor(s % 60);
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
      };
      this.timeReadout.innerText = `${formatTime(this.currentTime)} / ${formatTime(this.totalDuration)}`;
    }

    // Subtitles & Scene pill
    const { scene, index } = this.getCurrentSceneProgress();
    if (scene) {
      if (this.subtitlesEl) {
        this.subtitlesEl.innerText = scene.voiceover || scene.title || '';
      }
      if (this.scenePillEl) {
        this.scenePillEl.innerText = `Scene ${index + 1} of ${this.project.scenes.length}`;
      }

      // Highlight active storyboard scene card on page
      document.querySelectorAll('.scene-card').forEach((card, idx) => {
        if (idx === index) {
          card.classList.add('active-scene-card');
        } else {
          card.classList.remove('active-scene-card');
        }
      });
    }
  }

  /**
   * Procedural Canvas Render with Ken Burns motion, depth layers & aesthetic lighting
   */
  renderFrame(delta) {
    if (!this.ctx || !this.canvas) return;
    const { scene, progress } = this.getCurrentSceneProgress();
    if (!scene) return;

    const w = this.canvas.width;
    const h = this.canvas.height;
    const ctx = this.ctx;

    ctx.save();
    ctx.clearRect(0, 0, w, h);

    // Extract palette or defaults
    const palette = scene.color_palette || ['#8B5CF6', '#00F0FF', '#0A0B1A'];
    const colorA = palette[0] || '#8B5CF6';
    const colorB = palette[1] || '#00F0FF';
    const colorC = palette[2] || '#0A0B1A';

    // Ken Burns Camera Motion: Scale from 1.0 to 1.15 and pan slightly
    const scale = 1.0 + (progress * 0.12);
    const panX = (progress - 0.5) * 30;
    const panY = (progress - 0.5) * 15;

    ctx.translate(w / 2, h / 2);
    ctx.scale(scale, scale);
    ctx.translate(-w / 2 + panX, -h / 2 + panY);

    // 1. Deep Space Gradient Background
    const bgGrad = ctx.createRadialGradient(w * 0.5, h * 0.4, 40, w * 0.5, h * 0.5, w * 0.8);
    bgGrad.addColorStop(0, colorC);
    bgGrad.addColorStop(0.6, '#06070B');
    bgGrad.addColorStop(1, '#020305');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(-50, -50, w + 100, h + 100);

    // 2. High-Tech Glow Spheres
    const glowGrad1 = ctx.createRadialGradient(w * 0.25, h * 0.3, 10, w * 0.25, h * 0.3, w * 0.45);
    glowGrad1.addColorStop(0, hexToRgba(colorA, 0.4));
    glowGrad1.addColorStop(1, 'transparent');
    ctx.fillStyle = glowGrad1;
    ctx.fillRect(0, 0, w, h);

    const glowGrad2 = ctx.createRadialGradient(w * 0.75, h * 0.7, 10, w * 0.75, h * 0.7, w * 0.4);
    glowGrad2.addColorStop(0, hexToRgba(colorB, 0.35));
    glowGrad2.addColorStop(1, 'transparent');
    ctx.fillStyle = glowGrad2;
    ctx.fillRect(0, 0, w, h);

    // 3. Floating Micro Particles
    ctx.fillStyle = '#FFFFFF';
    for (const p of this.particles) {
      p.x += p.speedX;
      p.y += p.speedY;
      if (p.x < 0) p.x = 1;
      if (p.x > 1) p.x = 0;
      if (p.y < 0) p.y = 1;
      if (p.y > 1) p.y = 0;

      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.beginPath();
      ctx.arc(p.x * w, p.y * h, p.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // 4. Stylized Futuristic Horizon / Geometric Grid Mesh
    ctx.save();
    ctx.strokeStyle = hexToRgba(colorB, 0.15);
    ctx.lineWidth = 1;
    const gridCols = 8;
    for (let c = 0; c <= gridCols; c++) {
      const gx = (w / gridCols) * c;
      ctx.beginPath();
      ctx.moveTo(gx, h * 0.4);
      ctx.lineTo(w * 0.5 + (gx - w * 0.5) * 2.2, h);
      ctx.stroke();
    }
    ctx.restore();

    // 5. Hero Motion Graphic in Center
    ctx.save();
    ctx.translate(w / 2, h / 2 - 10);

    // Glowing orbital ring
    const ringRadius = Math.min(w, h) * 0.22;
    ctx.beginPath();
    ctx.arc(0, 0, ringRadius, 0, Math.PI * 2);
    ctx.strokeStyle = hexToRgba(colorA, 0.35);
    ctx.lineWidth = 3;
    ctx.stroke();

    // Rotating pulse arc
    const pulseAngle = (this.currentTime * 1.5) % (Math.PI * 2);
    ctx.beginPath();
    ctx.arc(0, 0, ringRadius, pulseAngle, pulseAngle + 1.2);
    ctx.strokeStyle = colorB;
    ctx.lineWidth = 4;
    ctx.shadowColor = colorB;
    ctx.shadowBlur = 15;
    ctx.stroke();

    // Center Product / Brand Emblem Badge
    ctx.shadowBlur = 25;
    ctx.shadowColor = colorA;
    ctx.fillStyle = hexToRgba('#0c0f1d', 0.85);
    ctx.beginPath();
    ctx.arc(0, 0, ringRadius * 0.65, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = hexToRgba(colorA, 0.6);
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Brand Name & Scene Title Text
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '700 16px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(this.project.brand || 'AdMotion', 0, -8);

    ctx.font = '500 11px "JetBrains Mono", monospace';
    ctx.fillStyle = colorB;
    ctx.fillText(scene.title ? scene.title.substring(0, 24) : 'SCENE PREVIEW', 0, 14);

    ctx.restore();

    // 6. Cinematic Vignette
    const vignette = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.4, w / 2, h / 2, Math.max(w, h) * 0.7);
    vignette.addColorStop(0, 'rgba(0, 0, 0, 0)');
    vignette.addColorStop(1, 'rgba(0, 0, 0, 0.65)');
    ctx.fillStyle = vignette;
    ctx.fillRect(-50, -50, w + 100, h + 100);

    ctx.restore();
  }

  /**
   * Web Speech API - Voiceover Narrator
   */
  speakCurrentSceneVO() {
    if (!this.project || !this.project.has_vo || this.isMuted) return;
    if (!('speechSynthesis' in window)) return;

    const { scene, index } = this.getCurrentSceneProgress();
    if (!scene || !scene.voiceover) return;
    if (this.hasSpokenSceneVO[index]) return;

    this.hasSpokenSceneVO[index] = true;
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(scene.voiceover);
    utterance.rate = 1.05;
    utterance.pitch = 0.98;

    // Pick best natural voice if available
    const voices = window.speechSynthesis.getVoices();
    const naturalVoice = voices.find(v => v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Samantha')));
    if (naturalVoice) {
      utterance.voice = naturalVoice;
    }

    window.speechSynthesis.speak(utterance);
  }

  /**
   * Web Audio API - Synthetic Ambient BGM
   */
  initAudioContext() {
    if (this.audioCtx) return;
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
    } catch (e) {
      console.warn("Web Audio not supported", e);
    }
  }

  startBGM() {
    if (!this.project || !this.project.has_bgm || this.isMuted) return;
    if (!this.audioCtx) return;

    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }

    this.stopBGM();

    try {
      // Create ambient drone oscillators
      const osc1 = this.audioCtx.createOscillator();
      const osc2 = this.audioCtx.createOscillator();
      const filter = this.audioCtx.createBiquadFilter();
      this.bgmGainNode = this.audioCtx.createGain();

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(65.41, this.audioCtx.currentTime); // C2 note

      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(130.81, this.audioCtx.currentTime); // C3 harmonic

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(320, this.audioCtx.currentTime);

      this.bgmGainNode.gain.setValueAtTime(0.08, this.audioCtx.currentTime);

      osc1.connect(filter);
      osc2.connect(filter);
      filter.connect(this.bgmGainNode);
      this.bgmGainNode.connect(this.audioCtx.destination);

      osc1.start();
      osc2.start();

      this.activeOscillators = [osc1, osc2];
    } catch (e) {
      console.warn("Could not start BGM synth", e);
    }
  }

  stopBGM() {
    if (this.activeOscillators) {
      this.activeOscillators.forEach(osc => {
        try { osc.stop(); } catch(e) {}
      });
      this.activeOscillators = null;
    }
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    const muteBtn = document.getElementById('muteToggleBtn');
    if (this.isMuted) {
      this.stopBGM();
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
      if (muteBtn) muteBtn.innerHTML = `
        <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <line x1="1" y1="1" x2="23" y2="23"></line>
          <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"></path>
          <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23"></path>
          <line x1="12" y1="19" x2="12" y2="23"></line>
          <line x1="8" y1="23" x2="16" y2="23"></line>
        </svg>
      `;
    } else {
      if (this.isPlaying) {
        this.startBGM();
        this.speakCurrentSceneVO();
      }
      if (muteBtn) muteBtn.innerHTML = `
        <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
          <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
        </svg>
      `;
    }
  }
}

function hexToRgba(hex, alpha) {
  let c = hex.replace('#', '');
  if (c.length === 3) {
    c = c.split('').map(x => x + x).join('');
  }
  const num = parseInt(c, 16);
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

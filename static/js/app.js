/**
 * AdMotion AI - Main Application Controller
 * Handles SPA navigation, form state, API communication,
 * storyboard rendering, prompt tools, and project management.
 */

document.addEventListener('DOMContentLoaded', () => {
  // Global State
  const state = {
    activeView: 'landing',
    currentProject: null,
    savedProjects: [],
    templates: [],
    form: {
      prompt: '',
      brand: '',
      duration: 30,
      aspect_ratio: '16:9',
      visual_style: 'Cinematic',
      mood: 'Energetic',
      has_vo: true,
      has_bgm: true
    }
  };

  // Initialize Player
  const player = new AdMotionPlayer('previewCanvas');

  // Surprise / Inspiration Prompts Library
  const surprisePrompts = [
    {
      brand: "Aetheria Audio",
      prompt: "Next-generation noise cancellation headphones with liquid crystal sound drivers, floating in a rainfall of neon lights.",
      style: "Futuristic",
      mood: "Dramatic",
      duration: 30,
      ratio: "16:9"
    },
    {
      brand: "Vanguard Titan",
      prompt: "All-electric cybernetic supercar with active aerodynamic titanium fins carving through an Alpine mountain pass at dusk.",
      style: "Cinematic",
      mood: "Energetic",
      duration: 15,
      ratio: "16:9"
    },
    {
      brand: "Solaria Botanical",
      prompt: "Cold-pressed golden marula face oil with floating micro-pearls in an obsidian glass dropper against morning sunbeams.",
      style: "Luxury",
      mood: "Emotional",
      duration: 15,
      ratio: "9:16"
    },
    {
      brand: "VoltDrive Nootropic",
      prompt: "Zero-sugar botanical energy beverage exploding through crystalline ice cubes with neon cyan carbonation sparks.",
      style: "Cinematic",
      mood: "Energetic",
      duration: 15,
      ratio: "9:16"
    },
    {
      brand: "Luminary AI",
      prompt: "Autonomous multi-agent code orchestration platform transforming user sketches into enterprise cloud software in real time.",
      style: "Futuristic",
      mood: "Premium",
      duration: 30,
      ratio: "16:9"
    },
    {
      brand: "Chrono Obsidian",
      prompt: "Ultra-luxury tourbillon mechanical watch forged from meteorite ore and sapphire crystal under cinematic warm candlelight.",
      style: "Luxury",
      mood: "Premium",
      duration: 30,
      ratio: "9:16"
    }
  ];

  /* =========================================================
     NAVIGATION & VIEW SWITCHING
     ========================================================= */
  function navigateTo(viewId) {
    state.activeView = viewId;

    // Update view sections
    document.querySelectorAll('.view-section').forEach(sec => {
      sec.classList.remove('active');
    });
    const targetSection = document.getElementById(`view-${viewId}`);
    if (targetSection) {
      targetSection.classList.add('active');
    }

    // Update nav items
    document.querySelectorAll('.nav-item').forEach(item => {
      if (item.dataset.target === viewId) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });

    window.scrollTo({ top: 0, behavior: 'smooth' });

    // View specific hooks
    if (viewId === 'projects') {
      fetchProjects();
    } else if (viewId === 'templates') {
      fetchTemplates();
    } else if (viewId === 'results' && state.currentProject) {
      player.resizeCanvas();
    }
  }

  // Bind nav click listeners
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', () => {
      const target = item.dataset.target;
      if (target) navigateTo(target);
    });
  });

  // Logo returns to landing
  document.querySelector('.brand-logo').addEventListener('click', (e) => {
    e.preventDefault();
    navigateTo('landing');
  });

  // Hero CTAs
  document.querySelectorAll('.btn-launch-studio').forEach(btn => {
    btn.addEventListener('click', () => navigateTo('studio'));
  });

  /* =========================================================
     LANDING PAGE TEASER
     ========================================================= */
  const teaserInput = document.getElementById('teaserPromptInput');
  const teaserBtn = document.getElementById('teaserGenerateBtn');
  if (teaserBtn && teaserInput) {
    teaserBtn.addEventListener('click', () => {
      const val = teaserInput.value.trim();
      if (val) {
        state.form.prompt = val;
        const promptTextarea = document.getElementById('promptInput');
        if (promptTextarea) promptTextarea.value = val;
        navigateTo('studio');
        triggerAdGeneration();
      } else {
        navigateTo('studio');
      }
    });

    teaserInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') teaserBtn.click();
    });
  }

  // Teaser prompt chips
  document.querySelectorAll('.prompt-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const promptText = chip.dataset.prompt;
      const brandText = chip.dataset.brand || '';
      if (promptText) {
        state.form.prompt = promptText;
        state.form.brand = brandText;
        const promptEl = document.getElementById('promptInput');
        const brandEl = document.getElementById('brandInput');
        if (promptEl) promptEl.value = promptText;
        if (brandEl) brandEl.value = brandText;
        navigateTo('studio');
      }
    });
  });

  /* =========================================================
     STUDIO FORM CONTROLS
     ========================================================= */
  // Duration selector
  document.querySelectorAll('.duration-card').forEach(card => {
    card.addEventListener('click', () => {
      document.querySelectorAll('.duration-card').forEach(c => c.classList.remove('active'));
      card.classList.add('active');
      state.form.duration = parseInt(card.dataset.seconds, 10);
      updateInspector();
    });
  });

  // Aspect Ratio selector
  document.querySelectorAll('.ratio-card').forEach(card => {
    card.addEventListener('click', () => {
      document.querySelectorAll('.ratio-card').forEach(c => c.classList.remove('active'));
      card.classList.add('active');
      state.form.aspect_ratio = card.dataset.ratio;
      updateInspector();
    });
  });

  // Visual Style selector
  document.querySelectorAll('.style-card').forEach(card => {
    card.addEventListener('click', () => {
      document.querySelectorAll('.style-card').forEach(c => c.classList.remove('active'));
      card.classList.add('active');
      state.form.visual_style = card.dataset.style;
      updateInspector();
    });
  });

  // Mood selector
  document.querySelectorAll('.mood-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      document.querySelectorAll('.mood-pill').forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      state.form.mood = pill.dataset.mood;
      updateInspector();
    });
  });

  // Audio Toggles
  const voToggle = document.getElementById('toggleVO');
  if (voToggle) {
    voToggle.addEventListener('change', (e) => {
      state.form.has_vo = e.target.checked;
      updateInspector();
    });
  }

  const bgmToggle = document.getElementById('toggleBGM');
  if (bgmToggle) {
    bgmToggle.addEventListener('change', (e) => {
      state.form.has_bgm = e.target.checked;
      updateInspector();
    });
  }

  // Surprise Me / Inspiration generator
  const surpriseBtn = document.getElementById('btnSurpriseMe');
  if (surpriseBtn) {
    surpriseBtn.addEventListener('click', () => {
      const pick = surprisePrompts[Math.floor(Math.random() * surprisePrompts.length)];
      applyPresetToForm(pick);
      showToast(`Loaded inspiration: ${pick.brand}`);
    });
  }

  // Enhance Prompt button
  const enhanceBtn = document.getElementById('btnEnhancePrompt');
  if (enhanceBtn) {
    enhanceBtn.addEventListener('click', () => {
      const promptEl = document.getElementById('promptInput');
      if (!promptEl || !promptEl.value.trim()) {
        showToast("Enter a product prompt first to enhance!");
        return;
      }
      const additions = [
        "cinematic lighting, ultra-detailed textures, 8k resolution, photorealistic masterwork, anamorphic lens flares",
        "shot on ARRI Alexa 35, slow motion 120fps, volumetric mist, award-winning Super Bowl commercial aesthetic",
        "striking chiaroscuro shadows, high fashion editorial composition, octane render with pristine reflections"
      ];
      const addition = additions[Math.floor(Math.random() * additions.length)];
      promptEl.value = `${promptEl.value.trim()}, ${addition}`;
      state.form.prompt = promptEl.value;
      showToast("Prompt enhanced with cinematic production cues!");
    });
  }

  // Quick inspire items in sidebar
  document.querySelectorAll('.inspire-item').forEach(item => {
    item.addEventListener('click', () => {
      const promptEl = document.getElementById('promptInput');
      const brandEl = document.getElementById('brandInput');
      const p = item.dataset.prompt;
      const b = item.dataset.brand;
      if (promptEl) promptEl.value = p;
      if (brandEl) brandEl.value = b;
      state.form.prompt = p;
      state.form.brand = b;
      showToast(`Loaded ${b}`);
    });
  });

  function applyPresetToForm(preset) {
    state.form.prompt = preset.prompt;
    state.form.brand = preset.brand;
    state.form.duration = preset.duration || 30;
    state.form.aspect_ratio = preset.ratio || '16:9';
    state.form.visual_style = preset.style || 'Cinematic';
    state.form.mood = preset.mood || 'Energetic';

    const promptEl = document.getElementById('promptInput');
    const brandEl = document.getElementById('brandInput');
    if (promptEl) promptEl.value = preset.prompt;
    if (brandEl) brandEl.value = preset.brand;

    // Update Duration UI
    document.querySelectorAll('.duration-card').forEach(c => {
      c.classList.toggle('active', parseInt(c.dataset.seconds, 10) === state.form.duration);
    });

    // Update Ratio UI
    document.querySelectorAll('.ratio-card').forEach(c => {
      c.classList.toggle('active', c.dataset.ratio === state.form.aspect_ratio);
    });

    // Update Style UI
    document.querySelectorAll('.style-card').forEach(c => {
      c.classList.toggle('active', c.dataset.style === state.form.visual_style);
    });

    // Update Mood UI
    document.querySelectorAll('.mood-pill').forEach(p => {
      p.classList.toggle('active', p.dataset.mood === state.form.mood);
    });

    updateInspector();
  }

  function updateInspector() {
    const estScenes = state.form.duration <= 10 ? 3 : (state.form.duration <= 15 ? 4 : (state.form.duration <= 30 ? 5 : 7));
    const specDuration = document.getElementById('specDuration');
    const specRatio = document.getElementById('specRatio');
    const specStyle = document.getElementById('specStyle');
    const specMood = document.getElementById('specMood');
    const specScenes = document.getElementById('specScenes');

    if (specDuration) specDuration.innerText = `${state.form.duration} seconds`;
    if (specRatio) specRatio.innerText = state.form.aspect_ratio;
    if (specStyle) specStyle.innerText = state.form.visual_style;
    if (specMood) specMood.innerText = state.form.mood;
    if (specScenes) specScenes.innerText = `${estScenes} scenes`;
  }

  /* =========================================================
     GENERATE ADVERTISEMENT ACTION
     ========================================================= */
  const generateMainBtn = document.getElementById('btnGenerateMain');
  if (generateMainBtn) {
    generateMainBtn.addEventListener('click', () => {
      triggerAdGeneration();
    });
  }

  async function triggerAdGeneration() {
    const promptEl = document.getElementById('promptInput');
    const brandEl = document.getElementById('brandInput');

    const promptText = promptEl ? promptEl.value.trim() : state.form.prompt;
    const brandText = brandEl ? brandEl.value.trim() : state.form.brand;

    if (!promptText) {
      showToast("Please enter a product or advertisement concept prompt!");
      if (promptEl) promptEl.focus();
      return;
    }

    state.form.prompt = promptText;
    state.form.brand = brandText || "AdMotion Flow";

    // Show Progress Overlay
    const overlay = document.getElementById('generationOverlay');
    const statusText = document.getElementById('genStatusText');
    const subtext = document.getElementById('genSubtext');
    const fill = document.getElementById('genProgressFill');

    if (overlay) overlay.classList.add('active');

    // Simulate multi-step AI pipeline
    const steps = [
      { pct: 20, status: "Analyzing brand hook & psychology...", sub: "Evaluating emotional angles and pattern interrupts" },
      { pct: 45, status: "Synthesizing voiceover narrative script...", sub: "Structuring persuasive pacing and rhythm" },
      { pct: 70, status: "Directing cinematic storyboard & camera motion...", sub: "Calculating lens angles, lighting, and transitions" },
      { pct: 90, status: "Generating video prompts (Sora / Runway Gen-3)...", sub: "Compiling 8K prompt metadata" }
    ];

    let currentStep = 0;
    const stepInterval = setInterval(() => {
      if (currentStep < steps.length) {
        const s = steps[currentStep];
        if (statusText) statusText.innerText = s.status;
        if (subtext) subtext.innerText = s.sub;
        if (fill) fill.style.width = `${s.pct}%`;
        currentStep++;
      }
    }, 600);

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(state.form)
      });

      const data = await response.json();
      clearInterval(stepInterval);

      if (fill) fill.style.width = '100%';
      if (statusText) statusText.innerText = "Ad campaign synthesized successfully!";

      setTimeout(() => {
        if (overlay) overlay.classList.remove('active');
        if (data.success && data.project) {
          state.currentProject = data.project;
          renderResultsView(data.project);
          navigateTo('results');
          showToast("Campaign ready for preview!");
        } else {
          showToast("Failed to generate campaign. Please retry.");
        }
      }, 500);

    } catch (err) {
      clearInterval(stepInterval);
      if (overlay) overlay.classList.remove('active');
      console.error(err);
      showToast("Error connecting to server. Please check connection.");
    }
  }

  /* =========================================================
     RESULTS WORKSPACE RENDERING
     ========================================================= */
  function renderResultsView(project) {
    // 1. Meta Badges & Title
    const titleEl = document.getElementById('resultCampaignTitle');
    const brandBadge = document.getElementById('resultBrandBadge');
    const ratioBadge = document.getElementById('resultRatioBadge');
    const durationBadge = document.getElementById('resultDurationBadge');
    const styleBadge = document.getElementById('resultStyleBadge');

    if (titleEl) titleEl.innerText = project.title;
    if (brandBadge) brandBadge.innerText = project.brand;
    if (ratioBadge) ratioBadge.innerText = project.aspect_ratio;
    if (durationBadge) durationBadge.innerText = `${project.duration}s`;
    if (styleBadge) styleBadge.innerText = project.visual_style;

    // 2. Marketing Hook
    const hookTextEl = document.getElementById('resultHookText');
    const hookTypeBadge = document.getElementById('resultHookType');
    if (hookTextEl) hookTextEl.innerText = `"${project.hook}"`;
    if (hookTypeBadge) hookTypeBadge.innerText = project.hook_type || 'Pattern Interrupt';

    // 3. Voiceover Script & Metrics
    const scriptEl = document.getElementById('resultScriptContent');
    const wordCountEl = document.getElementById('scriptWordCount');
    const charCountEl = document.getElementById('scriptCharCount');

    if (scriptEl) scriptEl.innerText = project.script || 'No voiceover generated for this campaign.';
    if (wordCountEl) {
      const words = project.script ? project.script.trim().split(/\s+/).length : 0;
      wordCountEl.innerText = words;
    }
    if (charCountEl) {
      charCountEl.innerText = project.script ? project.script.length : 0;
    }

    // 4. Render Scene-by-Scene Storyboard Grid
    const scenesGrid = document.getElementById('storyboardScenesGrid');
    if (scenesGrid && project.scenes) {
      scenesGrid.innerHTML = '';
      project.scenes.forEach((scene, index) => {
        const card = createSceneCard(scene, index, project);
        scenesGrid.appendChild(card);
      });
    }

    // 5. Initialize & Load Video Player
    player.loadProject(project);
  }

  function createSceneCard(scene, index, project) {
    const card = document.createElement('div');
    card.className = 'scene-card glass-glow';
    card.dataset.sceneIndex = index;

    const colors = scene.color_palette || ['#8B5CF6', '#00F0FF', '#0F172A'];

    card.innerHTML = `
      <div class="scene-visual-thumb" style="background: radial-gradient(circle at 50% 50%, ${colors[0]}44 0%, #06070a 100%);">
        <canvas class="scene-thumb-canvas" width="360" height="160"></canvas>
        <div class="scene-thumb-badges">
          <span class="scene-num-badge">Scene 0${scene.scene_number}</span>
          <span class="scene-dur-badge">${scene.duration}s</span>
        </div>
      </div>
      <div class="scene-body">
        <h4 class="scene-title-text">${scene.title}</h4>
        
        <div class="scene-meta-pill-group">
          <div class="scene-meta-pill">
            <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
              <circle cx="12" cy="13" r="4"></circle>
            </svg>
            <span><strong>Camera:</strong> ${scene.camera_movement}</span>
          </div>
          <div class="scene-meta-pill">
            <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <polygon points="5 3 19 12 5 21 5 3"></polygon>
            </svg>
            <span><strong>Transition:</strong> ${scene.transition}</span>
          </div>
        </div>

        <p style="font-size: 0.85rem; color: #94a3b8; line-height: 1.5;">
          ${scene.visual_description}
        </p>

        <div class="scene-vo-box">
          "${scene.voiceover}"
        </div>

        <div class="scene-prompt-box">
          <div class="scene-prompt-header">
            <span class="scene-prompt-title">AI Video Prompt (Sora / Runway)</span>
            <button class="btn btn-ghost btn-sm btn-copy-prompt" style="padding: 2px 8px; font-size: 0.72rem;">
              <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
              </svg>
              Copy
            </button>
          </div>
          <p class="scene-prompt-text">${scene.prompt}</p>
        </div>

        <div class="scene-actions-footer">
          <button class="btn btn-secondary btn-sm btn-jump-scene">
            <svg width="12" height="12" fill="currentColor" viewBox="0 0 24 24">
              <polygon points="5 3 19 12 5 21 5 3"></polygon>
            </svg>
            Play Scene
          </button>
          <button class="btn btn-ghost btn-sm btn-regen-scene">
            <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <polyline points="23 4 23 10 17 10"></polyline>
              <polyline points="1 20 1 14 7 14"></polyline>
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
            </svg>
            Regenerate
          </button>
        </div>
      </div>
    `;

    // Draw mini thumbnail canvas
    setTimeout(() => {
      const thumbCanvas = card.querySelector('.scene-thumb-canvas');
      if (thumbCanvas) {
        drawThumbnailPreview(thumbCanvas, scene, colors);
      }
    }, 50);

    // Copy Prompt handler
    const copyBtn = card.querySelector('.btn-copy-prompt');
    if (copyBtn) {
      copyBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        navigator.clipboard.writeText(scene.prompt);
        showToast(`Scene 0${scene.scene_number} video prompt copied!`);
      });
    }

    // Jump to Scene in Player
    const jumpBtn = card.querySelector('.btn-jump-scene');
    if (jumpBtn) {
      jumpBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        let targetSec = 0;
        for (let i = 0; i < index; i++) {
          targetSec += project.scenes[i].duration || 5;
        }
        player.seekTo(targetSec);
        player.play();
        window.scrollTo({ top: 180, behavior: 'smooth' });
      });
    }

    // Regenerate Scene handler
    const regenBtn = card.querySelector('.btn-regen-scene');
    if (regenBtn) {
      regenBtn.addEventListener('click', async (e) => {
        e.stopPropagation();
        regenBtn.disabled = true;
        regenBtn.innerText = "Regenerating...";
        try {
          const res = await fetch('/api/regenerate-scene', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              scenes: project.scenes,
              scene_index: index,
              instruction: "Elevate lighting and kinetic motion"
            })
          });
          const d = await res.json();
          if (d.success && d.scenes) {
            project.scenes = d.scenes;
            renderResultsView(project);
            showToast(`Scene 0${index + 1} regenerated with new camera angle & prompt!`);
          }
        } catch(err) {
          console.error(err);
          showToast("Failed to regenerate scene");
        } finally {
          regenBtn.disabled = false;
        }
      });
    }

    return card;
  }

  function drawThumbnailPreview(canvas, scene, colors) {
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;

    ctx.clearRect(0, 0, w, h);

    // Gradient background
    const grad = ctx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, colors[0] || '#8B5CF6');
    grad.addColorStop(0.5, '#0B0F19');
    grad.addColorStop(1, colors[1] || '#00F0FF');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Glowing geometric shapes
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, 45, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.font = '600 12px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`SCENE 0${scene.scene_number}`, w / 2, h / 2 + 4);
  }

  /* =========================================================
     EXPORT & SCRIPT ACTIONS
     ========================================================= */
  const btnCopyScript = document.getElementById('btnCopyScript');
  if (btnCopyScript) {
    btnCopyScript.addEventListener('click', () => {
      if (state.currentProject && state.currentProject.script) {
        navigator.clipboard.writeText(state.currentProject.script);
        showToast("Voiceover script copied to clipboard!");
      }
    });
  }

  const btnPlayVO = document.getElementById('btnPlayVO');
  if (btnPlayVO) {
    btnPlayVO.addEventListener('click', () => {
      if (state.currentProject && state.currentProject.script && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(state.currentProject.script);
        u.rate = 1.05;
        window.speechSynthesis.speak(u);
        showToast("Playing full voiceover narration...");
      }
    });
  }

  const btnCopyAllPrompts = document.getElementById('btnCopyAllPrompts');
  if (btnCopyAllPrompts) {
    btnCopyAllPrompts.addEventListener('click', () => {
      if (!state.currentProject || !state.currentProject.scenes) return;
      const allPrompts = state.currentProject.scenes.map(s => (
        `// SCENE 0${s.scene_number} (${s.duration}s) - ${s.title}\n${s.prompt}\n`
      )).join('\n');
      navigator.clipboard.writeText(allPrompts);
      showToast("All video prompts copied for batch generation!");
    });
  }

  const btnSaveProject = document.getElementById('btnSaveProject');
  if (btnSaveProject) {
    btnSaveProject.addEventListener('click', async () => {
      if (!state.currentProject) return;
      try {
        const res = await fetch('/api/projects', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(state.currentProject)
        });
        const data = await res.json();
        if (data.success) {
          showToast("Campaign saved to your Projects library!");
          fetchProjects();
        }
      } catch (err) {
        console.error(err);
        showToast("Error saving project");
      }
    });
  }

  // Export Modal
  const btnOpenExport = document.getElementById('btnOpenExport');
  const exportModal = document.getElementById('exportModal');
  const closeModalBtn = document.getElementById('closeModalBtn');

  if (btnOpenExport && exportModal) {
    btnOpenExport.addEventListener('click', () => {
      exportModal.classList.add('active');
    });
  }

  if (closeModalBtn && exportModal) {
    closeModalBtn.addEventListener('click', () => {
      exportModal.classList.remove('active');
    });
  }

  // Export as JSON
  const btnDownloadJSON = document.getElementById('btnDownloadJSON');
  if (btnDownloadJSON) {
    btnDownloadJSON.addEventListener('click', () => {
      if (!state.currentProject) return;
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state.currentProject, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `${state.currentProject.title.toLowerCase().replace(/[^a-z0-9]/g, '-')}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      showToast("Downloaded campaign JSON file!");
    });
  }

  // Export as Markdown
  const btnDownloadMD = document.getElementById('btnDownloadMD');
  if (btnDownloadMD) {
    btnDownloadMD.addEventListener('click', () => {
      if (!state.currentProject) return;
      const p = state.currentProject;
      let md = `# ${p.title}\n\n`;
      md += `**Brand:** ${p.brand}  \n`;
      md += `**Duration:** ${p.duration}s | **Aspect Ratio:** ${p.aspect_ratio} | **Style:** ${p.visual_style}  \n`;
      md += `**Hook (${p.hook_type}):** "${p.hook}"\n\n`;
      md += `## Voiceover Script\n${p.script}\n\n`;
      md += `## Storyboard & Video Prompts\n\n`;
      p.scenes.forEach(s => {
        md += `### Scene 0${s.scene_number}: ${s.title} (${s.duration}s)\n`;
        md += `* **Camera:** ${s.camera_movement}\n`;
        md += `* **Transition:** ${s.transition}\n`;
        md += `* **Voiceover:** "${s.voiceover}"\n`;
        md += `* **Prompt:** \`${s.prompt}\`\n\n`;
      });

      const dataStr = "data:text/markdown;charset=utf-8," + encodeURIComponent(md);
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `${p.title.toLowerCase().replace(/[^a-z0-9]/g, '-')}-storyboard.md`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      showToast("Downloaded campaign Markdown!");
    });
  }

  // Print Storyboard
  const btnPrintStoryboard = document.getElementById('btnPrintStoryboard');
  if (btnPrintStoryboard) {
    btnPrintStoryboard.addEventListener('click', () => {
      window.print();
    });
  }

  /* =========================================================
     PROJECTS / HISTORY PAGE
     ========================================================= */
  async function fetchProjects() {
    try {
      const res = await fetch('/api/projects');
      const data = await res.json();
      if (data.success && data.projects) {
        state.savedProjects = data.projects;
        renderProjectsGrid(data.projects);

        // Update nav badge count
        const badge = document.getElementById('projectsCountBadge');
        if (badge) badge.innerText = data.projects.length;
      }
    } catch (err) {
      console.error(err);
    }
  }

  function renderProjectsGrid(projects) {
    const grid = document.getElementById('savedProjectsGrid');
    if (!grid) return;

    if (!projects || projects.length === 0) {
      grid.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 60px 0; color: var(--text-muted);">
          <h3>No saved campaigns yet</h3>
          <p style="margin-top: 8px;">Create your first advertisement in the Studio to see it here.</p>
          <button class="btn btn-primary" style="margin-top: 20px;" onclick="document.querySelector('.btn-launch-studio').click()">Open Studio</button>
        </div>
      `;
      return;
    }

    grid.innerHTML = '';
    projects.forEach(p => {
      const card = document.createElement('div');
      card.className = 'glass-panel project-item-card glass-glow';
      card.innerHTML = `
        <div class="proj-top">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
            <span class="ad-badge badge-primary">${p.brand || 'AdMotion'}</span>
            <span style="font-size: 0.75rem; color: var(--text-muted);">${p.aspect_ratio} • ${p.duration}s</span>
          </div>
          <h4 class="proj-title">${p.title}</h4>
          <p class="proj-prompt-preview">${p.prompt}</p>
          <div style="font-size: 0.8rem; color: var(--text-secondary); margin-bottom: 12px;">
            <strong>Hook:</strong> "${p.hook ? p.hook.substring(0, 75) + '...' : ''}"
          </div>
        </div>
        <div class="proj-footer">
          <button class="btn btn-primary btn-sm btn-open-project">
            <svg width="12" height="12" fill="currentColor" viewBox="0 0 24 24">
              <polygon points="5 3 19 12 5 21 5 3"></polygon>
            </svg>
            Open & Play
          </button>
          <button class="btn btn-ghost btn-sm btn-delete-project" style="color: var(--primary-rose);">
            <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
          </button>
        </div>
      `;

      // Open project in results view
      card.querySelector('.btn-open-project').addEventListener('click', () => {
        state.currentProject = p;
        renderResultsView(p);
        navigateTo('results');
      });

      // Delete project
      card.querySelector('.btn-delete-project').addEventListener('click', async (e) => {
        e.stopPropagation();
        if (confirm(`Delete "${p.title}"?`)) {
          await fetch(`/api/projects/${p.id}`, { method: 'DELETE' });
          showToast("Project deleted");
          fetchProjects();
        }
      });

      grid.appendChild(card);
    });
  }

  // Search filter for projects
  const searchInput = document.getElementById('projectsSearchInput');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const q = e.target.value.toLowerCase();
      const filtered = state.savedProjects.filter(p => (
        p.title.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        p.prompt.toLowerCase().includes(q)
      ));
      renderProjectsGrid(filtered);
    });
  }

  /* =========================================================
     TEMPLATES PAGE
     ========================================================= */
  async function fetchTemplates() {
    try {
      const res = await fetch('/api/templates');
      const data = await res.json();
      if (data.success && data.templates) {
        state.templates = data.templates;
        renderTemplatesGrid(data.templates);
      }
    } catch(err) {
      console.error(err);
    }
  }

  function renderTemplatesGrid(templates) {
    const grid = document.getElementById('templatesGrid');
    if (!grid) return;

    grid.innerHTML = '';
    templates.forEach(t => {
      const card = document.createElement('div');
      card.className = 'glass-panel template-card glass-glow';
      card.innerHTML = `
        <div class="template-header">
          <span class="template-tag">${t.tag}</span>
          <h4 class="template-title">${t.title}</h4>
          <p class="template-desc">${t.description}</p>
          <div class="template-specs">
            <span class="ad-badge badge-cyan">${t.aspect_ratio}</span>
            <span class="ad-badge">${t.duration}s</span>
            <span class="ad-badge">${t.visual_style}</span>
            <span class="ad-badge">${t.mood}</span>
          </div>
        </div>
        <button class="btn btn-cyan btn-use-template" style="width: 100%;">
          Use This Template
          <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <line x1="5" y1="12" x2="19" y2="12"></line>
            <polyline points="12 5 19 12 12 19"></polyline>
          </svg>
        </button>
      `;

      card.querySelector('.btn-use-template').addEventListener('click', () => {
        applyPresetToForm({
          prompt: t.prompt,
          brand: t.brand,
          duration: t.duration,
          ratio: t.aspect_ratio,
          style: t.visual_style,
          mood: t.mood
        });
        navigateTo('studio');
        showToast(`Loaded ${t.title} template into Studio!`);
      });

      grid.appendChild(card);
    });
  }

  /* =========================================================
     TOAST SYSTEM
     ========================================================= */
  function showToast(message) {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `
      <svg width="16" height="16" fill="none" stroke="#00F0FF" stroke-width="2" viewBox="0 0 24 24">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
        <polyline points="22 4 12 14.01 9 11.01"></polyline>
      </svg>
      <span>${message}</span>
    `;

    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }

  // Pre-load projects on launch for badge count
  fetchProjects();
  updateInspector();
});

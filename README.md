# AdMotion AI — Turn Text Prompts into High-Converting Animated Ads

**AdMotion AI** is a production-grade AI advertising creation studio web application. It transforms product concepts into commercial marketing hooks, persuasive voiceover scripts, scene-by-scene cinematic storyboards, and production-ready prompts for OpenAI Sora, Runway Gen-3, Luma Dream Machine, and Midjourney.

---

## 🚀 Features

- **Futuristic SaaS Dark Interface:** Glassmorphism, electric purple & cyan accents, responsive layout.
- **AI Ad Creator Workspace:**
  - Full prompt input with "Enhance Prompt" & "Surprise Me" idea generators.
  - Duration selector: 10s, 15s, 30s, 60s with automatic scene pacing.
  - Multi-ratio framing: 9:16 (TikTok/Reels), 16:9 (Cinema/Desktop), 1:1 (Social Feeds).
  - 6 Visual styles: Cinematic, Luxury, Futuristic, Realistic, 3D Cartoon, Minimal.
  - 5 Mood presets: Energetic, Premium, Dramatic, Emotional, Playful.
  - Audio direction toggles (Voiceover narration & background music synth).
- **Interactive Storyboard & Preview Player:**
  - Real-time procedural canvas animation with simulated Ken Burns pan/zoom and particle effects.
  - Synchronized subtitle HUD.
  - Web Speech API voiceover narration that reads the script aloud in the browser.
  - Web Audio API ambient background music synthesizer.
  - Per-scene regeneration and one-click video prompt copying.
- **Campaign Persistence & History:** SQLite database with pre-seeded showcase campaigns (Aura Neo, Velvet & Ember, VoltDrive).
- **Advertisement Templates:** Pre-engineered blueprints for SaaS, Luxury Watches, Energy Drinks, Cyberpunk Audio, Clean Skincare, and Fintech.
- **Export Formats:** One-click batch prompt copying, JSON project download, Markdown export, and print-ready PDF view.

---

## 🛠 Tech Stack

- **Backend:** Python 3.14 + Tornado Async HTTP & REST API + SQLite3
- **Frontend:** HTML5, CSS3 Glassmorphism, Vanilla JavaScript (ES6+ modular)
- **Audio Engine:** Web Speech API (TTS) + Web Audio API (Synthesizer)

---

## ⚡ Quick Start

To run the server:

```bash
cd /Users/akshgupta/admotion-ai
python3 server.py
```

Then open your browser at:
👉 **[http://127.0.0.1:8000](http://127.0.0.1:8000)**

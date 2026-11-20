"""
AdMotion AI - Database & Storage Layer
SQLite storage for saved ad projects, history, and pre-seeded showcase campaigns.
"""

import sqlite3
import json
import uuid
from datetime import datetime
from pathlib import Path

DB_PATH = Path(__file__).parent / "admotion.db"

def get_db_connection():
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS projects (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            brand TEXT NOT NULL,
            prompt TEXT NOT NULL,
            duration INTEGER NOT NULL,
            aspect_ratio TEXT NOT NULL,
            visual_style TEXT NOT NULL,
            mood TEXT NOT NULL,
            has_vo INTEGER DEFAULT 1,
            has_bgm INTEGER DEFAULT 1,
            hook TEXT NOT NULL,
            hook_type TEXT DEFAULT 'Pattern Interrupt',
            script TEXT NOT NULL,
            scenes_json TEXT NOT NULL,
            created_at TEXT NOT NULL
        )
    """)
    conn.commit()

    # Seed initial demo projects if table is empty
    cursor.execute("SELECT COUNT(*) FROM projects")
    count = cursor.fetchone()[0]
    if count == 0:
        seed_projects(conn)
    conn.close()

def seed_projects(conn):
    cursor = conn.cursor()
    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    sample_projects = [
        {
            "id": "demo-aura-ring",
            "title": "Aura Neo: Sleep That Rewires Your Mind",
            "brand": "Aura Labs",
            "prompt": "Futuristic smart ring that analyzes REM sleep and optimizes brain neuroplasticity through micro-vibrations.",
            "duration": 30,
            "aspect_ratio": "9:16",
            "visual_style": "Futuristic",
            "mood": "Premium",
            "has_vo": 1,
            "has_bgm": 1,
            "hook": "What if you could upgrade your cognitive bandwidth while unconscious?",
            "hook_type": "Curiosity Gap",
            "script": "Your mind isn't tired. It's uncalibrated. Meet Aura Neo. Built from aeronautic liquid titanium with bio-photonic neural sensors. While you sleep, Neo maps three hundred trillion synaptic transitions. Waking up isn't a struggle anymore. It's a calculated superpower. Aura Neo. Sleep ahead.",
            "scenes": [
                {
                    "scene_number": 1,
                    "duration": 5,
                    "title": "The Infinite Void & Awakening",
                    "visual_description": "Extreme close-up of a human iris dilating as neon cyan neural pathways reflect inside the pupil. Midnight black background with floating holographic dust.",
                    "camera_movement": "Slow forward macro zoom with subtle rotational drift (120fps)",
                    "transition": "Hyper-speed optical light streak transition",
                    "voiceover": "Your mind isn't tired. It's uncalibrated.",
                    "prompt": "Cinematic 8k close-up shot of human eye dilating, glowing cyan neural network reflections inside pupil, dark cyber studio lighting, shot on ARRI Alexa Mini, anamorphic bokeh, hyper-detailed, photorealistic, 120fps.",
                    "color_palette": ["#00F0FF", "#0A0B1A", "#7928CA"]
                },
                {
                    "scene_number": 2,
                    "duration": 6,
                    "title": "Liquid Titanium Reveal",
                    "visual_description": "The Aura Neo ring floating weightlessly in micro-gravity. Liquid metal ribbons wrap around the outer chassis, locking into an ultra-matte midnight finish.",
                    "camera_movement": "360-degree orbital rotation with smooth focal shift from rim to inner sensors",
                    "transition": "Electromagnetic pulse wave distortion cut",
                    "voiceover": "Meet Aura Neo. Aeronautic liquid titanium with bio-photonic neural sensors.",
                    "prompt": "Commercial product shot of futuristic smart ring floating in zero gravity, liquid obsidian metal coalescing into smooth band, subtle neon violet glowing bio-sensors on inner ring, studio lighting, Octane Render, 8k.",
                    "color_palette": ["#7928CA", "#111827", "#3B82F6"]
                },
                {
                    "scene_number": 3,
                    "duration": 7,
                    "title": "Neural Mapping & Synaptic Flow",
                    "visual_description": "A resting silhouette bathed in ambient violet bioluminescence. A digital twin wireframe reveals REM waves aligning into perfect harmonic resonance.",
                    "camera_movement": "Slow crane glide across resting subject with holographic depth layers",
                    "transition": "Particle dissolve into crystalline lattice",
                    "voiceover": "While you sleep, Neo maps three hundred trillion synaptic transitions.",
                    "prompt": "Futuristic bedroom scene, cyberpunk minimalism, elegant sleeper with ethereal violet brainwave holograms hovering above, soft volumetric lighting, cinematic mood, film grain, photorealistic.",
                    "color_palette": ["#8B5CF6", "#06B6D4", "#030712"]
                },
                {
                    "scene_number": 4,
                    "duration": 6,
                    "title": "The Clarity Burst",
                    "visual_description": "Subject opens eyes in morning golden hour mixed with electric blue ambient lighting. Instant focus, ultra-crisp motion graphics showing peak alertness index 99.4%.",
                    "camera_movement": "Rapid snap zoom into subject's energized expression, tilting upward",
                    "transition": "Lens flare flash into final hero packshot",
                    "voiceover": "Waking up isn't a struggle anymore. It's a calculated superpower.",
                    "prompt": "Cinematic portrait shot of focused protagonist waking up feeling energized, high-key sunrise rays through futuristic penthouse windows, electric cyan biometric HUD, cinematic color grading.",
                    "color_palette": ["#38BDF8", "#F59E0B", "#0F172A"]
                },
                {
                    "scene_number": 5,
                    "duration": 6,
                    "title": "Hero Lockup & Call To Action",
                    "visual_description": "Aura Neo resting on a levitating magnetic charging pedestal. Glowing typography locks into place: 'AdMotion AI Exclusive Preview - Claim Batch 01'.",
                    "camera_movement": "Slow descending heroic tracking shot settling onto logo lockup",
                    "transition": "Clean fade to black with neon outline pulse",
                    "voiceover": "Aura Neo. Sleep ahead.",
                    "prompt": "Hero commercial packshot of sleek smart ring on black obsidian monolith, subtle cyan laser ring, floating 3D typography, premium luxury tech commercial, masterwork lighting.",
                    "color_palette": ["#00F0FF", "#8B5CF6", "#000000"]
                }
            ]
        },
        {
            "id": "demo-velvet-ember",
            "title": "Velvet & Ember: Midnight Elixir",
            "brand": "Maison Noir",
            "prompt": "Haute perfumery fragrance crafted with smoked cedarwood, midnight bourbon vanilla, and dark amber for luxury nocturnal nightlife.",
            "duration": 15,
            "aspect_ratio": "16:9",
            "visual_style": "Luxury",
            "mood": "Dramatic",
            "has_vo": 1,
            "has_bgm": 1,
            "hook": "Some scents enter a room. This one claims it.",
            "hook_type": "Status Transformation",
            "script": "Some scents enter a room. This one claims it. Smoked cedarwood meets midnight vanilla. Velvet & Ember. Leave an echo.",
            "scenes": [
                {
                    "scene_number": 1,
                    "duration": 4,
                    "title": "The Smoke & Sparks",
                    "visual_description": "Charcoal embers glowing crimson in slow motion. Whimsical ribbons of fragrant aromatic smoke curling into an ethereal bottle silhouette.",
                    "camera_movement": "Slow high-speed phantom flex tracking along glowing ember sparks",
                    "transition": "Deep shadow wipe with amber glow edge",
                    "voiceover": "Some scents enter a room.",
                    "prompt": "Ultra high speed Phantom 4k macro footage of glowing wooden embers releasing golden sparks and velvet aromatic smoke, moody black atmosphere, high fashion fragrance commercial.",
                    "color_palette": ["#F97316", "#1C1917", "#7C2D12"]
                },
                {
                    "scene_number": 2,
                    "duration": 4,
                    "title": "The Midnight Elixir",
                    "visual_description": "A flacon of heavy crystal with smoked amber liquid dropping from an antique pipette. Gold leaf lettering shimmers in candlelight.",
                    "camera_movement": "Dutch angle pan across faceted crystal flacon highlights",
                    "transition": "Liquid droplet ripples into glass surface",
                    "voiceover": "This one claims it.",
                    "prompt": "Luxury perfume bottle crafted from heavy obsidian crystal, amber perfume liquid backlit by warm candlelight, golden foil typography, cinematic luxury aesthetic, 8k render.",
                    "color_palette": ["#D97706", "#451A03", "#0A0A0A"]
                },
                {
                    "scene_number": 3,
                    "duration": 4,
                    "title": "The Botanical Infusion",
                    "visual_description": "Rich bourbon vanilla pods bursting with crystalline spice against dark raw cedarwood bark. Luxurious textures in macro detail.",
                    "camera_movement": "Smooth gliding macro slider shot at 60fps",
                    "transition": "Soft velvet defocus transition",
                    "voiceover": "Smoked cedarwood meets midnight vanilla.",
                    "prompt": "Sensory macro shot of bourbon vanilla bean pods split open with shimmering sugar crystals, dark aged cedarwood planks, soft golden rim lighting, luxury editorial style.",
                    "color_palette": ["#B45309", "#292524", "#FEF3C7"]
                },
                {
                    "scene_number": 4,
                    "duration": 3,
                    "title": "Hero Signature",
                    "visual_description": "The complete Maison Noir bottle framed against a velvet black curtain with a single beam of dramatic top light. Tagline appears.",
                    "camera_movement": "Slow monumental pullback revealing full bottle and logo",
                    "transition": "Soft burn out into brand mark",
                    "voiceover": "Velvet & Ember. Leave an echo.",
                    "prompt": "Monumental luxury fragrance hero shot, centered composition, dramatic chiaroscuro lighting, crystal bottle glowing with inner warmth, high fashion branding, Vogue elegance.",
                    "color_palette": ["#F59E0B", "#18181B", "#000000"]
                }
            ]
        },
        {
            "id": "demo-hyperfocus-drink",
            "title": "VoltDrive: Uncapped Biological Energy",
            "brand": "VoltDrive",
            "prompt": "Electrifying zero-sugar nootropic energy drink engineered for high-performance esports players, coders, and founders.",
            "duration": 15,
            "aspect_ratio": "9:16",
            "visual_style": "Cinematic",
            "mood": "Energetic",
            "has_vo": 1,
            "has_bgm": 1,
            "hook": "Crash is an engineering flaw. We eliminated it.",
            "hook_type": "Pain-to-Pleasure",
            "script": "Crash is an engineering flaw. We eliminated it. 200mg sustained clean botanical focus. No jitter. No sugar. Just absolute flow state. Crack open VoltDrive.",
            "scenes": [
                {
                    "scene_number": 1,
                    "duration": 3,
                    "title": "The Heartbeat Spike",
                    "visual_description": "Rapid glitch cuts of a weary gamer slumping at 3 AM, instantly shattered by an electric neon blue lightning bolt across the screen.",
                    "camera_movement": "Fast whip zoom and chromatic aberration pulse",
                    "transition": "Strobe lightning flash cut",
                    "voiceover": "Crash is an engineering flaw. We eliminated it.",
                    "prompt": "High energy action cut, dramatic dark room, neon blue electricity arc illuminating exhausted face, instant transition to dynamic motion, hyper-stylized action commercial.",
                    "color_palette": ["#3B82F6", "#06B6D4", "#0F172A"]
                },
                {
                    "scene_number": 2,
                    "duration": 4,
                    "title": "The Ice Cold Can Eruption",
                    "visual_description": "A frosted matte black aluminum can spinning through explosive crystalline ice cubes and surging neon cyan condensation droplets.",
                    "camera_movement": "Ultra dynamic 3D spiral camera revolving around the ascending can",
                    "transition": "Sonic boom condensation shockwave",
                    "voiceover": "200mg sustained clean botanical focus.",
                    "prompt": "Explosive commercial shot of matte black energy drink can bursting through shattering ice cubes, crystalline water droplets flying in slow motion, neon cyan lighting, 8k Octane.",
                    "color_palette": ["#00F0FF", "#1E1B4B", "#FFFFFF"]
                },
                {
                    "scene_number": 3,
                    "duration": 4,
                    "title": "The Tab Pop & Soundwave",
                    "visual_description": "Extreme macro of the aluminum can tab bursting open. A visible sonic aura and glowing effervescent bubbles race upward.",
                    "camera_movement": "Rapid tracking zoom directly into the opening mouth of the can",
                    "transition": "Fizzy bubble particle wipe",
                    "voiceover": "No jitter. No sugar. Just absolute flow state.",
                    "prompt": "Extreme macro shot of soda can tab cracking open, high pressure mist and glowing neon fizz bursting outward, dark studio backdrop, crisp cinematic lighting.",
                    "color_palette": ["#60A5FA", "#2563EB", "#090D16"]
                },
                {
                    "scene_number": 4,
                    "duration": 4,
                    "title": "Full Velocity Call To Action",
                    "visual_description": "The VoltDrive can standing bold with electric currents crawling up its sides. Bold glowing typography: 'FUEL YOUR FLOW'.",
                    "camera_movement": "Heroic push-in with electric sparks showering the frame",
                    "transition": "Electric flash into final social handles",
                    "voiceover": "Crack open VoltDrive.",
                    "prompt": "Hero packshot of VoltDrive energy drink can on wet reflective asphalt, electric blue plasma arcs, bold neon text, high-octane esports aesthetic, masterpiece.",
                    "color_palette": ["#06B6D4", "#3B82F6", "#000000"]
                }
            ]
        }
    ]

    for p in sample_projects:
        cursor.execute("""
            INSERT OR REPLACE INTO projects
            (id, title, brand, prompt, duration, aspect_ratio, visual_style, mood, has_vo, has_bgm, hook, hook_type, script, scenes_json, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            p["id"],
            p["title"],
            p["brand"],
            p["prompt"],
            p["duration"],
            p["aspect_ratio"],
            p["visual_style"],
            p["mood"],
            p["has_vo"],
            p["has_bgm"],
            p["hook"],
            p["hook_type"],
            p["script"],
            json.dumps(p["scenes"]),
            now
        ))
    conn.commit()

def save_project(data):
    conn = get_db_connection()
    cursor = conn.cursor()
    project_id = data.get("id") or f"ad-{uuid.uuid4().hex[:10]}"
    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    scenes_json = data.get("scenes_json")
    if not isinstance(scenes_json, str):
        scenes_json = json.dumps(data.get("scenes", []))

    cursor.execute("""
        INSERT OR REPLACE INTO projects
        (id, title, brand, prompt, duration, aspect_ratio, visual_style, mood, has_vo, has_bgm, hook, hook_type, script, scenes_json, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        project_id,
        data.get("title", "Untitled Campaign"),
        data.get("brand", "AdMotion Project"),
        data.get("prompt", ""),
        int(data.get("duration", 30)),
        data.get("aspect_ratio", "16:9"),
        data.get("visual_style", "Cinematic"),
        data.get("mood", "Energetic"),
        1 if data.get("has_vo", True) else 0,
        1 if data.get("has_bgm", True) else 0,
        data.get("hook", ""),
        data.get("hook_type", "Pattern Interrupt"),
        data.get("script", ""),
        scenes_json,
        now
    ))
    conn.commit()
    conn.close()
    return project_id

def get_all_projects():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM projects ORDER BY created_at DESC")
    rows = cursor.fetchall()
    projects = []
    for r in rows:
        p = dict(r)
        p["scenes"] = json.loads(p["scenes_json"]) if p.get("scenes_json") else []
        projects.append(p)
    conn.close()
    return projects

def get_project_by_id(project_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM projects WHERE id = ?", (project_id,))
    row = cursor.fetchone()
    conn.close()
    if row:
        p = dict(row)
        p["scenes"] = json.loads(p["scenes_json"]) if p.get("scenes_json") else []
        return p
    return None

def delete_project_by_id(project_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM projects WHERE id = ?", (project_id,))
    conn.commit()
    deleted = cursor.rowcount > 0
    conn.close()
    return deleted

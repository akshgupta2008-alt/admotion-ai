"""
AdMotion AI - Intelligent Generation Engine
Generates commercial-grade advertising campaigns, hooks, scripts, storyboards,
camera dynamics, and video-generation prompts for Sora, Runway Gen-3, Midjourney, and Luma.
"""

import re
import random
import uuid

# Visual style palettes and aesthetic rules
STYLE_CONFIGS = {
    "Cinematic": {
        "lighting": "anamorphic flare, moody volumetrics, ARRI Alexa color grade, 35mm film grain, rim light",
        "aesthetic": "hyperrealistic cinematic cinematography, Christopher Nolan tone, widescreen scope, 8k masterpiece",
        "colors": ["#00F0FF", "#3B82F6", "#0B0F19"]
    },
    "Luxury": {
        "lighting": "soft diffused chiaroscuro, warm candlelit ambient glow, high-end studio strobe, subtle gold rim reflections",
        "aesthetic": "Vogue haute-couture commercial, rich obsidian textures, gold leaf details, high-gloss marble reflections",
        "colors": ["#D97706", "#F59E0B", "#18181B"]
    },
    "Futuristic": {
        "lighting": "neon cyan and violet laser lines, cybernetic bioluminescence, hard geometric shadows, holographic glow",
        "aesthetic": "Cyberpunk high-tech minimalism, liquid titanium, clean HUD graphics, Blade Runner meets Apple design",
        "colors": ["#8B5CF6", "#00F0FF", "#030712"]
    },
    "Realistic": {
        "lighting": "natural golden hour sunbeams, genuine documentary handheld texture, clean modern architectural lighting",
        "aesthetic": "authentic Apple / Nike documentary commercial, vibrant true-to-life color reproduction, genuine human emotion",
        "colors": ["#10B981", "#3B82F6", "#1E293B"]
    },
    "3D Cartoon": {
        "lighting": "Pixar / Disney stylized key light, subsurface scattering, bouncy vibrant illumination, soft ambient occlusion",
        "aesthetic": "Pixar 3D animated film render, adorable character dynamics, tactile clay & vinyl materials, joyful render",
        "colors": ["#EC4899", "#8B5CF6", "#FBBF24"]
    },
    "Minimal": {
        "lighting": "ultra-clean Scandinavian shadowless white bounce, brutalist geometric highlights, sterile pristine studio",
        "aesthetic": "Dieter Rams Bauhaus functional minimalism, monochrome balance, spacious composition, typography focus",
        "colors": ["#94A3B8", "#E2E8F0", "#09090B"]
    }
}

CAMERA_MOVEMENTS = [
    "Macro push-in tracking shot decelerating to a dead stop at 120fps",
    "360-degree orbital rotation with smooth focal shift from background to hero subject",
    "Dynamic FPV drone dive angling upward with high-speed motion blur",
    "Cinematic low-angle dolly glide with subtle Dutch tilt and parallax depth",
    "High-speed phantom flex tracking across reflective liquid droplets",
    "Rapid snap zoom into subject's energized expression, tilting upward into the horizon",
    "Monumental slow pullback revealing the entire silhouette framed against volumetric light"
]

TRANSITIONS = [
    "Hyper-speed optical light streak transition",
    "Electromagnetic pulse distortion cut with chromatic flare",
    "Seamless liquid surface ripple transition",
    "Dynamic whip-pan cut with radial motion blur",
    "Particle dissolve into crystalline geometric lattice",
    "High-contrast strobe flash cut with bass drop impact",
    "Smooth focal blur morph into hero packshot"
]

HOOK_TEMPLATES = [
    {"type": "Pattern Interrupt", "template": "Stop scrolling: everything you’ve been told about {concept} is completely obsolete."},
    {"type": "Curiosity Gap", "template": "What happens when you combine {concept} with pure engineering obsession?"},
    {"type": "Pain-to-Pleasure", "template": "Still struggling with ordinary {concept}? Watch what happens in five seconds."},
    {"type": "Status Transformation", "template": "Most people settle for average {concept}. The top 1% choose {brand}."}
]

def parse_duration_to_scenes(duration_seconds):
    """Calculates ideal scene breakdown for ad duration."""
    if duration_seconds <= 10:
        return 3, [3, 4, 3]
    elif duration_seconds <= 15:
        return 4, [3, 4, 4, 4]
    elif duration_seconds <= 30:
        return 5, [5, 6, 7, 6, 6]
    else:  # 60s
        return 7, [7, 8, 9, 9, 9, 9, 9]

def clean_brand_name(brand_input, prompt_input):
    if brand_input and brand_input.strip():
        return brand_input.strip()
    words = prompt_input.split()
    if len(words) >= 2:
        return f"{words[0].capitalize()} {words[1].capitalize()}"
    return "AdMotion Flow"

def extract_core_idea(prompt_text):
    text = prompt_text.strip()
    cleaned = re.sub(r'[^\w\s]', '', text)
    words = cleaned.split()
    if len(words) > 3:
        return " ".join(words[:4])
    return text or "innovative product"

def generate_ad_campaign(data):
    """
    Main generative pipeline. Builds full ad campaign from user parameters.
    """
    prompt = data.get("prompt", "").strip() or "Futuristic autonomous drone for creators"
    brand = clean_brand_name(data.get("brand"), prompt)
    duration = int(data.get("duration", 30))
    aspect_ratio = data.get("aspect_ratio", "16:9")
    visual_style = data.get("visual_style", "Cinematic")
    mood = data.get("mood", "Energetic")
    has_vo = bool(data.get("has_vo", True))
    has_bgm = bool(data.get("has_bgm", True))

    style_cfg = STYLE_CONFIGS.get(visual_style, STYLE_CONFIGS["Cinematic"])
    core_idea = extract_core_idea(prompt)

    # Pick a high-converting hook
    hook_choice = random.choice(HOOK_TEMPLATES)
    hook_text = hook_choice["template"].format(concept=core_idea, brand=brand)

    num_scenes, scene_durations = parse_duration_to_scenes(duration)

    # Narrative arc templates
    scene_roles = [
        {"role": "The Disruption Hook", "desc_theme": "Unexpected visual shock, dramatic atmosphere establishing the conflict or wonder"},
        {"role": "The Core Reveal", "desc_theme": "Hero product / service stepping into dynamic light with micro-details"},
        {"role": "The Mechanism of Action", "desc_theme": "High-tech internal anatomy, kinetic energy, transformation, or capability showcase"},
        {"role": "The Emotional Triumph", "desc_theme": "Protagonist experiencing effortless mastery, elevated speed, or luxury bliss"},
        {"role": "The Climax & CTA", "desc_theme": "Monumental logo lockup, glowing magnetic typography, irresistible call to action"}
    ]

    # Adjust role list to match num_scenes
    if num_scenes == 3:
        active_roles = [scene_roles[0], scene_roles[1], scene_roles[4]]
    elif num_scenes == 4:
        active_roles = [scene_roles[0], scene_roles[1], scene_roles[3], scene_roles[4]]
    elif num_scenes == 5:
        active_roles = scene_roles
    else:  # 7 scenes
        active_roles = [
            scene_roles[0],
            {"role": "The Frustration & Limit", "desc_theme": "High-contrast visual of traditional friction and outdated tools"},
            scene_roles[1],
            scene_roles[2],
            {"role": "Unprecedented Performance", "desc_theme": "Macro physics simulation, kinetic speed trails, peak efficiency"},
            scene_roles[3],
            scene_roles[4]
        ]

    scenes = []
    script_segments = []

    for i, role_info in enumerate(active_roles):
        scene_num = i + 1
        scene_dur = scene_durations[i] if i < len(scene_durations) else 5

        # Script generation per scene
        if i == 0:
            vo_text = hook_text
        elif i == 1:
            vo_text = f"Introducing {brand}. Engineered specifically for those who refuse to compromise on {core_idea}."
        elif i == 2:
            vo_text = f"Powered by next-generation architecture. Instant response, flawless precision, every single time."
        elif i == len(active_roles) - 2:
            vo_text = f"Experience the unfair advantage that elevates your entire workflow."
        elif i == len(active_roles) - 1:
            vo_text = f"{brand}. The future is ready. Are you?"
        else:
            vo_text = f"No bottlenecks. No excuses. Just pure, unadulterated performance."

        if not has_vo:
            vo_text = "[Visual Only - On-Screen Dynamic Text Cue]"

        script_segments.append(vo_text)

        cam_movement = random.choice(CAMERA_MOVEMENTS)
        transition = random.choice(TRANSITIONS) if i < len(active_roles) - 1 else "Fade to black with neon outline pulse"

        # Generate specific prompt for Sora/Runway Gen-3
        sora_prompt = (
            f"Cinematic {aspect_ratio} commercial, {visual_style} aesthetic. "
            f"Scene {scene_num}: {role_info['role']} for {brand}. {prompt}. "
            f"Camera: {cam_movement}. Lighting: {style_cfg['lighting']}. "
            f"{style_cfg['aesthetic']}, photorealistic, 8k render, octane render, masterwork."
        )

        visual_desc = (
            f"{role_info['desc_theme']}. Featuring {brand} in a {visual_style.lower()} setting. "
            f"Backlit with {style_cfg['lighting']}. Ultra-crisp textures and depth of field."
        )

        scenes.append({
            "scene_number": scene_num,
            "duration": scene_dur,
            "title": f"{scene_num}. {role_info['role']}",
            "visual_description": visual_desc,
            "camera_movement": cam_movement,
            "transition": transition,
            "voiceover": vo_text,
            "prompt": sora_prompt,
            "color_palette": style_cfg["colors"]
        })

    full_script = " ".join([s for s in script_segments if s and not s.startswith("[Visual")])

    title_adjectives = ["Next-Gen", "Hyper", "Apex", "Limitless", "Catalyst", "Quantum", "Velvet", "Unleashed"]
    campaign_title = f"{brand}: {random.choice(title_adjectives)} {core_idea.title()}"

    project_data = {
        "id": f"ad-{uuid.uuid4().hex[:8]}",
        "title": campaign_title,
        "brand": brand,
        "prompt": prompt,
        "duration": duration,
        "aspect_ratio": aspect_ratio,
        "visual_style": visual_style,
        "mood": mood,
        "has_vo": has_vo,
        "has_bgm": has_bgm,
        "hook": hook_text,
        "hook_type": hook_choice["type"],
        "script": full_script,
        "scenes": scenes
    }

    return project_data

def regenerate_single_scene(scenes, scene_index, custom_instruction=""):
    """Regenerates or modifies a specific scene in an existing project."""
    if 0 <= scene_index < len(scenes):
        target = scenes[scene_index]
        new_cam = random.choice(CAMERA_MOVEMENTS)
        new_trans = random.choice(TRANSITIONS)
        
        note = f" (Refined: {custom_instruction})" if custom_instruction else ""
        target["camera_movement"] = new_cam
        target["transition"] = new_trans
        target["visual_description"] += note
        target["prompt"] = (
            f"{target['prompt']} Refined camera: {new_cam}. "
            f"Enhanced visual dynamics, studio lighting."
        )
    return scenes

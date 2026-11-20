"""
AdMotion AI - Production Web Server (Tornado + Async REST API)
Serves the modern frontend, handles ad generation, project persistence,
and scene manipulation.
"""

import os
import sys
import json
import logging
from pathlib import Path
import tornado.ioloop
import tornado.web
import tornado.escape

from database import (
    init_db,
    save_project,
    get_all_projects,
    get_project_by_id,
    delete_project_by_id
)
from ai_engine import generate_ad_campaign, regenerate_single_scene

BASE_DIR = Path(__file__).resolve().parent
STATIC_DIR = BASE_DIR / "static"
TEMPLATES_DIR = BASE_DIR / "templates"

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")

# Predefined advertisement templates
TEMPLATES_DATA = [
    {
        "id": "tpl-saas-launch",
        "title": "SaaS Platform Launch",
        "brand": "SynthFlow AI",
        "prompt": "Autonomous multi-agent intelligence workspace that replaces manual project management with self-executing workflows.",
        "duration": 15,
        "aspect_ratio": "16:9",
        "visual_style": "Futuristic",
        "mood": "Energetic",
        "tag": "SaaS / B2B",
        "description": "High-velocity product teaser showcasing live glassmorphic UI, glowing data streams, and lightning-fast execution."
    },
    {
        "id": "tpl-luxury-watch",
        "title": "Haute Horlogerie / Luxury Timepiece",
        "brand": "Chrono Noir",
        "prompt": "Handcrafted tourbillon watch forged from meteorite ore and sapphire crystal, ticking under moody candlelight.",
        "duration": 30,
        "aspect_ratio": "9:16",
        "visual_style": "Luxury",
        "mood": "Premium",
        "tag": "E-Commerce / Luxury",
        "description": "Slow, hypnotic macro cinematography with glowing amber chiaroscuro and 360-degree floating mechanical detail."
    },
    {
        "id": "tpl-fitness-supplement",
        "title": "Athletic Hyper-Focus Drink",
        "brand": "Kinetix Pulse",
        "prompt": "Pre-workout hydration beverage with natural electrolytes, exploding through crystalline ice in an underground gym.",
        "duration": 15,
        "aspect_ratio": "9:16",
        "visual_style": "Cinematic",
        "mood": "Energetic",
        "tag": "Beverage / Fitness",
        "description": "Heart-pounding bass, water splashes, neon cyan condensation droplets, and fast-paced athletic cuts."
    },
    {
        "id": "tpl-cyberpunk-audio",
        "title": "Spatial Audio Cyber Headset",
        "brand": "Vektor Audio",
        "prompt": "Wireless carbon-fiber gaming headset featuring real-time spatial haptics and neon violet RGB soundwave tracking.",
        "duration": 30,
        "aspect_ratio": "16:9",
        "visual_style": "Futuristic",
        "mood": "Dramatic",
        "tag": "Gaming & Tech",
        "description": "Blade Runner inspired rainy rooftop setting, sonic shockwaves, and ultra-crisp audio visualizer graphics."
    },
    {
        "id": "tpl-clean-skincare",
        "title": "Botanical Miracle Serum",
        "brand": "Lumina Botanics",
        "prompt": "Cold-pressed coastal marine algae and squalane restorative facial elixir in a frosted minimalist dropper bottle.",
        "duration": 15,
        "aspect_ratio": "1:1",
        "visual_style": "Minimal",
        "mood": "Emotional",
        "tag": "Beauty & Wellness",
        "description": "Pure morning sunlight, dewy water droplets on lush green botanicals, and silk-smooth application texture."
    },
    {
        "id": "tpl-fintech-card",
        "title": "Black Obsidian Metal Smart Card",
        "brand": "Apex Ledger",
        "prompt": "Heavy tungsten contactless payment card with zero foreign exchange fees and automated micro-yield investments.",
        "duration": 10,
        "aspect_ratio": "9:16",
        "visual_style": "Luxury",
        "mood": "Premium",
        "tag": "Fintech / Lifestyle",
        "description": "Ultra-sharp macro shot of laser-engraved metal bevels, crisp contactless tap animation, and instant digital confirmation."
    }
]

class BaseHandler(tornado.web.RequestHandler):
    def set_default_headers(self):
        self.set_header("Access-Control-Allow-Origin", "*")
        self.set_header("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS")
        self.set_header("Access-Control-Allow-Headers", "Content-Type, Authorization")

    def options(self, *args, **kwargs):
        self.set_status(204)
        self.finish()

    def get_json_body(self):
        try:
            return tornado.escape.json_decode(self.request.body)
        except Exception:
            return {}

class MainHandler(BaseHandler):
    def get(self):
        index_file = TEMPLATES_DIR / "index.html"
        if index_file.exists():
            self.render(str(index_file))
        else:
            self.write("<h1>AdMotion AI server is running. Templates index.html missing.</h1>")

    def head(self):
        self.set_status(200)

class GenerateHandler(BaseHandler):
    def post(self):
        data = self.get_json_body()
        logging.info("Generating Ad Campaign for brand: %s", data.get("brand", "Unknown"))
        project = generate_ad_campaign(data)
        # Automatically save to DB so it persists
        save_project(project)
        self.set_header("Content-Type", "application/json")
        self.write(json.dumps({"success": True, "project": project}))

class RegenerateSceneHandler(BaseHandler):
    def post(self):
        data = self.get_json_body()
        scenes = data.get("scenes", [])
        scene_idx = int(data.get("scene_index", 0))
        instruction = data.get("instruction", "")
        updated_scenes = regenerate_single_scene(scenes, scene_idx, instruction)
        self.set_header("Content-Type", "application/json")
        self.write(json.dumps({"success": True, "scenes": updated_scenes}))

class ProjectsHandler(BaseHandler):
    def get(self):
        projects = get_all_projects()
        self.set_header("Content-Type", "application/json")
        self.write(json.dumps({"success": True, "projects": projects}))

    def post(self):
        data = self.get_json_body()
        project_id = save_project(data)
        self.set_header("Content-Type", "application/json")
        self.write(json.dumps({"success": True, "id": project_id}))

class ProjectDetailHandler(BaseHandler):
    def get(self, project_id):
        project = get_project_by_id(project_id)
        if project:
            self.set_header("Content-Type", "application/json")
            self.write(json.dumps({"success": True, "project": project}))
        else:
            self.set_status(404)
            self.write(json.dumps({"success": False, "error": "Project not found"}))

    def delete(self, project_id):
        deleted = delete_project_by_id(project_id)
        self.set_header("Content-Type", "application/json")
        self.write(json.dumps({"success": deleted}))

class TemplatesHandler(BaseHandler):
    def get(self):
        self.set_header("Content-Type", "application/json")
        self.write(json.dumps({"success": True, "templates": TEMPLATES_DATA}))

def make_app():
    return tornado.web.Application([
        (r"/", MainHandler),
        (r"/api/generate", GenerateHandler),
        (r"/api/regenerate-scene", RegenerateSceneHandler),
        (r"/api/projects", ProjectsHandler),
        (r"/api/projects/([^/]+)", ProjectDetailHandler),
        (r"/api/templates", TemplatesHandler),
        (r"/static/(.*)", tornado.web.StaticFileHandler, {"path": str(STATIC_DIR)}),
    ], debug=False, template_path=str(TEMPLATES_DIR))

def find_available_port(preferred_port=8000, max_attempts=10):
    import socket
    for port in range(preferred_port, preferred_port + max_attempts):
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            if s.connect_ex(('127.0.0.1', port)) != 0:
                return port
    return preferred_port

if __name__ == "__main__":
    init_db()
    env_port = os.environ.get("PORT")
    port = int(env_port) if env_port else find_available_port(8000)
    app = make_app()
    app.listen(port, address="0.0.0.0")
    print(f"\n=======================================================")
    print(f"🚀 AdMotion AI Server running at: http://0.0.0.0:{port}")
    print(f"=======================================================\n")
    try:
        tornado.ioloop.IOLoop.current().start()
    except KeyboardInterrupt:
        print("\nStopping AdMotion AI server...")
        tornado.ioloop.IOLoop.current().stop()

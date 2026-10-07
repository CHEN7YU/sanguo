#!/usr/bin/env python3
"""Build Qinghe battle art from the exact 28x16 original terrain grid."""
from __future__ import annotations

import json
import math
import random
from pathlib import Path

from PIL import Image, ImageDraw, ImageEnhance, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "docs/original-audit/level-04-qinghe-map.json"
MASTER = ROOT / "assets-master/level-04-qinghe/qinghe-map-aligned-v1.png"
RELEASE = ROOT / "assets/level-04-qinghe/qinghe-map-aligned-v1.webp"
TEXTURES = ROOT / "assets-master/level-04-julu/terrain-textures"
CELL = 80

data = json.loads(DATA.read_text(encoding="utf-8"))
rows = data["terrain_codes"]
width, height = data["width"], data["height"]
size = (width * CELL, height * CELL)


def source_texture(name: str, color=1.0, contrast=1.0, brightness=1.0) -> Image.Image:
    image = Image.open(TEXTURES / name).convert("RGB").resize(size, Image.Resampling.LANCZOS)
    image = ImageEnhance.Color(image).enhance(color)
    image = ImageEnhance.Contrast(image).enhance(contrast)
    image = ImageEnhance.Brightness(image).enhance(brightness)
    return image.filter(ImageFilter.UnsharpMask(radius=1.1, percent=80, threshold=3))


textures = {
    "plain": source_texture("grass-v1.png", .78, .99, 1.01),
    "grass": source_texture("grass-v1.png", .92, 1.02, .94),
    "forest": source_texture("forest-v1.png", .84, 1.04, .86),
    "hill": source_texture("cliff-v1.png", .78, 1.08, .91),
}

# Painterly water with a stable horizontal flow. It stays inside the original
# river squares so the visible bank and the movement rules always agree.
water = Image.new("RGB", size, "#277da2")
wd = ImageDraw.Draw(water, "RGBA")
random.seed(5005)
for y in range(0, size[1], 8):
    shade = int(22 * math.sin(y * .035))
    wd.rectangle((0, y, size[0], y + 8), fill=(38 + shade, 126 + shade, 160 + shade, 85))
for _ in range(1150):
    x = random.randrange(size[0]); y = random.randrange(size[1]); length = random.randrange(18, 78)
    wd.arc((x, y, x + length, y + 12), 195, 338, fill=(190, 238, 235, random.randrange(32, 74)), width=2)
water = water.filter(ImageFilter.GaussianBlur(.55))
textures["water"] = water

masks = {name: Image.new("L", size, 0) for name in textures}
draws = {name: ImageDraw.Draw(mask) for name, mask in masks.items()}
for y, row in enumerate(rows):
    for x, code in enumerate(row):
        box = (x * CELL, y * CELL, (x + 1) * CELL, (y + 1) * CELL)
        category = "water" if code in {0x03, 0x04} else "hill" if code == 0x02 else "forest" if code == 0x01 else "grass" if code in {0x07, 0x08} else "plain"
        draws[category].rectangle(box, fill=255)

for name in masks:
    masks[name] = masks[name].filter(ImageFilter.GaussianBlur(5 if name == "water" else 7))

canvas = textures["plain"].copy()
for name in ("grass", "forest", "hill", "water"):
    canvas = Image.composite(textures[name], canvas, masks[name])

detail = Image.new("RGBA", size, (0, 0, 0, 0))
dd = ImageDraw.Draw(detail, "RGBA")

# River banks, square-cell bridges, and subtle terrain accents are decorative;
# structures are drawn by the runtime on their exact logical squares.
for y, row in enumerate(rows):
    for x, code in enumerate(row):
        x0, y0 = x * CELL, y * CELL
        if code == 0x03:
            for nx, ny, edge in ((x-1,y,"l"),(x+1,y,"r"),(x,y-1,"t"),(x,y+1,"b")):
                if 0 <= nx < width and 0 <= ny < height and rows[ny][nx] not in {0x03, 0x04}:
                    if edge == "l": dd.line((x0, y0, x0, y0+CELL), fill=(224,202,140,105), width=4)
                    elif edge == "r": dd.line((x0+CELL, y0, x0+CELL, y0+CELL), fill=(224,202,140,105), width=4)
                    elif edge == "t": dd.line((x0, y0, x0+CELL, y0), fill=(224,202,140,105), width=4)
                    else: dd.line((x0, y0+CELL, x0+CELL, y0+CELL), fill=(224,202,140,105), width=4)
        elif code == 0x04:
            dd.rectangle((x0+3,y0+7,x0+CELL-3,y0+CELL-7), fill=(125,83,40,240), outline=(236,192,105,230), width=3)
            for i in range(7, CELL-5, 11):
                dd.line((x0+5,y0+i,x0+CELL-5,y0+i), fill=(65,40,24,180), width=2)
            dd.line((x0+9,y0+5,x0+9,y0+CELL-5), fill=(238,199,116,190), width=3)
            dd.line((x0+CELL-9,y0+5,x0+CELL-9,y0+CELL-5), fill=(238,199,116,190), width=3)
        elif code == 0x02:
            dd.line((x0+14,y0+64,x0+36,y0+18,x0+65,y0+58), fill=(235,220,170,55), width=2)
        elif code == 0x01 and (x+y) % 3 == 0:
            dd.ellipse((x0+29,y0+25,x0+47,y0+43), fill=(31,83,46,62))

# True square touch targets remain readable without making the battlefield look
# like a spreadsheet at overview scale.
for x in range(width + 1):
    dd.line((x*CELL, 0, x*CELL, size[1]), fill=(250,226,166,22), width=1)
for y in range(height + 1):
    dd.line((0, y*CELL, size[0], y*CELL), fill=(250,226,166,22), width=1)

canvas = Image.alpha_composite(canvas.convert("RGBA"), detail).convert("RGB")
MASTER.parent.mkdir(parents=True, exist_ok=True)
RELEASE.parent.mkdir(parents=True, exist_ok=True)
canvas.save(MASTER, optimize=True)
canvas.save(RELEASE, "WEBP", quality=82, method=6)
print(f"{MASTER} ({MASTER.stat().st_size / 1024 / 1024:.2f} MiB)")
print(f"{RELEASE} ({RELEASE.stat().st_size / 1024 / 1024:.2f} MiB)")

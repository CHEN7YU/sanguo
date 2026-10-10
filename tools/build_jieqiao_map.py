#!/usr/bin/env python3
"""Build the Jieqiao release terrain with a strict 32x24 square grid."""
from __future__ import annotations

import json
import random
from pathlib import Path

from PIL import Image, ImageDraw, ImageEnhance, ImageFilter


ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "docs/original-audit/level-05-jieqiao-map.json"
MASTER = ROOT / "assets-master/level-05-jieqiao/jieqiao-map-v2.png"
RELEASE = ROOT / "assets/level-05-jieqiao/jieqiao-map-v2.webp"
WIDTH, HEIGHT = 2048, 1536
COLS, ROWS = 32, 24


def texture(path: Path, *, color=1.0, contrast=1.0, brightness=1.0) -> Image.Image:
    image = Image.open(path).convert("RGB").resize((WIDTH, HEIGHT), Image.Resampling.LANCZOS)
    image = ImageEnhance.Color(image).enhance(color)
    image = ImageEnhance.Contrast(image).enhance(contrast)
    image = ImageEnhance.Brightness(image).enhance(brightness)
    return image.filter(ImageFilter.UnsharpMask(radius=1.1, percent=75, threshold=3))


def main() -> None:
    # The approved seamless painted master is authoritative.  Rebuild the
    # lightweight web release from it without degrading or replacing it.
    if MASTER.exists():
        image = Image.open(MASTER).convert("RGB")
        if image.size != (WIDTH, HEIGHT):
            image = image.resize((WIDTH, HEIGHT), Image.Resampling.LANCZOS)
        RELEASE.parent.mkdir(parents=True, exist_ok=True)
        image.save(RELEASE, "WEBP", quality=84, method=6)
        print(f"{MASTER} {MASTER.stat().st_size}")
        print(f"{RELEASE} {RELEASE.stat().st_size}")
        return
    rows = json.loads(DATA.read_text(encoding="utf-8"))["terrain_codes"]
    source = ROOT / "assets-master/level-04-julu/terrain-textures"
    textures = {
        "plain": texture(source / "grass-v1.png", color=.90, contrast=1.01, brightness=.93),
        "grass": texture(source / "grass-v1.png", color=1.0, contrast=1.02, brightness=1.01),
        "forest": texture(source / "forest-v1.png", color=.88, contrast=1.05, brightness=.86),
        "hill": texture(source / "cliff-v1.png", color=.76, contrast=1.08, brightness=.88),
        "camp": texture(source / "rough-v1.png", color=.82, contrast=1.03, brightness=.93),
    }

    # Reuse the approved Qinghe river material. It keeps the water painterly
    # and detailed while the logical river remains exactly on original cells.
    qinghe = Image.open(ROOT / "assets-master/level-04-qinghe/qinghe-map-remaster-v2.png").convert("RGB")
    qw, qh = qinghe.size
    # A square of open water is tiled with alternating flips. Stretching the
    # narrow original river would produce obvious horizontal smearing.
    water_tile = qinghe.crop((int(qw*.47), int(qh*.60), int(qw*.54), int(qh*.82))).resize((256, 256), Image.Resampling.LANCZOS)
    water = Image.new("RGB", (WIDTH, HEIGHT))
    for ty in range(0, HEIGHT, 256):
        for tx in range(0, WIDTH, 256):
            tile = water_tile
            if (tx // 256) % 2:
                tile = tile.transpose(Image.Transpose.FLIP_LEFT_RIGHT)
            if (ty // 256) % 2:
                tile = tile.transpose(Image.Transpose.FLIP_TOP_BOTTOM)
            water.paste(tile, (tx, ty))
    textures["water"] = ImageEnhance.Color(water).enhance(.92)

    categories = {name: Image.new("L", (WIDTH, HEIGHT), 0) for name in textures}
    draws = {name: ImageDraw.Draw(mask) for name, mask in categories.items()}
    for y, row in enumerate(rows):
        for x, code in enumerate(row):
            x0, x1 = round(x*WIDTH/COLS), round((x+1)*WIDTH/COLS)
            y0, y1 = round(y*HEIGHT/ROWS), round((y+1)*HEIGHT/ROWS)
            if code == 0x01:
                category = "forest"
            elif code == 0x02:
                category = "hill"
            elif code == 0x03:
                category = "water"
            elif code in {0x0C, 0x0E, 0x0F, 0x10}:
                category = "camp"
            elif code == 0x07:
                category = "grass"
            else:
                category = "plain"
            draws[category].rectangle((x0, y0, x1, y1), fill=255)

    # Soft, narrow joins hide hard collage edges without moving the actual
    # terrain boundary beyond the square used by movement and touch input.
    for key in categories:
        categories[key] = categories[key].filter(ImageFilter.GaussianBlur(4))

    canvas = textures["plain"].copy()
    for key in ("grass", "forest", "hill", "water", "camp"):
        canvas = Image.composite(textures[key], canvas, categories[key])

    random.seed(32024)
    grain = Image.new("RGBA", (WIDTH, HEIGHT), (0, 0, 0, 0))
    gd = ImageDraw.Draw(grain)
    for _ in range(11000):
        x, y = random.randrange(WIDTH), random.randrange(HEIGHT)
        gd.point((x, y), fill=random.choice(((245, 229, 178, 8), (21, 32, 24, 8))))
    canvas = Image.alpha_composite(canvas.convert("RGBA"), grain)

    grid = Image.new("RGBA", (WIDTH, HEIGHT), (0, 0, 0, 0))
    draw = ImageDraw.Draw(grid)
    for x in range(COLS + 1):
        p = round(x*WIDTH/COLS)
        draw.line((p, 0, p, HEIGHT), fill=(249, 228, 173, 20), width=1)
    for y in range(ROWS + 1):
        p = round(y*HEIGHT/ROWS)
        draw.line((0, p, WIDTH, p), fill=(249, 228, 173, 20), width=1)
    canvas = Image.alpha_composite(canvas, grid).convert("RGB")

    MASTER.parent.mkdir(parents=True, exist_ok=True)
    RELEASE.parent.mkdir(parents=True, exist_ok=True)
    canvas.save(MASTER, optimize=True)
    canvas.save(RELEASE, "WEBP", quality=84, method=6)
    print(f"{MASTER} {MASTER.stat().st_size}")
    print(f"{RELEASE} {RELEASE.stat().st_size}")


if __name__ == "__main__":
    main()

from __future__ import annotations

import json
import math
import random
from pathlib import Path

from PIL import Image, ImageDraw, ImageEnhance, ImageFilter


ROOT = Path(__file__).resolve().parents[1]
MASTER = ROOT / "assets-master" / "level-09-taishan"
OUT = ROOT / "assets" / "level-09-taishan"
MAP_JSON = ROOT / "docs" / "original-audit" / "level-09-taishan-map-row-major.json"


def alpha_bounds(cell: Image.Image) -> list[int]:
    alpha = cell.getchannel("A")
    box = alpha.getbbox()
    if not box:
        return [0, 0, cell.width, cell.height]
    x0, y0, x1, y1 = box
    return [x0, y0, x1 - x0, y1 - y0]


def save_webp(image: Image.Image, path: Path, quality: int = 82) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    image.save(path, "WEBP", quality=quality, method=6, alpha_quality=92)


def build_character_assets() -> dict:
    walk_master = Image.open(MASTER / "li-ming-walk-master-v1.png").convert("RGBA")
    action_master = Image.open(MASTER / "li-ming-action-master-v1.png").convert("RGBA")
    damage_master = Image.open(MASTER / "li-ming-damage-master-v1.png").convert("RGBA")

    walk = walk_master.resize((1024, 1024), Image.Resampling.LANCZOS)
    action = action_master.resize((1280, 512), Image.Resampling.LANCZOS)
    damage = damage_master.resize((1280, 512), Image.Resampling.LANCZOS)

    static = walk.crop((0, 768, 256, 1024))
    static_canvas = Image.new("RGBA", (512, 512))
    static_canvas.alpha_composite(static.resize((512, 512), Image.Resampling.LANCZOS))

    save_webp(static_canvas, OUT / "units" / "li-ming-unit-v1.webp", 86)
    save_webp(walk, OUT / "animation" / "li-ming" / "li-ming-walk-v1.webp", 84)
    save_webp(action, OUT / "animation" / "li-ming" / "li-ming-attack-v1.webp", 85)
    save_webp(action, OUT / "animation" / "li-ming" / "li-ming-critical-v1.webp", 86)
    save_webp(damage, OUT / "animation" / "li-ming" / "li-ming-hurt-v1.webp", 84)
    save_webp(damage, OUT / "animation" / "li-ming" / "li-ming-block-v1.webp", 84)
    save_webp(damage, OUT / "animation" / "li-ming" / "li-ming-death-v1.webp", 84)

    portrait = Image.open(MASTER / "li-ming-portrait-master-v1.png").convert("RGB")
    target_ratio = 4 / 5
    ratio = portrait.width / portrait.height
    if ratio > target_ratio:
        new_w = int(portrait.height * target_ratio)
        left = (portrait.width - new_w) // 2
        portrait = portrait.crop((left, 0, left + new_w, portrait.height))
    else:
        new_h = int(portrait.width / target_ratio)
        top = max(0, (portrait.height - new_h) // 3)
        portrait = portrait.crop((0, top, portrait.width, top + new_h))
    portrait = portrait.resize((640, 800), Image.Resampling.LANCZOS)
    save_webp(portrait, OUT / "portraits" / "li-ming-remaster-v1.webp", 84)

    walk_bounds = []
    for row in range(4):
        row_bounds = []
        for col in range(4):
            row_bounds.append(alpha_bounds(walk.crop((col * 256, row * 256, (col + 1) * 256, (row + 1) * 256))))
        walk_bounds.append(row_bounds)
    strip_bounds = lambda image: [alpha_bounds(image.crop((i * 256, 0, (i + 1) * 256, 512))) for i in range(5)]
    return {
        "walk": walk_bounds,
        "attack": strip_bounds(action),
        "critical": strip_bounds(action),
        "hurt": strip_bounds(damage),
        "block": strip_bounds(damage),
        "death": strip_bounds(damage),
    }


def rounded_mask(codes: list[list[int]], wanted: set[int], width: int, height: int, blur: int = 4) -> Image.Image:
    cell_w, cell_h = width // 32, height // 16
    mask = Image.new("L", (width, height), 0)
    draw = ImageDraw.Draw(mask)
    for y, row in enumerate(codes):
        for x, code in enumerate(row):
            if code in wanted:
                draw.rectangle((x * cell_w - 2, y * cell_h - 2, (x + 1) * cell_w + 2, (y + 1) * cell_h + 2), fill=255)
    return mask.filter(ImageFilter.GaussianBlur(blur)) if blur else mask


def build_map() -> None:
    parsed = json.loads(MAP_JSON.read_text(encoding="utf-8"))
    codes = parsed["terrain_codes"]
    width, height = 2048, 1024
    concept = Image.open(MASTER / "taishan-clean-terrain-master-v1.png").convert("RGB").resize((width, height), Image.Resampling.LANCZOS)

    # Keep the seamless painted master intact. The old version repeated three
    # rectangular crops and outlined every terrain block; that is what made the
    # battlefield look as if black grid lines had been painted across it.
    # Exact passability remains in the 32×16 data matrix. Here it only guides
    # broad, feathered colour fields so valleys and mountain belts remain easy
    # to read without exposing the grid underneath.
    base = concept.convert("RGBA")
    valley_mask = rounded_mask(codes, {0, 7, 8, 11, 13, 16}, width, height, 34)
    cliff_mask = rounded_mask(codes, {9}, width, height, 38)

    valley = ImageEnhance.Color(concept).enhance(1.09)
    valley = ImageEnhance.Brightness(valley).enhance(1.045)
    valley_tint = Image.new("RGB", (width, height), (118, 128, 55))
    valley = Image.blend(valley, valley_tint, .045).convert("RGBA")
    valley_alpha = valley_mask.point(lambda p: int(p * .34))
    base.alpha_composite(Image.composite(valley, Image.new("RGBA", (width, height)), valley_alpha))

    cliff = ImageEnhance.Color(concept).enhance(.88)
    cliff = ImageEnhance.Contrast(cliff).enhance(1.07)
    cliff = ImageEnhance.Brightness(cliff).enhance(.91)
    cliff_tint = Image.new("RGB", (width, height), (52, 65, 51))
    cliff = Image.blend(cliff, cliff_tint, .055).convert("RGBA")
    cliff_alpha = cliff_mask.point(lambda p: int(p * .28))
    base.alpha_composite(Image.composite(cliff, Image.new("RGBA", (width, height)), cliff_alpha))

    # One continuous, low-frequency texture pass keeps the repaint lively but
    # cannot create seams because it spans the full canvas once.
    rng = random.Random(194)
    noise = Image.new("L", (128, 64))
    noise.putdata([rng.randrange(90, 166) for _ in range(128 * 64)])
    noise = noise.resize((width, height), Image.Resampling.BICUBIC).filter(ImageFilter.GaussianBlur(18))
    grain = Image.new("RGBA", (width, height), (214, 187, 112, 0))
    grain.putalpha(noise.point(lambda p: max(0, min(9, abs(p - 128) // 3))))
    base.alpha_composite(grain)

    # Do not bake structures here; the engine places them on their exact cells.
    vignette = Image.new("L", (width, height), 255)
    vd = ImageDraw.Draw(vignette)
    for i in range(80):
        alpha = int(255 * (i / 80) ** 1.65)
        vd.rectangle((i, i, width-1-i, height-1-i), outline=alpha)
    dark = Image.new("RGBA", (width, height), (3, 14, 14, 0))
    dark.putalpha(vignette.point(lambda p: 255-p))
    base.alpha_composite(dark)
    save_webp(base.convert("RGB"), OUT / "taishan-map-v2.webp", 82)


def main() -> None:
    bounds = build_character_assets()
    build_map()
    bounds_path = ROOT / "level-09-taishan-animation-bounds.js"
    bounds_path.write_text("window.TAISHAN_ANIMATION_BOUNDS=" + json.dumps({"liming": bounds}, separators=(",", ":")) + ";\n", encoding="utf-8")
    print(json.dumps({"output": str(OUT), "bounds": str(bounds_path)}, ensure_ascii=False))


if __name__ == "__main__":
    main()

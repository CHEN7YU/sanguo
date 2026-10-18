"""Build Beihai walk and attack sheets from approved ImageGen motion masters.

Each master is a transparent 5x2 atlas: walk poses on the first row and
attack poses on the second.  The build keeps every atlas cell at one fixed
scale, so long weapons and lunges do not make the actor shrink between frames.
"""
from pathlib import Path
from PIL import Image, ImageOps
import json


ROOT = Path(__file__).resolve().parent.parent
MASTER = ROOT / "assets-master" / "level-06-beihai" / "motion-atlases"
OUT = ROOT / "assets" / "level-06-beihai" / "animation"
UNITS = ["guan-hai", "kong-rong", "meng-su", "taishi-ci", "beast"]
CELL = 256


def atlas_cell(atlas: Image.Image, column: int, row: int) -> Image.Image:
    left = round(column * atlas.width / 5)
    right = round((column + 1) * atlas.width / 5)
    top = round(row * atlas.height / 2)
    bottom = round((row + 1) * atlas.height / 2)
    return atlas.crop((left, top, right, bottom)).resize(
        (CELL, CELL), Image.Resampling.LANCZOS
    )


def frame_bounds(frame: Image.Image) -> list[int]:
    box = frame.getbbox()
    if not box:
        return [0, 0, 1, 1]
    left, top, right, bottom = box
    return [left, top, right - left, bottom - top]


def strip_bounds(path: Path) -> list[list[int]]:
    sheet = Image.open(path).convert("RGBA")
    result = []
    for index in range(5):
        left = round(index * sheet.width / 5)
        right = round((index + 1) * sheet.width / 5)
        result.append(frame_bounds(sheet.crop((left, 0, right, sheet.height))))
    return result


all_bounds = {}
for slug in UNITS:
    atlas_path = MASTER / f"{slug}-motion-atlas-master-v2.png"
    atlas = Image.open(atlas_path).convert("RGBA")
    unit_dir = OUT / slug
    unit_dir.mkdir(parents=True, exist_ok=True)

    walk_source = [atlas_cell(atlas, index, 0) for index in (0, 1, 3, 4)]
    walk = Image.new("RGBA", (CELL * 4, CELL * 4), (0, 0, 0, 0))
    walk_bounds = []
    for row in range(4):
        # Square-grid west/north face screen-left; east/south face right.
        frames = [ImageOps.mirror(frame) for frame in walk_source] if row < 2 else walk_source
        row_bounds = []
        for column, frame in enumerate(frames):
            walk.alpha_composite(frame, (column * CELL, row * CELL))
            row_bounds.append(frame_bounds(frame))
        walk_bounds.append(row_bounds)
    walk.save(unit_dir / f"{slug}-walk-v2.webp", "WEBP", quality=84, method=6)

    attack = Image.new("RGBA", (CELL * 5, CELL), (0, 0, 0, 0))
    attack_bounds = []
    for column in range(5):
        frame = atlas_cell(atlas, column, 1)
        attack.alpha_composite(frame, (column * CELL, 0))
        attack_bounds.append(frame_bounds(frame))
    attack.save(unit_dir / f"{slug}-attack-v2.webp", "WEBP", quality=84, method=6)

    all_bounds[slug] = {
        "walk": walk_bounds,
        "attack": attack_bounds,
        "hurt": strip_bounds(unit_dir / f"{slug}-hurt-v1.webp"),
        "death": strip_bounds(unit_dir / f"{slug}-death-v1.webp"),
    }

(ROOT / "beihai-animation-bounds.js").write_text(
    "window.BEIHAI_ANIMATION_BOUNDS="
    + json.dumps(all_bounds, ensure_ascii=False, separators=(",", ":"))
    + ";\n",
    encoding="utf-8",
)
print(f"Built true-pose Beihai walk and attack sheets for {len(UNITS)} units.")

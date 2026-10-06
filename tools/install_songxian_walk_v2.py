from __future__ import annotations

import json
from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "assets"
SOURCE = ASSETS / "songxian-walk-v2.png"
OUTPUT = ASSETS / "songxian-walk-v2.webp"
BOUNDS_JSON = ROOT / "docs" / "original-audit" / "level-02-animation-bounds.json"
BOUNDS_JS = ROOT / "level-02-animation-bounds.js"


def alpha_bounds(image: Image.Image) -> list[int]:
    alpha = image.getchannel("A").point(lambda value: 255 if value > 8 else 0)
    box = alpha.getbbox()
    if not box:
        return [0, 0, image.width, image.height]
    left, top, right, bottom = box
    return [left, top, right - left, bottom - top]


with Image.open(SOURCE) as source:
    image = source.convert("RGBA")

# Sprite cells must divide exactly into four columns and rows.  The edited
# source can include up to three transparent edge pixels from image export.
width = image.width - image.width % 4
height = image.height - image.height % 4
left = (image.width - width) // 2
top = (image.height - height) // 2
image = image.crop((left, top, left + width, top + height))

cell_w, cell_h = image.width // 4, image.height // 4
bounds: list[list[list[int]]] = []
for row in range(4):
    row_bounds: list[list[int]] = []
    for column in range(4):
        cell = image.crop(
            (column * cell_w, row * cell_h, (column + 1) * cell_w, (row + 1) * cell_h)
        )
        row_bounds.append(alpha_bounds(cell))
    bounds.append(row_bounds)

image.save(OUTPUT, "WEBP", quality=90, method=6, alpha_quality=100)
image.close()

data = json.loads(BOUNDS_JSON.read_text(encoding="utf-8"))
data["walk"]["songxian"] = bounds
BOUNDS_JSON.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
BOUNDS_JS.write_text(
    "window.LEVEL_02_ANIMATION_BOUNDS="
    + json.dumps(data, ensure_ascii=False, separators=(",", ":"))
    + ";\n",
    encoding="utf-8",
)

print(f"installed {OUTPUT.name}: {width}x{height}, cell {cell_w}x{cell_h}")

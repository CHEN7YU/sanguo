from __future__ import annotations

import json
import sys
from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1] / "assets"
UNITS = ("lvbu", "zhangliao", "houcheng", "songxian", "weixu")


def alpha_bounds(image: Image.Image) -> list[int]:
    alpha = image.getchannel("A").point(lambda value: 255 if value > 8 else 0)
    box = alpha.getbbox()
    if not box:
        return [0, 0, image.width, image.height]
    left, top, right, bottom = box
    return [left, top, right - left, bottom - top]


def crop_to_multiple(image: Image.Image, x_multiple: int, y_multiple: int = 1) -> Image.Image:
    width = image.width - image.width % x_multiple
    height = image.height - image.height % y_multiple
    left = (image.width - width) // 2
    top = (image.height - height) // 2
    return image.crop((left, top, left + width, top + height))


def install_walk(unit: str) -> list[list[list[int]]]:
    with Image.open(ROOT / f"{unit}-walk-v1.png") as source:
        image = crop_to_multiple(source.convert("RGBA"), 4, 4)
    cell_w, cell_h = image.width // 4, image.height // 4
    if unit == "weixu":
        # The generated Wei Xu sheet returned south and north in the opposite rows.
        corrected = Image.new("RGBA", image.size)
        for target_row, source_row in enumerate((0, 3, 2, 1)):
            strip = image.crop((0, source_row * cell_h, image.width, (source_row + 1) * cell_h))
            corrected.paste(strip, (0, target_row * cell_h))
        image = corrected
    bounds = []
    for row in range(4):
        row_bounds = []
        for column in range(4):
            cell = image.crop((column * cell_w, row * cell_h, (column + 1) * cell_w, (row + 1) * cell_h))
            row_bounds.append(alpha_bounds(cell))
        bounds.append(row_bounds)
    image.save(ROOT / f"{unit}-walk-v1.webp", "WEBP", quality=88, method=4, alpha_quality=100)
    image.close()
    return bounds


def install_horizontal(unit: str, kind: str) -> list[list[int]]:
    with Image.open(ROOT / f"{unit}-{kind}-v1.png") as source:
        image = crop_to_multiple(source.convert("RGBA"), 5)
    cell_w = image.width // 5
    bounds = [alpha_bounds(image.crop((column * cell_w, 0, (column + 1) * cell_w, image.height))) for column in range(5)]
    image.save(ROOT / f"{unit}-{kind}-v1.webp", "WEBP", quality=88, method=4, alpha_quality=100)
    image.close()
    return bounds


output = ROOT.parent / "docs" / "original-audit" / "level-02-animation-bounds.json"
runtime_output = ROOT.parent / "level-02-animation-bounds.js"
if output.exists():
    result = json.loads(output.read_text(encoding="utf-8"))
else:
    result = {"walk": {}, "attack": {}, "death": {}}

requested = tuple(sys.argv[1:]) or UNITS
unknown = sorted(set(requested) - set(UNITS))
if unknown:
    raise SystemExit(f"Unknown unit(s): {', '.join(unknown)}")

for unit in requested:
    print(f"processing {unit}", flush=True)
    result["walk"][unit] = install_walk(unit)
    result["attack"][unit] = install_horizontal(unit, "attack")
    result["death"][unit] = install_horizontal(unit, "death")
    output.write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8")
    runtime_output.write_text(
        "window.LEVEL_02_ANIMATION_BOUNDS="
        + json.dumps(result, ensure_ascii=False, separators=(",", ":"))
        + ";\n",
        encoding="utf-8",
    )
    print(f"finished {unit}", flush=True)

print(output)

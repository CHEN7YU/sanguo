from __future__ import annotations

import json
from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
MASTER = ROOT / "assets-master" / "troops"
RUNTIME = ROOT / "assets" / "troops"
BOUNDS_FILE = ROOT / "docs" / "original-audit" / "support-animation-bounds.json"


def alpha_bounds(image: Image.Image) -> list[int]:
    alpha = image.getchannel("A").point(lambda value: 255 if value > 8 else 0)
    box = alpha.getbbox()
    if not box:
        return [0, 0, image.width, image.height]
    left, top, right, bottom = box
    return [left, top, right - left, bottom - top]


def crop_to_multiple(image: Image.Image, multiple: int, vertical_multiple: int = 1) -> Image.Image:
    width = image.width - image.width % multiple
    height = image.height - image.height % vertical_multiple
    left = (image.width - width) // 2
    top = (image.height - height) // 2
    return image.crop((left, top, left + width, top + height))


def install_walk() -> list[list[list[int]]]:
    with Image.open(MASTER / "military-band-walk-v1.png") as source:
        image = crop_to_multiple(source.convert("RGBA"), 4, 4)
    cell_w, cell_h = image.width // 4, image.height // 4

    # ImageGen returned front-right, side-right, rear and side-left rows.
    # Normalize those into the renderer's west, north, east, south order.
    normalized = Image.new("RGBA", image.size)
    for target_row, source_row in enumerate((3, 2, 0, 1)):
        strip = image.crop((0, source_row * cell_h, image.width, (source_row + 1) * cell_h))
        normalized.paste(strip, (0, target_row * cell_h))
    image.close()

    bounds: list[list[list[int]]] = []
    for row in range(4):
        row_bounds = []
        for column in range(4):
            cell = normalized.crop(
                (column * cell_w, row * cell_h, (column + 1) * cell_w, (row + 1) * cell_h)
            )
            row_bounds.append(alpha_bounds(cell))
        bounds.append(row_bounds)

    RUNTIME.mkdir(parents=True, exist_ok=True)
    normalized.save(
        RUNTIME / "military-band-walk-v1.webp",
        "WEBP",
        quality=88,
        method=6,
        alpha_quality=100,
    )
    normalized.close()
    return bounds


def install_attack() -> list[list[int]]:
    with Image.open(MASTER / "military-band-attack-v1.png") as source:
        image = crop_to_multiple(source.convert("RGBA"), 5)
    cell_w = image.width // 5
    bounds = [
        alpha_bounds(image.crop((column * cell_w, 0, (column + 1) * cell_w, image.height)))
        for column in range(5)
    ]
    RUNTIME.mkdir(parents=True, exist_ok=True)
    image.save(
        RUNTIME / "military-band-attack-v1.webp",
        "WEBP",
        quality=88,
        method=6,
        alpha_quality=100,
    )
    image.close()
    return bounds


result = {"walk": install_walk(), "attack": install_attack()}
BOUNDS_FILE.parent.mkdir(parents=True, exist_ok=True)
BOUNDS_FILE.write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8")
print(json.dumps(result, ensure_ascii=False, separators=(",", ":")))

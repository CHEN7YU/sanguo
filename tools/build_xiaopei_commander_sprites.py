from __future__ import annotations

import json
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw


ROOT = Path(__file__).resolve().parents[1]
MASTER = ROOT / "assets-master" / "level-08-xiaopei" / "units"
OUT = ROOT / "dist" / "assets" / "level-08-xiaopei" / "units"
BOUNDS_OUT = ROOT / "dist" / "level-08-xiaopei-animation-bounds.js"
CELL = 256
PAD = 8


def alpha_bbox(image: Image.Image) -> tuple[int, int, int, int]:
    alpha = image.getchannel("A")
    bbox = alpha.point(lambda value: 255 if value > 7 else 0).getbbox()
    if not bbox:
        raise ValueError("empty sprite cell")
    return bbox


def remove_cell_bleed(image: Image.Image) -> Image.Image:
    """Drop small disconnected pieces leaked from a neighbouring generated cell."""
    alpha = image.getchannel("A")
    work = alpha.point(lambda value: 255 if value > 12 else 0)
    components: list[tuple[int, np.ndarray, bool]] = []
    while work.getbbox():
        before = np.asarray(work).copy()
        y, x = np.argwhere(before == 255)[0]
        ImageDraw.floodfill(work, (int(x), int(y)), 0, thresh=0)
        after = np.asarray(work).copy()
        component = (before == 255) & (after == 0)
        area = int(component.sum())
        ys, xs = np.nonzero(component)
        touches_edge = bool(
            xs.min() == 0
            or ys.min() == 0
            or xs.max() == image.width - 1
            or ys.max() == image.height - 1
        )
        components.append((area, component, touches_edge))

    if not components:
        return image
    largest = max(area for area, _, _ in components)
    keep = np.zeros((image.height, image.width), dtype=bool)
    for area, component, touches_edge in components:
        # Keep the coherent character and sizeable authored effects. Tiny
        # components touching a cell edge are almost always a neighbour's cape,
        # weapon, hoof or head leaking across the generated atlas boundary.
        if area == largest or (touches_edge and area >= largest * 0.45) or (not touches_edge and area >= largest * 0.018):
            keep |= component
    result = image.copy()
    result_alpha = np.asarray(alpha).copy()
    result_alpha[~keep] = 0
    result.putalpha(Image.fromarray(result_alpha, "L"))
    return result


def split_grid(image: Image.Image, columns: int, rows: int) -> list[list[Image.Image]]:
    result: list[list[Image.Image]] = []
    for row in range(rows):
        row_frames: list[Image.Image] = []
        y0 = round(row * image.height / rows)
        y1 = round((row + 1) * image.height / rows)
        for column in range(columns):
            x0 = round(column * image.width / columns)
            x1 = round((column + 1) * image.width / columns)
            row_frames.append(remove_cell_bleed(image.crop((x0, y0, x1, y1))))
        result.append(row_frames)
    return result


def normalize_grid(frames: list[list[Image.Image]]) -> tuple[Image.Image, list[list[list[int]]]]:
    cropped: list[list[Image.Image]] = []
    max_width = max_height = 1
    for row in frames:
        cropped_row: list[Image.Image] = []
        for frame in row:
            box = alpha_bbox(frame)
            item = frame.crop(box)
            max_width = max(max_width, item.width)
            max_height = max(max_height, item.height)
            cropped_row.append(item)
        cropped.append(cropped_row)

    scale = min((CELL - PAD * 2) / max_width, (CELL - PAD * 2) / max_height)
    atlas = Image.new("RGBA", (CELL * len(frames[0]), CELL * len(frames)), (0, 0, 0, 0))
    bounds: list[list[list[int]]] = []
    for row_index, row in enumerate(cropped):
        bounds_row: list[list[int]] = []
        for column_index, item in enumerate(row):
            width = max(1, round(item.width * scale))
            height = max(1, round(item.height * scale))
            resized = item.resize((width, height), Image.Resampling.LANCZOS)
            x = (CELL - width) // 2
            y = CELL - PAD - height
            atlas.alpha_composite(resized, (column_index * CELL + x, row_index * CELL + y))
            bounds_row.append([x, y, width, height])
        bounds.append(bounds_row)
    return atlas, bounds


def save_webp(image: Image.Image, path: Path, quality: int = 88) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    # Method 4 keeps the shipped sheets compact while avoiding the very slow
    # exhaustive encoder pass on the 4x4 walk atlases.
    image.save(path, "WEBP", quality=quality, method=4, exact=True)


def build_walk(character: str, source_name: str) -> tuple[list[list[list[int]]], Image.Image]:
    source = Image.open(MASTER / source_name).convert("RGBA")
    atlas, bounds = normalize_grid(split_grid(source, 4, 4))
    save_webp(atlas, OUT / f"{character}-walk-v1.webp")
    static = atlas.crop((0, 0, CELL, CELL))
    save_webp(static, OUT / f"{character}-unit-v1.webp", quality=90)
    return bounds, static


def build_strip(character: str, source_name: str, row: int, kind: str) -> list[list[int]]:
    source = Image.open(MASTER / source_name).convert("RGBA")
    rows = 2 if "action-death" in source_name else 1
    frames = split_grid(source, 5, rows)
    atlas, bounds = normalize_grid([frames[row]])
    save_webp(atlas, OUT / f"{character}-{kind}-v1.webp")
    return bounds[0]


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    config = {
        "caocao": {
            "walk": "caocao-walk-master-v1.png",
            "action": ("caocao-action-master-v1.png", 0),
            "death": ("caocao-death-master-v1.png", 0),
        },
        "xiahoudun": {
            "walk": "xiahoudun-walk-master-v1.png",
            "action": ("xiahoudun-action-death-master-v1.png", 0),
            "death": ("xiahoudun-action-death-master-v1.png", 1),
        },
        "xunyu": {
            "walk": "xunyu-walk-master-v1.png",
            "action": ("xunyu-action-death-master-v1.png", 0),
            "death": ("xunyu-action-death-master-v1.png", 1),
        },
    }
    all_bounds: dict[str, dict[str, object]] = {}
    for character, item in config.items():
        walk_bounds, _ = build_walk(character, item["walk"])
        action_name, action_row = item["action"]
        death_name, death_row = item["death"]
        action_bounds = build_strip(character, action_name, action_row, "action")
        death_bounds = build_strip(character, death_name, death_row, "death")
        all_bounds[character] = {
            "walk": walk_bounds,
            "attack": action_bounds,
            "hurt": action_bounds,
            "block": action_bounds,
            "critical": action_bounds,
            "death": death_bounds,
        }

    payload = json.dumps(all_bounds, ensure_ascii=False, separators=(",", ":"))
    BOUNDS_OUT.write_text(
        f"window.XIAOPEI_ANIMATION_BOUNDS={payload};\n", encoding="utf-8"
    )


if __name__ == "__main__":
    main()

from __future__ import annotations

import json
from collections import deque
from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
MASTER = ROOT / "assets-master" / "level-05-jieqiao" / "zhao-yun-animation"
RELEASE = ROOT / "assets" / "level-05-jieqiao" / "zhao-yun-animation"
BOUNDS_JS = ROOT / "zhao-yun-animation-bounds.js"


def cell_edges(size: int, count: int) -> list[int]:
    return [round(index * size / count) for index in range(count + 1)]


def alpha_bounds(image: Image.Image) -> list[int]:
    alpha = image.getchannel("A")
    bbox = alpha.getbbox()
    if not bbox:
        return [0, 0, image.width, image.height]
    left, top, right, bottom = bbox
    return [left, top, right - left, bottom - top]


def clean_cell(image: Image.Image) -> Image.Image:
    """Remove isolated generation flecks while preserving character/effects."""
    output = image.copy()
    alpha = output.getchannel("A")
    width, height = output.size
    pixels = alpha.load()
    visited = bytearray(width * height)
    discard: list[tuple[int, int]] = []
    for y in range(height):
        for x in range(width):
            offset = y * width + x
            if visited[offset] or pixels[x, y] <= 12:
                visited[offset] = 1
                continue
            queue = deque([(x, y)])
            visited[offset] = 1
            component: list[tuple[int, int]] = []
            touches_edge = False
            while queue:
                cx, cy = queue.popleft()
                component.append((cx, cy))
                touches_edge |= cx == 0 or cy == 0 or cx == width - 1 or cy == height - 1
                for nx, ny in ((cx - 1, cy), (cx + 1, cy), (cx, cy - 1), (cx, cy + 1)):
                    if nx < 0 or ny < 0 or nx >= width or ny >= height:
                        continue
                    noffset = ny * width + nx
                    if visited[noffset]:
                        continue
                    visited[noffset] = 1
                    if pixels[nx, ny] > 12:
                        queue.append((nx, ny))
            # Image generation occasionally lets a hoof or spear fragment bleed
            # across a neighbouring atlas cell.  Those pieces touch the cell edge
            # and stay far smaller than the connected rider/horse silhouette.
            if len(component) < 120 or (touches_edge and len(component) < 3000):
                discard.extend(component)
    if discard:
        alpha_pixels = alpha.load()
        for x, y in discard:
            alpha_pixels[x, y] = 0
        output.putalpha(alpha)
    return output


def clean_grid(image: Image.Image, columns: int, rows: int) -> Image.Image:
    output = Image.new("RGBA", image.size, (0, 0, 0, 0))
    xs = cell_edges(image.width, columns)
    ys = cell_edges(image.height, rows)
    for row in range(rows):
        for column in range(columns):
            cell = image.crop((xs[column], ys[row], xs[column + 1], ys[row + 1]))
            output.paste(clean_cell(cell), (xs[column], ys[row]))
    return output


def animation_bounds(image: Image.Image, columns: int, rows: int) -> list:
    xs = cell_edges(image.width, columns)
    ys = cell_edges(image.height, rows)
    result = []
    for row in range(rows):
        frames = []
        for column in range(columns):
            cell = image.crop((xs[column], ys[row], xs[column + 1], ys[row + 1]))
            frames.append(alpha_bounds(cell))
        result.append(frames)
    return result


def mirror_each_frame(row: Image.Image, columns: int = 5) -> Image.Image:
    output = Image.new("RGBA", row.size, (0, 0, 0, 0))
    xs = cell_edges(row.width, columns)
    for column in range(columns):
        frame = row.crop((xs[column], 0, xs[column + 1], row.height))
        output.paste(frame.transpose(Image.Transpose.FLIP_LEFT_RIGHT), (xs[column], 0))
    return output


def save_webp(image: Image.Image, path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    image.save(path, "WEBP", quality=91, method=6, exact=True)


def main() -> None:
    walk = clean_grid(Image.open(MASTER / "zhao-yun-walk-atlas-v2.png").convert("RGBA"), 4, 4)
    combat = Image.open(MASTER / "zhao-yun-combat-atlas-v2.png").convert("RGBA")
    directional_attack = clean_grid(
        Image.open(MASTER / "zhao-yun-directional-attack-atlas-v2.png").convert("RGBA"),
        5,
        4,
    )
    save_webp(walk, RELEASE / "zhao-yun-walk-v2.webp")
    save_webp(directional_attack, RELEASE / "zhao-yun-directional-attack-v2.webp")

    row_names = ["attack", "critical", "block", "hurt", "death"]
    ys = cell_edges(combat.height, len(row_names))
    bounds: dict[str, list] = {
        "walk": animation_bounds(walk, 4, 4),
        "directionalAttack": animation_bounds(directional_attack, 5, 4),
    }
    for index, name in enumerate(row_names):
        source_row = combat.crop((0, ys[index], combat.width, ys[index + 1]))
        # Runtime attack art faces right natively, then mirrors toward targets
        # on the left. The concept atlas faces left, so mirror every frame
        # without reversing animation order.
        row = clean_grid(mirror_each_frame(source_row), 5, 1)
        save_webp(row, RELEASE / f"zhao-yun-{name}-v2.webp")
        bounds[name] = animation_bounds(row, 5, 1)[0]

    payload = json.dumps(bounds, ensure_ascii=False, separators=(",", ":"))
    BOUNDS_JS.write_text(
        "window.ZHAO_YUN_ANIMATION_BOUNDS=" + payload + ";\n",
        encoding="utf-8",
    )
    total = sum(path.stat().st_size for path in RELEASE.glob("*.webp"))
    print(f"Built Zhao Yun animation set: {total / 1024:.1f} KiB")


if __name__ == "__main__":
    main()

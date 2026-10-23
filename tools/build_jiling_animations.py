from __future__ import annotations

import json
from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
MASTER = ROOT / "assets-master" / "level-10-huainan" / "animation" / "ji-ling"
RELEASE = ROOT / "assets" / "level-10-huainan" / "animation" / "ji-ling"
BOUNDS_JS = ROOT / "level-10-huainan-animation-bounds.js"
COMBAT_ROWS = ("attack", "critical", "block", "hurt", "death")


def edges(size: int, count: int) -> list[int]:
    return [round(index * size / count) for index in range(count + 1)]


def alpha_bounds(image: Image.Image) -> list[int]:
    bbox = image.getchannel("A").getbbox()
    if not bbox:
        return [0, 0, image.width, image.height]
    left, top, right, bottom = bbox
    return [left, top, right - left, bottom - top]


def animation_bounds(image: Image.Image, columns: int, rows: int) -> list:
    xs, ys = edges(image.width, columns), edges(image.height, rows)
    return [
        [alpha_bounds(image.crop((xs[x], ys[y], xs[x + 1], ys[y + 1]))) for x in range(columns)]
        for y in range(rows)
    ]


def clean_frame(frame: Image.Image) -> Image.Image:
    """Keep the mounted character and remove disconnected spill from adjacent generated cells."""
    alpha = frame.getchannel("A")
    width, height = frame.size
    active = bytearray(1 if value > 12 else 0 for value in alpha.get_flattened_data())
    visited = bytearray(width * height)
    components: list[list[int]] = []
    for start, value in enumerate(active):
        if not value or visited[start]:
            continue
        visited[start] = 1
        stack = [start]
        component: list[int] = []
        while stack:
            index = stack.pop()
            component.append(index)
            x, y = index % width, index // width
            for nx, ny in ((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1), (x - 1, y - 1), (x + 1, y - 1), (x - 1, y + 1), (x + 1, y + 1)):
                if nx < 0 or ny < 0 or nx >= width or ny >= height:
                    continue
                neighbour = ny * width + nx
                if active[neighbour] and not visited[neighbour]:
                    visited[neighbour] = 1
                    stack.append(neighbour)
        components.append(component)
    if not components:
        return frame
    keep = set(max(components, key=len))
    pixels = list(frame.get_flattened_data())
    frame.putdata([pixel if index in keep else (*pixel[:3], 0) for index, pixel in enumerate(pixels)])
    return frame


def clean_grid(image: Image.Image, columns: int, rows: int, content_scale: float) -> Image.Image:
    xs, ys = edges(image.width, columns), edges(image.height, rows)
    cleaned = Image.new("RGBA", image.size)
    for y in range(rows):
        for x in range(columns):
            frame = clean_frame(image.crop((xs[x], ys[y], xs[x + 1], ys[y + 1])))
            target_size = (round(frame.width * content_scale), round(frame.height * content_scale))
            frame = frame.resize(target_size, Image.Resampling.LANCZOS)
            offset = (xs[x] + (xs[x + 1] - xs[x] - frame.width) // 2, ys[y] + (ys[y + 1] - ys[y] - frame.height) // 2)
            cleaned.alpha_composite(frame, offset)
    return cleaned


def save_webp(image: Image.Image, path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    image.save(path, "WEBP", quality=88, method=6, exact=True)


def main() -> None:
    walk = Image.open(MASTER / "ji-ling-walk-atlas-v1.png").convert("RGBA")
    combat = Image.open(MASTER / "ji-ling-combat-atlas-v1.png").convert("RGBA")
    if min(walk.size) < 1000 or min(combat.size) < 1000:
        raise ValueError("Ji Ling source atlases are unexpectedly small")

    walk = clean_grid(walk, 4, 4, .92)
    combat = clean_grid(combat, 5, 5, .88)
    save_webp(walk, RELEASE / "ji-ling-walk-v1.webp")
    bounds = {"walk": animation_bounds(walk, 4, 4)}
    ys = edges(combat.height, len(COMBAT_ROWS))
    for row, action in enumerate(COMBAT_ROWS):
        strip = combat.crop((0, ys[row], combat.width, ys[row + 1]))
        save_webp(strip, RELEASE / f"ji-ling-{action}-v1.webp")
        bounds[action] = animation_bounds(strip, 5, 1)[0]

    BOUNDS_JS.write_text(
        "window.HUAINAN_ANIMATION_BOUNDS="
        + json.dumps({"jiling": bounds}, ensure_ascii=False, separators=(",", ":"))
        + ";\n",
        encoding="utf-8",
    )
    total = sum(path.stat().st_size for path in RELEASE.glob("*.webp"))
    print(f"Built Ji Ling heavy cavalry animation set: {total / 1048576:.2f} MiB")


if __name__ == "__main__":
    main()

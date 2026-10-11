from __future__ import annotations

import json
from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
MASTER = ROOT / "assets-master" / "level-05-jieqiao" / "core-animation"
RELEASE = ROOT / "assets" / "level-05-jieqiao" / "core-animation"
BOUNDS_JS = ROOT / "jieqiao-core-animation-bounds.js"
CHARACTERS = ("yanliang", "zhanghe", "quyi")
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


def save_webp(image: Image.Image, path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    image.save(path, "WEBP", quality=88, method=6, exact=True)


def build_character(character: str) -> tuple[dict, int]:
    source = MASTER / character
    target = RELEASE / character
    walk = Image.open(source / f"{character}-walk-atlas-v1.png").convert("RGBA")
    combat = Image.open(source / f"{character}-combat-atlas-v1.png").convert("RGBA")
    save_webp(walk, target / f"{character}-walk-v1.webp")
    bounds = {"walk": animation_bounds(walk, 4, 4)}
    ys = edges(combat.height, len(COMBAT_ROWS))
    for row, name in enumerate(COMBAT_ROWS):
        strip = combat.crop((0, ys[row], combat.width, ys[row + 1]))
        save_webp(strip, target / f"{character}-{name}-v1.webp")
        bounds[name] = animation_bounds(strip, 5, 1)[0]
    return bounds, sum(path.stat().st_size for path in target.glob("*.webp"))


def main() -> None:
    payload, total = {}, 0
    for character in CHARACTERS:
        payload[character], size = build_character(character)
        total += size
        print(f"Built {character}: {size / 1024:.1f} KiB")
    BOUNDS_JS.write_text(
        "window.JIEQIAO_CORE_ANIMATION_BOUNDS="
        + json.dumps(payload, ensure_ascii=False, separators=(",", ":"))
        + ";\n",
        encoding="utf-8",
    )
    print(f"Built three Jieqiao core animation sets: {total / 1024:.1f} KiB")


if __name__ == "__main__":
    main()

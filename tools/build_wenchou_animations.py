from __future__ import annotations

import json
from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
MASTER = ROOT / "assets-master" / "level-05-jieqiao" / "wen-chou-animation"
RELEASE = ROOT / "assets" / "level-05-jieqiao" / "wen-chou-animation"
BOUNDS_JS = ROOT / "wen-chou-animation-bounds.js"


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


def main() -> None:
    walk = Image.open(MASTER / "wen-chou-walk-atlas-v1.png").convert("RGBA")
    combat = Image.open(MASTER / "wen-chou-combat-atlas-v1.png").convert("RGBA")
    save_webp(walk, RELEASE / "wen-chou-walk-v1.webp")

    bounds = {"walk": animation_bounds(walk, 4, 4)}
    row_names = ["attack", "critical", "block", "hurt", "death"]
    ys = edges(combat.height, len(row_names))
    for row, name in enumerate(row_names):
        strip = combat.crop((0, ys[row], combat.width, ys[row + 1]))
        save_webp(strip, RELEASE / f"wen-chou-{name}-v1.webp")
        bounds[name] = animation_bounds(strip, 5, 1)[0]

    BOUNDS_JS.write_text(
        "window.WEN_CHOU_ANIMATION_BOUNDS="
        + json.dumps(bounds, ensure_ascii=False, separators=(",", ":"))
        + ";\n",
        encoding="utf-8",
    )
    total = sum(path.stat().st_size for path in RELEASE.glob("*.webp"))
    print(f"Built Wen Chou animation set: {total / 1024:.1f} KiB")


if __name__ == "__main__":
    main()

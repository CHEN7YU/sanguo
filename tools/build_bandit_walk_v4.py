from __future__ import annotations

import json
from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
MASTER = ROOT / "assets-master" / "troops"


def alpha_bounds(cell: Image.Image) -> list[int]:
    box = cell.getchannel("A").getbbox()
    if not box:
        return [0, 0, cell.width, cell.height]
    x0, y0, x1, y1 = box
    return [x0, y0, x1 - x0, y1 - y0]


def build(source_name: str, output: Path) -> list[list[list[int]]]:
    source = Image.open(MASTER / source_name).convert("RGBA")
    # The runtime renderer divides every walk atlas into sixteen equal cells.
    # Normalize the high-resolution master to exact 300x320 cells while
    # keeping the generated transparent alpha and the fixed foot baselines.
    sheet = source.resize((1200, 1280), Image.Resampling.LANCZOS)
    output.parent.mkdir(parents=True, exist_ok=True)
    sheet.save(output, "WEBP", quality=86, method=6, alpha_quality=96)
    return [
        [alpha_bounds(sheet.crop((col * 300, row * 320, (col + 1) * 300, (row + 1) * 320))) for col in range(4)]
        for row in range(4)
    ]


def main() -> None:
    enemy_bounds = build("bandit-walk-atlas-v4.png", ROOT / "assets" / "troops" / "bandit-walk-v4.webp")
    friendly_bounds = build(
        "bandit-walk-friendly-atlas-v4.png",
        ROOT / "assets" / "friendly" / "bandit-walk-friendly-v4.webp",
    )
    # Both faction sheets use the same pose layout.  Keep one union bound per
    # frame so tiny antialiasing differences along blue/red cloth edges never
    # clip either version in the shared renderer.
    union_bounds = []
    for row in range(4):
        union_row = []
        for col in range(4):
            a, b = enemy_bounds[row][col], friendly_bounds[row][col]
            x0, y0 = min(a[0], b[0]), min(a[1], b[1])
            x1, y1 = max(a[0] + a[2], b[0] + b[2]), max(a[1] + a[3], b[1] + b[3])
            union_row.append([x0, y0, x1 - x0, y1 - y0])
        union_bounds.append(union_row)
    print(json.dumps({"bandit": union_bounds}, separators=(",", ":")))


if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""Parse extracted HEXZMAP battle sections into auditable JSON and SVG."""

from __future__ import annotations

import argparse
import json
from collections import Counter
from pathlib import Path


TERRAIN = {
    0x00: ("平原", "#8eaa57"),
    0x01: ("森林", "#315c36"),
    0x02: ("山地", "#716c54"),
    0x03: ("河流", "#3a88a4"),
    0x04: ("桥梁", "#b29158"),
    0x05: ("城墙", "#6c6b67"),
    0x06: ("城池", "#8e765e"),
    0x07: ("草原", "#6f9b4f"),
    0x08: ("村庄", "#d4b154"),
    0x09: ("悬崖", "#4a4c42"),
    0x0A: ("城门", "#9e7750"),
    0x0B: ("荒地", "#a28758"),
    0x0C: ("栅栏", "#8c623f"),
    0x0D: ("鹿砦", "#b27e42"),
    0x0E: ("兵营", "#a3523d"),
    0x0F: ("粮仓", "#d28f39"),
    0x10: ("宝物库", "#dfc25d"),
    0x11: ("房舍", "#a67349"),
    0x12: ("火焰", "#dc592e"),
    0x13: ("浊流", "#52737a"),
}


def parse_map(path: Path) -> dict:
    data = path.read_bytes()
    if len(data) < 2:
        raise ValueError("map section is too short")
    display_width, display_height = data[0], data[1]
    if display_width % 2 or display_height % 2:
        raise ValueError("display dimensions are not divisible by two")
    width, height = display_width // 2, display_height // 2
    display_size = display_width * display_height
    tactical_offset = 2 + display_size
    tactical = data[tactical_offset:tactical_offset + width * height]
    if len(tactical) != width * height:
        raise ValueError("truncated tactical map")
    rows = [list(tactical[y * width:(y + 1) * width]) for y in range(height)]
    counts = Counter(tactical)
    return {
        "width": width,
        "height": height,
        "display_width": display_width,
        "display_height": display_height,
        "source_length": len(data),
        "display_offset": 2,
        "display_length": display_size,
        "tactical_offset": tactical_offset,
        "tactical_length": len(tactical),
        "terrain_legend": {f"{code:02X}": name for code, (name, _) in TERRAIN.items()},
        "terrain_counts": {f"{code:02X}": {"name": TERRAIN.get(code, ("未知", ""))[0], "count": count} for code, count in sorted(counts.items())},
        "terrain_codes": rows,
    }


def render_svg(parsed: dict, destination: Path) -> None:
    cell = 34
    pad_left, pad_top = 54, 58
    width, height = parsed["width"], parsed["height"]
    svg_width, svg_height = pad_left + width * cell + 20, pad_top + height * cell + 48
    parts = [
        f'<svg xmlns="http://www.w3.org/2000/svg" width="{svg_width}" height="{svg_height}" viewBox="0 0 {svg_width} {svg_height}">',
        '<rect width="100%" height="100%" fill="#0c1821"/>',
        '<style>text{font-family:"Microsoft YaHei",sans-serif}.code{font-size:10px;fill:#fff;text-anchor:middle;dominant-baseline:middle}.axis{font-size:11px;fill:#aab8bd;text-anchor:middle}.title{font-size:20px;font-weight:700;fill:#f0d487}</style>',
        f'<text class="title" x="{svg_width/2}" y="28" text-anchor="middle">原版第一关：汜水关之战战术地图（{width}×{height}）</text>',
    ]
    for x in range(width):
        parts.append(f'<text class="axis" x="{pad_left+x*cell+cell/2}" y="49">{x}</text>')
    for y, row in enumerate(parsed["terrain_codes"]):
        parts.append(f'<text class="axis" x="{pad_left-19}" y="{pad_top+y*cell+cell/2+4}">{y}</text>')
        for x, code in enumerate(row):
            name, color = TERRAIN.get(code, ("未知", "#b00060"))
            px, py = pad_left + x * cell, pad_top + y * cell
            parts.append(f'<rect x="{px}" y="{py}" width="{cell-1}" height="{cell-1}" fill="{color}" stroke="#101b20"/>')
            parts.append(f'<title>({x},{y}) {name} 0x{code:02X}</title><text class="code" x="{px+cell/2}" y="{py+cell/2+1}">{code:02X}</text>')
    parts.append('</svg>')
    destination.write_text("\n".join(parts), encoding="utf-8")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("source", type=Path)
    parser.add_argument("json_output", type=Path)
    parser.add_argument("--svg", type=Path)
    args = parser.parse_args()
    parsed = parse_map(args.source)
    args.json_output.parent.mkdir(parents=True, exist_ok=True)
    args.json_output.write_text(json.dumps(parsed, ensure_ascii=False, indent=2), encoding="utf-8")
    if args.svg:
        args.svg.parent.mkdir(parents=True, exist_ok=True)
        render_svg(parsed, args.svg)
    print(json.dumps({k: parsed[k] for k in ("width", "height", "tactical_offset", "tactical_length")}, ensure_ascii=False))


if __name__ == "__main__":
    main()

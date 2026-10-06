#!/usr/bin/env python3
"""Render the decoded tactical map as a clear image-generation reference."""

from __future__ import annotations

import json
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parents[1]
data = json.loads((ROOT / "docs/original-audit/level-01-original.json").read_text(encoding="utf-8"))
codes = data["map"]["terrain_codes"]
colors = {
    0: "#86aa52", 1: "#245538", 2: "#736f58", 3: "#2785aa", 4: "#bd8a48", 5: "#71716c",
    7: "#69a449", 8: "#dcb55a", 9: "#3c443e", 11: "#a17c50", 13: "#a16a3d", 15: "#c27d36", 16: "#e5c45e",
}
labels = {3: "河", 4: "桥", 5: "墙", 8: "村", 9: "崖", 11: "荒", 13: "寨", 15: "粮", 16: "宝"}
cell = 48
margin_x, margin_y = 90, 92
image = Image.new("RGB", (margin_x * 2 + 28 * cell, margin_y * 2 + 16 * cell), "#101a1d")
draw = ImageDraw.Draw(image)
font = ImageFont.truetype("C:/Windows/Fonts/msyh.ttc", 18)
small = ImageFont.truetype("C:/Windows/Fonts/msyh.ttc", 14)
title = ImageFont.truetype("C:/Windows/Fonts/msyhbd.ttc", 28)
draw.text((image.width // 2, 24), "汜水关原版 28×16 战术地图｜位置必须严格保持", fill="#f0d482", font=title, anchor="ma")
for y, row in enumerate(codes):
    for x, code in enumerate(row):
        left, top = margin_x + x * cell, margin_y + y * cell
        draw.rectangle((left, top, left + cell - 1, top + cell - 1), fill=colors.get(code, "#667c4c"), outline="#172329", width=1)
        if code in labels:
            draw.text((left + cell / 2, top + cell / 2 - 2), labels[code], fill="white", font=font, anchor="mm")
        draw.text((left + 3, top + 2), f"{x},{y}", fill="#dce6dc", font=small)
for unit in data["units"]:
    x, y = unit["x"], unit["y"]
    cx, cy = margin_x + (x + .5) * cell, margin_y + (y + .5) * cell
    color = "#43d2d0" if unit["side"] == "player" else "#8edcf0" if unit["side"] == "guest" else "#e34d43"
    draw.ellipse((cx - 15, cy - 15, cx + 15, cy + 15), fill=color, outline="#fff3c4", width=2)
    draw.text((cx, cy), unit["name"][0], fill="#091318", font=small, anchor="mm")
draw.text((margin_x, image.height - 54), "蓝绿＝我军｜浅蓝＝友军｜红＝敌军。河流、桥梁、城墙、森林、悬崖、村庄、鹿砦、粮仓、宝物库的格位不可移动。", fill="#e8e4cf", font=font)
output = ROOT / "docs/original-audit/level-01-map-reference.png"
image.save(output)
print(output)

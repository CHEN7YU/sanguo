#!/usr/bin/env python3
"""Extract the original Julu cast portraits from the verified face atlas."""

from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parent.parent
ATLAS = ROOT / "tools" / "koei_viewer" / "output" / "hero-faces.png"
OUTPUT = ROOT / "docs" / "original-audit" / "level-04-julu-portraits"
FACES = {
    "gongsun-yue": ("公孙越", 108),
    "yan-liang": ("颜良", 111),
    "shen-pei": ("审配", 116),
    "zhang-he": ("张郃", 117),
    "geng-wu": ("耿武", 120),
    "feng-ji": ("逢纪", 122),
    "gao-lan": ("高览", 125),
    "guan-chun": ("关纯", 60),
    "yu-ze": ("羽则", 77),
}


def main() -> None:
    atlas = Image.open(ATLAS).convert("RGB")
    OUTPUT.mkdir(parents=True, exist_ok=True)
    try:
        font = ImageFont.truetype("C:/Windows/Fonts/msyhbd.ttc", 21)
    except OSError:
        font = ImageFont.load_default()
    sheet = Image.new("RGB", (3 * 256, 3 * 360), "#182027")
    draw = ImageDraw.Draw(sheet)
    for index, (slug, (name, face_id)) in enumerate(FACES.items()):
        sx, sy = (face_id % 20) * 64, (face_id // 20) * 80
        portrait = atlas.crop((sx, sy, sx + 64, sy + 80)).resize((256, 320), Image.Resampling.NEAREST)
        portrait.save(OUTPUT / f"{slug}-face-{face_id:03d}.png")
        x, y = (index % 3) * 256, (index // 3) * 360
        sheet.paste(portrait, (x, y))
        draw.text((x + 128, y + 339), f"{name} / face {face_id}", font=font, anchor="mm", fill="#f0d99b")
    sheet.save(OUTPUT / "julu-cast-reference-grid.png")


if __name__ == "__main__":
    main()

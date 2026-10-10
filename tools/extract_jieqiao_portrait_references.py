#!/usr/bin/env python3
"""Create verified Jieqiao portrait references from decoded original faces."""

from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / "assets-master" / "level-05-jieqiao" / "original-faces"
OUTPUT = ROOT / "docs" / "original-audit" / "level-05-jieqiao-portraits"
FACES = {
    "zhao-yun": ("赵云", 53, 3),
    "wen-chou": ("文丑", 52, 112),
}


def main() -> None:
    OUTPUT.mkdir(parents=True, exist_ok=True)
    try:
        font = ImageFont.truetype("C:/Windows/Fonts/msyhbd.ttc", 24)
    except OSError:
        font = ImageFont.load_default()

    sheet = Image.new("RGB", (512, 372), "#111923")
    draw = ImageDraw.Draw(sheet)
    for index, (slug, (name, character_id, face_id)) in enumerate(FACES.items()):
        rgba = (SOURCE / f"{face_id:03d}.rgba").read_bytes()
        portrait = Image.frombytes("RGBA", (64, 80), rgba).convert("RGB")
        large = portrait.resize((256, 320), Image.Resampling.NEAREST)
        large.save(OUTPUT / f"{slug}-face-{face_id:03d}.png")
        x = index * 256
        sheet.paste(large, (x, 0))
        draw.text(
            (x + 128, 346),
            f"{name} / 人物 {character_id} / 头像 {face_id}",
            font=font,
            anchor="mm",
            fill="#f0d99b",
        )
    sheet.save(OUTPUT / "zhao-yun-wen-chou-reference.png")


if __name__ == "__main__":
    main()

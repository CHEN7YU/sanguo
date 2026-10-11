import json
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / "docs" / "original-audit" / "level-07-xuzhou-portraits"
records = json.loads((SOURCE / "portrait-provenance.json").read_text(encoding="utf-8"))["portraits"]
try:
    font = ImageFont.truetype("C:/Windows/Fonts/msyhbd.ttc", 22)
except OSError:
    font = ImageFont.load_default()
card_w, card_h = 256, 370
sheet = Image.new("RGB", (card_w * 5, card_h * 2), "#111923")
draw = ImageDraw.Draw(sheet)
for index, record in enumerate(records):
    face_id = record["faceId"]
    slug = record["slug"]
    rgba = (SOURCE / f"{slug}-face-{face_id:03d}.rgba").read_bytes()
    portrait = Image.frombytes("RGBA", (64, 80), rgba).convert("RGB")
    large = portrait.resize((256, 320), Image.Resampling.NEAREST)
    output = SOURCE / f"{slug}-face-{face_id:03d}.png"
    large.save(output, optimize=True)
    x, y = index % 5 * card_w, index // 5 * card_h
    sheet.paste(large, (x, y))
    draw.text((x + card_w / 2, y + 344), f"{record['name']} / 头像 {face_id}", font=font, anchor="mm", fill="#f0d99b")
sheet.save(SOURCE / "reference-sheet.png", optimize=True)
print(f"Built {len(records)} Xuzhou portrait references.")

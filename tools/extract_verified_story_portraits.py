from pathlib import Path

from PIL import Image, ImageDraw


ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / "tools" / "koei_viewer" / "output" / "hero-faces.png"
OUTPUT = ROOT / "assets" / "story-portraits" / "reference-v2"

# BAKDATA.R3 records are 21 bytes. Byte 14 maps the story character id to a
# FACEDAT.R3 portrait id. These ids are intentionally not the character ids.
CHARACTERS = {
    "liu-bei": ("刘备", 0, 0),
    "guan-yu": ("关羽", 1, 1),
    "zhang-fei": ("张飞", 2, 2),
    "dong-zhuo": ("董卓", 3, 136),
    "lv-bu": ("吕布", 4, 148),
    "hua-xiong": ("华雄", 5, 138),
    "li-ru": ("李儒", 6, 137),
    "kong-rong": ("孔融", 7, 195),
    "cao-cao": ("曹操", 8, 27),
    "yuan-shao": ("袁绍", 9, 110),
    "yuan-shu": ("袁术", 11, 144),
    "gongsun-zan": ("公孙瓒", 12, 107),
    "tao-qian": ("陶谦", 15, 189),
    "dong-cheng": ("董承", 19, 31),
    "li-su": ("李肃", 20, 139),
    "hu-zhen": ("胡轸", 21, 140),
    "zhao-cen": ("赵岑", 22, 56),
    "li-jue": ("李傕", 46, 141),
    "guo-si": ("郭汜", 47, 142),
    "officer": ("武官", 368, 222),
    "emperor": ("献帝", 382, 237),
}


def main() -> None:
    source = Image.open(SOURCE).convert("RGB")
    OUTPUT.mkdir(parents=True, exist_ok=True)
    records = []
    for slug, (name, character_id, face_id) in CHARACTERS.items():
        sx = (face_id % 20) * 64
        sy = (face_id // 20) * 80
        face = source.crop((sx, sy, sx + 64, sy + 80)).resize((256, 320), Image.Resampling.NEAREST)
        filename = f"{slug}-face-{face_id:03d}.png"
        face.save(OUTPUT / filename)
        records.append((slug, name, character_id, face_id, face))

    columns, cell_w, cell_h = 4, 280, 380
    rows = (len(records) + columns - 1) // columns
    sheet = Image.new("RGB", (columns * cell_w, rows * cell_h), (24, 20, 16))
    draw = ImageDraw.Draw(sheet)
    for index, (slug, name, character_id, face_id, face) in enumerate(records):
        x = (index % columns) * cell_w + 12
        y = (index // columns) * cell_h + 8
        sheet.paste(face, (x, y))
        draw.text((x, y + 326), f"{slug} / char {character_id} / face {face_id}", fill=(245, 220, 165))
    sheet.save(ROOT / "assets" / "story-portrait-reference-v2.jpg", quality=94)
    print(f"Extracted {len(records)} verified portraits to {OUTPUT}")


if __name__ == "__main__":
    main()

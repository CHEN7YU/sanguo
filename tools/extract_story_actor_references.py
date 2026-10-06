from pathlib import Path

from PIL import Image, ImageDraw


ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / "assets" / "story-actors-original.png"
OUTPUT = ROOT / "assets" / "story-actors" / "reference-v2"

ACTORS = {
    "liu-bei": ("刘备", 0),
    "guan-yu": ("关羽", 1),
    "zhang-fei": ("张飞", 2),
    "dong-zhuo": ("董卓", 3),
    "lv-bu": ("吕布", 4),
    "hua-xiong": ("华雄", 5),
    "li-ru": ("李儒", 6),
    "kong-rong": ("孔融", 7),
    "cao-cao": ("曹操", 8),
    "yuan-shao": ("袁绍", 9),
    "yuan-shu": ("袁术", 11),
    "gongsun-zan": ("公孙瓒", 12),
    "tao-qian": ("陶谦", 15),
    "officer": ("武官", 16),
    "emperor": ("献帝", 18),
    "dong-cheng": ("董承", 19),
    "li-su": ("李肃", 20),
    "hu-zhen": ("胡轸", 21),
    "zhao-cen": ("赵岑", 22),
    "li-jue": ("李傕", 26),
    "guo-si": ("郭汜", 27),
    "lady": ("夫人", 31),
    "maiden": ("少女", 32),
    "shopkeeper": ("道具屋", 35),
}


def main() -> None:
    source = Image.open(SOURCE).convert("RGBA")
    OUTPUT.mkdir(parents=True, exist_ok=True)
    for slug, (name, sprite_id) in ACTORS.items():
        column = sprite_id % 20
        row_block = sprite_id // 20
        strip = Image.new("RGBA", (4 * 192, 240), (0, 0, 0, 0))
        for direction in range(4):
            sx = column * 32
            sy = (row_block * 4 + direction) * 40
            frame = source.crop((sx, sy, sx + 32, sy + 40)).resize((192, 240), Image.Resampling.NEAREST)
            strip.alpha_composite(frame, (direction * 192, 0))
        strip.save(OUTPUT / f"{slug}-four-directions.png")

    sheet = Image.new("RGBA", (960, len(ACTORS) * 180), (18, 16, 14, 255))
    draw = ImageDraw.Draw(sheet)
    for row, (slug, (name, _)) in enumerate(ACTORS.items()):
        strip = Image.open(OUTPUT / f"{slug}-four-directions.png").resize((576, 180), Image.Resampling.NEAREST)
        sheet.alpha_composite(strip, (210, row * 180))
        draw.text((12, row * 180 + 70), f"{slug} / {name}", fill=(245, 220, 170, 255))
    sheet.convert("RGB").save(ROOT / "assets" / "story-actor-reference-v2.jpg", quality=94)
    print(f"Extracted {len(ACTORS)} actor direction references to {OUTPUT}")


if __name__ == "__main__":
    main()

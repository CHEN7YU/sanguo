from pathlib import Path

from PIL import Image, ImageDraw


ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / "assets" / "story-portraits" / "reference-v2"
OUTPUT = ROOT / "assets" / "story-portraits" / "reference-v4"

GROUPS = {
    "main": [
        "liu-bei-face-000.png",
        "guan-yu-face-001.png",
        "zhang-fei-face-002.png",
        "cao-cao-face-027.png",
    ],
    "allies": [
        "yuan-shao-face-110.png",
        "yuan-shu-face-144.png",
        "gongsun-zan-face-107.png",
        "tao-qian-face-189.png",
    ],
    "enemies": [
        "dong-zhuo-face-136.png",
        "lv-bu-face-148.png",
        "hua-xiong-face-138.png",
        "li-ru-face-137.png",
    ],
    "officials": [
        "kong-rong-face-195.png",
        "dong-cheng-face-031.png",
        "li-su-face-139.png",
        "hu-zhen-face-140.png",
    ],
    "late": [
        "zhao-cen-face-056.png",
        "li-jue-face-141.png",
        "guo-si-face-142.png",
        "emperor-face-237.png",
    ],
}


def main() -> None:
    OUTPUT.mkdir(parents=True, exist_ok=True)
    for group, names in GROUPS.items():
        sheet = Image.new("RGB", (1024, 1024), (18, 15, 12))
        draw = ImageDraw.Draw(sheet)
        for index, name in enumerate(names):
            image = Image.open(SOURCE / name).convert("RGB").resize((500, 500), Image.Resampling.NEAREST)
            x = index % 2 * 512 + 6
            y = index // 2 * 512 + 6
            sheet.paste(image, (x, y))
            draw.rectangle((x, y, x + 499, y + 499), outline=(230, 183, 83), width=4)
        path = OUTPUT / f"{group}-original-grid.png"
        sheet.save(path)
        print(path)


if __name__ == "__main__":
    main()

from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter


ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / "assets" / "story-chenliu-tent.png"
OUTPUT = ROOT / "assets" / "story-scenes" / "chenliu-tent-v2"

# Crops stay rectangular on purpose. They are redrawn over the identical base
# image at the same normalized coordinates, so their surrounding floor pixels
# make a seamless depth mask without a painted alpha halo.
PROPS = {
    "command-table": (930, 375, 1175, 535),
    "right-armory": (1435, 570, 1672, 790),
    "left-stool": (160, 535, 285, 690),
    "center-stool": (690, 735, 835, 895),
    "command-chair": (1140, 235, 1375, 510),
}

MASKS = {
    "command-table": [(14, 38), (86, 7), (224, 61), (228, 129), (171, 157), (26, 108)],
    "right-armory": [(30, 61), (75, 39), (102, 54), (137, 34), (182, 49), (230, 107), (210, 185), (173, 205), (138, 184), (104, 204), (48, 176), (27, 118)],
    "left-stool": [(39, 43), (75, 31), (94, 48), (91, 104), (74, 121), (48, 113), (34, 57)],
    "center-stool": [(42, 43), (88, 31), (106, 52), (101, 117), (80, 141), (48, 130), (34, 59)],
    "command-chair": [(56, 75), (105, 45), (168, 78), (190, 134), (174, 257), (81, 271), (47, 220)],
}


def main() -> None:
    image = Image.open(SOURCE).convert("RGBA")
    OUTPUT.mkdir(parents=True, exist_ok=True)
    for name, box in PROPS.items():
        prop = image.crop(box)
        mask = Image.new("L", prop.size, 0)
        ImageDraw.Draw(mask).polygon(MASKS[name], fill=255)
        mask = mask.filter(ImageFilter.GaussianBlur(0.7))
        prop.putalpha(mask)
        prop.save(OUTPUT / f"{name}-masked-v3.png", optimize=True)
    print(f"Built {len(PROPS)} Chenliu tent depth layers in {OUTPUT}")


if __name__ == "__main__":
    main()

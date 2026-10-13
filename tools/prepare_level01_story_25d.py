from pathlib import Path
from shutil import copy2

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
GENERATED = Path(r"C:\Users\Duanyang Home\.codex\generated_images\01a0dcc0-4ce1-7332-8543-d2fdad907556")
MASTER = ROOT / "assets-master" / "level-01-story-25d"
OUTPUT = ROOT / "dist" / "assets" / "story-scenes" / "level-01-25d"

SOURCES = {
    "luoyang-warlord-hall": GENERATED / "exec-e6d9b759-e28c-43e3-bbe0-45d7b5da31d9.png",
    "sishui-march-map": GENERATED / "exec-4cbceabb-6c37-4ba6-92de-2110790ac07b.png",
}


def main() -> None:
    MASTER.mkdir(parents=True, exist_ok=True)
    OUTPUT.mkdir(parents=True, exist_ok=True)
    for stem, source in SOURCES.items():
        master = MASTER / f"{stem}-master-v1.png"
        output = OUTPUT / f"{stem}-25d-v1.webp"
        copy2(source, master)
        with Image.open(source) as image:
            image.convert("RGB").save(output, "WEBP", quality=88, method=6)
            print(f"{output.name}: {image.width}x{image.height}, {output.stat().st_size} bytes")


if __name__ == "__main__":
    main()

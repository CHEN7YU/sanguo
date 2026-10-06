from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / "assets" / "story-actors" / "remaster-v3"


def main() -> None:
    for path in sorted(SOURCE.glob("*-walk-v3.png")):
        image = Image.open(path).convert("RGBA").resize((1024, 1024), Image.Resampling.LANCZOS)
        output = path.with_name(path.name.replace("-walk-v3.png", "-walk-sheet-v3.png"))
        image.save(output, optimize=True)
        print(output.name)


if __name__ == "__main__":
    main()

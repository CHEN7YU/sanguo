from pathlib import Path

from PIL import Image

from clean_story_actor_sheets import clean_sheet


ROOT = Path(__file__).resolve().parent.parent
GENERATED = Path.home() / ".codex" / "generated_images" / "01a0dcc0-4ce1-7332-8543-d2fdad907556"
OUTPUT = ROOT / "assets" / "story-actors" / "remaster-v3"

SOURCES = {
    "maiden": "exec-4120c1b5-f68c-4cdb-a326-2bc5e9ccf12e.png",
    "lady": "exec-0246775a-7898-44d3-8b0e-150978fd1482.png",
}


def main():
    OUTPUT.mkdir(parents=True, exist_ok=True)
    for slug, filename in SOURCES.items():
        raw = Image.open(GENERATED / filename).convert("RGBA")
        sheet = OUTPUT / f"{slug}-walk-sheet-v3.png"
        raw.resize((1024, 1024), Image.Resampling.LANCZOS).save(sheet, optimize=True)
        print(clean_sheet(sheet).relative_to(ROOT))


if __name__ == "__main__":
    main()

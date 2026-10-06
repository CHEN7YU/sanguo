from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parent.parent
GENERATED = Path.home() / ".codex" / "generated_images" / "01a0dcc0-4ce1-7332-8543-d2fdad907556"
OUTPUT = ROOT / "assets" / "story-actors" / "remaster-v3"

SHEETS = {
    "dong-zhuo": "exec-ae935ab5-b0bc-4448-b135-61068b6a6974.png",
    "lv-bu": "exec-b9072bd1-db53-4f58-9e3e-7c8c62a49b4a.png",
    "hua-xiong": "exec-42ba6b05-7e37-4148-b791-a5b08e81a775.png",
    "li-ru": "exec-a00c87f5-d581-42a0-8d29-a79fdcce05e2.png",
    "emperor": "exec-5acbe50e-2b90-430d-a6bf-529fdb3c1604.png",
    "dong-cheng": "exec-2c2db3c7-f4f7-469a-b1a6-cb9952f429ca.png",
    "li-su": "exec-0050c7ae-c176-46ac-8b12-34f7978b8d0e.png",
    "hu-zhen": "exec-d062d8e2-ca48-4bac-84cc-b2979c9ba5aa.png",
    "li-jue": "exec-00c3e765-facb-4c5e-adad-1736aa98781c.png",
    "guo-si": "exec-931b9f48-173a-4a93-a61a-413b93e66218.png",
    "zhao-cen": "exec-0acdaaf3-3147-4cba-bc9b-aa4f3f290424.png",
}


def main() -> None:
    OUTPUT.mkdir(parents=True, exist_ok=True)
    for slug, filename in SHEETS.items():
        source = Image.open(GENERATED / filename).convert("RGBA")
        raw = OUTPUT / f"{slug}-walk-v3.png"
        sheet = OUTPUT / f"{slug}-walk-sheet-v3.png"
        source.save(raw, optimize=True)
        source.resize((1024, 1024), Image.Resampling.LANCZOS).save(sheet, optimize=True)
        print(sheet.name)


if __name__ == "__main__":
    main()

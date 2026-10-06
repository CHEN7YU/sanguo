from pathlib import Path

from PIL import Image, ImageDraw


ROOT = Path(__file__).resolve().parent.parent
GENERATED = Path.home() / ".codex" / "generated_images" / "01a0dcc0-4ce1-7332-8543-d2fdad907556"
OUTPUT = ROOT / "assets" / "story-portraits" / "remaster-v3"

SHEETS = {
    "exec-d910e539-127b-4258-bf65-97fa08ec043f.png": ["liu-bei", "guan-yu", "zhang-fei", "cao-cao"],
    "exec-b12d522b-3865-4d35-bc00-1e1222d8690c.png": ["yuan-shao", "yuan-shu", "gongsun-zan", "tao-qian"],
    "exec-3f8c7b0e-2b55-42e5-b498-f0f85854a6d6.png": ["dong-zhuo", "lv-bu", "hua-xiong", "li-ru"],
    "exec-fab2f8fe-1d40-4001-986a-e1c044701861.png": ["kong-rong", "dong-cheng", "li-su", "hu-zhen"],
    "exec-e8e7492f-7597-488a-827f-6db0db0f4fac.png": ["zhao-cen", "li-jue", "guo-si", "emperor"],
}
SUPPORT_SHEET = "exec-3b0ee2b5-dda9-4723-9341-ec4ed8559d64.png"


def crop_four(path: Path, names: list[str]) -> None:
    sheet = Image.open(path).convert("RGB")
    half_w, half_h = sheet.width // 2, sheet.height // 2
    boxes = [
        (0, 0, half_w, half_h),
        (half_w, 0, sheet.width, half_h),
        (0, half_h, half_w, sheet.height),
        (half_w, half_h, sheet.width, sheet.height),
    ]
    for name, box in zip(names, boxes):
        portrait = sheet.crop(box).resize((512, 512), Image.Resampling.LANCZOS)
        portrait.save(OUTPUT / f"{name}-v3.png", optimize=True)


def crop_two(path: Path, names: list[str]) -> None:
    sheet = Image.open(path).convert("RGB")
    half_w = sheet.width // 2
    boxes = [(0, 0, half_w, sheet.height), (half_w, 0, sheet.width, sheet.height)]
    for name, box in zip(names, boxes):
        portrait = sheet.crop(box).resize((512, 512), Image.Resampling.LANCZOS)
        portrait.save(OUTPUT / f"{name}-v3.png", optimize=True)


def make_contact_sheet() -> None:
    files = sorted(OUTPUT.glob("*-v3.png"))
    columns, cell_w, cell_h = 5, 220, 255
    rows = (len(files) + columns - 1) // columns
    sheet = Image.new("RGB", (columns * cell_w, rows * cell_h), (20, 18, 15))
    draw = ImageDraw.Draw(sheet)
    for index, path in enumerate(files):
        portrait = Image.open(path).convert("RGB").resize((210, 210), Image.Resampling.LANCZOS)
        x = (index % columns) * cell_w + 5
        y = (index // columns) * cell_h + 5
        sheet.paste(portrait, (x, y))
        draw.text((x + 2, y + 218), path.stem, fill=(244, 220, 170))
    sheet.save(ROOT / "assets" / "story-portrait-remaster-v3-audit.jpg", quality=94)


def main() -> None:
    OUTPUT.mkdir(parents=True, exist_ok=True)
    for sheet, names in SHEETS.items():
        crop_four(GENERATED / sheet, names)
    crop_two(GENERATED / SUPPORT_SHEET, ["officer", "shopkeeper"])
    make_contact_sheet()
    print(f"Installed {len(list(OUTPUT.glob('*-v3.png')))} remastered portraits in {OUTPUT}")


if __name__ == "__main__":
    main()

from pathlib import Path

from PIL import Image, ImageDraw


ROOT = Path(__file__).resolve().parent.parent
GENERATED = Path.home() / ".codex" / "generated_images" / "01a0dcc0-4ce1-7332-8543-d2fdad907556"
OUTPUT = ROOT / "assets" / "story-portraits" / "remaster-v4"
V3 = ROOT / "assets" / "story-portraits" / "remaster-v3"

SHEETS = {
    "exec-8b4573fc-37a9-4536-8a0c-0cbde98ea55e.png": ["liu-bei", "guan-yu", "zhang-fei", "cao-cao"],
    "exec-2a24ffac-736b-4afe-9d8b-16f0afe5b18a.png": ["yuan-shao", "yuan-shu", "gongsun-zan", "tao-qian"],
    "exec-417c5d92-82cb-4d5f-847e-c6b8c86217cc.png": ["dong-zhuo", "lv-bu", "hua-xiong", "li-ru"],
    "exec-b9a4af74-5114-4b79-81d9-bc815f18d901.png": ["kong-rong", "dong-cheng", "li-su", "hu-zhen"],
    "exec-c1991743-732a-4bd5-89c8-2fa16f6f8038.png": ["zhao-cen", "li-jue", "guo-si", "emperor"],
}


def crop_four(path: Path, names: list[str]) -> None:
    sheet = Image.open(path).convert("RGB")
    half_width, half_height = sheet.width // 2, sheet.height // 2
    boxes = [
        (0, 0, half_width, half_height),
        (half_width, 0, sheet.width, half_height),
        (0, half_height, half_width, sheet.height),
        (half_width, half_height, sheet.width, sheet.height),
    ]
    for name, box in zip(names, boxes):
        image = sheet.crop(box)
        # Remove the generated grid rule without changing the portrait crop.
        inset = max(5, round(min(image.size) * 0.012))
        image = image.crop((inset, inset, image.width - inset, image.height - inset))
        image = image.resize((512, 512), Image.Resampling.LANCZOS)
        image.save(OUTPUT / f"{name}-v4.png", optimize=True)


def contact_sheet() -> None:
    names = [name for group in SHEETS.values() for name in group] + ["officer", "shopkeeper"]
    cell_width, cell_height, columns = 220, 255, 5
    rows = (len(names) + columns - 1) // columns
    sheet = Image.new("RGB", (cell_width * columns, cell_height * rows), (20, 18, 15))
    draw = ImageDraw.Draw(sheet)
    for index, name in enumerate(names):
        path = OUTPUT / f"{name}-v4.png"
        portrait = Image.open(path).convert("RGB").resize((210, 210), Image.Resampling.LANCZOS)
        x = index % columns * cell_width + 5
        y = index // columns * cell_height + 5
        sheet.paste(portrait, (x, y))
        draw.text((x + 2, y + 218), name, fill=(244, 220, 170))
    sheet.save(ROOT / "assets" / "story-portrait-remaster-v4-audit.jpg", quality=94)


def main() -> None:
    OUTPUT.mkdir(parents=True, exist_ok=True)
    for sheet, names in SHEETS.items():
        crop_four(GENERATED / sheet, names)
    for name in ("officer", "shopkeeper"):
        Image.open(V3 / f"{name}-v3.png").convert("RGB").save(OUTPUT / f"{name}-v4.png", optimize=True)
    contact_sheet()
    print(f"Installed {len(list(OUTPUT.glob('*-v4.png')))} remastered portraits in {OUTPUT}")


if __name__ == "__main__":
    main()

from pathlib import Path

from PIL import Image, ImageDraw


SOURCE = Path(__file__).resolve().parent.parent / "assets" / "story-portraits"
OUTPUT = SOURCE.parent / "story-portrait-audit.jpg"


def main() -> None:
    files = sorted(SOURCE.glob("*.png"))
    columns = 4
    cell_width = 200
    cell_height = 225
    rows = (len(files) + columns - 1) // columns
    sheet = Image.new("RGB", (columns * cell_width, rows * cell_height), (22, 20, 18))
    draw = ImageDraw.Draw(sheet)
    for index, path in enumerate(files):
        image = Image.open(path).convert("RGB")
        image.thumbnail((160, 170))
        cell_x = (index % columns) * cell_width
        cell_y = (index // columns) * cell_height
        x = cell_x + (cell_width - image.width) // 2
        sheet.paste(image, (x, cell_y + 5))
        draw.text((cell_x + 5, cell_y + 182), path.name, fill=(240, 220, 175))
    sheet.save(OUTPUT, quality=92)
    print(OUTPUT)


if __name__ == "__main__":
    main()

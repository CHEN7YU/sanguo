from collections import deque
from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / "assets" / "story-actors" / "remaster-v3"


def components(image: Image.Image):
    alpha = image.getchannel("A")
    width, height = image.size
    pixels = alpha.load()
    seen = set()
    found = []
    for y in range(height):
        for x in range(width):
            if pixels[x, y] < 20 or (x, y) in seen:
                continue
            queue = deque([(x, y)])
            seen.add((x, y))
            x0 = x1 = x
            y0 = y1 = y
            count = 0
            while queue:
                cx, cy = queue.popleft()
                count += 1
                x0, x1 = min(x0, cx), max(x1, cx)
                y0, y1 = min(y0, cy), max(y1, cy)
                for nx, ny in ((cx - 1, cy), (cx + 1, cy), (cx, cy - 1), (cx, cy + 1)):
                    if 0 <= nx < width and 0 <= ny < height and pixels[nx, ny] >= 20 and (nx, ny) not in seen:
                        seen.add((nx, ny))
                        queue.append((nx, ny))
            if count >= 6:
                found.append((count, (x0, y0, x1 + 1, y1 + 1)))
    return sorted(found, reverse=True)


def main() -> None:
    for path in sorted(SOURCE.glob("*-walk-sheet-v3.png")):
        image = Image.open(path).convert("RGBA")
        for row in range(4):
            for col in range(4):
                frame = image.crop((col * 256, row * 256, (col + 1) * 256, (row + 1) * 256))
                parts = components(frame)
                if len(parts) > 1 and parts[1][0] >= 30:
                    print(path.name, f"r{row}c{col}", parts[:5])


if __name__ == "__main__":
    main()

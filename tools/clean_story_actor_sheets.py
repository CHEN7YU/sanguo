from collections import deque
from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / "assets" / "story-actors" / "remaster-v3"


def largest_component_bbox(image: Image.Image):
    alpha = image.getchannel("A")
    width, height = image.size
    pixels = alpha.load()
    seen = set()
    best = None
    for y in range(height):
        for x in range(width):
            if pixels[x, y] < 20 or (x, y) in seen:
                continue
            queue = deque([(x, y)])
            seen.add((x, y))
            points = []
            while queue:
                cx, cy = queue.popleft()
                points.append((cx, cy))
                for nx, ny in ((cx - 1, cy), (cx + 1, cy), (cx, cy - 1), (cx, cy + 1)):
                    if 0 <= nx < width and 0 <= ny < height and pixels[nx, ny] >= 20 and (nx, ny) not in seen:
                        seen.add((nx, ny))
                        queue.append((nx, ny))
            if best is None or len(points) > len(best):
                best = points
    if not best:
        return (0, 0, width, height)
    xs = [point[0] for point in best]
    ys = [point[1] for point in best]
    return (max(0, min(xs) - 2), max(0, min(ys) - 2), min(width, max(xs) + 3), min(height, max(ys) + 3))


def clean_sheet(path: Path) -> Path:
    source = Image.open(path).convert("RGBA")
    frames = []
    bboxes = []
    for row in range(4):
        for col in range(4):
            frame = source.crop((col * 256, row * 256, (col + 1) * 256, (row + 1) * 256))
            bbox = largest_component_bbox(frame)
            frames.append(frame.crop(bbox))
            bboxes.append(bbox)
    max_width = max(frame.width for frame in frames)
    max_height = max(frame.height for frame in frames)
    scale = min(1.0, 220 / max_width, 236 / max_height)
    output = Image.new("RGBA", (1024, 1024), (0, 0, 0, 0))
    for index, frame in enumerate(frames):
        if scale < 1:
            frame = frame.resize((round(frame.width * scale), round(frame.height * scale)), Image.Resampling.LANCZOS)
        row, col = divmod(index, 4)
        x = col * 256 + (256 - frame.width) // 2
        y = row * 256 + 248 - frame.height
        output.alpha_composite(frame, (x, y))
    result = path.with_name(path.name.replace("-sheet-v3.png", "-sheet-v4.png"))
    output.save(result, optimize=True)
    return result


def main() -> None:
    for path in sorted(SOURCE.glob("*-walk-sheet-v3.png")):
        print(clean_sheet(path).name)


if __name__ == "__main__":
    main()

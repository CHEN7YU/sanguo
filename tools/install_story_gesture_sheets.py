from collections import deque
from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parent.parent
GENERATED = Path.home() / ".codex" / "generated_images" / "01a0dcc0-4ce1-7332-8543-d2fdad907556"
OUTPUT = ROOT / "assets" / "story-actors" / "gestures-v1"

SOURCES = {
    "liu-bei": "exec-b3d72091-ab32-4590-811e-e246600fa5cf.png",
    "cao-cao": "exec-aae1179f-9b16-4396-80be-86f9c0efba62.png",
    "guan-yu": "exec-015eb4c4-bddb-454c-8b0e-2017d05f1556.png",
    "zhang-fei": "exec-f34a6f3a-fcab-475a-a12e-8643be232805.png",
    "yuan-shao": "exec-571ca047-5485-4059-b0de-222c5fa9f007.png",
    "yuan-shu": "exec-07304201-50f8-4c20-92d6-3fdfefe8aa03.png",
    "gongsun-zan": "exec-9c48c730-9044-450e-863c-dc58cab7f715.png",
    "tao-qian": "exec-c5b4a1c3-6972-416a-8e41-643b4b35372c.png",
    "kong-rong": "exec-6f7a1fa3-3d1b-4540-939c-2d3d93c2b77c.png",
    "dong-zhuo": "exec-806cb0e0-ecba-4342-a375-4f4754e3a703.png",
    "lv-bu": "exec-ea0286eb-a360-493e-8560-ecae25d3f186.png",
    "hua-xiong": "exec-baa11247-38c1-479d-9d27-2e7986c38e07.png",
    "li-ru": "exec-7177e516-0893-4255-a50a-e76cd3ef3810.png",
    "emperor": "exec-8b545142-6922-4c88-8a64-8bc3d02e86a0.png",
    "dong-cheng": "exec-0a74bf0f-96e1-4522-8c87-8348294a88d1.png",
    "officer": "exec-0506671e-c7bd-46a6-b7ba-ae3e42d994f8.png",
    "shopkeeper": "exec-f3580348-7aea-451e-9f0c-ae6b6c389505.png",
}


def largest_component_bbox(image: Image.Image):
    alpha = image.getchannel("A")
    width, height = image.size
    pixels = alpha.load()
    seen = set()
    best = []
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
            if len(points) > len(best):
                best = points
    if not best:
        return (0, 0, width, height)
    xs = [point[0] for point in best]
    ys = [point[1] for point in best]
    return (max(0, min(xs) - 3), max(0, min(ys) - 3), min(width, max(xs) + 4), min(height, max(ys) + 4))


def build_sheet(source_path: Path, output_path: Path):
    source = Image.open(source_path).convert("RGBA")
    cell_w, cell_h = source.width // 2, source.height // 2
    frames = []
    for row in range(2):
        for col in range(2):
            frame = source.crop((col * cell_w, row * cell_h, (col + 1) * cell_w, (row + 1) * cell_h))
            frames.append(frame.crop(largest_component_bbox(frame)))
    scale = min(1.0, 222 / max(frame.width for frame in frames), 238 / max(frame.height for frame in frames))
    sheet = Image.new("RGBA", (1024, 256), (0, 0, 0, 0))
    for col, frame in enumerate(frames):
        if scale < 1:
            frame = frame.resize((round(frame.width * scale), round(frame.height * scale)), Image.Resampling.LANCZOS)
        x = col * 256 + (256 - frame.width) // 2
        y = 248 - frame.height
        sheet.alpha_composite(frame, (x, y))
    sheet.save(output_path, optimize=True)


def main():
    OUTPUT.mkdir(parents=True, exist_ok=True)
    for slug, filename in SOURCES.items():
        output = OUTPUT / f"{slug}-gesture-sheet-v1.png"
        build_sheet(GENERATED / filename, output)
        print(output.relative_to(ROOT))


if __name__ == "__main__":
    main()

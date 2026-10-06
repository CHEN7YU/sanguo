"""Pack five disconnected animation poses into strict equal-width alpha cells.

Image generation can place adjacent poses across nominal cell boundaries. This
tool labels opaque connected components, assigns them to the five largest pose
components, removes neighboring-frame pixels, and repacks the poses on a common
ground baseline without rescaling the artwork.
"""

from __future__ import annotations

import argparse
from pathlib import Path

import numpy as np
from PIL import Image


def find_runs(mask: np.ndarray):
    parent: list[int] = []
    runs: list[tuple[int, int, int, int]] = []
    previous: list[tuple[int, int, int]] = []

    def make_set() -> int:
        parent.append(len(parent))
        return len(parent) - 1

    def find(index: int) -> int:
        while parent[index] != index:
            parent[index] = parent[parent[index]]
            index = parent[index]
        return index

    def union(left: int, right: int) -> None:
        left, right = find(left), find(right)
        if left != right:
            parent[right] = left

    for y, row in enumerate(mask):
        padded = np.pad(row.astype(np.int8), (1, 1))
        changes = np.diff(padded)
        starts = np.flatnonzero(changes == 1)
        ends = np.flatnonzero(changes == -1) - 1
        current: list[tuple[int, int, int]] = []
        p = 0
        for start, end in zip(starts.tolist(), ends.tolist()):
            run_id = make_set()
            while p < len(previous) and previous[p][1] < start - 1:
                p += 1
            q = p
            while q < len(previous) and previous[q][0] <= end + 1:
                union(run_id, previous[q][2])
                q += 1
            current.append((start, end, run_id))
            runs.append((y, start, end, run_id))
        previous = current

    components: dict[int, dict[str, int]] = {}
    for y, start, end, run_id in runs:
        root = find(run_id)
        item = components.setdefault(root, {"area": 0, "x0": start, "x1": end, "y0": y, "y1": y})
        item["area"] += end - start + 1
        item["x0"] = min(item["x0"], start)
        item["x1"] = max(item["x1"], end)
        item["y0"] = min(item["y0"], y)
        item["y1"] = max(item["y1"], y)
    normalized_runs = [(y, start, end, find(run_id)) for y, start, end, run_id in runs]
    return normalized_runs, components


def pack(source: Path, destination: Path, frames: int = 5) -> list[tuple[int, int, int, int]]:
    image = Image.open(source).convert("RGBA")
    rgba = np.asarray(image)
    runs, components = find_runs(rgba[:, :, 3] > 10)
    seeds = sorted(components, key=lambda root: components[root]["area"], reverse=True)[:frames]
    if len(seeds) != frames:
        raise RuntimeError(f"expected {frames} poses, found {len(seeds)}")
    seeds.sort(key=lambda root: (components[root]["x0"] + components[root]["x1"]) / 2)
    centers = [(components[root]["x0"] + components[root]["x1"]) / 2 for root in seeds]
    assignment: dict[int, int] = {}
    for root, item in components.items():
        if item["area"] < 12:
            continue
        center = (item["x0"] + item["x1"]) / 2
        assignment[root] = min(range(frames), key=lambda index: abs(center - centers[index]))

    masks = [np.zeros(rgba.shape[:2], dtype=bool) for _ in range(frames)]
    for y, start, end, root in runs:
        group = assignment.get(root)
        if group is not None:
            masks[group][y, start : end + 1] = True

    poses: list[Image.Image] = []
    bounds: list[tuple[int, int, int, int]] = []
    for mask in masks:
        ys, xs = np.nonzero(mask)
        if not len(xs):
            raise RuntimeError("empty pose after component assignment")
        x0, x1, y0, y1 = int(xs.min()), int(xs.max()) + 1, int(ys.min()), int(ys.max()) + 1
        isolated = np.zeros((y1 - y0, x1 - x0, 4), dtype=np.uint8)
        crop_mask = mask[y0:y1, x0:x1]
        isolated[crop_mask] = rgba[y0:y1, x0:x1][crop_mask]
        poses.append(Image.fromarray(isolated, "RGBA"))
        bounds.append((x0, y0, x1 - x0, y1 - y0))

    margin_x, margin_bottom, margin_top = 52, 36, 28
    cell_width = max(pose.width for pose in poses) + margin_x * 2
    canvas_height = max(max(pose.height for pose in poses) + margin_top + margin_bottom, image.height)
    baseline = canvas_height - margin_bottom
    output = Image.new("RGBA", (cell_width * frames, canvas_height), (0, 0, 0, 0))
    for index, pose in enumerate(poses):
        x = index * cell_width + (cell_width - pose.width) // 2
        y = baseline - pose.height
        output.alpha_composite(pose, (x, y))
    destination.parent.mkdir(parents=True, exist_ok=True)
    output.save(destination, optimize=True)
    return bounds


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("source", type=Path)
    parser.add_argument("destination", type=Path)
    args = parser.parse_args()
    bounds = pack(args.source, args.destination)
    print(f"packed {args.destination} from {args.source}")
    for index, bound in enumerate(bounds):
        print(index, *bound)


if __name__ == "__main__":
    main()

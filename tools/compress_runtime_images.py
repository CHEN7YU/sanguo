"""Convert runtime PNG assets to validated WebP files.

The source PNG must have a byte-identical copy under --backup-root before it is
removed.  This keeps the editable master safe while shrinking the runnable and
published builds.  Text references are updated only after every image passes
dimension, alpha and PSNR checks.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import math
from pathlib import Path

from PIL import Image, ImageChops, ImageStat


TEXT_SUFFIXES = {".html", ".css", ".js", ".mjs", ".cjs", ".json", ".md"}
SKIP_DIRS = {".git", "assets", "assets-master", "node_modules"}
LOSSLESS_NAMES = {"inktolife-logo.png", "story-actors.png"}


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def has_visible_alpha(image: Image.Image) -> bool:
    if "A" not in image.getbands():
        return False
    alpha = image.getchannel("A")
    return alpha.getextrema()[0] < 255


def composite_rgb(image: Image.Image) -> Image.Image:
    rgba = image.convert("RGBA")
    backdrop = Image.new("RGBA", rgba.size, (38, 43, 48, 255))
    return Image.alpha_composite(backdrop, rgba).convert("RGB")


def psnr(source: Image.Image, encoded: Image.Image) -> float:
    source_sample = composite_rgb(source)
    encoded_sample = composite_rgb(encoded)
    source_sample.thumbnail((1024, 1024), Image.Resampling.LANCZOS)
    encoded_sample.thumbnail((1024, 1024), Image.Resampling.LANCZOS)
    diff = ImageChops.difference(source_sample, encoded_sample)
    stats = ImageStat.Stat(diff)
    mse = sum(value * value for value in stats.rms) / len(stats.rms)
    if mse == 0:
        return math.inf
    return 20 * math.log10(255 / math.sqrt(mse))


def encode_webp(source: Path, target: Path, minimum_psnr: float) -> dict:
    with Image.open(source) as opened:
        image = opened.copy()
    transparent = has_visible_alpha(image)
    lossless = source.name.lower() in LOSSLESS_NAMES
    quality = 92 if transparent else 90
    target.parent.mkdir(parents=True, exist_ok=True)

    def save() -> None:
        options = {"format": "WEBP", "method": 4}
        if lossless:
            options["lossless"] = True
        else:
            options.update(quality=quality, alpha_quality=100)
        image.save(target, **options)

    save()
    with Image.open(target) as decoded_opened:
        decoded = decoded_opened.copy()
    score = psnr(image, decoded)
    if not lossless and score < minimum_psnr:
        quality = 96
        save()
        with Image.open(target) as decoded_opened:
            decoded = decoded_opened.copy()
        score = psnr(image, decoded)
    if score < minimum_psnr:
        lossless = True
        save()
        with Image.open(target) as decoded_opened:
            decoded = decoded_opened.copy()
        score = psnr(image, decoded)

    if decoded.size != image.size:
        raise RuntimeError(f"dimension mismatch: {source}")
    if has_visible_alpha(image):
        if "A" not in decoded.getbands():
            raise RuntimeError(f"alpha channel missing: {source}")
        if ImageChops.difference(image.convert("RGBA").getchannel("A"), decoded.convert("RGBA").getchannel("A")).getbbox():
            raise RuntimeError(f"alpha channel changed: {source}")
    if score < minimum_psnr:
        raise RuntimeError(f"PSNR {score:.2f} below {minimum_psnr}: {source}")

    return {
        "source_bytes": source.stat().st_size,
        "target_bytes": target.stat().st_size,
        "psnr": None if math.isinf(score) else round(score, 2),
        "lossless": lossless,
        "transparent": transparent,
    }


def compress_tree(asset_root: Path, backup_asset_root: Path, minimum_psnr: float) -> tuple[dict[str, str], list[dict]]:
    mapping: dict[str, str] = {}
    reports: list[dict] = []
    masters = sorted(backup_asset_root.rglob("*.png"))
    for index, backup in enumerate(masters, 1):
        relative = backup.relative_to(backup_asset_root)
        source = asset_root / relative
        backup = backup_asset_root / relative
        target = source.with_suffix(".webp")
        if source.is_file():
            if sha256(source) != sha256(backup):
                raise RuntimeError(f"master backup differs: {backup}")
            report = encode_webp(source, target, minimum_psnr)
            source.unlink()
        elif target.is_file():
            report = encode_webp(backup, target, minimum_psnr)
        else:
            raise RuntimeError(f"runtime source and WebP both missing: {source}")
        old_url = "assets/" + relative.as_posix()
        new_url = "assets/" + relative.with_suffix(".webp").as_posix()
        mapping[old_url] = new_url
        reports.append({"file": relative.as_posix(), **report})
        if index % 20 == 0 or index == len(masters):
            print(f"{asset_root}: {index}/{len(masters)}", flush=True)
    return mapping, reports


def update_references(project_root: Path, mapping: dict[str, str]) -> list[str]:
    changed: list[str] = []
    for path in project_root.rglob("*"):
        if not path.is_file() or path.suffix.lower() not in TEXT_SUFFIXES:
            continue
        if any(part in SKIP_DIRS for part in path.relative_to(project_root).parts[:-1]):
            continue
        text = path.read_text(encoding="utf-8")
        updated = text
        for old, new in mapping.items():
            updated = updated.replace(old, new)
        if updated != text:
            path.write_text(updated, encoding="utf-8", newline="")
            changed.append(path.relative_to(project_root).as_posix())
    return changed


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--project-root", type=Path, required=True)
    parser.add_argument("--backup-root", type=Path, required=True)
    parser.add_argument("--minimum-psnr", type=float, default=34.0)
    args = parser.parse_args()

    project_root = args.project_root.resolve()
    backup_root = args.backup_root.resolve()
    jobs = [
        (project_root / "assets", backup_root / "assets"),
        (project_root / "site-test" / "dist" / "assets", backup_root / "site-test" / "dist" / "assets"),
    ]
    combined_mapping: dict[str, str] = {}
    reports: list[dict] = []
    for asset_root, backup_asset_root in jobs:
        if not asset_root.is_dir():
            continue
        mapping, tree_reports = compress_tree(asset_root, backup_asset_root, args.minimum_psnr)
        combined_mapping.update(mapping)
        reports.extend({"tree": str(asset_root.relative_to(project_root)), **item} for item in tree_reports)

    changed = update_references(project_root, combined_mapping)
    report_path = project_root / "docs" / "runtime-image-compression-report.json"
    report_path.parent.mkdir(parents=True, exist_ok=True)
    report = {
        "converted_files": len(reports),
        "source_bytes": sum(item["source_bytes"] for item in reports),
        "target_bytes": sum(item["target_bytes"] for item in reports),
        "changed_text_files": changed,
        "images": reports,
    }
    report_path.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps({key: value for key, value in report.items() if key != "images"}, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()

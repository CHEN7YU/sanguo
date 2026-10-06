from pathlib import Path

import numpy as np
from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "assets"
OUTPUT = ASSETS / "friendly"

FILES = {
    "hua-squad.webp": "hua-squad-friendly-v1.webp",
    "xiliang-infantry-squad.webp": "infantry-squad-friendly-v1.webp",
    "xiliang-archer-squad.webp": "archer-squad-friendly-v1.webp",
    "xiliang-officer-squad.webp": "officer-squad-friendly-v1.webp",
    "military-band-remaster-v1.webp": "support-friendly-v1.webp",
    "troops/martial-artist-v1.webp": "martial-artist-friendly-v1.webp",
    "troops/bandit-v1.webp": "bandit-friendly-v1.webp",
    "hua-walk-v1.webp": "hua-walk-friendly-v1.webp",
    "officer-walk-v1.webp": "officer-walk-friendly-v1.webp",
    "archer-walk-v1.webp": "archer-walk-friendly-v1.webp",
    "infantry-walk-v1.webp": "infantry-walk-friendly-v1.webp",
    "hua-attack.webp": "hua-attack-friendly-v1.webp",
    "infantry-attack.webp": "infantry-attack-friendly-v1.webp",
    "archer-attack.webp": "archer-attack-friendly-v1.webp",
    "officer-attack.webp": "officer-attack-friendly-v1.webp",
    "hua-death-v1.webp": "hua-death-friendly-v1.webp",
    "wounded-units-atlas-v1.webp": "wounded-units-atlas-friendly-v1.webp",
}


def convert(source: Path, target: Path) -> None:
    image = Image.open(source).convert("RGBA")
    pixels = np.array(image, dtype=np.uint8)
    red = pixels[..., 0].astype(np.int16)
    green = pixels[..., 1].astype(np.int16)
    blue = pixels[..., 2].astype(np.int16)
    alpha = pixels[..., 3]
    red_cloth = (
        (alpha > 0)
        & (red > 62)
        & (red > np.maximum(green, blue) * 1.25)
        & (np.abs(green - blue) < red * 0.18)
    )
    pixels[..., 0][red_cloth] = np.rint(red[red_cloth] * 0.23).clip(0, 255).astype(np.uint8)
    pixels[..., 1][red_cloth] = np.rint(np.maximum(green[red_cloth], red[red_cloth] * 0.55)).clip(0, 255).astype(np.uint8)
    pixels[..., 2][red_cloth] = np.rint(np.maximum(blue[red_cloth], red[red_cloth] * 0.84)).clip(0, 255).astype(np.uint8)
    target.parent.mkdir(parents=True, exist_ok=True)
    Image.fromarray(pixels, "RGBA").save(target, "WEBP", quality=88, method=6, exact=True)
    print(f"{target.relative_to(ROOT)}\t{target.stat().st_size}")


def main() -> None:
    for source_name, target_name in FILES.items():
        source = ASSETS / source_name
        if not source.exists():
            raise FileNotFoundError(source)
        convert(source, OUTPUT / target_name)


if __name__ == "__main__":
    main()

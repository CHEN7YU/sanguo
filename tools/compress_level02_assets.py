from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1] / "assets"
NAMES = [
    "hulao-remaster-v1",
    "lvbu-squad-v1",
    "zhangliao-squad-v1",
    "houcheng-squad-v1",
    "songxian-squad-v1",
    "weixu-squad-v1",
    "zhang-liao-portrait-v1",
    "hou-cheng-portrait-v1",
    "song-xian-portrait-v1",
    "wei-xu-portrait-v1",
]


for name in NAMES:
    source = ROOT / f"{name}.png"
    target = ROOT / f"{name}.webp"
    image = Image.open(source)
    image.save(target, "WEBP", quality=88, method=6, alpha_quality=100)
    print(f"{name}: {source.stat().st_size} -> {target.stat().st_size}")

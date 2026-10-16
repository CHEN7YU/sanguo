from PIL import Image, ImageChops
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
FILES = [
    ROOT / 'assets' / 'troops' / 'bandit-walk-v4.webp',
    ROOT / 'assets' / 'friendly' / 'bandit-walk-friendly-v4.webp',
]
CELL_W, CELL_H = 300, 320
for path in FILES:
    im = Image.open(path).convert('RGBA')
    assert im.size == (CELL_W * 4, CELL_H * 4), f'{path.name}: wrong atlas size {im.size}'
    for row in range(4):
        frames = [im.crop((col*CELL_W, row*CELL_H, (col+1)*CELL_W, (row+1)*CELL_H)) for col in range(4)]
        alpha = [f.getchannel('A') for f in frames]
        for idx, mask in enumerate(alpha):
            assert mask.getbbox(), f'{path.name}: row {row} frame {idx} is empty'
        # Focus on the lower 45% where the legs and feet are. Adjacent gait frames
        # must change enough to remain visible after the sprite is scaled down in game.
        lower = [m.crop((0, int(CELL_H*.55), CELL_W, CELL_H)) for m in alpha]
        changed = []
        for a, b in zip(lower, lower[1:] + lower[:1]):
            diff = ImageChops.difference(a, b)
            changed.append(sum(1 for px in diff.getdata() if px > 24))
        assert min(changed) >= 900, f'{path.name}: weak leg motion in row {row}: {changed}'
        print(f'{path.name} row {row}: changed lower-body pixels {changed}')
print('bandit walk v4 animation verification passed')

#!/usr/bin/env python3
"""Build the release Julu art with a strict 18x18 terrain-to-pixel contract."""
from __future__ import annotations

import json
import random
from pathlib import Path
from PIL import Image, ImageChops, ImageDraw, ImageEnhance, ImageFilter

ROOT=Path(__file__).resolve().parents[1]
DATA=ROOT/'docs/original-audit/level-04-julu-map.json'
OUTPUT=ROOT/'assets-master/level-04-julu/julu-map-aligned-v3.png'
SIZE=2048

data=json.loads(DATA.read_text(encoding='utf-8'))
rows=data['terrain_codes']
def texture(filename, color=1.0, contrast=1.0, brightness=1.0):
    image=Image.open(ROOT/'assets-master/level-04-julu/terrain-textures'/filename).convert('RGB').resize((SIZE,SIZE),Image.Resampling.LANCZOS)
    image=ImageEnhance.Color(image).enhance(color)
    image=ImageEnhance.Contrast(image).enhance(contrast)
    image=ImageEnhance.Brightness(image).enhance(brightness)
    return image.filter(ImageFilter.UnsharpMask(radius=1.2,percent=90,threshold=3))

textures={
    'rough':texture('rough-v1.png',.84,1.01,.91),
    'cliff':texture('cliff-v1.png',.76,1.06,.86),
    'plain':texture('grass-v1.png',.76,.98,1.02),
    'grass':texture('grass-v1.png',.90,1.01,.90),
    'forest':texture('forest-v1.png',.80,1.04,.83),
}

def bounds(index):
    return round(index*SIZE/18),round((index+1)*SIZE/18)

masks={name:Image.new('L',(SIZE,SIZE),0) for name in textures}
draws={name:ImageDraw.Draw(mask) for name,mask in masks.items()}
for y,row in enumerate(rows):
    for x,code in enumerate(row):
        x0,x1=bounds(x);y0,y1=bounds(y)
        if code==0x09: category='cliff'
        elif code==0x01: category='forest'
        elif code in {0x00,0x0D}: category='plain'
        elif code in {0x07,0x08}: category='grass'
        else: category='rough'
        draws[category].rectangle((x0,y0,x1,y1),fill=255)

# A soft edge joins the painterly source textures without moving a terrain
# boundary far enough to confuse which square is passable.
for name in masks:
    masks[name]=masks[name].filter(ImageFilter.GaussianBlur(10))

canvas=textures['rough'].copy()
for name in ('plain','grass','forest','cliff'):
    canvas=Image.composite(textures[name],canvas,masks[name])

# Add restrained deterministic grain after compositing so rescaled texture
# regions do not look like large repeated photographs.
random.seed(1804)
noise=Image.new('RGBA',(SIZE,SIZE),(0,0,0,0));nd=ImageDraw.Draw(noise)
for _ in range(14500):
    x=random.randrange(SIZE);y=random.randrange(SIZE);v=random.choice((-1,1));a=random.randrange(4,15)
    color=(245,228,178,a) if v>0 else (24,32,24,a)
    nd.point((x,y),fill=color)
canvas=Image.alpha_composite(canvas.convert('RGBA'),noise)

# True square cells are intentionally readable at high zoom and on touch
# screens; the line is subtle enough to disappear at overview scale.
grid=Image.new('RGBA',(SIZE,SIZE),(0,0,0,0));gd=ImageDraw.Draw(grid)
for i in range(19):
    p=round(i*SIZE/18)
    gd.line((p,0,p,SIZE),fill=(248,225,164,24),width=1)
    gd.line((0,p,SIZE,p),fill=(248,225,164,24),width=1)
canvas=Image.alpha_composite(canvas,grid).convert('RGB')
canvas.save(OUTPUT,optimize=True)
print(OUTPUT)

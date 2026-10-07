#!/usr/bin/env python3
"""Crop and compress the approved Qinghe portrait and mounted unit masters."""
from pathlib import Path
from PIL import Image, ImageOps

ROOT=Path(__file__).resolve().parents[1]
GENERATED=Path(r"C:/Users/Duanyang Home/.codex/generated_images/01a0dcc0-4ce1-7332-8543-d2fdad907556")
OUT=ROOT/"assets/level-04-qinghe"
MASTER=ROOT/"assets-master/level-04-qinghe"
OUT.mkdir(parents=True,exist_ok=True); MASTER.mkdir(parents=True,exist_ok=True)

characters={
    "qu-yi":{
        "sheet":GENERATED/"exec-4eaaf619-1885-4227-9df3-ad970b7b759f.png",
        "unit":GENERATED/"exec-0f7ab727-d12b-40b5-84ff-5a46d9626c84.png",
        "portrait_side":"left"
    },
    "yan-gang":{
        "sheet":GENERATED/"exec-b3e3f6e9-edd1-4d83-a488-d3da495032dc.png",
        "unit":GENERATED/"exec-92fe1207-a7e5-455d-b6cb-0d9379cfd3ae.png",
        "portrait_side":"left"
    }
}

for slug,cfg in characters.items():
    sheet=Image.open(cfg["sheet"]).convert("RGB")
    w,h=sheet.size
    portrait=sheet.crop((0,0,w//2,h))
    portrait=ImageOps.fit(portrait,(512,640),method=Image.Resampling.LANCZOS,centering=(.5,.35))
    portrait.save(MASTER/f"{slug}-portrait-v1.png",optimize=True)
    portrait.save(OUT/f"{slug}-portrait-v1.webp","WEBP",quality=86,method=6)

    unit=Image.open(cfg["unit"]).convert("RGBA")
    bbox=unit.getbbox()
    if bbox: unit=unit.crop(bbox)
    unit.thumbnail((560,700),Image.Resampling.LANCZOS)
    framed=Image.new("RGBA",(640,720),(0,0,0,0))
    framed.alpha_composite(unit,((640-unit.width)//2,720-unit.height-8))
    framed.save(MASTER/f"{slug}-mounted-v1.png",optimize=True)
    framed.save(OUT/f"{slug}-mounted-v1.webp","WEBP",quality=84,method=6)
    print(slug,(OUT/f"{slug}-portrait-v1.webp").stat().st_size,(OUT/f"{slug}-mounted-v1.webp").stat().st_size)

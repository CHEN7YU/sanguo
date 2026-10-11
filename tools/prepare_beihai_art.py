"""Install and compress the verified Beihai portraits and battlefield cutouts."""
from pathlib import Path
from PIL import Image, ImageOps
import shutil

ROOT=Path(__file__).resolve().parent.parent
GEN=Path.home()/'.codex'/'generated_images'/'01a0dcc0-4ce1-7332-8543-d2fdad907556'
MASTER=ROOT/'assets-master'/'level-06-beihai'
OUT=ROOT/'assets'/'level-06-beihai'
PORTRAITS=OUT/'portraits'
MASTER.mkdir(parents=True,exist_ok=True); PORTRAITS.mkdir(parents=True,exist_ok=True)

portrait_atlas=GEN/'exec-2f58756d-e230-48f2-be3d-e36da8322230.png'
unit_atlas=GEN/'exec-d95254c9-7941-4489-97a0-5dc405b15247.png'
individual={
    'taishi-ci':GEN/'exec-fec53183-9ac5-441a-b0ab-4b7938a9da6e.png',
    'meng-su':GEN/'exec-7f172581-9818-4e31-9f4d-3f449ba6a372.png',
    'mi-zhu':GEN/'exec-00e94885-8569-4e6a-97f6-41159bce9682.png',
}

shutil.copy2(portrait_atlas,MASTER/'beihai-portrait-atlas-master-v1.png')
shutil.copy2(unit_atlas,MASTER/'beihai-unit-atlas-master-v1.png')
for slug,source in individual.items(): shutil.copy2(source,MASTER/f'{slug}-portrait-master-v1.png')

atlas=Image.open(portrait_atlas).convert('RGB'); w,h=atlas.size
for slug,box in {
    'guan-hai':(0,0,w//2,h//2),
    'kong-rong':(w//2,0,w,h//2),
}.items():
    ImageOps.fit(atlas.crop(box),(512,512),method=Image.Resampling.LANCZOS).save(PORTRAITS/f'{slug}-v1.webp','WEBP',quality=87,method=6)
for slug,source in individual.items():
    ImageOps.fit(Image.open(source).convert('RGB'),(512,512),method=Image.Resampling.LANCZOS,centering=(.5,.37)).save(PORTRAITS/f'{slug}-v1.webp','WEBP',quality=87,method=6)

atlas=Image.open(unit_atlas).convert('RGBA'); w,h=atlas.size
for slug,box in {
    'guan-hai':(0,0,w//2,h//2),
    'kong-rong':(w//2,0,w,h//2),
    'meng-su':(0,h//2,w//2,h),
    'taishi-ci':(w//2,h//2,w,h),
}.items():
    crop=atlas.crop(box)
    bounds=crop.getbbox()
    if bounds: crop=crop.crop(bounds)
    canvas=Image.new('RGBA',(512,512),(0,0,0,0))
    fitted=ImageOps.contain(crop,(460,460),method=Image.Resampling.LANCZOS)
    canvas.alpha_composite(fitted,((512-fitted.width)//2,492-fitted.height))
    canvas.save(OUT/f'{slug}-unit-v1.webp','WEBP',lossless=True,method=6)

beast=Image.open(GEN/'exec-90b4b2e4-7ed7-4c22-8fa0-87b60720bc93.png').convert('RGBA')
bounds=beast.getbbox()
if bounds: beast=beast.crop(bounds)
canvas=Image.new('RGBA',(640,512),(0,0,0,0)); fitted=ImageOps.contain(beast,(620,492),method=Image.Resampling.LANCZOS)
canvas.alpha_composite(fitted,((640-fitted.width)//2,505-fitted.height)); canvas.save(OUT/'beast-unit-v1.webp','WEBP',lossless=True,method=6)

print('Prepared Beihai portraits and tactical unit cutouts.')

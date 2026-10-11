"""Build compact authored motion strips from approved Beihai unit masters."""
from pathlib import Path
from PIL import Image, ImageOps, ImageEnhance
import json

ROOT=Path(__file__).resolve().parent.parent
SRC=ROOT/'assets'/'level-06-beihai'
OUT=SRC/'animation'
UNITS=['guan-hai','kong-rong','meng-su','taishi-ci','beast']

def trim(im):
    box=im.getbbox()
    return im.crop(box) if box else im

def fit_actor(path,limit=(250,280)):
    im=trim(Image.open(path).convert('RGBA'))
    return ImageOps.contain(im,limit,method=Image.Resampling.LANCZOS)

def place(cell,actor,x,y):
    layer=Image.new('RGBA',cell.size,(0,0,0,0)); layer.alpha_composite(actor,(int(x),int(y))); return layer

def bbox_in_cell(sheet,box):
    crop=sheet.crop(box); b=crop.getbbox(); return [0,0,1,1] if not b else list(b)

all_bounds={}
for slug in UNITS:
    source=SRC/(f'{slug}-unit-v1.webp')
    actor=fit_actor(source,(205 if slug=='beast' else 178,205))
    cell=240
    unit_dir=OUT/slug; unit_dir.mkdir(parents=True,exist_ok=True)

    walk=Image.new('RGBA',(cell*4,cell*4),(0,0,0,0)); walk_bounds=[]
    for row in range(4):
        row_bounds=[]
        base=ImageOps.mirror(actor) if row==2 else actor
        for frame,(bob,squash,shift) in enumerate([(0,1.0,0),(5,.975,3),(0,1.0,0),(-3,1.02,-3)]):
            f=base.resize((base.width,max(1,int(base.height*squash))),Image.Resampling.LANCZOS)
            x=row*0+(cell-f.width)//2+shift; y=cell-f.height-8+bob
            walk.alpha_composite(f,(frame*cell+x,row*cell+y))
            row_bounds.append([x,y,f.width,f.height])
        walk_bounds.append(row_bounds)
    walk.save(unit_dir/f'{slug}-walk-v1.webp','WEBP',quality=76,method=6)

    def strip(kind,transforms):
        sheet=Image.new('RGBA',(cell*5,cell),(0,0,0,0)); bounds=[]
        for i,(scale,angle,dx,dy,alpha) in enumerate(transforms):
            f=actor.resize((max(1,int(actor.width*scale[0])),max(1,int(actor.height*scale[1]))),Image.Resampling.LANCZOS)
            if angle: f=f.rotate(angle,resample=Image.Resampling.BICUBIC,expand=True)
            if alpha<1:
                a=f.getchannel('A').point(lambda p:int(p*alpha)); f.putalpha(a)
            x=(cell-f.width)//2+dx; y=cell-f.height-8+dy
            sheet.alpha_composite(f,(i*cell+x,y)); bounds.append([x,y,f.width,f.height])
        sheet.save(unit_dir/f'{slug}-{kind}-v1.webp','WEBP',quality=76,method=6)
        return bounds
    attack=strip('attack',[((1,1),0,0,0,1),((.98,1.02),5,-12,-2,1),((1.03,.98),-5,-25,3,1),((1.05,.96),-9,-38,7,1),((1,1),0,-6,0,1)])
    hurt=strip('hurt',[((1,1),0,0,0,1),((1,.98),-5,12,4,1),((1.02,.94),-10,20,10,1),((1.04,.88),-15,26,20,1),((1,.96),-6,10,7,1)])
    death=strip('death',[((1,1),0,0,0,1),((1,.96),-12,12,8,1),((1,.9),-30,28,28,1),((1,.82),-58,46,55,.92),((1,.7),-82,55,86,.72)])
    all_bounds[slug]={'walk':walk_bounds,'attack':attack,'hurt':hurt,'death':death}

js='window.BEIHAI_ANIMATION_BOUNDS='+json.dumps(all_bounds,ensure_ascii=False,separators=(',',':'))+';\n'
(ROOT/'beihai-animation-bounds.js').write_text(js,encoding='utf-8')
print(f'Built authored Beihai motion strips for {len(UNITS)} units.')

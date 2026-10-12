"""Compose the /landing hero + section lead images from catalog packshots.
Placeholder art until real lifestyle photography exists — re-run after
swapping packshots:  python3 scripts/landing/make-collages.py
"""
from PIL import Image, ImageDraw, ImageFilter
import os
ROOT=os.path.join(os.path.dirname(__file__),'..','..')
P=lambda n: os.path.join(ROOT,'public','images','products',n+'.png')
OUT=os.path.join(ROOT,'public','images','landing')

def pack(name,h=None,w=None):
    im=Image.open(P(name)).convert('RGBA')
    im=im.crop(im.getchannel('A').getbbox())
    if w: h=int(im.height*w/im.width)
    else: w=int(im.width*h/im.height)
    return im.resize((w,h),Image.LANCZOS)

def rounded(im,r=40):
    m=Image.new('L',im.size,0)
    ImageDraw.Draw(m).rounded_rectangle([0,0,im.width-1,im.height-1],r,fill=255)
    out=im.convert('RGBA'); out.putalpha(m); return out

def bg(w,h,top=(227,247,250),bottom=(146,203,202)):
    g=Image.new('RGB',(w,h))
    d=ImageDraw.Draw(g)
    for y in range(h):
        t=y/(h-1)
        d.line([(0,y),(w,y)],fill=tuple(int(top[i]+(bottom[i]-top[i])*t) for i in range(3)))
    # soft light blob
    blob=Image.new('L',(w,h),0)
    ImageDraw.Draw(blob).ellipse([int(w*.1),int(h*.05),int(w*.9),int(h*.75)],fill=110)
    blob=blob.filter(ImageFilter.GaussianBlur(w//8))
    g.paste(Image.new('RGB',(w,h),(255,255,255)),mask=blob)
    return g.convert('RGBA')

def place(canvas,im,cx,bottom,angle=0):
    if angle: im=im.rotate(angle,expand=True,resample=Image.BICUBIC)
    sh=Image.new('RGBA',im.size,(0,32,34,0))
    sh.putalpha(im.getchannel('A').point(lambda a:int(a*.28)))
    sh=sh.filter(ImageFilter.GaussianBlur(18))
    x=cx-im.width//2; y=bottom-im.height
    canvas.alpha_composite(sh,(x+10,y+22))
    canvas.alpha_composite(im,(x,y))

def save(c,name):
    c.convert('RGB').save(os.path.join(OUT,name),quality=88,optimize=True)

W=1500
MASKS=['advanced-collagen-biocellulose-facial-mask','hydro-boost-biocellulose-facial-mask','skin-harmony-biocellulose-facial-mask']
# hero
c=bg(W,1500)
for n,cx,ang in zip(MASKS,[330,750,1170],[-5,0,5]):
    place(c,pack(n,h=640),cx,900,ang)
place(c,pack('promarine-collagen',w=560),330,1330,-3)
place(c,pack('hydramax-plus',w=560),750,1400)
place(c,pack('promarine-collagen-tripeptides-pack',w=560),1170,1330,3)
save(c,'hero-beauty-system.jpg')
# masks
c=bg(W,1125)
for n,cx,ang in zip(MASKS,[330,750,1170],[-5,0,5]):
    place(c,pack(n,h=900),cx,1030,ang)
save(c,'masks.jpg')
# collagen
c=bg(W,1125)
place(c,pack('promarine-collagen',w=700),420,880,-3)
place(c,pack('promarine-collagen-tripeptides-pack',w=700),1060,920,3)
save(c,'collagen.jpg')
# hydramax
c=bg(W,1125)
ph=Image.open(P('hydramax')).convert('RGBA')
ph=rounded(ph.resize((int(ph.width*600/ph.height),600),Image.LANCZOS))
place(c,ph,420,860)
place(c,pack('hydramax-plus',w=720),1050,960)
save(c,'hydramax.jpg')
print('ok')

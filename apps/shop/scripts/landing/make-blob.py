"""Cut a photo into the brand's wavy "blob" shape (transparent corners).

    python3 scripts/landing/make-blob.py <photo> <out.webp> [crop_top]

The photo is cropped to a square starting at `crop_top` (px from the top),
resized to 900x900 and masked with a soft 9-lobe outline.
"""
import math
import sys

from PIL import Image, ImageDraw

src, out = sys.argv[1], sys.argv[2]
top = int(sys.argv[3]) if len(sys.argv) > 3 else 0

img = Image.open(src).convert("RGB")
w, h = img.size
side = min(w, h - top)
img = img.crop((0, top, side, top + side)).resize((900, 900), Image.LANCZOS)

S, SS, N = 900, 4, 720
c = S * SS / 2
pts = []
for i in range(N):
    t = 2 * math.pi * i / N
    r = 0.455 * (1 + 0.045 * math.sin(9 * t + 0.35) + 0.025 * math.sin(4 * t + 1.1) + 0.015 * math.sin(13 * t))
    pts.append((c + r * S * SS * math.cos(t), c + r * S * SS * math.sin(t)))

mask = Image.new("L", (S * SS, S * SS), 0)
ImageDraw.Draw(mask).polygon(pts, fill=255)
mask = mask.resize((S, S), Image.LANCZOS)

res = Image.new("RGBA", (S, S), (0, 0, 0, 0))
res.paste(img, (0, 0), mask)
res.save(out, "WEBP", quality=86, method=6)

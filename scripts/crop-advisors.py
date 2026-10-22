#!/usr/bin/env python3
"""
crop-advisors.py — card-sized copies of the Scientific Advisory Board photos
(public/images/advisors/card/<name>.webp): the transparent margins trimmed,
the rest flattened onto the card grey and cropped to the same 7:8 portrait
(top-aligned, so the face stays in), 224x256 (2x of the 112x128 card photo).
The originals (round crop elsewhere on the site) are left alone.

Usage:  python3 scripts/crop-advisors.py
"""
from pathlib import Path

from PIL import Image

SRC = Path(__file__).resolve().parent.parent / "public/images/advisors"
OUT = SRC / "card"
GREY = (246, 246, 246)  # --color-neutral-30, the card background
W, H = 224, 256

OUT.mkdir(exist_ok=True)
for name in ("tori-parker", "ralph-jager", "michael-lila"):
    im = Image.open(SRC / f"{name}.png").convert("RGBA")
    box = im.split()[3].point(lambda v: 255 if v > 200 else 0).getbbox()
    if box:
        im = im.crop(box)
    flat = Image.new("RGB", im.size, GREY)
    flat.paste(im, mask=im.split()[3])
    # 7:8 portrait, centred sideways, kept from the top
    w, h = flat.size
    target_w = min(w, int(h * W / H))
    target_h = min(h, int(w * H / W))
    left = (w - target_w) // 2
    flat = flat.crop((left, 0, left + target_w, target_h))
    flat = flat.resize((W, H), Image.LANCZOS)
    flat.save(OUT / f"{name}.webp", quality=90, method=6)
    print(name, (w, h), "->", flat.size)

#!/usr/bin/env python3
"""
reframe-packshots.py — fix "jumping" products in the carousel/PDP slider.

Root cause: cutout-product.py / cutout-product-gpt.py used to frame each
packshot onto a canvas with a FIXED HEIGHT (1400) but a WIDTH that varied
per product (derived from that product's own silhouette). Different
products therefore ended up as PNGs with different aspect ratios. The site
displays them with `object-fit: contain` inside a fixed-aspect frame
(ProductCard is 5:7) — feeding it images of varying aspect ratios makes
`contain` scale/center each one differently, so products appear at
different sizes and vertical positions across the carousel.

Fix: every packshot gets reframed onto the SAME fixed canvas size
(FIXED_W x FIXED_H, matching ProductCard's 5:7 frame), with its silhouette
contain-fit and centered inside. Same canvas dimensions for every product
-> `object-fit: contain` scales/positions them all identically.

Usage:
    python3 scripts/reframe-packshots.py <path.png> [<path.png> ...]

Operates in place.
"""

import sys
from pathlib import Path

from PIL import Image

FIXED_W = 1000
FIXED_H = 1400  # 5:7, matches ProductCard.module.css aspect-ratio
VPAD_FRAC = 0.04
HPAD_FRAC = 0.08


def reframe(path: Path) -> str:
    im = Image.open(path).convert("RGBA")
    bbox = im.split()[-1].getbbox()
    if not bbox:
        return "NO_CONTENT"
    content = im.crop(bbox)

    avail_w = FIXED_W * (1 - 2 * HPAD_FRAC)
    avail_h = FIXED_H * (1 - 2 * VPAD_FRAC)
    scale = min(avail_w / content.width, avail_h / content.height)
    new_w = max(1, round(content.width * scale))
    new_h = max(1, round(content.height * scale))
    resized = content.resize((new_w, new_h), Image.LANCZOS)

    canvas = Image.new("RGBA", (FIXED_W, FIXED_H), (0, 0, 0, 0))
    x = (FIXED_W - new_w) // 2
    y = (FIXED_H - new_h) // 2
    canvas.paste(resized, (x, y), resized)
    canvas.save(path)
    return f"{FIXED_W}x{FIXED_H}  content={new_w}x{new_h}"


def main() -> None:
    if len(sys.argv) < 2:
        sys.exit("usage: reframe-packshots.py <path.png> [<path.png> ...]")
    for arg in sys.argv[1:]:
        path = Path(arg)
        if not path.exists():
            print(f"MISSING          {path}")
            continue
        info = reframe(path)
        print(f"{info:30} {path.name}")


if __name__ == "__main__":
    main()

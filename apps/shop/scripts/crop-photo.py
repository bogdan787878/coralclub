#!/usr/bin/env python3
"""
crop-photo.py — tighten a studio product photo's own white margins WITHOUT
touching the background or the product. coralclub.us studio shots are
~1920x1280 with the product occupying only a small center fraction; dropped
into the site's square (1:1) media frame, that padding makes the product
render tiny. This crops the excess margin down to a small breathing-room
border around the actual content — nothing is removed, redrawn, or made
transparent; the real photographed background stays exactly as shot.

How it detects the crop box: samples the photo's 4 corners to get the
background color, then finds the bounding box of every pixel that differs
from that color by more than a tolerance (this also naturally keeps the
product's drop shadow, since that's a real content difference too).

Usage:
    python3 scripts/crop-photo.py <slug>                 # crop in place
    python3 scripts/crop-photo.py <slug> --url <img-url>  # fetch + crop

Operates on public/images/products/<slug>.<ext> (webp/png/jpg), in place.
"""

import argparse
import sys
import urllib.request
from pathlib import Path
from typing import Optional, Tuple

from PIL import Image, ImageChops

UA = {"User-Agent": "Mozilla/5.0"}
REPO = Path(__file__).resolve().parent.parent
PRODUCTS_DIR = REPO / "public/images/products"

PAD_FRAC = 0.10  # breathing room added back around the detected content
TOLERANCE = 16  # per-channel-ish diff threshold (0-255) before a pixel counts as "content"


def fetch(url: str) -> bytes:
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=25) as r:
        return r.read()


def detect_bbox(im: Image.Image, tolerance: int = TOLERANCE):
    rgb = im.convert("RGB")
    w, h = rgb.size
    corners = [rgb.getpixel((0, 0)), rgb.getpixel((w - 1, 0)), rgb.getpixel((0, h - 1)), rgb.getpixel((w - 1, h - 1))]
    bg = tuple(sum(c[i] for c in corners) // 4 for i in range(3))
    bg_img = Image.new("RGB", rgb.size, bg)
    diff = ImageChops.difference(rgb, bg_img).convert("L")
    mask = diff.point(lambda p: 255 if p > tolerance else 0)
    return mask.getbbox(), bg


def crop_with_padding(im: Image.Image, bbox, pad_frac: float = PAD_FRAC):
    x0, y0, x1, y1 = bbox
    pad_x = round((x1 - x0) * pad_frac)
    pad_y = round((y1 - y0) * pad_frac)
    x0 = max(0, x0 - pad_x)
    y0 = max(0, y0 - pad_y)
    x1 = min(im.width, x1 + pad_x)
    y1 = min(im.height, y1 + pad_y)
    return im.crop((x0, y0, x1, y1))


def process(slug: str, url: Optional[str]) -> Tuple[str, str]:
    if url:
        raw = fetch(url)
        # keep whatever extension the URL implies, default webp
        ext = url.rsplit(".", 1)[-1].split("?")[0].lower()
        if ext not in ("webp", "png", "jpg", "jpeg"):
            ext = "webp"
        out_path = PRODUCTS_DIR / f"{slug}.{ext}"
        out_path.write_bytes(raw)
    else:
        matches = list(PRODUCTS_DIR.glob(f"{slug}.*"))
        if not matches:
            return "NOT_FOUND", ""
        out_path = matches[0]

    im = Image.open(out_path)
    before = im.size
    bbox, bg = detect_bbox(im)
    if not bbox:
        return "NO_CONTENT_DETECTED", f"size={before}"
    cropped = crop_with_padding(im, bbox)
    cropped.save(out_path)
    return "OK", f"{before} -> {cropped.size}  bg={bg}  {out_path.name}"


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("slug")
    ap.add_argument("--url", help="fetch this URL first, then crop it")
    args = ap.parse_args()

    status, info = process(args.slug, args.url)
    print(f"{status:20} {args.slug:32} {info}")
    if status != "OK":
        sys.exit(1)


if __name__ == "__main__":
    main()

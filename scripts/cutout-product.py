#!/usr/bin/env python3
"""
cutout-product.py — pull a product's photo off coralclub.us, remove the
background locally, and frame it onto a transparent canvas matching the
site's packshot convention (fixed height, width follows the product's own
silhouette — same file is used for both the carousel tile and the PDP
slider elsewhere in the app).

Usage:
    python3 scripts/cutout-product.py <slug> [<slug> ...]
    python3 scripts/cutout-product.py --url <slug> <image-url>

One-time setup:
    pip3 install rembg onnxruntime pillow
    (first run downloads the ~176 MB u2net model to ~/.u2net, cached after)

What it does NOT do:
- Wire the result into content/products/<slug>.json (carouselImages /
  pdpImages) — check the output, then do that by hand or ask Claude to.
- Guarantee correctness for multi-variant products (flavour/colour
  swatches): the page's default gallery image may not match the specific
  SKU. Check the printed source URL and the saved PNG before using it.
- Guarantee a clean cutout for busy / lifestyle photography — works best
  on the plain studio shots Coral Club uses for most single products.

Output: public/images/products/<slug>.png
"""

import argparse
import re
import sys
import time
import urllib.request
from pathlib import Path

from PIL import Image

UA = {"User-Agent": "Mozilla/5.0"}
REPO = Path(__file__).resolve().parent.parent
OUT_DIR = REPO / "public/images/products"

CANVAS_H = 1400          # matches the tallest existing packshots (upscaled)
VPAD_FRAC = 0.04         # top/bottom breathing room inside the canvas
SIDE_PAD_PX = 40         # left/right breathing room


def fetch(url: str) -> bytes:
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=25) as r:
        return r.read()


def first_gallery_image(slug: str) -> str | None:
    """Best-effort: the page's default/selected gallery photo. For
    multi-variant products this can be the wrong flavour/colour — verify."""
    html = fetch(f"https://coralclub.us/shop/{slug}.html").decode("utf-8", "ignore")
    m = re.search(
        r'data-image="(https://coralclub\.us/upload/iblock/[^"]+?\.(?:webp|jpg|jpeg|png))"',
        html,
    )
    if m:
        return m.group(1)
    m = re.search(r'src="(/upload/iblock/[^"]+?\.(?:webp|jpg|jpeg|png))"', html)
    return f"https://coralclub.us{m.group(1)}" if m else None


def cutout(session, raw_bytes: bytes, tmp: Path) -> Image.Image:
    from rembg import remove

    tmp.write_bytes(raw_bytes)
    im = Image.open(tmp).convert("RGB")
    im.save(tmp)  # normalise format for rembg
    return remove(Image.open(tmp), session=session)


def frame(img: Image.Image) -> Image.Image:
    alpha = img.split()[-1]
    bbox = alpha.getbbox()
    if not bbox:
        return img
    cropped = img.crop(bbox)
    content_h = CANVAS_H * (1 - 2 * VPAD_FRAC)
    scale = content_h / cropped.height
    new_w = max(1, round(cropped.width * scale))
    new_h = max(1, round(cropped.height * scale))
    resized = cropped.resize((new_w, new_h), Image.LANCZOS)
    canvas_w = new_w + 2 * SIDE_PAD_PX
    canvas = Image.new("RGBA", (canvas_w, CANVAS_H), (0, 0, 0, 0))
    x = (canvas_w - new_w) // 2
    y = round(CANVAS_H * VPAD_FRAC)
    canvas.paste(resized, (x, y), resized)
    return canvas


def process(slug: str, url: str | None, session, workdir: Path) -> tuple[str, str]:
    url = url or first_gallery_image(slug)
    if not url:
        return "NO_IMAGE_FOUND", ""
    raw = fetch(url)
    tmp = workdir / f"{slug}_src.png"
    im = cutout(session, raw, tmp)
    final = frame(im)
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    out_path = OUT_DIR / f"{slug}.png"
    final.save(out_path)
    return "OK", f"{final.width}x{final.height}  src={url}"


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--url", help="explicit image URL — pairs with a single slug")
    ap.add_argument("slugs", nargs="+")
    args = ap.parse_args()

    from rembg import new_session

    session = new_session("u2net")
    workdir = REPO / ".cutout-tmp"
    workdir.mkdir(exist_ok=True)

    if args.url:
        if len(args.slugs) != 1:
            sys.exit("--url takes exactly one slug")
        status, info = process(args.slugs[0], args.url, session, workdir)
        print(f"{status:16} {args.slugs[0]:32} {info}")
        return

    for slug in args.slugs:
        try:
            status, info = process(slug, None, session, workdir)
        except Exception as e:  # noqa: BLE001 — report and keep going
            status, info = "ERROR", str(e)
        print(f"{status:16} {slug:32} {info}")
        time.sleep(0.3)


if __name__ == "__main__":
    main()

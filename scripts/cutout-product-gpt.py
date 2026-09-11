#!/usr/bin/env python3
"""
cutout-product-gpt.py — same pipeline as cutout-product.py (pull a
product's photo off coralclub.us, remove the background, frame it onto the
site's transparent packshot canvas), but the background-removal step uses
OpenAI's Responses API `image_generation` tool (gpt-image-2.5-sunburst)
instead of rembg — rembg's edges were judged too soft/imperfect.

Why the Responses API and not the plain /v1/images/edits mask endpoint:
mask-based edits were tested for a different task (lifestyle scenes) and
found to reinterpret/corrupt label text even in "protected" mask regions.
The Responses API's reference-image flow (product photo as input_image,
not a mask) reliably kept label text pixel-accurate across many prior
generations — same mechanism used here, with the instruction to remove the
background losslessly rather than compose a new scene.

Usage:
    OPENAI_API_KEY=sk-... python3 scripts/cutout-product-gpt.py <slug> [<slug> ...]
    OPENAI_API_KEY=sk-... python3 scripts/cutout-product-gpt.py --url <image-url> <slug>

Output: public/images/products/<slug>.png — same framing convention as
cutout-product.py (transparent canvas, CANVAS_H=1400, width follows the
product's own silhouette).
"""

import argparse
import base64
import io
import json
import os
import re
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path
from typing import Optional, Tuple

from PIL import Image

UA = {"User-Agent": "Mozilla/5.0"}
REPO = Path(__file__).resolve().parent.parent
OUT_DIR = REPO / "public/images/products"

CANVAS_H = 1400
VPAD_FRAC = 0.04
SIDE_PAD_PX = 40

INSTRUCTION = (
    "Remove the background from this product photo completely — output "
    "ONLY the product itself on a fully transparent background. Do not "
    "change the product in any way: keep its label, logo, text, colors, "
    "shape, and proportions pixel-accurate to the original photo. Clean, "
    "precise, sharp-edged cutout — no background remnants, no added "
    "shadow, no new scene, no props, nothing else in the frame."
)


def fetch(url: str) -> bytes:
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=25) as r:
        return r.read()


def first_gallery_image(slug: str) -> Optional[str]:
    html = fetch(f"https://coralclub.us/shop/{slug}.html").decode("utf-8", "ignore")
    m = re.search(
        r'data-image="(https://coralclub\.us/upload/iblock/[^"]+?\.(?:webp|jpg|jpeg|png))"',
        html,
    )
    if m:
        return m.group(1)
    m = re.search(r'src="(/upload/iblock/[^"]+?\.(?:webp|jpg|jpeg|png))"', html)
    return f"https://coralclub.us{m.group(1)}" if m else None


def gpt_cutout(api_key: str, raw_bytes: bytes) -> Image.Image:
    src = Image.open(io.BytesIO(raw_bytes)).convert("RGB")
    buf = io.BytesIO()
    src.save(buf, format="PNG")
    b64 = base64.b64encode(buf.getvalue()).decode()

    body = json.dumps(
        {
            "model": "gpt-4.1",
            "input": [
                {
                    "role": "user",
                    "content": [
                        {"type": "input_text", "text": INSTRUCTION},
                        {
                            "type": "input_image",
                            "image_url": f"data:image/png;base64,{b64}",
                        },
                    ],
                }
            ],
            "tools": [
                {
                    "type": "image_generation",
                    "model": "gpt-image-2.5-sunburst",
                    "quality": "high",
                    "background": "transparent",
                    "output_format": "png",
                }
            ],
        }
    ).encode()

    req = urllib.request.Request(
        "https://api.openai.com/v1/responses",
        data=body,
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=180) as r:
            result = json.loads(r.read())
    except urllib.error.HTTPError as e:
        raise SystemExit(f"OpenAI API error {e.code}: {e.read().decode()}")

    calls = [o for o in result.get("output", []) if o.get("type") == "image_generation_call"]
    if not calls:
        raise SystemExit(f"No image_generation_call in response:\n{json.dumps(result, indent=2)[:3000]}")
    png_bytes = base64.b64decode(calls[0]["result"])
    return Image.open(io.BytesIO(png_bytes)).convert("RGBA")


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


def process(slug: str, url: Optional[str], api_key: str) -> Tuple[str, str]:
    url = url or first_gallery_image(slug)
    if not url:
        return "NO_IMAGE_FOUND", ""
    raw = fetch(url)
    im = gpt_cutout(api_key, raw)
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

    api_key = os.environ.get("OPENAI_API_KEY")
    if not api_key:
        sys.exit("Set OPENAI_API_KEY in your environment first.")

    if args.url:
        if len(args.slugs) != 1:
            sys.exit("--url takes exactly one slug")
        status, info = process(args.slugs[0], args.url, api_key)
        print(f"{status:16} {args.slugs[0]:32} {info}")
        return

    for slug in args.slugs:
        try:
            status, info = process(slug, None, api_key)
        except Exception as e:  # noqa: BLE001 — report and keep going
            status, info = "ERROR", str(e)
        print(f"{status:16} {slug:32} {info}")
        time.sleep(0.3)


if __name__ == "__main__":
    main()

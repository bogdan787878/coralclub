#!/usr/bin/env python3
"""
restyle-icon.py — re-render a category icon in the approved "transparent
glass" style, keeping its silhouette/shape but replacing the material.

Uses the Responses API `image_generation` tool with TWO or THREE reference
images: IMAGE 1 = the existing icon (its shape/silhouette is what must be
kept — material/color are what's being replaced), IMAGE 2 = the approved
glass style reference (scripts/icon-refs/glass-style-reference.png), and
optionally IMAGE 3 = a color/tint reference (--color-ref) when the glass
should be tinted instead of clear.

Usage:
    OPENAI_API_KEY=sk-... python3 scripts/restyle-icon.py <input.png> <output.png>
    OPENAI_API_KEY=sk-... python3 scripts/restyle-icon.py <input.png> <output.png> --color-ref <ref.png>
"""

import argparse
import base64
import io
import json
import os
import urllib.error
import urllib.request
from pathlib import Path
from typing import Optional

from PIL import Image, ImageFilter

REPO = Path(__file__).resolve().parent.parent
STYLE_REF = REPO / "scripts/icon-refs/glass-style-reference.png"

INSTRUCTION = (
    "IMAGE 1 shows an icon's shape/silhouette — keep that exact shape, "
    "proportions, and any internal cutout details unchanged. IMAGE 2 is "
    "the approved style reference: a clear, transparent, contrasty glass "
    "material with a chrome/silver rim-light edge, on a plain white "
    "background. Re-render the IMAGE 1 shape in the material style "
    "of IMAGE 2 — transparent, refractive GLASS (not metal, not "
    "matte, not brushed steel — real glass, with the light bending/"
    "distorting through the material the way glass does), high contrast "
    "(it will sit on a white background so it must read clearly against "
    "white, not wash out), with a chrome/silver rim-light edge. Keep the "
    "rim highlight RESTRAINED: mostly a flat, even mid-tone metal with "
    "only one or two soft, wide, gentle patches of brighter light on it "
    "(and a matching subtle shadow patch on the opposite side) — do NOT "
    "cover the whole rim in alternating bright/dark segments, that busy "
    "repeating pattern is explicitly unwanted. If unsure, lean toward "
    "calmer and less shiny rather than more sparkly. Output on a "
    "fully transparent background, nothing else in "
    "the frame, square 1:1 composition, the icon centered and filling "
    "most of the frame like image 1 does."
)

def color_instruction(desc: str) -> str:
    return (
        f" IMAGE 3 is a solid color swatch: {desc}. Tint the glass fill "
        "that exact color (instead of the clear/colorless glass in IMAGE "
        "2) — a pale, translucent glass tinted with this color, not an "
        "opaque flat fill. Keep the same chrome rim and the same "
        "restrained-highlight rule above."
    )


def call_openai(
    api_key: str,
    shape_png: bytes,
    style_png: bytes,
    color_png: Optional[bytes] = None,
    color_desc: str = "",
) -> bytes:
    content = [{"type": "input_text", "text": INSTRUCTION + (color_instruction(color_desc) if color_png else "")}]
    for png in [shape_png, style_png] + ([color_png] if color_png else []):
        content.append(
            {
                "type": "input_image",
                "image_url": f"data:image/png;base64,{base64.b64encode(png).decode()}",
            }
        )

    body = json.dumps(
        {
            "model": "gpt-4.1",
            "input": [{"role": "user", "content": content}],
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
    return base64.b64decode(calls[0]["result"])


def despeckle_alpha(png_bytes: bytes) -> bytes:
    """The API output has isolated near-zero-alpha noise pixels scattered
    right along the silhouette edge (generation/compression artifact) —
    invisible in the raw alpha values but visible as a speckled/pixelated
    fringe once composited over any non-transparent background. A median
    filter on the alpha channel kills isolated single-pixel noise while
    leaving the actual (already smooth) edge gradient intact, then a hard
    cutoff removes any remaining near-zero stragglers."""
    im = Image.open(io.BytesIO(png_bytes)).convert("RGBA")
    r, g, b, a = im.split()
    a = a.filter(ImageFilter.MedianFilter(size=3))
    a = a.point(lambda p: 0 if p < 12 else p)
    im = Image.merge("RGBA", (r, g, b, a))
    buf = io.BytesIO()
    im.save(buf, format="PNG")
    return buf.getvalue()


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("input")
    ap.add_argument("output")
    ap.add_argument("--color-ref", help="optional color/tint reference image")
    ap.add_argument("--color-desc", default="", help="text description of the color swatch, e.g. 'pale mint green, hex D4F1DC'")
    args = ap.parse_args()

    in_path, out_path = Path(args.input), Path(args.output)

    api_key = os.environ.get("OPENAI_API_KEY")
    if not api_key:
        raise SystemExit("Set OPENAI_API_KEY in your environment first.")
    if not in_path.exists():
        raise SystemExit(f"No input file at {in_path}")
    if not STYLE_REF.exists():
        raise SystemExit(f"No style reference at {STYLE_REF}")

    color_bytes = None
    if args.color_ref:
        color_path = Path(args.color_ref)
        if not color_path.exists():
            raise SystemExit(f"No color reference at {color_path}")
        color_bytes = color_path.read_bytes()

    png_bytes = call_openai(api_key, in_path.read_bytes(), STYLE_REF.read_bytes(), color_bytes, args.color_desc)
    png_bytes = despeckle_alpha(png_bytes)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_bytes(png_bytes)
    print(f"OK  {out_path}")


if __name__ == "__main__":
    main()

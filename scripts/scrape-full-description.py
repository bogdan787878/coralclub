#!/usr/bin/env python3
"""
scrape-full-description.py — pull the "Description" tab (#tab_description)
off each product's real coralclub.us page and store it as a new
`fullDescription` field in content/products/<slug>.json, rendered on the
PDP as a plain-text block after Supplement Facts.

Our own slug matches the real site's URL slug
(https://coralclub.us/shop/<slug>.html) for almost every product; a
handful drifted when we picked our own slug and need an override — see
SLUG_OVERRIDES. Verified against the product's own coralId appearing in
the fetched page before writing, so a slug that resolves to the wrong
product's page is refused rather than silently mis-scraped.

Usage:
    python3 scripts/scrape-full-description.py [slug ...]   # default: all
"""

from __future__ import annotations

import json
import re
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path

from lxml import html as lhtml

UA = {"User-Agent": "Mozilla/5.0"}
REPO = Path(__file__).resolve().parent.parent
PRODUCTS_DIR = REPO / "content/products"

# our slug -> real coralclub.us slug, only where they differ
SLUG_OVERRIDES = {
    "coral-mine-silver": "coral-mine",
    "promarine-collagen": "promarine-collagen-peptides-",
    "spirulina": "premium-spirulina",
}

# no standard tabbed product page to scrape:
# - colo-vada-plus: no standalone page anymore, folded into the
#   "Go Detox 14 Day Cleanse" bundle
# - promarine-collagen, the 6 liumi-* products: bespoke marketing landing
#   pages with no Description/Instructions/Ingredients tabs at all
# - b-luron, daily-delicious-beauty-shake, omega-3-60: standard template,
#   but the real page simply has no Description tab, only Ingredients
# - slim-by-slim-2374: has a Description tab, but it's empty on the live
#   site (just an unused label div)
SKIP = {
    "colo-vada-plus",
    "promarine-collagen",
    "liumi-balancing-repair-serum",
    "liumi-contour-serum",
    "liumi-deep-renewal-cream",
    "liumi-hydra-barrier-gel-cream",
    "liumi-hydra-infusion-toner",
    "liumi-purifying-gel-cleanser",
    "b-luron",
    "daily-delicious-beauty-shake",
    "omega-3-60",
    "slim-by-slim-2374",
}


def fetch(url: str) -> str:
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=25) as r:
        return r.read().decode("utf-8", "ignore")


def clean_block(el) -> str:
    """A <p>/<div> block is either a plain paragraph, or an ingredient
    blurb shaped like <b>Name</b><br> text — the latter renders as
    "Name\ntext"."""
    b = el.find("b")
    if b is not None and (b.text_content() or "").strip():
        name = b.text_content().strip()
        rest = el.text_content().replace(b.text_content(), "", 1).strip()
        rest = re.sub(r"\s+", " ", rest)
        return f"{name}\n{rest}" if rest else name
    return re.sub(r"\s+", " ", el.text_content()).strip()


def extract_description(doc) -> str | None:
    panel = doc.get_element_by_id("tab_description", None)
    if panel is None:
        return None
    # drop embeds/decoration that aren't part of the written description
    for bad in panel.xpath(
        './/script | .//style | .//iframe | .//*[contains(@class,"video-wrap")]'
        ' | .//*[contains(@class,"product_labels")] | .//*[contains(@class,"row_line")]'
    ):
        bad.getparent().remove(bad)

    # Two markups are in use across the site: <p><b>Name</b><br>text</p>
    # paragraphs (clean_block handles this directly), or a flat run of
    # <div>Name</div><div>text</div> pairs with a bare <div><br></div>
    # between entries — walk direct children and pair up a name-only div
    # with whatever non-empty block follows it.
    paragraphs: list[str] = []
    pending_name: str | None = None
    for child in panel.iterchildren():
        if child.tag not in ("p", "div"):
            continue
        text = re.sub(r"\s+", " ", child.text_content()).strip()
        if not text:
            continue

        b = child.find("b")
        is_name_only = b is not None and text == re.sub(
            r"\s+", " ", b.text_content()
        ).strip()
        if is_name_only:
            if pending_name:
                paragraphs.append(pending_name)
            pending_name = text
            continue

        if b is not None:
            paragraphs.append(clean_block(child))
            pending_name = None
        elif pending_name:
            paragraphs.append(f"{pending_name}\n{text}")
            pending_name = None
        else:
            paragraphs.append(text)

    if pending_name:
        paragraphs.append(pending_name)
    return "\n\n".join(paragraphs) if paragraphs else None


def process(slug: str, real_slug: str, coral_id: str) -> tuple[str, str]:
    url = f"https://coralclub.us/shop/{real_slug}.html"
    try:
        raw = fetch(url)
    except urllib.error.HTTPError as e:
        return "HTTP_ERROR", f"{e.code} {url}"
    except Exception as e:  # noqa: BLE001
        return "FETCH_ERROR", str(e)

    if "404.php" in raw or "Page not found" in raw:
        return "NOT_FOUND", url

    doc = lhtml.fromstring(raw)
    if coral_id and coral_id not in raw:
        return "ID_MISMATCH", f"coralId {coral_id} not found on {url} — wrong slug?"

    desc = extract_description(doc)
    if not desc:
        return "NO_DESCRIPTION", url

    path = PRODUCTS_DIR / f"{slug}.json"
    data = json.loads(path.read_text())
    data["fullDescription"] = desc
    path.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n")
    return "OK", f"{len(desc)} chars"


def main() -> None:
    args = sys.argv[1:]
    if args:
        slugs = args
    else:
        slugs = sorted(p.stem for p in PRODUCTS_DIR.glob("*.json"))

    for slug in slugs:
        if slug in SKIP:
            print(f"{'SKIPPED':16} {slug:45}")
            continue
        path = PRODUCTS_DIR / f"{slug}.json"
        if not path.exists():
            print(f"{'NO_FILE':16} {slug:45}")
            continue
        data = json.loads(path.read_text())
        real_slug = SLUG_OVERRIDES.get(slug, slug)
        status, info = process(slug, real_slug, data.get("coralId", ""))
        print(f"{status:16} {slug:45} {info}")
        time.sleep(0.4)


if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""
scrape-manufacturing.py — fill in howToUse + manufacturing (country of
origin, expiration, storage, ingredients, supplement facts) from the
product's real coralclub.us page. Companion to
scripts/scrape-full-description.py, which only covers the "Description"
tab; this one covers the "Instructions" (#instruction) and "Ingredients"
(#tab_components) tabs.

Written for the handful of flagship phase products (Hydration: Coral-
Mine, PentoKan, Oceanmin, H-500) that were scaffolded with a generic
"Full directions coming soon." placeholder and never filled in — not run
against the whole catalog, since most other products already have real
manufacturing data. Re-check with SLUG_OVERRIDES if you point this at a
product whose own slug doesn't match its real coralclub.us URL.

Usage:
    python3 scripts/scrape-manufacturing.py <slug> [<slug> ...]
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

SLUG_OVERRIDES = {
    "coral-mine-silver": "coral-mine",
}


def fetch(url: str) -> str:
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=25) as r:
        return r.read().decode("utf-8", "ignore")


def parse_instructions(doc) -> dict[str, str]:
    """#instruction is a flat run of <div><h2>Label</h2><div class=
    "...info-text">Value</div></div> blocks."""
    panel = doc.get_element_by_id("instruction", None)
    if panel is None:
        return {}
    out: dict[str, str] = {}
    for block in panel.findall("div"):
        h2 = block.find("h2")
        if h2 is None:
            continue
        label = h2.text_content().strip()
        value_el = block.find('.//div[@class="product-details__additional__info-text"]')
        if value_el is None:
            continue
        # itertext() + a joining space, not text_content() — sibling <p>
        # tags separated only by a bare <br> have no whitespace text node
        # between them, so a straight text_content() concatenates them
        # with nothing in between (e.g. "ingredients.Per 1 Tablet").
        value = " ".join(t.strip() for t in value_el.itertext() if t.strip())
        if value:
            out[label] = value
    return out


def parse_supplement_facts(doc, coral_id: str):
    """#tab_components has one <li id="supl-<offerId>"> per pack size —
    pick the one matching our own coralId (exact, else prefix match)."""
    panel = doc.get_element_by_id("tab_components", None)
    if panel is None:
        return None
    lis = panel.xpath('.//li[starts-with(@id,"supl-")]')
    if not lis:
        return None

    chosen = None
    for li in lis:
        if li.get("id") == f"supl-{coral_id}":
            chosen = li
            break
    if chosen is None:
        for li in lis:
            if li.get("id", "").startswith(f"supl-{coral_id}"):
                chosen = li
                break
    if chosen is None:
        chosen = lis[0]

    table = chosen.find(".//table")
    if table is None:
        return None
    rows = []
    for tr in table.findall(".//tr"):
        cells = [re.sub(r"\s+", " ", td.text_content()).strip() for td in tr.findall("td")]
        cells = [c for c in cells if c]
        if cells:
            rows.append(cells)

    # first row: product name banner (1 cell) — drop it
    if rows and len(rows[0]) == 1:
        rows = rows[1:]
    # second remaining row: [ingredient-column label, serving label, "% DV*"]
    if not rows or len(rows[0]) < 2:
        return None
    serving_label = rows[0][1]
    data_rows = []
    for cells in rows[1:]:
        # trailing footnote / net-weight rows have just 1 cell
        if len(cells) < 2:
            continue
        name = cells[0]
        amount = cells[1]
        dv = cells[2] if len(cells) > 2 else ""
        # a bare "-" is their placeholder for "no daily value" — normalize
        # to "" so SupplementFacts' own `row.dv || "–"` fallback applies
        if dv.strip("-") == "":
            dv = ""
        data_rows.append({"name": name, "amount": amount, "dv": dv})
    if not data_rows:
        return None
    return {"servingLabel": serving_label, "rows": data_rows}


def process(slug: str, real_slug: str, coral_id: str) -> tuple[str, str]:
    url = f"https://coralclub.us/shop/{real_slug}.html"
    try:
        raw = fetch(url)
    except urllib.error.HTTPError as e:
        return "HTTP_ERROR", f"{e.code} {url}"
    if "404.php" in raw or "Page not found" in raw:
        return "NOT_FOUND", url
    if coral_id and coral_id not in raw:
        return "ID_MISMATCH", f"coralId {coral_id} not found on {url}"

    doc = lhtml.fromstring(raw)
    instr = parse_instructions(doc)
    facts = parse_supplement_facts(doc, coral_id)

    path = PRODUCTS_DIR / f"{slug}.json"
    data = json.loads(path.read_text())
    m = data.setdefault("manufacturing", {})
    changed = []

    if instr.get("Directions"):
        data["howToUse"] = instr["Directions"]
        changed.append("howToUse")
    if instr.get("Manufactured in"):
        m["countryOfOrigin"] = instr["Manufactured in"]
        changed.append("countryOfOrigin")
    if instr.get("Shelf life"):
        m["expiration"] = f"{instr['Shelf life']} from the date of manufacture"
        changed.append("expiration")
    if instr.get("Storage"):
        storage = instr["Storage"]
        if instr.get("Precautions"):
            storage = f"{storage} {instr['Precautions']}"
        m["storage"] = storage
        changed.append("storage")
    if instr.get("The Pack includes"):
        m["ingredients"] = instr["The Pack includes"]
        changed.append("ingredients")
    if facts:
        m["supplementFacts"] = facts
        changed.append("supplementFacts")

    if not changed:
        return "NO_CHANGE", url
    path.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n")
    return "OK", ", ".join(changed)


def main() -> None:
    slugs = sys.argv[1:]
    if not slugs:
        sys.exit("usage: scrape-manufacturing.py <slug> [<slug> ...]")

    for slug in slugs:
        path = PRODUCTS_DIR / f"{slug}.json"
        if not path.exists():
            print(f"{'NO_FILE':16} {slug:30}")
            continue
        data = json.loads(path.read_text())
        real_slug = SLUG_OVERRIDES.get(slug, slug)
        status, info = process(slug, real_slug, str(data.get("coralId", "")))
        print(f"{status:16} {slug:30} {info}")
        time.sleep(0.4)


if __name__ == "__main__":
    main()

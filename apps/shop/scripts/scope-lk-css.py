#!/usr/bin/env python3
"""Переносит стили кабинета (coral-club-lk-test/docs/style.css) в Next под корневой класс .lkapp.

Кабинет на чистом JS жил с глобальными стилями; в магазине они не должны задевать витрину, поэтому каждое правило
получает префикс .lkapp, а :root/html/body становятся самим .lkapp. @font-face отбрасываются (шрифты грузит магазин).
Запуск: python3 scripts/scope-lk-css.py ../../../coral-club-lk-test/docs/style.css src/app/lk/lk.css
"""
import re
import sys

ROOT = ".lkapp"


def scope_selector(sel: str) -> str:
    sel = sel.strip()
    if not sel:
        return sel
    m = re.match(r"^(:root|html|body)(.*)$", sel)
    if m:
        rest = m.group(2)
        # body:has(...) / body.x → .lkapp:has(...) / .lkapp.x ; "body .home" → ".lkapp .home"
        return ROOT + rest
    if sel == "*":
        return f"{ROOT} *"
    return f"{ROOT} {sel}"


def split_top(css: str):
    """Блоки верхнего уровня: (prelude, body) с учётом вложенных скобок."""
    i, n, out = 0, len(css), []
    while i < n:
        j = css.find("{", i)
        if j < 0:
            break
        prelude = css[i:j].strip()
        depth, k = 1, j + 1
        while k < n and depth:
            if css[k] == "{":
                depth += 1
            elif css[k] == "}":
                depth -= 1
            k += 1
        out.append((prelude, css[j + 1 : k - 1]))
        i = k
    return out


def scope(css: str) -> str:
    css = re.sub(r"/\*.*?\*/", "", css, flags=re.S)
    res = []
    for prelude, body in split_top(css):
        if prelude.startswith("@font-face"):
            continue
        if prelude.startswith("@keyframes"):
            res.append(f"{prelude} {{{body}}}")
        elif prelude.startswith("@media") or prelude.startswith("@supports"):
            res.append(f"{prelude} {{\n{scope(body)}\n}}")
        else:
            sels = ", ".join(scope_selector(s) for s in prelude.split(","))
            res.append(f"{sels} {{{body.strip()}}}")
    return "\n".join(res)


src, dst = sys.argv[1], sys.argv[2]
out = scope(open(src, encoding="utf-8").read())
head = (
    "/* Стили кабинета, перенесённые из coral-club-lk-test/docs/style.css под корневой класс .lkapp\n"
    "   (scripts/scope-lk-css.py). Экраны кабинета на Next используют те же классы, что и кабинет на чистом JS. */\n"
    f"{ROOT} {{ min-height: 100vh; background: #f1f3f4; --cc-page-bg: #f1f3f4; }}\n"
)
open(dst, "w", encoding="utf-8").write(head + out + "\n")
print(f"{dst}: {out.count('{')} правил")

"""Extract questions, answers and images from the group PDFs.

Usage: python3 -I tools/extract.py [PDF_DIR] [OUT_DIR]
  PDF_DIR defaults to the repo root (where 1.pdf ... 10.pdf live)
  OUT_DIR defaults to ./public

Writes OUT_DIR/data/questions.json and OUT_DIR/img/g{G}/q{N}.webp.
Text is kept exactly as in the PDFs; wrapped lines are only joined with a space.
Fails loudly if any consistency check breaks.
"""
import io
import json
import re
import sys
from pathlib import Path

import fitz  # PyMuPDF
from PIL import Image

GROUPS = range(1, 11)
QNUM_COLOR = 0x0F5BA7   # blue bold question number
GREEN = 0x12703A        # correct option + answer line
NUM_RE = re.compile(r"^\d+\.$")
ANS_RE = re.compile(r"^Պատ\.՝\s*(\d+)\s*$")
COUNT_RE = re.compile(r"^(\d+)\s+հարց$")
# The PDFs contain one missing glyph (rendered as a box, extracted as NUL) in
# group 2 q31 option 2: "0\x0025 կՎտ" -> the decimal comma of "0,25 կՎտ".
GLYPH_FIXES = {"\x00": ","}
IMG_MAX_W = 900
WEBP_QUALITY = 72


class ExtractError(Exception):
    pass


def join(parts):
    return " ".join(p.strip() for p in parts if p.strip()).strip()


def save_image(doc, xref, dest: Path):
    raw = doc.extract_image(xref)["image"]
    im = Image.open(io.BytesIO(raw))
    if im.mode not in ("RGB", "RGBA"):
        im = im.convert("RGBA" if "A" in im.getbands() else "RGB")
    if im.width > IMG_MAX_W:
        h = round(im.height * IMG_MAX_W / im.width)
        im = im.resize((IMG_MAX_W, h), Image.LANCZOS)
    dest.parent.mkdir(parents=True, exist_ok=True)
    im.save(dest, "WEBP", quality=WEBP_QUALITY, method=6)
    return im.width, im.height


def parse_group(pdf: Path, gid: int, out: Path):
    doc = fitz.open(pdf)
    title = subtitle = None
    declared = None
    qs = []
    cur = None
    mode = None  # 'q' question text, 'o' option text, 'done' after answer
    last_line = None
    fixes = []

    for pn, page in enumerate(doc):
        # map image bbox -> xref for this page
        img_infos = page.get_image_info(xrefs=True)
        for block in page.get_text("dict")["blocks"]:
            if block["type"] == 1:
                if cur is None:
                    raise ExtractError(f"{pdf.name} p{pn+1}: image before first question")
                if mode != "q":
                    raise ExtractError(f"{pdf.name} q{cur['n']}: image outside question header")
                bbox = tuple(round(v) for v in block["bbox"])
                match = [i for i in img_infos if tuple(round(v) for v in i["bbox"]) == bbox]
                if len(match) != 1 or not match[0]["xref"]:
                    raise ExtractError(f"{pdf.name} q{cur['n']}: cannot resolve image xref")
                cur["_xrefs"].append(match[0]["xref"])
                continue

            for li, line in enumerate(block["lines"]):
                line_key = (pn, block["number"], li)
                for span in line["spans"]:
                    t = span["text"]
                    for bad, good in GLYPH_FIXES.items():
                        if bad in t:
                            fixes.append(f"{pdf.name} p{pn+1}: {t!r}")
                            t = t.replace(bad, good)
                    if not t.strip():
                        continue
                    x, y = span["bbox"][0], span["bbox"][1]
                    color = span["color"]
                    s = t.strip()

                    # first-page banner
                    if pn == 0 and y < 130:
                        if s.startswith("ԽՈՒՄԲ"):
                            title = s
                        elif COUNT_RE.match(s):
                            declared = int(COUNT_RE.match(s).group(1))
                        else:
                            subtitle = s
                        continue
                    # running header / footer
                    if y < 35:
                        continue
                    if y > 790 and s.startswith("էջ ") and "/" in s:
                        continue

                    if color == QNUM_COLOR and NUM_RE.match(s) and x < 55:
                        cur = {"n": int(s[:-1]), "_q": [], "_opts": [], "_green": [],
                               "_ans": None, "_xrefs": [], "_page": pn + 1}
                        qs.append(cur)
                        mode = "q"
                        continue
                    if cur is None:
                        raise ExtractError(f"{pdf.name} p{pn+1}: text before first question: {s!r}")

                    m = ANS_RE.match(s)
                    if m:
                        if cur["_ans"] is not None:
                            raise ExtractError(f"{pdf.name} q{cur['n']}: duplicate answer line")
                        cur["_ans"] = int(m.group(1))
                        mode = "done"
                        continue
                    if 60 < x < 80 and NUM_RE.match(s) and mode in ("q", "o"):
                        cur["_opts"].append([])
                        if color == GREEN:
                            cur["_green"].append(len(cur["_opts"]))
                        expected = len(cur["_opts"])
                        if int(s[:-1]) != expected:
                            raise ExtractError(f"{pdf.name} q{cur['n']}: option {s} out of order")
                        mode = "o"
                        continue
                    if mode in ("q", "o"):
                        target = cur["_q"] if mode == "q" else cur["_opts"][-1]
                        # spans on the same visual line are glued without a space
                        if target and last_line == (line_key, id(target)):
                            target[-1] += t
                        else:
                            target.append(t)
                        last_line = (line_key, id(target))
                    else:
                        raise ExtractError(f"{pdf.name} q{cur['n']}: unexpected text after answer: {s!r}")

    # ---- validation + output ----
    if declared is None or title is None:
        raise ExtractError(f"{pdf.name}: missing banner title/count")
    if len(qs) != declared:
        raise ExtractError(f"{pdf.name}: parsed {len(qs)} questions, header says {declared}")
    out_qs = []
    n_img = 0
    for i, q in enumerate(qs, 1):
        tag = f"{pdf.name} q{q['n']}"
        if q["n"] != i:
            raise ExtractError(f"{tag}: numbering not sequential (expected {i})")
        opts = [join(o) for o in q["_opts"]]
        if len(opts) < 2 or any(not o for o in opts):
            raise ExtractError(f"{tag}: bad options {opts}")
        if q["_ans"] is None:
            raise ExtractError(f"{tag}: missing answer line")
        if q["_green"] != [q["_ans"]]:
            raise ExtractError(f"{tag}: green {q['_green']} != answer {q['_ans']}")
        text = join(q["_q"])
        if not text:
            raise ExtractError(f"{tag}: empty question text")
        if len(q["_xrefs"]) > 1:
            raise ExtractError(f"{tag}: more than one image")
        img = None
        if q["_xrefs"]:
            rel = f"img/g{gid}/q{q['n']}.webp"
            w, h = save_image(doc, q["_xrefs"][0], out / rel)
            img = {"src": rel, "w": w, "h": h}
            n_img += 1
        out_qs.append({"id": f"{gid}-{q['n']}", "g": gid, "n": q["n"], "q": text,
                       "opts": opts, "a": q["_ans"], "img": img})

    for fx in fixes:
        print(f"  glyph fix: {fx}")
    group = {"id": gid, "title": title, "subtitle": subtitle, "count": len(out_qs)}
    return group, out_qs, n_img


def main():
    root = Path(__file__).resolve().parent.parent
    pdf_dir = Path(sys.argv[1]) if len(sys.argv) > 1 else root
    out = Path(sys.argv[2]) if len(sys.argv) > 2 else root / "public"
    groups, questions = [], []
    total_img = 0
    for gid in GROUPS:
        pdf = pdf_dir / f"{gid}.pdf"
        group, qs, n_img = parse_group(pdf, gid, out)
        groups.append(group)
        questions.extend(qs)
        total_img += n_img
        print(f"  {group['title']:<10} {len(qs):>4} questions  {n_img:>4} images")
    (out / "data").mkdir(parents=True, exist_ok=True)
    data = {"groups": groups, "questions": questions}
    with open(out / "data" / "questions.json", "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, separators=(",", ":"))
    print(f"TOTAL {len(questions)} questions, {total_img} images -> {out}")


if __name__ == "__main__":
    try:
        main()
    except ExtractError as e:
        print(f"EXTRACT FAILED: {e}", file=sys.stderr)
        sys.exit(1)

# One-off import of the Crello template dataset (CDLA-Permissive-2.0, commercial use allowed)
# into a compact layout library the designer agent retrieves from.
#   uv run --with duckdb scripts/import_crello.py
# Reads only the layout columns over HTTP (the full dataset is 18 GB of preview images).
import gzip
import json
import re
import os
import time
import urllib.request
import duckdb

OUT = "src/lib/agent/examples/crello.json.gz"

con = duckdb.connect()
con.execute("INSTALL httpfs; LOAD httpfs; SET threads = 2;")
token_file = os.path.expanduser("~/.cache/huggingface/token")
if os.path.exists(token_file):  # authenticated requests get a much higher rate limit
    con.execute(f"CREATE SECRET hf (TYPE huggingface, TOKEN '{open(token_file).read().strip()}')")
enum = lambda col: col
# Class-label columns are stored as integers; the names live in the dataset's feature info.
info = json.load(urllib.request.urlopen("https://datasets-server.huggingface.co/info?dataset=cyberagent/crello"))
feat = info["dataset_info"]["default"]["features"]
def names(col):
    f = feat[col]
    while isinstance(f, list): f = f[0]
    return f["names"]
N = {c: names(c) for c in ("format", "category", "industries", "type", "font", "text_align")}
files = [f"hf://datasets/cyberagent/crello@~parquet/default/{split}/{i:04d}.parquet"
         for split, n in (("train", 31), ("validation", 3), ("test", 4)) for i in range(n)]
files = files[: int(os.environ.get("CRELLO_FILES", len(files)))]  # CRELLO_FILES=1 for a quick test
QUERY = f"""
  SELECT id, {enum('format')}, {enum('category')}, title, keywords, industries, canvas_width, canvas_height,
         type, "left", top, width, height, angle, opacity, color, text, font, font_size, font_bold,
         text_color, text_align, capitalize, line_height, letter_spacing
  FROM read_parquet('{{}}')
"""
rows = []
for f in files:
    for attempt in range(6):
        try:
            rows += con.execute(QUERY.format(f)).fetchall()
            print(f, len(rows), flush=True)
            break
        except duckdb.Error as e:
            if "404" in str(e): break  # split has fewer files than assumed
            print("retry", f, str(e)[:80], flush=True)
            time.sleep(30 * (attempt + 1))

def hexc(c):
    m = re.match(r"rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)", c or "")
    if not m: return c
    h = "#%02x%02x%02x" % tuple(int(x) for x in m.groups()[:3])
    a = float(m.group(4) or 1)
    return h if a >= 1 else h + "%02x" % round(a * 255)

def r(n, d=1):
    return round(float(n), d) if n is not None else None

out = []
for (id_, fmt, cat, title, kws, inds, cw, ch, types, ls, ts, ws, hs, angs, ops, colors, texts, fonts,
     sizes, bolds, tcolors, aligns, caps, lhs, lss) in rows:
    fmt, cat = N["format"][fmt], N["category"][cat]
    inds = [N["industries"][x] for x in (inds or [])]
    layers = []
    for i, t in enumerate(types):
        t = N["type"][t]
        L = {"t": {"TextElement": "text", "ImageElement": "image", "SvgElement": "shape",
                   "SvgMaskElement": "masked-image", "ColoredBackground": "background"}.get(t, t),
             "x": r(ls[i]), "y": r(ts[i]), "w": r(ws[i]), "h": r(hs[i])}
        if angs[i]: L["rot"] = r(angs[i])
        if ops[i] is not None and ops[i] < 1: L["op"] = r(ops[i], 2)
        c = colors[i] if colors and colors[i] else None
        if c: L["color"] = hexc(c[0])
        if t == "TextElement":
            if not (texts[i] or "").strip(): continue
            L["text"] = texts[i].strip()[:80]
            L["font"] = N["font"][fonts[i]] or None
            L["size"] = r(sizes[i])
            if bolds[i] and any(bolds[i]): L["bold"] = True
            if tcolors[i]: L["color"] = hexc(tcolors[i][0])
            if aligns[i]: L["align"] = N["text_align"][aligns[i]]
            if caps[i]: L["caps"] = True
            if lhs[i] and abs(lhs[i] - 1) > 0.05: L["lh"] = r(lhs[i], 2)
            if lss[i]: L["ls"] = r(lss[i], 2)
        layers.append({k: v for k, v in L.items() if v not in (None, "")})
    if not any(l["t"] == "text" for l in layers):
        continue
    out.append({"id": id_, "format": str(fmt), "category": str(cat), "title": title or "",
                "keywords": [k for k in (kws or []) if k][:10], "industries": [str(x) for x in (inds or [])],
                "w": cw, "h": ch, "layers": layers})

with gzip.open(OUT, "wt") as f:
    json.dump(out, f, separators=(",", ":"))
print(f"{len(out)} templates -> {OUT}")

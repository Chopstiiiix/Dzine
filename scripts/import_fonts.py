# Builds the designer's font library: every Google Fonts family (open licences) plus the
# Fontshare catalogue (ITF Free Font License / OFL, both free for commercial use).
#   python3 scripts/import_fonts.py
# Personal-use-only sites (dafont and similar) are deliberately not sources: Dzine output is commercial.
import csv
import io
import json
import urllib.request

OUT = "src/lib/fonts-library.json"
COMMERCIAL_OK = {"itf_ffl", "sil_ofl"}


def get(url):
    req = urllib.request.Request(url, headers={"user-agent": "Mozilla/5.0"})
    return urllib.request.urlopen(req, timeout=60).read().decode("utf8")


CATEGORY = {"sans serif": "sans", "sans": "sans", "serif": "serif", "slab": "serif", "display": "display",
            "handwriting": "script", "handwritten": "script", "script": "script", "monospace": "mono-tech"}

# ---------------------------------------------------------------- Google Fonts
meta = get("https://fonts.google.com/metadata/fonts")
meta = json.loads(meta[meta.index("{"):])["familyMetadataList"]

tags = {}
for row in csv.reader(io.StringIO(get("https://raw.githubusercontent.com/google/fonts/main/tags/all/families.csv"))):
    if len(row) < 4 or not row[2].startswith("/") or row[2].startswith(("/Quality", "/Seasonal")):
        continue
    try:
        weight = float(row[3])
    except ValueError:
        continue
    if weight >= 40:
        tags.setdefault(row[0], []).append((weight, row[2].rsplit("/", 1)[-1].lower()))

out = []
for f in meta:
    if f.get("isNoto") or "latin" not in f.get("subsets", []):
        continue
    styles = f.get("fonts", {})
    weights = sorted({int(k.rstrip("i")) for k in styles if k.rstrip("i").isdigit()})
    italics = sorted({int(k[:-1]) for k in styles if k.endswith("i") and k[:-1].isdigit()})
    if not weights:
        continue
    family_tags = [t for _, t in sorted(tags.get(f["family"], []), reverse=True)]
    out.append({
        "f": f["family"], "s": "g", "c": CATEGORY.get(f["category"].lower(), "display"),
        "w": weights, **({"i": italics} if italics else {}),
        "t": list(dict.fromkeys(family_tags + [c.lower() for c in f.get("classifications", [])]))[:8],
        "p": f.get("popularity", 9999),
    })

# ---------------------------------------------------------------- Fontshare
shares = json.loads(get("https://api.fontshare.com/v2/fonts?limit=500"))["fonts"]
for f in shares:
    if f.get("license_type") not in COMMERCIAL_OK:
        continue
    weights = sorted({s["weight"]["weight"] for s in f["styles"]
                      if not s["is_italic"] and not s["is_variable"] and 100 <= s["weight"]["weight"] <= 900})
    if not weights:
        continue
    cats = [c.strip().lower() for c in f["category"].split(",")]
    out.append({
        "f": f["name"], "s": "fs", "slug": f["slug"],
        "c": "display" if "display" in cats else CATEGORY.get(cats[0], "display"),
        "w": weights,
        "t": list(dict.fromkeys([t["name"].lower() for t in f.get("font_tags") or []] + cats))[:8],
        # Fontshare fonts are hand-picked display and text faces: rank them alongside popular Google families.
        "p": 120,
    })

out.sort(key=lambda x: x["p"])
seen = set()
out = [x for x in out if not (x["f"].lower() in seen or seen.add(x["f"].lower()))]
with open(OUT, "w") as fh:
    json.dump(out, fh, separators=(",", ":"))
print(len(out), "families ->", OUT)

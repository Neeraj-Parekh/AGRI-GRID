#!/usr/bin/env python3
"""Scorer for AGRI-GRID-BUILD-PLAN.md.

Measures competition-viability of the plan across three dimensions:
  buildability (40)  - can 3 students build it in 4 days within ₹15K?
  competitiveness (35) - will it stand out / win vs typical hackathon projects?
  evidence (25)     - is it backed by real research, citations, numbers?

Prints a single integer 0-100 (the metric) to stdout.
Also emits a JSON breakdown on stderr for diagnosis.
"""
import sys, re, json, os

PATH = sys.argv[1] if len(sys.argv) > 1 else "AGRI-GRID-BUILD-PLAN.md"

def main():
    if not os.path.exists(PATH):
        print(0); return
    txt = open(PATH, encoding="utf-8").read()
    low = txt.lower()
    headers = re.findall(r'^#{1,3}\s+(.*)$', txt, re.M)
    hlow = [h.lower() for h in headers]
    breakdown = {}

    # ---- BUILDABILITY (40) ----
    b = 0
    # component list with prices
    if re.search(r'₹|rs\.?\s*\d|inr', low) and ('component' in low or 'bill of materials' in low or 'bom' in low):
        b += 8
    # total cost stated and <= 15000
    m = re.search(r'total[^₹]{0,40}₹\s*([\d,]+)', low)
    if m:
        val = int(m.group(1).replace(',', ''))
        if val <= 15000:
            b += 7
        else:
            b += 2
    # firmware pseudocode / code block
    if '```' in txt and ('void setup' in txt or 'lora.begin' in low or 'esp_sleep' in low or 'def ' in txt):
        b += 8
    # backend stack named
    if any(k in low for k in ['fastapi', 'thingsboard', 'postgresql', 'firebase', 'mqtt']):
        b += 6
    # build schedule with days
    if re.search(r'day\s*[1234]', low) and ('build' in low or 'plan' in low or 'july' in low):
        b += 6
    # power/battery approach
    if any(k in low for k in ['solar', 'battery', '18650', 'deep sleep', 'li-ion']):
        b += 5
    breakdown['buildability'] = b

    # ---- COMPETITIVENESS (35) ----
    c = 0
    # differentiation table
    if 'typical hackathon' in low or 'what makes this different' in low or 'different' in low:
        c += 6
    # agri stack / government integration
    if 'agri stack' in low or 'ufsi' in low or 'pm-kusum' in low:
        c += 8
    # judging criteria alignment
    if 'judging' in low and ('criter' in low or 'weight' in low or '%' in txt):
        c += 6
    # demo script / pitch
    if 'demo' in low and ('minute' in low or 'script' in low or '0:00' in txt):
        c += 5
    # mesh / multi-node
    if 'mesh' in low or 'grid' in low or 'multi' in low or '3+' in low:
        c += 5
    # AI/ML component
    if any(k in low for k in ['anomaly', 'isolationforest', 'lstm', 'ml', 'ai', 'spatial analysis', 'interpolat']):
        c += 5
    breakdown['competitiveness'] = c

    # ---- EVIDENCE (25) ----
    e = 0
    urls = re.findall(r'https?://[^\s)\]]+', txt)
    # count unique real source-ish urls (exclude internal anchors)
    real = [u for u in urls if any(d in u for d in
            ['robocraze', 'agristack', 'gov.in', 'iitb', 'mdpi', 'heltec', 'lora', 'github', 'amazon', 'pib', 'thingsboard'])]
    e += min(10, len(set(real)) * 2)  # up to 10 for 5+ distinct sources
    # quantified claims (ranges, %, km, mA, hours)
    nums = re.findall(r'(\d+(?:\.\d+)?\s*(?:km|cm|mm|%|ma|mah|hours|days|°c|nodes|hz|dbm))', low)
    e += min(10, len(set(nums)))
    # risk mitigation section
    if 'risk' in low and ('mitigat' in low or 'fallback' in low or 'backup' in low):
        e += 3
    # SDG / impact
    if 'sdg' in low or 'sustainable' in low or 'impact' in low:
        e += 2
    breakdown['evidence'] = e

    total = b + c + e
    total = max(0, min(100, total))
    print(total)
    json.dump({"score": total, "buildability": b, "competitiveness": c,
               "evidence": e, "citations": len(set(real))}, sys.stderr)
    sys.stderr.write("\n")

if __name__ == "__main__":
    main()

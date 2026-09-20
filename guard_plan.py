#!/usr/bin/env python3
"""Regression guard for AGRI-GRID-BUILD-PLAN.md.

Fails (exit 1) if an edit accidentally destroys critical structure:
  - file exists and non-empty
  - contains the 11 must-have planning sections
  - total estimated cost still <= 15000 (budget rule)
Prints 'pass' or 'FAIL <reason>' and exits accordingly.
"""
import sys, re, os

PATH = sys.argv[1] if len(sys.argv) > 1 else "AGRI-GRID-BUILD-PLAN.md"

MUST_HEADERS = [
    "PROJECT OVERVIEW", "SYSTEM ARCHITECTURE", "COMPONENT LIST",
    "FIRMWARE", "BACKEND", "DASHBOARD", "AI/ML",
    "AGRI STACK", "JUDGING", "BUILD PLAN", "RISK", "DEMO",
]

def fail(reason):
    print("FAIL " + reason); sys.exit(1)

if not os.path.exists(PATH):
    fail("file missing")
txt = open(PATH, encoding="utf-8").read()
if len(txt) < 2000:
    fail("document too small (<2000 chars) - likely truncated")
hlow = txt.lower()
for h in MUST_HEADERS:
    if h.lower() not in hlow:
        fail("missing section: " + h)
m = re.search(r'total[^₹]{0,40}₹\s*([\d,]+)', hlow)
if m:
    val = int(m.group(1).replace(',', ''))
    if val > 15000:
        fail("cost ₹%d exceeds ₹15000 budget" % val)
print("pass")
sys.exit(0)

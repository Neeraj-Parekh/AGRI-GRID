#!/usr/bin/env python3
import sys, re

def main():
    path = sys.argv[1] if len(sys.argv) > 1 else "AGRI-GRID-PPT-PROMPT.md"
    try:
        text = open(path, encoding="utf-8").read()
    except FileNotFoundError:
        print("FAIL: file not found")
        sys.exit(1)

    low = text.lower()
    problems = []

    # Must have a full slide-by-slide breakdown (>=15 slides)
    slides = len(re.findall(r"(?im)^\s*(#{2,3}\s*)?slide\s+\d+", text))
    if slides < 15:
        problems.append(f"need >=15 slide specs, found {slides}")

    # Must specify concrete hex colors
    hexes = set(re.findall(r"#[0-9a-fA-F]{6}\b", text))
    if len(hexes) < 3:
        problems.append(f"need >=3 hex colors, found {len(hexes)}")

    # Must carry research citations
    urls = set(re.findall(r"https?://[^\s)\]\"'>]+", text))
    if len(urls) < 5:
        problems.append(f"need >=5 citations, found {len(urls)}")

    # Must be AGRI-GRID specific (not generic advice)
    agri = ["agri-grid", "awd", "paddy", "lora", "agri stack", "methane"]
    if not any(t in low for t in agri):
        problems.append("document is not AGRI-GRID specific")

    # Must not be a stub
    if len(text) < 2000:
        problems.append(f"document too short ({len(text)} chars)")

    if problems:
        print("FAIL: " + "; ".join(problems))
        sys.exit(1)
    print("pass")

if __name__ == "__main__":
    main()

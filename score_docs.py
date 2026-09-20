#!/usr/bin/env python3
import sys, re, json, os, glob

def main():
    base = sys.argv[1] if len(sys.argv) > 1 else "documentation"
    if not os.path.isdir(base):
        print(json.dumps({"score": 0, "error": "directory not found"}))
        return

    md_files = glob.glob(f"{base}/**/*.md", recursive=True)
    total = len(md_files)

    # Count categories covered
    categories = set()
    for f in md_files:
        parts = f.split("/")
        if len(parts) >= 2:
            categories.add(parts[1])  # documentation/CATEGORY/file.md

    # Score: 4 points per doc, 2 points per category, max 100
    doc_score = min(60, total * 4)
    cat_score = min(40, len(categories) * 8)
    score = min(100, doc_score + cat_score)

    # Check each doc has source URL
    docs_with_url = 0
    for f in md_files:
        try:
            text = open(f, encoding="utf-8").read()
            if re.search(r"https?://", text):
                docs_with_url += 1
        except:
            pass

    print(json.dumps({
        "score": score,
        "total_docs": total,
        "categories": len(categories),
        "category_names": sorted(categories),
        "docs_with_url": docs_with_url,
        "doc_score": doc_score,
        "cat_score": cat_score
    }))

if __name__ == "__main__":
    main()

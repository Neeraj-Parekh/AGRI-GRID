#!/usr/bin/env python3
import sys, os, glob

def main():
    base = sys.argv[1] if len(sys.argv) > 1 else "documentation"
    problems = []

    if not os.path.isdir(base):
        problems.append("documentation directory not found")
        print("FAIL: " + "; ".join(problems))
        sys.exit(1)

    md_files = glob.glob(f"{base}/**/*.md", recursive=True)
    if len(md_files) < 5:
        problems.append(f"need >=5 downloaded docs, found {len(md_files)}")

    # Must cover at least 3 categories
    categories = set()
    for f in md_files:
        parts = f.split("/")
        if len(parts) >= 2:
            categories.add(parts[1])
    if len(categories) < 3:
        problems.append(f"need >=3 categories, found {len(categories)}")

    # Each content doc (not INDEX/SUMMARY) must have at least 1 URL
    docs_no_url = 0
    for f in md_files:
        basename = os.path.basename(f)
        if basename in ("INDEX.md", "SUMMARY.md", "MASTER-INDEX.md"):
            continue  # meta files don't need URLs
        try:
            text = open(f, encoding="utf-8").read()
            if not any(u in text for u in ["http://", "https://"]):
                docs_no_url += 1
        except:
            docs_no_url += 1
    if docs_no_url > 0:
        problems.append(f"{docs_no_url} docs have no source URL")

    if problems:
        print("FAIL: " + "; ".join(problems))
        sys.exit(1)
    print("pass")

if __name__ == "__main__":
    main()

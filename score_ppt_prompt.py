#!/usr/bin/env python3
import sys, re, json

def main():
    path = sys.argv[1] if len(sys.argv) > 1 else "AGRI-GRID-PPT-PROMPT.md"
    try:
        text = open(path, encoding="utf-8").read()
    except FileNotFoundError:
        print(json.dumps({"score": 0, "error": "file not found"}))
        return

    low = text.lower()
    score = 0
    parts = {}

    # 1. Research depth / citations (0-15): count distinct http(s) URLs
    urls = set(re.findall(r"https?://[^\s)\]\"'>]+", text))
    cit = min(15, len(urls) * 2)
    parts["research"] = cit
    score += cit

    # 2. Design-system specificity (0-15): hex codes + named fonts
    hexes = set(re.findall(r"#[0-9a-fA-F]{6}\b", text))
    font_hits = len(re.findall(r"\b(montserrat|inter|poppins|roboto|open sans|lato|source sans|fira|geist|satoshi|plus jakarta|archivo|nunito)\b", low))
    ds = min(8, len(hexes)) + min(7, font_hits)
    parts["design_system"] = ds
    score += ds

    # 3. Slide-by-slide breakdown completeness (0-20): count "Slide N" / "## Slide"
    slides = len(re.findall(r"(?im)^\s*(#{2,3}\s*)?slide\s+\d+", text))
    slide_score = min(20, slides * 2)
    parts["slides"] = slide_score
    score += slide_score

    # 4. Visual element guidance (0-15): named viz types
    viz_terms = ["architecture diagram", "flowchart", "flow chart", "heatmap", "isometric",
                 "infographic", "timeline", "funnel", "sankey", "gauge", "donut", "bar chart",
                 "line chart", "icon", "icons", "wireframe", "mockup", "before/after",
                 "layered", "stack", "kanban", "mindmap", "mind map", "comparison table"]
    viz = sum(1 for t in viz_terms if t in low)
    viz_score = min(15, viz)
    parts["visuals"] = viz_score
    score += viz_score

    # 5. Animation / motion guidance (0-10)
    anim = len(re.findall(r"\b(animation|animate|motion|transition|entrance|reveal|morph|fade|wipe|fly-in|fly in)\b", low))
    anim_score = min(10, anim)
    parts["animation"] = anim_score
    score += anim_score

    # 6. AGRI-GRID content mapping (0-15): our specific terms present
    agri_terms = ["agri-grid", "lora", "awd", "alternate wetting", "paddy", "methane",
                  "agri stack", "agristack", "in865", "jsn-sr04t", "star grid", "star topology",
                  "edge-ai", "edge ai", "carbon credit", "water credit", "in865", "esp32"]
    agri = sum(1 for t in agri_terms if t in low)
    agri_score = min(15, agri)
    parts["agri_mapping"] = agri_score
    score += agri_score

    # 7. Judge / winning alignment (0-10)
    judge = len(re.findall(r"\b(judge|judging|winning|differentiator|usp|unique selling|sdh|sdg|esg|impact|demo|feasibility|problem statement)\b", low))
    judge_score = min(10, judge)
    parts["judge_alignment"] = judge_score
    score += judge_score

    score = min(100, score)
    print(json.dumps({"score": score, "parts": parts,
                      "urls": len(urls), "hex": len(hexes), "slides": slides}))

if __name__ == "__main__":
    main()

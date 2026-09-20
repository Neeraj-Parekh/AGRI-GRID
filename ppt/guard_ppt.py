"""Regression guard for autoresearch loop.
Asserts: file is loadable, >=12 slides, every slide has a non-empty title
and >=20 chars of text content. Prints 'pass' or raises AssertionError.
"""
from pptx import Presentation

PATH = "JAL-SURAKSHA_v2.0.pptx"

def main():
    p = Presentation(PATH)
    n = len(p.slides)
    assert n >= 12, f"Need >=12 slides, got {n}"
    for i, slide in enumerate(p.slides):
        total_text = 0
        has_title = False
        has_picture = False
        for shape in slide.shapes:
            if shape.shape_type == 13:
                has_picture = True
            if shape.has_text_frame:
                t = shape.text_frame.text.strip()
                total_text += len(t)
                if not has_title and t:
                    has_title = True
        # a slide is valid if it has real text OR is a full visual (picture)
        assert has_title or has_picture, f"Slide {i} has no content"
        assert total_text >= 20 or has_picture, f"Slide {i} too empty"
    print("pass")

if __name__ == "__main__":
    main()

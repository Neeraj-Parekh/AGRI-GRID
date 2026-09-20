"""Verify metric for autoresearch loop: count visual slides in the PPTX.
A visual slide contains at least one picture or chart shape.
Prints the integer metric value to stdout.
"""
import sys
from pptx import Presentation

PATH = "JAL-SURAKSHA_v2.0.pptx"

def main():
    try:
        p = Presentation(PATH)
    except Exception as e:
        print(0)
        return
    visual = 0
    for slide in p.slides:
        has = False
        for shape in slide.shapes:
            # picture
            if shape.shape_type == 13:
                has = True
            # chart
            if getattr(shape, "has_chart", False):
                has = True
        if has:
            visual += 1
    print(visual)

if __name__ == "__main__":
    main()

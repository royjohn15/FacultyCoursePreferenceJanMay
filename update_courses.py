"""Regenerate the course/lab lists inside index.html from the xlsx.

Usage: python3 update_courses.py "SlotWise_SubjectWise List__2026-10-12.xlsx"

A course goes in the lab list if its name contains the word "Lab" or
"Laboratory", except the codes in NOT_LABS.
"""
import json
import re
import sys
from pathlib import Path

import openpyxl

NOT_LABS = {"PH5250"}  # "Advanced Electronics & Lab" is offered as a course
HTML = Path(__file__).with_name("index.html")

ws = openpyxl.load_workbook(sys.argv[1], read_only=True).active
courses, labs = [], []
# The sheet's used range is huge (1M rows x 16K cols); stop at the first empty code.
for code, name in ws.iter_rows(min_row=2, max_col=2, values_only=True):
    if not code:
        break
    entry = [str(code).strip(), " ".join(str(name).split())]
    is_lab = re.search(r"\blab(oratory)?\b", entry[1], re.I) and entry[0] not in NOT_LABS
    (labs if is_lab else courses).append(entry)

block = (
    "// COURSES-START\n"
    f"const COURSES = {json.dumps(courses, ensure_ascii=False, indent=0)};\n"
    f"const LABS = {json.dumps(labs, ensure_ascii=False, indent=0)};\n"
    "// COURSES-END"
)
html = HTML.read_text(encoding="utf-8")
html = re.sub(r"// COURSES-START.*?// COURSES-END", lambda _: block, html, flags=re.S)
HTML.write_text(html, encoding="utf-8")
print(f"{len(courses)} courses, {len(labs)} labs written to {HTML.name}")
print("Labs:", ", ".join(c for c, _ in labs))

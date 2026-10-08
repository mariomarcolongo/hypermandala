#!/usr/bin/env python3
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]
app_path = ROOT / 'public/app.js'
patch_path = ROOT / 'public/4d-tools-fix.js'
source = app_path.read_text()
patch = patch_path.read_text()

pairs = re.findall(
    r"replaceRequired\(\s*`([\s\S]*?)`,\s*`([\s\S]*?)`,\s*'[^']+'\s*,?\s*\);",
    patch,
)
if len(pairs) < 8:
    raise SystemExit(f'Expected at least 8 replaceRequired pairs, found {len(pairs)}')

changes = 0
for before, after in pairs:
    if before not in source:
        raise SystemExit('Missing required source needle while baking 4D tools:\n' + before[:240])
    source = source.replace(before, after, 1)
    changes += 1

section_match = re.search(r"const sectionFunctions = `([\s\S]*?)`;", patch)
if not section_match:
    raise SystemExit('Could not extract sectionFunctions')
section_functions = section_match.group(1)
section_pattern = re.compile(
    r"  function drawWLayerOverlay\(\) \{[\s\S]*?\n  \}\n\n  function transform3DReference"
)
source, count = section_pattern.subn(section_functions, source, count=1)
if count != 1:
    raise SystemExit(f'Expected one section renderer replacement, got {count}')
changes += 1

needle_match = re.search(r"const faceLoopNeedle =\s*`([\s\S]*?)`;", patch)
replacement_match = re.search(r"const faceLoopReplacement =\s*`([\s\S]*?)`;", patch)
if not needle_match or not replacement_match:
    raise SystemExit('Could not extract filled-face loop patch')
needle = needle_match.group(1)
replacement = replacement_match.group(1)
count = source.count(needle)
if count < 2:
    raise SystemExit(f'Expected at least two filled-face loops, found {count}')
source = source.replace(needle, replacement)
changes += 1

app_path.write_text(source)
print(f'Baked 4D inspection tools into app.js ({changes} patch groups).')

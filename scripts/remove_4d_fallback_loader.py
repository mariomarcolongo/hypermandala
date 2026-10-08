#!/usr/bin/env python3
from pathlib import Path
import re

path = Path(__file__).resolve().parents[1] / 'public/index.html'
text = path.read_text()
text, count = re.subn(
    r"\n          const loadFallback4DTools = \(\) => \{[\s\S]*?\n          \};\n",
    "\n",
    text,
    count=1,
)
if count != 1:
    raise SystemExit(f'Expected one fallback 4D loader, found {count}')
text = text.replace('kali.onload = loadFallback4DTools;', 'kali.onload = loadFallbackApp;')
text = text.replace('kali.onerror = loadFallback4DTools;', 'kali.onerror = loadFallbackApp;')
if '4d-tools-fix.js' in text:
    raise SystemExit('Residual 4d-tools-fix.js reference remains in index.html')
path.write_text(text)
print('Removed obsolete fallback 4D loader.')

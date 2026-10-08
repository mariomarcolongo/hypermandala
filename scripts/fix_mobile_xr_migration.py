from pathlib import Path
import re

path = Path(__file__).with_name('apply_mobile_xr_fix.py')
text = path.read_text()

text, count_push = re.subn(
    r'  function pushXRVertex\(target, point, rgb, alpha = 1\) \{(?:\\n|\n)""",\s*\n\)',
    '""",\n)',
    text,
    count=1,
)
text, count_start = re.subn(
    r'  async function startXR\(\) \{(?:\\n|\n)""",\s*\n\)',
    '""",\n)',
    text,
    count=1,
)
assert count_push == 1, count_push
assert count_start == 1, count_start

path.write_text(text)
print('Fixed migration replacement boundaries.')

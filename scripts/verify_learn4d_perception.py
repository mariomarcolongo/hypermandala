from pathlib import Path

clean_background = Path('public/tutorial-clean-background.js').read_text(encoding='utf-8')
loader = Path('public/tutorial-fluid.js').read_text(encoding='utf-8')
perception = Path('public/tutorial-perception.js').read_text(encoding='utf-8')

checks = [
    (
        'clean background allowlists perception canvas',
        ':not(.learn4d-perception-stage)' in clean_background,
    ),
    (
        'loader includes perception tutorial',
        'tutorial-perception.js' in loader,
    ),
    (
        'perception canvas is created',
        "canvas.className = 'learn4d-perception-stage'" in perception,
    ),
]

missing = [name for name, ok in checks if not ok]
if missing:
    raise SystemExit('Learn 4D perception integration check failed: ' + ', '.join(missing))

print('Learn 4D perception integration checks passed.')

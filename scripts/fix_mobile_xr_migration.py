from pathlib import Path

path = Path(__file__).with_name('apply_mobile_xr_fix.py')
text = path.read_text()

old = '''  function pushXRVertex(target, point, rgb, alpha = 1) {\n""",\n)'''
new = '''""",\n)'''
assert old in text
text = text.replace(old, new, 1)

old = '''  async function startXR() {\n""",\n)'''
new = '''""",\n)'''
assert old in text
text = text.replace(old, new, 1)

path.write_text(text)
print('Fixed migration replacement boundaries.')

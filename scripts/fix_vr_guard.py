from pathlib import Path

path = Path(__file__).resolve().parent / 'verify_mobile_xr.py'
text = path.read_text()
old = '    "const geometryInterval = perception.xrMobile ? 33 : 0;",\n'
new = '    "const geometryInterval = perception.xrMobile",\n    "perception.xrFramebufferScale <= 0.52 ? 50 : 33",\n'
if old not in text:
    raise RuntimeError('old fixed XR interval guard not found')
path.write_text(text.replace(old, new, 1))
print('Adaptive XR guard updated.')

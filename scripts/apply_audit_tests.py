#!/usr/bin/env python3
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

def p(path): return ROOT / path

def once(text, before, after, label):
    count = text.count(before)
    if count != 1:
        raise SystemExit(f'{label}: expected one occurrence, found {count}')
    return text.replace(before, after, 1)

math = p('scripts/verify_math_rigor.py').read_text()
browser = p('.github/workflows/diagnose-4d-browser.yml').read_text()
verify = p('.github/workflows/verify-math-rigor.yml').read_text()

math = math.replace('    tools = (ROOT / "public/4d-tools-fix.js").read_text()\n', '')
old_section = '''    section = tools[
        tools.find("function intersectFaceWithViewW"):
        tools.find("function drawViewSpaceWSection")
    ]
    assert "pair crossings consecutively" in section
    assert "bestA" not in section
'''
math = math.replace(old_section, '''    assert "function hypercellEdgeSets(module)" in app
    assert "function renderSectionSurface(polygons" in app
    assert "source3?.faces" in app
''')
math = math.replace('    assert "exact 2D plans" not in index\n    assert "exact 2D plans" not in readme\n    assert "true 3D Isometric" in readme\n',
'''    assert "exact 2D plans" not in index
    assert "exact 2D geometric plans" not in index
    assert "exact 2D plans" not in readme
    assert "exact 2D geometric plans" not in readme
    assert "4D → 3D projection" in index
    assert "3D → 2D camera" in index
    assert "Isometric orientation" in index
    assert "state.screenProjection" in app
    assert "state.isometricView" in app
    assert "faces: faces3.map" in app
    assert "capTriangles = triangulateProjectedPolygon" in app
    assert "vertexRgb = (" in app
    assert "bayer[16]" in app
    assert "transparentTriangles.sort" not in app
    assert "4d-tools-fix.js" not in index
''')
math = once(math, 'def check_4d_perspective() -> None:\n',
'''def check_rotation_noncommutativity() -> None:
    point = [0.7, -0.4, 1.1, 0.9]
    first = rotate_plane(rotate_plane(point, 0, 3, 0.61), 1, 3, -0.47)
    second = rotate_plane(rotate_plane(point, 1, 3, -0.47), 0, 3, 0.61)
    distance = math.sqrt(sum((a-b)**2 for a, b in zip(first, second)))
    assert distance > 1e-3


def check_4d_perspective() -> None:
''', 'noncommutativity test')
math = once(math, '    check_4d_perspective()\n', '    check_rotation_noncommutativity()\n    check_4d_perspective()\n', 'run noncommutativity')

browser = browser.replace("      - 'public/4d-tools-fix.js'\n", '')
browser = browser.replace("          console.log('PATCH', await page.evaluate(() => window.__hypermandala4DInspectionPatch || null));\n",
                          "          console.log('NATIVE_4D_TOOLS', await page.locator('#hypermandala4DInspectionTools').count());\n")
needle = "          const baseline = await snapshot('baseline');\n"
insert = '''          // Validate every generated preset in Simple and Complex modes using the
          // live geometry engine, not only screenshots.
          for (const complexity of ['simple', 'complex']) {
            await page.locator('[data-complexity="' + complexity + '"]').click();
            const presetNames = await page.locator('[data-preset]').evaluateAll((els) => els.map((el) => el.dataset.preset));
            for (const preset of presetNames) {
              const button = page.locator('[data-preset="' + preset + '"]');
              // Experimental cards may be hidden until “show more”; programmatic click
              // through the DOM keeps the validation independent from dock layout.
              await button.evaluate((el) => el.click());
              await page.waitForTimeout(25);
              const validation = await page.evaluate(() => window.__hypermandalaDebug.validateCurrentGeometry());
              console.log('GEOMETRY', complexity, preset, validation);
              if (!validation.ok) throw new Error(complexity + '/' + preset + ': ' + validation.issues.join(' | '));
            }
          }
          await page.locator('[data-preset="square"]').evaluate((el) => el.click());
          await page.locator('[data-complexity="complex"]').click();

          // 4D projection, 3D projection and isometric orientation are independent.
          await page.locator('[data-projection="orthographic"]').click();
          await page.locator('[data-screen-projection="perspective"]').click();
          await page.locator('#isometricView').click();
          let projectionState = await page.evaluate(() => window.__hypermandalaDebug.projectionState());
          if (projectionState.projection4D !== 'orthographic' || projectionState.projection3D !== 'perspective' || !projectionState.isometricView) {
            throw new Error('Projection stages are not independent: ' + JSON.stringify(projectionState));
          }
          await page.locator('[data-projection="perspective"]').click();
          await page.locator('[data-screen-projection="perspective"]').click();
          await page.locator('#isometricView').click();

          const baseline = await snapshot('baseline');
'''
browser = once(browser, needle, insert, 'browser structural tests')

verify = verify.replace('      - public/4d-tools-fix.js\n', '')

p('scripts/verify_math_rigor.py').write_text(math)
p('.github/workflows/diagnose-4d-browser.yml').write_text(browser)
p('.github/workflows/verify-math-rigor.yml').write_text(verify)
print('Applied second-pass regression test updates.')

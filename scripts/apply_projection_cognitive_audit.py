#!/usr/bin/env python3
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]

def read(path): return (ROOT / path).read_text()
def write(path, text): (ROOT / path).write_text(text)

def once(text, before, after, label):
    count = text.count(before)
    if count != 1:
        raise SystemExit(f'{label}: expected one occurrence, found {count}')
    return text.replace(before, after, 1)

def regex_once(text, pattern, replacement, label, flags=re.S):
    new, count = re.subn(pattern, replacement, text, count=1, flags=flags)
    if count != 1:
        raise SystemExit(f'{label}: expected one regex match, found {count}')
    return new

app = read('public/app.js')
index = read('public/index.html')
styles = read('public/styles.css')
readme = read('README.md')
tutorial = read('public/tutorial-descriptions.js')
headers = read('public/_headers')

# Remove runtime patch loader now that bake_4d_tools.py has integrated its source changes.
index = once(index,
    "        await loadInlineScript('./4d-tools-fix.js', '/4d-tools-fix.js');\n",
    '', 'remove 4d tools loader')

# Static native 4D tool controls formerly injected by 4d-tools-fix.js.
replay = '''        <button
          id="replay4D"
          class="perception-replay"
          type="button"
          title="Replay the construction from the 3D form into its 4D extension"
        >Replay 3D → 4D</button>'''
tools = '''        <div id="hypermandala4DInspectionTools" class="hyper4d-tools">
          <div class="perception-tool-label">Section frame</div>
          <div class="segmented hyper4d-two" id="wSectionSpaceControl">
            <button type="button" data-w-section-space="intrinsic" class="is-active" title="Slice the unrotated object with one common intrinsic W = constant hyperplane">Intrinsic W</button>
            <button type="button" data-w-section-space="view" title="Rotate in 4D first, then slice the transformed object at view-space W = constant">View-space W</button>
          </div>
          <div class="hyper4d-explanation">View-space W differs from intrinsic W after an XW, YW or ZW rotation.</div>
          <button id="wSliceSweep" class="inspection-toggle hyper4d-wide" type="button" aria-pressed="false" title="Animate the selected W cross-section continuously through the 4D object">Sweep section</button>
          <div class="perception-tool-label">Fourth-coordinate cue</div>
          <button id="wDepthToggle" class="inspection-toggle hyper4d-wide" type="button" aria-pressed="false" title="Color geometry continuously by its current post-rotation W coordinate">W-coordinate color</button>
          <div id="wDepthLegend" class="w-depth-legend" aria-hidden="true"><span>W−</span><i></i><span>0</span><i></i><span>W+</span></div>
          <div class="perception-tool-label">3D boundary cell</div>
          <button id="hypercellToggle" class="inspection-toggle hyper4d-wide" type="button" aria-pressed="false" title="Isolate one genuine 3D boundary cell of the current 4D prism decomposition">Isolate one cell</button>
          <div class="hyper4d-cell-nav" id="hypercellNav"><button id="hypercellPrev" type="button" aria-label="Previous 3D boundary cell">‹</button><output id="hypercellLabel" aria-live="polite">all cells</output><button id="hypercellNext" type="button" aria-label="Next 3D boundary cell">›</button></div>
        </div>
''' + replay
index = once(index, replay, tools, 'static 4d tools')

old_projection = '''    <section class="control-section">
      <div class="control-section__label">Projection</div>
      <div class="segmented segmented--three" id="projectionControl">
        <button type="button" data-projection="perspective" class="is-active">Perspective</button>
        <button type="button" data-projection="orthographic">Ortho</button>
        <button type="button" data-projection="isometric" title="True 3D isometric view with equal X/Y/Z foreshortening after the 4D→3D projection">Isometric</button>
      </div>
    </section>'''
new_projection = '''    <section class="control-section">
      <div class="control-section__label">4D → 3D projection</div>
      <div class="segmented hyper4d-two" id="projectionControl">
        <button type="button" data-projection="perspective" class="is-active" title="Central perspective along W">W perspective</button>
        <button type="button" data-projection="orthographic" title="Orthographically forget W after the 4D rotation">W orthographic</button>
      </div>
    </section>
    <section class="control-section">
      <div class="control-section__label">3D → 2D camera</div>
      <div class="segmented hyper4d-two" id="screenProjectionControl">
        <button type="button" data-screen-projection="perspective" class="is-active">Perspective</button>
        <button type="button" data-screen-projection="orthographic">Orthographic</button>
      </div>
      <button id="isometricView" type="button" class="inspection-toggle hyper4d-wide" aria-pressed="false" title="Fix the 3D camera to the standard isometric orientation; this does not change the 4D→3D projection">Isometric orientation</button>
    </section>'''
index = once(index, old_projection, new_projection, 'split projection UI')

readout = '''  <div class="dimension-readout" aria-live="polite">
    <strong id="dimensionValue">2D</strong>
    <span id="dimensionStatus">mandala plan</span>
  </div>'''
index = once(index, readout, readout + '''
  <div class="w-semantics-readout" id="wSemanticsReadout" aria-live="polite">
    <span class="w-semantics-readout__label">W meaning</span>
    <strong id="wMeaning">spatial extrusion</strong>
    <span id="dimensionRank">intrinsic rank 2D</span>
    <span id="viewWExtent"></span>
  </div>''', 'W semantic readout')

index = index.replace('>Transparent</button>', '>X-ray</button>')
index = index.replace('title="Make projected surfaces translucent so hidden geometry can be seen. This is a transparency aid, not a simulation of 4D eyesight."',
                      'title="Depth-correct screen-door surfaces plus the complete structural wireframe. This is an inspection aid, not a simulation of 4D eyesight."')
index = index.replace('Dimension stretch</span>', 'Intrinsic dimension stretch</span>')
index = index.replace('1 normal · 0 collapse</span>', 'before rotation · 1 normal · 0 collapse</span>')
index = index.replace('<div id="rotationRows" class="control-rows"></div>', '<div id="rotationRows" class="control-rows"></div>\n      <div class="rotation-order-note">Applied in listed order. 4D plane rotations do not commute.</div>')
index = index.replace('exact 2D geometric plans', 'geometric 2D plans')

app = once(app, "  const projectionButtons = [...document.querySelectorAll('[data-projection]')];",
'''  const projectionButtons = [...document.querySelectorAll('[data-projection]')];
  const screenProjectionButtons = [...document.querySelectorAll('[data-screen-projection]')];
  const isometricViewButton = document.getElementById('isometricView');
  const wMeaning = document.getElementById('wMeaning');
  const dimensionRank = document.getElementById('dimensionRank');
  const viewWExtent = document.getElementById('viewWExtent');
  const wDepthLegend = document.getElementById('wDepthLegend');''', 'projection DOM refs')
app = once(app, "    projection: 'perspective',\n    insightMode: 'standard',",
'''    projection: 'perspective',
    screenProjection: 'perspective',
    isometricView: false,
    insightMode: 'standard',''', 'projection state')
app = once(app, '      projection: state.projection,\n      insightMode: state.insightMode,',
'''      projection: state.projection,
      screenProjection: state.screenProjection,
      isometricView: state.isometricView,
      insightMode: state.insightMode,''', 'persist projection')
app = regex_once(app,
 r"    if \(\['perspective', 'orthographic', 'isometric'\]\.includes\(saved\.projection\)\) \{\n      state\.projection = saved\.projection;\n    \}",
'''    if (saved.projection === 'isometric') {
      state.projection = 'orthographic';
      state.screenProjection = 'orthographic';
      state.isometricView = true;
    } else if (['perspective', 'orthographic'].includes(saved.projection)) {
      state.projection = saved.projection;
    }
    if (['perspective', 'orthographic'].includes(saved.screenProjection)) state.screenProjection = saved.screenProjection;
    if (typeof saved.isometricView === 'boolean') state.isometricView = saved.isometricView;''', 'restore projection')
app = app.replace("      state.projection === 'orthographic'\n      || state.projection === 'isometric'\n      || state.wMix < 0.001",
                  "      state.projection === 'orthographic'\n      || state.wMix < 0.001")
app = app.replace("const isometric = state.projection === 'isometric';", "const isometric = state.isometricView;")
count = app.count("state.projection === 'perspective'\n      ? cameraZ / (cameraZ - p3[2])")
if count < 2: raise SystemExit(f'screen perspective factor: expected >=2, found {count}')
app = app.replace("state.projection === 'perspective'\n      ? cameraZ / (cameraZ - p3[2])", "state.screenProjection === 'perspective'\n      ? cameraZ / (cameraZ - p3[2])")
app = once(app, "    if (state.projection !== 'perspective') {", "    if (state.screenProjection !== 'perspective') {", 'GPU projection stage')

app = regex_once(app, r"  function setProjection\(mode\) \{[\s\S]*?\n  \}\n\n  function setInsightMode",
'''  function syncProjectionControls() {
    projectionButtons.forEach((button) => button.classList.toggle('is-active', button.dataset.projection === state.projection));
    screenProjectionButtons.forEach((button) => button.classList.toggle('is-active', button.dataset.screenProjection === state.screenProjection));
    if (isometricViewButton) {
      isometricViewButton.classList.toggle('is-active', state.isometricView);
      isometricViewButton.setAttribute('aria-pressed', state.isometricView ? 'true' : 'false');
    }
  }

  function setProjection(mode) {
    if (!['perspective', 'orthographic'].includes(mode)) return;
    state.projection = mode;
    markSettingsDirty();
    syncProjectionControls();
  }

  function setScreenProjection(mode) {
    if (!['perspective', 'orthographic'].includes(mode)) return;
    state.screenProjection = mode;
    markSettingsDirty();
    syncProjectionControls();
  }

  function setIsometricView(enabled) {
    state.isometricView = Boolean(enabled);
    markSettingsDirty();
    syncProjectionControls();
  }

  function setInsightMode''', 'projection setter')

listeners = '''  projectionButtons.forEach((button) => {
    button.addEventListener('click', () => {
      setProjection(button.dataset.projection);
      hideHint();
    });
  });'''
app = once(app, listeners, listeners + '''

  screenProjectionButtons.forEach((button) => {
    button.addEventListener('click', () => { setScreenProjection(button.dataset.screenProjection); hideHint(); });
  });
  isometricViewButton?.addEventListener('click', () => { setIsometricView(!state.isometricView); hideHint(); });''', 'projection listeners')

app = once(app, "    state.renderMode = 'solid';\n\n    state.rotations =",
'''    state.renderMode = 'solid';
    state.projection = 'perspective';
    state.screenProjection = 'perspective';
    state.isometricView = false;

    state.rotations =''', 'reset projections')

semantics = '''

  const W_SEMANTICS = {
    square: ['spatial extrusion', 'spatial'], sriyantra: ['spatial extrusion', 'spatial'], kaliyantra: ['spatial extrusion', 'spatial'], matangiyantra: ['spatial extrusion', 'spatial'], hex: ['spatial extrusion', 'spatial'],
    stupa: ['architectural hierarchy', 'parameter'], borobudur: ['architectural hierarchy', 'parameter'], castel: ['architectural hierarchy', 'parameter'], kukulkan: ['architectural hierarchy', 'parameter'], lalibela: ['architectural hierarchy', 'parameter'],
    chartres: ['labyrinth path progress', 'parameter'], rosewindow: ['tracery depth parameter', 'parameter'], sunstone: ['concentric register', 'parameter'], lotfollah: ['dome radial depth', 'parameter'], chladni: ['standing-wave quadrature', 'parameter'], diatom: ['frustule shell parameter', 'parameter'], radiolaria: ['radial shell parameter', 'parameter'], snowflake: ['growth order', 'parameter'], kolam: ['weave crossing parameter', 'parameter'], vastu: ['center-zone hierarchy', 'parameter'], phyllotaxis: ['growth order', 'parameter'],
  };
  function currentWSemantics() { return W_SEMANTICS[state.preset] || ['model parameter', 'parameter']; }
  function intrinsicRank() {
    if (state.wMix * state.scales.w > 1e-4) return 4;
    if (state.zMix * state.scales.z > 1e-4) return 3;
    return 2;
  }
'''
app = once(app, '  const state = {', semantics + '\n  const state = {', 'W semantics')
app = once(app, "  function updateUI() {\n    const meta = PRESET_META[state.preset] || PRESET_META.square;",
'''  function updateUI() {
    const meta = PRESET_META[state.preset] || PRESET_META.square;
    syncProjectionControls();
    const [wLabel, wKind] = currentWSemantics();
    if (wMeaning) {
      wMeaning.textContent = wLabel;
      wMeaning.dataset.kind = wKind;
      wMeaning.title = wKind === 'spatial' ? 'W is an actual fourth spatial extrusion coordinate for this family.' : 'W is an explicit mathematical parameter embedded as a fourth coordinate; it is not claimed to be a physical fourth spatial direction.';
    }
    if (dimensionRank) dimensionRank.textContent = 'intrinsic rank ' + intrinsicRank() + 'D';
    if (viewWExtent) {
      if (state.wMix > 0.001) { const bounds = transformedWBounds(); viewWExtent.textContent = 'view W span ' + (bounds.max - bounds.min).toFixed(2); }
      else viewWExtent.textContent = '';
    }
    wDepthLegend?.classList.toggle('is-active', Boolean(state.wDepthColor));''', 'semantic UI sync')
app = once(app, "        dimensionStatus.textContent =\n          meta.kind === 'architecture'\n            ? '4D architectural projection'\n            : '4D geometric hyperform';",
'''        const [, wKind] = currentWSemantics();
        dimensionStatus.textContent = wKind === 'spatial' ? '4D spatial hyperprism' : '4D parameter embedding';''', 'dimension status')

styles += '''

/* Geometry/projection cognition audit UI */
.hyper4d-tools{display:grid;gap:7px;margin:9px 0 10px}.hyper4d-two{grid-template-columns:repeat(2,minmax(0,1fr))}.hyper4d-wide{width:100%}.hyper4d-cell-nav{display:grid;grid-template-columns:34px minmax(0,1fr) 34px;gap:5px;align-items:stretch}.hyper4d-cell-nav output{display:flex;align-items:center;justify-content:center;min-width:0;padding:5px 6px;border:1px solid rgba(255,255,255,.12);border-radius:6px;color:rgba(242,238,229,.82);font-size:10px;line-height:1.2;text-align:center}.hyper4d-cell-nav.is-disabled,.hyper4d-tools .is-disabled{opacity:.42}.hyper4d-explanation,.rotation-order-note{margin:2px 0;color:rgba(238,239,242,.48);font-size:9px;line-height:1.35}.w-depth-legend{display:none;grid-template-columns:auto 1fr auto 1fr auto;gap:5px;align-items:center;color:rgba(238,239,242,.62);font-size:9px}.w-depth-legend.is-active{display:grid}.w-depth-legend i{height:4px;border-radius:999px}.w-depth-legend i:first-of-type{background:linear-gradient(90deg,#6ca8ff,#e7ddc6)}.w-depth-legend i:last-of-type{background:linear-gradient(90deg,#e7ddc6,#f0c45c)}.w-semantics-readout{position:fixed;left:24px;top:126px;z-index:5;display:grid;gap:1px;max-width:210px;pointer-events:none;color:rgba(242,238,229,.64);font-size:9px;line-height:1.25}.w-semantics-readout__label{text-transform:uppercase;letter-spacing:.08em;opacity:.6}.w-semantics-readout strong{color:rgba(246,242,232,.9);font-size:11px;font-weight:600}.w-semantics-readout strong[data-kind="parameter"]::after{content:' · parameter embedding';color:rgba(240,196,92,.72);font-size:8px;font-weight:500}@media(max-width:760px){.w-semantics-readout{left:12px;top:104px;max-width:170px;font-size:8px}.w-semantics-readout strong{font-size:10px}}
'''

tutorial = re.sub(r"\n    if \(sectionSpaceControl && !document\.querySelector\('\.hyper4d-explanation'\)\) \{[\s\S]*?\n    \}\n", '\n', tutorial, count=1)

readme = readme.replace('G₃ × [-w,w]', 'G₃ × [-w/2,+w/2]')
readme = readme.replace('one common centered W interval', 'one common W interval centered at W=0')
old = '''Three projection modes are available:

- **Perspective** — a virtual 4D camera sits along W; geometry farther away in W projects smaller.
- **Orthographic** — W is flattened without perspective scaling while the 3D camera remains perspective.
- **Isometric** — W is orthographically flattened and the 3D result uses a true 3D isometric camera (45° yaw, 35.264° pitch) with orthographic screen projection, so X/Y/Z have equal foreshortening.'''
new = '''Projection is explicitly split into two independent stages:

- **4D → 3D:** W perspective uses a central 4D camera on +W; W orthographic forgets W without perspective scaling.
- **3D → 2D:** the ordinary camera independently uses perspective or orthographic screen projection.
- **Isometric orientation** is a camera-orientation preset (45° yaw, 35.264° pitch), not a fourth projection type. With 3D orthographic projection it gives equal X/Y/Z foreshortening.

This separation lets W-perspective be inspected without ordinary Z-perspective, or vice versa.'''
readme = readme.replace(old, new)
readme = readme.replace('**Dimension stretch**', '**Intrinsic dimension stretch**')
readme = readme.replace('exact 2D geometric plans', 'geometric 2D plans')
readme += '''

## Fourth-coordinate semantics

The interface continuously labels the meaning of **W**. The symmetric free-geometric families use W as a genuine spatial hyperprism extrusion. Reference, physical, natural and architectural families may instead use W as an explicitly named mathematical parameter (for example path progress, standing-wave quadrature or growth order). A parameter embedding is a legitimate four-coordinate model, but it is not presented as evidence that the encoded quantity is literally a fourth spatial direction. The UI also reports intrinsic rank and current post-rotation W span.

Plane rotations are composed in the listed order **XW → YW → ZW → XY → XZ → YZ**. Rotations in different planes generally do not commute; simultaneous autorotation is continuous composition in this fixed order.
'''

headers = headers.replace('/4d-tools-fix.js\n  Cache-Control: no-store, no-cache, max-age=0, must-revalidate\n\n', '')

write('public/app.js', app); write('public/index.html', index); write('public/styles.css', styles); write('README.md', readme); write('public/tutorial-descriptions.js', tutorial); write('public/_headers', headers)
print('Applied projection/cognition audit fixes.')

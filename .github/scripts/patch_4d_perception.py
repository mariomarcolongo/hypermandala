from pathlib import Path


def replace_exact(path, old, new, count=1):
    p = Path(path)
    text = p.read_text()
    actual = text.count(old)
    if actual != count:
        raise SystemExit(
            f"{path}: expected {count} occurrence(s), found {actual}: {old[:100]!r}"
        )
    p.write_text(text.replace(old, new, count))


# app.js: add an explicit X-ray inspection renderer without changing the
# opaque Solid default. Transparent triangles are sorted back-to-front and do
# not write the depth buffer, so hidden projected layers remain inspectable.
replace_exact(
    "public/app.js",
    "if (['wire', 'solid', 'solid-edges'].includes(saved.renderMode)) {",
    "if (['wire', 'solid', 'solid-edges', 'xray'].includes(saved.renderMode)) {",
)
replace_exact(
    "public/app.js",
    "if (!['wire','solid','solid-edges'].includes(mode)) return;",
    "if (!['wire','solid','solid-edges','xray'].includes(mode)) return;",
)
replace_exact(
    "public/app.js",
    "  function drawSolidLayer(alpha) {\n    if (!solidRenderer || !gl) return false;\n\n    if (state.renderMode === 'wire' || alpha <= 0.001) {",
    "  function drawSolidLayer(alpha) {\n    if (!solidRenderer || !gl) return false;\n\n    const xray = state.renderMode === 'xray';\n\n    if (state.renderMode === 'wire' || alpha <= 0.001) {",
)
replace_exact(
    "public/app.js",
    "    const faceData = [];\n\n    for (const entry of entries) {",
    "    const faceData = [];\n    const transparentTriangles = [];\n\n    for (const entry of entries) {",
)
replace_exact(
    "public/app.js",
    """      for (let i = 1; i < points.length - 1; i += 1) {
        const tri = [points[0], points[i], points[i + 1]];

        for (const p of tri) {
          const x = (p.x / state.width) * 2 - 1;
          const y = 1 - (p.y / state.height) * 2;
          const z = clamp(-p.depth / 4.5, -0.98, 0.98);

          faceData.push(
            x, y, z,
            rgb.r / 255,
            rgb.g / 255,
            rgb.b / 255,
            clamp(alpha * entry.visibility, 0, 1),
          );
        }
      }
    }

    gl.viewport(0, 0, solidCanvas.width, solidCanvas.height);""",
    """      for (let i = 1; i < points.length - 1; i += 1) {
        const tri = [points[0], points[i], points[i + 1]];
        const triData = [];

        for (const p of tri) {
          const x = (p.x / state.width) * 2 - 1;
          const y = 1 - (p.y / state.height) * 2;
          const z = clamp(-p.depth / 4.5, -0.98, 0.98);

          triData.push(
            x, y, z,
            rgb.r / 255,
            rgb.g / 255,
            rgb.b / 255,
            clamp(alpha * entry.visibility, 0, 1),
          );
        }

        if (xray) {
          transparentTriangles.push({
            depth: tri.reduce((sum, p) => sum + p.depth, 0) / 3,
            data: triData,
          });
        } else {
          faceData.push(...triData);
        }
      }
    }

    if (xray) {
      // Canvas fallback already painter-sorts faces. Mirror that ordering for
      // WebGL so alpha compositing remains stable while all layers stay visible.
      transparentTriangles.sort((a, b) => a.depth - b.depth);
      for (const triangle of transparentTriangles) {
        faceData.push(...triangle.data);
      }
    }

    gl.viewport(0, 0, solidCanvas.width, solidCanvas.height);""",
)
replace_exact(
    "public/app.js",
    """    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
    gl.depthMask(true);

    if (alpha < 0.999) {
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    } else {
      gl.disable(gl.BLEND);
    }
    gl.disable(gl.CULL_FACE);
    gl.drawArrays(gl.TRIANGLES, 0, faceData.length / 7);
    gl.disable(gl.BLEND);""",
    """    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
    gl.depthMask(true);

    const translucent = xray || alpha < 0.999;
    if (translucent) {
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
      gl.depthMask(false);
      if (xray) gl.disable(gl.DEPTH_TEST);
    } else {
      gl.disable(gl.BLEND);
    }
    gl.disable(gl.CULL_FACE);
    gl.drawArrays(gl.TRIANGLES, 0, faceData.length / 7);

    if (xray) gl.enable(gl.DEPTH_TEST);
    gl.depthMask(true);
    gl.disable(gl.BLEND);""",
)
replace_exact(
    "public/app.js",
    "    const solidHandled = drawSolidLayer(1);\n    if (!solidHandled) drawFaces(1);",
    "    const fillAlpha = state.renderMode === 'xray' ? 0.18 : 1;\n    const solidHandled = drawSolidLayer(fillAlpha);\n    if (!solidHandled) drawFaces(fillAlpha);",
)


# index.html: keep the established Projection and Rendering UX, expose exact
# W-section tools in a collapsed disclosure, and add X-ray as a secondary action.
old_insight = """    <section class="control-section insight-section">
      <div class="control-section__head">
        <span class="control-section__label">4D insight</span>
        <span class="control-section__note">exact diagnostic views</span>
      </div>
      <div class="segmented insight-modes" id="insightControl">
        <button type="button" data-insight="standard" class="is-active">Standard</button>
        <button type="button" data-insight="w-color" title="Color filled geometry by transformed W coordinate">W color</button>
        <button type="button" data-insight="w-slice" title="Show one exact intrinsic-W 3D layer of the hypersolid">W slice</button>
        <button type="button" data-insight="w-layers" title="Show several intrinsic-W 3D layers simultaneously">W layers</button>
        <button type="button" data-insight="compare" title="Show the intrinsic 3D reference beside the 4D projection">3D ref</button>
      </div>
      <div class="insight-range" id="wSliceControl">
        <span>W layer</span>
        <input id="wSliceInput" type="range" min="0" max="1" step="0.01" value="0.5" aria-label="Intrinsic W layer position" />
        <output id="wSliceValue">50%</output>
      </div>
      <div class="insight-actions">
        <button id="replay4D" type="button" title="Replay the 3D to 4D dimensional construction">Replay 3D → 4D</button>
      </div>
      <p class="insight-note">
        W slice/layers follow the intrinsic extrusion parameter. They are exact
        3D subspaces of the product construction, not screen-space clipping.
      </p>
    </section>"""
new_insight = """    <details class="control-section insight-section perception-details">
      <summary class="perception-summary">
        <span class="control-section__label">4D inspection</span>
        <span class="control-section__note">optional · exact W sections</span>
      </summary>
      <div class="perception-body">
        <div class="segmented segmented--three insight-modes" id="insightControl">
          <button type="button" data-insight="standard" class="is-active">Standard</button>
          <button type="button" data-insight="w-slice" title="Show one exact intrinsic-W 3D section of the hypersolid">W slice</button>
          <button type="button" data-insight="w-layers" title="Show several exact intrinsic-W 3D sections simultaneously">W layers</button>
        </div>
        <div class="insight-range" id="wSliceControl">
          <span>W section</span>
          <input id="wSliceInput" type="range" min="0" max="1" step="0.01" value="0.5" aria-label="Intrinsic W section position" />
          <output id="wSliceValue">50%</output>
        </div>
        <div class="insight-actions">
          <button id="replay4D" type="button" title="Replay the exact 3D to 4D construction">Replay 3D → 4D</button>
        </div>
        <p class="insight-note">
          W slice/layers are exact 3D sections of the intrinsic 4D construction.
          X-ray is only an inspection aid; it is not claimed as literal 4D vision.
        </p>
      </div>
    </details>"""
replace_exact("public/index.html", old_insight, new_insight)

old_render = """      <div class="segmented segmented--three" id="renderControl">
        <button type="button" data-render="solid" class="is-active">Solid</button>
        <button type="button" data-render="solid-edges" title="Solid faces with visible black contours plus the full structural wireframe">Solid + wireframe</button>
        <button type="button" data-render="wire">Wire</button>
      </div>"""
new_render = """      <div class="segmented segmented--three" id="renderControl">
        <button type="button" data-render="solid" class="is-active">Solid</button>
        <button type="button" data-render="solid-edges" title="Solid faces with visible black contours plus the full structural wireframe">Solid + wireframe</button>
        <button type="button" data-render="wire">Wire</button>
      </div>
      <button
        type="button"
        class="inspection-toggle"
        data-render="xray"
        title="Inspection mode: alpha-composite projected layers without depth occlusion. Not a literal simulation of 4D eyesight."
      >X-ray inspection</button>"""
replace_exact("public/index.html", old_render, new_render)


# ui-fixes.js: preserve the compact inspection disclosure and only retire saved
# legacy modes whose controls are intentionally absent.
old_retire = """  function retireInsightUi() {
    /*
     * The old "4D insight" block exposed several research/diagnostic modes
     * directly in the main control panel. They add a lot of visual and verbal
     * complexity, and some are not yet robust enough to be primary UX.
     *
     * Keep the underlying experimental renderer code available for future work,
     * but remove these controls from the public interface for now. The core 4D
     * experience remains available through projection, rotation planes and
     * dimension stretch.
     */
    document.querySelector('.insight-section')?.remove();

    const explorer = document.getElementById('explorerControls');
    explorer?.setAttribute('aria-label', 'Explorer controls');

    // Do not let an old saved diagnostic mode stay active invisibly after the
    // controls are removed. Reset persisted state before app.js restores it.
    try {
      const saved = JSON.parse(localStorage.getItem(SETTINGS_KEY) || 'null');
      if (!saved || typeof saved !== 'object') return;

      let changed = false;
      if (saved.insightMode !== 'standard') {
        saved.insightMode = 'standard';
        changed = true;
      }
      if (saved.wSlice !== 0.5) {
        saved.wSlice = 0.5;
        changed = true;
      }

      if (changed) {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(saved));
      }
    } catch {
      // Storage may be unavailable in private/restricted contexts.
    }
  }"""
new_retire = """  function retireInsightUi() {
    /*
     * Keep 4D inspection available without returning to the old crowded
     * research panel. The public UI now exposes only exact W sections/layers
     * in a collapsed disclosure. Legacy W-color/reference modes remain internal
     * and must not be restored invisibly when their buttons are absent.
     */
    const explorer = document.getElementById('explorerControls');
    explorer?.setAttribute('aria-label', '4D explorer controls');

    try {
      const saved = JSON.parse(localStorage.getItem(SETTINGS_KEY) || 'null');
      if (!saved || typeof saved !== 'object') return;

      const visibleModes = new Set(['standard', 'w-slice', 'w-layers']);
      if (!visibleModes.has(saved.insightMode)) {
        saved.insightMode = 'standard';
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(saved));
      }
    } catch {
      // Storage may be unavailable in private/restricted contexts.
    }
  }"""
replace_exact("public/ui-fixes.js", old_retire, new_retire)


# styles.css: keep the disclosure visually quiet and secondary.
styles = Path("public/styles.css")
css = styles.read_text()
marker = "\n/* 4D perception controls: intentionally compact and secondary. */\n"
if marker not in css:
    css += marker + r"""
.perception-details {
  padding-block: 0;
}

.perception-summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 12px 0;
  cursor: pointer;
  list-style: none;
}

.perception-summary::-webkit-details-marker {
  display: none;
}

.perception-summary::after {
  content: '⌄';
  color: rgba(238,239,242,.38);
  font-size: 12px;
  transition: transform 160ms ease;
}

.perception-details[open] .perception-summary::after {
  transform: rotate(180deg);
}

.perception-body {
  padding: 0 0 12px;
}

.inspection-toggle {
  width: 100%;
  margin-top: 7px;
  padding: 7px 10px;
  border: 1px solid rgba(238,239,242,.10);
  border-radius: 9px;
  background: rgba(238,239,242,.025);
  color: rgba(238,239,242,.52);
  font: inherit;
  font-size: 11px;
  cursor: pointer;
}

.inspection-toggle:hover {
  border-color: rgba(240,196,92,.28);
  color: rgba(238,239,242,.76);
}

.inspection-toggle.is-active {
  border-color: rgba(240,196,92,.42);
  background: rgba(240,196,92,.08);
  color: #f0c45c;
}

@media (max-width: 760px) {
  .perception-summary {
    padding-block: 11px;
  }
}
"""
    styles.write_text(css)


# README: state the semantics precisely.
replace_exact(
    "README.md",
    """- **Solid** — the default; opaque colored faces with only the **visible** geometric edges drawn in black, matching the outlined 2D representation.
- **Solid + wireframe** — the same visible black edges plus the full structural edge overlay, including additional construction lines.
- **Wire** — structural edges only. The edges remain fully opaque once a dimension has emerged, while new Z/W edges still fade in during dimensional transitions.""",
    """- **Solid** — the default; opaque projected surfaces with only the **visible** geometric edges drawn in black, matching the outlined 2D representation. This is the normal material view and remains unchanged.
- **Solid + wireframe** — the same visible black edges plus the full structural edge overlay, including additional construction lines.
- **Wire** — structural edges only. The edges remain fully opaque once a dimension has emerged, while new Z/W edges still fade in during dimensional transitions.
- **X-ray inspection** — optional translucent inspection of projected layers. Transparent triangles are composited back-to-front without depth writes so hidden projected layers remain visible. This is an explanatory tool, **not** a claim that a 4D observer sees through opaque 4D matter.

The collapsed **4D inspection** disclosure exposes exact intrinsic-W sections and several simultaneous W layers. These are 3D sections of the actual 4D construction, not screen-space clipping. A hypothetical 4D observer would have a 3D retinal image: a visible 3D boundary cell can therefore be perceived volumetrically, while other 3D boundary cells may still occlude it. Hypermandala's ordinary screen render remains a 2D visualization of the projected geometry rather than a literal simulation of such a retina.""",
)


# Static invariants for the patch.
app = Path("public/app.js").read_text()
html = Path("public/index.html").read_text()
fixes = Path("public/ui-fixes.js").read_text()
assert 'data-render="xray"' in html
assert "state.renderMode === 'xray'" in app
assert "transparentTriangles.sort" in app
assert "document.querySelector('.insight-section')?.remove()" not in fixes
assert 'data-insight="w-color"' not in html
assert 'data-insight="compare"' not in html

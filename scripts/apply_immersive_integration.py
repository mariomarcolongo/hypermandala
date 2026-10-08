#!/usr/bin/env python3
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def replace_once(text: str, old: str, new: str, label: str) -> str:
    count = text.count(old)
    if count != 1:
        raise RuntimeError(f"{label}: expected exactly one match, found {count}")
    return text.replace(old, new, 1)


def patch_app() -> None:
    path = ROOT / "public/app.js"
    text = path.read_text()

    text = replace_once(
        text,
        "    square: ['spatial extrusion', 'spatial'], sriyantra: ['spatial extrusion', 'spatial'], kaliyantra: ['spatial extrusion', 'spatial'], matangiyantra: ['spatial extrusion', 'spatial'], hex: ['spatial extrusion', 'spatial'],",
        "    square: ['centered spatial hyperprism · W↔−W mirror', 'spatial'], sriyantra: ['centered spatial hyperprism · W↔−W mirror', 'spatial'], kaliyantra: ['centered spatial hyperprism · W↔−W mirror', 'spatial'], matangiyantra: ['centered spatial hyperprism · W↔−W mirror', 'spatial'], hex: ['centered spatial hyperprism · W↔−W mirror', 'spatial'],",
        "spatial W semantics",
    )

    text = replace_once(
        text,
        "    cameraYaw: -0.62,\n    cameraPitch: 0.58,\n    zoom: 1,",
        "    cameraYaw: -0.62,\n    cameraPitch: 0.58,\n    zoom: 1,\n    // Observation-only offsets used by motion parallax. They are deliberately\n    // excluded from persistence and from the intrinsic 4D transform.\n    perceptionYaw: 0,\n    perceptionPitch: 0,",
        "perception camera state",
    )

    text = replace_once(
        text,
        "    const yaw = (\n      isometric ? -Math.PI / 4 : state.cameraYaw\n    ) * viewMix;",
        "    const yaw = (\n      (isometric ? -Math.PI / 4 : state.cameraYaw)\n      + state.perceptionYaw\n    ) * viewMix;",
        "camera yaw offset",
    )
    text = replace_once(
        text,
        "    const pitch = (\n      isometric\n        ? Math.atan(1 / Math.sqrt(2))\n        : state.cameraPitch\n    ) * viewMix;",
        "    const pitch = (\n      (isometric\n        ? Math.atan(1 / Math.sqrt(2))\n        : state.cameraPitch)\n      + state.perceptionPitch\n    ) * viewMix;",
        "camera pitch offset",
    )

    text = replace_once(
        text,
        "    state.cameraYaw = -0.62;\n    state.cameraPitch = 0.58;\n    state.zoom = 1;",
        "    state.cameraYaw = -0.62;\n    state.cameraPitch = 0.58;\n    state.zoom = 1;\n    state.perceptionYaw = 0;\n    state.perceptionPitch = 0;",
        "reset perception offsets",
    )

    old_debug = """  window.__hypermandalaDebug = Object.freeze({
    validateCurrentGeometry,
    currentWSemantics: () => [...currentWSemantics()],
    projectionState: () => ({projection4D:state.projection,projection3D:state.screenProjection,isometricView:state.isometricView}),
  });
})();
"""

    new_debug = """  function rotationOnly4D(source) {
    const p = [...source];
    for (const config of ROTATION_CONFIG) {
      rotatePlane(p, config.a, config.b, state.rotations[config.key] * RAD);
    }
    return p;
  }

  function determinant4(matrix) {
    const a = matrix.map((row) => [...row]);
    let determinant = 1;
    for (let column = 0; column < 4; column += 1) {
      let pivot = column;
      for (let row = column + 1; row < 4; row += 1) {
        if (Math.abs(a[row][column]) > Math.abs(a[pivot][column])) pivot = row;
      }
      if (Math.abs(a[pivot][column]) < 1e-14) return 0;
      if (pivot !== column) {
        [a[pivot], a[column]] = [a[column], a[pivot]];
        determinant *= -1;
      }
      const value = a[column][column];
      determinant *= value;
      for (let row = column + 1; row < 4; row += 1) {
        const factor = a[row][column] / value;
        for (let k = column + 1; k < 4; k += 1) {
          a[row][k] -= factor * a[column][k];
        }
      }
    }
    return determinant;
  }

  function validate4DTransform() {
    const basis = [
      [1,0,0,0], [0,1,0,0], [0,0,1,0], [0,0,0,1],
    ].map(rotationOnly4D);
    let maxMetricError = 0;
    for (let i = 0; i < 4; i += 1) {
      for (let j = 0; j < 4; j += 1) {
        const dot = basis[i].reduce((sum, value, axis) => (
          sum + value * basis[j][axis]
        ), 0);
        maxMetricError = Math.max(
          maxMetricError,
          Math.abs(dot - (i === j ? 1 : 0)),
        );
      }
    }
    // basis vectors are rows here; det(R^T) = det(R), so orientation is exact.
    const determinant = determinant4(basis);
    const determinantError = Math.abs(determinant - 1);
    const probe = [0.37, -0.21, 0.56, 0];
    const cameraW = 9;
    const factor = cameraW / (cameraW - probe[3]);
    const projected = [probe[0] * factor, probe[1] * factor, probe[2] * factor];
    const perspectivePlaneError = Math.hypot(
      projected[0] - probe[0],
      projected[1] - probe[1],
      projected[2] - probe[2],
    );
    return {
      maxMetricError,
      determinant,
      determinantError,
      perspectivePlaneError,
      ok: (
        maxMetricError < 1e-10
        && determinantError < 1e-10
        && perspectivePlaneError < 1e-12
      ),
    };
  }

  function symbolicCenterPoint() {
    const central = modules.filter((module) => isCentralRegion(module.regionId));
    const source = central.length ? central : modules;
    let count = 0;
    const sum = [0,0,0,0];
    for (const module of source) {
      for (const point of module.vertices) {
        for (let axis = 0; axis < 4; axis += 1) sum[axis] += point[axis];
        count += 1;
      }
    }
    if (!count) return [0,0,geometryStats.centerZ,geometryStats.centerW];
    return sum.map((value) => value / count);
  }

  function clonePublicModule(module) {
    return {
      regionId: module.regionId,
      vertices: module.vertices.map((point) => [...point]),
      edges: module.edges.map((edge) => ({ ...edge })),
      faces: module.faces.map((face) => ({ ...face, indices: [...face.indices] })),
      wProfile: module.wProfile ? { ...module.wProfile } : null,
    };
  }

  function publicSceneKey() {
    return [
      state.preset,
      state.complexity,
      state.spacingStyle,
      state.zLiftStyle,
      modules.length,
      surfaceModules.length,
    ].join('|');
  }

  function publicStateSnapshot() {
    return {
      preset: state.preset,
      complexity: state.complexity,
      spacingStyle: state.spacingStyle,
      zLiftStyle: state.zLiftStyle,
      dimension: state.dimension,
      transition: Boolean(state.transition),
      projection: state.projection,
      screenProjection: state.screenProjection,
      isometricView: state.isometricView,
      renderMode: state.renderMode,
      colorMode: state.colorMode,
      zoom: state.zoom,
      pointerDown: state.pointerDown,
      width: state.width,
      height: state.height,
      wSemantics: [...currentWSemantics()],
    };
  }

  function publicSceneSnapshot() {
    return {
      key: publicSceneKey(),
      state: publicStateSnapshot(),
      symbolicCenter: symbolicCenterPoint(),
      filledModules: activeFilledModules().map(clonePublicModule),
      structuralModules: modules.map(clonePublicModule),
    };
  }

  function setPerceptionCameraOffset(yaw, pitch) {
    state.perceptionYaw = clamp(Number(yaw) || 0, -0.16, 0.16);
    state.perceptionPitch = clamp(Number(pitch) || 0, -0.12, 0.12);
  }

  // Public read-only geometry bridge for immersive renderers. It exposes the
  // exact intrinsic mesh and the same transform/projection functions used by
  // the primary renderer, while keeping all mutation inside the core engine.
  window.HypermandalaAPI = Object.freeze({
    stateSnapshot: publicStateSnapshot,
    sceneSnapshot: publicSceneSnapshot,
    sceneKey: publicSceneKey,
    transformPoint4D: (point) => transform4D(point, true),
    projectPoint4DTo3D: (point) => project4Dto3D(transform4D(point, true)),
    projectPointToView3D: (point) => cameraTransform(project4Dto3D(transform4D(point, true))),
    projectTransformed4DTo3D: (point) => project4Dto3D(point),
    projectTransformed4DToView3D: (point) => cameraTransform(project4Dto3D(point)),
    projectTransformed4DToScreen,
    setPerceptionCameraOffset,
    regionRgb: (regionId, x = 0, y = 0) => ({ ...classicRegionRgb(regionId, x, y) }),
  });

  window.__hypermandalaDebug = Object.freeze({
    validateCurrentGeometry,
    validate4DTransform,
    currentWSemantics: () => [...currentWSemantics()],
    projectionState: () => ({projection4D:state.projection,projection3D:state.screenProjection,isometricView:state.isometricView}),
  });
})();
"""
    text = replace_once(text, old_debug, new_debug, "public API/debug bridge")
    path.write_text(text)


def patch_index() -> None:
    path = ROOT / "public/index.html"
    text = path.read_text()

    text = replace_once(
        text,
        '  <canvas id="solidLayer" aria-hidden="true"></canvas>\n  <canvas id="mandala" aria-label="Interactive 2D, 3D and 4D geometric form explorer"></canvas>',
        '  <canvas id="solidLayer" aria-hidden="true"></canvas>\n  <canvas id="mandala" aria-label="Interactive 2D, 3D and 4D geometric form explorer"></canvas>\n  <canvas id="perceptionOverlay" aria-hidden="true"></canvas>\n  <canvas id="xrCanvas" aria-hidden="true"></canvas>',
        "perception canvases",
    )

    tools_anchor = '          <div class="hyper4d-cell-nav" id="hypercellNav"><button id="hypercellPrev" type="button" aria-label="Previous 3D boundary cell">‹</button><output id="hypercellLabel" aria-live="polite">all cells</output><button id="hypercellNext" type="button" aria-label="Next 3D boundary cell">›</button></div>\n'
    immersive_tools = tools_anchor + '''          <div class="perception-tool-label">Immersive perception</div>\n          <div class="segmented hyper4d-two immersive-grid">\n            <button id="stereoToggle" type="button" aria-pressed="false" title="Render two off-axis eye views of the exact 4D→3D projection">Stereo pair</button>\n            <button id="motionParallaxToggle" type="button" aria-pressed="false" title="Move only the ordinary 3D camera with pointer or device orientation">Motion parallax</button>\n          </div>\n          <div class="segmented hyper4d-two immersive-grid">\n            <button id="trajectoryToggle" type="button" aria-pressed="false" title="Trace actual transformed 4D points, including the W↔−W mirror pair where present">4D trajectories</button>\n            <button id="stereoSwap" type="button" aria-pressed="false" disabled title="Swap left/right views for cross-eye stereoscopy">Swap eyes</button>\n          </div>\n          <button id="enterVr" class="inspection-toggle hyper4d-wide" type="button" disabled title="Use a compatible WebXR headset for true binocular head-tracked viewing">Enter immersive VR</button>\n          <div id="immersiveStatus" class="hyper4d-explanation immersive-status" aria-live="polite">Perception tools preserve intrinsic geometry.</div>\n'''
    text = replace_once(text, tools_anchor, immersive_tools, "immersive controls")

    about_anchor = """      <p>
        Higher-dimensional extensions are experimental mathematical visualizations.
        Where traditional 3D precedents exist, they inform the geometry without
        being presented as the only canonical interpretation.
      </p>
"""
    about_new = about_anchor + """      <p>
        Stereo, motion-parallax, trajectory and WebXR modes are observation tools only:
        they never deform the intrinsic 4D construction. Symmetric mandala and yantra
        families use a centered W↔−W spatial hyperprism, preserving the source center,
        adjacency, reflection balance and symbolic hierarchy through the fourth axis.
      </p>
"""
    text = replace_once(text, about_anchor, about_new, "about immersive statement")

    text = replace_once(
        text,
        "        await loadInlineScript('./app.js', '/app.js');\n        window.__hypermandalaInstallUiFixes?.();",
        "        await loadInlineScript('./app.js', '/app.js');\n        await loadInlineScript('./immersive.js', '/immersive.js');\n        window.__hypermandalaInstallUiFixes?.();",
        "fresh immersive loader",
    )

    old_fallback = """          const loadFallbackApp = () => {
            const app = document.createElement('script');
            app.src = './app.js?reload=' + Date.now();
            app.onload = () => window.__hypermandalaInstallUiFixes?.();
            document.body.appendChild(app);
          };
"""
    new_fallback = """          const loadFallbackApp = () => {
            const app = document.createElement('script');
            app.src = './app.js?reload=' + Date.now();
            app.onload = () => {
              const immersive = document.createElement('script');
              immersive.src = './immersive.js?reload=' + Date.now();
              immersive.onload = () => window.__hypermandalaInstallUiFixes?.();
              immersive.onerror = () => window.__hypermandalaInstallUiFixes?.();
              document.body.appendChild(immersive);
            };
            document.body.appendChild(app);
          };
"""
    text = replace_once(text, old_fallback, new_fallback, "fallback immersive loader")
    path.write_text(text)


def patch_styles() -> None:
    path = ROOT / "public/styles.css"
    text = path.read_text()
    marker = "\n/* Immersive 4D perception */\n"
    if marker in text:
        raise RuntimeError("immersive styles already present")
    text += marker + """#perceptionOverlay {
  position: fixed;
  inset: 0;
  width: 100%;
  height: 100%;
  z-index: 2;
  pointer-events: none;
  display: block;
}

#xrCanvas {
  display: none;
}

.immersive-grid {
  margin-top: 5px;
}

.immersive-status {
  margin-top: 7px;
  min-height: 2.2em;
  line-height: 1.35;
}

#enterVr:disabled,
#stereoSwap:disabled {
  opacity: .40;
  cursor: not-allowed;
}
"""
    path.write_text(text)


def patch_headers() -> None:
    path = ROOT / "public/_headers"
    text = path.read_text()
    if "/immersive.js" not in text:
        text += "\n/immersive.js\n  Cache-Control: no-store, no-cache, max-age=0, must-revalidate\n"
    path.write_text(text)


def patch_readme() -> None:
    path = ROOT / "README.md"
    text = path.read_text()

    old = """In 4D, W is used for relationships that Z cannot express cleanly. Complementary Sri/Matangi triangle polarities separate in opposite W directions through the intermediate hierarchy and converge again toward W=0 at the outer boundary and bindu. Kali's five downward triangles share one polarity rather than being assigned an artificial alternating sign. Square and Hex use hierarchy-dependent W extent without an invented polarity.
"""
    new = """In 4D, the symmetric mandala/yantra families are promoted as centered spatial hyperprisms: the complete finished 3D object is copied through one common interval `[-h/2,+h/2]` on W. This preserves every 3D adjacency and gives an exact W↔−W mirror symmetry without separating regions by color, deity association or polarity. XW/YW/ZW rotations then reveal this genuine fourth spatial coordinate while the bindu/center remains structurally privileged by the source hierarchy rather than by an invented W offset.
"""
    text = replace_once(text, old, new, "outdated W philosophy")

    semantics = """## Fourth-coordinate semantics

The interface continuously labels the meaning of **W**. The symmetric free-geometric families use W as a genuine spatial hyperprism extrusion. Reference, physical, natural and architectural families may instead use W as an explicitly named mathematical parameter (for example path progress, standing-wave quadrature or growth order). A parameter embedding is a legitimate four-coordinate model, but it is not presented as evidence that the encoded quantity is literally a fourth spatial direction. The UI also reports intrinsic rank and current post-rotation W span.
"""
    immersive = semantics + """
### Immersive perception without geometric distortion

Stereo, motion parallax, 4D point trajectories and WebXR are **view modes**, not new geometry. The intrinsic vertices, topology, region identity, W semantics and six-plane SO(4) rotation remain unchanged.

- **Stereo pair** uses parallel off-axis eye views with the mandala center on the zero-parallax fusion plane; eye swapping supports cross-eye viewing without toe-in distortion.
- **Motion parallax** perturbs only the ordinary 3D camera after the 4D→3D projection. Pointer motion works on desktop; compatible mobile browsers may use device orientation after explicit permission.
- **4D trajectories** record actual transformed four-coordinate points. Spatial hyperprisms trace the symbolic center plus an actual W−/W+ mirror pair when such a pair exists in the mesh.
- **Immersive VR** is progressive enhancement through WebXR. A headset supplies independent left/right eye view and projection matrices for the same exact 4D→3D geometry; unsupported browsers simply keep the normal explorer.

The goal is perceptual access to the hyperform while preserving mandala qualities—center, radial/axial balance, repetition, hierarchy, adjacency and symbolic region identity—rather than adding arbitrary psychedelic deformation. No claim is made that a historical tradition prescribed a uniquely canonical four-dimensional continuation.
"""
    text = replace_once(text, semantics, immersive, "immersive README section")

    controls_anchor = "- **Intrinsic dimension stretch** — manually scale X/Y/Z/W; 1 is normal and 0 collapses that coordinate.\n"
    controls_new = controls_anchor + "- **Immersive perception** — optional stereo pair, eye-order swap, motion parallax, exact 4D point trajectories and compatible-headset WebXR; these change observation only, not intrinsic geometry.\n"
    text = replace_once(text, controls_anchor, controls_new, "README controls")
    path.write_text(text)


def patch_math_tests() -> None:
    path = ROOT / "scripts/verify_math_rigor.py"
    text = path.read_text()

    insert_before = "\ndef check_exact_4d_perspective() -> None:\n"
    so4 = r'''
def determinant(matrix):
    a = [row[:] for row in matrix]
    result = 1.0
    for column in range(4):
        pivot = max(range(column, 4), key=lambda row: abs(a[row][column]))
        if abs(a[pivot][column]) < 1e-14:
            return 0.0
        if pivot != column:
            a[pivot], a[column] = a[column], a[pivot]
            result *= -1.0
        value = a[column][column]
        result *= value
        for row in range(column + 1, 4):
            factor = a[row][column] / value
            for k in range(column + 1, 4):
                a[row][k] -= factor * a[column][k]
    return result


def check_composed_so4_rotation() -> None:
    # Match the production order exactly: XW, YW, ZW, XY, XZ, YZ.
    config = [
        (0, 3, 0.37),
        (1, 3, -0.61),
        (2, 3, 0.29),
        (0, 1, 0.43),
        (0, 2, -0.52),
        (1, 2, 0.71),
    ]

    def composed(point):
        result = point[:]
        for a, b, angle in config:
            result = rotate_plane(result, a, b, angle)
        return result

    basis = [
        composed([1.0, 0.0, 0.0, 0.0]),
        composed([0.0, 1.0, 0.0, 0.0]),
        composed([0.0, 0.0, 1.0, 0.0]),
        composed([0.0, 0.0, 0.0, 1.0]),
    ]

    for i in range(4):
        for j in range(4):
            dot = sum(basis[i][k] * basis[j][k] for k in range(4))
            expected = 1.0 if i == j else 0.0
            assert_close(dot, expected, 1e-12, f"SO(4) Gram[{i},{j}]")

    assert_close(determinant(basis), 1.0, 1e-12, "SO(4) determinant")
'''
    text = replace_once(text, insert_before, so4 + insert_before, "SO(4) composed test")

    text = replace_once(
        text,
        '        "X-ray should not disable depth testing",\n    ]',
        '        "X-ray should not disable depth testing",\n        "function validate4DTransform()",\n        "window.HypermandalaAPI = Object.freeze",\n        "projectPoint4DTo3D",\n        "projectTransformed4DTo3D",\n        "perceptionYaw",\n    ]',
        "app source requirements",
    )

    text = replace_once(
        text,
        '    assert "Fourth-coordinate semantics" in readme\n',
        '    assert "Fourth-coordinate semantics" in readme\n    assert "Immersive perception without geometric distortion" in readme\n\n    immersive = (ROOT / "public/immersive.js").read_text()\n    for marker in [\n        "requestSession(\'immersive-vr\'",\n        "new XRWebGLLayer",\n        "DeviceOrientationEvent",\n        "projectPoint4DTo3D",\n        "projectTransformed4DTo3D",\n        "(viewPoint[0] - eye) * factor + eye",\n    ]:\n        assert marker in immersive, marker\n    for marker in [\n        \'id="stereoToggle"\',\n        \'id="motionParallaxToggle"\',\n        \'id="trajectoryToggle"\',\n        \'id="enterVr"\',\n        "./immersive.js",\n    ]:\n        assert marker in index, marker\n',
        "immersive source guards",
    )

    text = replace_once(
        text,
        "    check_plane_rotations_preserve_norm()\n    check_rotation_order_noncommutative()\n",
        "    check_plane_rotations_preserve_norm()\n    check_rotation_order_noncommutative()\n    check_composed_so4_rotation()\n",
        "math main composed test",
    )
    path.write_text(text)


def main() -> None:
    patch_app()
    patch_index()
    patch_styles()
    patch_headers()
    patch_readme()
    patch_math_tests()
    print("immersive integration patched")


if __name__ == "__main__":
    main()

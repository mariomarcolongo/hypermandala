from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
source = (ROOT / 'public' / 'immersive.js').read_text()

required = [
    "function fitXRProjectedPoints(points)",
    "function recenterXRFromPose(pose)",
    "uModel * vec4(aPosition, 1.0)",
    "const geometryInterval = perception.xrMobile",
    "perception.xrFramebufferScale <= 0.52 ? 50 : 33",
    "framebufferScaleFactor: perception.xrFramebufferScale",
    "perception.xrFramebufferScale = perception.xrMobile ? 0.68 : 0.90;",
    "powerPreference: 'high-performance'",
    "session.addEventListener('selectstart', onXRSelectStart);",
    "session.addEventListener('selectend', onXRSelectEnd);",
    "session.addEventListener('select', onXRSelect);",
    "function executeXRMenuAction(action)",
    "function drawXRMenu(gl, view)",
    "function updateXRAdaptiveQuality(time, session, gl)",
    "perception.xrRecenterPending = true;",
    "perception.xrTriangleBuffer",
    "perception.xrLineBuffer",
    "uploadXRGeometry(gl, perception.xrGeometry)",
    "xrFitProjectedPoints: (points) => fitXRProjectedPoints(points)",
    "xrRecenterForMatrix: (matrix) =>",
    "xrExecuteControl: (action) =>",
    "api.vrControls",
    "rot:${key}:-",
    "mode:w-slice",
    "frame:intrinsic",
    "toggle:hypercell",
    "render:solid-edges",
    "projection:orthographic",
    "screen:orthographic",
]

app_source = (ROOT / 'public' / 'app.js').read_text()
for marker in [
    "vrControls: Object.freeze({",
    "nudgeRotation: vrNudgeRotation",
    "nudgeWSlice: vrNudgeWSlice",
    "toggleAutorotation: vrToggleAutorotation",
    "toggleWDepth: vrToggleWDepth",
    "toggleHypercell: vrToggleHypercell",
    "stepHypercell: vrStepHypercell",
    "reset4D: vrReset4DControls",
    "rotations: { ...state.rotations }",
    "wSlice: state.wSlice",
]:
    assert marker in app_source, marker
for marker in required:
    assert marker in source, marker

# Removed performance/framing anti-patterns.
assert "function worldPointFromProjected3D" not in source
assert "perception.xrBuffer = gl.createBuffer()" not in source
assert "gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.DYNAMIC_DRAW)" not in source
assert "baseY = perception.xrUsesFloor" not in source

# Recenter orientation must copy the viewer's rotation as well as position.
for marker in [
    "model[0] = matrix[0]",
    "model[4] = matrix[4]",
    "model[8] = matrix[8]",
    "model[12] = matrix[12] + forwardX * distance",
]:
    assert marker in source, marker

print('Mobile XR runtime regression checks passed.')

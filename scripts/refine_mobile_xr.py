from pathlib import Path

path = Path(__file__).resolve().parents[1] / 'public' / 'immersive.js'
text = path.read_text()

old = """    const model = identityXRMatrix();
    model[12] = matrix[12] + forwardX * distance;
    model[13] = matrix[13] + forwardY * distance;
    model[14] = matrix[14] + forwardZ * distance;
"""
new = """    const model = identityXRMatrix();
    // Match the viewer orientation at recenter time so the mandala's local
    // screen plane is front-facing even in a floor/world reference space.
    model[0] = matrix[0]; model[1] = matrix[1]; model[2] = matrix[2];
    model[4] = matrix[4]; model[5] = matrix[5]; model[6] = matrix[6];
    model[8] = matrix[8]; model[9] = matrix[9]; model[10] = matrix[10];
    model[12] = matrix[12] + forwardX * distance;
    model[13] = matrix[13] + forwardY * distance;
    model[14] = matrix[14] + forwardZ * distance;
"""
assert old in text
text = text.replace(old, new, 1)

old = """    stereoProject: (viewPoint, eyeSign) => {
      const layout = stereoLayout(perception.swapped);
      return stereoProject(viewPoint, eyeSign, layout.leftViewport, currentState());
    },
  });
"""
new = """    stereoProject: (viewPoint, eyeSign) => {
      const layout = stereoLayout(perception.swapped);
      return stereoProject(viewPoint, eyeSign, layout.leftViewport, currentState());
    },
    xrFitProjectedPoints: (points) => fitXRProjectedPoints(points),
    xrRecenterForMatrix: (matrix) => {
      perception.xrRecenterPending = true;
      recenterXRFromPose({ transform: { matrix } });
      return perception.xrModelMatrix ? Array.from(perception.xrModelMatrix) : null;
    },
    xrRuntimeState: () => ({
      mobile: perception.xrMobile,
      framebufferScale: perception.xrFramebufferScale,
      geometryCached: Boolean(perception.xrGeometry),
      geometryKey: perception.xrGeometryKey,
      scale: perception.xrScale,
    }),
  });
"""
assert old in text
text = text.replace(old, new, 1)

path.write_text(text)
print('Refined mobile XR recenter orientation and debug hooks.')

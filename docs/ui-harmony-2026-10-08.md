# Explorer UI taxonomy

The Explorer groups controls by task rather than implementation origin:

- **4D → 3D projection**: projection along W.
- **3D → 2D camera**: ordinary camera projection and isometric orientation.
- **4D inspection**: sections, W-coordinate cues, boundary cells, trajectories and dimensional replay.
- **Rendering**: Solid, Solid + wireframe, Wire and X-ray are peer rendering modes.
- **Palette**: color interpretation.
- **Perception**: stereoscopic viewing, eye order, camera-only motion parallax and WebXR.
- **Rotation planes / intrinsic stretch**: geometric transforms.

Perception tools must not mutate intrinsic geometry. Stereo is intentionally unavailable with the orthographic 3D→2D camera because parallel orthographic eye views do not provide depth-dependent binocular disparity.

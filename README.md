# Hypermandala

**A geometric mandala that unfolds from 2D squares into 3D temple blocks and then into a true 4D projection.**

Hypermandala is a dependency-free Canvas visualization. Its interaction model is inspired by [Tarek Sherif's Tesseract Explorer](https://github.com/tsherif/tesseract-explorer): the 4D object is manipulated in 4D space, projected into 3D, and then viewed with an ordinary 3D camera.

No source code from Tesseract Explorer is required by Hypermandala; the implementation here is independent.

## Dimensional model

The same primitive architecture is used across all dimensions:

- **2D** — a mandala plan built from square cells and triangular roof lines.
- **3D** — the square cells extrude into cubes and the roof lines become square pyramids, forming a stepped temple.
- **4D** — every cube is extruded along W into a tesseract-like module, and every pyramid becomes a 4D prism.

The transition is automatic. There is no fractional-dimension slider:

```
square → cube → hypercube
2D       3D      4D
```

Going directly from 2D to 4D automatically passes through 3D, and vice versa.

## 4D exploration

Hypermandala supports rotations in all six coordinate planes:

- **XY**
- **XZ**
- **YZ**
- **XW**
- **YW**
- **ZW**

The XW/YW/ZW rotations are the ones that most directly reveal the fourth coordinate.

Each rotation plane also has an **A** button for autorotation.

The small **projected basis** gizmo shows how the X, Y, Z, and W basis directions appear after the current 4D rotation and projection.

## Projection

Two 4D → 3D projection modes are available:

- **Perspective** — a virtual 4D camera sits along W; geometry farther away in W projects smaller.
- **Orthographic** — W is flattened without perspective scaling.

After the 4D → 3D projection, mouse drag orbits an ordinary 3D camera and the wheel zooms.

## Axis scale

X, Y, Z, and W can be scaled independently. This is especially useful for understanding the dimensional construction:

- reducing **Z** collapses the temple toward its 2D square plan;
- reducing **W** collapses each tesseract-like module toward its 3D cube.

The 2D / 3D / 4D buttons perform these dimensional changes automatically.

## Geometry

The temple is deliberately made from a small vocabulary of simple primitives:

- axis-aligned squares;
- cubes;
- square pyramids;
- 4D prisms / tesseract-like cube extrusions.

The base plan uses a symmetric diamond arrangement of square cells with four cardinal extensions. Higher levels use progressively fewer cubes, ending in a central pyramidal roof.

This is intentionally much simpler than the previous procedural mandala so the 4D structure remains readable.

## Color

- **Form** — mostly neutral geometry, with W edges highlighted.
- **Axis** — X red, Y green, Z blue, W gold.

## Controls

- **2D / 3D / 4D** — automatic dimensional transitions.
- **Drag** — rotate the 2D plan or orbit the 3D projection.
- **Wheel / trackpad** — zoom.
- **Rotation planes** — rotate the object in 4D.
- **A** — autorotate an individual plane.
- **Axis scale** — scale X/Y/Z/W.
- **Projection** — perspective or orthographic.
- **Color** — form or axis.
- **Reset** — restore rotations, scale, camera, projection, and color.

Keyboard: `2`, `3`, `4` switch dimensions; `R` resets.

## Run locally

No install or build step is required.

```bash
python3 -m http.server 8080 -d public
```

Then open `http://localhost:8080`.

## Deploy

### Cloudflare Pages

- Production branch: `main`
- Framework preset: none
- Build command: leave blank (or use `exit 0`)
- Build output directory: `public`

### GitHub Pages

The workflow at `.github/workflows/pages.yml` publishes `public` once GitHub Pages is enabled for the repository and configured to use GitHub Actions.

## License

GNU Affero General Public License v3.0 or later. See [`LICENSE`](./LICENSE).

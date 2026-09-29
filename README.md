# Hypermandala

**A geometric mandala that unfolds from 2D squares into 3D temple blocks and then into a true 4D projection.**

Hypermandala is a dependency-free Canvas visualization. Its interaction model is inspired by [Tarek Sherif's Tesseract Explorer](https://github.com/tsherif/tesseract-explorer): the 4D object is manipulated in 4D space, projected into 3D, and then viewed with an ordinary 3D camera.

No source code from Tesseract Explorer is required by Hypermandala; the implementation here is independent.

## Dimensional model

Hypermandala now distinguishes the mathematical dimensional form from the architectural interpretation.

### Symmetric form — default

The default obeys a collapse / expansion rule:

- **2D** — only X/Y are expressed. Geometry that exists at +Z and -Z collapses onto the same plan.
- **3D** — latent ±Z structure separates symmetrically. The default form is therefore not an upward-only temple.
- **4D** — every 3D primitive has a symmetric ±W extrusion. When W is collapsed, its two sides coincide with the 3D object; when W expands, the hidden 4D structure separates.

This allows higher-dimensional geometry to emerge during dimensional expansion even when its lower-dimensional collapse looks simple.

The generators are constructed around the expected rotational symmetry of each mandala family and symmetric ±Z / ±W dimensional expansion in the default form.

### Temple form — optional

**Temple** is an explicit 3D-form option. It keeps the same mandala plan and 4D W extrusion, but intentionally gives Z a preferred upward direction to create a stepped architectural interpretation.

The transition is automatic and deliberately staged so the higher dimension can be seen emerging from the lower one. During 2D → 3D the plan remains visible while Z separates before the camera tilts; during 3D → 4D the original 3D structure remains the anchor while the opposite W copy and W-connected geometry emerge. There is no fractional-dimension slider:

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

## Mandala families

Hypermandala now has multiple geometry generators. Every family uses the same dimensional engine and the same six-plane 4D rotations.

### Square Temple

The original architectural family:

- square cells in 2D;
- cubes and square pyramids in 3D;
- tesseract-like cube extrusions and 4D pyramid prisms in 4D.

Its plan uses a symmetric diamond arrangement with four cardinal extensions and a stepped central shrine.

### Triangle Yantra

A more classical yantra-inspired family built from alternating upward/downward equilateral triangles:

- nested triangular plans;
- triangular prisms and triangular pyramids in 3D;
- those prisms extruded through W in 4D.

The complex version adds denser nested triangles, an outer ring of triangular modules, and six elevated satellite peaks.

### Hexagonal Mandala

A sixfold family built from concentric and satellite hexagons:

- hexagonal rings in 2D;
- stepped hexagonal prisms and pyramids in 3D;
- W-extruded hexagonal 4D prisms.

The complex version adds a twelve-module outer ring and six elevated satellite shrines.

### Complexity

Each family has **Simple** and **Complex** variants. Complexity changes the generated geometry itself rather than merely adding decoration, so the extra structure participates in 3D and 4D transformations.

The primitive vocabulary deliberately remains limited—polygons, prisms, pyramids, cubes and their W-extrusions—so even the complex mandalas remain readable under 4D rotation.

## Rendering

Three render modes are available:

- **Wire** — structural edges only; this remains the default because it makes dimensional emergence easiest to follow.
- **Solid** — projected polygon faces without edge overlay.
- **Solid + edges** — opaque faces plus the structural wireframe.

The 4D prism construction explicitly generates its 2D boundary faces: the faces of the two W-separated 3D copies plus the W-connected faces between corresponding edges. After 4D → 3D and 3D → 2D projection, faces are depth-sorted so nearer faces cover farther faces.

In Form color mode all dimensions now use the same neutral solid material. This avoids false bands and patchwork colors from giving W faces a different material. Solid faces are opaque at the completed dimension, while the newly emerging W geometry can fade in during the transition.

The current Canvas renderer uses painter-style face sorting rather than a per-pixel depth buffer. It handles ordinary occlusion well, but intersecting projected faces can still be imperfect in extreme views.

## Color

- **Form** — mostly neutral geometry, with W geometry warmer.
- **Axis** — X red, Y green, Z blue, W gold.

## Controls

- **Mandala dock** — choose Square, Yantra, or Hex using the compact library at lower left.
- **Persistent 2D previews** — all three mandala families are shown at the same time, using the current complexity setting, so the previews help you choose rather than only confirming the current choice.
- **Complexity** — choose Simple or Complex generated geometry.
- **3D form** — Symmetric by default, or Temple for an upward architectural interpretation.
- **Rendering** — Wire, Solid, or Solid + edges.
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


## Mandala construction rules

Every family is treated as a mandala in every dimension. The generators therefore prioritize a centered structure, radial or rotational organization, concentric / hierarchical relationships, and dimensional emergence from the same lower-dimensional plan.

The optional Temple form is an architectural interpretation of the same mandala. Temple primitives are placed as explicit supported levels: roofs begin on their supporting geometry, stack layers do not overlap, and elevated satellite roofs have supporting prisms instead of floating or penetrating nearby solids.

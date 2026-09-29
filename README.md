# Hypermandala

**A geometric mandala that unfolds from 2D squares into 3D temple blocks and then into a true 4D projection.**

Hypermandala is a dependency-free Canvas visualization. Its interaction model is inspired by [Tarek Sherif's Tesseract Explorer](https://github.com/tsherif/tesseract-explorer): the 4D object is manipulated in 4D space, projected into 3D, and then viewed with an ordinary 3D camera.

No source code from Tesseract Explorer is required by Hypermandala; the implementation here is independent.

## Dimensional model

Hypermandala now distinguishes the mathematical dimensional form from the architectural interpretation.

### Mandala lift — default

The default prioritizes exact dimensional continuity:

- **2D → 3D:** every non-zero XY edge of the 3D geometry is already an edge of the selected 2D mandala, and every 2D edge is represented by the collapsed 3D geometry.
- **3D → 4D:** each 3D primitive is extruded symmetrically through W, so W=0 collapses the 4D construction back onto the same 3D object.

The family-specific lift is therefore the default even when that means the object is not invariant under arbitrary permutations of X/Y/Z.

### Isotropic form — optional

**Isotropic** preserves the experimental signed-axis-permutation construction. It is useful for studying coordinate-isotropic 3D/4D symmetry, but for triangular and hexagonal families its lower-dimensional projection is not identical to the original 2D plan. It is therefore explicit rather than the default.

### Temple form — optional

**Temple** is an explicit architectural option. It keeps the richer cube/prism/pyramid vocabulary and intentionally gives Z a preferred upward direction. The collision-free isotropic cell-orbit construction applies to Symmetric mode, not Temple.

The transition is automatic and deliberately staged so the higher dimension can be seen emerging from the lower one. Seed cells are already present in the lower-dimensional plan; new 3D symmetry cells grow from points as Z opens, and new 4D orbit cells grow from their collapsed 3D locations as W opens. The camera waits until late in the 2D → 3D transition before tilting, so geometry emergence remains visually primary. There is no fractional-dimension slider:

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
- **Solid + edges** — opaque faces plus dark, non-transparent structural edges. The edges remain fully opaque once a dimension has emerged, while new Z/W edges still fade in during dimensional transitions.

The solid layer uses **WebGL2 with a real depth buffer**. Projected faces are triangulated and depth-tested per pixel rather than painter-sorted as whole polygons. Coincident shared faces are removed before rendering to prevent z-fighting.

Solid faces are now genuinely opaque in the GPU renderer: blending is disabled while depth writing is enabled. Higher-dimensional geometry emerges by changing its geometry/scale rather than by stacking depth-writing translucent faces. This removes the depth/alpha interaction that caused color popping and flashing.

Face colors are intrinsic to the face family/orientation and no longer brighten or darken according to camera depth. Axis labels are remapped when symmetry operations permute coordinate axes, so Axis coloring remains consistent after X/Y/Z/W swaps.

Wireframe and interaction overlays remain on the existing Canvas layer. If WebGL2 is unavailable, Hypermandala falls back to the older Canvas face renderer.

## Color

- **Form** — restrained neutral material.
- **Axis** — X red, Y green, Z blue, W gold.
- **Classic** — family-specific traditional or tradition-inspired rules rather than a generic rainbow.

### Square / palace family

Classic uses the common Tibetan Buddhist five-family directional scheme: **center white, east blue, south yellow, west red, north green**. The 2D screen follows the common painted orientation with east at the bottom, south at the left, west at the top, and north at the right.

References:
- Rubin Museum / Project Himalayan Art: https://rubinmuseum.org/projecthimalayanart/glossary/buddha-families/
- Rubin Museum, *The Mandala: A Guide to Transformation*: https://rubinmuseum.org/the-mandala-a-guide-to-transformation/

### Yantra family

Classic uses one documented Sri-Chakra-inspired sequence: red bindu, white central triangle, successive red/blue triangle circuits, and a yellow outer surround. Historical Sri Yantra color treatments vary, so this is one documented tradition-inspired scheme rather than a claim that there is one universal authentic palette.

Complex mode uses nine centered alternating triangles (four upward / five downward in the overall grammar), echoing the defining nine-triangle Sri Chakra structure. It is still an interactive geometric interpretation rather than a ritual-grade reconstruction.

### Hex family

Hex is a modern geometric mandala preset, not a canonical Tibetan or Sri Chakra form. Classic therefore borrows the Tibetan five-color directional vocabulary as a visual adaptation only.

Across Classic mode, face orientation changes **brightness**, not hue. This helps distinguish 3D/4D sides without overriding the family-specific color assignment.

## Controls

- **Mandala dock** — choose Square, Yantra, or Hex using the compact library at lower left.
- **Persistent 2D previews** — all three mandala families are shown at the same time, using the current complexity setting, so the previews help you choose rather than only confirming the current choice.
- **Complexity** — choose Simple or Complex generated geometry.
- **3D form** — **Mandala** by default for exact 2D→3D→4D correspondence; **Isotropic** for all-axis symmetry; **Temple** for an upward architectural interpretation.
- **Spacing** — **Compact** by default, where neighboring Z layers touch; **Separated** preserves the airy exploded-layer look.
- **Rendering** — Wire, Solid, or Solid + edges.
- **2D / 3D / 4D** — automatic dimensional transitions.
- **Drag** — rotate the 2D plan or orbit the 3D projection.
- **Wheel / trackpad** — zoom.
- **Rotation planes** — rotate the object in 4D.
- **A** — autorotate an individual plane.
- **Axis scale** — scale X/Y/Z/W.
- **Projection** — perspective or orthographic.
- **Color** — Form, Axis, or Classic Mandala.
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

The 2D mandala is generated independently from the 3D/4D primitive footprints. Higher-dimensional roofs, upper tiers, satellites, and W extrusions can no longer inject arbitrary lines into the 2D plan.

- **Square** uses exact touching square cells on one modular lattice, so shared boundaries coincide.
- **Yantra** uses only the centered alternating triangle field plus the bindu; decorative satellite triangles that spilled outside the field were removed.
- **Hex** uses concentric hexagons and satellite rings whose radii are chosen so they do not intersect the central structure or one another.

The higher-dimensional forms reuse those same measurements. Extra Z/W structure may be hidden by dimensional compression, but it should emerge from the mandala rather than retroactively changing its 2D geometry.

Temple remains an optional architectural interpretation. Its levels and roofs are separated and supported rather than overlapping or penetrating one another.


## 3D spacing

Spacing is a real geometric control again:

- **Compact** is the default. In Mandala mode, mirrored Z layers touch or nearly touch according to the actual primitive thicknesses.
- **Separated** moves those Z layers farther apart while leaving the XY footprint unchanged.
- In Isotropic mode, Separated expands the symmetry-orbit centers while retaining the same cell size, producing a visibly more exploded construction.
- Temple uses zero inter-level gap in Compact and explicit gaps in Separated.

The 2D mandala itself never changes when spacing changes.

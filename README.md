# Hypermandala

**Geometric 2D plans unfolding into their intrinsic 3D forms and 4D projections.**

Hypermandala is a dependency-free Canvas visualization. Its interaction model is inspired by [Tarek Sherif's Tesseract Explorer](https://github.com/tsherif/tesseract-explorer): the 4D object is manipulated in 4D space, projected into 3D, and then viewed with an ordinary 3D camera.

No source code from Tesseract Explorer is required by Hypermandala; the implementation here is independent.

## Dimensional model

Hypermandala no longer treats **Mandala** and **Temple** as interchangeable modes. Each family has one intrinsic 3D identity.

The common source is the **2D geometric plan**: a centered, hierarchical, radially or axially organized figure with mandala-like structure. The 2D view is not a disposable footprint; it is the geometric source of truth.

Families then divide naturally:

- **Symmetric forms** — Square, Yantra and Hex remain balanced through the added Z dimension. Their 3D construction is reflected through ±Z rather than forced into an architectural “up” direction.
- **Architecture** — Stupa and Borobudur rise in +Z because vertical hierarchy is intrinsic to the object itself.

In every case:

- **2D → 3D:** every non-zero XY edge in the 3D object must already exist in the 2D geometric plan, and every 2D plan edge must be represented by the collapsed 3D object.
- **3D → 4D:** the intrinsic 3D object is extruded symmetrically through W, so W=0 returns the same 3D object.

The project therefore preserves identity instead of manufacturing a second interpretation of every object.

Dimensional transitions remain staged:

```
geometric plan → intrinsic form → hyperform
2D            3D             4D
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

Three projection modes are available:

- **Perspective** — a virtual 4D camera sits along W; geometry farther away in W projects smaller.
- **Orthographic** — W is flattened without perspective scaling while the 3D camera remains perspective.
- **Isometric** — W is orthographically flattened and the 3D result uses a true isometric camera (45° yaw, 35.264° pitch) with orthographic screen projection, so X/Y/Z have equal foreshortening.

Mouse drag now rotates the object in the same spatial planes exposed by the controls: horizontal drag changes **XZ**, vertical drag changes **YZ**, and Shift-drag changes **XY**. The corresponding sliders update live. XW/YW/ZW remain explicit 4D rotations because an ordinary 2D drag does not uniquely specify a fourth-dimensional rotation. The wheel zooms.

## Dimension stretch

The former **Axis scale** control is now labeled **Dimension stretch**:

- **1.00** — normal size along that coordinate.
- **0.00** — fully collapse that coordinate.
- **>1.00** — exaggerate that coordinate to make its structure easier to inspect.
- **X / Y** — stretch or squash the original 2D mandala plane.
- **Z** — controls 3D depth; Z = 0 collapses the higher-dimensional form toward its 2D plan.
- **W** — controls fourth-dimensional extent; W = 0 collapses the 4D object onto its 3D form.

This is independent of the 2D / 3D / 4D buttons: the buttons perform the canonical dimensional transition, while Dimension stretch is a manual inspection tool.

## Geometric-form families

Hypermandala uses multiple geometry generators. Every family shares the same dimensional engine and six-plane 4D rotations, but its 3D geometry is determined by what the family actually represents.

### Square Mandala

A square/palace symmetric family:

- modular square cells and central guides in 2D;
- a balanced ±Z construction in 3D;
- the same region identities extruded through W in 4D.

Its plan uses a centered diamond arrangement with four cardinal extensions and a hierarchical central region.

### Triangle Yantra

A yantra-inspired symmetric family built from alternating upward/downward equilateral triangles:

- nested triangular circuits plus the central bindu;
- symmetric ±Z triangular-prism structure in 3D;
- the bindu becomes the culminating element at both Z extrema;
- the same region identities are extruded through W in 4D.

### Hexagonal Mandala

A sixfold symmetric family:

- concentric and satellite hexagons in 2D;
- symmetric stepped hexagonal structure through ±Z;
- the center becomes the culminating element at both Z extrema;
- the same regions are extruded through W in 4D.

The complex version adds a twelve-module outer ring while preserving exact dimensional identity.

### Stupa

An architectural family:

- nested square terraces transition into polygonal upper rings;
- the 2D plan is still centered, concentric and mandala-like;
- the 3D object rises upward because vertical hierarchy is intrinsic to a stupa;
- the central stupa footprint becomes the architectural crown;
- 4D is the W extrusion of that one intrinsic 3D form.

Its Classic palette uses warm earth, saffron, ivory and gold tones. It is a geometric stupa-inspired family rather than a reconstruction of one specific historic monument.

### Borobudur-inspired

A simplified architectural family based on Borobudur's recognizable concentric plan and stepped vertical hierarchy.

UNESCO describes Borobudur as five concentric square terraces, three circular platforms and a monumental central stupa, with 72 openwork stupas on the circular platforms:
https://whc.unesco.org/en/list/592

**Complex** preserves that 5 + 3 structure and uses the documented 32 + 24 + 16 distribution of satellite stupas (72 total). **Simple** reduces the count to keep interaction and 4D projection readable.

The model is explicitly **Borobudur-inspired**, not an archaeological reconstruction: reliefs, balustrades, openwork lattice detail and sculptural ornament are abstracted into clean geometric regions.

### Family design rule

A future preset should not be added merely because its 3D object is famous or visually attractive. Its 2D source should itself have strong mandala-like organization:

- a meaningful center;
- nested or concentric hierarchy;
- radial, rotational, reflective or axial order;
- repeated modules or directional structure;
- a clear relationship between center and periphery.

That is why architecture can belong in Hypermandala: the plan itself carries the geometric logic from which the 3D object grows.

### Complexity

Each family has **Simple** and **Complex** variants. “Simple” is relative: both versions must remain structurally meaningful geometric plans. Complexity changes the generated geometry itself rather than merely adding decoration, so the extra structure participates in 3D and 4D transformations.

## Rendering

Three render modes are available:

- **Solid** — the default; opaque colored faces with only the **visible** geometric edges drawn in black, matching the outlined 2D representation.
- **Solid + edges** — the same visible black edges plus the full structural edge overlay, including additional construction lines.
- **Wire** — structural edges only. The edges remain fully opaque once a dimension has emerged, while new Z/W edges still fade in during dimensional transitions.

The solid layer uses **WebGL2 with a real depth buffer**. Projected faces are triangulated and depth-tested per pixel rather than painter-sorted as whole polygons. Coincident shared faces are removed before rendering to prevent z-fighting.

After the face pass, Solid performs a second depth-tested pass for black edge contours. The edges are rendered as narrow screen-space quads with a tiny depth bias, so front-facing/silhouette structure remains crisp while hidden and back edges are rejected by the existing face depth buffer. This gives 2D, 3D and 4D the same visual grammar: **colored faces + visible black outlines**.

Solid faces are now genuinely opaque in the GPU renderer: blending is disabled while depth writing is enabled. Higher-dimensional geometry emerges by changing its geometry/scale rather than by stacking depth-writing translucent faces. This removes the depth/alpha interaction that caused color popping and flashing.

Face colors are intrinsic to the face family/orientation and no longer brighten or darken according to camera depth. Axis coloring remains tied to X/Y/Z/W orientation while Classic coloring remains tied to semantic plan regions.

Wireframe and interaction overlays remain on the existing Canvas layer. If WebGL2 is unavailable, Hypermandala falls back to the older Canvas face renderer.

## Color

- **Classic** — the default; semantic region colors remain the same across 2D, 3D and 4D.
- **Form** — restrained neutral material.
- **Axis** — X red, Y green, Z blue, W gold.

Classic no longer computes color independently from polygon overlap or camera position. Every 2D region and every 3D/4D primitive derived from it carries the same stable region ID. Higher-dimensional face orientation may change **brightness only**; it never changes the region's base hue.

### Square / palace family

Square uses the Tibetan-inspired five-direction vocabulary already used by Hypermandala: **center white, east blue, south yellow, west red, north green**. All cubes or higher-dimensional faces derived from a given square cell inherit that same base hue.

### Yantra family

Yantra colors are assigned by circuit:

- outer surround — saffron/yellow;
- successive triangle circuits — alternating blue and red families;
- innermost triangle — white;
- bindu — red.

The exact historical treatment of Sri Yantra colors varies, so this remains explicitly Sri-Chakra-inspired rather than a claim of one universal canonical palette.

### Hex family

Hex uses a native concentric palette rather than forcing a square directional system onto a sixfold figure:

- outer central ring — lapis/indigo;
- successive inward rings — teal, saffron, then vermilion where present;
- center — pale gold/ivory;
- first satellite ring — green/teal;
- complex outer satellite ring — crimson/violet.

Hex is a modern geometric mandala preset, so this is a deliberately coherent radial palette rather than a claim of historical liturgical rules.

### Stupa family

Classic uses warm earth and saffron for the lower terraces, lighter ivory tones toward the upper rings, and a gold central crown. This is a coherent stupa-inspired presentation rather than a claim of a universal traditional stupa palette.

### Borobudur-inspired family

Classic uses restrained volcanic-stone / warm-gray terraces, progressively lighter circular platforms and satellite stupas, with a subtle warm central-stupa accent. The goal is recognizability and architectural hierarchy rather than decorative rainbow coloring.

### 2D overlap rule

Classic 2D regions are painted **opaquely** in deterministic outer→inner order. Overlapping polygons therefore do not mix alpha and invent muddy colors. Every filled region is also given a dark visible contour, and the full structural edge pass is drawn on top. The persistent previews use the same paint order and contour treatment.

## Controls

- **Geometric forms** — choose Square, Yantra, Hex, Stupa, or Borobudur.
- **Persistent 2D previews** — all five families are shown at the same time, using the current complexity and Classic palette, so the previews help you choose rather than only confirming the current choice.
- **Complexity** — choose Simple or Complex generated geometry.
- **Spacing** — **Compact** by default, where neighboring Z layers touch; **Separated** preserves the airy exploded-layer look.
- **Rendering** — Solid (default: visible black edges only), Solid + edges (extra structural overlay), or Wire.
- **2D / 3D / 4D** — automatic dimensional transitions.
- **Drag** — XY rotation in 2D; XZ/YZ object rotation in 3D/4D, with the sliders updating live. Shift-drag gives XY twist.
- **Wheel / trackpad** — zoom.
- **Rotation planes** — rotate the object in 4D.
- **A** — autorotate an individual plane.
- **Dimension stretch** — manually scale X/Y/Z/W; 1 is normal and 0 collapses that coordinate.
- **Projection** — Perspective, Orthographic, or true Isometric.
- **Color** — Classic (default), Form, or Axis.
- **Reset** — restore rotations, scale, camera, Perspective projection, Classic color, and Solid rendering.

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


## Geometric-plan construction rules

The 2D geometric plan is the source of truth for every family.

- Every non-zero XY edge in 3D must exist in the 2D plan.
- Every 2D plan edge must be represented by the collapsed 3D form.
- 4D is a symmetric W extrusion of the intrinsic 3D object, so W collapse returns that object exactly.
- Symmetric forms may mirror geometry through ±Z.
- Architectural forms may privilege +Z when upward hierarchy is intrinsic to the architecture.
- An architectural family does **not** receive a fake symmetric counterpart, and a symmetric family does **not** receive a fake architectural counterpart.
- The 2D source must remain a rich centered/hierarchical composition rather than a trivial silhouette.

Current intrinsic mapping:

- Square → symmetric form.
- Yantra → symmetric form.
- Hex → symmetric form.
- Stupa → architectural form.
- Borobudur → architectural form.

The Yantra and Hex center marks are promoted into culminating ±Z elements. Stupa and Borobudur instead use their central footprints as the top architectural crown.

## 3D spacing

Spacing is a real geometric control again:

- **Compact** is the default. Symmetric families keep mirrored Z layers close/touching; architectural families keep adjacent terraces touching.
- **Separated** moves layers farther apart while leaving the XY geometric plan unchanged.

The 2D geometric plan itself never changes when spacing changes.

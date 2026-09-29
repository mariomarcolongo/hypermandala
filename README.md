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

The family-specific lift is therefore the default. Symmetry is the symmetry native to the mandala family plus reflection in the added dimension, not artificial invariance under arbitrary X/Y/Z permutations.

### Temple form — optional

**Temple** is an architectural interpretation of the **same exact 2D mandala plan**. It intentionally gives Z a preferred upward direction, but it now uses only footprints already present in the 2D figure. A Temple may stack those footprints into stepped levels, but it no longer introduces pyramid spokes or roof outlines that disappear when returning to 2D.

Mandala families keep their **native planar symmetry** rather than being forced into full X/Y/Z isotropy. Square, Yantra, and Hex do not generally admit an all-axis-isotropic 3D realization while preserving the exact original 2D mandala.

Switching **Mandala ↔ Temple** is animated through their common lower-dimensional state: the current form folds back toward the 2D mandala, the generator changes at the collapsed plan, then the target form unfolds. In 4D, Z and W collapse together during this form morph so both forms meet at the same exact 2D geometry.

Dimensional transitions remain staged so the higher dimension can be seen emerging before the camera tilts. There is no fractional-dimension slider:

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

## Mandala families

Hypermandala now has multiple geometry generators. Every family uses the same dimensional engine and the same six-plane 4D rotations.

### Square Temple

The original architectural family:

- square cells in 2D;
- cubes and square pyramids in 3D;
- tesseract-like cube extrusions and 4D pyramid prisms in 4D.

Its plan uses a symmetric diamond arrangement with four cardinal extensions and a stepped central shrine.

### Triangle Yantra

A yantra-inspired family built from alternating upward/downward equilateral triangles:

- nested triangular plans plus the central bindu;
- triangular prisms in 3D;
- the bindu becomes the culminating central element in 3D;
- the same region identities are extruded through W in 4D.

Mandala mode mirrors the culminating bindu at ±Z; Temple places the bindu at the top of the stepped construction.

### Hexagonal Mandala

A sixfold family built from concentric and satellite hexagons:

- concentric and satellite hexagons in 2D;
- stepped hexagonal prisms in 3D;
- the center becomes the culminating element in 3D;
- the same regions are extruded through W in 4D.

The complex version adds a twelve-module outer ring while preserving the same 2D↔3D↔4D region identities.

### Stupa

A deliberately isometric-friendly sacred-architecture family:

- nested square terraces transition into polygonal upper rings;
- a central stupa footprint becomes the culminating element;
- Mandala mirrors the vertical sequence around ±Z;
- Temple stacks the exact same footprints upward;
- 4D is the same W extrusion used by the other families.

Its Classic palette uses warm earth, saffron, ivory and gold tones. It is a geometric stupa-inspired family rather than a reconstruction of one specific historic monument.

### Borobudur-inspired

A simplified geometric family based on the recognizable vertical grammar of Borobudur in Central Java.

UNESCO describes Borobudur as five concentric square terraces, three circular platforms and a monumental central stupa, with 72 openwork stupas on the circular platforms:
https://whc.unesco.org/en/list/592

**Complex** preserves that 5 + 3 structure and uses the documented 32 + 24 + 16 distribution of satellite stupas (72 total). **Simple** reduces the count to keep interaction and 4D projection readable.

The model is explicitly **Borobudur-inspired**, not an archaeological reconstruction: reliefs, balustrades, openwork lattice detail and sculptural ornament are abstracted into clean geometric footprints.

### Complexity

Each family has **Simple** and **Complex** variants. Complexity changes the generated geometry itself rather than merely adding decoration, so the extra structure participates in 3D and 4D transformations.

The primitive vocabulary deliberately remains limited—polygons, prisms, pyramids, cubes and their W-extrusions—so even the complex mandalas remain readable under 4D rotation.

## Rendering

Three render modes are available:

- **Wire** — structural edges only.
- **Solid** — projected polygon faces without edge overlay.
- **Solid + edges** — opaque faces plus dark, non-transparent structural edges; this is now the default because it makes the Classic family identity immediately legible. The edges remain fully opaque once a dimension has emerged, while new Z/W edges still fade in during dimensional transitions.

The solid layer uses **WebGL2 with a real depth buffer**. Projected faces are triangulated and depth-tested per pixel rather than painter-sorted as whole polygons. Coincident shared faces are removed before rendering to prevent z-fighting.

Solid faces are now genuinely opaque in the GPU renderer: blending is disabled while depth writing is enabled. Higher-dimensional geometry emerges by changing its geometry/scale rather than by stacking depth-writing translucent faces. This removes the depth/alpha interaction that caused color popping and flashing.

Face colors are intrinsic to the face family/orientation and no longer brighten or darken according to camera depth. Axis labels are remapped when symmetry operations permute coordinate axes, so Axis coloring remains consistent after X/Y/Z/W swaps.

Wireframe and interaction overlays remain on the existing Canvas layer. If WebGL2 is unavailable, Hypermandala falls back to the older Canvas face renderer.

## Color

- **Form** — restrained neutral material.
- **Axis** — X red, Y green, Z blue, W gold.
- **Classic** — semantic mandala-region colors that remain the same across 2D, 3D and 4D; this is now the default color mode.

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

Classic 2D regions are painted **opaquely** in deterministic outer→inner order. Overlapping polygons therefore do not mix alpha and invent muddy colors. The visible 2D result follows the same hierarchy as the top surfaces of the 3D construction.

## Controls

- **Mandala dock** — choose Square, Yantra, Hex, Stupa, or Borobudur.
- **Persistent 2D previews** — all five families are shown at the same time, using the current complexity and Classic palette, so the previews help you choose rather than only confirming the current choice.
- **Complexity** — choose Simple or Complex generated geometry.
- **Form** — **Mandala** by default for exact 2D→3D→4D correspondence, or **Temple** for an architectural interpretation. Switching between them folds through the shared 2D plan.
- **Spacing** — **Compact** by default, where neighboring Z layers touch; **Separated** preserves the airy exploded-layer look.
- **Rendering** — Wire, Solid, or Solid + edges; Solid + edges is the default.
- **2D / 3D / 4D** — automatic dimensional transitions.
- **Drag** — XY rotation in 2D; XZ/YZ object rotation in 3D/4D, with the sliders updating live. Shift-drag gives XY twist.
- **Wheel / trackpad** — zoom.
- **Rotation planes** — rotate the object in 4D.
- **A** — autorotate an individual plane.
- **Dimension stretch** — manually scale X/Y/Z/W; 1 is normal and 0 collapses that coordinate.
- **Projection** — Perspective, Orthographic, or true Isometric.
- **Color** — Form, Axis, or Classic; Classic is the default.
- **Reset** — restore rotations, scale, camera, Perspective projection, Classic color, and Solid + edges.

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

The 2D plan is the source of truth for **both Mandala and Temple**.

- Every non-zero XY edge in either 3D form must exist in the 2D plan.
- Every 2D plan edge must be represented by the collapsed 3D form.
- 4D is constructed by symmetric W extrusion of those 3D primitives, so W collapse returns the same 3D object.
- Square uses exact touching square footprints plus its central diamond/inner-square guides.
- Yantra uses the alternating triangle circuits plus bindu.
- Hex uses concentric hexagons, satellite rings, and center.
- Stupa uses the same nested square/ring/center footprints in Mandala and Temple.
- Borobudur uses the same square terraces, circular platforms, satellite-stupa footprints, and central stupa in both forms.
- Temple changes Z arrangement only; it cannot introduce a new XY footprint.

The Yantra and Hex center marks are promoted into culminating Z elements. In Mandala mode they appear at both ±Z extrema; in Temple they form the top crown. Their XY footprint is unchanged, so dimensional collapse remains exact.

## 3D spacing

Spacing is a real geometric control again:

- **Compact** is the default. In Mandala mode, mirrored Z layers touch or nearly touch according to the actual primitive thicknesses.
- **Separated** moves those Z layers farther apart while leaving the XY footprint unchanged.
- Temple uses zero inter-level gap in Compact and explicit gaps in Separated.

The 2D mandala itself never changes when spacing changes.

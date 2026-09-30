# Hypermandala

**Interactive 4D mandala, yantra and geometry explorer.**

Live: https://hypermandala.mariomarcolongo.com/

Geometric 2D plans unfold into intrinsic 3D forms and genuine 4D projections with rotation in all six coordinate planes.

Hypermandala is a dependency-free Canvas visualization. Its interaction model is inspired by [Tarek Sherif's Tesseract Explorer](https://github.com/tsherif/tesseract-explorer): the 4D object is manipulated in 4D space, projected into 3D, and then viewed with an ordinary 3D camera.

No source code from Tesseract Explorer is required by Hypermandala; the implementation here is independent.

## Dimensional model

Hypermandala no longer treats **Mandala** and **Temple** as interchangeable modes. Each family has one intrinsic 3D identity.

The common source is the **2D geometric plan**: a centered, hierarchical, radially or axially organized figure with mandala-like structure. The 2D view is not a disposable footprint; it is the geometric source of truth.

Families then divide naturally:

- **Free geometric forms** — Square, Sri Yantra, Kali Yantra, Matangi Yantra and Hex use the added coordinates to express their own hierarchy. They do **not** automatically acquire a Z-reflection symmetry that was absent from the source.
- **Architecture** — Stupa, Borobudur, Castel del Monte, Kukulcán and Bete Giyorgis keep their recognizable architectural rise in +Z because that vertical hierarchy belongs to the reference object.

In every case:

- **2D → 3D:** every non-zero XY edge in the 3D object must already exist in the 2D geometric plan, and every 2D plan edge must be represented by the collapsed 3D object.
- **3D → 4D:** the intrinsic 3D object receives a family-aware W lift. Collapsing W to 0 still returns the same 3D object exactly, but W now encodes hierarchy, polarity and centrality instead of acting as generic uniform thickness.

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

The fourth coordinate now has semantic structure:

- free geometric forms already use Z for one outer→inner ascent, so W is not a duplicate Z axis;
- Sri/Matangi complementary triangle families separate by polarity in W;
- Kali's downward/Shakti triangle hierarchy bends toward the same W polarity rather than inventing an alternating polarity;
- polarity separation is strongest through the middle hierarchy and converges again at the outer boundary and final bindu/center;
- non-polar geometric families use hierarchy-dependent W extent while remaining centered on W=0;
- architectural families stay centered on W=0 but gain greater W extent toward higher/central hierarchy, preserving W-reflection symmetry.

Each rotation plane also has an **A** button for autorotation.

The small **projected basis** gizmo shows how the X, Y, Z, and W basis directions appear after the current 4D rotation and projection.

## Projection

Three projection modes are available:

- **Perspective** — a virtual 4D camera sits along W; geometry farther away in W projects smaller.
- **Orthographic** — W is flattened without perspective scaling while the 3D camera remains perspective.
- **Isometric** — W is orthographically flattened and the 3D result uses a true isometric camera (45° yaw, 35.264° pitch) with orthographic screen projection, so X/Y/Z have equal foreshortening.

Mouse drag remains tied to the same object-rotation planes shown in the controls. In 3D/4D, horizontal drag now combines **XY spin + XZ tilt**, while vertical drag changes **YZ**. This keeps XY visibly responsive instead of hiding it behind a modifier. Shift-drag remains a pure **XY** gesture. The corresponding sliders update live. XW/YW/ZW remain explicit 4D rotations because an ordinary 2D drag does not uniquely specify a fourth-dimensional rotation. The wheel zooms.

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

A square/palace symmetric family.

**Simple** retains the compact modular square construction. **Complex** is no longer a filled 5×5 lattice: it uses two nested square enclosures, four cardinal gates, four diagonal satellite diamonds, and an alternating square/diamond central hierarchy. The complex plan is therefore a genuine centered mandala-like composition rather than simply “more blocks.”

Both variants use a single outer→inner hierarchy spanning the Z axis around zero. The outer gates occupy the low end of Z, the nested center rises through successive levels, and the central square/diamond culmination occupies the high end. Exact 2D↔3D↔4D identity is preserved.

### Sri Yantra

The former generic **Yantra** preset has been replaced by a specific Sri Yantra / Sri Chakra construction.

Its core uses nine interlocking triangles — four upward and five downward — from a published computational coordinate set rather than the previous nested-triangle approximation. Both variants also retain the two defining lotus rings, bhupura and bindu.

- **Simple**: nine-triangle core + 8-petal lotus + 16-petal lotus + four-gated bhupura + bindu.
- **Complex**: the same identity-preserving core plus the fuller triple bhupura and concentric enclosure detail.
- 3D: the default is now a **Meru-inspired faceted relief**, not a stack of nine flat triangular prisms. The bhupura and lotus rings remain low terraces; the complete nine-triangle network is lifted onto one continuous inward-rising surface; repeated height bands create real terraces; and the bindu becomes the final apex.
- The 3D surface does **not** claim one uniquely canonical historical height system. Traditional Meru precedent motivates the topology, while the exact elevations are a transparent geometric choice made by Hypermandala.
- Every original triangle edge and every computed intersection remains an actual lifted structural line on the 3D surface, so the dense 2D network is visible in the shape rather than merely printed on a slab.
- 4D: W still expresses polarity independently of Z. Shiva/upward and Shakti/downward triangle families separate in opposite W directions through the middle hierarchy and converge again toward the outer boundary and bindu.

Geometry references:
- https://sriyantrageometry.com/
- https://github.com/bhaskatripathi/SriYantra

### Kali Yantra

This preset follows the widely documented Kali Yantra type consisting of **five concentric downward-pointing triangles**, an **eight-petalled lotus**, a **four-gated bhupura**, and a central bindu.

Complex adds a fuller multi-band bhupura while preserving the same five-triangle identity. Its nested triangle boundaries are also retained as surface subdivisions in 3D/4D, so the higher-dimensional form does not erase the visible 2D nesting.

Reference:
- https://archive.artgallery.nsw.gov.au/sub/goddess/yantras.html

### Matangi Yantra

Matangi is no longer represented by a generic yantra. Its specific plan uses the documented **six-pointed star (shatkona)** inside an **eight-petalled lotus**, enclosed by a bhupura and centered on the bindu.

Complex adds the additional triangle and lotus enclosures described in fuller Matangi-puja constructions while preserving the shatkona as the central identity.

The default 3D realization is now an **experimental shatkona relief**, not a pseudo-Meru stack. The primary interlocking triangles define a continuous star-shaped faceted rise, their exact crossings are lifted as structural lines, the lotus/bhupura stay lower, and the bindu is the culmination. This is explicitly a geometric extension of the documented 2D plan rather than a claim that one canonical traditional Matangi 3D form exists. In 4D, the two triangle polarities still separate through W.

References:
- https://dlbs.liberal.ntu.edu.tw/DLMBS/search/search_detail.jsp?seq=351551
- https://www.drikpanchang.com/vedic-mantra/goddesses/parvati/mahavidya/matangi/yantra/goddess-matangi-yantra.html

### Hexagonal Mandala

A sixfold planar-symmetric family:

- concentric and satellite hexagons in 2D;
- one outer→inner stepped hierarchy through Z rather than a mirrored pair;
- outer satellites occupy the low end of Z;
- layer thickness increases inward rather than remaining uniform;
- the center becomes the single culmination at the high end of Z;
- 4D uses hierarchy-dependent W extent while remaining centered on W=0.

The complex version adds a twelve-module outer ring while preserving exact dimensional identity.

### Stupa

A more specific chorten-like architectural abstraction rather than a generic stack of terraces:

- stepped square base;
- round drum and widening/narrowing dome sequence;
- square harmika;
- tapering multi-stage spire and finial.

The 2D plan records every footprint used by those stages, so the concentric top view remains the exact source for the 3D object. The proportions are reference-driven but still procedural rather than a literal mesh reconstruction of one specific monument.

### Borobudur-inspired

A simplified architectural family based on Borobudur's recognizable concentric plan and stepped vertical hierarchy.

UNESCO describes Borobudur as five concentric square terraces, three circular platforms and a monumental central stupa, with 72 openwork stupas on the circular platforms:
https://whc.unesco.org/en/list/592

**Complex** preserves that 5 + 3 structure and uses the documented 32 + 24 + 16 distribution of satellite stupas (72 total). **Simple** reduces the count to keep interaction and 4D projection readable.

The model is explicitly **Borobudur-inspired**, not an archaeological reconstruction: reliefs, balustrades and sculptural ornament are abstracted into clean geometric regions. The upper stupas are now multi-part bell-like forms rather than single peg-like prisms, and the central stupa is built from a broader stepped profile.


### Castel del Monte

An architectural family grounded in Castel del Monte's octagonal plan:

- an octagonal building ring around an open octagonal court;
- eight octagonal towers at the eight corners;
- Complex adds the inner court-wall band;
- the 3D form keeps the towers slightly higher than the main wall body.

This family is especially compatible with isometric projection because its eightfold plan remains legible from both top and oblique views.

### Kukulcán

A step-pyramid family based on El Castillo / the Temple of Kukulcán at Chichén Itzá:

- nested square platforms;
- four axial stair systems represented as terrace-by-terrace steps;
- a summit temple;
- Complex uses nine stepped bodies, while Simple keeps a reduced five-level abstraction.

The 2D plan therefore reads as a strong square mandala-like hierarchy while the 3D form remains intrinsically architectural.

### Bete Giyorgis

A cruciform family based on the isolated rock-hewn Church of Saint George at Lalibela:

- a centered Greek-cross body assembled from five square cells;
- a surrounding square excavated-court boundary;
- Complex adds the smaller nested roof cross;
- a distinct central roof element completes the hierarchy.

The geometry is intentionally a clean procedural abstraction of Bete Giyorgis rather than a full archaeological reconstruction.

### Family design rule

A future preset should not be added merely because its 3D object is famous or visually attractive. Its 2D source should itself have strong mandala-like organization:

- a meaningful center;
- nested or concentric hierarchy;
- radial, rotational, reflective or axial order;
- repeated modules or directional structure;
- a clear relationship between center and periphery.

That is why architecture can belong in Hypermandala: the plan itself carries the geometric logic from which the 3D object grows.

### Complexity

Each family has **Complex** and **Simple** variants, with **Complex as the default**. “Simple” is relative: both versions must remain structurally meaningful geometric plans. Complexity changes the generated geometry itself rather than merely adding decoration, so the extra structure participates in 3D and 4D transformations.

## Rendering

Three render modes are available:

- **Solid** — the default; opaque colored faces with only the **visible** geometric edges drawn in black, matching the outlined 2D representation.
- **Solid + wireframe** — the same visible black edges plus the full structural edge overlay, including additional construction lines.
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

### Specific yantra families

- **Sri Yantra** — gold bhupura, rose/ivory lotus rings, blue upward triangles, red downward triangles, red bindu. In the Meru-inspired 3D view the continuous supporting surface uses a restrained warm-gold material, while the source triangle families retain their semantic identities in the lifted network and 4D polarity.
- **Kali Yantra** — dark bhupura, crimson lotus, black/crimson triangle hierarchy, gold bindu.
- **Matangi Yantra** — olive bhupura, pink lotus, ochre/green shatkona, gold bindu. Its experimental 3D supporting surface uses a muted ochre material while the original shatkona remains the structural network.

The palettes are visual interpretations of documented traditional color vocabularies, not a claim that every lineage uses one universal color scheme.

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

- **Geometric forms** — choose Square, Sri Yantra, Kali Yantra, Matangi Yantra, Hex, Stupa, Borobudur, Castel del Monte, Kukulcán, or Bete Giyorgis.
- **Persistent 2D previews** — all ten families are shown in a centered grid using the current complexity and Classic palette.
- **Collapsible library** — the entire Geometric Forms panel can collapse to a compact header and expand again without changing the current form.
- **Complexity** — **Complex** is the default and first option; Simple is the reduced form.
- **Spacing** — **Compact** by default. Compact means hierarchy levels are physically contiguous rather than merely close; **Separated** intentionally introduces air between levels.
- **Z lift** — **Hierarchy** is the default single outer→inner ascent. **Mirror** is an experimental reflection-symmetric lift for the non-building geometric families. Architecture keeps its intrinsic vertical orientation.
- **Rendering** — Solid (default: visible black edges only), Solid + wireframe (full structural overlay), or Wire.
- **2D / 3D / 4D** — automatic dimensional transitions.
- **Drag** — XY rotation in 2D; in 3D/4D, horizontal motion gives XY spin + XZ tilt and vertical motion gives YZ tilt. Shift-drag gives pure XY. Sliders update live.
- **Wheel / trackpad** — zoom.
- **Rotation planes** — rotate the object in 4D.
- **A** — autorotate an individual plane.
- **Dimension stretch** — manually scale X/Y/Z/W; 1 is normal and 0 collapses that coordinate.
- **Projection** — Perspective, Orthographic, or true Isometric.
- **Color** — Classic (default), Form, or Axis.
- **Reset** — restore the complete default state, including Square / Complex / Compact / Hierarchy Z lift / 2D / Perspective / Classic / Solid.
- **Persistence** — explorer settings are stored in browser `localStorage` and restored after reload/reopening: selected form, complexity, spacing, Z lift, dimension, projection, rendering, color mode, rotations, autorotation, dimension stretches, zoom, and Geometric Forms panel collapse state.

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
- 4D uses a family-aware W lift rather than uniform extrusion. W collapse still returns the intrinsic 3D object exactly.
- Added dimensions do **not** receive reflection symmetry automatically. New symmetry must come from a meaningful property of the source or the chosen higher-dimensional interpretation.
- Free geometric forms use a single centered Z hierarchy unless a different lift is specifically justified.
- Architectural forms may privilege +Z when upward hierarchy is intrinsic to the architecture.
- An architectural family does **not** receive a fake reflected counterpart, and a geometric family is not forced into an architectural interpretation.
- The 2D source must remain a rich centered/hierarchical composition rather than a trivial silhouette.

Current intrinsic mapping:

- Square → free geometric hierarchy.
- Sri Yantra → centered yantra hierarchy.
- Kali Yantra → centered yantra hierarchy.
- Matangi Yantra → centered yantra hierarchy.
- Hex → free geometric hierarchy.
- Stupa → architectural form.
- Borobudur → architectural form.
- Castel del Monte → architectural form.
- Kukulcán → architectural form.
- Bete Giyorgis → architectural form.

The yantra and Hex center marks become the single high-Z culmination of their geometric hierarchy. Stupa and Borobudur instead use their central footprints as the top architectural crown.

## Dimensional lift philosophy

The 2D plan remains exact, but the higher-dimensional realization is not required to imitate ordinary construction constraints.

For **reference architecture**, real buildings anchor recognizable topology, proportions and hierarchy. Hypermandala may idealize those forms where gravity, materials or construction economy would otherwise force asymmetry or compromise, especially in 4D.

For **non-architectural geometric forms**, the lift should express the internal logic of the plan rather than behave like arbitrary stacked slabs:

- hierarchy determines elevation and layer thickness;
- when a dense 2D intersection network is the identity of the form, that network should become real 3D structure rather than decoration on top of unrelated slabs;
- center and periphery remain meaningful;
- source symmetries are preserved, but new reflection symmetries are not invented merely because another coordinate exists;
- repeated elements at one hierarchy level share elevation and dimensional extent;
- Compact introduces **no accidental air gaps** between consecutive hierarchy levels;
- the bindu or central culmination remains geometrically privileged;
- the visible subdivision/intersection network of a complex plan survives the lift;
- Z and W have different semantic jobs rather than duplicating each other.

The default yantra lift is therefore a **single centered hierarchy**. The bhupura starts at negative Z, successive enclosures rise through Z=0, and the bindu culminates at positive Z. Using both signs of Z does not require two reflected temples: zero is simply the midpoint of one continuous geometric journey.

Hypermandala also keeps an explicit **Mirror** Z-lift mode as an experiment. In that mode the outer level is shared at Z=0 and the inward hierarchy is reflected into ±Z. This deliberately restores a stronger reflection symmetry — useful aesthetically and mathematically — without claiming that it is the uniquely faithful traditional continuation.

In 4D, W is used for relationships that Z cannot express cleanly. Complementary Sri/Matangi triangle polarities separate in opposite W directions through the intermediate hierarchy and converge again toward W=0 at the outer boundary and bindu. Kali's five downward triangles share one polarity rather than being assigned an artificial alternating sign. Square and Hex use hierarchy-dependent W extent without an invented polarity.

### Complexity preservation

Complexity is part of the source geometry, not decoration that can disappear after 2D.

For Sri and Matangi, Hypermandala now computes the exact triangle-intersection network and lifts those source lines onto a coherent faceted height field. The hidden tessellation needed to render the supporting surface is deliberately **not** exposed as structural wire: the visible 3D edges are the source yantra network itself. Those same lifted edges become W-bridge structure in 4D.

Kali retains the simpler nested-tier construction because its five concentric downward triangles already describe a direct enclosure hierarchy. The experimental **Mirror** mode also intentionally keeps the older reflection-symmetric layered interpretation rather than pretending to be the default traditional continuation.

The flat renderer does not draw bookkeeping subsegments a second time because the same lines are already visible as the original 2D triangle boundaries.

For **reference architecture**, recognizable 3D structure remains anchored to the real object. The 4D lift is freer: modules stay centered on W=0 to preserve reflection symmetry, while higher/central architectural elements receive greater W extent. In other words, 3D respects the building; 4D is allowed to express the building's hierarchy without gravity, material cost or engineering limits.

References:
- https://www.sriyantrageometry.com/sources
- https://www.sriyantrageometry.com/

## 3D spacing

Spacing is a real geometric control:

- **Compact** is the default. Consecutive hierarchy levels are packed so their surfaces touch rather than float with arbitrary gaps.
- **Separated** intentionally moves hierarchy levels farther apart while leaving the XY geometric plan unchanged.
- Architectural forms also use zero inter-level air in Compact unless a void is intrinsic to the reference form.

The 2D geometric plan itself never changes when spacing changes.


## Web discovery

The production site uses the canonical URL `https://hypermandala.mariomarcolongo.com/`, Open Graph / Twitter social cards, Schema.org `WebApplication` structured data, a crawlable About section, `robots.txt`, `sitemap.xml`, a favicon, and a dedicated 1200×630 social-preview image.

### Novelty wording

Hypermandala does **not** claim to be the first 3D Sri Yantra visualization: earlier interactive and downloadable 3D Sri Yantra work exists.

The project instead describes itself factually as an **interactive 4D mandala, yantra and geometry explorer** with genuine six-plane 4D rotation, dimensional collapse, multiple specific yantras/mandalas, semantic higher-dimensional lifts, and architecture-derived forms. Older fourth-dimensional sacred-geometry and “HyperMandala” concepts also exist, so any absolute “first 4D mandala ever” claim would require a much more exhaustive historical prior-art search.

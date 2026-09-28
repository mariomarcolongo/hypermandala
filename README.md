# Hypermandala

**One geometric rule explored as a 2D mandala, a 3D temple, and a 4D structure through W-slices.**

Hypermandala is a dependency-free Canvas visualization inspired by the relationship between mandala plans and temple architecture.

## Dimensional model

The dimensions are discrete states:

- **2D — plan:** a clean nested square/diamond mandala.
- **3D — temple:** the same rings rise into a stepped shrine.
- **4D — W slices:** the temple becomes a family of related 3D cross-sections distributed along a fourth spatial coordinate.

Clicking 2D, 3D, or 4D triggers an automatic transition. There is no user-controlled fractional-dimension slider.

## Geometry

The construction deliberately uses one repeated rule:

`square → diamond → square → diamond → … → apex`

Adjacent levels are connected corner-to-corner, and four cardinal ground axes pass through the plan. This keeps the object visually coherent in both plan and elevation.

In 4D, the 3D temple varies continuously with `w`: its scale, twist, and height change smoothly. Several faint reference slices show the larger 4D structure while the selected slice remains bright.

## Controls

- **X / Y:** translate the mandala in 2D, 3D, or 4D.
- **Z:** translate it vertically in 3D or 4D.
- **W slice:** in 4D, move the slice hyperplane through the fourth coordinate. This does not translate the whole object; it selects a different 3D cross-section of the 4D structure.
- **Drag:** rotate the visible 2D/3D view.
- **Shift + drag in 4D:** rotate through planes involving W.
- **Scroll / trackpad:** zoom.
- **center:** reset X/Y/Z and the W slice to zero.
- **reset view:** restore the camera.

The scene renders only the spatial axes that can be shown directly in the current view: X and Y in 2D, then X/Y/Z in 3D and 4D. W is deliberately not drawn as another in-scene axis, because that would falsely make it look like an ordinary 3D direction. Instead, W is shown in a separate coordinate rail outside the projected scene; its marker selects the active 3D slice.

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

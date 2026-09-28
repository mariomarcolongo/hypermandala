# Hypermandala

**A geometric mandala explored as a 2D plan, a 3D temple, and a 4D hyperstructure.**

Hypermandala is a dependency-free interactive visualization built with HTML, CSS, and the Canvas 2D API. The project is inspired by the way mandala geometry can become architecture: the same symmetric plan rises into terraces, gateways, subsidiary shrines, and a central tower.

## Interaction

Dimensions are discrete states rather than a user-controlled fractional slider:

- **2D** — the geometric ground plan.
- **3D** — the plan automatically rises into a temple-like stepped structure.
- **4D** — the 3D structure automatically extrudes through a fourth spatial coordinate, **W**.

Clicking 2D, 3D, or 4D triggers a smooth automatic transformation. The interpolation exists only during the transition.

### Axes

The coordinate axes are visible in the scene and the mandala can be translated relative to them.

- 2D: **X, Y**
- 3D: **X, Y, Z**
- 4D: **X, Y, Z, W**

Use the axis controls to move the mandala along each available coordinate. Moving along W changes the 4D projection rather than acting like an ordinary screen-space pan.

Other controls:

- Drag to rotate the view.
- In 4D, **Shift + drag** rotates through planes involving W.
- Scroll / trackpad to zoom.
- Double-click or choose **reset view** to restore the camera.
- **center** resets all axis positions.
- Keyboard: `2`, `3`, `4`, `C` to center, and `R` to reset the view.

## Geometry

The current procedural form uses:

- nested square terraces, alternating between cardinal and diagonal orientation;
- cardinal gateways;
- concentric octagons and radial construction lines;
- a central stepped shrine/tower;
- four subsidiary shrines;
- a 4D extrusion of the complete 3D structure across multiple W layers, with corresponding vertices connected through W.

The 2D, 3D, and 4D views therefore come from one related geometric construction rather than three unrelated drawings.

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

The workflow at `.github/workflows/pages.yml` publishes `public` when Pages is enabled for the repository and configured to use GitHub Actions.

## License

GNU Affero General Public License v3.0 or later. See [`LICENSE`](./LICENSE).

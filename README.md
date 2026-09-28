# Hypermandala

**One mandala, continuously unfolding from 2D to 3D to 4D.**

Hypermandala is a dependency-free interactive visualization built with HTML, CSS, and the Canvas 2D API. The same procedural mandala is used in every state: the slider gradually introduces a latent `z` coordinate and then a latent `w` coordinate, so the transition feels like one object gaining dimensions rather than three unrelated scenes.

## Interaction

- Drag the **2D → 3D → 4D** slider for the main transition.
- Click **2D**, **3D**, or **4D** to glide to that dimension.
- Press **Play** for an automatic dimensional cycle.
- **Drag** the mandala to rotate it. In 4D, dragging also rotates through planes involving the fourth coordinate.
- **Scroll / trackpad** to zoom.
- Double-click the canvas or use the reset button to reset the view.
- Keyboard: `2`, `3`, `4`, arrow keys, `Space`, and `R`.

The values between 2D, 3D, and 4D are a visual interpolation parameter, not a claim that the rendered geometry has a mathematically fractional topological dimension.

## Run locally

No install or build step is required.

```bash
python3 -m http.server 8080 -d public
```

Then open `http://localhost:8080`.

## Deploy

### Cloudflare Pages

This repository is ready for a no-build static deployment:

- Production branch: `main`
- Framework preset: none
- Build command: leave blank (or use `exit 0`)
- Build output directory: `public`

Cloudflare Pages supports GitHub-connected private repositories and will automatically deploy new pushes to `main` once the repository is connected.

### GitHub Pages

A GitHub Pages workflow is included at `.github/workflows/pages.yml`. It publishes the `public` directory whenever `main` changes.

GitHub Pages supports public repositories on GitHub Free and private repositories on plans that include Pages for private repositories. The repository owner must enable GitHub Pages / GitHub Actions as the publishing source if it is not already enabled.

## Architecture

The renderer deliberately avoids a 3D framework. Every sampled point begins with `(x, y)` and latent `z₀` / `w₀` values derived from the mandala's radial structure.

- `2 → 3`: `z = ease(d - 2) · z₀`
- `3 → 4`: `w = ease(d - 3) · w₀`
- 4D rotations are applied in `XW`, `YW`, and `ZW` planes.
- The result is projected from 4D → 3D, then from 3D → the 2D canvas.

This keeps the transition continuous while still allowing genuinely 4D rotations once `w` is active.

## License

GNU Affero General Public License v3.0 or later. See [`LICENSE`](./LICENSE).

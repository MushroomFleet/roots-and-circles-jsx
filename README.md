# Roots & Circles

An interactive React worktable for exploring square roots, their exact surd forms, and the circular (trigonometric) functions — with a live unit circle that turns any value into an angle and shows *sin* and *cos* as the shadows it casts.

`offline · self-contained · zero dependencies at runtime`

---

## What this is

**Roots & Circles** is a single self-contained teaching component. It lays a spine of numbers side by side and fills in, for each one, the things a student usually has to compute separately and never sees connected:

- the **square root**, to an adjustable precision (0–10 decimal places),
- the **exact surd form** — properly simplified, so √8 renders as 2√2 and √0.5 as √2⁄2,
- the **fraction form** for values below 1,
- the **circular functions** sin, cos and tan (taken in radians), and
- optional **circle geometry**: circumference 2πr and area πr².

The point of the tool is the *connections* between those columns, not the columns themselves. Selecting a row drives a live unit circle: the radius swings to the chosen angle, cosine is drawn as a horizontal shadow and sine as a vertical one, and labeled quarter-turn marks (0, π/2, π, 3π/2) make it visible *why* a trig column flips sign as the value grows. The same idea that `sin² + cos² = 1` is shown resolving live for whatever row is active.

It grew out of a simple question — "show me the square roots of 1 through 9" — and kept earning new columns: surds, then the decimal direction (0.9 → 0.1), then primes scaled below 1, then the circular functions, then the annotations that explain which values actually matter.

## Why it exists

Most root tables are inert. A learner reading `√2 ≈ 1.41421356` has no reason to feel that this number *is* the diagonal of a unit square, that it was the first quantity ever proven irrational, or that its reciprocal is the cosine of 45°. Roots & Circles is built to make those facts adjacent and tangible:

- **Highlights expose meaning.** Notable values flag themselves — √2 (Pythagoras's constant), √3 (Theodorus's constant, the altitude ratio inside every 30–60–90 triangle), √5 (the irrational seed of the golden ratio φ), the perfect squares (rational, so their decimals terminate), and √0.5 = 1⁄√2 (the reciprocal of √2). Each carries a short field note explaining the *why*, not just the value.
- **The circle makes trig physical.** Instead of memorising a sign table, you watch the point cross a quarter-turn and see sine or cosine change sign.
- **Surds are computed, not hardcoded.** The simplifier pulls square factors out of the radicand and rationalises denominators on the fly, so the exact forms are always correct for any value in range.

It suits classroom projection, one-on-one tutoring, self-study, or embedding in a larger maths site.

## Features

- **Three directions** — integers climbing (1 up to 9 / 12 / 16 / 20), decimals running 0.9 → 0.1, and the first ten primes scaled below 1.
- **Adjustable precision** from 0 to 10 decimal places, applied live to every numeric column.
- **Exact surd rendering** with true radical overlines and stacked-fraction vinculums.
- **Toggleable columns** for the circular functions and for circle geometry.
- **Live unit circle** with labeled quadrant landmarks, a sin/cos readout, and full-turn tracking.
- **Self-explaining highlights** — a `★ highlights` switch turns the educational annotations on or off.
- **Accessible & responsive** — keyboard-focusable controls, reduced-motion support, and a layout that collapses cleanly to mobile.

## Getting started

### Option A — the offline demo (no build, no install)

Open `demo.html` in any modern browser. That's the whole step. React and the component are bundled directly into the file, so it runs with **no internet connection** — ideal for demonstrations on locked-down machines, USB sticks, or email attachments. There are no CDN script tags and nothing to install.

### Option B — use the component in a React project

`RootsAndCircles.jsx` is a single default-exported component with no required props.

```jsx
import RootsAndCircles from "./RootsAndCircles.jsx";

export default function App() {
  return <RootsAndCircles />;
}
```

It carries its own styling in a scoped `<style>` block, so it drops into any React 18 app without a CSS framework, Tailwind, or extra dependencies.

### Rebuilding the offline demo

If you edit the component and want a fresh standalone file, bundle it with [esbuild](https://esbuild.github.io/):

```bash
npm install react react-dom esbuild
# entry.jsx imports RootsAndCircles and mounts it to #root
esbuild entry.jsx --bundle --minify --format=iife \
  --jsx=automatic --define:process.env.NODE_ENV='"production"' \
  --outfile=bundle.js
```

Then inline `bundle.js` inside a `<script>` tag in your HTML shell. The demo in this repo was built exactly this way.

## Repository layout

| File | What it is |
| --- | --- |
| `RootsAndCircles.jsx` | The component — math helpers, surd simplifier, unit-circle SVG, and styling. |
| `demo.html` | A standalone, fully offline build with React inlined. |
| `README.md` | This file. |

## How it works (a quick tour)

- **Surd simplification.** For an integer `n`, the largest square factor is pulled out to give `coef·√rad`. For a fraction `num/den`, the denominator is rationalised — `√(num/den) = √(num·den)/den` — then simplified and reduced. That single mechanism produces every exact form in the tables.
- **The circular functions** are evaluated in radians on the raw value, which is also the angle fed to the unit circle, so the table and the diagram are always the same number seen two ways.
- **Annotations** are derived per row from the value itself, so the right figures highlight automatically in every direction.

## License

Released under the MIT License unless stated otherwise in the repository.

---

## 📚 Citation

### Academic Citation

If you use this codebase in your research or project, please cite:

```bibtex
@software{roots_and_circles,
  title = {Roots & Circles: an interactive worktable for square roots, exact surds, and the circular functions},
  author = {Drift Johnson},
  year = {2026},
  url = {https://github.com/MushroomFleet/roots-and-circles-jsx},
  version = {1.0.0}
}
```

### Donate:

[![Ko-Fi](https://cdn.ko-fi.com/cdn/kofi3.png?v=3)](https://ko-fi.com/driftjohnson)

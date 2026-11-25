# Implementation notes — Slope Fields

Developer-facing architecture notes for `slope-fields`.

## Architecture

Three screens under `src/slope-field/`, `src/euler/`, and `src/growth-models/`. Models own state and `step` / `reset`; views observe Properties and never integrate physics beyond calling shared solvers.

### LessonView (shared with Calculus I)

`src/common/LessonView.ts` is the canonical lesson scaffold shared file-for-file with Limit Explorer, Mean Value Theorem, Riemann Sum Builder, and Related Rates (sim-prefix imports only). It owns the titled layout (plot left, panel right, notes under the plot), control factories, `Plot` / `PlotHandle`, screen-summary wiring, and `pdomOrder` via `finish()`. **Do not edit it only in this repo** — change one copy and propagate.

### SlopeFieldNode

`src/common/SlopeFieldNode.ts` draws the entire field as **one** `Path` Shape (no per-segment nodes). `update(plot, f, domain, density, scale)` rebuilds that Shape: a `density × rows` grid of cell centers, each a short segment in the view-space direction of \((1, f)\) so unequal \(x\)/\(y\) pixel scales still look right. Huge \(|f|\) draws a vertical tick.

### Redraw strategy

Each screen view Multilinks model Properties (and `localeProperty`) to a private `redraw()`:

1. `plot.setDomain(...)` (no-op when the domain / ticks / locale key is unchanged).
2. Detach the reusable `SlopeFieldNode` if present, `plot.clear()` the drawing layer (handles persist).
3. Rebuild field / curves / overlays / labels into `plot.layers`.
4. `handle.place(...)` for grab points.

Euler rebuilds its step `GridBox` on the same path. Growth Models rebuilds parameter sliders when the model id changes, and redraws a second `Plot` for the phase line under the notes.

## Other notes

- Colors: `src/SlopeFieldsColors.ts`. Strings: `src/i18n/` via `StringManager`.
- Preferences shell: `src/preferences/` (simulation tab present; no sim-specific prefs yet).

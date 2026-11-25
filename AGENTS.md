# AGENTS.md — Slope Fields

Sim-specific context for AI assistants. General SceneryStack guidance: [OpenLyceum/.github/AGENTS.md](https://github.com/OpenLyceum/.github/blob/main/AGENTS.md).

## Project

Slope Fields (`slope-fields`) is a Calculus II simulation of first-order ODEs \(y' = f(x,y)\).

- **Slope Field:** pick an equation from the library. Drag the initial point (arrow keys work). The field is one `Path`; optional exact curve, equilibria, and isocline overlays. Keep / Clear pins solution curves through other starts.
- **Euler's Method:** step or play Euler from \((x_0,y_0)\) to \(x_\mathrm{end}\) with preset step sizes. Compare with Heun and RK4; a compact step table and error readout sit under the plot. Halving \(h\) lands on the next smaller preset.
- **Growth Models:** exponential, Newton's cooling, logistic, and logistic with harvesting. Parameter sliders, optional direction field and equilibria, and a phase line \(f(y)\) vs \(y\). Harvesting past \(rK/4\) has no equilibria and a numerical extinction time.

## Key files

| File | Purpose |
|---|---|
| `src/SlopeFieldsColors.ts` | All `ProfileColorProperty` instances |
| `src/SlopeFieldsConstants.ts` | Layout, field, Euler, and growth defaults / ranges |
| `src/SlopeFieldsNamespace.ts` | Namespace for color property names |
| `src/i18n/StringManager.ts` | Singleton localized string accessor |
| `src/common/LessonView.ts` | Shared Calculus lesson scaffold (identical with Limit Explorer / Mean Value Theorem apart from the sim prefix). **Do not edit here and leave the others stale — change in one sim and copy.** |
| `src/common/SlopeFieldNode.ts` | Single-`Path` slope / direction field |
| `src/common/model/EquationLibrary.ts` | ODE catalog + isocline marching squares |
| `src/common/model/odeSolvers.ts` | Euler / Heun / RK4, `integrate`, `traceSolution` |
| `src/common/model/GrowthModels.ts` | Autonomous growth rates, equilibria, closed forms |
| `src/slope-field/` | Slope Field screen model / view / keyboard help |
| `src/euler/` | Euler's Method screen |
| `src/growth-models/` | Growth Models screen |
| `tests/screenViews.test.ts` | Constructs each `ScreenView` (guards `this`-before-`super`) |
| `tests/browser/keyboard.spec.ts` | Keyboard / PDOM regressions for all three screens |

## Numerics

- **RK4 tracing (`traceSolution`):** steps stop when \(y\) is non-finite, \(|y| > 10^6\), or \(y\) leaves the viewing window expanded by 50% of its height (cap 20 000 steps). Slope Field solutions use \(h = (x_\max - x_\min)/400\).
- **Euler step shortening:** the last step is shortened so \(x_N = x_\mathrm{end}\) exactly; `stepCount` is \(\lceil(x_\mathrm{end}-x_0)/h\rceil\).
- **Harvesting threshold:** equilibria exist for \(H < rK/4\); one semistable at \(K/2\) when equal; none when \(H > rK/4\). The harvested curve is RK4 (`GROWTH_RK4_DIVISOR`); extinction time is interpolated at the first non-positive sample (search past \(t_\max\) up to `GROWTH_EXTINCTION_TIME_CAP` if needed).

## Compliance carve-outs

- `memory-leak:PlotHandle` — file-private drag handle inside `LessonView.ts`; not exported for `describeDisposalLeaks`.

## Testing

See the shared Vitest setup (`vitest.config.ts`, `tests/setup.ts`) and `tests/memory-leak.test.ts` for disposal coverage. Model tests live under `tests/`; browser specs under `tests/browser/`.

## Accessibility

Follow [Baton/ACCESSIBILITY.md](https://github.com/OpenLyceum/Baton/blob/main/ACCESSIBILITY.md). `LessonView.finish` sets `pdomOrder` to plot → controls → notes → Reset All. Each screen supplies live `currentDetailsContent`, keyboard-help content for every handle, and accessible context responses on Keep / Clear / Step / Halve \(h\) and the harvesting extinction warning.

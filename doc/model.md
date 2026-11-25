# Model — Slope Fields

Educator-facing description of what this simulation models.

## Overview

Slope Fields is a Calculus II simulation of first-order ordinary differential equations
\(y' = f(x, y)\). Students sketch slope fields, compare numerical methods (Euler, Heun, RK4),
and explore autonomous growth / decay models with equilibria and closed-form solutions.

## Quantities and units

| Quantity | Symbol | Units | Range |
|---|---|---|---|
| Independent variable | \(x\) or \(t\) | dimensionless (or time) | per-equation window |
| Dependent variable | \(y\) | dimensionless | per-equation window |
| Step size | \(h\) | same as \(x\) | positive |
| Growth rate | \(r\) | 1/time | model-dependent |
| Carrying capacity | \(K\) | same as \(y\) | \(> 0\) |
| Ambient temperature | \(T_a\) | same as \(y\) | any |
| Harvest rate | \(H\) | same as \(y'\) | \(\ge 0\) |

## Governing equations

### Equation library (`src/common/model/EquationLibrary.ts`)

| id | Equation | Exact solution through \((x_0, y_0)\) | Equilibria | Window |
|---|---|---|---|---|
| `x` | \(y' = x\) | \(y = y_0 + (x^2 - x_0^2)/2\) | — | \([-4,4]\times[-4,4]\) |
| `y` | \(y' = y\) | \(y = y_0 e^{x-x_0}\) | \(0\) | \([-3,3]\times[-4,4]\) |
| `xMinusY` | \(y' = x - y\) | \(y = x - 1 + (y_0 - x_0 + 1)e^{-(x-x_0)}\) | — | \([-4,4]\times[-4,4]\) |
| `xy` | \(y' = xy\) | \(y = y_0 e^{(x^2-x_0^2)/2}\) | \(0\) | \([-3,3]\times[-4,4]\) |
| `logistic` | \(y' = y(1-y)\) | \(y = 1\big/\bigl(1 + \frac{1-y_0}{y_0}e^{-(x-x_0)}\bigr)\) (or \(0\)/\(1\) if \(y_0\in\{0,1\}\)) | \(0,1\) | \([-4,4]\times[-1,2]\) |
| `sinX` | \(y' = \sin x\) | \(y = y_0 + \cos x_0 - \cos x\) | — | \([-2\pi,2\pi]\times[-4,4]\) |
| `riccati` | \(y' = x^2 - y^2\) | (none) | — | \([-3,3]\times[-3,3]\) |
| `circle` | \(y' = -x/y\) | \(y = \mathrm{sign}(y_0)\sqrt{x_0^2+y_0^2-x^2}\) | — | \([-4,4]\times[-4,4]\) |

Isoclines \(f(x,y)=c\) are extracted with a marching-squares pass on a regular grid
(linear edge interpolation; segments joined greedily into polylines).

### ODE solvers (`src/common/model/odeSolvers.ts`)

One-step methods for \(y' = f(x,y)\):

- **Euler:** \(y_{n+1} = y_n + h\,f(x_n,y_n)\)
- **Heun (improved Euler):** predictor \(\hat y = y_n + h\,f(x_n,y_n)\), then
  \(y_{n+1} = y_n + \tfrac{h}{2}\bigl(f(x_n,y_n)+f(x_n+h,\hat y)\bigr)\)
- **RK4:** classical fourth-order Runge–Kutta

`integrate` walks from \((x_0,y_0)\) toward \(x_\mathrm{end}\) with positive \(h\) (signed
internally), shortening the last step to land on \(x_\mathrm{end}\). Traces stop when \(y\)
is non-finite, \(|y|>10^6\), or \(y\) leaves the viewing window expanded by 50% of its
height on each side (cap 20 000 steps). `traceSolution` joins RK4 backward-to-\(x_\min\)
and forward-to-\(x_\max\) in increasing \(x\).

### Growth models (`src/common/model/GrowthModels.ts`)

| id | Equation | Equilibria / notes |
|---|---|---|
| `exponential` | \(y' = r y\) | \(y^*=0\) (unstable if \(r>0\), stable if \(r<0\)); empty list if \(r=0\) |
| `cooling` | \(y' = -r(y - T_a)\) | \(y^*=T_a\) (stable for \(r>0\)) |
| `logistic` | \(y' = r y(1-y/K)\) | \(0\) unstable, \(K\) stable (for \(r>0\)) |
| `harvesting` | \(y' = r y(1-y/K) - H\) | two equilibria when \(H < rK/4\); one semistable at \(K/2\) when \(H = rK/4\); none when \(H > rK/4\) |

Closed forms (from \(t=0\)): exponential \(y_0 e^{rt}\); cooling
\(T_a + (y_0-T_a)e^{-rt}\); logistic \(K\big/\bigl(1+\frac{K-y_0}{y_0}e^{-rt}\bigr)\)
(\(y_0=0\to 0\)). Harvesting has no elementary closed form (use RK4 in the view).
Characteristic times: doubling \(\ln 2/r\) or half-life \(\ln 2/|r|\) for exponential;
half-life of the temperature difference \(\ln 2/r\) for cooling.

## Simplifications

- Planar autonomous / non-autonomous first-order ODEs only (no systems, no higher order).
- Fixed-step integrators; no adaptive step-size control.
- Solution traces are clipped by an expanded viewing window rather than analytic domain analysis.
- Harvesting closed form is omitted; the view integrates numerically.

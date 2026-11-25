/**
 * SlopeFieldsScreenIcons.ts
 *
 * Programmatic home-screen / navigation-bar icons for each screen.
 * Drawn on the standard PhET 548 × 373 canvas using SlopeFieldsColors.
 */
import { Shape } from "scenerystack/kite";
import { Node, Path, Rectangle } from "scenerystack/scenery";
import { ScreenIcon } from "scenerystack/sim";
import SlopeFieldsColors from "../SlopeFieldsColors.js";

const W = 548;
const H = 373;

function background(): Rectangle {
  return new Rectangle(0, 0, W, H, { fill: SlopeFieldsColors.backgroundColorProperty });
}

function iconFrom(content: Node): ScreenIcon {
  return new ScreenIcon(content, {
    maxIconWidthProportion: 1,
    maxIconHeightProportion: 1,
    fill: SlopeFieldsColors.backgroundColorProperty,
  });
}

/**
 * Map model (x, y) in [−0.5, 4.5] × [−0.2, 1.4] (logistic window) onto the icon canvas.
 */
function toIcon(x: number, y: number): { x: number; y: number } {
  const xMin = -0.5;
  const xMax = 4.5;
  const yMin = -0.2;
  const yMax = 1.4;
  return {
    x: ((x - xMin) / (xMax - xMin)) * W,
    y: ((yMax - y) / (yMax - yMin)) * H,
  };
}

/** Logistic RHS y′ = y(1 − y) for the Slope Field icon motif. */
function logisticSlope(_x: number, y: number): number {
  return y * (1 - y);
}

export function createSlopeFieldIcon(): ScreenIcon {
  const field = new Shape();
  const cols = 8;
  const rows = 5;
  const xMin = -0.5;
  const xMax = 4.5;
  const yMin = -0.2;
  const yMax = 1.4;
  const cellW = (xMax - xMin) / cols;
  const cellH = (yMax - yMin) / rows;
  const half = 0.35 * Math.min(cellW, cellH);
  const sx = W / (xMax - xMin);
  const sy = H / (yMax - yMin);

  for (let i = 0; i < cols; i++) {
    const x = xMin + (i + 0.5) * cellW;
    for (let j = 0; j < rows; j++) {
      const y = yMin + (j + 0.5) * cellH;
      const slope = logisticSlope(x, y);
      let vx = sx;
      let vy = -sy * slope;
      const mag = Math.hypot(vx, vy);
      if (!(mag > 0)) {
        continue;
      }
      vx /= mag;
      vy /= mag;
      // Convert a short view-direction step into model endpoints for the icon.
      const dx = (half * vx) / sx;
      const dy = (-half * vy) / sy;
      const a = toIcon(x - dx, y - dy);
      const b = toIcon(x + dx, y + dy);
      field.moveTo(a.x, a.y);
      field.lineTo(b.x, b.y);
    }
  }

  // One logistic solution through (0, 0.5): y = 1 / (1 + e^{−x}).
  const curve = new Shape();
  const n = 40;
  for (let i = 0; i <= n; i++) {
    const x = xMin + ((xMax - xMin) * i) / n;
    const y = 1 / (1 + Math.exp(-x));
    const p = toIcon(x, y);
    if (i === 0) {
      curve.moveTo(p.x, p.y);
    } else {
      curve.lineTo(p.x, p.y);
    }
  }

  return iconFrom(
    new Node({
      children: [
        background(),
        new Path(field, {
          stroke: SlopeFieldsColors.textColorProperty,
          lineWidth: 3,
          opacity: 0.55,
        }),
        new Path(curve, {
          stroke: SlopeFieldsColors.accentColorProperty,
          lineWidth: 8,
          lineCap: "round",
        }),
      ],
    }),
  );
}

/**
 * Exact exponential y = e^x with a 4-step Euler polyline from (0, 1) with h = 0.25.
 */
export function createEulerIcon(): ScreenIcon {
  const xMin = -0.2;
  const xMax = 1.3;
  const yMin = 0.5;
  const yMax = 3.2;
  const toCanvas = (mx: number, my: number): { x: number; y: number } => ({
    x: ((mx - xMin) / (xMax - xMin)) * W,
    y: ((yMax - my) / (yMax - yMin)) * H,
  });

  const exact = new Shape();
  const n = 48;
  for (let i = 0; i <= n; i++) {
    const mx = xMin + ((xMax - xMin) * i) / n;
    const p = toCanvas(mx, Math.exp(mx));
    if (i === 0) {
      exact.moveTo(p.x, p.y);
    } else {
      exact.lineTo(p.x, p.y);
    }
  }

  // Euler on y′ = y from (0, 1), h = 0.25, four steps.
  const h = 0.25;
  const eulerPts: Array<readonly [number, number]> = [[0, 1]];
  for (let i = 0; i < 4; i++) {
    const prev = eulerPts[i];
    if (prev === undefined) {
      break;
    }
    eulerPts.push([prev[0] + h, prev[1] + h * prev[1]]);
  }
  const euler = new Shape();
  eulerPts.forEach(([ex, ey], i) => {
    const p = toCanvas(ex, ey);
    if (i === 0) {
      euler.moveTo(p.x, p.y);
    } else {
      euler.lineTo(p.x, p.y);
    }
  });

  return iconFrom(
    new Node({
      children: [
        background(),
        new Path(exact, {
          stroke: SlopeFieldsColors.tertiaryColorProperty,
          lineWidth: 7,
          lineCap: "round",
        }),
        new Path(euler, {
          stroke: SlopeFieldsColors.accentColorProperty,
          lineWidth: 8,
          lineCap: "round",
          lineJoin: "round",
        }),
      ],
    }),
  );
}

export function createGrowthModelsIcon(): ScreenIcon {
  return iconFrom(
    new Node({
      children: [background()],
    }),
  );
}

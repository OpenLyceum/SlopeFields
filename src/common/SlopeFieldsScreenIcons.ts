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

export function createEulerIcon(): ScreenIcon {
  return iconFrom(
    new Node({
      children: [background()],
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

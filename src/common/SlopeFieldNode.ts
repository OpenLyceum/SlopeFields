/**
 * SlopeFieldNode.ts
 *
 * A single Path whose Shape holds every slope-field segment. Rebuild with
 * update() whenever the equation, density, scale, or plot domain changes.
 */

import { roundSymmetric } from "scenerystack/dot";
import { Shape } from "scenerystack/kite";
import { Node, Path } from "scenerystack/scenery";
import Colors from "../SlopeFieldsColors.js";
import { HUGE_SLOPE } from "../SlopeFieldsConstants.js";
import type { Plot } from "./LessonView.js";
import type { Bounds, Slope } from "./model/odeSolvers.js";

/**
 * Draws a slope field into one Path (no per-segment nodes).
 */
export class SlopeFieldNode extends Node {
  private readonly path: Path;

  public constructor() {
    const path = new Path(null, {
      stroke: Colors.textColorProperty,
      lineWidth: 1.5,
      opacity: 0.55,
      pickable: false,
    });
    super({ children: [path], pickable: false });
    this.path = path;
  }

  /**
   * Rebuilds the field for the given RHS and viewing window.
   * Samples a density × round(density · H/W) grid of cell centers; at each,
   * draws a segment whose direction is (1, f) normalized in view space so
   * slopes look right under unequal x/y pixel scales.
   */
  public update(plot: Plot, f: Slope, domain: Bounds, density: number, scale: number): void {
    const cols = Math.max(1, roundSymmetric(density));
    const rows = Math.max(1, roundSymmetric((cols * plot.heightInPixels) / plot.widthInPixels));
    const cellW = (domain.xMax - domain.xMin) / cols;
    const cellH = (domain.yMax - domain.yMin) / rows;
    const cellPx = Math.min(plot.widthInPixels / cols, plot.heightInPixels / rows);
    const halfLenPx = 0.5 * scale * cellPx;

    const sx = plot.widthInPixels / (domain.xMax - domain.xMin);
    const sy = plot.heightInPixels / (domain.yMax - domain.yMin);

    const shape = new Shape();
    for (let i = 0; i < cols; i++) {
      const x = domain.xMin + (i + 0.5) * cellW;
      for (let j = 0; j < rows; j++) {
        const y = domain.yMin + (j + 0.5) * cellH;
        const slope = f(x, y);
        if (!Number.isFinite(slope)) {
          continue;
        }

        // View-space direction of model vector (1, f); y pixels increase downward.
        let vx: number;
        let vy: number;
        if (Math.abs(slope) > HUGE_SLOPE) {
          vx = 0;
          vy = 1;
        } else {
          vx = sx;
          vy = -sy * slope;
          const mag = Math.hypot(vx, vy);
          if (!(mag > 0)) {
            continue;
          }
          vx /= mag;
          vy /= mag;
        }

        const cx = plot.plotX(x);
        const cy = plot.plotY(y);
        shape.moveTo(cx - halfLenPx * vx, cy - halfLenPx * vy);
        shape.lineTo(cx + halfLenPx * vx, cy + halfLenPx * vy);
      }
    }
    this.path.shape = shape;
  }
}

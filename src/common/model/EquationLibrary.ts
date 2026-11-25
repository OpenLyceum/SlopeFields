/**
 * EquationLibrary.ts
 *
 * Catalog of first-order ODEs for the Slope Field and Euler screens, plus
 * isocline extraction via marching squares.
 */

import type { Bounds, Slope } from "./odeSolvers.js";

/** One entry in the equation catalog. */
export type Equation = {
  /** Stable identifier, e.g. "x", "y", "xMinusY". */
  readonly id: string;
  /** Display text using Unicode math notation (language-neutral, not i18n). */
  readonly latex: string;
  readonly f: Slope;
  /** True when f depends on y only. */
  readonly autonomous: boolean;
  /** Constant solutions y = c (empty if none). */
  readonly equilibria: readonly number[];
  /** Particular solution through (x0, y0); omit when no elementary closed form. */
  readonly exact?: (x0: number, y0: number) => (x: number) => number;
  /** Default viewing window. */
  readonly domain: Bounds;
};

const TWO_PI = 2 * Math.PI;

/**
 * Catalog of equations, in display order.
 */
export const EQUATIONS: readonly Equation[] = [
  {
    id: "x",
    latex: "y′ = x",
    f: (x: number, _y: number) => x,
    autonomous: false,
    equilibria: [],
    exact: (x0: number, y0: number) => (x: number) => y0 + (x * x - x0 * x0) / 2,
    domain: { xMin: -4, xMax: 4, yMin: -4, yMax: 4 },
  },
  {
    id: "y",
    latex: "y′ = y",
    f: (_x: number, y: number) => y,
    autonomous: true,
    equilibria: [0],
    exact: (x0: number, y0: number) => (x: number) => y0 * Math.exp(x - x0),
    domain: { xMin: -3, xMax: 3, yMin: -4, yMax: 4 },
  },
  {
    id: "xMinusY",
    latex: "y′ = x − y",
    f: (x: number, y: number) => x - y,
    autonomous: false,
    equilibria: [],
    exact: (x0: number, y0: number) => (x: number) => x - 1 + (y0 - x0 + 1) * Math.exp(-(x - x0)),
    domain: { xMin: -4, xMax: 4, yMin: -4, yMax: 4 },
  },
  {
    id: "xy",
    latex: "y′ = xy",
    f: (x: number, y: number) => x * y,
    autonomous: false,
    equilibria: [0],
    exact: (x0: number, y0: number) => (x: number) => y0 * Math.exp((x * x - x0 * x0) / 2),
    domain: { xMin: -3, xMax: 3, yMin: -4, yMax: 4 },
  },
  {
    id: "logistic",
    latex: "y′ = y(1 − y)",
    f: (_x: number, y: number) => y * (1 - y),
    autonomous: true,
    equilibria: [0, 1],
    exact: (x0: number, y0: number) => {
      if (y0 === 0) {
        return (_x: number) => 0;
      }
      if (y0 === 1) {
        return (_x: number) => 1;
      }
      const ratio = (1 - y0) / y0;
      return (x: number) => 1 / (1 + ratio * Math.exp(-(x - x0)));
    },
    domain: { xMin: -4, xMax: 4, yMin: -1, yMax: 2 },
  },
  {
    id: "sinX",
    latex: "y′ = sin x",
    f: (x: number, _y: number) => Math.sin(x),
    autonomous: false,
    equilibria: [],
    exact: (x0: number, y0: number) => (x: number) => y0 + Math.cos(x0) - Math.cos(x),
    domain: { xMin: -TWO_PI, xMax: TWO_PI, yMin: -4, yMax: 4 },
  },
  {
    id: "riccati",
    latex: "y′ = x² − y²",
    f: (x: number, y: number) => x * x - y * y,
    autonomous: false,
    equilibria: [],
    domain: { xMin: -3, xMax: 3, yMin: -3, yMax: 3 },
  },
  {
    id: "circle",
    latex: "y′ = −x / y",
    f: (x: number, y: number) => (y === 0 ? Number.NaN : -x / y),
    autonomous: false,
    equilibria: [],
    exact: (x0: number, y0: number) => {
      const r2 = x0 * x0 + y0 * y0;
      const sign = Math.sign(y0) || 1;
      return (x: number) => {
        const under = r2 - x * x;
        if (under < 0) {
          return Number.NaN;
        }
        return sign * Math.sqrt(under);
      };
    },
    domain: { xMin: -4, xMax: 4, yMin: -4, yMax: 4 },
  },
];

/** Look up an equation by id; throws if unknown. */
export function equationById(id: string): Equation {
  const found = EQUATIONS.find((eq) => eq.id === id);
  if (found === undefined) {
    throw new Error(`Unknown equation id: ${id}`);
  }
  return found;
}

type Point = readonly [number, number];
type Segment = readonly [Point, Point];

/**
 * Linearly interpolate the zero-crossing of `value` along an edge between
 * (x0,y0) with value v0 and (x1,y1) with value v1.
 */
function edgeCrossing(x0: number, y0: number, v0: number, x1: number, y1: number, v1: number): Point {
  const t = v0 / (v0 - v1);
  return [x0 + t * (x1 - x0), y0 + t * (y1 - y0)];
}

/** Sample f − c on an n×n grid over bounds. */
function sampleGrid(eq: Equation, c: number, bounds: Bounds, n: number): number[][] {
  const dx = (bounds.xMax - bounds.xMin) / (n - 1);
  const dy = (bounds.yMax - bounds.yMin) / (n - 1);
  const values: number[][] = [];
  for (let i = 0; i < n; i++) {
    const row: number[] = [];
    const x = bounds.xMin + i * dx;
    for (let j = 0; j < n; j++) {
      const y = bounds.yMin + j * dy;
      const v = eq.f(x, y) - c;
      row.push(Number.isFinite(v) ? v : Number.NaN);
    }
    values.push(row);
  }
  return values;
}

/** Corner bitmask: bit set when the corner value is above the level set. */
function cornerMask(v00: number, v10: number, v11: number, v01: number): number {
  let mask = 0;
  if (v00 > 0) {
    mask |= 1;
  }
  if (v10 > 0) {
    mask |= 2;
  }
  if (v11 > 0) {
    mask |= 4;
  }
  if (v01 > 0) {
    mask |= 8;
  }
  return mask;
}

/**
 * Marching-squares segments for one cell. Ambiguous saddles (masks 5, 10) emit
 * two segments using the average center value to pick connectivity.
 */
function cellSegments(
  mask: number,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  v00: number,
  v10: number,
  v11: number,
  v01: number,
): Segment[] {
  if (mask === 0 || mask === 15) {
    return [];
  }

  const bottom = (): Point => edgeCrossing(x0, y0, v00, x1, y0, v10);
  const right = (): Point => edgeCrossing(x1, y0, v10, x1, y1, v11);
  const top = (): Point => edgeCrossing(x0, y1, v01, x1, y1, v11);
  const left = (): Point => edgeCrossing(x0, y0, v00, x0, y1, v01);
  const center = (v00 + v10 + v11 + v01) / 4;

  switch (mask) {
    case 1:
    case 14:
      return [[left(), bottom()]];
    case 2:
    case 13:
      return [[bottom(), right()]];
    case 3:
    case 12:
      return [[left(), right()]];
    case 4:
    case 11:
      return [[right(), top()]];
    case 6:
    case 9:
      return [[bottom(), top()]];
    case 7:
    case 8:
      return [[left(), top()]];
    case 5:
      return center > 0
        ? [
            [left(), top()],
            [bottom(), right()],
          ]
        : [
            [left(), bottom()],
            [right(), top()],
          ];
    case 10:
      return center > 0
        ? [
            [left(), bottom()],
            [right(), top()],
          ]
        : [
            [left(), top()],
            [bottom(), right()],
          ];
    default:
      return [];
  }
}

/** Collect raw 2-point segments from a marching-squares pass. */
function marchingSquareSegments(values: readonly (readonly number[])[], bounds: Bounds, n: number): Segment[] {
  const dx = (bounds.xMax - bounds.xMin) / (n - 1);
  const dy = (bounds.yMax - bounds.yMin) / (n - 1);
  const segments: Segment[] = [];

  for (let i = 0; i < n - 1; i++) {
    const row0 = values[i];
    const row1 = values[i + 1];
    if (row0 === undefined || row1 === undefined) {
      continue;
    }
    const x0 = bounds.xMin + i * dx;
    const x1 = x0 + dx;
    for (let j = 0; j < n - 1; j++) {
      const v00 = row0[j];
      const v10 = row1[j];
      const v11 = row1[j + 1];
      const v01 = row0[j + 1];
      if (v00 === undefined || v10 === undefined || v11 === undefined || v01 === undefined) {
        continue;
      }
      if (![v00, v10, v11, v01].every(Number.isFinite)) {
        continue;
      }
      const y0 = bounds.yMin + j * dy;
      const y1 = y0 + dy;
      const mask = cornerMask(v00, v10, v11, v01);
      for (const seg of cellSegments(mask, x0, y0, x1, y1, v00, v10, v11, v01)) {
        segments.push(seg);
      }
    }
  }

  return segments;
}

const JOIN_EPS = 1e-9;

function pointsEqual(a: Point, b: Point): boolean {
  return Math.abs(a[0] - b[0]) < JOIN_EPS && Math.abs(a[1] - b[1]) < JOIN_EPS;
}

/** Try to attach `seg` to either end of `poly`; returns true if attached. */
function tryAttach(poly: Point[], seg: Segment): boolean {
  const head = poly[0];
  const tail = poly[poly.length - 1];
  if (head === undefined || tail === undefined) {
    return false;
  }
  const [a, b] = seg;
  if (pointsEqual(tail, a)) {
    poly.push(b);
    return true;
  }
  if (pointsEqual(tail, b)) {
    poly.push(a);
    return true;
  }
  if (pointsEqual(head, b)) {
    poly.unshift(a);
    return true;
  }
  if (pointsEqual(head, a)) {
    poly.unshift(b);
    return true;
  }
  return false;
}

/**
 * Greedily chain segments that share endpoints into polylines. Remaining
 * unjoined segments are returned as 2-point polylines.
 */
function joinSegments(segments: readonly Segment[]): Array<Array<readonly [number, number]>> {
  const unused: Segment[] = segments.slice();
  const polylines: Array<Array<readonly [number, number]>> = [];

  while (unused.length > 0) {
    const first = unused.pop();
    if (first === undefined) {
      break;
    }
    const poly: Point[] = [first[0], first[1]];
    let extended = true;
    while (extended) {
      extended = false;
      for (let i = unused.length - 1; i >= 0; i--) {
        const seg = unused[i];
        if (seg === undefined) {
          continue;
        }
        if (tryAttach(poly, seg)) {
          unused.splice(i, 1);
          extended = true;
        }
      }
    }
    polylines.push(poly);
  }

  return polylines;
}

/**
 * Marching-squares level set f(x, y) = c on a samples×samples grid over
 * `bounds`. Adjacent segments that share an endpoint are joined greedily into
 * longer polylines; isolated cell segments remain as 2-point polylines.
 */
export function isocline(
  eq: Equation,
  c: number,
  bounds: Bounds,
  samples = 200,
): Array<Array<readonly [number, number]>> {
  const n = Math.max(2, samples);
  const values = sampleGrid(eq, c, bounds, n);
  return joinSegments(marchingSquareSegments(values, bounds, n));
}

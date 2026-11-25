/**
 * GrowthModels.ts
 *
 * Autonomous growth / decay ODEs for the Growth Models screen:
 * exponential, Newton's cooling, logistic, and logistic with harvesting.
 */

/** Identifiers for the four growth models. */
export type GrowthModelId = "exponential" | "cooling" | "logistic" | "harvesting";

/** Shared parameter bag (each model reads the fields it needs). @public */
export type GrowthParameters = {
  readonly r: number;
  readonly K: number;
  readonly ambient: number;
  readonly harvest: number;
};

/** An equilibrium y* with local stability from the sign of f′(y*). @public */
export type Equilibrium = {
  readonly y: number;
  readonly stability: "stable" | "unstable" | "semistable";
};

export const GROWTH_MODEL_IDS: readonly GrowthModelId[] = ["exponential", "cooling", "logistic", "harvesting"];

const DERIV_EPS = 1e-9;

/**
 * Autonomous right-hand side f(y) for the named growth model.
 *
 * - exponential:  y′ = r y                  (r may be negative: decay)
 * - cooling:      y′ = −r (y − ambient)     (r > 0)
 * - logistic:     y′ = r y (1 − y/K)
 * - harvesting:   y′ = r y (1 − y/K) − harvest
 *
 * @public
 */
export function growthRate(id: GrowthModelId, p: GrowthParameters): (y: number) => number {
  switch (id) {
    case "exponential":
      return (y: number) => p.r * y;
    case "cooling":
      return (y: number) => -p.r * (y - p.ambient);
    case "logistic":
      return (y: number) => p.r * y * (1 - y / p.K);
    case "harvesting":
      return (y: number) => p.r * y * (1 - y / p.K) - p.harvest;
  }
}

/**
 * Classify stability from f′(y*): stable when < 0, unstable when > 0,
 * semistable when |f′| ≤ 1e-9.
 */
function classify(fPrime: number): Equilibrium["stability"] {
  if (Math.abs(fPrime) <= DERIV_EPS) {
    return "semistable";
  }
  return fPrime < 0 ? "stable" : "unstable";
}

/**
 * Equilibria sorted ascending, with local stability from f′(y*).
 *
 * Exponential with r = 0 returns [] (every y is an equilibrium). Harvesting
 * with harvest > rK/4 returns [] (no real equilibria). Harvesting exactly at
 * the critical harvest rK/4 yields one semistable equilibrium at K/2.
 *
 * @public
 */
export function growthEquilibria(id: GrowthModelId, p: GrowthParameters): Equilibrium[] {
  switch (id) {
    case "exponential": {
      // f(y) = r y, f′ = r. When r = 0 every y is an equilibrium — omit listing.
      if (p.r === 0) {
        return [];
      }
      return [{ y: 0, stability: classify(p.r) }];
    }
    case "cooling": {
      // f(y) = −r(y − ambient), f′ = −r.
      return [{ y: p.ambient, stability: classify(-p.r) }];
    }
    case "logistic": {
      // f(y) = r y (1 − y/K), f′(y) = r − 2(r/K)y.
      const at0 = classify(p.r);
      const atK = classify(p.r - (2 * p.r * p.K) / p.K);
      const list: Equilibrium[] = [
        { y: 0, stability: at0 },
        { y: p.K, stability: atK },
      ];
      return list.sort((a, b) => a.y - b.y);
    }
    case "harvesting": {
      // Solve r y (1 − y/K) − H = 0 → (r/K) y² − r y + H = 0.
      const H = p.harvest;
      const crit = criticalHarvest(p);
      if (H > crit) {
        return [];
      }
      // Discriminant of y² − K y + (H K / r) = 0.
      if (p.r === 0) {
        return [];
      }
      const disc = p.K * p.K - (4 * H * p.K) / p.r;
      if (disc < 0) {
        return [];
      }
      const sqrtDisc = Math.sqrt(disc);
      const yLower = (p.K - sqrtDisc) / 2;
      const yUpper = (p.K + sqrtDisc) / 2;
      // f′(y) = r − 2(r/K) y.
      const fPrime = (y: number): number => p.r - (2 * p.r * y) / p.K;
      if (Math.abs(H - crit) <= DERIV_EPS || Math.abs(sqrtDisc) <= DERIV_EPS) {
        const y = p.K / 2;
        return [{ y, stability: "semistable" }];
      }
      return [
        { y: yLower, stability: classify(fPrime(yLower)) },
        { y: yUpper, stability: classify(fPrime(yUpper)) },
      ].sort((a, b) => a.y - b.y);
    }
  }
}

/** Critical harvest rate H* = r K / 4 (onset of extinction). @public */
export function criticalHarvest(p: GrowthParameters): number {
  return (p.r * p.K) / 4;
}

/**
 * Closed-form solution starting at t = 0, or null for harvesting (integrate
 * numerically in the view).
 *
 * - exponential: y0 e^(r t)
 * - cooling:     ambient + (y0 − ambient) e^(−r t)
 * - logistic:    K / (1 + ((K − y0)/y0) e^(−r t)); y0 = 0 → 0
 *
 * @public
 */
export function growthSolution(id: GrowthModelId, p: GrowthParameters, y0: number): ((t: number) => number) | null {
  switch (id) {
    case "exponential":
      return (t: number) => y0 * Math.exp(p.r * t);
    case "cooling":
      return (t: number) => p.ambient + (y0 - p.ambient) * Math.exp(-p.r * t);
    case "logistic": {
      if (y0 === 0) {
        return (_t: number) => 0;
      }
      const ratio = (p.K - y0) / y0;
      return (t: number) => p.K / (1 + ratio * Math.exp(-p.r * t));
    }
    case "harvesting":
      return null;
  }
}

/**
 * Characteristic time scale, or null when none applies.
 *
 * - exponential: doubling ln 2 / r when r > 0; half-life ln 2 / |r| when r < 0; null if r = 0
 * - cooling: half-life of the temperature difference ln 2 / r
 * - logistic / harvesting: null
 *
 * @public
 */
export function characteristicTime(
  id: GrowthModelId,
  p: GrowthParameters,
): { kind: "doubling" | "halfLife"; value: number } | null {
  switch (id) {
    case "exponential": {
      if (p.r > 0) {
        return { kind: "doubling", value: Math.LN2 / p.r };
      }
      if (p.r < 0) {
        return { kind: "halfLife", value: Math.LN2 / Math.abs(p.r) };
      }
      return null;
    }
    case "cooling":
      return { kind: "halfLife", value: Math.LN2 / p.r };
    case "logistic":
    case "harvesting":
      return null;
  }
}

/** Logistic inflection height K/2. @public */
export function logisticInflection(p: GrowthParameters): number {
  return p.K / 2;
}

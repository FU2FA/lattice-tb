import type { BandColorMode, TBModel } from "./tbTypes";
import { buildHamiltonian } from "./buildHamiltonian";
import { hermitianEigenvalues, hermitianEigensystem } from "../math/eigensolver";
import { reciprocalFracToCart } from "../lattice/reciprocal";
import { estimateFermiEnergyFromKGridStates } from "./fermiLevel";

export type DOSProjectionMode = "total" | BandColorMode;

export interface DOSPoint {
  energy: number;
  total: number;
  projected?: number;
}

export interface DOSResult {
  modelName: string;
  points: DOSPoint[];
  projectionMode: DOSProjectionMode;
  kGridSize: number;
  broadening: number;
  sampleCount: number;
  energyMin: number;
  energyMax: number;
  fermiEnergy?: number;
  electronsPerCell?: number;
}

export interface DOSOptions {
  kGridSize: number;
  broadening: number;
  binCount?: number;
  projectionMode?: DOSProjectionMode;
  electronsPerCell?: number;
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function projectionWeightForMode(
  model: TBModel,
  orbitalWeights: number[],
  mode: DOSProjectionMode,
): number {
  if (mode === "total" || mode === "plain") return 1;

  let total = 0;

  for (let i = 0; i < model.orbitals.length; i++) {
    const orbital = model.orbitals[i];
    const weight = orbitalWeights[i] ?? 0;

    if (mode === "s" && orbital.kind === "s") total += weight;
    else if (mode === "p" && (orbital.kind === "px" || orbital.kind === "py" || orbital.kind === "pz")) total += weight;
    else if (mode === orbital.kind) total += weight;
    else if (mode === "site0" && orbital.site === 0) total += weight;
    else if (mode === "site1" && orbital.site === 1) total += weight;
  }

  return clamp01(total);
}

function sampleKFractions(dim: 2 | 3, n: number): Array<[number, number, number]> {
  const out: Array<[number, number, number]> = [];
  const safeN = Math.max(2, Math.round(n));

  // Cell-centered Monkhorst-Pack-like sampling over the reciprocal primitive cell.
  // It is not clipped to the Wigner-Seitz BZ; for DOS of a periodic band this
  // primitive-cell integration is still a valid first approximation.
  for (let i = 0; i < safeN; i++) {
    for (let j = 0; j < safeN; j++) {
      const kMin = dim === 2 ? 0 : 0;
      const kMax = dim === 2 ? 0 : safeN - 1;

      for (let k = kMin; k <= kMax; k++) {
        out.push([
          (i + 0.5) / safeN - 0.5,
          (j + 0.5) / safeN - 0.5,
          dim === 2 ? 0 : (k + 0.5) / safeN - 0.5,
        ]);
      }
    }
  }

  return out;
}

function gaussian(x: number, sigma: number): number {
  const s = Math.max(1e-6, sigma);
  return Math.exp(-0.5 * (x / s) ** 2) / (s * Math.sqrt(2 * Math.PI));
}

export function solveDOS(model: TBModel, options: DOSOptions): DOSResult {
  const kGridSize = Math.max(2, Math.min(model.lattice.dim === 2 ? 160 : 36, Math.round(options.kGridSize)));
  const broadening = Math.max(1e-4, Math.min(10, options.broadening));
  const binCount = Math.max(80, Math.min(1200, Math.round(options.binCount ?? 280)));
  const projectionMode = options.projectionMode ?? "total";

  const needProjection = projectionMode !== "total" && projectionMode !== "plain";
  const samples = sampleKFractions(model.lattice.dim, kGridSize);

  const states: Array<{ energy: number; weight: number }> = [];
  const allEnergiesForFermi: number[] = [];

  for (const kFrac of samples) {
    const k = reciprocalFracToCart(model.lattice, kFrac);
    const H = buildHamiltonian(model, k);

    if (needProjection) {
      const system = hermitianEigensystem(H);
      for (let band = 0; band < system.values.length; band++) {
        states.push({
          energy: system.values[band],
          weight: projectionWeightForMode(model, system.weights[band], projectionMode),
        });
        allEnergiesForFermi.push(system.values[band]);
      }
    } else {
      const values = hermitianEigenvalues(H);
      for (const energy of values) {
        states.push({ energy, weight: 1 });
        allEnergiesForFermi.push(energy);
      }
    }
  }

  let eMin = Math.min(...states.map((state) => state.energy));
  let eMax = Math.max(...states.map((state) => state.energy));

  if (!Number.isFinite(eMin) || !Number.isFinite(eMax)) {
    eMin = -1;
    eMax = 1;
  }

  if (Math.abs(eMax - eMin) < 1e-8) {
    eMin -= 1;
    eMax += 1;
  }

  const pad = Math.max(4 * broadening, 0.04 * (eMax - eMin));
  eMin -= pad;
  eMax += pad;

  const dE = (eMax - eMin) / (binCount - 1);
  const norm = 1 / samples.length;

  const points: DOSPoint[] = Array.from({ length: binCount }, (_, i) => ({
    energy: eMin + i * dE,
    total: 0,
    projected: needProjection ? 0 : undefined,
  }));

  for (const state of states) {
    const center = Math.round((state.energy - eMin) / dE);
    const span = Math.max(3, Math.ceil((5 * broadening) / dE));
    const i0 = Math.max(0, center - span);
    const i1 = Math.min(points.length - 1, center + span);

    for (let i = i0; i <= i1; i++) {
      const g = gaussian(points[i].energy - state.energy, broadening) * norm;
      points[i].total += g;
      if (needProjection) {
        points[i].projected = (points[i].projected ?? 0) + state.weight * g;
      }
    }
  }

  const fermiEnergy = options.electronsPerCell !== undefined
    ? estimateFermiEnergyFromKGridStates(
        allEnergiesForFermi,
        model.orbitals.length,
        options.electronsPerCell,
      )
    : undefined;

  return {
    modelName: model.name,
    points,
    projectionMode,
    kGridSize,
    broadening,
    sampleCount: samples.length,
    energyMin: eMin,
    energyMax: eMax,
    fermiEnergy,
    electronsPerCell: options.electronsPerCell,
  };
}

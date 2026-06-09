import type { BandColorMode, BandResult, TBModel } from "./tbTypes";
import { makeBandPath } from "./bandPath";
import { buildHamiltonian } from "./buildHamiltonian";
import { hermitianEigenvalues, hermitianEigensystem } from "../math/eigensolver";
import { estimateFermiEnergyFromBandPath } from "./fermiLevel";

function bandWeightForMode(model: TBModel, orbitalWeights: number[], mode: BandColorMode): number {
  if (mode === "plain") return 0;

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

  return Math.max(0, Math.min(1, total));
}

export function solveBands(
  model: TBModel,
  pathLabels: string[],
  pointsPerSegment: number,
  colorMode: BandColorMode = "plain",
  electronsPerCell?: number,
): BandResult {
  const path = makeBandPath(model.lattice, pathLabels, pointsPerSegment);

  const points = path.map((p) => {
    const H = buildHamiltonian(model, p.k);

    if (colorMode === "plain") {
      const energies = hermitianEigenvalues(H);
      return {
        x: p.x,
        label: p.label,
        k: p.k,
        energies,
      };
    }

    const system = hermitianEigensystem(H);
    return {
      x: p.x,
      label: p.label,
      k: p.k,
      energies: system.values,
      colorWeights: system.weights.map((weights) => bandWeightForMode(model, weights, colorMode)),
    };
  });

  const fermiEnergy = electronsPerCell !== undefined
    ? estimateFermiEnergyFromBandPath(points.map((point) => point.energies), electronsPerCell)
    : undefined;

  return {
    modelName: model.name,
    points,
    bandCount: model.orbitals.length,
    colorMode,
    fermiEnergy,
    electronsPerCell,
  };
}

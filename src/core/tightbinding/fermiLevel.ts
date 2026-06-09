export interface FermiOptions {
  electronsPerCell: number;
  spinDegeneracy?: number;
}

export function estimateFermiEnergyFromEnergies(
  energies: number[],
  options: FermiOptions,
): number | undefined {
  if (energies.length === 0) return undefined;

  const spinDegeneracy = options.spinDegeneracy ?? 2;
  const electronsPerCell = Math.max(0, options.electronsPerCell);

  if (electronsPerCell <= 0) {
    return Math.min(...energies);
  }

  const sorted = energies
    .filter((value) => Number.isFinite(value))
    .sort((a, b) => a - b);

  if (sorted.length === 0) return undefined;

  // Each sampled eigenvalue represents spinDegeneracy electrons per k-point.
  // For a band calculation path, this is an approximate visual EF only.
  // For DOS k-grid sampling, this is a better primitive-cell filling estimate.
  const occupiedStateCount = electronsPerCell / spinDegeneracy;
  const index = Math.min(
    sorted.length - 1,
    Math.max(0, Math.ceil((occupiedStateCount / Math.max(1, sorted.length / Math.max(1, sorted.length))) - 1)),
  );

  return sorted[index];
}

export function estimateFermiEnergyFromBandPath(
  pathEnergies: number[][],
  electronsPerCell: number,
  spinDegeneracy = 2,
): number | undefined {
  const pointCount = pathEnergies.length;
  if (pointCount === 0) return undefined;

  const all = pathEnergies.flat().filter((value) => Number.isFinite(value));
  if (all.length === 0) return undefined;

  const sorted = all.sort((a, b) => a - b);
  const statesPerK = pathEnergies[0]?.length ?? 1;

  // Fraction of bands filled per k-point.
  const filledBands = electronsPerCell / spinDegeneracy;
  const fillFraction = Math.max(0, Math.min(1, filledBands / Math.max(1, statesPerK)));
  const idx = Math.min(sorted.length - 1, Math.max(0, Math.ceil(fillFraction * sorted.length) - 1));

  return sorted[idx];
}

export function estimateFermiEnergyFromKGridStates(
  energies: number[],
  bandCount: number,
  electronsPerCell: number,
  spinDegeneracy = 2,
): number | undefined {
  if (energies.length === 0 || bandCount <= 0) return undefined;

  const sorted = energies.filter((v) => Number.isFinite(v)).sort((a, b) => a - b);
  if (sorted.length === 0) return undefined;

  const sampleCount = Math.max(1, sorted.length / bandCount);
  const occupiedPerK = electronsPerCell / spinDegeneracy;
  const occupiedTotal = occupiedPerK * sampleCount;

  const idx = Math.min(sorted.length - 1, Math.max(0, Math.ceil(occupiedTotal) - 1));
  return sorted[idx];
}

import type { ComplexMatrix } from "./matrix";
import { hermitianToRealBlock } from "./matrix";

function cloneMatrix(A: number[][]): number[][] {
  return A.map((row) => row.slice());
}

interface RealEigenSystem {
  values: number[];
  vectors: number[][]; // vectors[col][row]
}

function jacobiEigenSystemSymmetric(Ain: number[][], maxIter = 200): RealEigenSystem {
  const A = cloneMatrix(Ain);
  const n = A.length;
  const V: number[][] = Array.from({ length: n }, (_, i) =>
    Array.from({ length: n }, (_, j) => (i === j ? 1 : 0)),
  );

  for (let iter = 0; iter < maxIter; iter++) {
    let p = 0;
    let q = 1;
    let max = 0;

    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const value = Math.abs(A[i][j]);
        if (value > max) {
          max = value;
          p = i;
          q = j;
        }
      }
    }

    if (max < 1e-10) break;

    const app = A[p][p];
    const aqq = A[q][q];
    const apq = A[p][q];

    const phi = 0.5 * Math.atan2(2 * apq, aqq - app);
    const co = Math.cos(phi);
    const si = Math.sin(phi);

    for (let k = 0; k < n; k++) {
      if (k !== p && k !== q) {
        const aik = A[k][p];
        const akq = A[k][q];

        A[k][p] = co * aik - si * akq;
        A[p][k] = A[k][p];

        A[k][q] = si * aik + co * akq;
        A[q][k] = A[k][q];
      }
    }

    A[p][p] = co * co * app - 2 * si * co * apq + si * si * aqq;
    A[q][q] = si * si * app + 2 * si * co * apq + co * co * aqq;
    A[p][q] = 0;
    A[q][p] = 0;

    for (let k = 0; k < n; k++) {
      const vip = V[k][p];
      const viq = V[k][q];
      V[k][p] = co * vip - si * viq;
      V[k][q] = si * vip + co * viq;
    }
  }

  const pairs = A.map((row, i) => ({
    value: row[i],
    vector: V.map((vrow) => vrow[i]),
  })).sort((a, b) => a.value - b.value);

  return {
    values: pairs.map((p) => p.value),
    vectors: pairs.map((p) => p.vector),
  };
}

function jacobiEigenvaluesSymmetric(Ain: number[][], maxIter = 200): number[] {
  return jacobiEigenSystemSymmetric(Ain, maxIter).values;
}

export function hermitianEigenvalues(H: ComplexMatrix): number[] {
  const n = H.length;
  const block = hermitianToRealBlock(H);
  const doubled = jacobiEigenvaluesSymmetric(block, Math.max(200, 40 * block.length * block.length));

  const values: number[] = [];
  for (let i = 0; i < n; i++) {
    const a = doubled[2 * i];
    const b = doubled[2 * i + 1];
    values.push((a + b) * 0.5);
  }

  return values;
}

export interface HermitianEigenSystem {
  values: number[];
  weights: number[][]; // weights[band][orbitalIndex]
}

export function hermitianEigensystem(H: ComplexMatrix): HermitianEigenSystem {
  const n = H.length;
  const block = hermitianToRealBlock(H);
  const doubled = jacobiEigenSystemSymmetric(block, Math.max(200, 40 * block.length * block.length));

  const values: number[] = [];
  const weights: number[][] = [];

  for (let i = 0; i < n; i++) {
    const a = doubled.values[2 * i];
    const b = doubled.values[2 * i + 1];
    values.push((a + b) * 0.5);

    // The real block doubles each complex eigenvalue. One vector from the pair is
    // enough for orbital weights; normalize for numerical safety.
    const vector = doubled.vectors[2 * i];
    const bandWeights = Array.from({ length: n }, (_, orb) => {
      const re = vector[orb] ?? 0;
      const im = vector[orb + n] ?? 0;
      return re * re + im * im;
    });

    const sum = bandWeights.reduce((acc, v) => acc + v, 0) || 1;
    weights.push(bandWeights.map((v) => v / sum));
  }

  return { values, weights };
}

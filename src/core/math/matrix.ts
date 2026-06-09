import type { Complex } from "./complex";
import { C0, cadd, cconj } from "./complex";

export type ComplexMatrix = Complex[][];

export function zerosComplex(n: number, m: number): ComplexMatrix {
  return Array.from({ length: n }, () =>
    Array.from({ length: m }, () => ({ ...C0 })),
  );
}

export function addTo(H: ComplexMatrix, i: number, j: number, value: Complex): void {
  H[i][j] = cadd(H[i][j], value);
}

export function hermitianToRealBlock(H: ComplexMatrix): number[][] {
  const n = H.length;
  const A = Array.from({ length: 2 * n }, () => Array(2 * n).fill(0));

  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      const z = H[i][j];
      A[i][j] = z.re;
      A[i][j + n] = -z.im;
      A[i + n][j] = z.im;
      A[i + n][j + n] = z.re;
    }
  }

  return A;
}

export function assertHermitian(H: ComplexMatrix, eps = 1e-7): boolean {
  const n = H.length;
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      const a = H[i][j];
      const b = cconj(H[j][i]);
      if (Math.abs(a.re - b.re) > eps || Math.abs(a.im - b.im) > eps) {
        return false;
      }
    }
  }
  return true;
}

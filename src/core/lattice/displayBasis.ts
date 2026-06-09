import type { Lattice } from "./types";
import type { Vec3 } from "../math/vec";
import { cross, dot } from "../math/vec";

export interface CellBasis {
  a: Vec3;
  b: Vec3;
  c: Vec3;
}

export function displayCellBasis(lattice: Lattice): CellBasis {
  return lattice.simpleCellBasis ?? lattice.conventionalBasis ?? {
    a: lattice.a,
    b: lattice.b,
    c: lattice.c,
  };
}

export function solveFractionalInBasis(point: Vec3, basis: CellBasis): Vec3 | null {
  const det = dot(basis.a, cross(basis.b, basis.c));
  if (Math.abs(det) < 1e-10) return null;

  return [
    dot(point, cross(basis.b, basis.c)) / det,
    dot(basis.a, cross(point, basis.c)) / det,
    dot(basis.a, cross(basis.b, point)) / det,
  ];
}

function cellOrigin(basis: CellBasis, i: number, j: number, k: number): Vec3 {
  return [
    i * basis.a[0] + j * basis.b[0] + k * basis.c[0],
    i * basis.a[1] + j * basis.b[1] + k * basis.c[1],
    i * basis.a[2] + j * basis.b[2] + k * basis.c[2],
  ];
}

function subtract(a: Vec3, b: Vec3): Vec3 {
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
}

export function isInsideSingleHexPrism(
  position: Vec3,
  basis: CellBasis,
  centerBottom: Vec3,
  eps: number,
): boolean {
  const local = solveFractionalInBasis(subtract(position, centerBottom), basis);
  if (!local) return false;

  const [u, v, w] = local;

  // The rendered hexagon is the Wigner-Seitz cell of the 2D center lattice
  // spanned by basis.a and basis.b. In fractional coordinates of that center
  // lattice, its vertices are
  //   ( 2/3,-1/3), ( 1/3, 1/3), (-1/3, 2/3),
  //   (-2/3, 1/3), (-1/3,-1/3), ( 1/3,-2/3).
  // Therefore the filled hexagon is:
  //   max(|u|, |v|, |u+v|) <= 2/3
  const insideHex =
    Math.abs(u) <= 2 / 3 + eps &&
    Math.abs(v) <= 2 / 3 + eps &&
    Math.abs(u + v) <= 2 / 3 + eps;

  return insideHex && w >= -eps && w <= 1 + eps;
}

export function isInsideHexPrismDisplayCellBlock(
  position: Vec3,
  lattice: Lattice,
  minFrac: Vec3,
  maxFrac: Vec3,
  eps: number,
): boolean {
  const basis = displayCellBasis(lattice);

  const i0 = Math.floor(minFrac[0]);
  const i1 = Math.ceil(maxFrac[0]) - 1;
  const j0 = Math.floor(minFrac[1]);
  const j1 = Math.ceil(maxFrac[1]) - 1;
  const k0 = lattice.dim === 2 ? 0 : Math.floor(minFrac[2]);
  const k1 = lattice.dim === 2 ? 0 : Math.ceil(maxFrac[2]) - 1;

  for (let i = i0; i <= i1; i++) {
    for (let j = j0; j <= j1; j++) {
      for (let k = k0; k <= k1; k++) {
        const centerBottom = cellOrigin(basis, i, j, k);
        if (isInsideSingleHexPrism(position, basis, centerBottom, eps)) {
          return true;
        }
      }
    }
  }

  return false;
}

export function isInsideDisplayCellBlock(
  position: Vec3,
  lattice: Lattice,
  minFrac: Vec3,
  maxFrac: Vec3,
  eps = 1e-8,
): boolean {
  if (lattice.displayCellShape === "hex_prism" && lattice.dim === 3) {
    return isInsideHexPrismDisplayCellBlock(position, lattice, minFrac, maxFrac, eps);
  }

  const basis = displayCellBasis(lattice);
  const f = solveFractionalInBasis(position, basis);
  if (!f) return true;

  return (
    f[0] >= minFrac[0] - eps &&
    f[0] <= maxFrac[0] + eps &&
    f[1] >= minFrac[1] - eps &&
    f[1] <= maxFrac[1] + eps &&
    (lattice.dim === 2 || (f[2] >= minFrac[2] - eps && f[2] <= maxFrac[2] + eps))
  );
}

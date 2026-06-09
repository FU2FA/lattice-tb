import type { Lattice } from "./types";
import type { Vec3 } from "../math/vec";

export interface PhysicalScale3D {
  x: number;
  y: number;
  z: number;
}

export function sanitizePhysicalScale(scale: PhysicalScale3D): PhysicalScale3D {
  return {
    x: clampFinite(scale.x, 0.05, 20, 1),
    y: clampFinite(scale.y, 0.05, 20, 1),
    z: clampFinite(scale.z, 0.05, 20, 1),
  };
}

export function scaleLattice(lattice: Lattice, factor: number): Lattice {
  return scaleLatticeAnisotropic(lattice, { x: factor, y: factor, z: factor });
}

export function scaleLatticeAnisotropic(lattice: Lattice, scaleInput: PhysicalScale3D): Lattice {
  const scale = sanitizePhysicalScale(scaleInput);

  const scaledA = scaleCartesianVector(lattice.a, scale);
  const scaledB = scaleCartesianVector(lattice.b, scale);
  const scaledC = scaleCartesianVector(lattice.c, scale);

  const maxScale = Math.max(scale.x, scale.y, scale.z);

  return {
    ...lattice,
    a: scaledA,
    b: scaledB,
    c: scaledC,
    conventionalBasis: lattice.conventionalBasis
      ? {
          a: scaleCartesianVector(lattice.conventionalBasis.a, scale),
          b: scaleCartesianVector(lattice.conventionalBasis.b, scale),
          c: scaleCartesianVector(lattice.conventionalBasis.c, scale),
        }
      : undefined,
    simpleCellBasis: lattice.simpleCellBasis
      ? {
          a: scaleCartesianVector(lattice.simpleCellBasis.a, scale),
          b: scaleCartesianVector(lattice.simpleCellBasis.b, scale),
          c: scaleCartesianVector(lattice.simpleCellBasis.c, scale),
        }
      : undefined,
    sites: lattice.sites.map((site) => ({ ...site, position: [...site.position] })),
    visualSites: lattice.visualSites?.map((site) => ({ ...site, position: [...site.position] })),
    highSymmetry: { ...lattice.highSymmetry },
    visualBondCutoff: lattice.visualBondCutoff * maxScale,
  };
}

function scaleCartesianVector(v: Vec3, scale: PhysicalScale3D): Vec3 {
  return [v[0] * scale.x, v[1] * scale.y, v[2] * scale.z];
}

function clampFinite(value: number, min: number, max: number, fallback: number): number {
  if (!Number.isFinite(value)) return fallback;
  return Math.max(min, Math.min(max, value));
}

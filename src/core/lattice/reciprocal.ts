import type { Vec3 } from "../math/vec";
import type { Lattice } from "./types";
import { cross, dot, vscale, vadd } from "../math/vec";

export interface ReciprocalBasis {
  b1: Vec3;
  b2: Vec3;
  b3: Vec3;
}

export function reciprocalBasis(lattice: Lattice): ReciprocalBasis {
  const { a, b, c } = lattice;
  const volume = dot(a, cross(b, c));

  if (Math.abs(volume) < 1e-12) {
    throw new Error("Invalid lattice vectors: volume is zero.");
  }

  return {
    b1: vscale(cross(b, c), (2 * Math.PI) / volume),
    b2: vscale(cross(c, a), (2 * Math.PI) / volume),
    b3: vscale(cross(a, b), (2 * Math.PI) / volume),
  };
}

export function reciprocalFracToCart(lattice: Lattice, kFrac: Vec3): Vec3 {
  const { b1, b2, b3 } = reciprocalBasis(lattice);

  return vadd(
    vadd(vscale(b1, kFrac[0]), vscale(b2, kFrac[1])),
    vscale(b3, kFrac[2]),
  );
}

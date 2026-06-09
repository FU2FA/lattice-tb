import type { Vec3 } from "../math/vec";
import type { Lattice } from "../lattice/types";
import { lerp, norm, vsub } from "../math/vec";
import { reciprocalFracToCart } from "../lattice/reciprocal";

export interface KPathPoint {
  x: number;
  label?: string;
  k: Vec3;
}

export function makeBandPath(lattice: Lattice, labels: string[], pointsPerSegment: number): KPathPoint[] {
  if (labels.length < 2) throw new Error("Band path needs at least two labels.");

  const fracPoints = labels.map((label) => {
    const point = lattice.highSymmetry[label];
    if (!point) throw new Error(`Unknown high-symmetry point ${label}`);
    return point;
  });

  const path: KPathPoint[] = [];
  let x = 0;

  for (let s = 0; s < fracPoints.length - 1; s++) {
    const start = fracPoints[s];
    const end = fracPoints[s + 1];

    const k0 = reciprocalFracToCart(lattice, start.kFrac);
    const k1 = reciprocalFracToCart(lattice, end.kFrac);
    const segmentLength = norm(vsub(k1, k0));

    for (let i = 0; i <= pointsPerSegment; i++) {
      if (s > 0 && i === 0) continue;

      const t = i / pointsPerSegment;
      const k = lerp(k0, k1, t);

      path.push({
        x: x + segmentLength * t,
        label: i === 0 ? start.label : i === pointsPerSegment ? end.label : undefined,
        k,
      });
    }

    x += segmentLength;
  }

  return path;
}

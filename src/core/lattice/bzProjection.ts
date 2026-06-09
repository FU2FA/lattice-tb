import type { Lattice } from "./types";
import type { Vec3 } from "../math/vec";
import { buildVoronoiCell3D } from "../math/geometry";
import { cross, dot, norm, normalize, vscale, vsub } from "../math/vec";
import { reciprocalFracToCart } from "./reciprocal";
import { reciprocalBasis } from "./reciprocal";

function boundaryCell3D(lattice: Lattice) {
  const { b1, b2, b3 } = reciprocalBasis(lattice);
  return buildVoronoiCell3D([b1, b2, b3], 2);
}

function projectRayToConvexCellBoundary(direction: Vec3, lattice: Lattice): Vec3 {
  const dir = normalize(direction);
  if (norm(dir) < 1e-10) return [0, 0, 0];

  const cell = boundaryCell3D(lattice);
  let bestT = Number.POSITIVE_INFINITY;

  for (const face of cell.faces) {
    if (face.length < 3) continue;

    const p0 = cell.vertices[face[0]];
    let normal: Vec3 | null = null;

    for (let i = 1; i < face.length - 1; i++) {
      const a = vsub(cell.vertices[face[i]], p0);
      const b = vsub(cell.vertices[face[i + 1]], p0);
      const n = cross(a, b);

      if (norm(n) > 1e-9) {
        normal = n;
        break;
      }
    }

    if (!normal) continue;

    // Orient the normal so that the origin is inside n·x <= offset.
    let offset = dot(normal, p0);
    if (offset < 0) {
      normal = vscale(normal, -1);
      offset = -offset;
    }

    const denom = dot(normal, dir);
    if (denom <= 1e-10) continue;

    const t = offset / denom;
    if (t > 1e-10 && t < bestT) {
      bestT = t;
    }
  }

  if (!Number.isFinite(bestT)) {
    return direction;
  }

  return vscale(dir, bestT);
}

export function projectedReciprocalPointForDisplay(lattice: Lattice, kFrac: Vec3): Vec3 {
  const raw = reciprocalFracToCart(lattice, kFrac);

  // 2D K/M definitions are already adjusted explicitly in fractional space.
  // For 3D, anisotropic real-space scale can deform the reciprocal Wigner-Seitz
  // cell so that a preset fractional "high-symmetry" point no longer lands on
  // the displayed BZ boundary. Project nonzero labeled points along the same
  // Γ→point direction to the current BZ boundary.
  if (lattice.dim !== 3 || norm(raw) < 1e-10) {
    return raw;
  }

  return projectRayToConvexCellBoundary(raw, lattice);
}

export function projectedHighSymmetryPointForDisplay(lattice: Lattice, label: string): Vec3 | null {
  const point = lattice.highSymmetry[label];
  if (!point) return null;
  return projectedReciprocalPointForDisplay(lattice, point.kFrac);
}

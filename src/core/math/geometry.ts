import type { Vec3 } from "./vec";
import { cross, dot, norm, vadd, vscale, vsub } from "./vec";

export interface Plane {
  normal: Vec3;
  offset: number; // normal dot x <= offset
}

export interface CellGeometry {
  vertices: Vec3[];
  edges: [number, number][];
  faces: number[][];
}

export function det3(a: Vec3, b: Vec3, c: Vec3): number {
  return dot(a, cross(b, c));
}

export function solve3x3Rows(n1: Vec3, n2: Vec3, n3: Vec3, d1: number, d2: number, d3: number): Vec3 | null {
  const denom = det3(n1, n2, n3);
  if (Math.abs(denom) < 1e-10) return null;

  const term1 = vscale(cross(n2, n3), d1);
  const term2 = vscale(cross(n3, n1), d2);
  const term3 = vscale(cross(n1, n2), d3);

  return vscale(vadd(vadd(term1, term2), term3), 1 / denom);
}

function closeVec(a: Vec3, b: Vec3, eps: number): boolean {
  return norm(vsub(a, b)) < eps;
}

function addUniqueVertex(vertices: Vec3[], v: Vec3, eps = 1e-6): number {
  const found = vertices.findIndex((u) => closeVec(u, v, eps));
  if (found >= 0) return found;

  vertices.push(v);
  return vertices.length - 1;
}

function satisfiesAll(v: Vec3, planes: Plane[], eps = 1e-7): boolean {
  return planes.every((p) => dot(p.normal, v) <= p.offset + eps);
}

function makeCandidatePlanes3D(vectors: Vec3[], range: number): Plane[] {
  const raw: { vector: Vec3; length: number }[] = [];

  for (let i = -range; i <= range; i++) {
    for (let j = -range; j <= range; j++) {
      for (let k = -range; k <= range; k++) {
        if (i === 0 && j === 0 && k === 0) continue;

        const R = vadd(vadd(vscale(vectors[0], i), vscale(vectors[1], j)), vscale(vectors[2], k));
        const len = norm(R);
        if (len < 1e-9) continue;
        raw.push({ vector: R, length: len });
      }
    }
  }

  // A Wigner-Seitz cell is the intersection of half-spaces closer to the origin
  // than to every lattice point. In practice, only short neighbor vectors matter.
  // We keep enough shortest vectors to include the true relevant bisectors and
  // remove redundant planes later by checking whether their face has vertices.
  raw.sort((a, b) => a.length - b.length);

  const keep = raw.slice(0, Math.min(raw.length, 48));

  return keep.map(({ vector }) => ({
    normal: vector,
    offset: dot(vector, vector) * 0.5,
  }));
}

function makeCandidatePlanes2D(vectors: Vec3[], range: number): Plane[] {
  const raw: { vector: Vec3; length: number }[] = [];

  for (let i = -range; i <= range; i++) {
    for (let j = -range; j <= range; j++) {
      if (i === 0 && j === 0) continue;

      const R = vadd(vscale(vectors[0], i), vscale(vectors[1], j));
      const len = norm(R);
      if (len < 1e-9) continue;
      raw.push({ vector: R, length: len });
    }
  }

  raw.sort((a, b) => a.length - b.length);
  const keep = raw.slice(0, Math.min(raw.length, 24));

  return keep.map(({ vector }) => ({
    normal: vector,
    offset: dot(vector, vector) * 0.5,
  }));
}

export function buildVoronoiCell3D(vectors: Vec3[], range = 2): CellGeometry {
  const planes = makeCandidatePlanes3D(vectors, range);
  const vertices: Vec3[] = [];
  const planeVertexIds: number[][] = Array.from({ length: planes.length }, () => []);

  for (let a = 0; a < planes.length; a++) {
    for (let b = a + 1; b < planes.length; b++) {
      for (let c = b + 1; c < planes.length; c++) {
        const p = solve3x3Rows(
          planes[a].normal,
          planes[b].normal,
          planes[c].normal,
          planes[a].offset,
          planes[b].offset,
          planes[c].offset,
        );

        if (!p) continue;
        if (!satisfiesAll(p, planes)) continue;

        const id = addUniqueVertex(vertices, p);
        planeVertexIds[a].push(id);
        planeVertexIds[b].push(id);
        planeVertexIds[c].push(id);
      }
    }
  }

  const edgeSet = new Set<string>();
  const faces: number[][] = [];

  for (let pi = 0; pi < planes.length; pi++) {
    const ids = Array.from(new Set(planeVertexIds[pi]));
    if (ids.length < 3) continue;

    const n = planes[pi].normal;
    const center = ids
      .map((id) => vertices[id])
      .reduce((acc, v) => vadd(acc, v), [0, 0, 0] as Vec3);
    const faceCenter = vscale(center, 1 / ids.length);

    const ref: Vec3 = Math.abs(n[0]) < 0.8 ? [1, 0, 0] : [0, 1, 0];
    const rawU = cross(n, ref);
    const lenU = norm(rawU);
    const u = lenU < 1e-10 ? [1, 0, 0] as Vec3 : vscale(rawU, 1 / lenU);

    const rawV = cross(n, u);
    const lenV = norm(rawV);
    const vAxis = lenV < 1e-10 ? [0, 1, 0] as Vec3 : vscale(rawV, 1 / lenV);

    const sorted = ids.slice().sort((ia, ib) => {
      const da = vsub(vertices[ia], faceCenter);
      const db = vsub(vertices[ib], faceCenter);
      const aa = Math.atan2(dot(da, vAxis), dot(da, u));
      const ab = Math.atan2(dot(db, vAxis), dot(db, u));
      return aa - ab;
    });

    faces.push(sorted);

    for (let i = 0; i < sorted.length; i++) {
      const a = sorted[i];
      const b = sorted[(i + 1) % sorted.length];
      const key = a < b ? `${a}:${b}` : `${b}:${a}`;
      edgeSet.add(key);
    }
  }

  const edges: [number, number][] = Array.from(edgeSet).map((key) => {
    const [a, b] = key.split(":").map(Number);
    return [a, b];
  });

  return { vertices, edges, faces };
}

export function buildVoronoiCell2D(vectors: Vec3[], range = 3): CellGeometry {
  const extent = 50;
  let polygon: Vec3[] = [
    [-extent, -extent, 0],
    [extent, -extent, 0],
    [extent, extent, 0],
    [-extent, extent, 0],
  ];

  const planes = makeCandidatePlanes2D(vectors, range);

  for (const plane of planes) {
    polygon = clipPolygonByPlane2D(polygon, plane);
    if (polygon.length === 0) break;
  }

  const vertices = polygon;
  const edges: [number, number][] = vertices.map((_, i) => [i, (i + 1) % vertices.length]);
  const faces = vertices.length >= 3 ? [vertices.map((_, i) => i)] : [];

  return { vertices, edges, faces };
}

function clipPolygonByPlane2D(poly: Vec3[], plane: Plane, eps = 1e-8): Vec3[] {
  const result: Vec3[] = [];

  for (let i = 0; i < poly.length; i++) {
    const current = poly[i];
    const next = poly[(i + 1) % poly.length];

    const currentIn = dot(plane.normal, current) <= plane.offset + eps;
    const nextIn = dot(plane.normal, next) <= plane.offset + eps;

    if (currentIn && nextIn) {
      result.push(next);
    } else if (currentIn && !nextIn) {
      const hit = intersectSegmentPlane(current, next, plane);
      if (hit) result.push(hit);
    } else if (!currentIn && nextIn) {
      const hit = intersectSegmentPlane(current, next, plane);
      if (hit) result.push(hit);
      result.push(next);
    }
  }

  return result;
}

function intersectSegmentPlane(a: Vec3, b: Vec3, plane: Plane): Vec3 | null {
  const ab = vsub(b, a);
  const denom = dot(plane.normal, ab);
  if (Math.abs(denom) < 1e-12) return null;

  const t = (plane.offset - dot(plane.normal, a)) / denom;
  if (t < -1e-8 || t > 1 + 1e-8) return null;

  return vadd(a, vscale(ab, t));
}

import * as THREE from "three";
import type { Lattice } from "../core/lattice/types";
import type { VisualAtom } from "../core/lattice/supercell";
import type { Vec3 } from "../core/math/vec";
import { vadd } from "../core/math/vec";
import { displayCellBasis, isInsideHexPrismDisplayCellBlock, solveFractionalInBasis } from "../core/lattice/displayBasis";
import { visualCellRanges } from "../core/lattice/supercell";

function cellVerticesFromBasis(offset: Vec3, aVec: Vec3, bVec: Vec3, cVec: Vec3, dim: 2 | 3): Vec3[] {
  const o = offset;
  const a = vadd(offset, aVec);
  const b = vadd(offset, bVec);
  const c = dim === 2 ? offset : vadd(offset, cVec);
  const ab = vadd(a, bVec);
  const ac = dim === 2 ? a : vadd(a, cVec);
  const bc = dim === 2 ? b : vadd(b, cVec);
  const abc = dim === 2 ? ab : vadd(ab, cVec);

  return [o, a, b, ab, c, ac, bc, abc];
}

function primitiveOriginFromIndices(lattice: Lattice, i: number, j: number, k: number): Vec3 {
  return [
    i * lattice.a[0] + j * lattice.b[0] + k * lattice.c[0],
    i * lattice.a[1] + j * lattice.b[1] + k * lattice.c[1],
    i * lattice.a[2] + j * lattice.b[2] + k * lattice.c[2],
  ];
}

function primitiveCellCenter(lattice: Lattice, origin: Vec3): Vec3 {
  const zFactor = lattice.dim === 2 ? 0 : 0.5;

  return [
    origin[0] + 0.5 * lattice.a[0] + 0.5 * lattice.b[0] + zFactor * lattice.c[0],
    origin[1] + 0.5 * lattice.a[1] + 0.5 * lattice.b[1] + zFactor * lattice.c[1],
    origin[2] + 0.5 * lattice.a[2] + 0.5 * lattice.b[2] + zFactor * lattice.c[2],
  ];
}
function isPrimitiveCellRelevantToDisplayBlock(
  lattice: Lattice,
  origin: Vec3,
  displayCellsPerAxis: number,
): boolean {
  const ranges = visualCellRanges(lattice, displayCellsPerAxis);
  const minFrac: Vec3 = [ranges.x.start, ranges.y.start, ranges.z.start];
  const maxFrac: Vec3 = [
    ranges.x.end + 1,
    ranges.y.end + 1,
    lattice.dim === 2 ? 0 : ranges.z.end + 1,
  ];

  const center = primitiveCellCenter(lattice, origin);
  const eps = 1e-8;

  if (lattice.displayCellShape === "hex_prism" && lattice.dim === 3) {
    // For hexagonal conventional guide cells, use the same actual hexagonal
    // prism test used for atom clipping, but keep primitive-cell selection
    // center-based. Vertex-touch selection added one extra outer layer.
    //
    // Result:
    // Display cells per axis = N
    // -> primitive overlay is clipped to the N-cell hex-prism block, not N+1.
    return isInsideHexPrismDisplayCellBlock(center, lattice, minFrac, maxFrac, eps);
  }

  const f = solveFractionalInBasis(center, displayCellBasis(lattice));

  if (!f) return true;

  return (
    f[0] >= minFrac[0] - eps &&
    f[0] < maxFrac[0] - eps &&
    f[1] >= minFrac[1] - eps &&
    f[1] < maxFrac[1] - eps &&
    (lattice.dim === 2 || (f[2] >= minFrac[2] - eps && f[2] < maxFrac[2] - eps))
  );
}

function renderEdges(parent: THREE.Object3D, vertices: Vec3[], dim: 2 | 3): void {
  const pairs = dim === 2
    ? [[0, 1], [1, 3], [3, 2], [2, 0]]
    : [
        [0, 1], [1, 3], [3, 2], [2, 0],
        [4, 5], [5, 7], [7, 6], [6, 4],
        [0, 4], [1, 5], [3, 7], [2, 6],
      ];

  const positions: number[] = [];
  for (const [i, j] of pairs) positions.push(...vertices[i], ...vertices[j]);

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));

  const material = new THREE.LineBasicMaterial({
    color: 0xfbbf24,
    transparent: true,
    opacity: 0.9,
    depthWrite: false,
  });

  const lines = new THREE.LineSegments(geometry, material);
  lines.renderOrder = 8;
  parent.add(lines);
}

function renderFaces(parent: THREE.Object3D, vertices: Vec3[], dim: 2 | 3): void {
  const triangles = dim === 2
    ? [[0, 1, 3], [0, 3, 2]]
    : [
        [0, 1, 3], [0, 3, 2],
        [4, 6, 7], [4, 7, 5],
        [0, 4, 5], [0, 5, 1],
        [1, 5, 7], [1, 7, 3],
        [3, 7, 6], [3, 6, 2],
        [2, 6, 4], [2, 4, 0],
      ];

  const positions: number[] = [];
  for (const [i, j, k] of triangles) positions.push(...vertices[i], ...vertices[j], ...vertices[k]);

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.computeVertexNormals();

  const material = new THREE.MeshBasicMaterial({
    color: 0xfbbf24,
    transparent: true,
    opacity: 0.10,
    side: THREE.DoubleSide,
    depthWrite: false,
  });

  const mesh = new THREE.Mesh(geometry, material);
  mesh.renderOrder = -1;
  parent.add(mesh);
}

function renderPrimitiveCell(parent: THREE.Object3D, lattice: Lattice, origin: Vec3): void {
  const vertices = cellVerticesFromBasis(origin, lattice.a, lattice.b, lattice.c, lattice.dim);
  renderFaces(parent, vertices, lattice.dim);
  renderEdges(parent, vertices, lattice.dim);
}

/**
 * Draw primitive cells whose origins are aligned to rendered atoms.
 *
 * Boundary atoms are useful for atom rendering, but they can create an extra
 * primitive-cell layer. To avoid that, candidate primitive cells are filtered
 * by checking whether their cell centers lie inside the displayed guide-cell
 * block. This makes primitive-cell count match "Display cells per axis".
 */
export function renderPrimitiveCellsFromAtoms(
  parent: THREE.Object3D,
  lattice: Lattice,
  atoms: VisualAtom[],
  displayCellsPerAxis: number,
): void {
  const seen = new Set<string>();

  for (const atom of atoms) {
    const frac = solveFractionalInBasis(atom.position, {
      a: lattice.a,
      b: lattice.b,
      c: lattice.c,
    });

    if (!frac) continue;

    const i = Math.floor(frac[0] + 1e-8);
    const j = Math.floor(frac[1] + 1e-8);
    const k = lattice.dim === 2 ? 0 : Math.floor(frac[2] + 1e-8);

    const key = `${i}:${j}:${k}`;
    if (seen.has(key)) continue;

    const origin = primitiveOriginFromIndices(lattice, i, j, k);

    if (!isPrimitiveCellRelevantToDisplayBlock(lattice, origin, displayCellsPerAxis)) {
      continue;
    }

    seen.add(key);
    renderPrimitiveCell(parent, lattice, origin);
  }
}

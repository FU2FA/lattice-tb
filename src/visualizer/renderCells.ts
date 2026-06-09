import * as THREE from "three";
import type { Lattice } from "../core/lattice/types";
import type { Int3, Vec3 } from "../core/math/vec";
import { intToCart, vadd } from "../core/math/vec";
import { visualCellRanges } from "../core/lattice/supercell";
import { displayCellBasis } from "../core/lattice/displayBasis";

export function renderPrimitiveCell(parent: THREE.Object3D, lattice: Lattice, offset: Vec3 = [0, 0, 0]): void {
  const vertices = primitiveCellVertices(lattice, offset);
  renderCellFaces(parent, vertices, lattice.dim, 0xfbbf24, 0.12);
  renderCellEdges(parent, vertices, lattice.dim, 0xfbbf24, 0.9);
}

export function renderSimpleCubicCell(parent: THREE.Object3D, lattice: Lattice, offset: Vec3 = [0, 0, 0]): void {
  if (lattice.displayCellShape === "hex_prism" && lattice.dim === 3) {
    renderHexPrismCell(parent, lattice, offset, 0x38bdf8, 0.08, 0.85);
    return;
  }

  const vertices = displayCellVertices(lattice, offset);
  renderCellFaces(parent, vertices, lattice.dim, 0x38bdf8, 0.08);
  renderCellEdges(parent, vertices, lattice.dim, 0x38bdf8, 0.85);
}

export function renderPrimitiveCells(parent: THREE.Object3D, lattice: Lattice, size: number): void {
  forEachPrimitiveRenderCell(lattice, size, (offset) => renderPrimitiveCell(parent, lattice, offset));
}

export function renderSimpleCubicCells(parent: THREE.Object3D, lattice: Lattice, size: number): void {
  forEachDisplayRenderCell(lattice, size, (offset) => renderSimpleCubicCell(parent, lattice, offset));
}

export function forEachXYZRenderCell(lattice: Lattice, size: number, callback: (offset: Vec3, cell: Int3) => void): void {
  forEachDisplayRenderCell(lattice, size, callback);
}

export function forEachDisplayRenderCell(lattice: Lattice, size: number, callback: (offset: Vec3, cell: Int3) => void): void {
  const basis = displayCellBasis(lattice);
  const ranges = visualCellRanges(lattice, size);

  for (let i = ranges.x.start; i <= ranges.x.end; i++) {
    for (let j = ranges.y.start; j <= ranges.y.end; j++) {
      for (let k = ranges.z.start; k <= ranges.z.end; k++) {
        callback(intToCart([i, j, k], basis.a, basis.b, basis.c), [i, j, k]);
      }
    }
  }
}

export function forEachPrimitiveRenderCell(lattice: Lattice, size: number, callback: (offset: Vec3, cell: Int3) => void): void {
  const ranges = visualCellRanges(lattice, size);

  for (let i = ranges.x.start; i <= ranges.x.end; i++) {
    for (let j = ranges.y.start; j <= ranges.y.end; j++) {
      for (let k = ranges.z.start; k <= ranges.z.end; k++) {
        callback(intToCart([i, j, k], lattice.a, lattice.b, lattice.c), [i, j, k]);
      }
    }
  }
}

function primitiveCellVertices(lattice: Lattice, offset: Vec3): Vec3[] {
  return cellVerticesFromBasis(offset, lattice.a, lattice.b, lattice.c, lattice.dim);
}

function displayCellVertices(lattice: Lattice, offset: Vec3): Vec3[] {
  const basis = displayCellBasis(lattice);
  return cellVerticesFromBasis(offset, basis.a, basis.b, basis.c, lattice.dim);
}

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

function renderHexPrismCell(
  parent: THREE.Object3D,
  lattice: Lattice,
  centerBottom: Vec3,
  color: number,
  faceOpacity: number,
  edgeOpacity: number,
): void {
  const basis = displayCellBasis(lattice);
  const bottom = hexagonVerticesFromCenterBasis(centerBottom, basis.a, basis.b);
  const topCenter: Vec3 = [centerBottom[0] + basis.c[0], centerBottom[1] + basis.c[1], centerBottom[2] + basis.c[2]];
  const top = hexagonVerticesFromCenterBasis(topCenter, basis.a, basis.b);

  const vertices = [...bottom, ...top];

  const linePairs: number[][] = [];
  for (let i = 0; i < 6; i++) {
    linePairs.push([i, (i + 1) % 6]);       // bottom ring
    linePairs.push([i + 6, ((i + 1) % 6) + 6]); // top ring
    linePairs.push([i, i + 6]);             // vertical edges
  }

  const triIndices: number[][] = [];
  // bottom face fan
  for (let i = 1; i < 5; i++) triIndices.push([0, i + 1, i]);
  // top face fan
  for (let i = 1; i < 5; i++) triIndices.push([6, 6 + i, 6 + i + 1]);
  // side quads
  for (let i = 0; i < 6; i++) {
    const j = (i + 1) % 6;
    triIndices.push([i, j, j + 6]);
    triIndices.push([i, j + 6, i + 6]);
  }

  renderIndexedFaces(parent, vertices, triIndices, color, faceOpacity);
  renderIndexedEdges(parent, vertices, linePairs, color, edgeOpacity);
}

function hexagonVerticesFromCenterBasis(center: Vec3, t1: Vec3, t2: Vec3): Vec3[] {
  // Given hexagon center-to-center tiling vectors t1 and t2,
  // construct a hexagon whose neighboring centers differ by those vectors.
  const coeffs: [number, number][] = [
    [ 2 / 3, -1 / 3],
    [ 1 / 3,  1 / 3],
    [-1 / 3,  2 / 3],
    [-2 / 3,  1 / 3],
    [-1 / 3, -1 / 3],
    [ 1 / 3, -2 / 3],
  ];

  return coeffs.map(([u, v]) => [
    center[0] + u * t1[0] + v * t2[0],
    center[1] + u * t1[1] + v * t2[1],
    center[2] + u * t1[2] + v * t2[2],
  ]);
}

function renderCellEdges(parent: THREE.Object3D, v: Vec3[], dim: 2 | 3, color: number, opacity: number): void {
  const pairs = dim === 2
    ? [[0, 1], [1, 3], [3, 2], [2, 0]]
    : [
        [0, 1], [1, 3], [3, 2], [2, 0],
        [4, 5], [5, 7], [7, 6], [6, 4],
        [0, 4], [1, 5], [3, 7], [2, 6],
      ];

  renderIndexedEdges(parent, v, pairs, color, opacity);
}

function renderIndexedEdges(parent: THREE.Object3D, vertices: Vec3[], pairs: number[][], color: number, opacity: number): void {
  const positions: number[] = [];
  for (const [i, j] of pairs) positions.push(...vertices[i], ...vertices[j]);

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));

  const material = new THREE.LineBasicMaterial({
    color,
    transparent: true,
    opacity,
    depthWrite: false,
  });

  const lines = new THREE.LineSegments(geometry, material);
  lines.renderOrder = 5;
  parent.add(lines);
}

function renderCellFaces(parent: THREE.Object3D, v: Vec3[], dim: 2 | 3, color: number, opacity: number): void {
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

  renderIndexedFaces(parent, v, triangles, color, opacity);
}

function renderIndexedFaces(parent: THREE.Object3D, vertices: Vec3[], triangles: number[][], color: number, opacity: number): void {
  const positions: number[] = [];
  for (const [i, j, k] of triangles) positions.push(...vertices[i], ...vertices[j], ...vertices[k]);

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.computeVertexNormals();

  const material = new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity,
    side: THREE.DoubleSide,
    depthWrite: false,
  });

  const mesh = new THREE.Mesh(geometry, material);
  mesh.renderOrder = -1;
  parent.add(mesh);
}


import * as THREE from "three";
import { ConvexGeometry } from "three/examples/jsm/geometries/ConvexGeometry.js";
import type { Lattice } from "../core/lattice/types";
import type { Vec3 } from "../core/math/vec";
import type { VisualAtom } from "../core/lattice/supercell";
import { reciprocalBasis } from "../core/lattice/reciprocal";
import { projectedHighSymmetryPointForDisplay } from "../core/lattice/bzProjection";
import { buildVoronoiCell2D, buildVoronoiCell3D, type CellGeometry } from "../core/math/geometry";
import { dot, fracToCart, vadd } from "../core/math/vec";
import { getVisualBasisData, visualSiteOffset } from "../core/lattice/supercell";
import { renderPrimitiveCell } from "./renderCells";

function toThree(v: Vec3): THREE.Vector3 {
  return new THREE.Vector3(v[0], v[1], v[2]);
}

function fromThree(v: THREE.Vector3): Vec3 {
  return [v.x, v.y, v.z];
}

function tuneMaterial(
  material: THREE.Material | THREE.Material[] | undefined,
  options: {
    depthTest?: boolean;
    depthWrite?: boolean;
    transparent?: boolean;
    opacity?: number;
  },
): void {
  if (!material) return;

  const materials = Array.isArray(material) ? material : [material];
  for (const m of materials) {
    if (options.depthTest !== undefined) m.depthTest = options.depthTest;
    if (options.depthWrite !== undefined) m.depthWrite = options.depthWrite;
    if (options.transparent !== undefined) m.transparent = options.transparent;
    if (options.opacity !== undefined) m.opacity = options.opacity;
  }
}

function pushObjectLayer(
  object: THREE.Object3D,
  renderOrder: number,
  options: {
    depthTest?: boolean;
    depthWrite?: boolean;
    transparent?: boolean;
    opacity?: number;
  } = {},
): void {
  object.renderOrder = renderOrder;
  object.traverse((child) => {
    child.renderOrder = renderOrder;
    const item = child as THREE.Mesh | THREE.Line | THREE.Points | THREE.Sprite;
    tuneMaterial(item.material, options);
  });
}

function offsetPositionsAlongDirection(positions: number[], direction: Vec3, amount: number): number[] {
  const d = new THREE.Vector3(direction[0], direction[1], direction[2]);
  if (d.lengthSq() < 1e-12 || amount === 0) return positions;

  d.normalize().multiplyScalar(amount);
  const out = [...positions];
  for (let i = 0; i < out.length; i += 3) {
    out[i] += d.x;
    out[i + 1] += d.y;
    out[i + 2] += d.z;
  }
  return out;
}

function offsetPointsAlongDirection(points: Vec3[], direction: Vec3, amount: number): Vec3[] {
  const d = new THREE.Vector3(direction[0], direction[1], direction[2]);
  if (d.lengthSq() < 1e-12 || amount === 0) return points;

  d.normalize().multiplyScalar(amount);
  return points.map((p) => [p[0] + d.x, p[1] + d.y, p[2] + d.z]);
}


function latticePoint(i: number, j: number, k: number, a1: THREE.Vector3, a2: THREE.Vector3, a3: THREE.Vector3): THREE.Vector3 {
  return a1.clone().multiplyScalar(i)
    .add(a2.clone().multiplyScalar(j))
    .add(a3.clone().multiplyScalar(k));
}

function makePlane(normal: THREE.Vector3): { normal: THREE.Vector3; c: number } {
  return { normal, c: normal.lengthSq() / 2 };
}

function insideAllPlanes(p: THREE.Vector3, planes: { normal: THREE.Vector3; c: number }[]): boolean {
  const eps = 1e-6;
  for (const plane of planes) {
    if (p.dot(plane.normal) > plane.c + eps) return false;
  }
  return true;
}

function createVoronoiGeometryFromNeighbors(neighbors: THREE.Vector3[]): THREE.BufferGeometry | null {
  const planes = neighbors.map(makePlane);
  const points: THREE.Vector3[] = [];

  for (let i = 0; i < planes.length; i++) {
    for (let j = i + 1; j < planes.length; j++) {
      for (let k = j + 1; k < planes.length; k++) {
        const p1 = planes[i];
        const p2 = planes[j];
        const p3 = planes[k];

        const matrix = new THREE.Matrix3();
        matrix.set(
          p1.normal.x, p1.normal.y, p1.normal.z,
          p2.normal.x, p2.normal.y, p2.normal.z,
          p3.normal.x, p3.normal.y, p3.normal.z,
        );

        if (Math.abs(matrix.determinant()) < 1e-8) continue;

        const rhs = new THREE.Vector3(p1.c, p2.c, p3.c);
        const p = rhs.clone().applyMatrix3(matrix.clone().invert());

        if (insideAllPlanes(p, planes)) {
          const exists = points.some((q) => q.distanceTo(p) < 1e-5);
          if (!exists) points.push(p);
        }
      }
    }
  }

  if (points.length < 4) return null;
  return new ConvexGeometry(points);
}

function createPrototypeVoronoiGeometry(lattice: Lattice, basisIndex: number): THREE.BufferGeometry | null {
  const visual = getVisualBasisData(lattice);
  const a1 = toThree(visual.a);
  const a2 = toThree(visual.b);
  const a3 = toThree(visual.c);

  const basisAtom = visual.sites[basisIndex];
  if (!basisAtom) return null;

  const center = toThree(visualSiteOffset(lattice, basisAtom));
  const neighbors: THREE.Vector3[] = [];

  const zMin = lattice.dim === 2 ? 0 : -1;
  const zMax = lattice.dim === 2 ? 0 : 1;

  for (let i = -1; i <= 1; i++) {
    for (let j = -1; j <= 1; j++) {
      for (let k = zMin; k <= zMax; k++) {
        const cellOrigin = latticePoint(i, j, k, a1, a2, a3);

        for (const other of visual.sites) {
          const otherPosition = cellOrigin.clone().add(toThree(visualSiteOffset(lattice, other)));
          const R = otherPosition.clone().sub(center);
          if (R.lengthSq() < 1e-8) continue;
          neighbors.push(R);
        }
      }
    }
  }

  neighbors.sort((A, B) => A.lengthSq() - B.lengthSq());
  const limitedNeighbors = neighbors.slice(0, lattice.dim === 2 ? 16 : 48);

  return createVoronoiGeometryFromNeighbors(limitedNeighbors);
}

function createGeometryMap(lattice: Lattice): Map<number, THREE.BufferGeometry> {
  const visual = getVisualBasisData(lattice);
  const map = new Map<number, THREE.BufferGeometry>();

  visual.sites.forEach((_, basisIndex) => {
    const geometry = createPrototypeVoronoiGeometry(lattice, basisIndex);
    if (geometry) map.set(basisIndex, geometry);
  });

  return map;
}

export function renderWignerSeitzZones(parent: THREE.Object3D, lattice: Lattice, atoms: VisualAtom[]): void {
  const fillMaterial = new THREE.MeshPhongMaterial({
    color: 0xffeeee,
    transparent: true,
    opacity: 0.28,
    side: THREE.DoubleSide,
    depthWrite: false,
  });

  const edgeMaterial = new THREE.LineBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.85,
    depthWrite: false,
  });

  const geometryMap = createGeometryMap(lattice);

  for (const atom of atoms) {
    const geometry = geometryMap.get(atom.basisIndex);
    if (!geometry) continue;

    const mesh = new THREE.Mesh(geometry, fillMaterial);
    mesh.position.set(atom.position[0], atom.position[1], atom.position[2]);
    mesh.renderOrder = -2;
    parent.add(mesh);

    const edges = new THREE.LineSegments(new THREE.EdgesGeometry(geometry), edgeMaterial);
    edges.position.copy(mesh.position);
    edges.renderOrder = 12;
    parent.add(edges);
  }
}

function renderCellEdges(parent: THREE.Object3D, cell: CellGeometry, color: number, opacity = 0.95): void {
  const points: number[] = [];

  for (const [a, b] of cell.edges) {
    points.push(...cell.vertices[a], ...cell.vertices[b]);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(points, 3));

  const material = new THREE.LineBasicMaterial({
    color,
    transparent: true,
    opacity,
    depthWrite: false,
  });
  const lines = new THREE.LineSegments(geometry, material);
  lines.renderOrder = 14;
  parent.add(lines);
}

function renderCellFaces(parent: THREE.Object3D, cell: CellGeometry, color: number, opacity = 0.08): void {
  const positions: number[] = [];

  for (const face of cell.faces) {
    if (face.length < 3) continue;
    const first = face[0];
    for (let i = 1; i < face.length - 1; i++) {
      positions.push(...cell.vertices[first], ...cell.vertices[face[i]], ...cell.vertices[face[i + 1]]);
    }
  }

  if (positions.length === 0) return;

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
  mesh.renderOrder = -3;
  parent.add(mesh);
}

function renderPointCloud(
  parent: THREE.Object3D,
  points: Vec3[],
  color: number,
  radius: number,
  renderOrder = 20,
  depthTest = true,
): void {
  const geometry = new THREE.SphereGeometry(radius, 12, 8);
  const material = new THREE.MeshBasicMaterial({
    color,
    depthTest,
    depthWrite: false,
  });
  const mesh = new THREE.InstancedMesh(geometry, material, points.length);
  const matrix = new THREE.Matrix4();

  points.forEach((p, i) => {
    matrix.makeTranslation(p[0], p[1], p[2]);
    mesh.setMatrixAt(i, matrix);
  });

  mesh.instanceMatrix.needsUpdate = true;
  mesh.renderOrder = renderOrder;
  parent.add(mesh);
}

export function renderReciprocalLattice(parent: THREE.Object3D, lattice: Lattice): void {
  const { b1, b2, b3 } = reciprocalBasis(lattice);
  const points: Vec3[] = [];

  const zMin = lattice.dim === 2 ? 0 : -2;
  const zMax = lattice.dim === 2 ? 0 : 2;

  for (let i = -2; i <= 2; i++) {
    for (let j = -2; j <= 2; j++) {
      for (let k = zMin; k <= zMax; k++) {
        points.push([
          b1[0] * i + b2[0] * j + b3[0] * k,
          b1[1] * i + b2[1] * j + b3[1] * k,
          b1[2] * i + b2[2] * j + b3[2] * k,
        ]);
      }
    }
  }

  renderPointCloud(parent, points, 0xf472b6, 0.035, 9, true);

  const material = new THREE.LineBasicMaterial({
    color: 0xf472b6,
    transparent: true,
    opacity: 0.5,
    depthWrite: false,
  });
  const positions = [0, 0, 0, ...b1, 0, 0, 0, ...b2, 0, 0, 0, ...b3];
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  const lines = new THREE.LineSegments(geometry, material);
  lines.renderOrder = 10;
  parent.add(lines);
}

export function renderBrillouinZone(parent: THREE.Object3D, lattice: Lattice): void {
  const { b1, b2, b3 } = reciprocalBasis(lattice);
  const vectors = [b1, b2, b3];

  const cell = lattice.dim === 2
    ? buildVoronoiCell2D(vectors, 3)
    : buildVoronoiCell3D(vectors, 2);

  renderCellFaces(parent, cell, 0xf472b6, 0.07);
  renderCellEdges(parent, cell, 0xf472b6, 0.95);
}

export function renderReciprocalPrimitiveCell(parent: THREE.Object3D, lattice: Lattice): void {
  const { b1, b2, b3 } = reciprocalBasis(lattice);
  const reciprocalLattice: Lattice = {
    ...lattice,
    id: `${lattice.id}-reciprocal`,
    name: `${lattice.name} reciprocal primitive`,
    a: b1,
    b: b2,
    c: b3,
    conventionalBasis: undefined,
    visualSites: undefined,
    sites: [],
  };

  renderPrimitiveCell(parent, reciprocalLattice, [0, 0, 0]);
}


export function renderReciprocalKPath(
  parent: THREE.Object3D,
  lattice: Lattice,
  labels: string[],
): void {
  if (labels.length < 2) return;

  const positions: number[] = [];
  const pointPositions: Vec3[] = [];

  for (let s = 0; s < labels.length - 1; s++) {
    const start = lattice.highSymmetry[labels[s]];
    const end = lattice.highSymmetry[labels[s + 1]];
    if (!start || !end) continue;

    const k0 = projectedHighSymmetryPointForDisplay(lattice, labels[s]);
    const k1 = projectedHighSymmetryPointForDisplay(lattice, labels[s + 1]);
    if (!k0 || !k1) continue;

    positions.push(...k0, ...k1);

    if (s === 0) pointPositions.push(k0);
    pointPositions.push(k1);
  }

  if (positions.length > 0) {
    const geometry = new THREE.BufferGeometry();
    const liftedPositions = offsetPositionsAlongDirection(positions, [1, 1, 1], 0.012);
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(liftedPositions, 3));

    const material = new THREE.LineBasicMaterial({
      color: 0xf8fafc,
      transparent: true,
      opacity: 0.95,
      depthTest: false,
      depthWrite: false,
    });

    const line = new THREE.LineSegments(geometry, material);
    line.name = "reciprocal-k-path";
    line.renderOrder = 32;
    parent.add(line);
  }

  if (pointPositions.length > 0) {
    renderPointCloud(parent, offsetPointsAlongDirection(pointPositions, [1, 1, 1], 0.012), 0xfbbf24, 0.055, 34, false);
  }
}

export function renderReciprocalKMarker(
  parent: THREE.Object3D,
  k: Vec3,
): void {
  const geometry = new THREE.SphereGeometry(0.11, 18, 12);
  const material = new THREE.MeshBasicMaterial({
    color: 0x22c55e,
    depthTest: false,
    depthWrite: false,
  });
  const marker = new THREE.Mesh(geometry, material);
  marker.name = "reciprocal-hover-k-marker";
  marker.position.set(k[0], k[1], k[2]);
  marker.renderOrder = 40;
  parent.add(marker);

  const axes = [
    [0, 0, 0, k[0], 0, 0],
    [k[0], 0, 0, k[0], k[1], 0],
    [k[0], k[1], 0, k[0], k[1], k[2]],
  ].flat();

  const lineGeometry = new THREE.BufferGeometry();
  lineGeometry.setAttribute("position", new THREE.Float32BufferAttribute(axes, 3));
  const lineMaterial = new THREE.LineBasicMaterial({
    color: 0x22c55e,
    transparent: true,
    opacity: 0.5,
    depthTest: false,
    depthWrite: false,
  });
  const markerLines = new THREE.LineSegments(lineGeometry, lineMaterial);
  markerLines.renderOrder = 39;
  parent.add(markerLines);
}

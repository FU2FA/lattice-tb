import * as THREE from "three";
import type { VisualBond } from "../core/lattice/neighbors";

export function renderBonds(parent: THREE.Object3D, bonds: VisualBond[]): void {
  const material = new THREE.LineBasicMaterial({
    color: 0x94a3b8,
    transparent: true,
    opacity: 0.45,
  });

  const points: number[] = [];

  for (const bond of bonds) {
    points.push(...bond.from.position, ...bond.to.position);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(points, 3));

  const lines = new THREE.LineSegments(geometry, material);
  parent.add(lines);
}

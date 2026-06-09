import * as THREE from "three";
import type { VisualAtom } from "../core/lattice/supercell";

const materialCache = new Map<number, THREE.MeshStandardMaterial>();

function getMaterial(color: number): THREE.MeshStandardMaterial {
  let material = materialCache.get(color);
  if (!material) {
    material = new THREE.MeshStandardMaterial({
      color,
      roughness: 0.5,
      metalness: 0.1,
    });
    materialCache.set(color, material);
  }
  return material;
}

export function renderAtoms(parent: THREE.Object3D, atoms: VisualAtom[], radius = 0.08): void {
  const geometry = new THREE.SphereGeometry(radius, 24, 16);

  for (const atom of atoms) {
    const mesh = new THREE.Mesh(
      geometry,
      getMaterial(atom.color ?? 0x60a5fa),
    );

    mesh.position.set(atom.position[0], atom.position[1], atom.position[2]);
    parent.add(mesh);
  }
}

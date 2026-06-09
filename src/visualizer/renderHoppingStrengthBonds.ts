import * as THREE from "three";
import type { TBModel } from "../core/tightbinding/tbTypes";
import type { VisualAtom } from "../core/lattice/supercell";
import type { Vec3 } from "../core/math/vec";
import { cabs } from "../core/math/complex";
import { hoppingDisplacement } from "../core/tightbinding/buildHamiltonian";
import { norm, vadd } from "../core/math/vec";

interface HoppingGroup {
  fromSite: number;
  toSite: number;
  R: [number, number, number];
  strength: number;
  signedSum: number;
  count: number;
  label: string;
}

interface VisibleHoppingBond {
  from: Vec3;
  to: Vec3;
  strength: number;
  signedSum: number;
  count: number;
}

function roundKey(value: number): string {
  return value.toFixed(6);
}

function atomKey(siteId: number, position: Vec3): string {
  return `${siteId}:${roundKey(position[0])}:${roundKey(position[1])}:${roundKey(position[2])}`;
}

function groupHoppings(model: TBModel): HoppingGroup[] {
  const map = new Map<string, HoppingGroup>();

  for (const hop of model.hoppings) {
    const key = `${hop.from.site}:${hop.to.site}:${hop.R.join(",")}`;
    const existing = map.get(key);
    const magnitude = cabs(hop.value);

    if (existing) {
      existing.strength = Math.sqrt(existing.strength ** 2 + magnitude ** 2);
      existing.signedSum += hop.value.re;
      existing.count += 1;
    } else {
      map.set(key, {
        fromSite: hop.from.site,
        toSite: hop.to.site,
        R: [...hop.R],
        strength: magnitude,
        signedSum: hop.value.re,
        count: 1,
        label: hop.label ?? "",
      });
    }
  }

  return [...map.values()].filter((group) => group.strength > 1e-10);
}

function collectVisibleHoppingBonds(model: TBModel, atoms: VisualAtom[]): VisibleHoppingBond[] {
  const byPosition = new Map<string, VisualAtom>();

  for (const atom of atoms) {
    byPosition.set(atomKey(atom.siteId, atom.position), atom);
  }

  const groups = groupHoppings(model);
  const seen = new Set<string>();
  const out: VisibleHoppingBond[] = [];

  for (const atom of atoms) {
    for (const group of groups) {
      if (atom.siteId !== group.fromSite) continue;

      const d = hoppingDisplacement(model, group.fromSite, group.toSite, group.R);
      const targetPosition = vadd(atom.position, d);
      const target = byPosition.get(atomKey(group.toSite, targetPosition));
      if (!target) continue;

      const keyA = atomKey(atom.siteId, atom.position);
      const keyB = atomKey(target.siteId, target.position);
      const pairKey = keyA < keyB ? `${keyA}|${keyB}` : `${keyB}|${keyA}`;

      // Avoid drawing the Hermitian-conjugate / reverse cell duplicate.
      if (seen.has(pairKey)) continue;
      seen.add(pairKey);

      out.push({
        from: atom.position,
        to: target.position,
        strength: group.strength,
        signedSum: group.signedSum,
        count: group.count,
      });
    }
  }

  return out;
}

function cylinderBetween(from: Vec3, to: Vec3, radius: number, color: number, opacity: number): THREE.Mesh | null {
  const start = new THREE.Vector3(from[0], from[1], from[2]);
  const end = new THREE.Vector3(to[0], to[1], to[2]);
  const direction = new THREE.Vector3().subVectors(end, start);
  const length = direction.length();

  if (length < 1e-8) return null;

  const geometry = new THREE.CylinderGeometry(radius, radius, length, 10, 1, false);
  const material = new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity,
    depthWrite: false,
  });

  const cylinder = new THREE.Mesh(geometry, material);
  cylinder.position.copy(start).add(end).multiplyScalar(0.5);

  // Cylinder's local y-axis is its length direction.
  const quat = new THREE.Quaternion();
  quat.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
  cylinder.quaternion.copy(quat);

  cylinder.renderOrder = -0.5;
  return cylinder;
}

export function renderHoppingStrengthBonds(
  parent: THREE.Object3D,
  model: TBModel,
  atoms: VisualAtom[],
): void {
  const bonds = collectVisibleHoppingBonds(model, atoms);
  if (bonds.length === 0) return;

  const maxStrength = Math.max(...bonds.map((bond) => bond.strength), 1e-8);
  const minRadius = 0.012;
  const maxRadius = 0.065;

  const group = new THREE.Group();
  group.name = "tb-hopping-strength-bonds";

  for (const bond of bonds) {
    const normalized = Math.max(0, Math.min(1, bond.strength / maxStrength));
    const radius = minRadius + (maxRadius - minRadius) * Math.sqrt(normalized);

    // Sign color is only a guide:
    // - orange: net positive hopping matrix sum
    // - cyan/blue: net negative hopping matrix sum
    // Multi-orbital bonds can contain mixed signs; thickness is the main signal.
    const color = bond.signedSum >= 0 ? 0xf97316 : 0x38bdf8;
    const opacity = 0.28 + 0.48 * normalized;

    const mesh = cylinderBetween(bond.from, bond.to, radius, color, opacity);
    if (mesh) group.add(mesh);
  }

  // Add a small neutral nearest line underneath so thin hoppings remain locatable.
  const linePositions: number[] = [];
  for (const bond of bonds) {
    linePositions.push(...bond.from, ...bond.to);
  }

  const lineGeometry = new THREE.BufferGeometry();
  lineGeometry.setAttribute("position", new THREE.Float32BufferAttribute(linePositions, 3));
  const lineMaterial = new THREE.LineBasicMaterial({
    color: 0xe5e7eb,
    transparent: true,
    opacity: 0.18,
  });
  group.add(new THREE.LineSegments(lineGeometry, lineMaterial));

  parent.add(group);
}

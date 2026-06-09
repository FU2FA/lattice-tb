import * as THREE from "three";
import type { SceneManager } from "./SceneManager";
import type { Lattice } from "../core/lattice/types";
import type { Vec3 } from "../core/math/vec";
import { generateSupercellAtoms } from "../core/lattice/supercell";
import { findVisualBonds } from "../core/lattice/neighbors";
import { renderAtoms } from "./renderAtoms";
import { renderBonds } from "./renderBonds";
import { renderSimpleCubicCells } from "./renderCells";
import { renderPrimitiveCellsFromAtoms } from "./renderPrimitiveFromAtoms";
import { renderCartesianFrame, renderLatticeAxes } from "./renderAxes";
import {
  renderBrillouinZone,
  renderReciprocalKMarker,
  renderReciprocalKPath,
  renderReciprocalLattice,
  renderReciprocalPrimitiveCell,
  renderWignerSeitzZones,
} from "./renderZones";

export interface RenderOptions {
  supercellSize: number;
  viewScale: number;
  reciprocalViewScale: number;
  showSimpleCubicCell: boolean;
  showPrimitiveCell: boolean;
  showBonds: boolean;
  showAxes: boolean;
  showCartesianFrame: boolean;
  showWignerSeitz: boolean;
  showReciprocalLattice: boolean;
  showBrillouinZone: boolean;
  showReciprocalPrimitiveCell: boolean;
}

export function usesReciprocalView(options: RenderOptions): boolean {
  return options.showReciprocalLattice || options.showBrillouinZone || options.showReciprocalPrimitiveCell;
}

export function updateRealSpaceScene(manager: SceneManager, lattice: Lattice, options: RenderOptions, resetCamera = false): void {
  manager.clearDynamicObjects();

  const safeScale = Number.isFinite(options.viewScale)
    ? Math.max(0.1, Math.min(8, options.viewScale))
    : 1;

  if (options.showCartesianFrame) {
    const frameSize = Math.max(4, safeScale * options.supercellSize * 1.4);
    renderCartesianFrame(manager.scene, frameSize);
  }

  const latticeGroup = new THREE.Group();
  latticeGroup.name = "real-lattice-scaled-group";
  latticeGroup.scale.setScalar(safeScale);
  manager.scene.add(latticeGroup);

  const atoms = generateSupercellAtoms(lattice, options.supercellSize);
  renderAtoms(latticeGroup, atoms, lattice.id === "graphene" ? 0.07 : 0.08);

  if (options.showBonds) {
    const bonds = findVisualBonds(atoms, lattice.visualBondCutoff);
    renderBonds(latticeGroup, bonds);
  }

  if (options.showSimpleCubicCell) {
    renderSimpleCubicCells(latticeGroup, lattice, options.supercellSize);
  }

  if (options.showPrimitiveCell) {
    renderPrimitiveCellsFromAtoms(latticeGroup, lattice, atoms, options.supercellSize);
  }

  if (options.showAxes) {
    renderLatticeAxes(latticeGroup, lattice);
  }

  if (options.showWignerSeitz) {
    renderWignerSeitzZones(latticeGroup, lattice, atoms);
  }

  if (resetCamera) {
    manager.controls.target.set(0, 0, 0);
    const cameraDistance = Math.max(4.5, safeScale * options.supercellSize * 1.8);
    manager.camera.position.set(cameraDistance, cameraDistance, lattice.dim === 2 ? cameraDistance * 1.15 : cameraDistance * 0.8);
  }
  manager.controls.update();
}

export function updateReciprocalSpaceScene(
  manager: SceneManager,
  lattice: Lattice,
  options: RenderOptions,
  resetCamera = false,
  kPathLabels: string[] = lattice.defaultPath,
  hoveredK: Vec3 | null = null,
): void {
  manager.clearDynamicObjects();

  const safeReciprocalScale = Number.isFinite(options.reciprocalViewScale)
    ? Math.max(0.01, Math.min(5, options.reciprocalViewScale))
    : 0.18;

  renderCartesianFrame(manager.scene, Math.max(4, 12 * safeReciprocalScale));

  const reciprocalGroup = new THREE.Group();
  reciprocalGroup.name = "reciprocal-scaled-group";
  reciprocalGroup.scale.setScalar(safeReciprocalScale);
  manager.scene.add(reciprocalGroup);

  if (options.showReciprocalLattice) {
    renderReciprocalLattice(reciprocalGroup, lattice);
  }

  if (options.showBrillouinZone) {
    renderBrillouinZone(reciprocalGroup, lattice);
  }

  if (options.showReciprocalPrimitiveCell) {
    renderReciprocalPrimitiveCell(reciprocalGroup, lattice);
  }

  // v47: show the default high-symmetry k-path directly in reciprocal space.
  renderReciprocalKPath(reciprocalGroup, lattice, kPathLabels);

  // v48: marker controlled by band-plot hover.
  if (hoveredK) {
    renderReciprocalKMarker(reciprocalGroup, hoveredK);
  }

  if (resetCamera) {
    manager.controls.target.set(0, 0, 0);
    const cameraDistance = Math.max(4.5, 18 * safeReciprocalScale);
    manager.camera.position.set(cameraDistance, cameraDistance, lattice.dim === 2 ? cameraDistance * 1.2 : cameraDistance);
  }
  manager.controls.update();
}

export function updateLatticeScene(manager: SceneManager, lattice: Lattice, options: RenderOptions): void {
  updateRealSpaceScene(manager, lattice, options, true);
}

import * as THREE from "three";
import type { Lattice } from "../core/lattice/types";

function makeTextSprite(text: string, color = "white"): THREE.Sprite {
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 64;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Cannot create text sprite canvas.");

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = color;
  ctx.font = "bold 34px sans-serif";
  ctx.fillText(text, 18, 43);

  const texture = new THREE.CanvasTexture(canvas);
  const material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthTest: false,
    depthWrite: false,
  });
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(0.38, 0.19, 1);
  sprite.renderOrder = 50;

  return sprite;
}

function setMaterialNoDepth(material: THREE.Material | THREE.Material[] | undefined, opacity?: number): void {
  if (!material) return;

  const materials = Array.isArray(material) ? material : [material];
  for (const m of materials) {
    m.depthTest = false;
    m.depthWrite = false;

    if (opacity !== undefined) {
      m.transparent = true;
      m.opacity = opacity;
    }
  }
}

function setNoDepthRecursive(object: THREE.Object3D, renderOrder: number, opacity?: number): void {
  object.renderOrder = renderOrder;

  object.traverse((child) => {
    child.renderOrder = renderOrder;

    const maybeMesh = child as THREE.Mesh | THREE.Line | THREE.Sprite;
    setMaterialNoDepth(maybeMesh.material, opacity);
  });
}

export function renderLatticeAxes(parent: THREE.Object3D, lattice: Lattice): void {
  const makeArrow = (v: [number, number, number], color: number, label: string) => {
    const dir = new THREE.Vector3(v[0], v[1], v[2]);
    const length = dir.length();

    if (length < 1e-8) return;

    dir.normalize();
    const arrow = new THREE.ArrowHelper(dir, new THREE.Vector3(0, 0, 0), length, color, 0.12, 0.06);
    setNoDepthRecursive(arrow, 40);
    parent.add(arrow);

    const sprite = makeTextSprite(label);
    sprite.position.set(v[0] * 1.12, v[1] * 1.12, v[2] * 1.12);
    parent.add(sprite);
  };

  makeArrow(lattice.a, 0xfbbf24, "a");
  makeArrow(lattice.b, 0xfbbf24, "b");
  if (lattice.dim === 3) makeArrow(lattice.c, 0xfbbf24, "c");
}

export function renderCartesianFrame(scene: THREE.Scene, size = 4): void {
  // Fixed orthogonal XYZ coordinate frame. This is independent of lattice vectors.
  //
  // The grid lies on z=0, so 2D lattice edges and cell lines can occupy exactly
  // the same plane. A tiny downward offset plus depthWrite=false prevents
  // visible z-fighting/flickering while keeping the grid visually behind the
  // lattice objects.
  const grid = new THREE.GridHelper(size * 2, size * 2, 0x334155, 0x1f2937);
  grid.position.set(0, 0, -0.004);
  grid.renderOrder = -20;
  grid.traverse((child) => {
    child.renderOrder = -20;
    const line = child as THREE.Line;
    setMaterialNoDepth(line.material, 0.42);
  });
  scene.add(grid);

  const origin = new THREE.Vector3(0, 0, 0);

  const xArrow = new THREE.ArrowHelper(new THREE.Vector3(1, 0, 0), origin, size, 0xef4444, 0.18, 0.09);
  const yArrow = new THREE.ArrowHelper(new THREE.Vector3(0, 1, 0), origin, size, 0x22c55e, 0.18, 0.09);
  const zArrow = new THREE.ArrowHelper(new THREE.Vector3(0, 0, 1), origin, size, 0x3b82f6, 0.18, 0.09);

  setNoDepthRecursive(xArrow, 45);
  setNoDepthRecursive(yArrow, 45);
  setNoDepthRecursive(zArrow, 45);

  scene.add(xArrow);
  scene.add(yArrow);
  scene.add(zArrow);

  const x = makeTextSprite("X", "#fecaca");
  x.position.set(size * 1.06, 0, 0);

  const y = makeTextSprite("Y", "#bbf7d0");
  y.position.set(0, size * 1.06, 0);

  const z = makeTextSprite("Z", "#bfdbfe");
  z.position.set(0, 0, size * 1.06);

  scene.add(x);
  scene.add(y);
  scene.add(z);
}

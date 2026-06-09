import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

export class SceneManager {
  readonly scene: THREE.Scene;
  readonly camera: THREE.PerspectiveCamera;
  readonly renderer: THREE.WebGLRenderer;
  readonly controls: OrbitControls;
  readonly root: HTMLDivElement;

  private frameId: number | null = null;

  constructor(root: HTMLDivElement) {
    this.root = root;
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x101318);

    this.camera = new THREE.PerspectiveCamera(50, 1, 0.01, 1000);
    this.camera.position.set(4, 4, 4);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    root.appendChild(this.renderer.domElement);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;

    const light = new THREE.DirectionalLight(0xffffff, 2);
    light.position.set(3, 5, 4);
    this.scene.add(light);
    this.scene.add(new THREE.AmbientLight(0xffffff, 0.45));

    window.addEventListener("resize", () => this.resize());
    this.resize();
  }

  start(): void {
    if (this.frameId !== null) return;

    const tick = () => {
      this.controls.update();
      this.renderer.render(this.scene, this.camera);
      this.frameId = requestAnimationFrame(tick);
    };

    tick();
  }

  stop(): void {
    if (this.frameId !== null) {
      cancelAnimationFrame(this.frameId);
      this.frameId = null;
    }
  }

  resize(): void {
    const rect = this.root.getBoundingClientRect();
    const width = Math.max(1, rect.width);
    const height = Math.max(1, rect.height);

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height, false);
  }

  exportPNG(filename = "lattice-view.png"): void {
    this.renderer.render(this.scene, this.camera);
    const a = document.createElement("a");
    a.href = this.renderer.domElement.toDataURL("image/png");
    a.download = filename;
    a.click();
  }

  clearDynamicObjects(): void {
    const keep = new Set<THREE.Object3D>();

    for (const child of this.scene.children) {
      if (child instanceof THREE.Light) keep.add(child);
    }

    const toRemove = this.scene.children.filter((child) => !keep.has(child));

    for (const obj of toRemove) {
      this.scene.remove(obj);
      disposeObject(obj);
    }
  }
}

function disposeObject(obj: THREE.Object3D): void {
  obj.traverse((child) => {
    const mesh = child as THREE.Mesh;
    if (mesh.geometry) mesh.geometry.dispose();

    const material = mesh.material;
    if (Array.isArray(material)) {
      material.forEach((m) => m.dispose());
    } else if (material) {
      material.dispose();
    }
  });
}

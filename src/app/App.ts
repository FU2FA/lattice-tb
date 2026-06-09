import { SceneManager } from "../visualizer/SceneManager";
import {
  updateRealSpaceScene,
  updateReciprocalSpaceScene,
  usesReciprocalView,
  type RenderOptions,
} from "../visualizer/updateLatticeScene";
import { allLattices, latticeById } from "../presets/lattices";
import { MODEL_FACTORIES, modelsForLattice, modelById } from "../presets/models";
import { solveBands } from "../core/tightbinding/solveBands";
import { solveDOS, type DOSProjectionMode } from "../core/tightbinding/solveDos";
import type { BandColorMode } from "../core/tightbinding/tbTypes";
import type { Vec3 } from "../core/math/vec";
import { BandPlot } from "./BandPlot";
import { DOSPlot } from "./DOSPlot";
import { latticeExplanation, modelExplanation } from "./explanations";
import { renderFormulaHelp } from "./formulaHelp";
import { scaleLatticeAnisotropic } from "../core/lattice/scaleLattice";
import {
  applyPhysicalOptions,
  DEFAULT_PHYSICAL_OPTIONS,
  type HoppingScaleMode,
  type PhysicalOptions,
} from "../core/tightbinding/physicalSimulation";

export class App {
  private bandIsStale = false;
  private readonly root: HTMLDivElement;
  private readonly viewerRoot: HTMLDivElement;
  private readonly realSceneRoot: HTMLDivElement;
  private readonly reciprocalSceneRoot: HTMLDivElement;
  private readonly realManager: SceneManager;
  private readonly reciprocalManager: SceneManager;
  private readonly bandPlot: BandPlot;
  private readonly dosPlot: DOSPlot;

  private latticeId = "sc";
  private modelId = "sc_s";

  private renderOptions: RenderOptions = {
    supercellSize: 2,
    viewScale: 1,
    reciprocalViewScale: 0.18,

    // Start with only these visual helpers enabled:
    // - XYZ Cartesian frame
    // - lattice vectors
    // - reciprocal primitive cell
    showSimpleCubicCell: false,
    showPrimitiveCell: false,
    showBonds: false,
    showAxes: true,
    showCartesianFrame: true,
    showWignerSeitz: false,
    showReciprocalLattice: false,
    showBrillouinZone: false,
    showReciprocalPrimitiveCell: false,
  };

  private physicalOptions: PhysicalOptions = structuredClone(DEFAULT_PHYSICAL_OPTIONS);
  private shellOptions = {
    epsilon: 0,
    t1: -1,
    t2: 0.25,
    t3: -0.1,
    shellCount: 3,
  };
  private hasInitializedCamera = false;
  private previousSplitState = false;
  private hoveredBandK: Vec3 | null = null;
  private customKPathLabels: string[] | null = null;

  private latticeSelect!: HTMLSelectElement;
  private modelSelect!: HTMLSelectElement;
  private supercellInput!: HTMLInputElement;
  private primitiveCellCheckbox!: HTMLInputElement;
  private simpleCubicCellCheckbox!: HTMLInputElement;
  private scaleXSlider!: HTMLInputElement;
  private scaleYSlider!: HTMLInputElement;
  private scaleZSlider!: HTMLInputElement;
  private scaleXValue!: HTMLSpanElement;
  private scaleYValue!: HTMLSpanElement;
  private scaleZValue!: HTMLSpanElement;
  private hoppingModeSelect!: HTMLSelectElement;
  private betaInput!: HTMLInputElement;
  private powerInput!: HTMLInputElement;
  private pointsInput!: HTMLInputElement;
  private kPathPresetSelect!: HTMLSelectElement;
  private kPathStatus!: HTMLDivElement;
  private dosGridInput!: HTMLInputElement;
  private dosBroadeningInput!: HTMLInputElement;
  private dosProjectionSelect!: HTMLSelectElement;
  private bandColorModeSelect!: HTMLSelectElement;
  private electronFillingInput!: HTMLInputElement;
  private electronFillingValue!: HTMLSpanElement;
  private t1Slider!: HTMLInputElement;
  private t2Slider!: HTMLInputElement;
  private t3Slider!: HTMLInputElement;
  private t1Value!: HTMLSpanElement;
  private t2Value!: HTMLSpanElement;
  private t3Value!: HTMLSpanElement;
  private shellControlBlock!: HTMLDivElement;
  private infoBox!: HTMLDivElement;
  private bandSummaryBox!: HTMLDivElement;
  private explanationBox!: HTMLDivElement;
  private formulaHelpBox!: HTMLDivElement;
  private bandWarningBox!: HTMLDivElement;
  private floatingBandOverlay!: HTMLDivElement;

  constructor(root: HTMLDivElement) {
    this.root = root;

    this.root.innerHTML = `
      <div class="app-shell">
        <aside class="panel left" id="left-panel"></aside>
        <main class="viewer single" id="viewer">
          <section class="scene-pane" id="real-scene-pane">
            <div class="scene-label">Real space</div>
          </section>
          <section class="scene-pane hidden" id="reciprocal-scene-pane">
            <div class="scene-label">Reciprocal space</div>
          </section>
        </main>
        <aside class="panel right" id="right-panel"></aside>
      </div>
      <div class="floating-band-overlay" id="floating-band-overlay">
        <div class="overlay-title">Band plot</div>
        <div class="floating-band-content">
          <canvas id="band-canvas" class="band-canvas floating-band-canvas"></canvas>
          <div class="floating-band-actions">
            <button id="save-band-reference-button" class="secondary-button">Save reference</button>
            <button id="clear-band-reference-button" class="secondary-button">Clear reference</button>
            <button id="export-band-button" class="secondary-button">Export band PNG</button>
            <button id="export-model-button" class="secondary-button">Export model JSON</button>
          </div>
        </div>
      </div>
    `;

    this.viewerRoot = this.root.querySelector<HTMLDivElement>("#viewer")!;
    this.realSceneRoot = this.root.querySelector<HTMLDivElement>("#real-scene-pane")!;
    this.reciprocalSceneRoot = this.root.querySelector<HTMLDivElement>("#reciprocal-scene-pane")!;
    this.floatingBandOverlay = this.root.querySelector<HTMLDivElement>("#floating-band-overlay")!;

    this.realManager = new SceneManager(this.realSceneRoot);
    this.reciprocalManager = new SceneManager(this.reciprocalSceneRoot);

    this.buildLeftPanel(this.root.querySelector<HTMLDivElement>("#left-panel")!);
    this.buildRightPanel(this.root.querySelector<HTMLDivElement>("#right-panel")!);

    const canvas = this.root.querySelector<HTMLCanvasElement>("#band-canvas")!;
    this.bandPlot = new BandPlot(canvas, (point) => {
      this.hoveredBandK = point?.k ?? null;
      this.refreshReciprocalSceneOnly();
    });

    const dosCanvas = this.root.querySelector<HTMLCanvasElement>("#dos-canvas")!;
    this.dosPlot = new DOSPlot(dosCanvas);

    this.updateModelOptions();
    this.refreshAll();
  }

  start(): void {
    this.realManager.start();
    this.reciprocalManager.start();
  }

  private buildLeftPanel(panel: HTMLDivElement): void {
    const lattices = allLattices();

    panel.innerHTML = `
      <h1>Lattice TB</h1>

      <h2>Lattice</h2>
      <label for="lattice-select">Lattice preset</label>
      <select id="lattice-select">
        ${this.renderLatticeOptions(lattices)}
      </select>

      <label for="supercell-input">Display cells per axis</label>
      <input id="supercell-input" type="number" min="1" max="8" step="1" value="${this.renderOptions.supercellSize}" />


      <h2>Cell display</h2>
      <label class="checkbox-row">
        <input id="show-simple-cubic-cell" type="checkbox" />
        cells
      </label>

      <label class="checkbox-row">
        <input id="show-primitive-cell" type="checkbox" />
        primitive cells
      </label>

      <h2>Real-space render</h2>
      <label class="checkbox-row">
        <input id="show-cartesian-frame" type="checkbox" checked />
        XYZ Cartesian frame
      </label>

      <label class="checkbox-row">
        <input id="show-bonds" type="checkbox" />
        visual nearest bonds
      </label>

      <label class="checkbox-row">
        <input id="show-axes" type="checkbox" checked />
        lattice vectors
      </label>

      <label class="checkbox-row">
        <input id="show-wigner-seitz" type="checkbox" />
        Wigner-Seitz zones
      </label>

      <h2>Reciprocal-space render</h2>

      <label class="checkbox-row">
        <input id="show-reciprocal-lattice" type="checkbox" />
        reciprocal lattice
      </label>

      <label class="checkbox-row">
        <input id="show-brillouin-zone" type="checkbox" />
        Brillouin zone
      </label>

      <label class="checkbox-row">
        <input id="show-reciprocal-primitive-cell" type="checkbox" />
        reciprocal primitive cell
      </label>

      <p class="small">
        Reciprocal options split the center viewer into real space and reciprocal space.
      </p>
    `;

    this.latticeSelect = panel.querySelector<HTMLSelectElement>("#lattice-select")!;
    this.supercellInput = panel.querySelector<HTMLInputElement>("#supercell-input")!;
    this.primitiveCellCheckbox = panel.querySelector<HTMLInputElement>("#show-primitive-cell")!;
    this.simpleCubicCellCheckbox = panel.querySelector<HTMLInputElement>("#show-simple-cubic-cell")!;


    this.latticeSelect.value = this.latticeId;
    this.updatePrimitiveCellAvailability();

    this.latticeSelect.addEventListener("change", () => {
      const previousModelId = this.modelId;

      this.latticeId = this.latticeSelect.value;
      this.modelId = this.chooseModelForLatticePreservingKind(this.latticeId, previousModelId);

      this.updatePrimitiveCellAvailability();
      this.updateModelOptions();
      this.customKPathLabels = null;
      this.syncKPathInputFromState();
      this.refreshAll();
    });

    const applyDisplayCellsPerAxis = () => {
      let value = Number(this.supercellInput.value);

      if (!Number.isFinite(value)) {
        return;
      }

      value = Math.max(1, Math.min(8, Math.round(value)));

      if (value === this.renderOptions.supercellSize) {
        this.supercellInput.value = String(value);
        return;
      }

      this.renderOptions.supercellSize = value;
      this.supercellInput.value = String(value);
      this.refreshScene();
    };

    this.supercellInput.addEventListener("input", applyDisplayCellsPerAxis);
    this.supercellInput.addEventListener("change", applyDisplayCellsPerAxis);


    this.bindCheckbox(panel, "#show-simple-cubic-cell", (v) => this.renderOptions.showSimpleCubicCell = v);
    this.bindCheckbox(panel, "#show-primitive-cell", (v) => this.renderOptions.showPrimitiveCell = v);
    this.bindCheckbox(panel, "#show-cartesian-frame", (v) => this.renderOptions.showCartesianFrame = v);
    this.bindCheckbox(panel, "#show-bonds", (v) => this.renderOptions.showBonds = v);
    this.bindCheckbox(panel, "#show-axes", (v) => this.renderOptions.showAxes = v);
    this.bindCheckbox(panel, "#show-wigner-seitz", (v) => this.renderOptions.showWignerSeitz = v);
    this.bindCheckbox(panel, "#show-reciprocal-lattice", (v) => this.renderOptions.showReciprocalLattice = v);
    this.bindCheckbox(panel, "#show-brillouin-zone", (v) => this.renderOptions.showBrillouinZone = v);
    this.bindCheckbox(panel, "#show-reciprocal-primitive-cell", (v) => this.renderOptions.showReciprocalPrimitiveCell = v);
  }


  private renderLatticeOptions(lattices: ReturnType<typeof allLattices>): string {
    const bravaisIds = new Set([
      "sc",
      "bcc",
      "fcc",
      "tetragonal",
      "bct",
      "orthorhombic",
      "hexagonal",
      "rhombohedral",
    ]);

    const groups = [
      {
        label: "3D Bravais lattices",
        items: lattices.filter((lattice) => lattice.dim === 3 && bravaisIds.has(lattice.id)),
      },
      {
        label: "3D structures with basis / framework",
        items: lattices.filter((lattice) => lattice.dim === 3 && !bravaisIds.has(lattice.id)),
      },
      {
        label: "2D lattices",
        items: lattices.filter((lattice) => lattice.dim === 2),
      },
    ];

    return groups
      .filter((group) => group.items.length > 0)
      .map((group) => `
        <optgroup label="${group.label}">
          ${group.items.map((lattice) => `<option value="${lattice.id}">${lattice.name}</option>`).join("")}
        </optgroup>
      `)
      .join("");
  }


  private modelKind(modelId: string): "shell" | "multi" | "honeycombPz" | "simple" {
    if (modelId.includes("_shell_s")) return "shell";
    if (modelId.includes("_sp3")) return "multi";
    if (modelId === "honeycomb_pz" || modelId === "graphene_pz") return "honeycombPz";
    return "simple";
  }

  private chooseModelForLatticePreservingKind(
    latticeId: string,
    previousModelId: string,
  ): string {
    const models = modelsForLattice(latticeId);
    if (models.length === 0) return previousModelId;

    const previousKind = this.modelKind(previousModelId);

    if (previousKind === "honeycombPz") {
      const pz = models.find((model) => this.modelKind(model.id) === "honeycombPz");
      if (pz) return pz.id;

      const simple = models.find((model) => this.modelKind(model.id) === "simple");
      return simple?.id ?? models[0].id;
    }

    const sameKind = models.find((model) => this.modelKind(model.id) === previousKind);
    if (sameKind) return sameKind.id;

    const simple = models.find((model) => this.modelKind(model.id) === "simple");
    if (simple) return simple.id;

    return models[0].id;
  }

  private cleanModelLabelById(modelId: string): string {
    const kind = this.modelKind(modelId);

    if (kind === "simple") return "Basic s-orbital";
    if (kind === "shell") return "Shell s-orbital, t1/t2/t3";
    if (kind === "multi") return "sp3 multi-orbital";
    return "Honeycomb pz";
  }

  private modelGroupLabel(model: (typeof MODEL_FACTORIES)[number]): string {
    const kind = this.modelKind(model.id);

    if (kind === "honeycombPz") return "Specialized models";
    if (kind === "multi") return "Multi-orbital models";
    if (kind === "shell") return "Shell models";
    return "Basic models";
  }

  private renderModelOptions(models: Array<(typeof MODEL_FACTORIES)[number]>): string {
    const groupOrder = [
      "Specialized models",
      "Multi-orbital models",
      "Shell models",
      "Basic models",
    ];

    return groupOrder
      .map((label) => ({
        label,
        items: models.filter((model) => this.modelGroupLabel(model) === label),
      }))
      .filter((group) => group.items.length > 0)
      .map((group) => `
        <optgroup label="${group.label}">
          ${group.items.map((model) => `<option value="${model.id}">${this.cleanModelLabelById(model.id)}</option>`).join("")}
        </optgroup>
      `)
      .join("");
  }

  private updatePrimitiveCellAvailability(): void {
    // All lattices, including graphene, may show both:
    // - simple / XYZ guide cells
    // - primitive vector cells
    //
    // For graphene, simple / XYZ is a square guide cell, while primitive is
    // the physical parallelogram.
    this.simpleCubicCellCheckbox.disabled = false;
    this.simpleCubicCellCheckbox.parentElement?.classList.remove("disabled-option");
    this.simpleCubicCellCheckbox.title = "";

    this.primitiveCellCheckbox.disabled = false;
    this.primitiveCellCheckbox.parentElement?.classList.remove("disabled-option");
    this.primitiveCellCheckbox.title = "";
  }

  private bindCheckbox(panel: HTMLDivElement, selector: string, setter: (checked: boolean) => void): void {
    panel.querySelector<HTMLInputElement>(selector)!.addEventListener("change", (event) => {
      setter((event.target as HTMLInputElement).checked);
      this.refreshScene();
    });
  }

  private buildRightPanel(panel: HTMLDivElement): void {
    panel.innerHTML = `
      <h2>TB parameters</h2>

      <label>Physical scale applied to x/y/z</label>
      <div class="slider-stack">
        <label class="slider-row">
          <span>x</span>
          <input id="scale-x-slider" type="range" min="0.2" max="5" step="0.01" value="${this.physicalOptions.scale.x}" />
          <span id="scale-x-value" class="slider-value">${this.physicalOptions.scale.x.toFixed(2)}</span>
        </label>
        <label class="slider-row">
          <span>y</span>
          <input id="scale-y-slider" type="range" min="0.2" max="5" step="0.01" value="${this.physicalOptions.scale.y}" />
          <span id="scale-y-value" class="slider-value">${this.physicalOptions.scale.y.toFixed(2)}</span>
        </label>
        <label class="slider-row">
          <span>z</span>
          <input id="scale-z-slider" type="range" min="0.2" max="5" step="0.01" value="${this.physicalOptions.scale.z}" />
          <span id="scale-z-value" class="slider-value">${this.physicalOptions.scale.z.toFixed(2)}</span>
        </label>
      </div>

      <label for="hopping-mode-select">Hopping scale law</label>
      <select id="hopping-mode-select">
        <option value="fixed">fixed: t(d)=t0</option>
        <option value="exponential" selected>exponential: t0 exp[-β(d/d0-1)]</option>
        <option value="power">power: t0(d0/d)^n</option>
      </select>

      <div class="param-grid">
        <div>
          <label for="beta-input">β</label>
          <input id="beta-input" type="number" min="0" max="20" step="0.1" value="${this.physicalOptions.beta}" />
        </div>
        <div>
          <label for="power-input">n</label>
          <input id="power-input" type="number" min="0" max="12" step="0.1" value="${this.physicalOptions.power}" />
        </div>
      </div>

      <button id="apply-physics-button">Apply simulation</button>
      <button id="reset-physics-button" class="secondary-button">Reset TB parameters</button>

      <h2>Band model</h2>

      <label for="model-select">Model</label>
      <select id="model-select"></select>

      <div id="shell-control-block" class="control-block">
        <h3>Shell hopping</h3>
        <p class="small">
          Enabled for Shell s-orbital, t1/t2/t3.
        </p>
        <div class="slider-stack">
          <label class="slider-row">
            <span>t1</span>
            <input id="t1-slider" type="range" min="-5" max="5" step="0.01" value="${this.shellOptions.t1}" />
            <span id="t1-value" class="slider-value">${this.shellOptions.t1.toFixed(2)}</span>
          </label>
          <label class="slider-row">
            <span>t2</span>
            <input id="t2-slider" type="range" min="-5" max="5" step="0.01" value="${this.shellOptions.t2}" />
            <span id="t2-value" class="slider-value">${this.shellOptions.t2.toFixed(2)}</span>
          </label>
          <label class="slider-row">
            <span>t3</span>
            <input id="t3-slider" type="range" min="-5" max="5" step="0.01" value="${this.shellOptions.t3}" />
            <span id="t3-value" class="slider-value">${this.shellOptions.t3.toFixed(2)}</span>
          </label>
        </div>
        <button id="reset-shell-button" class="secondary-button">Reset shell hopping</button>
      </div>

      <label for="points-input">Points per segment</label>
      <input id="points-input" type="number" min="8" max="120" step="1" value="36" />

      <details class="advanced-block">
        <summary>Advanced k-path</summary>
        <label for="k-path-preset-select">Path preset</label>
        <select id="k-path-preset-select"></select>
        <div id="k-path-status" class="small"></div>
      </details>

      <label for="band-color-mode-select">Band coloring</label>
      <select id="band-color-mode-select">
        <option value="plain">Plain</option>
        <option value="s">s weight</option>
        <option value="p">p total weight</option>
        <option value="px">px weight</option>
        <option value="py">py weight</option>
        <option value="pz">pz weight</option>
        <option value="site0">Site 0 / A weight</option>
        <option value="site1">Site 1 / B weight</option>
      </select>

      <label class="slider-row">
        <span>electrons / cell</span>
        <input id="electron-filling-input" type="range" min="0" max="40" step="0.1" value="2" />
        <span id="electron-filling-value" class="slider-value">2.00</span>
      </label>

      <button id="calculate-button">Calculate bands</button>
      <div id="band-warning-box" class="warning-text hidden"></div>

      <h2>Band summary</h2>
      <div id="band-summary-box" class="small"></div>

      <h2>DOS / PDOS</h2>
      <div class="param-grid">
        <div>
          <label for="dos-grid-input">k-grid</label>
          <input id="dos-grid-input" type="number" min="2" max="80" step="1" value="18" />
        </div>
        <div>
          <label for="dos-broadening-input">η</label>
          <input id="dos-broadening-input" type="number" min="0.001" max="2" step="0.01" value="0.08" />
        </div>
      </div>

      <label for="dos-projection-select">Projection</label>
      <select id="dos-projection-select">
        <option value="total">Total DOS</option>
        <option value="s">s PDOS</option>
        <option value="p">p total PDOS</option>
        <option value="px">px PDOS</option>
        <option value="py">py PDOS</option>
        <option value="pz">pz PDOS</option>
        <option value="site0">Site 0 / A PDOS</option>
        <option value="site1">Site 1 / B PDOS</option>
      </select>

      <button id="calculate-dos-button" class="secondary-button">Calculate DOS / PDOS</button>
      <button id="export-dos-button" class="secondary-button">Export DOS PNG</button>
      <canvas id="dos-canvas" class="band-canvas dos-canvas"></canvas>

      <h2>Structure / model guide</h2>
      <div id="explanation-box" class="small"></div>

      <h2>Calculation help</h2>
      <div id="formula-help-box" class="small"></div>

      <h2>Model info</h2>
      <div id="info-box" class="small"></div>
    `;

    this.modelSelect = panel.querySelector<HTMLSelectElement>("#model-select")!;
    this.scaleXSlider = panel.querySelector<HTMLInputElement>("#scale-x-slider")!;
    this.scaleYSlider = panel.querySelector<HTMLInputElement>("#scale-y-slider")!;
    this.scaleZSlider = panel.querySelector<HTMLInputElement>("#scale-z-slider")!;
    this.scaleXValue = panel.querySelector<HTMLSpanElement>("#scale-x-value")!;
    this.scaleYValue = panel.querySelector<HTMLSpanElement>("#scale-y-value")!;
    this.scaleZValue = panel.querySelector<HTMLSpanElement>("#scale-z-value")!;
    this.hoppingModeSelect = panel.querySelector<HTMLSelectElement>("#hopping-mode-select")!;
    this.betaInput = panel.querySelector<HTMLInputElement>("#beta-input")!;
    this.powerInput = panel.querySelector<HTMLInputElement>("#power-input")!;
    this.pointsInput = panel.querySelector<HTMLInputElement>("#points-input")!;
    this.kPathPresetSelect = panel.querySelector<HTMLSelectElement>("#k-path-preset-select")!;
    this.kPathStatus = panel.querySelector<HTMLDivElement>("#k-path-status")!;
    this.dosGridInput = panel.querySelector<HTMLInputElement>("#dos-grid-input")!;
    this.dosBroadeningInput = panel.querySelector<HTMLInputElement>("#dos-broadening-input")!;
    this.dosProjectionSelect = panel.querySelector<HTMLSelectElement>("#dos-projection-select")!;
    this.bandColorModeSelect = panel.querySelector<HTMLSelectElement>("#band-color-mode-select")!;
    this.electronFillingInput = panel.querySelector<HTMLInputElement>("#electron-filling-input")!;
    this.electronFillingValue = panel.querySelector<HTMLSpanElement>("#electron-filling-value")!;
    this.shellControlBlock = panel.querySelector<HTMLDivElement>("#shell-control-block")!;
    this.t1Slider = panel.querySelector<HTMLInputElement>("#t1-slider")!;
    this.t2Slider = panel.querySelector<HTMLInputElement>("#t2-slider")!;
    this.t3Slider = panel.querySelector<HTMLInputElement>("#t3-slider")!;
    this.t1Value = panel.querySelector<HTMLSpanElement>("#t1-value")!;
    this.t2Value = panel.querySelector<HTMLSpanElement>("#t2-value")!;
    this.t3Value = panel.querySelector<HTMLSpanElement>("#t3-value")!;
    this.infoBox = panel.querySelector<HTMLDivElement>("#info-box")!;
    this.bandSummaryBox = panel.querySelector<HTMLDivElement>("#band-summary-box")!;
    this.explanationBox = panel.querySelector<HTMLDivElement>("#explanation-box")!;
    this.formulaHelpBox = panel.querySelector<HTMLDivElement>("#formula-help-box")!;
    this.bandWarningBox = panel.querySelector<HTMLDivElement>("#band-warning-box")!;

    this.modelSelect.addEventListener("change", () => {
      this.modelId = this.modelSelect.value;
      const model = modelById(this.modelId);
      this.latticeId = model.lattice.id;
      this.latticeSelect.value = this.latticeId;
      this.updatePrimitiveCellAvailability();
      this.customKPathLabels = null;
      this.syncKPathInputFromState();
      this.syncShellSlidersFromState();
      this.refreshAll();
    });

    const applyPhysics = () => {
      this.readPhysicalOptionsFromUI();
      this.refreshAll();
    };

    const previewPhysics = () => {
      this.readPhysicalOptionsFromUI();
      this.refreshAll();
    };

    this.scaleXSlider.addEventListener("input", previewPhysics);
    this.scaleYSlider.addEventListener("input", previewPhysics);
    this.scaleZSlider.addEventListener("input", previewPhysics);

    panel.querySelector<HTMLButtonElement>("#apply-physics-button")!.addEventListener("click", applyPhysics);

    this.hoppingModeSelect.addEventListener("change", applyPhysics);
    this.betaInput.addEventListener("change", applyPhysics);
    this.powerInput.addEventListener("change", applyPhysics);

    panel.querySelector<HTMLButtonElement>("#reset-physics-button")!.addEventListener("click", () => {
      this.physicalOptions = structuredClone(DEFAULT_PHYSICAL_OPTIONS);
      this.hoppingModeSelect.value = this.physicalOptions.hoppingScaleMode;
      this.betaInput.value = String(this.physicalOptions.beta);
      this.powerInput.value = String(this.physicalOptions.power);
      this.syncScaleSlidersFromState();
      this.refreshAll();
    });

    const updateShellHopping = () => {
      this.readShellOptionsFromUI();
      if (this.isShellModelSelected()) {
        this.refreshBands();
      }
    };

    this.t1Slider.addEventListener("input", updateShellHopping);
    this.t2Slider.addEventListener("input", updateShellHopping);
    this.t3Slider.addEventListener("input", updateShellHopping);

    panel.querySelector<HTMLButtonElement>("#reset-shell-button")!.addEventListener("click", () => {
      this.shellOptions = {
        epsilon: 0,
        t1: -1,
        t2: 0.25,
        t3: -0.1,
        shellCount: 3,
      };
      this.syncShellSlidersFromState();
      if (this.isShellModelSelected()) {
        this.refreshBands();
      }
    });

    this.syncShellSlidersFromState();

    this.bandColorModeSelect.addEventListener("change", () => {
      this.refreshBands();
    });

    this.electronFillingInput.addEventListener("input", () => {
      this.syncElectronFillingFromUI();
      this.refreshBands();
    });

    panel.querySelector<HTMLButtonElement>("#calculate-button")!.addEventListener("click", () => {
      this.readPhysicalOptionsFromUI();
      this.refreshBands();
    });

    this.kPathPresetSelect.addEventListener("change", () => {
      this.applyKPathPresetFromSelect();
    });

    this.root.querySelector<HTMLButtonElement>("#save-band-reference-button")!.addEventListener("click", () => {
      this.bandPlot.saveCurrentAsReference();
      this.refreshBands();
    });

    this.root.querySelector<HTMLButtonElement>("#clear-band-reference-button")!.addEventListener("click", () => {
      this.bandPlot.clearReference();
      this.refreshBands();
    });

    this.root.querySelector<HTMLButtonElement>("#export-band-button")!.addEventListener("click", () => {
      this.bandPlot.exportPNG(this.exportName("band", "png"));
    });

    this.root.querySelector<HTMLButtonElement>("#export-model-button")!.addEventListener("click", () => {
      this.exportCurrentModelJSON();
    });

    panel.querySelector<HTMLButtonElement>("#calculate-dos-button")!.addEventListener("click", () => {
      this.readPhysicalOptionsFromUI();
      this.refreshDOS();
    });

    panel.querySelector<HTMLButtonElement>("#export-dos-button")!.addEventListener("click", () => {
      this.dosPlot.exportPNG(this.exportName("dos", "png"));
    });
  }



  private electronFilling(): number {
    const value = Number(this.electronFillingInput?.value ?? 2);
    if (!Number.isFinite(value)) return 2;
    return Math.max(0, Math.min(80, value));
  }

  private syncElectronFillingFromUI(): void {
    const value = this.electronFilling();
    if (this.electronFillingInput) {
      this.electronFillingInput.value = String(value);
    }
    if (this.electronFillingValue) {
      this.electronFillingValue.textContent = value.toFixed(2);
    }
  }

  private isShellModelSelected(): boolean {
    return this.modelId.includes("_shell_s");
  }

  private syncShellSlidersFromState(): void {
    this.t1Slider.value = String(this.shellOptions.t1);
    this.t2Slider.value = String(this.shellOptions.t2);
    this.t3Slider.value = String(this.shellOptions.t3);
    this.t1Value.textContent = this.shellOptions.t1.toFixed(2);
    this.t2Value.textContent = this.shellOptions.t2.toFixed(2);
    this.t3Value.textContent = this.shellOptions.t3.toFixed(2);

    const enabled = this.isShellModelSelected();
    this.shellControlBlock.classList.toggle("disabled-option", !enabled);
    this.t1Slider.disabled = !enabled;
    this.t2Slider.disabled = !enabled;
    this.t3Slider.disabled = !enabled;
  }

  private readShellOptionsFromUI(): void {
    let t1 = Number(this.t1Slider.value);
    let t2 = Number(this.t2Slider.value);
    let t3 = Number(this.t3Slider.value);

    if (!Number.isFinite(t1)) t1 = -1;
    if (!Number.isFinite(t2)) t2 = 0.25;
    if (!Number.isFinite(t3)) t3 = -0.1;

    t1 = Math.max(-5, Math.min(5, t1));
    t2 = Math.max(-5, Math.min(5, t2));
    t3 = Math.max(-5, Math.min(5, t3));

    this.shellOptions = {
      ...this.shellOptions,
      t1,
      t2,
      t3,
    };

    this.syncShellSlidersFromState();
  }

  private syncScaleSlidersFromState(): void {
    const s = this.physicalOptions.scale;
    if (!this.scaleXSlider || !this.scaleYSlider || !this.scaleZSlider) {
      return;
    }

    this.scaleXSlider.value = String(s.x);
    this.scaleYSlider.value = String(s.y);
    this.scaleZSlider.value = String(s.z);
    this.scaleXValue.textContent = s.x.toFixed(2);
    this.scaleYValue.textContent = s.y.toFixed(2);
    this.scaleZValue.textContent = s.z.toFixed(2);
  }

  private readPhysicalOptionsFromUI(): void {
    let sx = Number(this.scaleXSlider?.value ?? this.physicalOptions.scale.x);
    let sy = Number(this.scaleYSlider?.value ?? this.physicalOptions.scale.y);
    let sz = Number(this.scaleZSlider?.value ?? this.physicalOptions.scale.z);

    if (!Number.isFinite(sx)) sx = 1;
    if (!Number.isFinite(sy)) sy = 1;
    if (!Number.isFinite(sz)) sz = 1;

    sx = Math.max(0.05, Math.min(20, sx));
    sy = Math.max(0.05, Math.min(20, sy));
    sz = Math.max(0.05, Math.min(20, sz));

    let beta = Number(this.betaInput.value);
    if (!Number.isFinite(beta)) beta = 3;
    beta = Math.max(0, Math.min(20, beta));

    let power = Number(this.powerInput.value);
    if (!Number.isFinite(power)) power = 2;
    power = Math.max(0, Math.min(12, power));

    this.physicalOptions = {
      scale: { x: sx, y: sy, z: sz },
      hoppingScaleMode: this.hoppingModeSelect.value as HoppingScaleMode,
      beta,
      power,
    };

    this.syncScaleSlidersFromState();
    this.betaInput.value = String(beta);
    this.powerInput.value = String(power);
  }

  private updateModelOptions(): void {
    const models = modelsForLattice(this.latticeId);
    const options = models.length > 0 ? models : MODEL_FACTORIES;

    if (!options.some((model) => model.id === this.modelId)) {
      this.modelId = this.chooseModelForLatticePreservingKind(this.latticeId, this.modelId);
    }

    this.modelSelect.innerHTML = this.renderModelOptions(options);
    this.modelSelect.value = this.modelId;

    if (this.shellControlBlock) {
      this.syncShellSlidersFromState();
    }
  }


  private markBandsStale(reason = "Band plot may be outdated. Click Calculate bands to update."): void {
    this.bandIsStale = true;

    if (this.bandWarningBox) {
      this.bandWarningBox.textContent = reason;
      this.bandWarningBox.classList.remove("hidden");
    }
  }

  private refreshSceneOnlyAndMarkBandsStale(): void {
    this.refreshScene();
    this.markBandsStale();
  }

  private refreshAll(): void {
    this.updateExplanationPanel();
    if (this.formulaHelpBox) {
      renderFormulaHelp(this.formulaHelpBox);
    }
    this.syncKPathInputFromState();
    if (this.bandWarningBox) {
      this.bandWarningBox.textContent = "";
      this.bandWarningBox.classList.add("hidden");
    }
    this.refreshScene();
    this.refreshBands();
  }

  private refreshReciprocalSceneOnly(): void {
    const split = usesReciprocalView(this.renderOptions);
    if (!split) return;

    const baseLattice = latticeById(this.latticeId);
    const physicalLattice = scaleLatticeAnisotropic(baseLattice, this.physicalOptions.scale);

    updateReciprocalSpaceScene(
      this.reciprocalManager,
      physicalLattice,
      this.renderOptions,
      false,
      this.activeKPathLabels(),
      this.hoveredBandK,
    );
  }


  private availableKLabels(): string[] {
    const baseModel = modelById(this.modelId, { shellS: this.shellOptions });
    return Object.keys(baseModel.lattice.highSymmetry);
  }

  private defaultKPathLabels(): string[] {
    const baseModel = modelById(this.modelId, { shellS: this.shellOptions });
    return baseModel.defaultPath;
  }

  private activeKPathLabels(): string[] {
    if (this.customKPathLabels && this.customKPathLabels.length >= 2) {
      return this.customKPathLabels;
    }

    return this.defaultKPathLabels();
  }

  private uniqueKPathOptions(): Array<{ id: string; name: string; labels: string[] }> {
    const defaultPath = this.defaultKPathLabels();
    const available = this.availableKLabels();
    const availableSet = new Set(available);

    const candidates: Array<{ id: string; name: string; labels: string[] }> = [
      {
        id: "default",
        name: `Default: ${defaultPath.join(" → ")}`,
        labels: defaultPath,
      },
      {
        id: "reverse",
        name: `Reverse: ${defaultPath.slice().reverse().join(" → ")}`,
        labels: defaultPath.slice().reverse(),
      },
    ];

    if (defaultPath.length > 3) {
      candidates.push({
        id: "short",
        name: `Short: ${defaultPath.slice(0, 3).join(" → ")}`,
        labels: defaultPath.slice(0, 3),
      });
    }

    const preferredSets: Array<{ id: string; name: string; labels: string[] }> = [
      { id: "common-3d", name: "Common cubic path", labels: ["G", "X", "M", "G", "R", "X"] },
      { id: "fcc-like", name: "FCC-like extended path", labels: ["G", "X", "W", "K", "G", "L"] },
      { id: "hex-like", name: "Hexagonal extended path", labels: ["G", "M", "K", "G", "A", "L", "H", "A"] },
      { id: "2d-hex", name: "2D hexagonal path", labels: ["G", "M", "K", "G"] },
    ];

    for (const item of preferredSets) {
      if (item.labels.every((label) => availableSet.has(label))) {
        candidates.push({
          ...item,
          name: `${item.name}: ${item.labels.join(" → ")}`,
        });
      }
    }

    for (const label of available) {
      if (label === "G") continue;
      const labels = ["G", label, "G"].filter((x) => availableSet.has(x));
      if (labels.length >= 2) {
        candidates.push({
          id: `g-${label.toLowerCase()}-g`,
          name: `Γ-${label}-Γ`,
          labels,
        });
      }
    }

    const seen = new Set<string>();
    const out: Array<{ id: string; name: string; labels: string[] }> = [];

    for (const option of candidates) {
      if (option.labels.length < 2) continue;
      if (!option.labels.every((label) => availableSet.has(label))) continue;

      const key = option.labels.join("|");
      if (seen.has(key)) continue;

      seen.add(key);
      out.push(option);
    }

    return out;
  }

  private syncKPathInputFromState(): void {
    if (!this.kPathPresetSelect || !this.kPathStatus) return;

    const options = this.uniqueKPathOptions();
    const active = this.activeKPathLabels();
    const activeKey = active.join("|");

    this.kPathPresetSelect.innerHTML = options.map((option) => {
      const key = option.labels.join("|");
      return `<option value="${option.id}" ${key === activeKey ? "selected" : ""}>${option.name}</option>`;
    }).join("");

    const matched = options.find((option) => option.labels.join("|") === activeKey);

    if (!matched && this.customKPathLabels) {
      const option = document.createElement("option");
      option.value = "custom-current";
      option.textContent = `Current custom: ${active.join(" → ")}`;
      option.selected = true;
      this.kPathPresetSelect.appendChild(option);
    }

    const available = this.availableKLabels().join(", ");
    this.kPathStatus.innerHTML = `
      <span class="badge">${this.customKPathLabels ? "custom preset" : "default path"}</span>
      <span class="badge">active: ${active.join(" → ")}</span>
      <span class="badge">available: ${available}</span>
    `;
  }

  private applyKPathPresetFromSelect(): void {
    const selected = this.kPathPresetSelect.value;
    const options = this.uniqueKPathOptions();
    const option = options.find((item) => item.id === selected);

    if (!option) {
      this.customKPathLabels = null;
      this.syncKPathInputFromState();
      this.refreshAll();
      return;
    }

    this.customKPathLabels = option.id === "default" ? null : option.labels;
    this.syncKPathInputFromState();
    this.refreshAll();
  }


  private syncFloatingBandOverlayVisibility(_show: boolean): void {
    if (!this.floatingBandOverlay) return;

    // Keep the band overlay visible and independent from reciprocal-pane visibility.
    // Earlier versions hid the overlay based on split state; that made debugging
    // difficult and could leave the canvas invisible even though the scenes rendered.
    this.floatingBandOverlay.classList.remove("hidden");

    requestAnimationFrame(() => {
      window.dispatchEvent(new Event("resize"));
    });
  }

  private refreshScene(): void {
    const baseLattice = latticeById(this.latticeId);
    const physicalLattice = scaleLatticeAnisotropic(baseLattice, this.physicalOptions.scale);

    const split = usesReciprocalView(this.renderOptions);
    const resetCamera = !this.hasInitializedCamera || split !== this.previousSplitState;

    this.viewerRoot.classList.toggle("split", split);
    this.viewerRoot.classList.toggle("single", !split);
    this.reciprocalSceneRoot.classList.toggle("hidden", !split);

    updateRealSpaceScene(this.realManager, physicalLattice, this.renderOptions, resetCamera);

    if (split) {
      updateReciprocalSpaceScene(
        this.reciprocalManager,
        physicalLattice,
        this.renderOptions,
        resetCamera,
        this.activeKPathLabels(),
        this.hoveredBandK,
      );
    } else {
      this.reciprocalManager.clearDynamicObjects();
    }

    this.hasInitializedCamera = true;
    this.previousSplitState = split;

    requestAnimationFrame(() => {
      this.realManager.resize();
      this.reciprocalManager.resize();
    });
  }


  private exportName(kind: string, ext: string): string {
    const lattice = this.latticeId.replace(/[^a-zA-Z0-9_-]/g, "-");
    const model = this.modelId.replace(/[^a-zA-Z0-9_-]/g, "-");
    return `${kind}-${lattice}-${model}.${ext}`;
  }

  private downloadText(filename: string, text: string, type = "application/json"): void {
    const blob = new Blob([text], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }


  private compactJSONStringify(value: unknown): string {
    const compact = this.toCompactJSON(value);

    return JSON.stringify(compact, null, 2)
      // Keep short numeric vectors on one line: [x, y, z]
      .replace(/\[\s+(-?\d+(?:\.\d+)?(?:e[+-]?\d+)?),\s+(-?\d+(?:\.\d+)?(?:e[+-]?\d+)?),\s+(-?\d+(?:\.\d+)?(?:e[+-]?\d+)?)\s+\]/gi, "[$1, $2, $3]")
      // Keep short 2-vectors on one line.
      .replace(/\[\s+(-?\d+(?:\.\d+)?(?:e[+-]?\d+)?),\s+(-?\d+(?:\.\d+)?(?:e[+-]?\d+)?)\s+\]/gi, "[$1, $2]")
      // Keep complex numbers compact.
      .replace(/\{\s+"re":\s+(-?\d+(?:\.\d+)?(?:e[+-]?\d+)?),\s+"im":\s+(-?\d+(?:\.\d+)?(?:e[+-]?\d+)?)\s+\}/gi, `{"re": $1, "im": $2}`);
  }

  private toCompactJSON(value: unknown): unknown {
    if (typeof value === "number") {
      return this.roundJSONNumber(value);
    }

    if (Array.isArray(value)) {
      return value.map((item) => this.toCompactJSON(item));
    }

    if (!value || typeof value !== "object") {
      return value;
    }

    const record = value as Record<string, unknown>;

    if (typeof record.re === "number" && typeof record.im === "number" && Object.keys(record).length === 2) {
      return {
        re: this.roundJSONNumber(record.re),
        im: this.roundJSONNumber(record.im),
      };
    }

    const out: Record<string, unknown> = {};
    for (const [key, item] of Object.entries(record)) {
      out[key] = this.toCompactJSON(item);
    }

    return out;
  }

  private roundJSONNumber(value: unknown): unknown {
    if (typeof value !== "number") return value;
    if (!Number.isFinite(value)) return value;

    const rounded = Number(value.toPrecision(12));
    return Object.is(rounded, -0) ? 0 : rounded;
  }

  private exportCurrentModelJSON(): void {
    this.readShellOptionsFromUI();
    const baseModel = modelById(this.modelId, { shellS: this.shellOptions });
    const model = applyPhysicalOptions(baseModel, this.physicalOptions);
    this.downloadText(this.exportName("tb-model", "json"), this.compactJSONStringify(model));
  }

  private updateExplanationPanel(): void {
    if (!this.explanationBox) return;
    const lattice = latticeExplanation(this.latticeId);
    const model = modelExplanation(this.modelId);
    const render = (item: { title: string; bullets: string[]; note?: string }) => `
      <div class="guide-block">
        <strong>${item.title}</strong>
        <ul>${item.bullets.map((bullet) => `<li>${bullet}</li>`).join("")}</ul>
        ${item.note ? `<p>${item.note}</p>` : ""}
      </div>`;
    this.explanationBox.innerHTML = `${render(lattice)}${render(model)}`;
  }

  private bandSummaryHTML(result: import("../core/tightbinding/tbTypes").BandResult): string {
    const finite = result.points.flatMap((point) => point.energies).filter((value) => Number.isFinite(value));
    if (finite.length === 0) return `<p>No finite band energies found.</p>`;
    const eMin = Math.min(...finite);
    const eMax = Math.max(...finite);
    const bandwidth = eMax - eMin;
    const ef = result.fermiEnergy;

    let crossesEf = false;
    if (ef !== undefined) {
      for (let band = 0; band < result.bandCount; band++) {
        const values = result.points.map((point) => point.energies[band]).filter((v) => Number.isFinite(v));
        if (values.length > 0 && Math.min(...values) <= ef && Math.max(...values) >= ef) {
          crossesEf = true;
          break;
        }
      }
    }

    const occupiedBands = Math.max(0, (result.electronsPerCell ?? 0) / 2);
    const lowerBand = Math.max(0, Math.min(result.bandCount - 1, Math.ceil(occupiedBands) - 1));
    const upperBand = lowerBand + 1;
    let directGap: number | undefined;
    let indirectGap: number | undefined;
    if (upperBand < result.bandCount && occupiedBands > 0) {
      let maxVB = -Infinity;
      let minCB = Infinity;
      let minDirect = Infinity;
      for (const point of result.points) {
        const vb = point.energies[lowerBand];
        const cb = point.energies[upperBand];
        if (Number.isFinite(vb)) maxVB = Math.max(maxVB, vb);
        if (Number.isFinite(cb)) minCB = Math.min(minCB, cb);
        if (Number.isFinite(vb) && Number.isFinite(cb)) minDirect = Math.min(minDirect, cb - vb);
      }
      if (Number.isFinite(minDirect)) directGap = Math.max(0, minDirect);
      if (Number.isFinite(maxVB) && Number.isFinite(minCB)) indirectGap = Math.max(0, minCB - maxVB);
    }

    return `<div>
      <span class="badge">bandwidth=${bandwidth.toFixed(3)}</span>
      ${ef !== undefined ? `<span class="badge">EF=${ef.toFixed(3)}</span>` : ""}
      ${directGap !== undefined ? `<span class="badge">direct gap≈${directGap.toFixed(3)}</span>` : ""}
      ${indirectGap !== undefined ? `<span class="badge">indirect gap≈${indirectGap.toFixed(3)}</span>` : ""}
      ${ef !== undefined ? `<span class="badge">${crossesEf ? "EF crossing" : "no EF crossing on path"}</span>` : ""}
      ${this.bandPlot.hasReference() ? `<span class="badge">reference saved</span>` : ""}
    </div>
    <p>Gap values are high-symmetry path estimates using the selected electrons/cell and spin degeneracy 2.</p>`;
  }

  private refreshBands(): void {
    try {
      this.readShellOptionsFromUI();
      const baseModel = modelById(this.modelId, {
        shellS: this.shellOptions,
      });
      const model = applyPhysicalOptions(baseModel, this.physicalOptions);
      const labels = this.activeKPathLabels();

      const pointsPerSegment = Math.max(8, Math.min(120, Number(this.pointsInput.value) || 36));
      const bandColorMode = this.bandColorModeSelect.value as BandColorMode;
      this.syncElectronFillingFromUI();
      const electronsPerCell = this.electronFilling();
      const result = solveBands(model, labels, pointsPerSegment, bandColorMode, electronsPerCell);
      this.hoveredBandK = null;
      this.bandIsStale = false;
      if (this.bandWarningBox) {
        this.bandWarningBox.textContent = "";
        this.bandWarningBox.classList.add("hidden");
      }
      this.bandPlot.draw(result);
      if (this.bandSummaryBox) {
        this.bandSummaryBox.innerHTML = this.bandSummaryHTML(result);
      }

      const s = this.physicalOptions.scale;

      this.infoBox.innerHTML = `
        <div>
          <span class="badge">${model.lattice.name}</span>
          <span class="badge">sx=${s.x.toFixed(2)}</span>
          <span class="badge">sy=${s.y.toFixed(2)}</span>
          <span class="badge">sz=${s.z.toFixed(2)}</span>
          <span class="badge">${this.physicalOptions.hoppingScaleMode}</span>
          <span class="badge">${model.orbitals.length} orbitals</span>
          <span class="badge">${model.hoppings.length} hopping terms</span>
          <span class="badge">color=${result.colorMode ?? "plain"}</span>
          <span class="badge">ne=${electronsPerCell.toFixed(2)}</span>
          ${result.fermiEnergy !== undefined ? `<span class="badge">EF=${result.fermiEnergy.toFixed(3)}</span>` : ""}
          ${this.isShellModelSelected() ? `<span class="badge">t1=${this.shellOptions.t1.toFixed(2)}</span><span class="badge">t2=${this.shellOptions.t2.toFixed(2)}</span><span class="badge">t3=${this.shellOptions.t3.toFixed(2)}</span>` : ""}
        </div>
        <p>
          Current model: <span class="code-like">${baseModel.name}</span><br />
          k-path: <span class="code-like">${labels.join(" → ")}</span>${this.customKPathLabels ? " (custom)" : " (default)"}<br />
          Bands: <span class="code-like">${result.bandCount}</span><br />
          Hopping law:
          <span class="code-like">${this.describeHoppingLaw()}</span>
        </p>
      `;
    } catch (error) {
      console.error(error);
      this.infoBox.innerHTML = `<p style="color:#fca5a5">${error instanceof Error ? error.message : String(error)}</p>`;
    }
  }


  private refreshDOS(): void {
    try {
      this.readShellOptionsFromUI();

      const baseModel = modelById(this.modelId, {
        shellS: this.shellOptions,
      });
      const model = applyPhysicalOptions(baseModel, this.physicalOptions);

      let kGridSize = Number(this.dosGridInput.value);
      if (!Number.isFinite(kGridSize)) kGridSize = 18;
      kGridSize = Math.max(2, Math.min(model.lattice.dim === 2 ? 160 : 36, Math.round(kGridSize)));

      let broadening = Number(this.dosBroadeningInput.value);
      if (!Number.isFinite(broadening)) broadening = 0.08;
      broadening = Math.max(0.001, Math.min(2, broadening));

      this.dosGridInput.value = String(kGridSize);
      this.dosBroadeningInput.value = String(broadening);

      this.syncElectronFillingFromUI();
      const electronsPerCell = this.electronFilling();
      const projectionMode = this.dosProjectionSelect.value as DOSProjectionMode;
      const result = solveDOS(model, {
        kGridSize,
        broadening,
        projectionMode,
        electronsPerCell,
        binCount: 280,
      });

      this.dosPlot.draw(result);
    } catch (error) {
      console.error(error);
      this.infoBox.innerHTML = `<p style="color:#fca5a5">${error instanceof Error ? error.message : String(error)}</p>`;
    }
  }

  private describeHoppingLaw(): string {
    const opt = this.physicalOptions;

    if (opt.hoppingScaleMode === "fixed") {
      return "t(d)=t0";
    }

    if (opt.hoppingScaleMode === "exponential") {
      return `t(d)=t0 exp[-${opt.beta}(d/d0-1)]`;
    }

    return `t(d)=t0(d0/d)^${opt.power}`;
  }
}

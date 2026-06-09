# Lattice TB Visualizer

A web-based educational visualizer for crystal lattices, reciprocal space, tight-binding band structures, DOS/PDOS, and Fermi-level estimates.

This project is intended as an interactive learning and exploration tool. It is **not** an ab-initio / DFT code. The tight-binding models are simplified toy models designed to make lattice geometry, basis sites, orbitals, hopping, and band features easier to inspect.

---

## 1. Quick start

Install dependencies and run the development server.

```bash
npm install
npm run dev
```

Then open the local Vite URL shown in the terminal.

For a production build:

```bash
npm run build
```

Type checking:

```bash
npx tsc --noEmit
```

---

## 2. What the app does

The app connects four views of the same lattice/model setup:

1. **Real-space lattice visualization**
   - atoms
   - visual nearest bonds
   - guide/conventional cells
   - primitive cells
   - Wigner-Seitz zones
   - XYZ frame and lattice vectors

2. **Reciprocal-space visualization**
   - reciprocal lattice points
   - first Brillouin zone
   - reciprocal primitive cell
   - high-symmetry k-path
   - hovered k-point marker from the band plot

3. **Tight-binding band calculation**
   - basic single-orbital models
   - shell hopping models with `t1`, `t2`, `t3`
   - multi-orbital `sp3` toy models
   - model-dependent default k-paths and selectable k-path presets

4. **DOS / PDOS / Fermi level**
   - k-grid DOS
   - Gaussian broadening
   - site/orbital projected DOS
   - simple filling-based Fermi-level estimate

---

## 3. Project structure

Main folders:

```txt
src/
  app/
    App.ts                 Main UI/controller
    BandPlot.ts            Band plot canvas renderer
    DOSPlot.ts             DOS/PDOS canvas renderer
    explanations.ts        Structure/model guide text
    formulaHelp.ts         KaTeX-rendered formula help

  core/
    lattice/               Lattice types, reciprocal lattice, supercell generation
    math/                  Vector and geometry utilities
    tightbinding/          Hamiltonian, band path, DOS/PDOS, model definitions

  presets/
    lattices/              Lattice presets
    tbModels/              Tight-binding model presets

  visualizer/
    SceneManager.ts        Three.js scene/camera/controls manager
    renderAxes.ts          XYZ frame and lattice vectors
    renderAtoms.ts         Atom rendering
    renderBonds.ts         Geometric nearest-bond rendering
    renderCells.ts         Guide cell / primitive cell rendering
    renderPrimitiveFromAtoms.ts
    renderZones.ts         Wigner-Seitz, reciprocal lattice, BZ, k-path
    updateLatticeScene.ts  Real/reciprocal scene update functions
```

---

## 4. Lattice visualization

### Real-space controls

The left panel controls the real-space and reciprocal-space render options.

Common real-space options include:

```txt
Show atoms
Show visual nearest bonds
Show guide/conventional cells
Show primitive cells
Show Wigner-Seitz zones
Show lattice vectors
Show XYZ frame
Display cells per axis
x/y/z lattice scale
```

The real-space cell shown is a **guide cell**. For some structures this is not a cube. The goal is to show the repeating structure clearly, not to force every structure into a simple cubic box.

### Visual nearest bonds

`Show visual nearest bonds` is a purely geometric visualization.

It finds visible atoms and connects atoms at the shortest neighbor distance, using a small tolerance. This is independent of the tight-binding Hamiltonian.

### Primitive cells

Primitive cells are rendered from the currently visible atoms/cell layout so that the displayed primitive-cell count tracks the display cell count more intuitively.

### Wigner-Seitz zones

Wigner-Seitz zones are constructed from nearby atom/cell positions. They are meant as a visual guide and can become visually dense for large display sizes.

---

## 5. Reciprocal-space visualization

Reciprocal view can show:

```txt
Reciprocal lattice points
First Brillouin zone
Reciprocal primitive cell
High-symmetry k-path
Hovered k marker
```

The reciprocal scene uses the lattice vectors after the current `x/y/z scale` is applied.

### High-symmetry points and anisotropic scaling

For unscaled symmetric lattices, labels such as `Γ`, `X`, `M`, `K`, `L`, `W`, `A`, `H` follow the preset reciprocal coordinates.

If the lattice is scaled anisotropically, for example `sx ≠ sy ≠ sz`, the original lattice symmetry can be lowered. In that case, the displayed k-path points should be interpreted as representative strained-BZ boundary points derived from the original preset directions, not always exact symmetry points of the lowered-symmetry structure.

### Reciprocal z-fighting reduction

Reciprocal-space edges and k-paths can overlap exactly. To reduce flickering:

```txt
BZ faces are rendered behind edges
edge lines use depthWrite: false
k-path lines render above BZ edges
k-path markers are slightly offset from exactly overlapping edges
hover markers use higher render order
```

---

## 6. Tight-binding models

The band calculation is based on a Bloch tight-binding Hamiltonian.

```txt
H(k) = onsite terms + hopping terms with Bloch phase
```

Model families include:

### Basic s-orbital

One `s` orbital per site.

Good for understanding how lattice geometry and coordination affect band shape.

### Shell s-orbital

One `s` orbital per site, with separate shell hoppings:

```txt
t1 = first-neighbor shell hopping
t2 = second-neighbor shell hopping
t3 = third-neighbor shell hopping
```

The shell sliders apply only to shell models.

### Honeycomb pz

One `pz` orbital on each honeycomb A/B site.

Useful for the graphene-like nearest-neighbor π-band toy model.

### sp3 multi-orbital

Each site has:

```txt
s, px, py, pz
```

The model uses a simplified Slater-Koster-like direction-dependent hopping form. This is a toy model and should not be treated as a fitted material model.

---

## 7. Band calculation

For each k-point along the selected k-path, the app builds and diagonalizes the tight-binding Hamiltonian.

The main formula is:

```txt
H_{αβ}(k)
=
ε_α δ_{αβ}
+
Σ_R t_{αβ}(R) exp[i k · (R + r_β - r_α)]
```

where:

```txt
α, β        orbital indices
ε_α         onsite energy
R           cell translation
r_α, r_β    orbital/site positions inside the cell
t_{αβ}(R)   hopping value
```

The band energies are the eigenvalues:

```txt
H(k) u_n(k) = E_n(k) u_n(k)
```

### Band coloring

Band coloring can show orbital/site weight, depending on the selected model:

```txt
Plain
s weight
p total weight
px / py / pz weight
Site 0 / Site 1 weight
```

Some coloring options may not be meaningful for all models. For example, `p`-orbital weights are meaningful only when the model contains p orbitals.

### Band reference overlay

You can save the current band as a reference. The saved reference is drawn as a dashed curve behind the current band.

This is useful for comparing:

```txt
scale changes
hopping-law changes
beta / n changes
t1 / t2 / t3 changes
different TB models
```

### Floating band overlay

The band plot and these buttons are shown in a floating overlay:

```txt
Save reference
Clear reference
Export band PNG
Export model JSON
```

The overlay size is controlled in `src/style.css` under:

```css
/* v73 compact band overlay with right-side actions */
.floating-band-overlay { ... }
.floating-band-content { ... }
.floating-band-canvas { ... }
.floating-band-actions { ... }
```

Useful knobs:

```css
/* overall width */
.floating-band-overlay {
  width: min(720px, calc(100vw - 700px));
  min-width: 560px;
}

/* plot height */
.floating-band-canvas {
  height: 185px;
}

/* button column width */
.floating-band-content {
  grid-template-columns: minmax(0, 1fr) 132px;
}
```

---

## 8. DOS, PDOS, and Fermi level

The DOS is computed by sampling a reciprocal k-grid and applying Gaussian broadening.

```txt
D(E) = (1 / Nk) Σ_{k,n} G_η(E - E_n(k))
```

PDOS uses eigenvector weights:

```txt
D_A(E) = (1 / Nk) Σ_{k,n} w_A(n,k) G_η(E - E_n(k))
```

where `A` can be an orbital group or site group.

### Fermi level estimate

The Fermi level estimate uses:

```txt
spin degeneracy = 2
electrons / cell = user setting
```

The app fills states from low energy to high energy and estimates `EF` from the requested filling.

This is a numerical educational estimate. It is not a finite-temperature self-consistent chemical potential.

---

## 9. Calculation help panel

The app includes a collapsible `Calculation help` panel.

It uses KaTeX to render formulas for:

```txt
Bloch tight-binding Hamiltonian
Eigenvalue problem
DOS
PDOS
distance-dependent hopping
Fermi filling
```

KaTeX is included as a dependency. A local TypeScript declaration file is provided, so `@types/katex` is not required.

```txt
src/types/katex.d.ts
```

---

## 10. Export features

The app can export:

```txt
Band plot PNG
DOS plot PNG
Current TB model JSON
```

The exported model JSON contains the current model after physical options are applied.

It includes:

```txt
lattice vectors
site positions
orbitals
onsite energies
hopping terms
default path
high-symmetry points
scale-adjusted hopping values
```

JSON formatting is compacted so short vectors appear on one line, for example:

```json
"a": [2, 0, 0]
```

---

## 11. Known limitations

This app is intentionally simplified.

### Not ab-initio

The app does not solve Schrödinger/Kohn-Sham equations from first principles. It only diagonalizes predefined tight-binding Hamiltonians.

### Toy parameters

Many hopping parameters are educational defaults, not material-fitted values.

### Symmetry labels under strain

Anisotropic scaling can lower lattice symmetry. In that case, labels like `K`, `M`, `X`, `L` may be best interpreted as representative path labels rather than exact symmetry points of the strained lattice.

### DOS/EF are numerical estimates

DOS and EF depend on:

```txt
k-grid resolution
Gaussian broadening η
electron filling
spin degeneracy assumption
```

### Multi-orbital models are simplified

The `sp3` model is useful for exploring orbital mixing and band count, but it is not a complete material-specific parameterization.

### Visual cells are guide cells

Guide/conventional cells are chosen for clarity. For non-cubic structures, the displayed guide cell may be a hexagonal prism, parallelogram, or another intuitive repeat unit.

---

## 12. Suggested workflows

### Compare scale effects

1. Select a lattice and TB model.
2. Calculate bands.
3. Save band reference.
4. Change `x/y/z scale`.
5. Compare the new band against the reference.

### Explore graphene-like honeycomb bands

1. Select `Honeycomb`.
2. Select the honeycomb `pz` model.
3. Use path `Γ → M → K → Γ`.
4. Set electrons/cell near `2`.
5. Inspect band crossing near `K`.

### Explore kagome flat-band behavior

1. Select `Kagome`.
2. Use a simple nearest-neighbor `s` model.
3. Use a hexagonal 2D path.
4. Inspect the flat or nearly flat band feature.

### Check orbital character

1. Select an `sp3` model.
2. Calculate bands.
3. Change band coloring to `s weight` or `p total weight`.
4. Calculate PDOS with matching projection.

---

## 13. Version highlights

Recent major changes:

```txt
v50   DOS / PDOS / EF foundation
v51   Band reference overlay
v52   Band summary
v53   Export PNG / JSON
v54   Structure and model guide
v55   Compact JSON formatting
v56   Removed long band title inside plot
v57   Real-space axis/cell flicker reduction
v58   2D triangular/kagome K-point correction
v59   3D strained BZ path projection
v60   KaTeX formula help
v61   k-path preset selector
v62   Removed @types/katex requirement
v63   3D hexagonal-family K/H correction
v64-v67 UI spacing/order experiments
v68-v73 Band plot floating overlay experiments/fixes
v74   Reciprocal-space line overlap/z-fighting reduction
```

---

## 14. Development notes

When adding new lattices:

1. Define lattice vectors.
2. Define basis sites.
3. Define display/guide cell if needed.
4. Define high-symmetry points.
5. Check reciprocal BZ point placement visually.
6. Add or reuse a compatible TB model.

When adding new TB models:

1. Define orbitals.
2. Define onsite terms.
3. Define hopping terms.
4. Decide default electron filling.
5. Decide default k-path.
6. Check band count: `number of sites × orbitals per site`.

---

## 15. License / usage

This starter project is intended for educational and personal experimentation. Add a formal license before distributing it publicly.

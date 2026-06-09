# Lattice TB Visualizer

Interactive web visualizer for lattice structures, reciprocal space, tight-binding band structures, DOS/PDOS, and Fermi-level estimates.

This is an educational tight-binding tool, not an ab-initio or DFT code.

This project was vibe-coded with AI assistance. The code, UI, formulas, and numerical behavior should be treated as an educational implementation and checked before being used for research or engineering work.

Lattice scaling controls were intentionally omitted so that the default Brillouin zones and high-symmetry paths remain consistent with the preset structures.

## Features

- Real-space lattice visualization
- Reciprocal lattice and Brillouin zone visualization
- Guide cells, primitive cells, and Wigner-Seitz cells
- Visual nearest-neighbor bonds
- Tight-binding band calculation
- DOS / PDOS calculation
- Fermi-level estimate from electron filling
- Orbital/site band coloring
- Band reference overlay
- Band/DOS/model export
- KaTeX formula help panel

## Run locally

```bash
npm install
npm run dev
```

Build:

```bash
npm run build
```

Type check:

```bash
npx tsc --noEmit
```

## GitHub Pages

For a project page such as:

```txt
https://FU2FA.github.io/lattice-tb/
```

set the Vite base path:

```ts
// vite.config.ts
import { defineConfig } from "vite";

export default defineConfig({
  base: "/lattice-tb/",
});
```

Then build and deploy the `dist/` folder, or use GitHub Actions.

## Tight-binding model

The band calculation uses a Bloch tight-binding Hamiltonian:

```txt
H_ab(k) = eps_a delta_ab + sum_R t_ab(R) exp[i k · (R + r_b - r_a)]
```

For each k-point, the Hamiltonian is diagonalized:

```txt
H(k) u_n(k) = E_n(k) u_n(k)
```

The eigenvalues form the band structure.

## DOS and Fermi level

DOS is estimated by sampling a k-grid and applying Gaussian broadening:

```txt
D(E) = (1 / Nk) sum_{k,n} G_eta(E - E_n(k))
```

PDOS uses orbital or site weights from eigenvectors.

The Fermi level is estimated by filling states from low to high energy using:

```txt
spin degeneracy = 2
electrons per cell = user setting
```

## High-symmetry path limitations

High-symmetry k-points and band paths in this app are intended mainly for educational visualization.

For simple cubic, FCC, BCC, square, triangular, and basic hexagonal lattices, the initial high-symmetry points follow commonly used primitive reciprocal-space conventions. The built-in default paths use shared Bravais-lattice conventions for structures with the same underlying Bravais lattice.

Some Bravais lattices have parameter-dependent Brillouin zones and k-paths. In particular, body-centered tetragonal (BCT), rhombohedral, and other lower-symmetry lattices can require different high-symmetry point definitions depending on lattice parameters such as the `c/a` ratio or cell angle.

## Notes

- Visual nearest-neighbor bonds are geometric only. They are not necessarily the same as TB hopping terms.
- The `sp3` model is a simplified educational model, not a fitted material parameterization.
- DOS and Fermi level values depend on k-grid size, broadening, and electron filling.
- Guide cells are chosen for visual clarity and are not always cubic.
- The implementation was developed through iterative vibe coding, so formulas and code paths should be reviewed if accuracy is important.

## Main source folders

```txt
src/app/           UI, plots, formula/help panels
src/core/          lattice math, TB Hamiltonian, DOS/PDOS
src/presets/       lattice and TB model presets
src/visualizer/    Three.js rendering
```

## License

MIT License.

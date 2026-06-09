import katex from "katex";

interface FormulaItem {
  title: string;
  latex: string;
  description: string;
}

const formulas: FormulaItem[] = [
  {
    title: "Bloch tight-binding Hamiltonian",
    latex: String.raw`H_{\alpha\beta}(\mathbf{k})=\epsilon_\alpha\delta_{\alpha\beta}+\sum_{\mathbf{R}}t_{\alpha\beta}(\mathbf{R})e^{i\mathbf{k}\cdot(\mathbf{R}+\mathbf{r}_\beta-\mathbf{r}_\alpha)}`,
    description: "The band calculation builds this matrix at each k-point and diagonalizes it.",
  },
  {
    title: "Eigenvalue problem",
    latex: String.raw`H(\mathbf{k})u_n(\mathbf{k})=E_n(\mathbf{k})u_n(\mathbf{k})`,
    description: "Band curves are the eigenvalues Eₙ(k) along the selected k-path.",
  },
  {
    title: "Gaussian-broadened DOS",
    latex: String.raw`D(E)=\frac{1}{N_k}\sum_{\mathbf{k},n}G_\eta(E-E_n(\mathbf{k}))`,
    description: "DOS uses reciprocal primitive-cell k-grid sampling and Gaussian broadening.",
  },
  {
    title: "Projected DOS",
    latex: String.raw`D_A(E)=\frac{1}{N_k}\sum_{\mathbf{k},n}w_A(n,\mathbf{k})G_\eta(E-E_n(\mathbf{k}))`,
    description: "PDOS weights each state by orbital or site contribution from the eigenvector.",
  },
  {
    title: "Distance-dependent hopping",
    latex: String.raw`t(d)=t_0\exp[-\beta(d/d_0-1)]\quad\mathrm{or}\quad t(d)=t_0(d_0/d)^n`,
    description: "β and n matter when x/y/z scale changes the bond length.",
  },
  {
    title: "Filling and Fermi level",
    latex: String.raw`N_{\mathrm{occ}}=\frac{N_e}{2}N_k`,
    description: "The current EF estimate assumes spin degeneracy 2 and fills states from low to high energy.",
  },
];

export function renderFormulaHelp(container: HTMLElement): void {
  const rows = formulas.map((item) => {
    const html = katex.renderToString(item.latex, {
      throwOnError: false,
      displayMode: true,
      strict: false,
      output: "html",
    });

    return `
      <div class="formula-card">
        <strong>${item.title}</strong>
        <div class="formula-latex">${html}</div>
        <p>${item.description}</p>
      </div>
    `;
  }).join("");

  container.innerHTML = `
    <details class="formula-details">
      <summary>How calculations are defined</summary>
      <div class="formula-list">
        ${rows}
      </div>
      <p class="small">
        Note: for anisotropic scale in 3D, displayed k-path boundary points may be representative strained-BZ points rather than exact symmetry points of the lowered-symmetry lattice.
      </p>
    </details>
  `;
}

export interface Explanation { title: string; bullets: string[]; note?: string; }

export function latticeExplanation(latticeId: string): Explanation {
  const map: Record<string, Explanation> = {
    sc: { title: "Simple cubic", bullets: ["One lattice point per cubic primitive cell.", "Nearest-neighbor s model gives cosine-like dispersion along x, y, and z.", "Good baseline for checking scale, hopping, and filling behavior."] },
    bcc: { title: "Body-centered cubic", bullets: ["Cubic conventional cell with a body-centered lattice point.", "Primitive vectors are not aligned with conventional cube axes.", "Shell hopping can noticeably change the band shape."] },
    fcc: { title: "Face-centered cubic", bullets: ["Cubic conventional cell with face-centered lattice points.", "High coordination makes bandwidth sensitive to hopping choices.", "Useful for shell and sp3 toy models."] },
    diamond: { title: "Diamond / tetrahedral net", bullets: ["Two interpenetrating FCC sublattices with tetrahedral coordination.", "sp3 multi-orbital models are the natural toy model.", "Simple s models are useful but not very realistic for diamond."] },
    honeycomb: { title: "Honeycomb", bullets: ["Triangular Bravais lattice with a two-site A/B basis.", "The pz nearest-neighbor model produces two π bands.", "A Dirac crossing can appear near K in the nearest-neighbor pz model."] },
    kagome2d: { title: "Kagome", bullets: ["Triangular Bravais lattice with a three-site basis.", "Nearest-neighbor s models can show flat-band behavior.", "Good example of how basis geometry affects band multiplicity."] },
    lieb2d: { title: "Lieb", bullets: ["Square Bravais lattice with a three-site line-centered basis.", "Nearest-neighbor toy models can show a flat band.", "Site-projected DOS helps identify sublattice character."] },
    dice2d: { title: "Dice / T3", bullets: ["Triangular Bravais lattice with hub and rim sites.", "The hub site has higher connectivity than rim sites.", "Site-projected DOS is useful for hub/rim contributions."] },
    hcp: { title: "HCP AB stacking", bullets: ["Hexagonal conventional guide cell with AB stacking.", "Primitive and conventional cells look different visually.", "Useful for checking 3D hexagonal rendering and reciprocal paths."] },
    hexagonal: { title: "Hexagonal", bullets: ["3D hexagonal Bravais lattice.", "The conventional guide cell is a hexagonal prism.", "Primitive and conventional cells represent the same periodic lattice differently."] },
  };
  return map[latticeId] ?? { title: "Selected lattice", bullets: ["Represented as a Bravais lattice plus a site basis.", "Band count is sites times orbitals per site.", "DOS/PDOS connects band shape with filling and orbital/site character."] };
}

export function modelExplanation(modelId: string): Explanation {
  if (modelId.includes("_shell_s")) return { title: "Shell s-orbital model", bullets: ["Each site has one s orbital.", "Includes 1st, 2nd, and 3rd neighbor shells with t1, t2, and t3.", "Band features can come from non-nearest hopping as well as geometry."] };
  if (modelId.includes("_sp3")) return { title: "sp3 multi-orbital model", bullets: ["Each site has s, px, py, and pz orbitals.", "Hopping uses Slater-Koster direction-dependent matrix elements.", "Orbital coloring and PDOS are especially useful here."] };
  if (modelId === "honeycomb_pz" || modelId === "graphene_pz") return { title: "Honeycomb pz model", bullets: ["Each A/B site has one pz orbital.", "Nearest-neighbor hopping gives two π bands.", "Two electrons per cell roughly fills the lower band with spin degeneracy 2."] };
  return { title: "Basic s-orbital model", bullets: ["Each site has one s orbital.", "Minimal geometry-to-band toy model.", "Bandwidth is mainly controlled by hopping magnitude and coordination."] };
}

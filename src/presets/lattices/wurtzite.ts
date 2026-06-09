import type { Lattice } from "../../core/lattice/types";

export function wurtziteLattice(): Lattice {
  const sqrt3 = Math.sqrt(3);
  const cOverA = 1.633;
  const u = 0.375;

  return {
    id: "wurtzite",
    name: "Wurtzite",
    dim: 3,
    a: [1, 0, 0],
    b: [0.5, sqrt3 / 2, 0],
    c: [0, 0, cOverA],
    sites: [
      { id: 0, element: "A", position: [0, 0, 0], type: "A", color: 0x60a5fa },
      { id: 1, element: "A", position: [2 / 3, 1 / 3, 0.5], type: "A", color: 0x60a5fa },
      { id: 2, element: "B", position: [0, 0, u], type: "B", color: 0xf97316 },
      { id: 3, element: "B", position: [2 / 3, 1 / 3, 0.5 + u], type: "B", color: 0xf97316 },
    ],
    highSymmetry: {
      G: { label: "Γ", kFrac: [0, 0, 0] },
      M: { label: "M", kFrac: [0.5, 0, 0] },
      K: { label: "K", kFrac: [2 / 3, 1 / 3, 0] },
      A: { label: "A", kFrac: [0, 0, 0.5] },
      L: { label: "L", kFrac: [0.5, 0, 0.5] },
      H: { label: "H", kFrac: [2 / 3, 1 / 3, 0.5] },
    },
    defaultPath: ["G", "M", "K", "G", "A", "L", "H", "A", "L", "M", "K", "H"],
    kPathConvention: "standard",
    visualBondCutoff: 1.1,
  };
}

import type { Lattice } from "../../core/lattice/types";

export function rocksaltLattice(): Lattice {
  return {
    id: "rocksalt",
    name: "Rocksalt / NaCl",
    dim: 3,
    a: [0, 0.5, 0.5],
    b: [0.5, 0, 0.5],
    c: [0.5, 0.5, 0],
    conventionalBasis: {
      a: [1, 0, 0],
      b: [0, 1, 0],
      c: [0, 0, 1],
    },
    sites: [
      { id: 0, element: "Na", position: [0, 0, 0], type: "Na", color: 0x60a5fa },
      { id: 1, element: "Cl", position: [0.5, 0.5, 0.5], type: "Cl", color: 0xf97316 },
    ],
    visualSites: [
      { id: 0, element: "Na", position: [0, 0, 0], type: "Na", color: 0x60a5fa },
      { id: 1, element: "Na", position: [0, 0.5, 0.5], type: "Na", color: 0x60a5fa },
      { id: 2, element: "Na", position: [0.5, 0, 0.5], type: "Na", color: 0x60a5fa },
      { id: 3, element: "Na", position: [0.5, 0.5, 0], type: "Na", color: 0x60a5fa },
      { id: 4, element: "Cl", position: [0.5, 0, 0], type: "Cl", color: 0xf97316 },
      { id: 5, element: "Cl", position: [0, 0.5, 0], type: "Cl", color: 0xf97316 },
      { id: 6, element: "Cl", position: [0, 0, 0.5], type: "Cl", color: 0xf97316 },
      { id: 7, element: "Cl", position: [0.5, 0.5, 0.5], type: "Cl", color: 0xf97316 },
    ],
    highSymmetry: {
      G: { label: "Γ", kFrac: [0, 0, 0] },
      X: { label: "X", kFrac: [0, 0.5, 0.5] },
      L: { label: "L", kFrac: [0.5, 0.5, 0.5] },
      W: { label: "W", kFrac: [0.25, 0.75, 0.5] },
    },
    defaultPath: ["G", "X", "W", "G", "L"],
    visualBondCutoff: 0.55,
  };
}

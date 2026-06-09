import type { Lattice } from "../../core/lattice/types";
import { rhombohedralKPath } from "../../core/kpath/standardKPoints";

export function rhombohedralLattice(): Lattice {
  const a1: [number, number, number] = [1, 0, 0];
  const a2: [number, number, number] = [0.35, 0.936, 0];
  const a3: [number, number, number] = [0.35, 0.25, 0.902];
  const kPath = rhombohedralKPath(a1, a2, a3);

  return {
    id: "rhombohedral",
    name: "Rhombohedral / trigonal",
    dim: 3,
    a: a1,
    b: a2,
    c: a3,

    // Guide cell: rhombohedral primitive cell.
    simpleCellBasis: {
      a: a1,
      b: a2,
      c: a3,
    },

    sites: [{ id: 0, element: "X", position: [0, 0, 0], type: "X", color: 0x60a5fa }],
    highSymmetry: kPath.highSymmetry,
    defaultPath: kPath.defaultPath,
    kPathConvention: kPath.kPathConvention,
    kPathNotes: kPath.kPathNotes,
    visualBondCutoff: 1.05,
  };
}

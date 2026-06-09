import type { TBModel } from "../../core/tightbinding/tbTypes";
import type { Lattice } from "../../core/lattice/types";
import { scSModel } from "./sc_s";
import { bccSModel } from "./bcc_s";
import { fccSModel } from "./fcc_s";
import { honeycombPzModel } from "./graphene_pz";
import { diamondSModel } from "./diamond_s";
import { diamondSP3Model } from "./diamond_sp3";
import { genericNearestSModel } from "./generic_s";
import { genericShellSModel, type GenericShellSParams } from "./generic_shell_s";
import { genericSP3Model } from "./generic_sp3";

import { square2DLattice } from "../lattices/square2d";
import { triangular2DLattice } from "../lattices/triangular2d";
import { honeycombLattice } from "../lattices/graphene";
import { kagome2DLattice } from "../lattices/kagome2d";
import { lieb2DLattice } from "../lattices/lieb2d";
import { dice2DLattice } from "../lattices/dice2d";

import { tetragonalLattice } from "../lattices/tetragonal";
import { bctLattice } from "../lattices/bct";
import { orthorhombicLattice } from "../lattices/orthorhombic";
import { hexagonalLattice } from "../lattices/hexagonal";
import { rhombohedralLattice } from "../lattices/rhombohedral";
import { hcpLattice } from "../lattices/hcp";

import { octahedralTwoSublatticeLattice } from "../lattices/octahedral2sublattice";
import { cubicABX3Lattice } from "../lattices/cubicABX3";
import { cubicAX2Lattice } from "../lattices/cubicAX2";
import { hexagonalTwoSublatticeLattice } from "../lattices/hexagonal2sublattice";

export interface ModelCreateOptions {
  shellS?: GenericShellSParams;
}

export interface ModelFactoryInfo {
  id: string;
  name: string;
  latticeId: string;
  create: (options?: ModelCreateOptions) => TBModel;
}

function sFactory(id: string, name: string, latticeId: string, createLattice: () => Lattice): ModelFactoryInfo {
  return {
    id,
    name,
    latticeId,
    create: () => genericNearestSModel(id, name, createLattice()),
  };
}

function sp3Factory(id: string, name: string, latticeId: string, createLattice: () => Lattice): ModelFactoryInfo {
  return {
    id,
    name,
    latticeId,
    create: () => genericSP3Model(id, name, createLattice()),
  };
}

function shellSFactory(id: string, name: string, latticeId: string, createLattice: () => Lattice): ModelFactoryInfo {
  return {
    id,
    name,
    latticeId,
    create: (options?: ModelCreateOptions) => genericShellSModel(id, name, createLattice(), options?.shellS),
  };
}

export const MODEL_FACTORIES: ModelFactoryInfo[] = [
  { id: "sc_s", name: "s-orbital toy · simple cubic", latticeId: "sc", create: () => scSModel() },
  { id: "bcc_s", name: "s-orbital toy · BCC primitive", latticeId: "bcc", create: () => bccSModel() },
  { id: "fcc_s", name: "s-orbital toy · FCC primitive", latticeId: "fcc", create: () => fccSModel() },
  { id: "diamond_s", name: "s-orbital toy · diamond net", latticeId: "diamond", create: () => diamondSModel() },
  { id: "diamond_sp3", name: "sp3 · diamond net", latticeId: "diamond", create: () => diamondSP3Model() },

  sFactory("tetragonal_s", "s-orbital toy · simple tetragonal", "tetragonal", tetragonalLattice),
  sFactory("bct_s", "s-orbital toy · body-centered tetragonal", "bct", bctLattice),
  sFactory("orthorhombic_s", "s-orbital toy · orthorhombic", "orthorhombic", orthorhombicLattice),
  sFactory("hexagonal_s", "s-orbital toy · hexagonal Bravais", "hexagonal", hexagonalLattice),
  sFactory("rhombohedral_s", "s-orbital toy · rhombohedral", "rhombohedral", rhombohedralLattice),

  sFactory("hcp_s", "s-orbital toy · HCP AB stacking", "hcp", hcpLattice),
  sFactory("octahedral2_s", "s-orbital toy · octahedral two-sublattice", "octahedral2", octahedralTwoSublatticeLattice),
  sFactory("cubic_abx3_s", "s-orbital toy · cubic ABX3 framework", "cubic_abx3", cubicABX3Lattice),
  sFactory("cubic_ax2_s", "s-orbital toy · cubic AX2 framework", "cubic_ax2", cubicAX2Lattice),
  sFactory("hexagonal2_s", "s-orbital toy · hexagonal tetrahedral two-sublattice", "hexagonal2", hexagonalTwoSublatticeLattice),

  sFactory("square2d_s", "s-orbital toy · 2D square", "square2d", square2DLattice),
  sFactory("triangular2d_s", "s-orbital toy · 2D triangular", "triangular2d", triangular2DLattice),
  { id: "honeycomb_pz", name: "pz · honeycomb nearest-neighbor", latticeId: "honeycomb", create: () => honeycombPzModel() },
  sFactory("honeycomb_s", "s-orbital toy · honeycomb", "honeycomb", honeycombLattice),
  sFactory("kagome2d_s", "s-orbital toy · kagome", "kagome2d", kagome2DLattice),
  sFactory("lieb2d_s", "s-orbital toy · Lieb", "lieb2d", lieb2DLattice),
  sFactory("dice2d_s", "s-orbital toy · Dice / T3", "dice2d", dice2DLattice),

  sp3Factory("sc_sp3", "sp3 Slater-Koster · simple cubic", "sc", () => scSModel().lattice),
  sp3Factory("bcc_sp3", "sp3 Slater-Koster · BCC", "bcc", () => bccSModel().lattice),
  sp3Factory("fcc_sp3", "sp3 Slater-Koster · FCC", "fcc", () => fccSModel().lattice),
  sp3Factory("tetragonal_sp3", "sp3 Slater-Koster · simple tetragonal", "tetragonal", tetragonalLattice),
  sp3Factory("bct_sp3", "sp3 Slater-Koster · body-centered tetragonal", "bct", bctLattice),
  sp3Factory("orthorhombic_sp3", "sp3 Slater-Koster · orthorhombic", "orthorhombic", orthorhombicLattice),
  sp3Factory("hexagonal_sp3", "sp3 Slater-Koster · hexagonal Bravais", "hexagonal", hexagonalLattice),
  sp3Factory("rhombohedral_sp3", "sp3 Slater-Koster · rhombohedral", "rhombohedral", rhombohedralLattice),
  sp3Factory("hcp_sp3", "sp3 Slater-Koster · HCP AB stacking", "hcp", hcpLattice),
  sp3Factory("octahedral2_sp3", "sp3 Slater-Koster · octahedral two-sublattice", "octahedral2", octahedralTwoSublatticeLattice),
  sp3Factory("cubic_abx3_sp3", "sp3 Slater-Koster · cubic ABX3 framework", "cubic_abx3", cubicABX3Lattice),
  sp3Factory("cubic_ax2_sp3", "sp3 Slater-Koster · cubic AX2 framework", "cubic_ax2", cubicAX2Lattice),
  sp3Factory("hexagonal2_sp3", "sp3 Slater-Koster · hexagonal tetrahedral two-sublattice", "hexagonal2", hexagonalTwoSublatticeLattice),
  sp3Factory("square2d_sp3", "sp3 Slater-Koster toy · 2D square", "square2d", square2DLattice),
  sp3Factory("triangular2d_sp3", "sp3 Slater-Koster toy · 2D triangular", "triangular2d", triangular2DLattice),
  sp3Factory("honeycomb_sp3", "sp3 Slater-Koster toy · honeycomb", "honeycomb", honeycombLattice),
  sp3Factory("kagome2d_sp3", "sp3 Slater-Koster toy · kagome", "kagome2d", kagome2DLattice),
  sp3Factory("lieb2d_sp3", "sp3 Slater-Koster toy · Lieb", "lieb2d", lieb2DLattice),
  sp3Factory("dice2d_sp3", "sp3 Slater-Koster toy · Dice / T3", "dice2d", dice2DLattice),

  shellSFactory("sc_shell_s", "s shell model · simple cubic · t1/t2/t3", "sc", () => scSModel().lattice),
  shellSFactory("bcc_shell_s", "s shell model · BCC · t1/t2/t3", "bcc", () => bccSModel().lattice),
  shellSFactory("fcc_shell_s", "s shell model · FCC · t1/t2/t3", "fcc", () => fccSModel().lattice),
  shellSFactory("diamond_shell_s", "s shell model · diamond net · t1/t2/t3", "diamond", () => diamondSModel().lattice),
  shellSFactory("tetragonal_shell_s", "s shell model · simple tetragonal · t1/t2/t3", "tetragonal", tetragonalLattice),
  shellSFactory("bct_shell_s", "s shell model · BCT · t1/t2/t3", "bct", bctLattice),
  shellSFactory("orthorhombic_shell_s", "s shell model · orthorhombic · t1/t2/t3", "orthorhombic", orthorhombicLattice),
  shellSFactory("hexagonal_shell_s", "s shell model · hexagonal · t1/t2/t3", "hexagonal", hexagonalLattice),
  shellSFactory("rhombohedral_shell_s", "s shell model · rhombohedral · t1/t2/t3", "rhombohedral", rhombohedralLattice),
  shellSFactory("hcp_shell_s", "s shell model · HCP · t1/t2/t3", "hcp", hcpLattice),
  shellSFactory("octahedral2_shell_s", "s shell model · octahedral two-sublattice · t1/t2/t3", "octahedral2", octahedralTwoSublatticeLattice),
  shellSFactory("cubic_abx3_shell_s", "s shell model · cubic ABX3 · t1/t2/t3", "cubic_abx3", cubicABX3Lattice),
  shellSFactory("cubic_ax2_shell_s", "s shell model · cubic AX2 · t1/t2/t3", "cubic_ax2", cubicAX2Lattice),
  shellSFactory("hexagonal2_shell_s", "s shell model · hexagonal two-sublattice · t1/t2/t3", "hexagonal2", hexagonalTwoSublatticeLattice),
  shellSFactory("square2d_shell_s", "s shell model · 2D square · t1/t2/t3", "square2d", square2DLattice),
  shellSFactory("triangular2d_shell_s", "s shell model · 2D triangular · t1/t2/t3", "triangular2d", triangular2DLattice),
  shellSFactory("honeycomb_shell_s", "s shell model · honeycomb · t1/t2/t3", "honeycomb", honeycombLattice),
  shellSFactory("kagome2d_shell_s", "s shell model · kagome · t1/t2/t3", "kagome2d", kagome2DLattice),
  shellSFactory("lieb2d_shell_s", "s shell model · Lieb · t1/t2/t3", "lieb2d", lieb2DLattice),
  shellSFactory("dice2d_shell_s", "s shell model · Dice / T3 · t1/t2/t3", "dice2d", dice2DLattice),
];

export function modelById(id: string, options?: ModelCreateOptions): TBModel {
  const factory = MODEL_FACTORIES.find((item) => item.id === id);
  if (!factory) throw new Error(`Unknown model ${id}`);
  return factory.create(options);
}

export function modelsForLattice(latticeId: string): ModelFactoryInfo[] {
  return MODEL_FACTORIES.filter((model) => model.latticeId === latticeId);
}

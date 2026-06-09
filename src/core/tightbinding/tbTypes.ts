import type { Int3, Vec3 } from "../math/vec";
import type { Complex } from "../math/complex";
import type { Lattice } from "../lattice/types";

export type OrbitalKind =
  | "s"
  | "px"
  | "py"
  | "pz"
  | "dxy"
  | "dyz"
  | "dzx"
  | "dx2y2"
  | "dz2";

export interface Orbital {
  id: number;
  site: number;
  kind: OrbitalKind;
  label: string;
}

export interface OrbitalRef {
  site: number;
  orbital: OrbitalKind;
}

export interface OnsiteTerm {
  orbital: OrbitalRef;
  energy: Complex;
}

export interface HoppingTerm {
  from: OrbitalRef;
  to: OrbitalRef;
  R: Int3;
  value: Complex;
  label?: string;
}

export interface TBModel {
  id: string;
  name: string;
  lattice: Lattice;
  orbitals: Orbital[];
  onsites: OnsiteTerm[];
  hoppings: HoppingTerm[];
  defaultPath: string[];
}

export type BandColorMode =
  | "plain"
  | "s"
  | "p"
  | "px"
  | "py"
  | "pz"
  | "site0"
  | "site1";

export interface BandPoint {
  x: number;
  label?: string;
  k: Vec3;
  energies: number[];
  // colorWeights[band] is a scalar 0..1 for the selected BandColorMode.
  colorWeights?: number[];
}

export interface BandResult {
  modelName: string;
  points: BandPoint[];
  bandCount: number;
  colorMode?: BandColorMode;
  fermiEnergy?: number;
  electronsPerCell?: number;
}

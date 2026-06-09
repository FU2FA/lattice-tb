import type { TBModel, HoppingTerm } from "./tbTypes";
import {
  scaleLatticeAnisotropic,
  sanitizePhysicalScale,
  type PhysicalScale3D,
} from "../lattice/scaleLattice";
import { hoppingDisplacement } from "./buildHamiltonian";
import { norm } from "../math/vec";
import { cscale } from "../math/complex";

export type HoppingScaleMode = "fixed" | "exponential" | "power";

export interface PhysicalOptions {
  scale: PhysicalScale3D;
  hoppingScaleMode: HoppingScaleMode;
  beta: number;
  power: number;
}

export const DEFAULT_PHYSICAL_OPTIONS: PhysicalOptions = {
  scale: { x: 1, y: 1, z: 1 },
  hoppingScaleMode: "exponential",
  beta: 3,
  power: 2,
};

function hoppingFactor(d0: number, d: number, options: PhysicalOptions): number {
  if (options.hoppingScaleMode === "fixed") return 1;

  if (d0 < 1e-12 || d < 1e-12) return 1;

  const ratio = d / d0;

  if (options.hoppingScaleMode === "exponential") {
    return Math.exp(-options.beta * (ratio - 1));
  }

  if (options.hoppingScaleMode === "power") {
    return Math.pow(1 / ratio, options.power);
  }

  return 1;
}

export function applyPhysicalOptions(baseModel: TBModel, options: PhysicalOptions): TBModel {
  const scale = sanitizePhysicalScale(options.scale);

  const scaledModelShell: TBModel = {
    ...baseModel,
    lattice: scaleLatticeAnisotropic(baseModel.lattice, scale),
    orbitals: baseModel.orbitals.map((orb) => ({ ...orb })),
    onsites: baseModel.onsites.map((onsite) => ({
      orbital: { ...onsite.orbital },
      energy: { ...onsite.energy },
    })),
    hoppings: [],
    defaultPath: [...baseModel.defaultPath],
    name: `${baseModel.name} · sx=${scale.x.toFixed(2)}, sy=${scale.y.toFixed(2)}, sz=${scale.z.toFixed(2)}`,
  };

  const scaledHoppings: HoppingTerm[] = baseModel.hoppings.map((hop) => {
    const d0 = norm(hoppingDisplacement(baseModel, hop.from.site, hop.to.site, hop.R));
    const d = norm(hoppingDisplacement(scaledModelShell, hop.from.site, hop.to.site, hop.R));
    const factor = hoppingFactor(d0, d, options);

    return {
      ...hop,
      from: { ...hop.from },
      to: { ...hop.to },
      R: [...hop.R],
      value: cscale(hop.value, factor),
      label: hop.label,
    };
  });

  return {
    ...scaledModelShell,
    hoppings: scaledHoppings,
  };
}

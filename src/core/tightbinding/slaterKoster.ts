import type { Vec3 } from "../math/vec";
import { normalize } from "../math/vec";

export interface SP3Params {
  Es: number;
  Ep: number;
  Vss_sigma: number;
  Vsp_sigma: number;
  Vpp_sigma: number;
  Vpp_pi: number;
}

export function sp3HoppingByDirection(direction: Vec3, p: SP3Params): number[][] {
  const [l, m, n] = normalize(direction);
  const ppDelta = p.Vpp_sigma - p.Vpp_pi;

  return [
    [
      p.Vss_sigma,
      l * p.Vsp_sigma,
      m * p.Vsp_sigma,
      n * p.Vsp_sigma,
    ],
    [
      -l * p.Vsp_sigma,
      l * l * p.Vpp_sigma + (1 - l * l) * p.Vpp_pi,
      l * m * ppDelta,
      l * n * ppDelta,
    ],
    [
      -m * p.Vsp_sigma,
      l * m * ppDelta,
      m * m * p.Vpp_sigma + (1 - m * m) * p.Vpp_pi,
      m * n * ppDelta,
    ],
    [
      -n * p.Vsp_sigma,
      l * n * ppDelta,
      m * n * ppDelta,
      n * n * p.Vpp_sigma + (1 - n * n) * p.Vpp_pi,
    ],
  ];
}

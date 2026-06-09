import type { BandPoint, BandResult } from "../core/tightbinding/tbTypes";

function downloadDataUrl(dataUrl: string, filename: string): void {
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = filename;
  a.click();
}

export class BandPlot {
  private readonly canvas: HTMLCanvasElement;
  private readonly ctx: CanvasRenderingContext2D;

  private lastResult: BandResult | null = null;
  private referenceResult: BandResult | null = null;
  private hoverIndex: number | null = null;
  private onHoverPoint?: (point: BandPoint | null) => void;

  private redrawRequest = 0;

  constructor(canvas: HTMLCanvasElement, onHoverPoint?: (point: BandPoint | null) => void) {
    this.onHoverPoint = onHoverPoint;
    this.canvas = canvas;

    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("2D canvas context unavailable.");
    this.ctx = ctx;

    window.addEventListener("resize", () => {
      this.resize();
    });

    this.canvas.addEventListener("mousemove", (event) => this.handleMouseMove(event));
    this.canvas.addEventListener("mouseleave", () => this.handleMouseLeave());

    this.resizeCanvas();

    // Layout이 늦게 잡히는 경우를 대비해서 첫 프레임 이후 한 번 더 그리게 한다.
    requestAnimationFrame(() => {
      this.resize();
    });
  }

  resize(): void {
    const changed = this.resizeCanvas();

    if (changed && this.lastResult) {
      this.requestRedraw();
    }
  }

  private requestRedraw(): void {
    if (this.redrawRequest !== 0) return;

    this.redrawRequest = requestAnimationFrame(() => {
      this.redrawRequest = 0;

      if (this.lastResult) {
        this.draw(this.lastResult, this.hoverIndex);
      }
    });
  }

  private resizeCanvas(): boolean {
    const rect = this.canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const cssWidth = Math.max(1, rect.width);
    const cssHeight = Math.max(1, rect.height);

    const nextWidth = Math.max(1, Math.floor(cssWidth * dpr));
    const nextHeight = Math.max(1, Math.floor(cssHeight * dpr));

    const changed =
      this.canvas.width !== nextWidth ||
      this.canvas.height !== nextHeight;

    if (changed) {
      this.canvas.width = nextWidth;
      this.canvas.height = nextHeight;
    }

    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    return changed;
  }

  saveCurrentAsReference(): boolean {
    if (!this.lastResult) return false;

    this.referenceResult = structuredClone(this.lastResult);
    this.draw(this.lastResult, this.hoverIndex);

    return true;
  }

  clearReference(): void {
    this.referenceResult = null;

    if (this.lastResult) {
      this.draw(this.lastResult, this.hoverIndex);
    }
  }

  hasReference(): boolean {
    return this.referenceResult !== null;
  }

  exportPNG(filename = "band-plot.png"): void {
    if (this.lastResult) {
      this.draw(this.lastResult, this.hoverIndex);
    }

    downloadDataUrl(this.canvas.toDataURL("image/png"), filename);
  }

  private plotMetrics() {
    const rect = this.canvas.getBoundingClientRect();

    const margin = {
      left: 46,
      right: 16,
      top: 20,
      bottom: 36,
    };

    const width = Math.max(1, rect.width);
    const height = Math.max(1, rect.height);

    const plotW = Math.max(1, width - margin.left - margin.right);
    const plotH = Math.max(1, height - margin.top - margin.bottom);

    return {
      rect,
      width,
      height,
      margin,
      plotW,
      plotH,
    };
  }

  private handleMouseMove(event: MouseEvent): void {
    if (!this.lastResult || this.lastResult.points.length === 0) return;

    const { rect, margin, plotW, plotH } = this.plotMetrics();

    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    if (
      x < margin.left ||
      x > margin.left + plotW ||
      y < margin.top ||
      y > margin.top + plotH
    ) {
      this.handleMouseLeave();
      return;
    }

    const xMin = this.lastResult.points[0]?.x ?? 0;
    const xMax = this.lastResult.points[this.lastResult.points.length - 1]?.x ?? 1;

    const bandX =
      xMin + ((x - margin.left) / plotW) * (xMax - xMin || 1);

    let bestIndex = 0;
    let bestDistance = Number.POSITIVE_INFINITY;

    this.lastResult.points.forEach((point, index) => {
      const distance = Math.abs(point.x - bandX);

      if (distance < bestDistance) {
        bestDistance = distance;
        bestIndex = index;
      }
    });

    if (this.hoverIndex !== bestIndex) {
      this.hoverIndex = bestIndex;
      this.onHoverPoint?.(this.lastResult.points[bestIndex]);
      this.draw(this.lastResult, this.hoverIndex);
    }
  }

  private handleMouseLeave(): void {
    if (this.hoverIndex === null) return;

    this.hoverIndex = null;
    this.onHoverPoint?.(null);

    if (this.lastResult) {
      this.draw(this.lastResult, null);
    }
  }

  private bandColor(weight: number | undefined, hasWeight: boolean): string {
    if (!hasWeight || weight === undefined) return "#f8fafc";

    const w = Math.max(0, Math.min(1, weight));

    const r = Math.round(96 + 248 * w);
    const g = Math.round(165 - 60 * w);
    const b = Math.round(250 - 190 * w);

    return `rgb(${r}, ${g}, ${b})`;
  }

  draw(result: BandResult, hoverIndex: number | null = this.hoverIndex): void {
    this.lastResult = result;
    this.hoverIndex = hoverIndex;

    this.resizeCanvas();

    const { width, height, margin, plotW, plotH } = this.plotMetrics();
    const ctx = this.ctx;

    ctx.clearRect(0, 0, width, height);

    ctx.fillStyle = "#0f1318";
    ctx.fillRect(0, 0, width, height);

    if (result.points.length === 0 || result.bandCount <= 0) {
      ctx.fillStyle = "#94a3b8";
      ctx.font = "12px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("No band data", width / 2, height / 2);
      return;
    }

    const allE = [
      ...result.points.flatMap((p) => p.energies),
      ...(result.fermiEnergy !== undefined ? [result.fermiEnergy] : []),
      ...(this.referenceResult ? this.referenceResult.points.flatMap((p) => p.energies) : []),
      ...(this.referenceResult?.fermiEnergy !== undefined ? [this.referenceResult.fermiEnergy] : []),
    ].filter((value) => Number.isFinite(value));

    let eMin = allE.length > 0 ? Math.min(...allE) : -1;
    let eMax = allE.length > 0 ? Math.max(...allE) : 1;

    if (Math.abs(eMax - eMin) < 1e-8) {
      eMin -= 1;
      eMax += 1;
    }

    const pad = 0.08 * (eMax - eMin);
    eMin -= pad;
    eMax += pad;

    const xToPx = (x: number, r: BandResult = result): number => {
      const xMin = r.points[0]?.x ?? 0;
      const xMax = r.points[r.points.length - 1]?.x ?? 1;

      return margin.left + ((x - xMin) / (xMax - xMin || 1)) * plotW;
    };

    const eToPy = (e: number): number => {
      return margin.top + (1 - (e - eMin) / (eMax - eMin)) * plotH;
    };

    ctx.strokeStyle = "#334155";
    ctx.lineWidth = 1;
    ctx.strokeRect(margin.left, margin.top, plotW, plotH);

    ctx.fillStyle = "#94a3b8";
    ctx.font = "12px sans-serif";
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";

    for (let i = 0; i <= 4; i++) {
      const e = eMin + ((eMax - eMin) * i) / 4;
      const y = eToPy(e);

      ctx.strokeStyle = "#1f2937";
      ctx.beginPath();
      ctx.moveTo(margin.left, y);
      ctx.lineTo(margin.left + plotW, y);
      ctx.stroke();

      ctx.fillStyle = "#94a3b8";
      ctx.fillText(e.toFixed(2), margin.left - 8, y);
    }

    for (const point of result.points.filter((p) => p.label)) {
      const x = xToPx(point.x, result);

      ctx.strokeStyle = "#475569";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, margin.top);
      ctx.lineTo(x, margin.top + plotH);
      ctx.stroke();

      ctx.fillStyle = "#cbd5e1";
      ctx.font = "12px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      ctx.fillText(point.label ?? "", x, margin.top + plotH + 8);
    }

    if (this.referenceResult) {
      ctx.save();

      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = "rgba(148, 163, 184, 0.78)";
      ctx.lineWidth = 1.1;

      for (let band = 0; band < this.referenceResult.bandCount; band++) {
        ctx.beginPath();

        for (let i = 0; i < this.referenceResult.points.length; i++) {
          const p = this.referenceResult.points[i];
          const x = xToPx(p.x, this.referenceResult);
          const y = eToPy(p.energies[band]);

          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }

        ctx.stroke();
      }

      ctx.restore();
    }

    const hasWeights =
      result.colorMode !== undefined &&
      result.colorMode !== "plain";

    for (let band = 0; band < result.bandCount; band++) {
      ctx.lineWidth = 1.4;

      if (!hasWeights) {
        ctx.strokeStyle = "#f8fafc";
        ctx.beginPath();

        for (let i = 0; i < result.points.length; i++) {
          const p = result.points[i];
          const x = xToPx(p.x, result);
          const y = eToPy(p.energies[band]);

          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }

        ctx.stroke();
      } else {
        for (let i = 0; i < result.points.length - 1; i++) {
          const p0 = result.points[i];
          const p1 = result.points[i + 1];

          const w0 = p0.colorWeights?.[band] ?? 0;
          const w1 = p1.colorWeights?.[band] ?? w0;

          ctx.strokeStyle = this.bandColor(0.5 * (w0 + w1), true);

          ctx.beginPath();
          ctx.moveTo(xToPx(p0.x, result), eToPy(p0.energies[band]));
          ctx.lineTo(xToPx(p1.x, result), eToPy(p1.energies[band]));
          ctx.stroke();
        }
      }
    }

    if (result.fermiEnergy !== undefined) {
      const y = eToPy(result.fermiEnergy);

      ctx.strokeStyle = "#facc15";
      ctx.lineWidth = 1.2;
      ctx.setLineDash([6, 4]);

      ctx.beginPath();
      ctx.moveTo(margin.left, y);
      ctx.lineTo(margin.left + plotW, y);
      ctx.stroke();

      ctx.setLineDash([]);

      ctx.fillStyle = "#facc15";
      ctx.font = "11px sans-serif";
      ctx.textAlign = "left";
      ctx.textBaseline = "bottom";
      ctx.fillText(`EF=${result.fermiEnergy.toFixed(3)}`, margin.left + 4, y - 3);
    }

    if (hoverIndex !== null && result.points[hoverIndex]) {
      const hp = result.points[hoverIndex];
      const hx = xToPx(hp.x, result);

      ctx.strokeStyle = "#22c55e";
      ctx.lineWidth = 1.2;

      ctx.beginPath();
      ctx.moveTo(hx, margin.top);
      ctx.lineTo(hx, margin.top + plotH);
      ctx.stroke();

      ctx.fillStyle = "#22c55e";
      ctx.beginPath();
      ctx.arc(hx, margin.top + 8, 4, 0, Math.PI * 2);
      ctx.fill();
    }

    if (hasWeights) {
      const x0 = width - 145;
      const y0 = 8;

      const gradient = ctx.createLinearGradient(x0, 0, x0 + 70, 0);
      gradient.addColorStop(0, this.bandColor(0, true));
      gradient.addColorStop(1, this.bandColor(1, true));

      ctx.fillStyle = gradient;
      ctx.fillRect(x0, y0, 70, 8);

      ctx.strokeStyle = "#64748b";
      ctx.strokeRect(x0, y0, 70, 8);

      ctx.fillStyle = "#cbd5e1";
      ctx.font = "11px sans-serif";
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      ctx.fillText(result.colorMode ?? "", x0 + 76, y0 - 2);
    }

    if (this.referenceResult) {
      ctx.strokeStyle = "rgba(148, 163, 184, 0.9)";
      ctx.setLineDash([4, 4]);

      ctx.beginPath();
      ctx.moveTo(width - 122, height - 18);
      ctx.lineTo(width - 88, height - 18);
      ctx.stroke();

      ctx.setLineDash([]);

      ctx.fillStyle = "#cbd5e1";
      ctx.font = "11px sans-serif";
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.fillText("reference", width - 80, height - 18);
    }

    // Keep the plot area clean: long model names are shown in Model info /
    // Band summary instead of being drawn over the graph.
    ctx.fillStyle = "#e2e8f0";
  }
}
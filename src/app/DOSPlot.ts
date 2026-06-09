import type { DOSResult } from "../core/tightbinding/solveDos";

export class DOSPlot {
  private readonly canvas: HTMLCanvasElement;
  private readonly ctx: CanvasRenderingContext2D;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("2D canvas context unavailable.");
    this.ctx = ctx;

    const resize = () => this.resize();
    window.addEventListener("resize", resize);
    this.resize();
  }

  resize(): void {
    const rect = this.canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio, 2);
    this.canvas.width = Math.max(1, Math.floor(rect.width * dpr));
    this.canvas.height = Math.max(1, Math.floor(rect.height * dpr));
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  exportPNG(filename = "dos-plot.png"): void {
    const a = document.createElement("a");
    a.href = this.canvas.toDataURL("image/png");
    a.download = filename;
    a.click();
  }

  draw(result: DOSResult): void {
    this.resize();

    const rect = this.canvas.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    const ctx = this.ctx;
    ctx.clearRect(0, 0, width, height);

    ctx.fillStyle = "#0f1318";
    ctx.fillRect(0, 0, width, height);

    const margin = { left: 46, right: 16, top: 22, bottom: 30 };
    const plotW = width - margin.left - margin.right;
    const plotH = height - margin.top - margin.bottom;

    const maxDOS = Math.max(
      1e-8,
      ...result.points.map((p) => p.total),
      ...result.points.map((p) => p.projected ?? 0),
    );

    const eMin = result.energyMin;
    const eMax = result.energyMax;

    const xToPx = (value: number) => margin.left + (value / maxDOS) * plotW;
    const eToPy = (energy: number) => margin.top + (1 - (energy - eMin) / (eMax - eMin || 1)) * plotH;

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

      ctx.fillText(e.toFixed(2), margin.left - 8, y);
    }

    const drawCurve = (getter: (index: number) => number, color: string, lineWidth: number) => {
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;
      ctx.beginPath();

      for (let i = 0; i < result.points.length; i++) {
        const p = result.points[i];
        const x = xToPx(getter(i));
        const y = eToPy(p.energy);

        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }

      ctx.stroke();
    };

    drawCurve((i) => result.points[i].total, "#f8fafc", 1.5);

    const hasProjection = result.projectionMode !== "total" && result.projectionMode !== "plain";
    if (hasProjection) {
      drawCurve((i) => result.points[i].projected ?? 0, "#f97316", 1.7);
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

    ctx.fillStyle = "#e2e8f0";
    ctx.font = "13px sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText("DOS", margin.left, 4);

    ctx.font = "11px sans-serif";
    ctx.fillStyle = "#cbd5e1";
    ctx.fillText(`k=${result.kGridSize}${result.modelName ? "" : ""}, η=${result.broadening.toFixed(3)}`, margin.left + 44, 6);

    const legendX = width - 116;
    const legendY = 8;

    ctx.fillStyle = "#f8fafc";
    ctx.fillRect(legendX, legendY, 12, 3);
    ctx.fillStyle = "#cbd5e1";
    ctx.fillText("total", legendX + 18, legendY - 5);

    if (hasProjection) {
      ctx.fillStyle = "#f97316";
      ctx.fillRect(legendX + 58, legendY, 12, 3);
      ctx.fillStyle = "#cbd5e1";
      ctx.fillText(result.projectionMode, legendX + 76, legendY - 5);
    }
  }
}

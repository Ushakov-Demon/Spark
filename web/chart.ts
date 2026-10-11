/** Minimal live line chart (SVG): temperature over time. No dependencies. */
export interface Series {
  readonly name: string;
  readonly className: string;
  readonly points: { t: number; v: number }[];
}

export interface Chart {
  readonly element: SVGSVGElement;
  render(series: readonly Series[], xLabel: string, marker?: { readonly v: number; readonly label: string }): void;
}

const NS = 'http://www.w3.org/2000/svg';
const W = 640;
const H = 260;
const PAD = { l: 44, r: 12, t: 12, b: 34 };

const nice = (max: number): number => {
  const steps = [1, 2, 5, 10, 15, 20, 30, 60, 120, 240];
  return steps.find((s) => max / s <= 8) ?? Math.ceil(max / 8);
};

export function createChart(): Chart {
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  svg.setAttribute('class', 'chart');
  svg.setAttribute('role', 'img');

  return {
    element: svg,
    render(series, xLabel, marker) {
      const all = series.flatMap((s) => s.points);
      const tMax = Math.max(1, ...all.map((p) => p.t));
      const vMin = Math.min(0, ...all.map((p) => p.v));
      const vMax = Math.max(110, ...all.map((p) => p.v));
      const x = (t: number) => PAD.l + ((W - PAD.l - PAD.r) * t) / tMax;
      const y = (v: number) => H - PAD.b - ((H - PAD.t - PAD.b) * (v - vMin)) / (vMax - vMin);
      const parts: string[] = [];

      for (let v = Math.ceil(vMin / 20) * 20; v <= vMax; v += 20) {
        parts.push(`<line class="grid" x1="${PAD.l}" x2="${W - PAD.r}" y1="${y(v)}" y2="${y(v)}"/>`);
        parts.push(`<text class="axis" x="${PAD.l - 6}" y="${y(v) + 4}" text-anchor="end">${v}°</text>`);
      }
      const step = nice(tMax);
      for (let t = 0; t <= tMax + 1e-9; t += step) {
        parts.push(`<text class="axis" x="${x(t)}" y="${H - PAD.b + 16}" text-anchor="middle">${t}</text>`);
      }
      parts.push(`<text class="axis" x="${W - PAD.r}" y="${H - 4}" text-anchor="end">${xLabel}</text>`);
      if (marker) {
        parts.push(`<line class="marker" x1="${PAD.l}" x2="${W - PAD.r}" y1="${y(marker.v)}" y2="${y(marker.v)}"/>`);
        parts.push(`<text class="marker-label" x="${W - PAD.r - 4}" y="${y(marker.v) - 5}" text-anchor="end">${marker.label}</text>`);
      }
      for (const s of series) {
        if (s.points.length < 2) continue;
        const d = s.points.map((p, i) => `${i ? 'L' : 'M'}${x(p.t).toFixed(1)},${y(p.v).toFixed(1)}`).join('');
        parts.push(`<path class="line ${s.className}" d="${d}"><title>${s.name}</title></path>`);
      }
      svg.innerHTML = parts.join('');
    },
  };
}

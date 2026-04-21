export interface ProjectionDataPoint {
  month: number;
  withInterest: number;
  withoutInterest: number;
  label: string;
}

export interface ProjectionInput {
  principal: number;
  monthlyPMT: number;
  annualRate: number;
  months: number;
}

/**
 * A = P(1 + r/n)^(nt) + PMT × [((1 + r/n)^(nt) - 1) / (r/n)]
 * n = 12 (monthly compounding)
 */
export function calculateProjection(input: ProjectionInput): ProjectionDataPoint[] {
  const { principal, monthlyPMT, annualRate, months } = input;
  const r = annualRate / 100;
  const n = 12;
  const points: ProjectionDataPoint[] = [];

  for (let m = 0; m <= months; m++) {
    const t = m / 12;
    const base = Math.pow(1 + r / n, n * t);

    let withInterest: number;
    if (r === 0 || m === 0) {
      withInterest = principal + monthlyPMT * m;
    } else {
      withInterest = principal * base + monthlyPMT * ((base - 1) / (r / n));
    }

    const withoutInterest = principal + monthlyPMT * m;

    let label: string;
    if (m === 0) label = "Now";
    else if (m % 3 === 0) label = `${m}m`;
    else label = "";

    points.push({
      month: m,
      withInterest: Math.round(withInterest * 100) / 100,
      withoutInterest: Math.round(withoutInterest * 100) / 100,
      label,
    });
  }

  return points;
}

export function getProjectionSummary(points: ProjectionDataPoint[]) {
  const at6 = points.find((p) => p.month === 6) ?? null;
  const at12 = points.find((p) => p.month === 12) ?? null;
  return { at6, at12 };
}

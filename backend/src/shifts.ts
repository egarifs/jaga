export interface Shift { name: string; start: string; end: string } // "HH:MM"; end<=start = crosses midnight
const min = (t: string) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
const spans = (s: Shift): [number, number][] => {
  const a = min(s.start), b = min(s.end);
  return b > a ? [[a, b]] : [[a, 1440], [0, b]];
};
// Q5: Kepala sets free hours; overlap rejected.
export function overlaps(shifts: Shift[]): boolean {
  const all = shifts.flatMap(spans).sort((x, y) => x[0] - y[0]);
  return all.some((r, i) => i > 0 && r[0] < all[i - 1][1]);
}
export const onDuty = (shifts: (Shift & { userId?: string })[], at: string) =>
  shifts.find((s) => spans(s).some(([a, b]) => min(at) >= a && min(at) < b));

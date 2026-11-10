export interface Stock { remaining: number; dailyDose: number; expiry?: string }
export const daysLeft = (s: Stock) => (s.dailyDose > 0 ? Math.floor(s.remaining / s.dailyDose) : Infinity);
export const lowStock = (s: Stock) => daysLeft(s) <= 3;
export function expiringSoon(s: Stock, now = new Date()) {
  if (!s.expiry) return false;
  return (new Date(s.expiry).getTime() - now.getTime()) / 864e5 <= 30;
}

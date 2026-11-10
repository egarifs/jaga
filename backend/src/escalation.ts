import type { Member } from './permissions.ts';
export const DEFAULT_WINDOW_MIN = 15; // Q2

// Q3: on-duty nurse. Q4: nobody on duty -> Wakil.
export function recipient(members: Member[], onDutyUserId?: string): Member | undefined {
  const ok = (m: Member) => m.status === 'approved';
  return members.find((m) => ok(m) && m.role === 'perawat' && m.userId === onDutyUserId)
    ?? members.find((m) => ok(m) && m.role === 'wakil');
}

// Q9: snooze moves escalation +15 min; reason required; audited.
export function snooze(escalateAt: Date, reason: string, audit: string[], by: string): Date {
  if (!reason.trim()) throw new Error('alasan wajib');
  audit.push(`${by} tunda 15 mnt: ${reason}`);
  return new Date(escalateAt.getTime() + 15 * 60_000);
}

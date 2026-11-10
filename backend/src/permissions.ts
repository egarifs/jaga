export type Role = 'kepala' | 'wakil' | 'perawat';
export type Action =
  | 'circle.delete' | 'circle.transfer' | 'member.approve' | 'member.setRole'
  | 'shift.manage' | 'escalation.configure' | 'medicine.edit' | 'dose.log'
  | 'document.read' | 'record.read' | 'ai.ask';

export interface Member {
  userId: string;
  role: Role;
  status: 'pending' | 'approved';
  canEditMedicine?: boolean;
  canReadDocuments?: boolean;
}

const BY_ROLE: Record<Role, Action[]> = {
  kepala: ['circle.delete', 'circle.transfer', 'member.approve', 'member.setRole', 'shift.manage',
    'escalation.configure', 'medicine.edit', 'dose.log', 'document.read', 'record.read', 'ai.ask'],
  wakil: ['member.approve', 'shift.manage', 'medicine.edit', 'dose.log', 'document.read', 'record.read', 'ai.ask'],
  perawat: ['dose.log', 'record.read', 'ai.ask'],
};

// Server-side check. Pending members get nothing (BR-06). Per-member flags extend perawat.
export function can(m: Member | undefined, a: Action): boolean {
  if (!m || m.status !== 'approved') return false;
  if (a === 'medicine.edit' && m.role === 'perawat') return m.canEditMedicine === true;
  if (a === 'document.read' && m.role === 'perawat') return m.canReadDocuments === true;
  return BY_ROLE[m.role].includes(a);
}

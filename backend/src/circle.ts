import { can, type Member, type Role } from './permissions.ts';

export class Circle {
  members: Member[] = [];
  code: string;
  constructor(code: string, headUserId: string) {
    this.code = code;
    this.members.push({ userId: headUserId, role: 'kepala', status: 'approved' });
  }
  // FR-04: valid code -> pending only.
  join(userId: string, code: string) {
    if (code !== this.code) throw new Error('kode tidak valid');
    if (!this.members.some((m) => m.userId === userId))
      this.members.push({ userId, role: 'perawat', status: 'pending' });
  }
  private get(id: string) { return this.members.find((m) => m.userId === id); }
  approve(by: string, userId: string) {
    if (!can(this.get(by), 'member.approve')) throw new Error('dilarang');
    const m = this.get(userId); if (!m) throw new Error('tidak ditemukan');
    m.status = 'approved';
  }
  setRole(by: string, userId: string, role: Role) {
    if (!can(this.get(by), 'member.setRole')) throw new Error('dilarang');
    this.get(userId)!.role = role;
  }
  // Q8: head must transfer before leaving.
  leave(userId: string) {
    if (this.get(userId)?.role === 'kepala') throw new Error('transfer kepemilikan dulu');
    this.members = this.members.filter((m) => m.userId !== userId);
  }
  transfer(from: string, to: string) {
    if (!can(this.get(from), 'circle.transfer')) throw new Error('dilarang');
    this.get(from)!.role = 'wakil'; this.get(to)!.role = 'kepala';
  }
  can = (userId: string, a: Parameters<typeof can>[1]) => can(this.get(userId), a);
}

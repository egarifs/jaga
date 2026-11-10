import { createHmac } from 'node:crypto';
export function issue_for(uid: string, secret: string) {
  const p = Buffer.from(JSON.stringify({ uid, exp: Date.now() + 6e5 })).toString('base64url');
  return `${p}.${createHmac('sha256', secret).update(p).digest('base64url')}`;
}

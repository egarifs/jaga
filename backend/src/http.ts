import type http from 'node:http';
export const body = (req: http.IncomingMessage) => new Promise<any>((res, rej) => {
  let n = 0; const ch: Buffer[] = [];
  req.on('data', (c) => { n += c.length; if (n > 1e6) { rej(new Error('too big')); req.destroy(); } else ch.push(c); });
  req.on('end', () => { try { res(ch.length ? JSON.parse(Buffer.concat(ch).toString()) : {}); } catch (e) { rej(e); } });
});
export const send = (r: http.ServerResponse, code: number, o: unknown) => { r.writeHead(code, { 'content-type': 'application/json' }); r.end(JSON.stringify(o)); };

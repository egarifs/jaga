export interface Source { title: string }
export const DISCLAIMER = 'Informasi ini bukan diagnosis atau saran dosis. Darurat: hubungi 119.';
const BLOCK = /(diagnos|dosis|berapa (mg|tablet)|boleh minum berapa)/i;

// BR-08/10: no diagnosis, no dose, answers sourced from circle data only.
export function answer(q: string, facts: { text: string; source: Source }[]) {
  if (BLOCK.test(q)) return { text: 'Saya tidak dapat mendiagnosis atau menentukan dosis. Tanyakan ke dokter.', sources: [], disclaimer: DISCLAIMER };
  const words = q.toLowerCase().split(/\W+/).filter((w) => w.length > 3);
  const hit = facts.filter((f) => words.some((w) => f.text.toLowerCase().includes(w)));
  if (!hit.length) return { text: 'Data tidak ditemukan.', sources: [], disclaimer: DISCLAIMER };
  return { text: hit.map((h) => h.text).join('\n'), sources: hit.map((h) => h.source), disclaimer: DISCLAIMER };
}

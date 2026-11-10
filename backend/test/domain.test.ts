import test from 'node:test';
import assert from 'node:assert/strict';
import { daysLeft, lowStock } from '../src/stock.ts';
import { overlaps } from '../src/shifts.ts';
import { recipient, snooze } from '../src/escalation.ts';
import { Circle } from '../src/circle.ts';
import { answer } from '../src/ai.ts';

test('Metformin 6 tablet @2/hari -> habis 3 hari', () => {
  const s = { remaining: 6, dailyDose: 2 };
  assert.equal(daysLeft(s), 3); assert.ok(lowStock(s));
});
test('shift overlap', () => {
  assert.ok(!overlaps([{ name: 'p', start: '06:00', end: '14:00' }, { name: 'm', start: '22:00', end: '06:00' }]));
  assert.ok(overlaps([{ name: 'p', start: '06:00', end: '15:00' }, { name: 's', start: '14:00', end: '22:00' }]));
});
test('escalation: on-duty nurse, else wakil', () => {
  const ms = [{ userId: 'w', role: 'wakil', status: 'approved' }, { userId: 'a', role: 'perawat', status: 'approved' }] as const;
  assert.equal(recipient([...ms], 'a')?.userId, 'a');
  assert.equal(recipient([...ms])?.userId, 'w');
});
test('snooze needs reason, adds 15 min', () => {
  const log: string[] = [];
  assert.throws(() => snooze(new Date(0), ' ', log, 'x'));
  assert.equal(snooze(new Date(0), 'mandi', log, 'x').getTime(), 15 * 60_000);
  assert.equal(log.length, 1);
});
test('join -> pending, no access until approved', () => {
  const c = new Circle('KODE1', 'h');
  assert.throws(() => c.join('p', 'salah'));
  c.join('p', 'KODE1');
  assert.ok(!c.can('p', 'record.read'));
  assert.throws(() => c.approve('p', 'p'));
  c.approve('h', 'p');
  assert.ok(c.can('p', 'record.read'));
  assert.ok(!c.can('p', 'medicine.edit'));
});
test('head cannot leave before transfer', () => {
  const c = new Circle('K', 'h'); c.join('w', 'K'); c.approve('h', 'w');
  assert.throws(() => c.leave('h'));
  c.transfer('h', 'w'); c.leave('h');
});
test('ai refuses dose, says not found, cites source', () => {
  const f = [{ text: 'Alergi: penisilin', source: { title: 'Profil' } }];
  assert.match(answer('dosis metformin?', f).text, /tidak dapat/);
  assert.equal(answer('apa vaksin?', f).text, 'Data tidak ditemukan.');
  assert.equal(answer('alergi apa?', f).sources.length, 1);
});

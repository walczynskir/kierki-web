import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pointsRecord, completionOutcome, summarizePoints } from '../dist/points-statistics.js';

test('completed matches group signed points by format, Eights and difficulty', () => {
  const classic = { format: 'classic', includePuzzle: true };
  const records = [
    pointsRecord(classic, 'hard', 17, 'win'),
    pointsRecord(classic, 'hard', -7, 'completed-loss'),
    pointsRecord(classic, 'easy', 0, 'draw'),
    pointsRecord({ ...classic, includePuzzle: false }, 'hard', -5, 'completed-loss'),
    pointsRecord({ includePuzzle: true }, 'hard', 4, 'win'),
    pointsRecord({ single: 'no-tricks' }, 'hard', -4, 'win'), 'win', 'loss'
  ];
  const groups = summarizePoints(records.entries());
  assert.deepEqual(groups.get('classic-with').get('hard'), { count: 2, points: 10 });
  assert.deepEqual(groups.get('classic-with').get('easy'), { count: 1, points: 0 });
  assert.equal(groups.get('classic-without').get('hard').points, -5);
  assert.equal(groups.get('robbers-with').get('hard').points, 4);
  assert.equal(records[5], null);
  assert.equal(completionOutcome(records[6]), 'win');
});

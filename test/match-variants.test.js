import assert from 'node:assert/strict';
import { test } from 'node:test';
import { advance, computerCard, computerView, play, setTrump } from '../dist/engine.js';
import { legacyMatch, matchLength, matchScores, newMatch, nextMatchDeal } from '../dist/match.js';
import { computerPuzzleCard, playPuzzle } from '../dist/puzzle.js';

const random = () => .314;
const classic = ['no-tricks', 'no-hearts', 'no-boys', 'no-ladies', 'no-king-of-hearts', 'no-six-and-last', 'robber'];
const recovery = Array(4).fill('recover');

function finish(game) {
  if (game.phase === 'trump') assert(setTrump(game, null));
  while (game.phase !== 'done') {
    if (game.mode === 'puzzle') assert(playPuzzle(game, computerPuzzleCard(game, 'medium')));
    else if (game.phase === 'review') assert(advance(game));
    else {
      const view = computerView(game);
      assert(play(game, computerCard(view, view.legal)));
    }
  }
}

test('all four match variants follow their schedule, rotate dealer and balance scores', () => {
  for (const format of ['robbers', 'classic']) {
    for (const includePuzzle of [false, true]) {
      let { match, game } = newMatch(random, includePuzzle, null, format);
      const expected = [...(format === 'classic' ? classic : Array(4).fill('robber')), ...recovery];
      if (includePuzzle) expected.push('puzzle');
      assert.equal(matchLength(match), expected.length);
      assert.equal(match.dealer, 1);
      for (const [index, mode] of expected.entries()) {
        assert.equal(match.number, index + 1);
        assert.equal(match.dealer, (index + 1) % 4);
        assert.equal(game.leader, (index + 2) % 4);
        assert.equal(game.mode, mode);
        if (mode === 'recover') assert.equal(game.recoveryPoints, format === 'classic' ? 5 : 10);
        assert.equal(nextMatchDeal(match, game, random), null);
        finish(game);
        const restored = JSON.parse(JSON.stringify({ match, game }));
        const next = nextMatchDeal(restored.match, restored.game, random);
        if (index === expected.length - 1) {
          assert.equal(next, null);
          const scores = matchScores(match, game);
          const expectedTotal = format === 'classic' ? 260 : 520;
          assert.equal(scores.negative.reduce((sum, points) => sum + points, 0), -expectedTotal);
          assert.equal(scores.positive.reduce((sum, points) => sum + points, 0), expectedTotal);
          assert.equal(scores.puzzle.reduce((sum, points) => sum + points, 0), 0);
        } else {
          assert.equal(next.match.dealHistory.at(-1).mode, mode);
          ({ match, game } = next);
        }
      }
    }
  }
});

test('stored matches without a format keep their original schedule, and training stays one deal', () => {
  const { match, game } = newMatch(random, false);
  delete match.format;
  match.number = 4;
  finish(game);
  const next = nextMatchDeal(match, game, random);
  assert.equal(matchLength(match), 8);
  assert.equal(next.game.mode, 'recover');
  assert.equal(next.game.recoveryPoints, 10);
  const oldest = legacyMatch(game);
  assert.equal(matchLength(oldest), 2);
  assert.equal(nextMatchDeal(oldest, game, random).game.recoveryPoints, 5);
  const practice = newMatch(random, true, 'recover', 'classic');
  assert.equal(matchLength(practice.match), 1);
  assert.equal(practice.game.recoveryPoints, 10);
  finish(practice.game);
  assert.equal(nextMatchDeal(practice.match, practice.game, random), null);
});

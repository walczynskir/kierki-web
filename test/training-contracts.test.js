import assert from 'node:assert/strict';
import { test } from 'node:test';
import { advance, computerCard, computerView, deal, dealFinished, kingOfHearts, legalCards, play, trickPoints } from '../dist/engine.js';
import { decideComputerCard } from '../dist/deciders.js';
import { matchScores, newMatch } from '../dist/match.js';

test('contracts score only their own penalties and apply the correct opening restrictions', () => {
  const trick = [9, 11, 49, 50].map(card => ({ card }));
  assert.equal(trickPoints('no-tricks', trick, 6), -2);
  assert.equal(trickPoints('no-hearts', trick, 6), -4);
  assert.equal(trickPoints('no-boys', trick, 6), -9);
  assert.equal(trickPoints('no-ladies', [{ card: 10 }], 6), -5);
  assert.equal(trickPoints('no-king-of-hearts', trick, 6), -16);
  for (const number of [1, 5, 6, 7, 12, 13]) {
    assert.equal(trickPoints('no-six-and-last', trick, number), [6, 13].includes(number) ? -9 : 0);
  }

  for (const mode of ['no-tricks', 'no-hearts', 'no-boys']) {
    const game = deal(mode, 0);
    game.hands[0] = [0, 39];
    assert.deepEqual(legalCards(game), mode === 'no-hearts' ? [0] : [0, 39]);
    game.trick = [{ player: 3, card: 1 }];
    assert.deepEqual(legalCards(game), [0]);
    game.trick = [];
    game.hands[0] = [39];
    assert.deepEqual(legalCards(game), [39]);
  }
});

test('the king of hearts is compulsory when void, with no hearts lead while another suit is held', () => {
  const game = deal('no-king-of-hearts', 0);
  game.hands[0] = [0, kingOfHearts, 51];
  assert.deepEqual(legalCards(game), [0]);
  game.trick = [{ player: 3, card: 13 }];
  assert.deepEqual(legalCards(game), [kingOfHearts]);
  game.trick = [{ player: 3, card: 1 }];
  assert.deepEqual(legalCards(game), [0]);
});

test('card penalty contracts end as soon as every penalty has been taken', () => {
  for (const [mode, penalty] of [['no-hearts', 26], ['no-boys', 24], ['no-ladies', 20], ['no-king-of-hearts', 16]]) {
    const game = deal(mode, 0);
    game.phase = 'review';
    game.points[0] = -penalty;
    assert(dealFinished(game));
    assert(advance(game));
    assert.equal(game.phase, 'done');
  }
});

test('both computer strategies finish all practice contracts with the original point totals', () => {
  for (const [mode, penalty] of [['no-tricks', 26], ['no-hearts', 26], ['no-boys', 24], ['no-ladies', 20], ['no-king-of-hearts', 16], ['no-six-and-last', 18]]) {
    for (const decide of [view => computerCard(view, view.legal), decideComputerCard]) {
      const { match, game } = newMatch(() => .314, true, mode);
      for (let turn = 0; turn < 52 && game.phase !== 'done'; turn++) {
        assert(play(game, decide(computerView(game))));
        if (game.phase === 'review') assert(advance(game));
      }
      assert.equal(game.phase, 'done');
      assert.deepEqual(matchScores(match, game).negative, game.points);
      assert.equal(game.points.reduce((sum, points) => sum + points), -penalty);
    }
  }
});

test('no queens sheds a winning king or ace only as last player in a queen-free trick', () => {
  const view = (hand, trick) => ({
    mode: 'no-ladies', trump: null, turn: 3, hand, legal: hand, tricks: [],
    trick: trick.map((card, player) => ({ player, card }))
  });
  assert.equal(decideComputerCard(view([5, 11], [2, 3, 6])), 11);
  assert.equal(decideComputerCard(view([5, 12], [2, 3, 6])), 12);
  assert.equal(decideComputerCard(view([5, 11], [2, 6])), 5);
  assert.equal(decideComputerCard(view([5, 11], [2, 23, 6])), 5);
  assert.equal(decideComputerCard(view([5, 10, 12], [2, 3, 11])), 10);
});

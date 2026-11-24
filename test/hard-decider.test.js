import assert from 'node:assert/strict';
import { test } from 'node:test';
import { advance, computerView, deal, legalCards, play, setTrump, suit, suits } from '../dist/engine.js';
import { decideComputerCard } from '../dist/deciders.js';
import { decideHardCard, decideHardPuzzleCard, decideHardTrump, hiddenHandsSampler } from '../dist/hard-decider.js';

import { computerPuzzleCard, dealPuzzle, playPuzzle, puzzleCards } from '../dist/puzzle.js';

test('sampled hands respect card counts, revealed cards and observed void suits', () => {
  const game = deal('no-tricks', 0, () => .314);
  for (let i = 0; i < 33; i++) {
    assert(play(game, decideComputerCard(computerView(game))));
    if (game.phase === 'review') advance(game);
  }
  const view = computerView(game);
  const played = [...view.tricks, view.trick];
  const known = played.flat().map(({ card }) => card);
  const hands = hiddenHandsSampler(view)(() => .73);
  assert.deepEqual(hands.map(hand => hand.length), game.hands.map(hand => hand.length));
  assert.deepEqual(hands[view.turn], view.hand);
  assert.equal(new Set([...hands.flat(), ...known]).size, 52);
  let voids = 0;
  for (const trick of played) {
    const lead = suit(trick[0].card);
    for (const { player, card } of trick) {
      if (suit(card) === lead) continue;
      voids++;
      assert(hands[player].every(card => suit(card) !== lead));
    }
  }
  assert(voids > 0);
});

test('hard moves are deterministic, legal and do not mutate the public view', () => {
  const game = deal('no-tricks', 0, () => .314);
  const view = computerView(game);
  const before = structuredClone(view);
  const move = decideHardCard(view);
  assert(view.legal.includes(move));
  assert.equal(decideHardCard(view), move);
  assert.deepEqual(view, before);
});

test('hard completes negative contracts and recovery with legal plays', () => {
  const modes = ['no-tricks', 'no-hearts', 'no-boys', 'no-ladies', 'no-king-of-hearts', 'no-six-and-last', 'robber', 'recover'];
  for (const mode of modes) {
    const game = deal(mode, 0, () => .314);
    if (game.phase === 'trump') {
      const trump = decideHardTrump(game.hands[0].slice(0, 7), 0, 2);
      assert([...suits, null].includes(trump));
      assert(setTrump(game, trump));
    }
    for (let moves = 0; moves < 52 && game.phase !== 'done'; moves++) {
      const card = game.turn === 0 ? decideHardCard(computerView(game), 2) : legalCards(game)[0];
      assert(play(game, card), mode);
      if (game.phase === 'review') assert(advance(game));
    }
    assert.equal(game.phase, 'done', mode);
  }
});

test('hard puzzle only uses public hand sizes and chooses a legal move', () => {
  const game = dealPuzzle(0, () => .314);
  for (let moves = 0; moves < 30 && puzzleCards(game).length < 2; moves++) {
    assert(playPuzzle(game, computerPuzzleCard(game, 'medium')));
  }
  const legal = puzzleCards(game);
  assert(legal.length >= 2);
  const before = structuredClone(game);
  const card = decideHardPuzzleCard(game, 2);
  assert(legal.includes(card));
  assert.deepEqual(game, before);
  for (const [seat, hand] of game.hands.entries()) {
    if (seat !== game.turn) game.hands[seat] = Array(hand.length).fill(-1);
  }
  assert.equal(decideHardPuzzleCard(game, 2), card);
});

test('hard discards the king of the led suit under an ace in No Tricks', () => {
  let seed = 13;
  const random = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 2 ** 32;
  };
  const game = deal('no-tricks', 0, random);
  const aceOfSpades = 38;
  const kingOfSpades = 37;
  assert.ok(play(game, aceOfSpades));
  const view = computerView(game);
  assert.ok(view.legal.includes(kingOfSpades));
  assert.equal(decideHardCard(view), kingOfSpades);
});

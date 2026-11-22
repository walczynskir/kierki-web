import assert from 'node:assert/strict';
import { test } from 'node:test';
import { advance, computerView, deal, play, suit } from '../dist/engine.js';
import { decideComputerCard } from '../dist/deciders.js';
import { decideHardCard, hiddenHandsSampler } from '../dist/hard-decider.js';

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

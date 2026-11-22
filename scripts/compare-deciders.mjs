import assert from 'node:assert/strict';
import { advance, computerCard, computerTrump, computerView, deal, play, setTrump, suits } from '../dist/engine.js?v=deciders-1';
import { decideComputerCard } from '../dist/deciders.js';

function randomSource(seed) {
  return () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 0x100000000;
  };
}

function run(initial, adaptedPlayer) {
  const game = structuredClone(initial);
  const chosen = [];
  while (game.phase !== 'done') {
    if (game.phase === 'review') {
      advance(game);
      continue;
    }
    const view = computerView(game);
    const simple = computerCard(view, view.legal);
    const adapted = game.turn === adaptedPlayer;
    const card = adapted ? decideComputerCard(view) : simple;
    if (adapted) chosen.push(card !== simple);
    assert(view.legal.includes(card));
    assert(play(game, card));
  }
  assert.equal(game.tricks.length, 13);
  assert.equal(new Set(game.tricks.flatMap(({ cards }) => cards.map(({ card }) => card))).size, 52);
  assert.equal(game.points.reduce((sum, n) => sum + n, 0), game.mode === 'robber' ? -130 : 65);
  return { points: game.points, chosen };
}

const card = (color, rank) => suits.indexOf(color) * 13 + rank - 2;
{
  const highHeart = card('♥', 13);
  const smallHeart = card('♥', 2);
  const view = {
    mode: 'robber', turn: 0, trump: null, hand: [highHeart, smallHeart], legal: [highHeart, smallHeart],
    trick: [{ player: 3, card: card('♣', 5) }], tricks: []
  };
  assert.equal(decideComputerCard(view), highHeart);
}
{
  const view = {
    mode: 'robber', turn: 0, trump: null, hand: [card('♣', 2), card('♣', 10), card('♠', 5), card('♠', 13), card('♥', 14)],
    trick: [], tricks: []
  };
  view.legal = view.hand.slice(0, -1);
  const sixth = { ...view, tricks: Array.from({ length: 5 }, () => []) };
  assert.equal(decideComputerCard(sixth), card('♣', 2));
  assert.equal(decideComputerCard(view), card('♠', 5));
}
{
  const game = deal('recover', 0, randomSource(2));
  assert(setTrump(game, null));
  const view = computerView(game);
  [game.hands[1], game.hands[2]] = [game.hands[2], game.hands[1]];
  assert.deepEqual(computerView(game), view);
  assert.equal(decideComputerCard(computerView(game)), decideComputerCard(view));
}

for (const [mode, useTrump, name] of [
  ['robber', false, 'Rozbójnik'], ['recover', true, 'Odgrywka z atu'], ['recover', false, 'Odgrywka bez atu']
]) {
  const samples = 400;
  let baseTotal = 0;
  let adaptedTotal = 0;
  let differing = 0;
  let moves = 0;
  let better = 0;
  let tied = 0;
  for (let seed = 1; seed <= samples; seed++) {
    const game = deal(mode, seed % 4, randomSource(seed + 7123));
    if (mode === 'recover') assert(setTrump(game, useTrump ? computerTrump(game.hands[game.leader].slice(0, 7)) : null));
    const baseline = run(game, -1);
    for (let player = 0; player < 4; player++) {
      const { points, chosen } = run(game, player);
      baseTotal += baseline.points[player];
      adaptedTotal += points[player];
      differing += chosen.filter(Boolean).length;
      moves += chosen.length;
      better += Number(points[player] > baseline.points[player]);
      tied += Number(points[player] === baseline.points[player]);
    }
  }
  const tests = samples * 4;
  console.log(JSON.stringify({ name, deals: samples, seatRuns: tests, differing, moves, better, tied,
    worse: tests - better - tied, baseline: baseTotal / tests, adapted: adaptedTotal / tests }));
}

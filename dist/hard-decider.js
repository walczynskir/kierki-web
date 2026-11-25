import { advance, computerCard, computerTrump, computerView, legalCards, play, rank, suit, suits, trickPoints, winner } from './engine.js?v=training-contracts-2';
import { decideComputerCard } from './deciders.js?v=no-queens-last-seat-1';

import { computerPuzzleCard, playPuzzle, puzzleCards } from './puzzle.js?v=seat-moves-1';

const seats = [0, 1, 2, 3];
const deck = Array.from({ length: 52 }, (_, card) => card);

function randomFor(view) {
  let seed = 0x811c9dc5;
  for (const card of [...view.hand, ...view.trick.map(entry => entry.card), view.tricks.length]) {
    seed = Math.imul(seed ^ card, 0x01000193);
  }
  return () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 0x100000000;
  };
}

// A player who discarded off-suit cannot hold any card of the suit led.
export function hiddenHandsSampler(view) {
  const remaining = seats.map(() => 13);
  const voidSuits = seats.map(() => new Set());
  const known = new Set(view.hand);
  for (const trick of [...view.tricks, view.trick]) {
    if (!trick.length) continue;
    const lead = suit(trick[0].card);
    for (const { card, player } of trick) {
      known.add(card);
      remaining[player]--;
      if (suit(card) !== lead) voidSuits[player].add(lead);
    }
  }
  return makeSampler(view, remaining, known, (card, seat) => !voidSuits[seat].has(suit(card)));
}

function makeSampler(view, remaining, known, canHold) {
  const opponents = seats.filter(seat => seat !== view.turn);
  const unknown = deck.filter(card => !known.has(card)).map(card => ({
    card,
    eligible: opponents.filter(seat => canHold(card, seat))
  })).sort((a, b) => a.eligible.length - b.eligible.length);
  const masks = unknown.map(({ eligible }) => eligible.reduce((mask, seat) => mask | (1 << seat), 0));
  // For every subset of opponents, the cards forced into it must fit its capacity.
  const constrained = Array.from({ length: unknown.length + 1 }, () => Array(16).fill(0));
  for (let index = unknown.length - 1; index >= 0; index--) {
    for (let mask = 0; mask < 16; mask++) {
      constrained[index][mask] = constrained[index + 1][mask] + Number((masks[index] & mask) === masks[index]);
    }
  }
  const feasible = (index, capacity) => constrained[index].every((count, mask) =>
    count <= opponents.reduce((sum, seat) => sum + (mask & (1 << seat) ? capacity[seat] : 0), 0));
  if (remaining[view.turn] !== view.hand.length
    || unknown.length !== opponents.reduce((sum, seat) => sum + remaining[seat], 0)
    || !feasible(0, remaining)) return null;

  return random => {
    const hands = seats.map(seat => seat === view.turn ? view.hand.slice() : []);
    const capacity = remaining.slice();
    for (let index = 0; index < unknown.length; index++) {
      const { card, eligible } = unknown[index];
      const candidates = eligible.filter(seat => {
        if (!capacity[seat]) return false;
        capacity[seat]--;
        const possible = feasible(index + 1, capacity);
        capacity[seat]++;
        return possible;
      });
      const weight = candidates.reduce((sum, seat) => sum + capacity[seat], 0);
      let choice = random() * weight;
      const seat = candidates.find(seat => (choice -= capacity[seat]) < 0);
      hands[seat].push(card);
      capacity[seat]--;
    }
    return hands;
  };
}

function chooseBySimulation(options, fallback, sample, random, value, samples) {
  const totals = new Map(options.map(option => [option, 0]));
  for (let iteration = 0; iteration < samples; iteration++) {
    const hands = sample(random);
    for (const option of options) totals.set(option, totals.get(option) + value(hands, option));
  }
  return options.reduce((best, option) => totals.get(option) > totals.get(best) ? option : best, fallback);
}

function finishTricks(game) {
  while (game.phase !== 'done') {
    if (game.phase === 'review') advance(game);
    else {
      const card = game.mode === 'no-tricks' ? computerCard(game, legalCards(game))
        : decideComputerCard(computerView(game));
      play(game, card);
    }
  }
}

export function decideHardCard(view, samples = 16) {
  const fallback = decideComputerCard(view);
  if (view.legal.length < 2) return fallback;
  const leadCard = view.trick[0]?.card;
  if (view.mode === 'no-tricks' && leadCard !== undefined && rank(leadCard) === 14) {
    const king = view.legal.find(card => suit(card) === suit(leadCard) && rank(card) === 13);
    if (king !== undefined) return king;
  }
  const sample = hiddenHandsSampler(view);
  if (!sample) return fallback;

  const points = seats.map(() => 0);
  view.tricks.forEach((trick, index) => {
    if (trick.length) points[winner(trick, view.trump).player] += trickPoints(view.mode, trick, index + 1);
  });
  const value = (hands, card) => {
    const game = {
      mode: view.mode, phase: 'play', trump: view.trump, turn: view.turn,
      hands: hands.map(hand => hand.slice()), trick: view.trick.slice(),
      tricks: view.tricks.map(cards => ({ cards })), points: points.slice()
    };
    play(game, card);
    finishTricks(game);
    return game.points[view.turn];
  };
  return chooseBySimulation(view.legal, fallback, sample, randomFor(view), value,
    view.mode === 'no-tricks' ? samples : Math.min(samples, 8));
}

export function decideHardTrump(hand, turn, samples = 8) {
  const view = { hand, turn, trick: [], tricks: [] };
  const unknown = deck.filter(card => !hand.includes(card));
  const sample = random => {
    const shuffled = unknown.slice();
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    const hands = seats.map(seat => seat === turn ? hand.slice() : shuffled.splice(0, 13));
    hands[turn].push(...shuffled);
    return hands;
  };
  const value = (hands, trump) => {
    const game = {
      mode: 'recover', phase: 'play', trump, turn,
      hands: hands.map(cards => cards.slice()), trick: [], tricks: [], points: seats.map(() => 0)
    };
    finishTricks(game);
    return game.points[turn];
  };
  return chooseBySimulation([...suits, null], computerTrump(hand), sample, randomFor(view), value, samples);
}

export function decideHardPuzzleCard(game, samples = 16) {
  const legal = puzzleCards(game);
  const fallback = computerPuzzleCard(game, 'medium');
  if (legal.length < 2) return fallback;
  const view = { turn: game.turn, hand: game.hands[game.turn], trick: [], tricks: [] };
  const board = deck.filter(card => {
    const row = game.rows[suit(card)];
    return row && rank(card) >= row.low && rank(card) <= row.high;
  });
  const sample = makeSampler(view, game.hands.map(hand => hand.length), new Set([...view.hand, ...board]), () => true);
  if (!sample) return fallback;
  const value = (hands, card) => {
    const simulation = {
      turn: game.turn, phase: 'play', rows: { ...game.rows }, hands: hands.map(hand => hand.slice()),
      finishOrder: game.finishOrder.slice(), points: game.points.slice()
    };
    playPuzzle(simulation, card);
    while (simulation.phase !== 'done') playPuzzle(simulation, computerPuzzleCard(simulation, 'medium'));
    return simulation.points[view.turn];
  };
  return chooseBySimulation(legal, fallback, sample, randomFor(view), value, samples);
}

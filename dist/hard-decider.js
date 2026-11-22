import { advance, computerCard, legalCards, play, suit } from './engine.js?v=training-contracts-2';
import { decideComputerCard } from './deciders.js?v=no-queens-last-seat-1';

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
  const opponents = seats.filter(seat => seat !== view.turn);
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
  const unknown = deck.filter(card => !known.has(card)).map(card => ({
    card,
    eligible: opponents.filter(seat => !voidSuits[seat].has(suit(card)))
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

function remainingPenalty(view, hands, firstCard) {
  const game = {
    mode: 'no-tricks', phase: 'play', trump: null, turn: view.turn,
    hands: hands.map(hand => hand.slice()), trick: view.trick.slice(),
    tricks: view.tricks.slice(), points: [0, 0, 0, 0]
  };
  play(game, firstCard);
  while (game.phase !== 'done') {
    if (game.phase === 'review') advance(game);
    else play(game, computerCard(game, legalCards(game)));
  }
  return -game.points[view.turn];
}

export function decideHardCard(view, samples = 16) {
  const fallback = decideComputerCard(view);
  if (view.mode !== 'no-tricks' || view.legal.length < 2) return fallback;
  const sample = hiddenHandsSampler(view);
  if (!sample) return fallback;

  const random = randomFor(view);
  const totals = new Map(view.legal.map(card => [card, 0]));
  for (let iteration = 0; iteration < samples; iteration++) {
    const hands = sample(random);
    for (const card of view.legal) {
      totals.set(card, totals.get(card) + remainingPenalty(view, hands, card));
    }
  }
  return view.legal.reduce((best, card) => totals.get(card) < totals.get(best) ? card : best, fallback);
}

export const suits = ['♣', '♦', '♠', '♥'];
export const suit = card => suits[Math.floor(card / 13)];
export const rank = card => card % 13 + 2;
const next = player => (player + 1) % 4;

export function deal(mode, leader, random = Math.random) {
  const deck = Array.from({ length: 52 }, (_, card) => card);
  for (let index = deck.length - 1; index > 0; index--) {
    const other = Math.floor(random() * (index + 1));
    [deck[index], deck[other]] = [deck[other], deck[index]];
  }
  return {
    mode, leader, turn: leader, trump: null,
    phase: mode === 'recover' ? 'trump' : 'play',
    hands: Array.from({ length: 4 }, (_, player) => deck.filter((_, index) => index % 4 === player)),
    trick: [], tricks: [], points: [0, 0, 0, 0]
  };
}

export function setTrump(game, trump) {
  if (game.phase !== 'trump' || (trump !== null && !suits.includes(trump))) return false;
  game.trump = trump;
  game.phase = 'play';
  return true;
}

export function winner(trick, trump) {
  const lead = suit(trick[0].card);
  const weight = card => rank(card) + (suit(card) === trump ? 30 : suit(card) === lead ? 15 : 0);
  return trick.reduce((best, entry) => weight(entry.card) > weight(best.card) ? entry : best);
}

export function legalCards(game) {
  if (game.phase !== 'play') return [];
  const hand = game.hands[game.turn];
  if (!game.trick.length) {
    const other = hand.filter(card => suit(card) !== '♥');
    return game.mode === 'robber' && other.length ? other : hand;
  }
  const lead = suit(game.trick[0].card);
  const follow = hand.filter(card => suit(card) === lead);
  if (game.mode === 'robber') return follow.length ? follow : hand;
  const trumps = hand.filter(card => suit(card) === game.trump);
  const choices = follow.length ? follow : trumps.length ? trumps : hand;
  const mustBeat = game.trump === null ? follow.length > 0 : suit(choices[0]) === game.trump;
  const best = winner(game.trick, game.trump).card;
  const higher = mustBeat ? choices.filter(card => suit(card) === suit(best) && rank(card) > rank(best)) : [];
  return higher.length ? higher : choices;
}

export function cardPenalty(card) {
  const hearts = suit(card) === '♥';
  return (hearts ? 2 : 0) + (rank(card) === 11 || rank(card) === 13 ? 3 : 0)
    + (rank(card) === 12 ? 5 : 0) + (hearts && rank(card) === 13 ? 16 : 0);
}

export function trickPoints(mode, trick, number, recoveryPoints = 5) {
  if (mode === 'recover') return recoveryPoints;
  const extra = number === 6 || number === 13 ? 9 : 0;
  return -(2 + extra + trick.reduce((sum, entry) => sum + cardPenalty(entry.card), 0));
}

export function play(game, card) {
  if (!legalCards(game).includes(card)) return false;
  const player = game.turn;
  game.hands[player].splice(game.hands[player].indexOf(card), 1);
  game.trick.push({ player, card });
  if (game.trick.length < 4) {
    game.turn = next(player);
  } else {
    const taker = winner(game.trick, game.trump).player;
    const points = trickPoints(game.mode, game.trick, game.tricks.length + 1, game.recoveryPoints);
    game.points[taker] += points;
    game.tricks.push({ taker, points, cards: game.trick.slice() });
    game.turn = taker;
    game.phase = 'review';
  }
  return true;
}

export function advance(game) {
  if (game.phase !== 'review') return false;
  game.trick = [];
  game.phase = game.tricks.length === 13 ? 'done' : 'play';
  return true;
}

export function computerTrump(cards) {
  const value = color => cards.filter(card => suit(card) === color)
    .reduce((sum, card) => sum + 60 + rank(card), 0);
  return suits.reduce((best, color) => value(color) > value(best) ? color : best);
}

export function computerView(game) {
  return {
    mode: game.mode,
    trump: game.trump,
    turn: game.turn,
    hand: game.hands[game.turn].slice(),
    legal: legalCards(game).slice(),
    trick: game.trick.slice(),
    tricks: game.tricks.map(({ cards }) => cards ?? [])
  };
}

export function computerCard({ mode, trump, turn, trick }, legal) {
  const sorted = [...legal].sort((a, b) => rank(a) - rank(b));
  if (!trick.length) return mode === 'recover' ? sorted.at(-1) : sorted[0];
  const takes = card => winner([...trick, { player: turn, card }], trump).player === turn;
  if (mode === 'recover') return sorted.find(takes) ?? sorted[0];
  const safe = sorted.filter(card => !takes(card));
  if (!safe.length) return sorted[0];
  return safe.reduce((best, card) => cardPenalty(card) >= cardPenalty(best) ? card : best);
}

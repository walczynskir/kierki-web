// Adapted from CRobberDecider and CRecoverDecider, Kierki commit 5796cd1.
// Decisions use the player's hand and public play history only.
import { suits, suit, rank, winner, computerCard } from './engine.js?v=training-contracts-1';

const hearts = '♥';
const jack = 11;
const queen = 12;
const king = 13;
const ace = 14;
const deckBySuit = Object.fromEntries(suits.map((color, index) =>
  [color, Array.from({ length: 13 }, (_, value) => index * 13 + value)]));

function position(view) {
  const current = view.trick;
  const visibleTricks = current.length ? [...view.tricks, current] : view.tricks;
  const played = visibleTricks.flat();
  const known = new Set([...view.hand, ...played.map(entry => entry.card)]);
  const dealt = [...view.hand, ...played.filter(entry => entry.player === view.turn).map(entry => entry.card)];
  const held = Object.fromEntries(suits.map(color =>
    [color, view.hand.filter(card => suit(card) === color).sort((a, b) => a - b)]));
  const original = color => dealt.filter(card => suit(card) === color).length;
  const unaccounted = Object.fromEntries(suits.map(color =>
    [color, deckBySuit[color].filter(card => !known.has(card))]));
  const longest = count => [...suits].sort((a, b) => count(b) - count(a));
  const shortestOriginal = longest(original).reverse();
  const longestRemaining = longest(color => held[color].length);
  const led = color => visibleTricks.filter(trick => trick.length && suit(trick[0].card) === color);
  return {
    number: view.tricks.length + 1, held, original, shortestOriginal, longestRemaining,
    originalRanks: color => dealt.filter(card => suit(card) === color).map(rank),
    low: color => held[color][0],
    high: color => held[color].at(-1),
    atRank: (color, value) => held[color].find(card => rank(card) === value),
    above: card => unaccounted[suit(card)].some(other => other > card),
    below: card => unaccounted[suit(card)].some(other => other < card),
    others: color => unaccounted[color].length,
    taken: color => played.filter(entry => suit(entry.card) === color).length,
    timesLed: color => led(color).length,
    fullTricks: color => led(color).every(trick => trick.every(entry => suit(entry.card) === color)),
    trumpedLast: (color, trump) => led(color).at(-1)?.some(entry => suit(entry.card) === trump) ?? false
  };
}

const belowRank = (cards, value) => cards.findLast(card => rank(card) < value);
const beatOrLow = (cards, card) => cards.find(other => other > card) ?? cards[0];

function robberLead(view, p) {
  const colors = p.shortestOriginal.filter(color => view.legal.some(card => suit(card) === color));
  const contested = colors.filter(color => color !== hearts && p.others(color));
  const lowFallback = () => p.low(colors[0]);
  if (p.number === 6) {
    const higherOut = contested.filter(color => p.above(p.low(color)));
    const color = higherOut.find(color => rank(p.low(color)) <= 4) ?? higherOut[0] ?? contested[0];
    return color ? p.low(color) : lowFallback();
  }
  for (const color of contested) {
    if (p.number < 6 || p.taken(color) <= 2) return belowRank(p.held[color], jack) ?? p.low(color);
    if (p.above(p.low(color))) return p.low(color);
  }
  return contested.length ? p.low(contested[0]) : lowFallback();
}

function robberDiscard(p) {
  const danger = p.atRank(hearts, king) ?? p.atRank(hearts, ace);
  if (danger !== undefined) return danger;
  const shortColor = p.shortestOriginal.find(color => {
    const highest = p.high(color);
    return highest !== undefined && rank(highest) !== 2 && p.below(highest);
  });
  if (shortColor) return p.high(shortColor);
  return p.high(hearts) ?? p.high(p.shortestOriginal.find(color => p.held[color].length));
}

function robberCard(view, p) {
  if (!view.trick.length) return robberLead(view, p);
  const lead = suit(view.trick[0].card);
  const cards = p.held[lead];
  if (!cards.length) return robberDiscard(p);
  const best = winner(view.trick, null).card;
  const under = cards.findLast(card => card < best);
  if (under !== undefined || view.trick.length < 3) return under ?? cards[0];
  return p.atRank(lead, ace) ?? belowRank(cards, jack)
    ?? p.atRank(lead, king) ?? p.atRank(lead, jack) ?? p.atRank(lead, queen);
}

function recoverLead(trump, p) {
  const trumps = p.held[trump];
  const high = trumps.at(-1);
  const otherColors = p.shortestOriginal.filter(color => color !== trump);
  const side = otherColors.filter(color => p.held[color].length);
  const remainingTrumps = p.others(trump);
  if (trumps.length && p.original(trump) < 3 && rank(high) < jack && p.original(otherColors[0]) > 1) return trumps[0];

  // As in CRecoverDecider, long trumps with an original honour lead high.
  const originalTrumpRanks = p.originalRanks(trump);
  const longHonours = [ace, king, jack].some(value => originalTrumpRanks.includes(value));
  if (trumps.length && p.original(trump) > 4 && remainingTrumps > 0 && longHonours) return high;
  if (trumps.length && remainingTrumps > 0 && remainingTrumps < 3 && !p.above(high)) return high;
  if (trumps.length >= 2 && remainingTrumps > 0 && remainingTrumps < 6 && !p.above(trumps.at(-2))) return high;

  const singleton = ['♣', '♠', '♦', '♥'].find(color =>
    color !== trump && p.original(color) === 1 && p.low(color) !== undefined && rank(p.low(color)) !== ace);
  if (singleton) return p.low(singleton);
  const withoutHonours = side.find(color => rank(p.high(color)) < queen);
  if (withoutHonours) return p.low(withoutHonours);
  const cash = side.find(color => !p.above(p.high(color)) && p.taken(color) > 1
    && p.original(color) > 5 && p.others(color) <= 4 && p.fullTricks(color));
  if (cash) return p.high(cash);
  if (!side.length) return high;

  const color = side[0];
  const littleTrumpRisk = remainingTrumps < 2;
  const cashHigh = !p.above(p.high(color)) && (p.fullTricks(color) || littleTrumpRisk)
    && (p.others(color) > 3 || littleTrumpRisk);
  return cashHigh ? p.high(color) : p.low(color);
}

function noTrumpLead(p) {
  const [longest, ...alternatives] = p.longestRemaining;
  if (p.original(longest) > 4 && p.held[longest].length <= 2 && !p.above(p.high(longest))) return p.high(longest);
  const side = alternatives.slice(0, 2).find(color => p.held[color].length);
  return side ? p.above(p.high(side)) ? p.low(side) : p.high(longest) : p.high(longest);
}

function recoverFollow(view, p, random) {
  const { trump } = view;
  const color = suit(view.trick[0].card);
  const best = winner(view.trick, trump).card;
  const cards = p.held[color];
  if (!cards.length) {
    if (!trump || !p.held[trump].length) return p.low(p.longestRemaining[0]);
    return suit(best) === trump ? beatOrLow(p.held[trump], best) : p.low(trump);
  }
  if (suit(best) !== color) return cards[0];
  if (trump === null || color === trump || view.trick.length === 3) return beatOrLow(cards, best);
  if (!p.above(best)) return cards[0];

  const times = p.timesLed(color);
  const high = cards.at(-1);
  const holdsAce = rank(high) === ace;
  const temptingQueen = p.atRank(color, queen);
  if (holdsAce && temptingQueen !== undefined && times === 1 && p.original(color) < 5 && rank(best) < king) {
    return random() < .1 ? temptingQueen : high;
  }
  if (p.trumpedLast(color, trump)) return cards[0];
  if (!p.above(high) && (times === 1 || (times <= 3 && p.original(color) < 7) || p.others(trump) === 0)) return high;
  const second = cards.at(-2);
  const hasHigherOutside = value => p.above(deckBySuit[color][value - 2]);
  if (second !== undefined && p.fullTricks(color)
      && ((p.atRank(color, king) !== undefined && hasHigherOutside(king) && second > best)
        || (temptingQueen !== undefined && hasHigherOutside(queen)))) return second;
  return cards[0];
}

function repeatableChance(view) {
  let seed = 0x811c9dc5;
  for (const card of [...view.hand, ...view.trick.map(entry => entry.card), view.tricks.length]) {
    seed = Math.imul(seed ^ card, 0x01000193);
  }
  return (seed >>> 0) / 0x100000000;
}

export function decideComputerCard(view, random = () => repeatableChance(view)) {
  if (view.legal.length < 2) return view.legal[0];
  const p = position(view);
  if (view.mode !== 'robber' && view.mode !== 'recover') {
    const canLoseLead = view.legal.filter(card => p.above(card));
    const legal = !view.trick.length && canLoseLead.length ? canLoseLead : view.legal;
    return computerCard(view, legal);
  }
  const card = view.mode === 'robber' ? robberCard(view, p)
    : view.trick.length ? recoverFollow(view, p, random)
    : view.trump ? recoverLead(view.trump, p) : noTrumpLead(p);
  return view.legal.includes(card) ? card : computerCard(view, view.legal);
}

// JavaScript adaptations of the six CNo*Decider classes in walczynskir/Kierki.
// Suit rankings and outstanding cards are reconstructed from public play and the current hand.
import { kingOfHearts, rank, suit, suits, winner } from './engine.js?v=training-contracts-2';

const hearts = '♥';
const jack = 11;
const queen = 12;
const king = 13;
const ace = 14;

function position(view, cards) {
  const colors = suits.filter(color => cards.held[color].length);
  const lead = view.trick.length ? suit(view.trick[0].card) : null;
  const best = lead ? rank(winner(view.trick, null).card) : null;
  return {
    ...cards, colors, lead, best, played: view.trick.length,
    follow: lead ? cards.held[lead] : [],
    byOriginalLength: [...colors].sort((a, b) => cards.original(a) - cards.original(b)),
    byLength: [...colors].sort((a, b) => cards.held[a].length - cards.held[b].length),
    byRemaining: [...colors].sort((a, b) => cards.left(a) - cards.left(b)),
    byOthers: [...colors].sort((a, b) => cards.others(a) - cards.others(b)),
    lowFirst: [...colors].sort((a, b) => rank(cards.low(a)) - rank(cards.low(b))),
    highFirst: [...colors].sort((a, b) => rank(cards.high(b)) - rank(cards.high(a)))
  };
}

const under = (cards, value) => cards.findLast(card => rank(card) < value);
const underOrNext = (cards, value) => under(cards, value) ?? cards.find(card => rank(card) > value);

function noTricks(p) {
  if (!p.lead) {
    const color = p.byOriginalLength.find(color => p.above(p.low(color))) ?? p.byLength[0];
    return p.low(color);
  }
  if (!p.follow.length) {
    const color = p.byOriginalLength.find(color => p.original(color) <= 2) ?? p.highFirst[0];
    return p.high(color);
  }
  const avoid = under(p.follow, p.best);
  if (avoid !== undefined) return avoid;
  if (p.played === 3 || p.best >= king) return p.high(p.lead);
  const close = p.follow.find(card => rank(card) <= p.best + 4 - p.played);
  return close ?? p.high(p.lead);
}

function noHearts(p) {
  const nonHearts = colors => colors.filter(color => color !== hearts);
  if (!p.lead) {
    const high = nonHearts(p.highFirst).find(color => p.others(color) >= 3 && p.timesLed(color) < 3);
    if (high) return p.high(high);
    const low = nonHearts(p.lowFirst).find(color => p.above(p.low(color)));
    if (low) return p.low(low);
    const short = nonHearts(p.byOriginalLength).find(color => p.above(p.low(color)));
    if (short) return p.timesLed(short) > 2 ? p.low(short) : p.high(short);
    return p.low(nonHearts(p.byOriginalLength).at(-1) ?? hearts);
  }
  if (p.follow.length) {
    return p.lead === hearts ? under(p.follow, p.best) ?? p.high(hearts) : p.high(p.lead);
  }
  const throwHearts = p.original(hearts) <= 2 || nonHearts(p.colors).every(color => !p.below(p.low(color)));
  const color = [...p.lowFirst].reverse().find(color =>
    (color === hearts && throwHearts) || p.below(p.high(color)));
  return p.high(color) ?? p.high(hearts) ?? p.high(p.highFirst[0]);
}

function noCourtCards(p, boys) {
  const threshold = boys ? jack : queen;
  if (!p.lead) {
    const color = p.colors.find(color => p.held[color].some(card => rank(card) < threshold && p.above(card)))
      ?? p.byRemaining.find(color => p.above(p.low(color))) ?? p.byRemaining[0];
    return under(p.held[color], threshold) ?? p.low(color);
  }
  if (!p.follow.length) {
    for (const color of p.byLength) {
      const penalty = boys ? p.atRank(color, king) ?? p.atRank(color, jack) : p.atRank(color, queen);
      if (penalty !== undefined) return penalty;
    }
    return p.high(p.byLength[0]);
  }
  const priorities = boys
    ? { [queen]: [jack], [king]: [jack, queen], [ace]: [king, jack, queen] }
    : { [king]: [queen], [ace]: [queen, king] };
  return (priorities[p.best] ?? []).map(value => p.atRank(p.lead, value)).find(card => card !== undefined)
    ?? under(p.follow, threshold) ?? p.low(p.lead);
}

function noKingOfHearts(view, p) {
  if (!p.lead) {
    const available = colors => colors.filter(color => color !== hearts);
    const short = available(p.byLength).find(color => p.timesLed(color) < 2 && p.original(color) < 7);
    const low = available(p.byOriginalLength).find(color => p.others(color) >= 2 && rank(p.low(color)) <= 3);
    const color = short ?? low ?? available(p.byOthers)[0] ?? hearts;
    return color !== hearts && p.timesLed(color) < 2 && p.original(color) < 7 ? p.high(color) : p.low(color);
  }
  if (view.trick.some(({ card }) => card === kingOfHearts)) return p.low(p.follow.length ? p.lead : p.byLength[0]);
  if (p.follow.length) {
    return p.timesLed(p.lead) > 2 ? underOrNext(p.follow, p.best) : p.high(p.lead);
  }
  if (view.legal.includes(kingOfHearts)) return kingOfHearts;
  const color = p.byLength.find(color => (color !== hearts || p.original(color) <= 1)
    && p.others(color) && !(p.held[color].length === 1 && rank(p.low(color)) === 2));
  return p.high(color) ?? p.high(hearts) ?? p.high(p.byLength[0]);
}

function noSixAndLast(p) {
  if (!p.lead) {
    if (p.number === 6) {
      const color = p.lowFirst.find(color => p.above(p.low(color))) ?? p.lowFirst[0];
      return p.low(color);
    }
    const color = p.number === 5
      ? p.highFirst.find(color => !p.above(p.high(color))) ?? p.byOriginalLength[0]
      : p.highFirst.find(color => p.others(color)) ?? p.highFirst[0];
    return p.high(color);
  }
  if (!p.follow.length) return p.high(p.highFirst.find(color => p.others(color)) ?? p.highFirst[0]);
  return p.number === 6 ? under(p.follow, p.best) ?? p.low(p.lead) : p.high(p.lead);
}

export function decideNegativeContract(view, cards) {
  const p = position(view, cards);
  switch (view.mode) {
    case 'no-tricks': return noTricks(p);
    case 'no-hearts': return noHearts(p);
    case 'no-boys': return noCourtCards(p, true);
    case 'no-ladies': return noCourtCards(p, false);
    case 'no-king-of-hearts': return noKingOfHearts(view, p);
    case 'no-six-and-last': return noSixAndLast(p);
  }
}

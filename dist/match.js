import { deal } from './engine.js?v=training-contracts-2';
import { dealPuzzle } from './puzzle.js';

const emptyPoints = () => [0, 0, 0, 0];
const nextSeat = player => (player + 1) % 4;
const classicContracts = ['no-tricks', 'no-hearts', 'no-boys', 'no-ladies', 'no-king-of-hearts', 'no-six-and-last', 'robber'];

const negativeDeals = match => match.format === 'classic' ? classicContracts.length : match.dealsPerMode;
const recoveryDeals = match => match.format === 'classic' ? 4 : match.dealsPerMode;

export const matchRecoveryPoints = match => match.dealsPerMode === 4 && (match.single || match.format !== 'classic') ? 10 : 5;

export function matchMode(match, number) {
  if (match.single) return match.single;
  if (number <= negativeDeals(match)) return match.format === 'classic' ? classicContracts[number - 1] : 'robber';
  return number <= negativeDeals(match) + recoveryDeals(match) ? 'recover' : 'puzzle';
}

function dealForMatch(match, random) {
  const mode = matchMode(match, match.number);
  const leader = nextSeat(match.dealer);
  const game = mode === 'puzzle' ? dealPuzzle(leader, random) : deal(mode, leader, random);
  if (mode === 'recover') game.recoveryPoints = matchRecoveryPoints(match);
  return game;
}

export function newMatch(random = Math.random, includePuzzle = true, single = null, format = 'robbers') {
  const match = {
    number: 1, dealer: Math.floor(random() * 4), dealsPerMode: 4,
    negative: emptyPoints(), positive: emptyPoints(), includePuzzle, single, format
  };
  return { match, game: dealForMatch(match, random) };
}

export function legacyMatch(game, robberPoints) {
  return {
    number: game.mode === 'robber' ? 1 : 2, dealer: (game.leader + 3) % 4, dealsPerMode: 1,
    negative: robberPoints ?? emptyPoints(), positive: emptyPoints()
  };
}

export const matchLength = match => match.single ? 1 : negativeDeals(match) + recoveryDeals(match) + Number(match.includePuzzle === true);

export function matchScores(match, game) {
  return {
    negative: match.negative.map((points, player) => points + (game.mode !== 'recover' && game.mode !== 'puzzle' ? game.points[player] : 0)),
    positive: match.positive.map((points, player) => points + (game.mode === 'recover' ? game.points[player] : 0)),
    puzzle: game.mode === 'puzzle' ? game.points.slice() : emptyPoints()
  };
}

export function nextMatchDeal(match, game, random = Math.random) {
  if (game.phase !== 'done' || match.number >= matchLength(match)) return null;
  const { negative, positive } = matchScores(match, game);
  const dealHistory = [...(match.dealHistory ?? []), { number: match.number, mode: game.mode, tricks: game.tricks, points: game.points.slice() }];
  const next = { ...match, number: match.number + 1, dealer: nextSeat(match.dealer), negative, positive, dealHistory };
  return { match: next, game: dealForMatch(next, random) };
}

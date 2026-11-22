import { deal } from './engine.js?v=training-contracts-2';
import { dealPuzzle } from './puzzle.js';

const emptyPoints = () => [0, 0, 0, 0];
const nextSeat = player => (player + 1) % 4;

export function newMatch(random = Math.random, includePuzzle = true, single = null) {
  const match = {
    number: 1, dealer: Math.floor(random() * 4), dealsPerMode: 4,
    negative: emptyPoints(), positive: emptyPoints(), includePuzzle, single
  };
  const leader = nextSeat(match.dealer);
  const game = single === 'puzzle' ? dealPuzzle(leader, random) : deal(single ?? 'robber', leader, random);
  if (game.mode === 'recover') game.recoveryPoints = 10;
  return { match, game };
}

export function legacyMatch(game, robberPoints) {
  return {
    number: game.mode === 'robber' ? 1 : 2, dealer: (game.leader + 3) % 4, dealsPerMode: 1,
    negative: robberPoints ?? emptyPoints(), positive: emptyPoints()
  };
}

export const matchLength = match => match.single ? 1 : 2 * match.dealsPerMode + Number(match.includePuzzle === true);

export function matchScores(match, game) {
  return {
    negative: match.negative.map((points, player) => points + (game.mode !== 'recover' && game.mode !== 'puzzle' ? game.points[player] : 0)),
    positive: match.positive.map((points, player) => points + (game.mode === 'recover' ? game.points[player] : 0)),
    puzzle: game.mode === 'puzzle' ? game.points.slice() : emptyPoints()
  };
}

export function nextMatchDeal(match, game, random = Math.random) {
  if (game.phase !== 'done' || match.number >= matchLength(match)) return null;
  const number = match.number + 1;
  const dealer = nextSeat(match.dealer);
  const puzzle = number > 2 * match.dealsPerMode;
  const mode = number <= match.dealsPerMode ? 'robber' : 'recover';
  const nextGame = puzzle ? dealPuzzle(nextSeat(dealer), random) : deal(mode, nextSeat(dealer), random);
  if (nextGame.mode === 'recover' && match.dealsPerMode === 4) nextGame.recoveryPoints = 10;
  const { negative, positive } = matchScores(match, game);
  const dealHistory = [...(match.dealHistory ?? []), { number: match.number, mode: game.mode, tricks: game.tricks }];
  return { match: { ...match, number, dealer, negative, positive, dealHistory }, game: nextGame };
}

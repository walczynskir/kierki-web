import { deal, rank, suit } from './engine.js?v=match-1';

const finishingPoints = [10, 5, -5, -10];

export function dealPuzzle(leader, random) {
  return { ...deal('puzzle', leader, random), rows: {}, finishOrder: [], lastMove: null };
}

export function puzzleCards(game) {
  if (game.phase !== 'play') return [];
  return game.hands[game.turn].filter(card => {
    const range = game.rows[suit(card)];
    const value = rank(card);
    return range ? value === range.low - 1 || value === range.high + 1 : value === 8;
  });
}

export function playPuzzle(game, card = null) {
  if (game.phase !== 'play') return false;
  const legal = puzzleCards(game);
  if (card === null ? legal.length > 0 : !legal.includes(card)) return false;

  const player = game.turn;
  game.lastMoves ??= game.lastMove ? { [game.lastMove.player]: game.lastMove.card } : {};
  game.lastMoves[player] = card;
  game.lastMove = { player, card };
  (game.moves ??= []).push(game.lastMove);
  if (card !== null) {
    const hand = game.hands[player];
    hand.splice(hand.indexOf(card), 1);
    const value = rank(card);
    const color = suit(card);
    const range = game.rows[color];
    game.rows[color] = range
      ? { low: Math.min(range.low, value), high: Math.max(range.high, value) }
      : { low: value, high: value };
    if (!hand.length) {
      game.points[player] = finishingPoints[game.finishOrder.length];
      game.finishOrder.push(player);
    }
  }
  if (game.finishOrder.length === 4) {
    game.phase = 'done';
    return true;
  }
  do {
    game.turn = (game.turn + 1) % 4;
  } while (!game.hands[game.turn].length);
  return true;
}

export function computerPuzzleCard(game, difficulty) {
  const legal = puzzleCards(game);
  if (!legal.length) return null;
  if (difficulty === 'easy') return legal[0];

  // Prefer opening a continuation for cards that this player already holds.
  const hand = game.hands[game.turn];
  const priority = card => {
    const color = suit(card);
    const value = rank(card);
    const countInDirection = step => {
      let count = 0;
      for (let next = value + step; hand.some(other => suit(other) === color && rank(other) === next); next += step) count++;
      return count;
    };
    const below = value <= 8 ? countInDirection(-1) : 0;
    const above = value >= 8 ? countInDirection(1) : 0;
    return (below + above) * 20 + Math.abs(value - 8);
  };
  return legal.reduce((best, card) => priority(card) > priority(best) ? card : best);
}

import assert from 'node:assert/strict';
import { advance, computerCard, computerView, deal, play } from '../dist/engine.js';
import { decideComputerCard } from '../dist/deciders.js';

const samples = Number(process.argv[2] ?? 1000);
assert(Number.isSafeInteger(samples) && samples > 0, 'Podaj dodatnią liczbę rozdań');
const contracts = {
  'no-tricks': 26, 'no-hearts': 26, 'no-boys': 24,
  'no-ladies': 20, 'no-king-of-hearts': 16, 'no-six-and-last': 18
};

function randomSource(seed) {
  return () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 0x100000000;
  };
}

function playDeal(initial, mediumSeats, penalty) {
  const game = structuredClone(initial);
  while (game.phase !== 'done') {
    const view = computerView(game);
    const card = mediumSeats.includes(game.turn) ? decideComputerCard(view) : computerCard(view, view.legal);
    assert(play(game, card));
    if (game.phase === 'review') assert(advance(game));
  }
  assert.equal(game.points.reduce((sum, points) => sum + points, 0), -penalty);
  return -mediumSeats.reduce((sum, seat) => sum + game.points[seat], 0);
}

const assignments = [[0, 1], [0, 2], [0, 3], [1, 2], [1, 3], [2, 3]];
for (const [contract, penalty] of Object.entries(contracts)) {
  let medium = 0, wins = 0, draws = 0;
  for (let seed = 1; seed <= samples; seed++) {
    const initial = deal(contract, seed % 4, randomSource(seed + 7123));
    for (const seats of assignments) {
      const points = playDeal(initial, seats, penalty);
      medium += points;
      wins += Number(points < penalty / 2);
      draws += Number(points === penalty / 2);
    }
  }
  const games = samples * assignments.length;
  console.log(JSON.stringify({ contract, deals: samples, games,
    easyPenaltyPerPlayer: (penalty * games - medium) / (2 * games),
    mediumPenaltyPerPlayer: medium / (2 * games),
    mediumWins: wins, draws, easyWins: games - wins - draws }));
}

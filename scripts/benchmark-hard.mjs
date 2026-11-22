import assert from 'node:assert/strict';
import { advance, computerView, deal, play } from '../dist/engine.js';
import { decideComputerCard } from '../dist/deciders.js';
import { decideHardCard } from '../dist/hard-decider.js';

const deals = Number(process.argv[2] ?? 250);
assert(Number.isSafeInteger(deals) && deals > 0);
const durations = [];
let medium = 0, hard = 0, better = 0, tied = 0;

function playDeal(initial, hardSeat = -1) {
  const game = structuredClone(initial);
  while (game.phase !== 'done') {
    const view = computerView(game);
    let card;
    if (game.turn === hardSeat) {
      const start = performance.now();
      card = decideHardCard(view);
      durations.push(performance.now() - start);
    } else card = decideComputerCard(view);
    assert(play(game, card));
    if (game.phase === 'review') assert(advance(game));
  }
  return game.points.map(points => -points);
}

for (let n = 0; n < deals; n++) {
  let seed = n + 7123;
  const random = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 0x100000000;
  };
  const initial = deal('no-tricks', n % 4, random);
  const baseline = playDeal(initial);
  for (let seat = 0; seat < 4; seat++) {
    const result = playDeal(initial, seat)[seat];
    medium += baseline[seat];
    hard += result;
    better += Number(result < baseline[seat]);
    tied += Number(result === baseline[seat]);
  }
}
const games = deals * 4;
durations.sort((a, b) => a - b);
console.log(JSON.stringify({
  deals, games, mediumPenalty: medium / games, hardPenalty: hard / games,
  better, tied, worse: games - better - tied,
  decisions: durations.length, medianMs: durations[Math.floor(durations.length / 2)],
  p95Ms: durations[Math.floor(durations.length * .95)], maxMs: durations.at(-1)
}, null, 2));

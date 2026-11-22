import assert from 'node:assert/strict';
import { advance, computerTrump, computerView, deal, play, setTrump } from '../dist/engine.js';
import { decideComputerCard } from '../dist/deciders.js';
import { computerPuzzleCard, dealPuzzle, playPuzzle } from '../dist/puzzle.js';
import { decideHardCard, decideHardPuzzleCard, decideHardTrump } from '../dist/hard-decider.js';

const deals = Number(process.argv[2] ?? 250);
assert(Number.isSafeInteger(deals) && deals > 0);
const modes = ['no-tricks', 'no-hearts', 'no-boys', 'no-ladies', 'no-king-of-hearts', 'no-six-and-last', 'robber', 'recover', 'puzzle'];
const requested = process.argv[3] ?? 'no-tricks';
assert(requested === 'all' || modes.includes(requested));

function playDeal(initial, durations, hardSeat = -1) {
  const game = structuredClone(initial);
  while (game.phase !== 'done') {
    const hard = game.turn === hardSeat;
    const start = performance.now();
    if (game.mode === 'puzzle') {
      assert(playPuzzle(game, hard ? decideHardPuzzleCard(game) : computerPuzzleCard(game, 'medium')));
    } else if (game.phase === 'trump') {
      const cards = game.hands[game.turn].slice(0, 7);
      assert(setTrump(game, hard ? decideHardTrump(cards, game.turn) : computerTrump(cards)));
    } else {
      const view = computerView(game);
      assert(play(game, hard ? decideHardCard(view) : decideComputerCard(view)));
      if (game.phase === 'review') assert(advance(game));
    }
    if (hard) durations.push(performance.now() - start);
  }
  return game.points;
}

for (const mode of requested === 'all' ? modes : [requested]) {
  const durations = [];
  let medium = 0, hard = 0, better = 0, tied = 0;
  for (let n = 0; n < deals; n++) {
    let seed = n + 7123;
    const random = () => {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      return seed / 0x100000000;
    };
    const initial = (mode === 'puzzle' ? dealPuzzle(n % 4, random) : deal(mode, n % 4, random));
    const baseline = playDeal(initial, durations);
    for (let seat = 0; seat < 4; seat++) {
      const result = playDeal(initial, durations, seat)[seat];
      medium += baseline[seat];
      hard += result;
      better += Number(result > baseline[seat]);
      tied += Number(result === baseline[seat]);
    }
  }
  const games = deals * 4;
  durations.sort((a, b) => a - b);
  console.log(JSON.stringify({
    mode, deals, games, mediumScore: medium / games, hardScore: hard / games,
    better, tied, worse: games - better - tied, decisions: durations.length,
    p95Ms: durations[Math.floor(durations.length * .95)], maxMs: durations.at(-1)
  }));
}

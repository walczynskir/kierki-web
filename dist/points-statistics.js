export function pointsRecord(match, difficulty, points, outcome) {
  if (match.single) return null;
  const format = match.cycle ? 'cycle' : match.format === 'classic' ? 'classic' : 'robbers';
  return { outcome, variant: format + (match.includePuzzle ? '-with' : '-without'), difficulty, points };
}

export function completionOutcome(record) {
  return typeof record === 'string' ? record : record?.outcome;
}

export function validPointsRecord(record) {
  return record && typeof record === 'object' && (Object.keys(record).length === 4
      || (Object.keys(record).length === 5 && record.cycleTotal === true && typeof record.variant === 'string' && record.variant.startsWith('cycle-')))
    && ['classic-with', 'classic-without', 'robbers-with', 'robbers-without', 'cycle-with', 'cycle-without'].includes(record.variant)
    && ['easy', 'medium', 'hard'].includes(record.difficulty) && Number.isSafeInteger(record.points)
    && ['win', 'draw', 'completed-loss'].includes(record.outcome);
}

export function summarizePoints(entries) {
  const groups = new Map();
  for (const [, record] of entries) {
    if (!validPointsRecord(record)) continue;
    if (!groups.has(record.variant)) groups.set(record.variant, new Map());
    const levels = groups.get(record.variant);
    const group = levels.get(record.difficulty) ?? { count: 0, points: 0 };
    group.count++;
    group.points += record.points;
    levels.set(record.difficulty, group);
  }
  return groups;
}

export function completedMatchWeight(record) {
  if (!['win', 'draw', 'completed-loss'].includes(completionOutcome(record))) return 0;
  if (!validPointsRecord(record) || !record.variant.startsWith('cycle-')) return 1;
  return record.cycleTotal ? 0 : 4;
}

export function cyclePartRecords(match, difficulty, partTotals, finalTotals, outcomeFor) {
  const results = [...match.cycle.results, ...(partTotals ? [partTotals] : [])];
  const classic = { format: 'classic', includePuzzle: match.includePuzzle };
  const parts = results.map(totals => pointsRecord(classic, difficulty, totals[0], outcomeFor(totals)));
  const total = finalTotals ? { ...pointsRecord(match, difficulty, finalTotals[0], outcomeFor(finalTotals)), cycleTotal: true } : null;
  return { parts, total };
}

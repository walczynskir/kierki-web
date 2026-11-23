import { pointsRecord, completionOutcome, validPointsRecord, summarizePoints } from './points-statistics.js';
import { suits, suit, rank, setTrump, legalCards, play, advance, computerTrump, computerView, computerCard, dealFinished } from './engine.js?v=training-contracts-2';
import { decideComputerCard } from './deciders.js?v=no-queens-last-seat-1';
import { decideHardCard, decideHardPuzzleCard, decideHardTrump } from './hard-decider.js?v=2';
import { newMatch, legacyMatch, matchLength, matchMode, matchRecoveryPoints, matchScores, nextMatchDeal } from './match.js?v=classic-match-1';
import { computerPuzzleCard, playPuzzle, puzzleCards } from './puzzle.js';

import { direction, gameName, languages, rankLabel, translate } from './locale.js?v=35';

const seatNames = ['Ty', 'Zachód', 'Północ', 'Wschód'];
const suitNames = { '♣': 'Trefle', '♦': 'Kara', '♠': 'Piki', '♥': 'Kiery' };
const figureNames = { 11: 'Walet', 12: 'Dama', 13: 'Król', 14: 'As' };
const courtRanks = { 11: 'jack', 12: 'queen', 13: 'king' };
const courtSuits = { '♣': 'clubs', '♦': 'diamonds', '♠': 'spades', '♥': 'hearts' };
const $ = id => document.getElementById(id);
let match, game;
let timer;
const past = [];
const future = [];
const optionsKey = 'games-chest-kierki-options-v1';
const optionIds = ['show-scores', 'show-history', 'show-trick-history', 'lift-playable', 'large'];
const includesPuzzle = () => !$('include-puzzle').value.endsWith('without');
const selectedFormat = () => $('include-puzzle').value.startsWith('classic-') ? 'classic' : 'robbers';
const formatOption = preferences => (preferences?.['match-format'] === 'classic' ? 'classic-' : '')
  + (preferences?.['include-puzzle'] === false ? 'without' : 'with');
const difficulties = ['easy', 'medium', 'hard'];
const playPaces = {
  fast: { move: 280, pass: 1100 },
  normal: { move: 700, pass: 1700 },
  slow: { move: 1200, pass: 2400 }
};
const playPace = () => playPaces[$('play-pace').value];
let activeDifficulty = 'medium';
const gameKey = 'games-chest-kierki-game-v1';
const trainingKey = 'games-chest-kierki-training-v1';
const progressKey = 'games-chest-kierki-progress-v1';
const profileKey = 'games-chest-kierki-profile-v1';
const themes = {
  sage: 'Klasyczny', garden: 'Ogród', tropics: 'Tropiki', beach: 'Plaża', ukraine: 'Ukraina',
  'orange-grove': 'Pomarańczowy gaj', copper: 'Miedź i patynę', 'night-sky': 'Nocne niebo'
};
const rewards = { 'orange-grove': 3, copper: 5, 'night-sky': 10 };
let gameId = newId();
let started = false;
let suspendedMatch;
let scorecardOpen;
let trainingSaveFailed = false;
let results = {};
let unlockedThemes = [];
let optionsSaved = true;
let contrast = false;
let gameSaved = true;
const t = key => translate(key, $('language').value);

function newId() {
  return globalThis.crypto?.randomUUID?.() ?? Date.now() + '-' + Math.random().toString(36).slice(2);
}

function read(key) {
  try { return JSON.parse(localStorage.getItem(key)); } catch { return null; }
}

function write(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch { return false; }
}

const profile = read(profileKey);
const options = profile?.preferences ?? read(optionsKey);
for (const id of optionIds) $(id).checked = options?.[id] === true;
$('include-puzzle').value = formatOption(options);
$('language').value = languages.includes(options?.language) ? options.language : 'pl';
$('difficulty').value = difficulties.includes(options?.difficulty) ? options.difficulty : 'medium';
$('play-pace').value = Object.hasOwn(playPaces, options?.['play-pace']) ? options['play-pace'] : 'normal';
contrast = options?.contrast === true;
let theme = Object.hasOwn(themes, options?.theme) ? options.theme : 'sage';
results = profile?.progress?.results ?? read(progressKey) ?? {};
unlockedThemes = profile?.progress?.unlockedThemes ?? [];
const savedGame = read(gameKey);
const savedTraining = read(trainingKey);
const restoredTraining = savedTraining?.active ? savedTraining.session : !savedTraining && savedGame?.match?.single ? savedGame : null;
if (validSession(restoredTraining)) {
  suspendedMatch = validSession(savedGame) && !savedGame.match?.single ? savedGame : undefined;
  loadSession(restoredTraining);
} else if (validSession(savedGame) && !savedGame.match?.single) {
  loadSession(savedGame);
} else {
  ({ match, game } = newMatch(Math.random, includesPuzzle(), null, selectedFormat()));
  activeDifficulty = $('difficulty').value;
}

function validSession(session) {
  return session?.game?.hands?.length === 4 && typeof session.id === 'string';
}

function gameRecord() {
  return { game, match, started, id: gameId, difficulty: activeDifficulty, past, future, scorecardOpen };
}

function loadSession(session) {
  ({ game, started } = session);
  scorecardOpen = typeof session.scorecardOpen === 'boolean' ? session.scorecardOpen : undefined;
  $('trick-history').open = false;
  match = session.match ?? legacyMatch(game, session.robberPoints);
  gameId = session.id;
  activeDifficulty = difficulties.includes(session.difficulty) ? session.difficulty : 'medium';
  past.splice(0, past.length, ...(session.past ?? []));
  future.splice(0, future.length, ...(session.future ?? []));
}

function saveGame() {
  gameSaved = match.single
    ? write(trainingKey, { active: true, session: gameRecord() })
    : write(gameKey, gameRecord());
}

function freshSession(single = null) {
  return { ...newMatch(Math.random, includesPuzzle(), single, selectedFormat()), started: false, id: newId(),
    difficulty: $('difficulty').value, past: [], future: [] };
}

function currentPreferences() {
  const settings = Object.fromEntries(optionIds.map(id => [id, $(id).checked]));
  return { ...settings, contrast, theme, language: $('language').value,
    difficulty: $('difficulty').value, 'include-puzzle': includesPuzzle(), 'match-format': selectedFormat(), 'play-pace': $('play-pace').value };
}

function isCompleted(record) {
  const outcome = completionOutcome(record);
  // Old loss records also include abandoned matches.
  return outcome === 'win' || outcome === 'draw' || outcome === 'completed-loss';
}

function completedCount(records) {
  return Object.values(records).filter(isCompleted).length;
}

function earnedThemes(records, unlocked) {
  const completed = completedCount(records);
  return [...new Set([...unlocked, ...Object.keys(rewards).filter(id => completed >= rewards[id])])];
}

function mergeProgress(incoming = { results: {}, unlockedThemes: [] }) {
  const disk = read(profileKey)?.progress;
  const records = { ...incoming.results, ...results, ...disk?.results };
  for (const ledger of [incoming.results, results, disk?.results ?? {}]) {
    for (const [id, entry] of Object.entries(ledger)) {
      if (validPointsRecord(entry) && !validPointsRecord(records[id])) records[id] = entry;
    }
  }
  return { results: records, unlockedThemes: earnedThemes(records, [...unlockedThemes, ...(disk?.unlockedThemes ?? []), ...incoming.unlockedThemes]) };
}

function persistProfile(preferences, progress) {
  if (!write(profileKey, { preferences, progress })) return false;
  results = progress.results;
  unlockedThemes = progress.unlockedThemes;
  return true;
}

function record(outcome, points) {
  const progress = mergeProgress();
  if (isCompleted(progress.results[gameId])) {
    results = progress.results;
    unlockedThemes = progress.unlockedThemes;
    return;
  }
  progress.results[gameId] = pointsRecord(match, activeDifficulty, points, outcome);
  progress.unlockedThemes = earnedThemes(progress.results, progress.unlockedThemes);
  persistProfile(read(profileKey)?.preferences ?? currentPreferences(), progress);
}

const statisticsReset = createStatisticsReset('kierki-statistics-baseline-v1', '#progress-dialog',
  () => ({ ids: Object.keys(results) }), renderProgress);

function renderProgress() {
  const entries = statisticsReset.records(Object.entries(results).filter(([, outcome]) => isCompleted(outcome)));
  const completed = completedCount(results);
  const earned = earnedThemes(results, unlockedThemes);
  const next = Object.keys(rewards).find(id => !earned.includes(id));
  const reward = next && { name: t(themes[next]), count: completed, goal: rewards[next] };
  GamesChestProgressBar($('language').value, entries.length, reward,
    () => [[t('Ukończone partie'), entries.length]], true);
  if ($('progress-dialog').open) renderPoints(entries);
}

const pointsVariants = {
  'robbers-with': 'Rozbójniki z układanką', 'robbers-without': 'Rozbójniki bez układanki',
  'classic-with': 'Klasyczna z układanką', 'classic-without': 'Klasyczna bez układanki'
};
const pointsLevels = { easy: 'Łatwy', medium: 'Średni', hard: 'Trudny' };

function renderPoints(entries) {
  const groups = summarizePoints(entries);
  const cards = $('points-groups');
  cards.replaceChildren();
  const labels = ['Partie', 'Suma punktów', 'Średnia'].map(t);
  const numbers = new Intl.NumberFormat($('language').value, { maximumFractionDigits: 1 });
  for (const [variant, label] of Object.entries(pointsVariants)) {
    const levels = groups.get(variant);
    if (!levels) continue;
    const card = document.createElement('section');
    card.className = 'points-variant';
    const title = document.createElement('h4');
    title.textContent = t(label);
    card.append(title);
    for (const [level, label] of Object.entries(pointsLevels)) {
      const group = levels.get(level);
      if (!group) continue;
      const row = document.createElement('div');
      row.className = 'points-level';
      const name = document.createElement('h5');
      name.textContent = t(label);
      const metrics = document.createElement('dl');
      [group.count, group.points, group.points / group.count].forEach((value, index) => {
        const metric = document.createElement('div');
        const term = document.createElement('dt');
        const number = document.createElement('dd');
        term.textContent = labels[index];
        number.textContent = numbers.format(value);
        metric.append(term, number);
        metrics.append(metric);
      });
      row.append(name, metrics);
      card.append(row);
    }
    cards.append(card);
  }
  $('points-title').textContent = t('Punktacja partii');
  $('points-empty').textContent = t('Brak ukończonych partii z zapisaną punktacją.');
  $('points-empty').hidden = groups.size > 0;
  cards.hidden = groups.size === 0;
  $('points-legacy').textContent = t('Starsze wyniki bez punktacji liczą się tylko do ukończonych partii.');
  $('points-legacy').hidden = !entries.some(([, record]) => !validPointsRecord(record));
}

$('my-progress').addEventListener('click', () => queueMicrotask(() => renderProgress()));

let shellState;
function renderShell() {
  const root = document.documentElement;
  const language = $('language').value;
  if (root.lang !== language) root.lang = language;
  const layoutDirection = direction(language);
  if (root.dir !== layoutDirection) root.dir = layoutDirection;
  const name = gameName(language);
  $('game-name').textContent = name;
  document.title = name === 'Kierki' ? name : name + ' · Kierki';
  $('credits-link').href = './credits.html?lang=' + encodeURIComponent(language);
  $('save-note').textContent = gameSaved ? '' : t('Nie udało się zapisać partii.');
  const completed = completedCount(results);
  const earned = earnedThemes(results, unlockedThemes);
  const available = id => !Object.hasOwn(rewards, id) || earned.includes(id);
  $('settings-save-error').hidden = optionsSaved;
  renderProgress();
  renderBackup();
  if (!available(theme)) theme = 'sage';
  const state = JSON.stringify([root.lang, completed, earned, theme, contrast, $('large').checked, $('game-area').classList.contains('game-fullscreen')]);
  if (shellState === state) return;
  shellState = state;
  const palette = { garden: 'sage', 'orange-grove': 'tangerine' }[theme] ?? theme;
  root.dataset.theme = contrast ? 'contrast' : palette;
  root.dataset.scenery = contrast ? '' : theme;
  root.classList.toggle('larger', $('large').checked);
  $('contrast').setAttribute('aria-pressed', String(contrast));
  $('contrast').textContent = '◐ ' + t('Kontrast');
  for (const [id, label] of Object.entries({
    contrast: 'Wysoki kontrast', large: 'Większy tekst', language: 'Język', theme: 'Motyw', table: 'Stół',
    'open-options': 'Ustawienia', 'help-button': 'Jak grać', undo: 'Cofnij', redo: 'Przywróć', 'new-game': 'Nowa gra',
    'training-format': 'Rozdanie treningowe'
  })) {
    $(id).setAttribute('aria-label', t(label));
    if ($(id).hasAttribute('title')) $(id).title = t(label);
  }
  for (const [selector, label] of [['.game-toolbar', 'Sterowanie grą'], ['.game', 'Rozgrywka'], ['#options form button', 'Zamknij'], ['#help form button', 'Zamknij'], ['#theme-gallery form button', 'Zamknij']]) {
    document.querySelector(selector).setAttribute('aria-label', t(label));
  }
  for (const element of document.querySelectorAll('[data-t]')) element.textContent = t(element.dataset.t);
  for (const info of $('options').querySelectorAll('.setting-info')) {
    info.setAttribute('aria-label', t('Informacje o ustawieniu') + ': ' + info.parentElement.querySelector('label [data-t]').textContent);
  }
  const featured = ['sage', 'garden', 'tropics', 'beach'];
  if (!featured.includes(theme)) featured.push(theme);
  $('theme').replaceChildren(...featured.map(id => new Option(t(themes[id]), id)), new Option(t('Więcej motywów…'), 'gallery'));
  $('theme').value = theme;
  const full = $('game-area').classList.contains('game-fullscreen');
  const fullscreenLabel = t(full ? 'Wyjdź z pełnego ekranu' : 'Pełny ekran');
  $('fullscreen').setAttribute('aria-pressed', String(full));
  $('fullscreen').setAttribute('aria-label', fullscreenLabel);
  $('fullscreen').querySelector('.toolbar-label').textContent = fullscreenLabel;
  function themeTile(id) {
    const goal = rewards[id];
    const unlocked = available(id);
    const tile = button(t(themes[id]), () => {
      theme = id;
      $('theme-gallery').close();
      saveOptions();
    });
    tile.disabled = !unlocked;
    tile.setAttribute('aria-pressed', String(theme === id));
    tile.classList.add('reward-tile');
    const preview = document.createElement('span');
    preview.className = 'theme-preview';
    preview.dataset.scenery = id;
    preview.dataset.theme = id;
    preview.setAttribute('aria-hidden', 'true');
    for (const [index, card] of [51, 23, 30, 43].entries()) {
      const sample = face(document.createElement('span'), card);
      sample.dataset.position = ['south', 'west', 'north', 'east'][index];
      sample.classList.add('played');
      preview.append(sample);
    }
    tile.prepend(preview);
    if (goal) {
      const progress = document.createElement('small');
      progress.textContent = unlocked ? t('Odblokowany') : t('Ukończone partie') + ' ' + completed + '/' + goal;
      tile.append(progress);
    }
    return tile;
  }
  $('gallery-themes').replaceChildren(...Object.keys(themes).filter(id => !Object.hasOwn(rewards, id)).map(id => themeTile(id)));
  $('gallery-rewards').replaceChildren(...Object.keys(rewards).map(id => themeTile(id)));
}

const snapshot = () => structuredClone({ game, match });

function humanMove(move) {
  const before = snapshot();
  if (!move()) return;
  past.push(before);
  future.length = 0;
  update(() => {});
}

function chooseTrump(color) {
  humanMove(() => setTrump(game, color));
  $('hand').querySelector('button:enabled')?.focus({ preventScroll: true });
}

function restoreHistory(from, to) {
  if (!from.length) return;
  to.push(snapshot());
  const previous = from.pop();
  const wasDone = game.phase === 'done';
  game = previous.game;
  const previousMatch = previous.match ?? legacyMatch(game, previous.robberPoints);
  if (match.number !== previousMatch.number || wasDone !== (game.phase === 'done')) scorecardOpen = undefined;
  match = previousMatch;
  saveGame();
  render();
  if (game.phase === 'play') {
    const current = document.activeElement;
    if (current !== $('undo') && current !== $('redo') || current.disabled) $('hand').querySelector('button:enabled')?.focus();
  }
}

function button(text, handler, primary = false) {
  const control = document.createElement('button');
  control.type = 'button';
  control.textContent = text;
  if (primary) control.className = 'primary';
  control.onclick = handler;
  return control;
}

function face(element, card) {
  const color = suit(card);
  const value = rank(card);
  element.classList.add('card');
  element.classList.toggle('red', color === '♥' || color === '♦');
  const number = document.createElement('span');
  number.className = 'card-rank';
  number.textContent = rankLabel(value, $('language').value);
  const symbol = document.createElement('span');
  symbol.className = 'card-suit';
  symbol.textContent = color;
  element.replaceChildren(number, symbol);
  if (courtRanks[value]) {
    const portrait = document.createElement('span');
    portrait.className = 'court-portrait';
    portrait.setAttribute('aria-hidden', 'true');
    const illustration = document.createElement('img');
    illustration.src = './court/' + courtRanks[value] + '-' + courtSuits[color] + '.svg?v=portrait-1';
    illustration.alt = '';
    illustration.draggable = false;
    portrait.append(illustration);
    element.append(portrait);
  }
  element.setAttribute('aria-label', (figureNames[value] ? t(figureNames[value]) : value) + ', ' + t(suitNames[color]));
  return element;
}

function renderTrickHistory() {
  const history = $('trick-history-list');
  const currentDeal = { number: match.number, mode: game.mode, tricks: game.tricks };
  const deals = [...(match.dealHistory ?? []), currentDeal];
  history.replaceChildren();
  for (const deal of deals.reverse()) {
    const section = document.createElement('section');
    const heading = document.createElement('h3');
    heading.textContent = t('Rozdanie') + ' ' + deal.number + ' · ' + t(dealTitle(deal.mode));
    const list = document.createElement('ol');
    const tricks = deal.tricks.flatMap((trick, index) => trick.cards?.length === 4 ? [{ trick, number: index + 1 }] : []);
    for (const { trick, number } of tricks.reverse()) {
      const row = document.createElement('li');
      const summary = document.createElement('p');
      summary.textContent = t('Lewa') + ' ' + number + ' · ' + t('Lewę bierze') + ' ' + t(seatNames[trick.taker]);
      const cards = document.createElement('ul');
      cards.className = 'history-trick-cards';
      for (const { player, card } of trick.cards) {
        const item = document.createElement('li');
        const name = document.createElement('span');
        name.textContent = t(seatNames[player]);
        const played = face(document.createElement('span'), card);
        played.setAttribute('role', 'img');
        item.classList.toggle('took-trick', player === trick.taker);
        item.append(name, played);
        cards.append(item);
      }
      row.append(summary, cards);
      list.append(row);
    }
    if (!list.childElementCount) continue;
    section.append(heading, list);
    history.append(section);
  }
  $('trick-history-empty').hidden = history.childElementCount !== 0;
}

function update(move) {
  move();
  if (game.tricks.length || game.trick.length || game.lastMove) started = true;
  saveGame();
  render();
  if (game.phase === 'review') $('next-trick').focus({ preventScroll: true });
  if (game.phase === 'done') $('actions').querySelector('button')?.focus({ preventScroll: true });
}

function updateResultsToggle() {
  const toggle = $('toggle-results');
  if (!toggle) return;
  const open = $('scorecard').open;
  toggle.textContent = t(open ? 'Schowaj wyniki' : 'Pokaż wyniki');
  toggle.setAttribute('aria-expanded', String(open));
}

function handFan(player, orderedHand, angle = 2.5) {
  const cardsLeft = game.hands[player].length;
  if (player === 0 && orderedHand.length) {
    const faces = document.createElement('span');
    faces.className = 'table-hand';
    faces.setAttribute('aria-hidden', 'true');
    faces.append(...orderedHand.map((card, index) => {
      const front = face(document.createElement('span'), card);
      front.style.setProperty('--angle', (index - (orderedHand.length - 1) / 2) * angle + 'deg');
      return front;
    }));
    return faces;
  } else if (player !== 0 && cardsLeft) {
    const backs = document.createElement('span');
    backs.className = 'opponent-hand';
    backs.setAttribute('role', 'img');
    backs.setAttribute('aria-label', t('Karty w ręce') + ': ' + cardsLeft);
    const visible = cardsLeft;
    for (let index = 0; index < visible; index++) {
      const back = document.createElement('i');
      back.style.setProperty('--angle', (index - (visible - 1) / 2) * angle + 'deg');
      backs.append(back);
    }
    return backs;
  }
}

const puzzlePipPositions = {
  2: [2, 14],
  3: [2, 8, 14],
  4: [1, 3, 13, 15],
  5: [1, 3, 8, 13, 15],
  6: [1, 3, 7, 9, 13, 15],
  7: [1, 3, 5, 7, 9, 13, 15],
  8: [1, 3, 5, 7, 9, 11, 13, 15],
  9: [1, 3, 4, 6, 8, 10, 12, 13, 15],
  10: [1, 3, 4, 5, 6, 10, 11, 12, 13, 15],
  14: [8]
};

function renderPuzzleTable(names, legal, orderedHand) {
  const seats = [];
  const positions = ['south', 'west', 'north', 'east'];
  for (const [player, name] of names.entries()) {
    const seat = document.createElement('div');
    seat.className = 'puzzle-player';
    seat.classList.toggle('puzzle-result', game.phase === 'done');
    seat.dataset.position = positions[player];
    seat.classList.toggle('current', game.phase === 'play' && game.turn === player);
    const place = game.finishOrder.indexOf(player) + 1;
    const title = document.createElement('strong');
    title.textContent = name;
    const info = document.createElement('span');
    const passed = game.lastMove?.player === player && game.lastMove.card === null;
    info.classList.toggle('puzzle-pass-badge', passed);
    info.textContent = passed ? t('Pas') : place ? place + '. ' + t('miejsce') : game.hands[player].length + ' ' + t('kart');
    const handSlot = document.createElement('div');
    handSlot.className = 'puzzle-hand-slot';
    const fan = handFan(player, orderedHand, 1.6);
    if (fan) handSlot.append(fan);
    const caption = document.createElement('div');
    caption.className = 'puzzle-player-caption';
    caption.append(title, info);
    seat.append(caption, handSlot);
    seats.push(seat);
  }

  const columns = document.createElement('div');
  columns.className = 'puzzle-columns';
  const language = $('language').value;
  for (const [suitIndex, color] of suits.entries()) {
    const column = document.createElement('div');
    column.className = 'puzzle-column';
    column.setAttribute('role', 'group');
    column.setAttribute('aria-label', t(suitNames[color]));
    const range = game.rows[color];
    for (let value = 14; value >= 2; value--) {
      const slot = document.createElement('span');
      const card = suitIndex * 13 + value - 2;
      const placed = range && range.low <= value && value <= range.high;
      const available = legal.includes(card);
      slot.className = 'puzzle-slot';
      slot.style.gridRow = String(15 - value);
      if (placed) {
        face(slot, card);
        slot.classList.add('filled');
        const oppositeCorner = document.createElement('span');
        oppositeCorner.className = 'puzzle-opposite-corner';
        oppositeCorner.setAttribute('aria-hidden', 'true');
        oppositeCorner.textContent = rankLabel(value, language) + ' ' + color;
        slot.append(oppositeCorner);
        const pipPositions = puzzlePipPositions[value];
        if (pipPositions) {
          const pips = document.createElement('span');
          pips.className = 'puzzle-pips';
          pips.classList.toggle('ace', value === 14);
          pips.setAttribute('aria-hidden', 'true');
          for (const position of pipPositions) {
            const pip = document.createElement('span');
            pip.style.gridArea = (Math.floor((position - 1) / 3) + 1) + ' / ' + ((position - 1) % 3 + 1);
            pip.textContent = color;
            pips.append(pip);
          }
          slot.append(pips);
        }
        slot.classList.toggle('origin', value === 8);
        if (value > 8) slot.style.zIndex = String(value);
      } else if (available || value === 8 && !range) {
        slot.classList.toggle('available', available);
        slot.classList.toggle('origin', value === 8);
        slot.textContent = rankLabel(value, language) + ' ' + color;
        if (!available) slot.setAttribute('aria-hidden', 'true');
      } else {
        continue;
      }
      column.append(slot);
    }
    columns.append(column);
  }
  $('table').replaceChildren(...seats, columns);
}

const trainingContracts = {
  'no-tricks': ['Nie brać lew', 'Za każdą wziętą lewę: −2 pkt.'],
  'no-hearts': ['Nie brać kierów', 'Za każdego wziętego kiera: −2 pkt.'],
  'no-boys': ['Nie brać chłopców', 'Za każdego wziętego króla lub waleta: −3 pkt.'],
  'no-ladies': ['Nie brać dam', 'Za każdą wziętą damę: −5 pkt.'],
  'no-king-of-hearts': ['Nie brać króla kier', 'Za wzięcie króla kier: −16 pkt. Gdy nie masz koloru, musisz go zagrać.'],
  'no-six-and-last': ['Nie brać szóstej i ostatniej lewy', 'Za wzięcie szóstej lub ostatniej lewy: −9 pkt.']
};

function dealTitle(mode) {
  return trainingContracts[mode]?.[0] ?? { puzzle: 'Układanka', robber: 'Rozbójnik', recover: 'Odgrywka' }[mode];
}

function render() {
  clearTimeout(timer);
  const puzzle = game.mode === 'puzzle';
  const robber = game.mode === 'robber';
  const contract = trainingContracts[game.mode];
  const choosingTrump = game.phase === 'trump' && game.leader === 0;
  $('no-trump').hidden = !choosingTrump;
  const names = seatNames.map(t);
  const lastDeal = match.number === matchLength(match);
  const scores = matchScores(match, game);
  const totals = scores.negative.map((score, player) => score + scores.positive[player] + scores.puzzle[player]);
  const winners = names.filter((_, player) => totals[player] === Math.max(...totals));
  const won = winners.length === 1 && winners[0] === names[0];
  if (!match.single && lastDeal && game.phase === 'done') {
    record(winners.length > 1 ? 'draw' : won ? 'win' : 'completed-loss', totals[0]);
  }
  const showScores = $('show-scores').checked;
  const showHistory = $('show-history').checked;
  const trickHistory = $('trick-history');
  trickHistory.hidden = !$('show-trick-history').checked;
  if (trickHistory.hidden) trickHistory.open = false;
  $('undo').hidden = $('redo').hidden = !showHistory;
  $('undo').disabled = !past.length;
  $('redo').disabled = !future.length;
  const scorecard = $('scorecard');
  renderScorecard();
  const actions = $('actions');
  actions.replaceChildren();
  const legal = game.turn === 0 ? (puzzle ? puzzleCards(game) : legalCards(game)) : [];
  $('next-trick').hidden = game.phase !== 'review';
  const cue = $('play-card-cue');
  cue.hidden = !choosingTrump && (game.phase !== 'play' || game.turn !== 0 || puzzle && !legal.length);
  cue.textContent = t(choosingTrump ? 'Dotknij karty pod stołem, by wybrać atu' : puzzle ? 'Dołóż kartę' : 'Zagraj kartę');
  $('round').textContent = (match.single ? t('Trening') : match.number + ' / ' + matchLength(match))
    + ' · ' + t(dealTitle(game.mode));
  $('contract-rule').hidden = !contract;
  $('contract-rule').textContent = contract ? t(contract[1]) : '';
  $('resume-match').hidden = !match.single;
  $('training-save-error').hidden = !trainingSaveFailed;
  $('dealer').textContent = t('Rozdaje') + ': ' + names[match.dealer];
  const trumpLabel = $('trump');
  const showTrump = game.mode === 'recover' && game.phase !== 'trump' && game.tricks.length < 13;
  trumpLabel.textContent = showTrump ? game.trump ? t('Atut') + ' ' : t('Bez atu') : '';
  if (showTrump && game.trump) {
    const symbol = document.createElement('span');
    symbol.className = 'trump-suit';
    symbol.classList.toggle('red', game.trump === '♥' || game.trump === '♦');
    symbol.textContent = game.trump;
    trumpLabel.append(symbol);
  }
  $('status').classList.toggle('puzzle-live-status', puzzle && game.phase === 'play');
  if (puzzle && game.phase === 'play') {
    const passed = game.lastMove?.card === null ? t('Pas') + ': ' + names[game.lastMove.player] + ' · ' : '';
    $('status').textContent = passed + (game.turn === 0
      ? t(legal.length ? 'Twój ruch' : 'Nie masz pasującej karty. Pasujesz automatycznie.')
      : t('Gra') + ' ' + names[game.turn]);
    if (game.turn !== 0 || !legal.length) {
      timer = setTimeout(() => {
        const card = game.turn === 0 ? null : activeDifficulty === 'hard' ? decideHardPuzzleCard(game)
          : computerPuzzleCard(game, activeDifficulty);
        update(() => playPuzzle(game, card));
      }, game.lastMove?.card === null ? playPace().pass : playPace().move);
    }
  } else if (game.phase === 'trump') {
    $('status').textContent = t(choosingTrump ? 'Wybór atu' : 'Komputer wybiera atu.');
    if (!choosingTrump) {
      timer = setTimeout(() => {
        const cards = game.hands[game.leader].slice(0, 7);
        const trump = activeDifficulty === 'hard' ? decideHardTrump(cards, game.leader) : computerTrump(cards);
        update(() => setTrump(game, trump));
      }, 350);
    }
  } else if (game.phase === 'review') {
    const { taker, points } = game.tricks.at(-1);
    $('status').textContent = (taker === 0 ? t('Bierzesz lewę') : t('Lewę bierze') + ' ' + names[taker])
      + (showScores && points !== 0 ? ' · ' + (points > 0 ? '+' : '−') + Math.abs(points) + ' ' + t('pkt') : '');
    $('next-trick').firstElementChild.textContent = t(dealFinished(game)
      ? 'Dotknij stołu, by zobaczyć wynik rozdania' : 'Dotknij stołu, by zagrać następną lewę');
  } else if (game.phase === 'done') {
    if (!lastDeal) {
      $('status').textContent = t('Rozdanie zakończone.');
      const nextMode = matchMode(match, match.number + 1);
      const nextTitle = nextMode === 'recover' && game.mode !== 'recover' ? 'Rozpocznij odgrywkę'
        : nextMode === 'puzzle' ? 'Rozpocznij układankę' : 'Następne rozdanie';
      actions.append(button(t(nextTitle), () => {
        ({ match, game } = nextMatchDeal(match, game));
        scorecardOpen = undefined;
        saveGame();
        render();
        actions.firstElementChild?.focus();
      }, true));
    } else {
      $('status').textContent = winners.length > 1 ? t('Remis') + ': ' + winners.join(', ') : won ? t('Wygrywasz!') : t('Wygrywa') + ': ' + winners[0];
      window.GameVictory?.(won, t('Wygrywasz!'), $('table'));
      if (match.single) actions.append(button(t('Zagraj ponownie'), () => start(match.single), true));
    }
    const resultsToggle = button('', () => {
      setScorecardOpen(!scorecard.open);
      if (scorecard.open) scorecard.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    });
    resultsToggle.id = 'toggle-results';
    resultsToggle.setAttribute('aria-controls', 'scorecard');
    actions.append(resultsToggle);
    updateResultsToggle();
  } else {
    const number = game.tricks.length + 1;
    $('status').textContent = t('Lewa') + ' ' + number + ' / 13 · ' + (game.turn === 0 ? t('Twój ruch') : t('Gra') + ' ' + names[game.turn]);
    if (game.turn !== 0) timer = setTimeout(() => {
      const view = computerView(game);
      const card = activeDifficulty === 'easy' ? computerCard(view, view.legal)
        : activeDifficulty === 'hard' ? decideHardCard(view)
        : decideComputerCard(view);
      update(() => play(game, card));
    }, playPace().move);
  }

  if (!lastDeal || game.phase !== 'done') window.GameVictory?.(false);
  renderShell();
  if (trickHistory.open) renderTrickHistory();
  $('help-recovery').textContent = t('W odgrywce każda').replace('{points}', String(matchRecoveryPoints(match)));
  const result = game.phase === 'review' ? game.tricks.at(-1) : null;
  const hand = choosingTrump ? game.hands[0].slice(0, 7) : game.hands[0];
  const orderedHand = [...hand].sort((a, b) => a - b);
  $('table').classList.toggle('table-with-scores', showScores);
  $('table').classList.toggle('puzzle-table', puzzle);
  if (puzzle) renderPuzzleTable(names, legal, orderedHand);
  else $('table').replaceChildren(...names.flatMap((name, player) => {
    const seat = document.createElement('section');
    const position = ['south', 'west', 'north', 'east'][player];
    seat.className = 'seat';
    seat.dataset.position = position;
    seat.classList.toggle('current', game.phase === 'play' && player === game.turn);
    seat.classList.toggle('winner', result?.taker === player);
    const heading = document.createElement('strong');
    heading.textContent = name;
    const signedPoints = result?.points > 0 ? '+' + result.points : '−' + Math.abs(result?.points ?? 0);
    const tricksWon = game.tricks.filter(trick => trick.taker === player).length;
    const count = document.createElement('span');
    count.className = 'trick-stack';
    count.classList.toggle('stack-empty', tricksWon === 0);
    count.style.setProperty('--stack-offsets', Math.max(0, tricksWon - 1));
    count.setAttribute('aria-label', name + ' · ' + t('Liczba wziętych lew') + ': ' + tricksWon);
    count.setAttribute('role', 'img');
    for (let index = 0; index < tricksWon; index++) {
      const back = document.createElement('i');
      back.style.setProperty('--layer', index);
      count.append(back);
    }
    const badge = document.createElement('b');
    badge.textContent = tricksWon;
    count.append(badge);
    const seatCards = document.createElement('div');
    seatCards.className = 'seat-cards';
    const handSlot = document.createElement('div');
    handSlot.className = 'seat-hand-slot';
    seatCards.append(handSlot, count);
    const seatName = document.createElement('div');
    seatName.className = 'seat-name';
    seatName.append(heading);
    seat.append(seatName, seatCards);
    const fan = handFan(player, orderedHand);
    if (fan) handSlot.append(fan);
    if (showScores && result?.taker === player) {
      const score = document.createElement('span');
      score.className = 'trick-points';
      score.textContent = signedPoints + ' ' + t('pkt');
      seatName.append(score);
    }
    const entry = game.trick.find(item => item.player === player);
    if (!entry) return [seat];
    const card = face(document.createElement('span'), entry.card);
    card.classList.add('played');
    card.classList.toggle('winning-card', result?.taker === player);
    card.dataset.position = position;
    card.setAttribute('role', 'img');
    card.setAttribute('aria-label', name + ': ' + card.getAttribute('aria-label'));
    if (result?.taker === player) {
      const mark = document.createElement('span');
      mark.className = 'trick-mark';
      mark.textContent = '✓';
      mark.setAttribute('aria-hidden', 'true');
      card.append(mark);
    }
    return [seat, card];
  }));

  $('hand').classList.toggle('empty-hand', !hand.length);
  $('hand').classList.toggle('lift-playable', $('lift-playable').checked);
  $('hand').style.setProperty('--gaps', Math.max(1, hand.length - 1));
  $('hand').replaceChildren(...orderedHand.map((card, index) => {
    const control = face(button('', () => {
      if (choosingTrump) chooseTrump(suit(card));
      else humanMove(() => puzzle ? playPuzzle(game, card) : play(game, card));
    }), card);
    const offset = (index - (hand.length - 1) / 2) / Math.max(1, (hand.length - 1) / 2);
    control.style.setProperty('--drop', 9 * offset ** 2 + 'px');
    control.disabled = !choosingTrump && !legal.includes(card);
    if (choosingTrump) control.setAttribute('aria-label',
      t('Wybierz atu') + ': ' + control.getAttribute('aria-label'));
    return control;
  }));
  $('hand-title').textContent = choosingTrump ? t('Pierwsze siedem kart') : t('Twoje karty');
  const showRobberScores = !match.single || robber;
  const showRecoveryScores = !match.single || game.mode === 'recover';
  const showPuzzleScores = match.single ? puzzle : match.includePuzzle;
  $('robber-score-heading').hidden = !showRobberScores;
  $('robber-score-heading').textContent = t(match.format === 'classic' && !match.single ? 'Punkty karne' : 'Rozbójnik');
  $('recovery-score-heading').hidden = !showRecoveryScores;
  $('puzzle-score-heading').hidden = !showPuzzleScores;
  $('scores').replaceChildren(...names.map((name, player) => {
    const row = document.createElement('tr');
    const heading = document.createElement('th');
    heading.scope = 'row';
    heading.textContent = name;
    row.append(heading);
    const negative = scores.negative[player];
    const positive = scores.positive[player];
    const columns = [];
    if (showRobberScores) columns.push(negative);
    if (showRecoveryScores) columns.push((robber || contract) && positive === 0 ? '—' : positive);
    if (showPuzzleScores) columns.push(puzzle ? scores.puzzle[player] : '—');
    columns.push(totals[player]);
    for (const score of columns) {
      const cell = row.insertCell();
      cell.textContent = score > 0 ? '+' + score : score;
    }
    return row;
  }));
}

function start(single = null) {
  loadSession(freshSession(single));
  saveGame();
  render();
}

$('new-game').onclick = () => {
  const finished = game.phase === 'done' && match.number === matchLength(match);
  if (!started || finished) return start(match.single);
  const warning = $('restart-warning');
  warning.dataset.t = match.single ? 'Rozpocząć trening od nowa?' : 'Rozpocząć nową partię i zakończyć obecną bez zaliczenia?';
  warning.textContent = t(warning.dataset.t);
  $('restart').returnValue = '';
  $('restart').showModal();
};
$('trick-history').addEventListener('toggle', event => {
  if (event.currentTarget.open) renderTrickHistory();
});
$('no-trump').onclick = () => chooseTrump(null);
$('help-button').onclick = () => $('help').showModal();
$('next-trick').onclick = () => {
  update(() => advance(game));
  if (game.phase === 'play' && game.turn === 0) $('hand').querySelector('button:enabled')?.focus({ preventScroll: true });
};
function shouldOpenScorecard() {
  return scorecardOpen ?? ($('show-scores').checked || game.phase === 'done');
}
function renderScorecard() {
  const card = $('scorecard');
  const done = game.phase === 'done';
  const open = shouldOpenScorecard();
  card.hidden = done ? !open : !$('show-scores').checked;
  card.open = !card.hidden && open;
}
function setScorecardOpen(open) {
  scorecardOpen = open;
  renderScorecard();
  updateResultsToggle();
  saveGame();
}
$('scorecard').addEventListener('toggle', event => {
  const card = event.currentTarget;
  if (!card.hidden && card.open !== shouldOpenScorecard()) setScorecardOpen(card.open);
});
function setFullscreen(full) {
  $('game-area').classList.toggle('game-fullscreen', full);
  renderShell();
}
$('fullscreen').onclick = async () => {
  if (document.fullscreenElement === document.documentElement) {
    await document.exitFullscreen();
    return;
  }
  const full = !$('game-area').classList.contains('game-fullscreen');
  const installed = matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
  if (full && !installed && document.fullscreenEnabled) {
    try {
      await document.documentElement.requestFullscreen({ navigationUI: 'hide' });
      return;
    } catch {
      // Use the in-page layout when the browser denies fullscreen.
    }
  }
  setFullscreen(full);
};
document.addEventListener('fullscreenchange', event => {
  if (event.target === document.documentElement) {
    setFullscreen(document.fullscreenElement === document.documentElement);
  }
});
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && !document.fullscreenElement && !document.querySelector('dialog[open]')) {
    setFullscreen(false);
  }
});
$('open-options').onclick = () => $('options').showModal();
$('start-training').onclick = () => {
  const session = freshSession($('training-format').value);
  if (!match.single) suspendedMatch = structuredClone(gameRecord());
  if (!write(trainingKey, { active: true, session })) {
    trainingSaveFailed = true;
    render();
    return;
  }
  loadSession(session);
  trainingSaveFailed = false;
  gameSaved = true;
  $('options').close();
  render();
};
$('resume-match').onclick = () => {
  if (!match.single) return;
  const session = suspendedMatch ?? freshSession();
  if (!write(gameKey, session) || !write(trainingKey, { active: false })) {
    trainingSaveFailed = true;
    render();
    return;
  }
  loadSession(session);
  suspendedMatch = undefined;
  trainingSaveFailed = false;
  gameSaved = true;
  $('options').close();
  render();
};
$('options').addEventListener('close', () => $('open-options').focus());
for (const info of $('options').querySelectorAll('.setting-info')) info.onclick = () => {
  const note = $(info.getAttribute('aria-controls'));
  note.hidden = !note.hidden;
  info.setAttribute('aria-expanded', String(!note.hidden));
};
$('undo').onclick = () => restoreHistory(past, future);
$('redo').onclick = () => restoreHistory(future, past);
function saveOptions() {
  optionsSaved = persistProfile(currentPreferences(), mergeProgress());
  render();
}
$('settings-save-retry').onclick = saveOptions;

const previousBackupOptions = {
  'show-scores': value => typeof value === 'boolean',
  'show-history': value => typeof value === 'boolean'
};
const difficultyBackupOptions = {
  ...previousBackupOptions,
  difficulty: value => difficulties.includes(value)
};
const puzzleBackupOptions = {
  ...difficultyBackupOptions,
  'include-puzzle': value => typeof value === 'boolean'
};
const paceBackupOptions = {
  ...puzzleBackupOptions,
  'play-pace': value => Object.hasOwn(playPaces, value)
};
const liftBackupOptions = {
  ...paceBackupOptions,
  'lift-playable': value => typeof value === 'boolean'
};
const legacyBackupOptions = {
  ...liftBackupOptions,
  'show-trick-history': value => typeof value === 'boolean'
};
const backupSchema = {
  game: 'kierki',
  languages,
  options: {
    ...legacyBackupOptions,
    'match-format': value => ['robbers', 'classic'].includes(value)
  },
  validProgress(progress) {
    if (!progress || Object.keys(progress).length !== 2 || !Object.hasOwn(progress, 'results')
      || !Array.isArray(progress.unlockedThemes) || new Set(progress.unlockedThemes).size !== progress.unlockedThemes.length
      || !progress.unlockedThemes.every(id => Object.hasOwn(rewards, id))) return false;
    const records = progress.results;
    return records && typeof records === 'object' && !Array.isArray(records)
      && Object.entries(records).every(([id, outcome]) => id.length > 0 && id.length <= 200 && (typeof outcome === 'string' ? outcome === 'loss' || isCompleted(outcome) : validPointsRecord(outcome)));
  }
};
function parseBackup(text) {
  const optionSchemas = [backupSchema.options, legacyBackupOptions, liftBackupOptions, paceBackupOptions, puzzleBackupOptions, difficultyBackupOptions, previousBackupOptions];
  for (const options of optionSchemas) {
    try {
      const candidate = GamesChestBackup.parse(text, { ...backupSchema, options });
      candidate.preferences.difficulty ??= $('difficulty').value;
      candidate.preferences['include-puzzle'] ??= includesPuzzle();
      candidate.preferences['match-format'] ??= 'robbers';
      candidate.preferences['play-pace'] ??= $('play-pace').value;
      candidate.preferences['lift-playable'] ??= $('lift-playable').checked;
      candidate.preferences['show-trick-history'] ??= $('show-trick-history').checked;
      return candidate;
    } catch (error) {
      if (error.code !== 'invalid' || options === previousBackupOptions) throw error;
    }
  }
}
let backupNotice;
let pendingBackup;
let importGeneration = 0;
const transferCopy = () => progressTransferStrings[$('language').value] ?? progressTransferStrings.en;
const transferErrors = () => preferencesTransferStrings[$('language').value] ?? preferencesTransferStrings.en;
const errorLabels = { locked: 6, unavailable: 7, invalid: 8, game: 9, version: 10, read: 11, write: 12, export: 13 };

function renderBackup() {
  const copy = transferCopy();
  $('preferences-file-heading').textContent = copy[0];
  $('export-preferences').textContent = copy[1];
  $('import-preferences').textContent = copy[2];
  $('preferences-status').textContent = (backupNotice ?? []).map(code => code === 'success'
    ? copy[4] : transferErrors()[errorLabels[code] ?? errorLabels.invalid]).join(' ');
}

function showImport(candidate) {
  const copy = transferCopy();
  const merged = mergeProgress(candidate.progress);
  pendingBackup = candidate;
  $('progress-import-title').textContent = copy[5];
  $('progress-import-description').textContent = copy[6];
  $('progress-import-stats').textContent = copy[12] + ': ' + [
    t('Ukończone partie') + ' ' + completedCount(results) + ' / ' + completedCount(merged.results),
    copy[11] + ' ' + earnedThemes(results, unlockedThemes).length + ' / ' + merged.unlockedThemes.length
  ].join(' · ');
  $('cancel-progress').textContent = copy[7];
  $('restore-progress').textContent = copy[8];
  $('progress-import-error').hidden = true;
  $('confirm-progress').showModal();
}

$('export-preferences').onclick = () => {
  try {
    const text = GamesChestBackup.stringify(currentPreferences(), mergeProgress(), backupSchema);
    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
    link.download = 'kierki-backup.json';
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(link.href), 30_000);
    backupNotice = undefined;
  } catch { backupNotice = ['export']; }
  renderBackup();
};
$('import-preferences').onclick = () => $('preferences-file').click();
$('preferences-file').onchange = async () => {
  const input = $('preferences-file');
  const [file] = input.files;
  input.value = '';
  if (!file) return;
  const generation = ++importGeneration;
  backupNotice = undefined;
  renderBackup();
  try {
    if (file.size > GamesChestBackup.maxBytes) throw Object.assign(Error(), { code: 'invalid' });
    let text;
    try { text = await file.text(); } catch { throw Object.assign(Error(), { code: 'read' }); }
    if (generation !== importGeneration || !$('options').open) return;
    showImport(parseBackup(text));
  } catch (error) {
    if (generation !== importGeneration || !$('options').open) return;
    backupNotice = [error.code];
    renderBackup();
  }
};
$('options').addEventListener('close', () => {
  importGeneration++;
  if ($('confirm-progress').open) $('confirm-progress').close();
});
$('confirm-progress').addEventListener('close', () => {
  pendingBackup = undefined;
  if ($('options').open) $('import-preferences').focus();
});
$('restore-progress').onclick = () => {
  if (!pendingBackup || !$('confirm-progress').open) return;
  const progress = mergeProgress(pendingBackup.progress);
  const imported = GamesChestPreferences.resolveTheme(pendingBackup.preferences, theme,
    id => Object.hasOwn(themes, id), id => !Object.hasOwn(rewards, id) || progress.unlockedThemes.includes(id));
  if (!persistProfile(imported.preferences, progress)) {
    $('progress-import-error').textContent = transferErrors()[errorLabels.write];
    $('progress-import-error').hidden = false;
    return;
  }
  const preferences = imported.preferences;
  for (const id of optionIds) $(id).checked = preferences[id];
  $('language').value = preferences.language;
  $('difficulty').value = preferences.difficulty;
  $('play-pace').value = preferences['play-pace'];
  $('include-puzzle').value = formatOption(preferences);
  contrast = preferences.contrast;
  theme = preferences.theme;
  scorecardOpen = undefined;
  saveGame();
  optionsSaved = true;
  backupNotice = ['success', ...(imported.skipped ? [imported.skipped] : [])];
  $('confirm-progress').close();
  render();
};
for (const id of optionIds) $(id).onchange = () => {
  if (id === 'show-scores') {
    scorecardOpen = undefined;
    saveGame();
  }
  saveOptions();
};
$('language').onchange = saveOptions;
$('difficulty').onchange = saveOptions;
$('play-pace').onchange = saveOptions;
$('include-puzzle').onchange = saveOptions;
$('theme').onchange = () => {
  if ($('theme').value === 'gallery') {
    $('theme').value = theme;
    $('theme-gallery').showModal();
    return;
  }
  theme = $('theme').value;
  saveOptions();
};
$('contrast').onclick = () => { contrast = !contrast; saveOptions(); };
$('restart').addEventListener('close', () => {
  if ($('restart').returnValue === 'start') start(match.single);
  $('restart').returnValue = '';
});
saveGame();
render();

import { extraLanguages, extraTranslations } from './locale-extra.js?v=5';

export const languages = ['pl', 'en', ...extraLanguages];
const gameNames = { en: 'Barbu-King', de: 'Barbu', es: 'Barbu', fr: 'Barbu', it: 'Barbu', uk: 'Кєркі', ar: 'باربو كينغ', hi: 'क्येर्की', 'zh-Hans': '凯尔基' };
export const gameName = language => gameNames[language] ?? 'Kierki';
export const direction = language => language === 'ar' ? 'rtl' : 'ltr';

const rankLetters = {
  pl: ['W', 'D', 'K', 'A'], de: ['B', 'D', 'K', 'A'], fr: ['V', 'D', 'R', 'A'],
  uk: ['В', 'Д', 'К', 'Т']
};
const internationalRanks = ['J', 'Q', 'K', 'A'];
export const rankLabel = (value, language) => (rankLetters[language] ?? internationalRanks)[value - 11] ?? value;

const english = {
  'Historia lew': 'Trick history', 'Rozdanie': 'Deal',
  'Brak zapisanych lew': 'There are no recorded tricks in this match yet.',
  'Opis historii lew': 'Shows a collapsible section below the score table with the tricks from this match.',
  'Wysuwaj dostępne karty': 'Raise playable cards',
  'Opis wysuwania kart': 'Raises cards you can play above the rest of your hand. Applies immediately to all game modes.',
  'Tempo gry': 'Play speed', 'Szybkie': 'Fast', 'Normalne': 'Normal', 'Wolne': 'Slow',
  'Opis tempa gry': 'Sets the pause between computer plays. After a pass, the pause is longer so you can see who passed.',
  'Pełny ekran': 'Fullscreen', 'Wyjdź z pełnego ekranu': 'Exit fullscreen', 'Jak grać': 'How to play',
  'Nowa gra': 'New game', 'Cofnij': 'Undo', 'Przywróć': 'Redo', 'Ustawienia': 'Settings',
  'Pokaż punktację': 'Show scores', 'Cofnij i Przywróć': 'Undo and Redo',
  'Wygląd i informacje': 'Display and information', 'Działa od razu': 'Applies immediately',
  'Komputer': 'Computer', 'Poziom trudności': 'Difficulty', 'Od następnej partii': 'From the next game',
  'Układanka': 'Eights', 'Układanka na koniec': 'Eights at the end',
  'Rozpocznij': 'Start', 'Trening': 'Practice', 'Rozpocznij trening': 'Start practice',
  'Wróć do partii': 'Return to match', 'Rozdanie treningowe': 'Practice deal',
  'Opis treningu': 'Play one deal. Practice does not affect statistics, and you can return to your match.',
  'Rozpocząć trening od nowa?': 'Restart practice?',
  'Nie udało się przełączyć rozgrywki.': 'Could not switch games.',
  'Z układanką': 'With Eights', 'Bez układanki': 'Without Eights',
  'Rozpocznij układankę': 'Start Eights', 'Pas': 'Pass', kart: 'cards', miejsce: 'place',
  'Nie masz pasującej karty. Pasujesz automatycznie.': 'You have no playable card. You pass automatically.', 'Dołóż kartę': 'Add a card',
  'Opis opcji układanki': 'Adds an Eights deal after the four recovery deals. Applies from the next game.',
  'Zasady układanki': 'Eights is an optional final deal. Start each suit with its eight, then build out in order towards two and ace. Play one card per turn, or pass if you have no legal move. Players score +10, +5, −5 and −10 in the order they empty their hands.',
  'Łatwy': 'Easy', 'Średni': 'Medium',
  'Opis poziomów Kierek': 'Easy uses the simple strategy from the prototype. Medium also uses cards seen in earlier tricks. The change applies from the next game.',
  'Zmiany zapisują się automatycznie.': 'Changes are saved automatically.',
  'Nie udało się zapisać ustawień.': 'Could not save settings.',
  'Spróbuj ponownie': 'Try again', 'Informacje o ustawieniu': 'About this setting',
  'Opis punktacji': 'Show trick points and the score table during a deal.',
  'Zakres kopii Kierek': 'Includes preferences, statistics and unlocked themes. The current game and move history stay on this device.',
  'Cofnij ostatnie zagranie': 'Undo your last play and the computer responses, or redo the move.',
  'Punktacja': 'Scores', 'Gracz': 'Player', 'Razem': 'Total', 'Zasady prototypu': 'Prototype rules',
  'Rozbójnik': 'Bandit', 'Odgrywka': 'Recovery', 'Rozbójnik zakończony.': 'Bandit deal complete.',
  'Rozdaje': 'Dealer', 'Rozdanie zakończone.': 'Deal complete.', 'Następne rozdanie': 'Next deal',
  'Rozpocznij odgrywkę': 'Start recovery', 'Bez atu': 'No trump', 'Atut': 'Trump',
  'Dotknij stołu, by zagrać następną lewę': 'Tap the table for the next trick',
  'Dotknij stołu, by zobaczyć wynik rozdania': 'Tap the table for the deal result',
  'Zagraj kartę': 'Play a card',
  'Pokaż wyniki': 'Show results',
  'Schowaj wyniki': 'Hide results',
  'Następna lewa': 'Next trick', 'Wynik rozdania': 'Deal result', 'Twój ruch': 'Your turn',
  'Bierzesz lewę': 'You take the trick', 'Lewę bierze': 'Trick winner', 'Gra': 'Playing',
  'Wygrywasz!': 'You win!', 'Wygrywa': 'Winner', 'Remis': 'Tie', 'Lewa': 'Trick', 'pkt': 'pts',
  'Zagraj ponownie': 'Play again', 'Ukończone partie': 'Completed games', 'Wygrane': 'Wins', 'Rozliczone partie': 'Games recorded',
  'Liczba wziętych lew': 'Tricks taken', 'Karty w ręce': 'Cards in hand', 'Twoje karty': 'Your cards',
  'Pierwsze siedem kart': 'First seven cards', 'Komputer wybiera atu.': 'Computer is choosing a trump suit.',
  'Dotknij karty pod stołem, by wybrać atu': 'Tap a card below the table to choose trump',
  'Wybór atu': 'Trump selection',
  'Wybierz atu': 'Choose trump',
  'Ty': 'You', 'Zachód': 'West', 'Północ': 'North', 'Wschód': 'East',
  'Trefle': 'Clubs', 'Kara': 'Diamonds', 'Piki': 'Spades', 'Kiery': 'Hearts',
  'Walet': 'Jack', 'Dama': 'Queen', 'Król': 'King', 'As': 'Ace',
  'Moje postępy': 'My progress', 'Motywy za osiągnięcia': 'Achievement themes', 'Odblokowany': 'Unlocked',
  'Motywy': 'Themes', 'Więcej motywów…': 'More themes…', 'Przegrane': 'Losses', 'Remisy': 'Ties',
  'Klasyczny': 'Classic', 'Ogród': 'Garden', 'Tropiki': 'Tropics', 'Plaża': 'Beach', 'Ukraina': 'Ukraine',
  'Pomarańczowy gaj': 'Orange Grove', 'Miedź i patynę': 'Copper and Patina', 'Nocne niebo': 'Night Sky',
  'Język': 'Language', 'Motyw': 'Theme', 'Kontrast': 'Contrast', 'Wysoki kontrast': 'High contrast',
  'Większy tekst': 'Larger text', 'Zamknij': 'Close', 'Stół': 'Table', 'Sterowanie grą': 'Game controls', 'Rozgrywka': 'Game',
  'Rozpocząć nową grę?': 'Start a new game?', 'Obecna rozgrywka zostanie zastąpiona.': 'The current game will be replaced.',
  'Rozpocząć nową partię i zakończyć obecną bez zaliczenia?': 'Start a new match and discard the current one?',
  'Anuluj': 'Cancel', 'Wszystkie gry': 'All games', 'Autorzy i licencje': 'Credits and licenses',
  'Dobra gra może zrobić coś dobrego.': 'A good game can do some good.',
  'Wsparcie Ukrainy i zwierząt': 'You can support people affected by the war in Ukraine or help dogs and cats in Gdynia.',
  'Pomoc Ukrainie · PAH': 'Support Ukraine · PAH',
  'Pomoc psom i kotom · Ciapkowo w Gdyni': 'Help dogs and cats · Ciapkowo in Gdynia',
  'Linki prowadzą do organizacji': 'The links go to the organizations’ official websites. We do not collect donations or take a commission.',
  'Prototyp': 'Prototype', 'Automatyczny zapis partii': 'Game saved automatically',
  'Nie udało się zapisać partii.': 'Could not save the game.',
  'Przy stole grają': 'Four players sit at the table. Follow the suit led if you can. The winner leads to the next trick.',
  'W rozbójniku unikaj': 'Avoid penalties in Bandit. Each trick and each heart costs 2 points, every jack or king costs 3, and each queen costs 5. The king of hearts costs an extra 16. The sixth and last tricks cost an extra 9 each. You can lead a heart only if you have no other suit.',
  'W odgrywce każda': 'In Recovery, each trick earns {points} points. The opening player chooses trumps using their first seven cards. If you cannot follow suit, play a trump if you have one. When playing a trump, overtrump if possible. In no-trump play, beat the highest card of the suit led if you can.'
};

const polish = {
  'Brak zapisanych lew': 'W tej partii nie ma jeszcze zapisanych lew.',
  'Opis historii lew': 'Dodaje pod punktacją zwijaną sekcję z lewami bieżącej partii.',
  'Opis wysuwania kart': 'Wysuwa karty, które możesz zagrać, ponad resztę ręki. Działa od razu we wszystkich trybach.',
  'Opis tempa gry': 'Ustawia przerwę między ruchami komputerów. Po pasie przerwa jest dłuższa, żeby było widać, kto spasował.',
  'Opis treningu': 'Rozegraj jedno rozdanie. Trening nie zmienia statystyk, a do trwającej partii możesz wrócić.',
  'Opis opcji układanki': 'Dodaje układankę od ósemek po czterech odgrywkach. Zmiana obowiązuje od następnej partii.',
  'Zasady układanki': 'Układanka to opcjonalne ostatnie rozdanie. Każdy kolor zaczyna się od ósemki. Dokładaj po jednej karcie do koloru, kolejno w dół do dwójki lub w górę do asa. Jeśli nie masz pasującej karty, spasuj. Kolejność pozbycia się kart daje +10, +5, −5 i −10 punktów.',
  'Opis poziomów Kierek': 'Łatwy używa prostej strategii prototypu. Średni uwzględnia także karty z wcześniejszych lew. Zmiana obowiązuje od następnej partii.',
  'Opis punktacji': 'Pokazuje punkty za lewę i tabelę wyników już w trakcie rozdania.',
  'Zakres kopii Kierek': 'Kopia obejmuje ustawienia, statystyki i odblokowane motywy. Bieżąca partia i historia ruchów pozostają na tym urządzeniu.',
  'Wsparcie Ukrainy i zwierząt': 'Jeśli chcesz, wesprzyj pomoc osobom dotkniętym wojną w Ukrainie lub psom i kotom w Gdyni.',
  'Linki prowadzą do organizacji': 'Linki prowadzą do oficjalnych stron organizacji. Nie zbieramy wpłat ani nie pobieramy prowizji.',
  'Przy stole grają': 'Przy stole grają cztery osoby. Dokładaj do koloru wyjścia. Zwycięzca lewy wychodzi do następnej.',
  'W rozbójniku unikaj': 'W rozbójniku unikaj kar. Za lewę i każdego kiera są po 2 punkty ujemne, za waleta lub króla 3, za damę 5, za króla kier dodatkowe 16. Szósta i ostatnia lewa kosztują dodatkowo po 9. W kiery można wyjść, gdy nie ma innego koloru.',
  'W odgrywce każda': 'W odgrywce każda lewa daje {points} punktów. Gracz wychodzący wybiera atu z pierwszych siedmiu kart. Przy braku koloru wyjścia zagraj atut, jeśli go masz. Przebij atut wyższym, gdy możesz. Bez atu musisz przebić wyższą kartą w kolorze wyjścia, jeśli ją masz.',
  'Cofnij ostatnie zagranie': 'Cofnij ostatnie zagranie razem z odpowiedziami komputerów lub przywróć cofnięty ruch.'
};

export function translate(key, language) {
  if (language === 'pl') return polish[key] ?? key;
  return extraTranslations[language]?.[key] ?? english[key] ?? key;
}

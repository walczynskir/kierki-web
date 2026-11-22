# Benchmark sześciu kontraktów ujemnych

Uruchom w katalogu Kierek polecenie `node scripts/benchmark-contracts.mjs 1000`.

Dla każdego kontraktu generator przygotowuje 1000 rozdań. Każde jest rozgrywane sześć razy z tą samą talią i wychodzącym. Dwa miejsca zajmuje poziom Łatwy, a dwa Średni. Sześć prób pokrywa wszystkie ustawienia miejsc. Za wygraną poziomu liczymy mniej punktów karnych łącznie u jego dwóch graczy. Gracze podejmują decyzje indywidualnie. Nie współpracują i nie widzą rąk innych graczy.

Łatwy to heurystyka wersji webowej. Średni to adaptacja zachowania oryginalnych klas `Decider` w JavaScript. Odtwarza dane o dostępnych kartach z własnej ręki i historii lew. Benchmark porównuje obie strategie działające w przeglądarce. Nie uruchamia oryginalnego programu C++ ani nie bada zgodności ruch po ruchu z jego implementacją. Wynik dotyczy rozgrywek w składzie dwóch graczy każdego poziomu, a sześć prób z tą samą talią nie jest sześcioma niezależnymi rozdaniami.

| Kontrakt | Łatwy, średnia kara na gracza | Średni, średnia kara na gracza | Wygrane Łatwego | Remisy | Wygrane Średniego |
| --- | ---: | ---: | ---: | ---: | ---: |
| Nie brać lew | 7,31 | 5,70 | 2065 | 0 | 3935 |
| Nie brać kierów | 7,39 | 5,61 | 2257 | 0 | 3743 |
| Nie brać chłopców | 6,14 | 5,86 | 2380 | 1038 | 2582 |
| Nie brać dam | 5,27 | 4,73 | 1904 | 1733 | 2363 |
| Nie brać króla kier | 4,11 | 3,89 | 2919 | 0 | 3081 |
| Nie brać szóstej i ostatniej lewy | 4,88 | 4,12 | 1195 | 3099 | 1706 |

Źródła strategii średniej i reguł znajdują się w [oryginalnym repozytorium Kierki](https://github.com/walczynskir/Kierki).

W wersji 1.3.1 na tych samych taliach poziom Średni w „Nie brać dam” obniżył średnią karę z 5,02 do 4,73 pkt na gracza. Wygrane wzrosły z 2079 do 2363 na 6000 prób. Wyniki pozostałych pięciu kontraktów są identyczne.

## Trudny w „Nie brać lew”

Polecenie: `node scripts/benchmark-hard.mjs 250`.

Dla każdego z 250 rozdań odniesieniem jest gra czterech Średnich. Rozdanie powtarzamy czterokrotnie, za każdym razem zastępując Średniego na jednym miejscu poziomem Trudnym. Porównujemy karę gracza na tym samym miejscu. Trudny ocenia każdą legalną kartę na 16 wspólnych próbach, odtwarzając brakujące ręce na podstawie kart publicznych i wykrytych braków kolorów. Do kończenia symulowanych lew używa prostej strategii ze względu na koszt obliczeń.

| Próby | Kara Średniego | Kara Trudnego | Trudny lepiej | Remis | Trudny gorzej |
| ---: | ---: | ---: | ---: | ---: | ---: |
| 1000 | 6,50 | 6,12 | 290 | 499 | 211 |

W lokalnym Node mediana z 13 000 decyzji wyniosła 0,36 ms, 95. percentyl 2,12 ms, maksimum 8,87 ms. To pomiar na komputerze, bez czasu animacji.

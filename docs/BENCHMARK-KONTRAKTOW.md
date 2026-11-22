# Benchmark sześciu kontraktów ujemnych

Uruchom w katalogu Kierek polecenie `node scripts/benchmark-contracts.mjs 1000`.

Dla każdego kontraktu generator przygotowuje 1000 rozdań. Każde jest rozgrywane sześć razy z tą samą talią i wychodzącym. Dwa miejsca zajmuje poziom Łatwy, a dwa Średni. Sześć prób pokrywa wszystkie ustawienia miejsc. Za wygraną poziomu liczymy mniej punktów karnych łącznie u jego dwóch graczy. Gracze podejmują decyzje indywidualnie. Nie współpracują i nie widzą rąk innych graczy.

Łatwy to heurystyka wersji webowej. Średni to adaptacja zachowania oryginalnych klas `Decider` w JavaScript. Odtwarza dane o dostępnych kartach z własnej ręki i historii lew. Benchmark porównuje obie strategie działające w przeglądarce. Nie uruchamia oryginalnego programu C++ ani nie bada zgodności ruch po ruchu z jego implementacją. Wynik dotyczy rozgrywek w składzie dwóch graczy każdego poziomu, a sześć prób z tą samą talią nie jest sześcioma niezależnymi rozdaniami.

| Kontrakt | Łatwy, średnia kara na gracza | Średni, średnia kara na gracza | Wygrane Łatwego | Remisy | Wygrane Średniego |
| --- | ---: | ---: | ---: | ---: | ---: |
| Nie brać lew | 7,31 | 5,70 | 2065 | 0 | 3935 |
| Nie brać kierów | 7,39 | 5,61 | 2257 | 0 | 3743 |
| Nie brać chłopców | 6,14 | 5,86 | 2380 | 1038 | 2582 |
| Nie brać dam | 4,98 | 5,02 | 2091 | 1830 | 2079 |
| Nie brać króla kier | 4,11 | 3,89 | 2919 | 0 | 3081 |
| Nie brać szóstej i ostatniej lewy | 4,88 | 4,12 | 1195 | 3099 | 1706 |

Źródła strategii średniej i reguł znajdują się w [oryginalnym repozytorium Kierki](https://github.com/walczynskir/Kierki).

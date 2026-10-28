---
name: spawn-issue-agents
description: Zakłada osobny branch i worktree na każdy otwarty issue GitHub i uruchamia po jednym agencie na branch, z doborem modelu i effort, briefingiem o specyfikacjach (CLAUDE.md i wszystkie skille) oraz raportowaniem do użytkownika. Use when the user asks for "po jednym branchu / agencie na każdy issue", one agent per issue, parallel agents on all open issues, or a new worktree set for the issues.
---

# Spawn issue agents

Jesteś koordynatorem: z otwartych issues robisz równoległe, izolowane zadania i prowadzisz po jednym agencie na zadanie. Najpierw przeczytaj `.claude/skills/worktree-manager/SKILL.md` — jego zasady bezpieczeństwa obowiązują tu w całości, a ten skill je tylko rozszerza.

## Twarde zasady

- Nic nie twórz, nie usuwaj i nie uruchamiaj agentów przed zatwierdzeniem planu z kroku 3. Audyt i lista issues są tylko do odczytu.
- Nigdy nie usuwaj worktree, branchy ani katalogów bez osobnej, wyraźnej zgody. To dotyczy też „porządków" w osieroconych worktree.
- Bez `git stash` — ani Ty, ani agenci. `refs/stash` jest wspólny dla wszystkich worktree. Zamiast tego: `git diff main`, `git show main:<plik>`, albo commit WIP na własnym branchu.
- Bez `push`, PR, merge, rebase, deploy, `reset --hard`, `clean -fd`, wymuszonych operacji, bez kopiowania `.env` i sekretów — dopóki użytkownik nie zgodzi się osobno.
- Nie ustawiaj `model` ani `effort` „na oko" bez uzasadnienia: w planie każdy wybór ma swoje uzasadnienie, a `effort` przekazujesz agentowi tylko dlatego, że użytkownik prosi o dobór parametrów.

## Krok 1: Audyt stanu (tylko odczyt)

Użytkownik zwykle zakłada, że repo jest czyste. Sprawdź to i napisz, co znalazłeś:

- `git status --short --branch`, `git branch --show-current`, `git stash list`
- `git fetch --prune`, potem `git log --oneline main..origin/main`
- `git worktree list` oraz `git worktree prune --dry-run -v` (wpisy `prunable` = katalog lub jego link do repo nie istnieje)
- `git branch -vv` i `git branch --merged main`: lokalne branche już zmergowane, bez śladu na `origin`, wiszące na zniknięty upstream
- Dla każdego osieroconego worktree sprawdź, czy katalog fizycznie istnieje gdzie indziej (np. po przeniesieniu repo) i czy ma niezacommitowane zmiany, bez dotykania go: `git --git-dir=.git/worktrees/<nazwa> --work-tree=<katalog> status --short`
- Luźne pliki obok worktree (logi, `*.txt`)

Przedstaw tabelę: element, stan, czy jest ryzyko utraty pracy. Zaproponuj opcje (np. `git worktree repair` zachowuje katalogi, usunięcie czystych i zmergowanych worktree je kasuje), ale nie wykonuj ich bez zgody. Brak porządku nie blokuje zakładania nowych worktree, o ile nowe ścieżki i nazwy branchy nie kolidują ze starymi — sprawdź to.

## Krok 2: Zakres

1. `gh issue list --state open --limit 100 --json number,title,labels,body`; przeczytaj treść każdego (`gh issue view <n>`).
2. Wykryj duplikaty (ten sam tytuł lub treść). Dla duplikatu nie zakładaj drugiego agenta; zamknięcie issue to krok na zewnątrz repo, więc tylko o nie zapytaj.
3. Sklasyfikuj każdy issue:
   - **implement**: opis jest rozstrzygnięty, agent może zmieniać kod,
   - **plan-only**: issue czeka na decyzję (sekcje „Decisions needed", „Options", „Open questions") albo dotyczy głównie innego repo — agent przygotowuje plan, rozpoznanie lub spike i zatrzymuje się,
   - **blocked/duplicate**.
4. Oceń kolizje: które issues dotykają tych samych plików (np. ten sam handler), a które zmieniają dużo plików naraz (formatowanie całego repo, masowe zmiany importów). Te drugie sekwencjonuj: zaproponuj, by merge’ować je jako ostatnie albo uruchomić po pozostałych, bo inaczej powodują konflikty we wszystkich innych branchach.

## Krok 3: Plan do zatwierdzenia

Pokaż jedną tabelę i poczekaj na „tak":

| Issue | Branch | Katalog worktree | Tryb | Model | Effort | Uzasadnienie |
| ----- | ------ | ---------------- | ---- | ----- | ------ | ------------ |

Plus: dokładne komendy, które wykonasz, bazowy commit, polityka commitów agentów (domyślnie: lokalne commity na własnym branchu, bez push i PR; do potwierdzenia), czy agenci mogą uruchamiać `pnpm install`, `pnpm lint`, testy, `pnpm build` (kroki 3-5 z worktree-manager wymagają uzgodnienia), znane kolizje i pytania.

Konwencja nazw, zgodna z historią repo: branch `agents/issue-<numer>-<krótki-slug>`, katalog `<repo>.worktrees/issue-<numer>-<krótki-slug>` obok repozytorium. Bazą jest `origin/main` po `git fetch`, nie lokalny `main`.

### Dobór modelu i effort

- **haiku**: tylko odczyt i proste wyszukiwanie; nie do zmian w kodzie.
- **sonnet**: dobrze określona implementacja, praca mechaniczna lub powtarzalna (formatowanie, okablowanie, drobne refaktory). `low`/`medium`; `high`, gdy dotyka wielu plików albo dodaje zależność.
- **opus**: praca wrażliwa projektowo lub bezpieczeństwo, walidacja wejścia, refaktor wielu warstw, niejednoznaczny zakres, plany z decyzjami. `high`.
- **fable** i `max`: tylko na wyraźną prośbę użytkownika albo gdy błąd byłby kosztowny i trudny do cofnięcia.
- Zadanie plan-only nie wymaga mocniejszego modelu niż implement, ale wymaga uważnego rozpoznania; model dobieraj do trudności decyzji, nie do ilości kodu.

## Krok 4: Tworzenie (po zgodzie)

Dla każdego issue, sprawdziwszy wcześniej, że branch ani katalog nie istnieją:

```bash
git fetch origin
git worktree add -b agents/issue-<n>-<slug> <repo>.worktrees/issue-<n>-<slug> origin/main
```

Zweryfikuj `git worktree list` i podaj faktyczny wynik (ścieżka, branch, bazowy commit). Nie kopiuj `.env`.

## Krok 5: Uruchomienie agentów

- Jeden agent na worktree, wszystkie w jednej wiadomości (równolegle), w tle. Nie używaj `isolation: "worktree"` — worktree już istnieją, agent ma pracować w swoim.
- Każdemu przekaż `model` i `effort` z planu oraz briefing z poniższego szablonu.
- Nie obiecuj, jak agenci wyglądają w oknie VS Code: sprawdź i pokaż użytkownikowi, co jest widoczne (`ListAgents`), a czego nie jesteś w stanie potwierdzić — powiedz to wprost.

### Szablon briefingu agenta

```
Pracujesz nad issue #<n> "<tytuł>" (<url>) w repozytorium <repo>.
Twój worktree: <ścieżka bezwzględna>, branch: agents/issue-<n>-<slug>. Wszystkie polecenia
wykonuj w tym katalogu (git -C <ścieżka> ... / cd <ścieżka>) i edytuj tylko pliki z tego
katalogu, ścieżkami bezwzględnymi. Nie dotykaj głównego checkoutu ani innych worktree.

NA START, zanim cokolwiek zmienisz:
1. Przeczytaj w całości CLAUDE.md z korzenia swojego worktree.
2. Wypisz katalog .claude/skills/ i .claude/commands/ i przeczytaj SKILL.md każdego skilla,
   którego opis dotyczy Twojego zadania. Zawsze czytaj: frontend-task-workflow,
   nuxt-vue-architecture, frontend-testing, frontend-quality-review, worktree-manager
   (zasady bezpieczeństwa) oraz .claude/commands/safe-commit.md. Dla CMS/Payload także
   payload-backend-todo i missing-cms-content; dla Medusy medusa-storefront; dla wydajności
   i SEO frontend-performance-seo.
3. Przeczytaj treść issue (gh issue view <n>) i powiązane issues/PR-y.
4. Jeśli specyfikacja jest sprzeczna z issue albo ze sobą, nie zgaduj: opisz sprzeczność
   w raporcie.

Środowisko: projekt wymaga Node >= 22 i pnpm >= 9; domyślny node w powłoce bywa starszy.
Ustaw PATH na Node 22 (np. $HOME/.nvm/versions/node/<22.x>/bin) i włącz pnpm przez corepack
do katalogu w swoim scratchpadzie.

Zasady bezwzględne:
- Zakaz git stash (wspólny refs/stash dla wszystkich worktree). Porównuj z `git diff main`
  lub zrób commit WIP na własnym branchu.
- Zakaz push, PR, merge, rebase, reset --hard, clean -fd, wymuszonych operacji.
- Nie kopiuj .env ani sekretów.
- <polityka commitów z planu, np. lokalne commity na własnym branchu, bez push>
- Uruchamiaj tylko uzgodnione sprawdzenia: <lista z planu>. Nie uruchamiaj reszty.
- Zmieniaj tylko to, co należy do issue. Gdy zmieniasz konwencję lub zachowanie opisane w
  CLAUDE.md albo skillu, zaktualizuj ten dokument w tym samym branchu.
- Dodaj testy proporcjonalnie do ryzyka (frontend-testing).

Tryb: <implement | plan-only>.
<plan-only: nie zmieniaj kodu aplikacji. Przygotuj plan, rozpoznanie lub spike i zatrzymaj się
przy decyzjach, które należą do użytkownika.>

RAPORT KOŃCOWY (to jedyne, co do mnie wróci, więc pełny i konkretny):
- co zrobiłeś i dlaczego, lista zmienionych plików,
- jakie sprawdzenia uruchomiłeś i ich faktyczny wynik; jakich nie uruchomiłeś,
- hash commita i stan worktree (czy są niezacommitowane zmiany),
- decyzje i pytania do użytkownika, ryzyka,
- spodziewane konflikty z innymi branchami,
- odstępstwa od specyfikacji i sprzeczności w niej.
```

## Krok 6: Raportowanie do użytkownika

Końcowy raport agenta nie trafia sam do użytkownika. Po zakończeniu każdego agenta zrelacjonuj najważniejsze rzeczy: wynik, sprawdzenia, decyzje, konflikty. Gdy wszyscy skończą, daj jedną tabelę zbiorczą oraz propozycję kolejności merge’owania. Kontynuację zlecaj przez `SendMessage` do tego samego agenta, nie nowym agentem.

## Zakończenie

Niczego nie usuwaj i nie zamykaj bez osobnej zgody. Na końcu podaj, co jest zrobione, co zostało na dysku (worktree, branche, niezacommitowane zmiany) i jakie decyzje czekają na użytkownika.

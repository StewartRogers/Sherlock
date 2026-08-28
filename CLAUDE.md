# CLAUDE.md

Notes for future Claude sessions in this repo. `README.md` covers what the app is and how
to run it; this file covers the conventions that are easy to break.

## Checks

There is **no test suite**. The gates are, and all three must pass before committing:

```bash
npm run typecheck   # tsc --noEmit
npm run lint        # eslint .
npm run build       # needs APP_PASSCODE and AUTH_SECRET set, or it 503s at prerender
```

`npm install` must have been run with dev dependencies — ESLint is not a runtime dep, and
a fresh `--omit=dev` install will make `npm run lint` fail with "eslint: not found".

## Architecture

- **One store, no reducer.** `lib/store.tsx` holds all app state in a single `useState`
  and mutates it exclusively through `patch((s) => Partial<State> | null)`. Returning
  `null` means "no change". Always read from the updater argument `s`, never from the
  render closure — that is what keeps this codebase free of stale-closure bugs.
- **Per-case state must be listed in `PER_CASE_RESET`.** Anything that belongs to one
  casefile rather than to the session goes in that constant, which `openCase` and
  `startInspection` both spread. Adding a per-case field to `SherlockState` without adding
  it there is the bug that leaks one casefile's notes into the next one.
- **Codes are positional and derived, not counters.** Note codes come from
  `renumberNotes()` over the whole list; document codes come from the highest `D-` number
  ever issued, not the array length. Deriving either from `.length` re-issues a code after
  a delete and produces two items with the same code, which the chat's `lookupCode` and the
  graph's node ids both resolve wrongly.
- **Two authored employer slots.** `REPORT_DEFAULTS` and the seeded `CASE_EVIDENCE` are
  written against `EMPLOYER_SLOTS = ["roofing", "prime"]`. `defaultDoc` returns an empty
  report beyond those two rather than cycling, because cycling duplicated `ORD-1`/`RR-1`
  across employers and collapsed two graph nodes into one.
- **Graph edges are inferred from tags, plus manual overrides.** `graphLinks` adds edges,
  `removedGraphLinks` suppresses them by `edgeKey()`. Any code path that re-applies a tag
  must clear the matching key, and any path that deletes a node must purge both lists —
  otherwise the graph contradicts the tags.

## Security

- `lib/auth.ts` is **server-only in practice**. It has no `server-only` guard, so do not
  import it from a client component; `lib/redirect.ts` exists precisely so the login form
  can validate `?next=` without pulling the signing helpers into the browser bundle.
- **Fail closed.** Missing *or whitespace-only* `APP_PASSCODE`/`AUTH_SECRET` must produce a
  503, never an open app. Both values are trimmed before the truthiness check for that
  reason.
- Error responses to unauthenticated callers stay generic — no variable names, no hint
  about whether a passcode was the wrong length.
- `proxy.ts` is the **only** authorization check. Its matcher is default-deny, so a new
  route is protected the moment it exists. Keep the exclusions anchored (`_next/static/`,
  `favicon\.ico$`) and do not widen them.

## Styling

All design tokens are CSS custom properties at the top of `app/globals.css` — `--color-*`,
`--font-*`, `--space-*`, `--radius-*`, `--shadow-*`. Take values from those variables
rather than hard-coding a hex, font name, or pixel value the tokens already carry.
Retuning the look means editing the token block, not the components.

## Known gaps

Deliberately unfixed; raise them before "fixing" one as a surprise.

- **Nothing persists.** A reload loses the whole casefile. That is why `app/page.tsx`
  swallows stray drag-and-drop — a dropped file would otherwise navigate the tab away and
  take the inspection with it.
- **Capture tab employer tags are inert.** `captureEmployer` is read only by the Capture
  tab itself; the graph, Case folder, report and chat all derive photo → employer from the
  static `CASE_EVIDENCE` slots. Wiring it up is a design decision, not a mechanical fix.
- **`E-8` is capturable but has no case-evidence row**, so it never reaches the Case
  folder, the graph, or chat.
- **Notes and Requests share one composer draft** (`transcript`, `draftNoteEmployers`).
- **The graph re-runs its whole force layout on every edge change**, so the diagram
  reshuffles when a link is added or removed.

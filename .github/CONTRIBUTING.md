# Contributing to Doxo

Thanks for taking the time to contribute. Here's how to get set up and what's expected in a PR.

## Getting set up

```bash
git clone https://github.com/sir-siren/doxo.git
cd doxo
bun install
bun run dev
```

Requires Bun 1.4+.

## Before you open a PR

Run all three of these locally, they're the same checks CI (if/when enabled) will run:

```bash
bun run typecheck   # TypeScript
bun run lint        # Oxlint
bun run test        # Vitest
```

## Project structure

The codebase is feature-sliced:

- `src/features/game/engine/`: pure game logic (move validation, box detection, scoring). No React, no Redux, easy to unit test.
- `src/features/ai/`: AI difficulty strategies.
- `src/features/*/state/`: Redux slices and selectors per feature.
- `src/pages/`: top-level screens.
- `src/shared/`: reusable UI, hooks, and utilities with no feature-specific logic.

Keep that separation when adding things. Game rules and logic belong in `engine/`, not scattered across components.

## Commit style

Reasonably descriptive commit messages are appreciated (what changed and why), but there's no strict format enforced.

## Reporting bugs / suggesting features

Use the issue templates. Screenshots and repro steps make bug reports much faster to act on.

## Code of Conduct

By participating, you're expected to follow the [Code of Conduct](CODE_OF_CONDUCT.md).

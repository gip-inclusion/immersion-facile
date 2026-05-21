# E2E Tests (Playwright)

Requires Docker (for PostgreSQL testcontainer) and a `.env` file in `playwright/` with ProConnect credentials.

## CI mode

```bash
pnpm test:e2e             # fresh container + migrations + seed, cleanup on exit
```

Creates a disposable PostgreSQL container, runs migrations, seeds the DB, starts front+back servers, runs all tests, then stops everything. Used in CI.

## Dev mode

```bash
pnpm test:e2e:dev                              # first run: creates container + setup (~30s)
                                               # subsequent runs: reuses container, re-seeds DB (~2s)
pnpm test:e2e:dev -- --grep "convention"       # run only tests matching "convention"
pnpm test:e2e:dev -- --headed                  # run with visible browser
pnpm test:e2e:dev -- --headed --grep "agency"  # combine any playwright args
pnpm test:e2e:dev:reset                        # force fresh container + full setup
pnpm test:e2e:dev:stop                         # stop the cached container
```

In dev mode the PostgreSQL container stays alive between runs, skipping container creation and migrations (~30s overhead). The DB is re-seeded on each run to ensure clean state.

Front and back servers are also reused (`reuseExistingServer` in playwright config) — start them with `pnpm dev` before running tests, or let Playwright start them automatically on first run.

Everything after `--` is passed through to Playwright (`--grep`, `--headed`, `--workers`, `--project`, etc.).

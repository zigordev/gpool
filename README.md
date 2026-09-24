# gpool

Football pool platform monorepo.

## Repository shape

- `apps/web`: Next.js web app
- `apps/api`: NestJS monolithic backend (auth + pools + notifications + RUM)
- `docker/`: app-local, app-dev, app-prod and CI compose manifests + env templates
- `.github/workflows/`: CI, deploy, release, governance workflows

## Quick start

1. Install dependencies

```bash
npm install
```

2. Start local app stack

```bash
npm run local:up
```

This app stack expects the shared Docker network from `platform-ops` (`platform_ops_shared` by default).
For first-time setup (OpenBao secrets/token), follow `docs/local-first-start.md`.

For an edit-and-refresh loop instead of a rebuild:

```bash
npm run local:dev
```

Same preflight and same ports, but the containers build their `dev` stage and
run `nest start --watch` and `next dev` under `docker compose watch`, which copies changed source into
them. Dependency manifests trigger a rebuild rather than a sync. Both modes are
the same services on the same ports, so run one at a time.

3. Check stack

```bash
curl -fsS http://localhost:3010/health
curl -fsS http://localhost:3011
```

4. Stop stack

```bash
npm run local:down
```

Translations are authored in the local Tolgee from `platform-ops`. After changing translations there, rerun `npm run local:up` to refresh the tracked `apps/web/messages/*.json` snapshots before committing them.

**The pull is additive.** `npm run i18n:pull -w @gpool/web` deep-merges the export over the committed files rather than replacing them, so a key added in code but not yet pushed to Tolgee survives; Tolgee wins wherever it has a value. Without this, `local:up` against an empty or stale local Tolgee silently deletes committed copy. The trade-off is that a key deliberately removed in Tolgee lingers locally until it is deleted here too.

**The pull never replaces a file it cannot parse.** A missing file is a first pull and takes the export as it is; a file that exists but is not valid JSON, usually one a merge left with conflict markers, stops the pull before either locale is written.

**The pull normalises locale tags and sorts keys on write.** A project tagged `es-ES` lands as `es.json`, the file `src/i18n/config.ts` actually reads, and anything outside `en`/`es` is skipped and named. Sorting makes a pull with no new copy an empty diff. The export asks for `supportArrays=true`, because Tolgee has no array type and would otherwise hand back `bullets[0]`-style keys.

**Which copy served a render is a metric.** `gpool_i18n_messages_total{source}` counts every load as `merged`, `remote`, `local` or `default_locale`, and `i18n.load_messages` carries the same value as a span attribute. `source="local"` climbing in prod means Tolgee is answering with nothing and the site is serving committed copy — a state `/health` reports as `up` by design, because a page that renders is not an outage.

## Quality commands

```bash
npm run lint
npm run typecheck
npm run build
npm run test
```

## Release + deploy model

- `Release Please` manages versioning/changelog + release PR.
- On release publish, `Deploy AWS App (EC2 Compose)` builds/pushes images and deploys remotely via AWS SSM.
- Runtime env comes from SSM path (default `/gpool/prod/app`) rendered into `docker/.env.app.prod` on the host.
- Platform infra/ops services are owned by `platform-ops`; this repo only ships app stack compose + app config under `docker/`.

See:

- `docs/local-first-start.md`
- `docs/cloud-first-deploy.md`

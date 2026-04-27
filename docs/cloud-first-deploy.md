# Cloud First Deploy (gpool)

Use this runbook when you are deploying `gpool` to AWS from scratch.
Complete `platform-ops/docs/cloud-first-deploy.md` first. `gpool` depends on the shared production host, OpenBao, Tolgee, Redpanda, and ingress managed there.
The shared translation promotion model is documented in `platform-ops/docs/cloud-first-deploy.md` under `Translation Promotion Model`.

## 1. What You Are Building

When this runbook is complete, you will have:

- `gpool` API and web images published to ECR
- a `gpool` application deployment running on the shared EC2 host
- Google OAuth login working in production
- runtime secrets stored in OpenBao and SSM
- notification publishing wired to the shared platform Kafka broker
- public routing handled by the shared `platform-ops` ingress

## 2. Prerequisites

Run every command in this document from the `gpool` repo root unless stated otherwise.

Required:

- `platform-ops` production is already deployed
- OpenBao production is initialized, unsealed, and has `kv` v2 enabled
- Tolgee production is reachable
- AWS CLI with access to the target account
- `jq`
- GitHub access to configure repository environments
- access to a Google Cloud project where you can create a production OAuth client

## 3. Prepare Third-Party Provider Configuration

### 3.1 Tolgee

Open the production Tolgee UI and create a project for `gpool` if needed.

Then:

1. note the numeric project id
2. create an API key for server-side runtime translation reads
3. create a second write-capable API key for the GitHub translation promotion workflow

You will need:

- the project id for `TOLGEE_PROJECT_ID` in `docker/.env.app.prod`
- the runtime read API key for OpenBao secret `kv/gpool`
- the write-capable promotion API key for GitHub secret `TOLGEE_SYNC_API_KEY`

The tracked production env file defaults `TOLGEE_PROJECT_ID=3`.
If your real production project id is different, update the tracked file before deployment.

### 3.2 Google OAuth

Create a Google OAuth client for production with:

- application type: `Web application`
- authorized JavaScript origin: `https://gpool.zigordev.com`
- authorized redirect URI: `https://gpool.zigordev.com/api/auth/google/callback`

If your final public domain is different, use the real domain instead.

You will need:

- the Google client id for tracked file `docker/.env.app.prod`
- the Google client secret for OpenBao secret `kv/gpool`

## 4. Configure The GitHub `production` Environment

In the `gpool` GitHub repository, create or update environment `production`.

Required environment variables:

- `AWS_REGION`
  - AWS region used by the workflow
- `AWS_ECR_API_REPOSITORY_URI`
  - ECR repository for the API image
- `AWS_ECR_WEB_REPOSITORY_URI`
  - ECR repository for the web image
- `AWS_DEPLOY_BUCKET`
  - S3 bucket used for deploy bundles
- `AWS_DEPLOY_INSTANCE_ID`
  - EC2 instance targeted through SSM
- `AWS_SSM_APP_PREFIX`
  - SSM prefix for `gpool`, for example `/gpool/prod/app`
- `TOLGEE_SYNC_API_URL`
  - public base URL of the production Tolgee UI/API used by the translation promotion workflow

Optional environment variable:

- `DEPLOY_HEALTHCHECK_URL`
  - enables the GitHub post-deploy smoke check

Required environment secret:

- `AWS_DEPLOY_ROLE_ARN`
  - IAM role assumed by GitHub Actions through OIDC
- `TOLGEE_SYNC_API_KEY`
  - write-capable production Tolgee API key used only by the translation promotion workflow

## 5. Review The Tracked Non-Secret Config

Review `docker/.env.app.prod` before the first deploy.

Important values:

- `NEXT_PUBLIC_API_BASE_URL`
  - public API base URL used by the web build
- `CORS_ORIGINS`
  - browser origins allowed by the API
- `TRUST_PROXY`
  - usually `1` behind the shared ingress
- `SWAGGER_ENABLED`
  - normally `false` in production
- `TOLGEE_PROJECT_ID`
  - numeric Tolgee project id for `gpool`
- `GOOGLE_CLIENT_ID`
  - public Google OAuth client id
- `GOOGLE_OAUTH_REDIRECT_URI`
  - must exactly match the production Google OAuth redirect URI
- `FRONTEND_URL`
  - public `gpool` web origin
- `NOTIFICATIONS_KAFKA_BROKERS`
  - Kafka brokers reachable from the production host
  - keep `platform-redpanda:9092` unless you intentionally move the shared broker
- `NOTIFICATIONS_EMAIL_TOPIC`
  - topic used when `gpool` publishes email requests

Do not put real secrets in this file.

These placeholders are expected and are filled by the deploy flow or at runtime:

- `POSTGRES_PASSWORD=SET_FROM_OPEN_BAO`
- `OPENBAO_TOKEN=CHANGE_ME_PROD_OPENBAO_APP_READ_TOKEN`
- `API_IMAGE=REQUIRED_SET_BY_DEPLOY`
- `WEB_IMAGE=REQUIRED_SET_BY_DEPLOY`

## 6. Create The OpenBao Secret `kv/gpool`

Create secret path `kv/gpool` in the OpenBao production UI.

Add these keys:

- `AUTH_SESSION_SECRET`
  - generate with `openssl rand -hex 32`
- `GOOGLE_CLIENT_SECRET`
  - production Google OAuth client secret
- `TOLGEE_API_KEY`
  - production Tolgee API key for `gpool`
- `POSTGRES_PASSWORD`
  - production database password for `gpool`

## 7. Create The OpenBao Read Policy And App Token

Open an SSM shell on the production EC2 instance:

```bash
aws ssm start-session --profile platform-ops --target <AWS_DEPLOY_INSTANCE_ID> --region <AWS_REGION>
```

Inside that shell, resolve the latest `platform-ops` release directory:

```bash
OPS_DIR="$(ls -1dt /opt/platform-ops/releases/* | head -n1)"
echo "$OPS_DIR"
```

Create the narrow read policy:

```bash
ROOT_TOKEN='paste_openbao_root_token'

sudo docker compose --env-file "$OPS_DIR/docker/.env.ops.prod" -f "$OPS_DIR/docker/compose.ops.prod.yml" exec -T \
  -e BAO_ADDR=http://127.0.0.1:8200 \
  -e BAO_TOKEN="$ROOT_TOKEN" \
  openbao sh -lc "
cat > /tmp/gpool-prod-read.hcl <<'EOF'
path \"kv/data/gpool\" { capabilities = [\"read\"] }
path \"kv/metadata/gpool\" { capabilities = [\"read\"] }
EOF
bao policy write gpool-prod-read /tmp/gpool-prod-read.hcl
"
```

Create the token:

```bash
GPOOL_OPENBAO_TOKEN="$(
  sudo docker compose --env-file "$OPS_DIR/docker/.env.ops.prod" -f "$OPS_DIR/docker/compose.ops.prod.yml" exec -T \
    -e BAO_ADDR=http://127.0.0.1:8200 \
    -e BAO_TOKEN="$ROOT_TOKEN" \
    openbao bao token create -policy=gpool-prod-read -format=json | jq -r '.auth.client_token'
)"
echo "$GPOOL_OPENBAO_TOKEN"
```

Use this app token only for `gpool`.

## 8. Store The App Token In SSM

Store the `gpool` OpenBao token under the app SSM prefix:

```bash
aws ssm put-parameter \
  --profile platform-ops \
  --name /gpool/prod/app/OPENBAO_TOKEN \
  --type SecureString \
  --value "$GPOOL_OPENBAO_TOKEN" \
  --overwrite \
  --region <AWS_REGION>
```

If your prefix differs, use:

```bash
${AWS_SSM_APP_PREFIX}/OPENBAO_TOKEN
```

## 9. Trigger The First Deploy

The workflow is:

- `Deploy AWS App (EC2 Compose)` in `.github/workflows/deploy.yml`

Trigger it by:

- publishing a release tag
- or running `workflow_dispatch` with an existing `release_tag`

The workflow builds the images, uploads the deploy bundle, and runs the remote deploy script over SSM.

## 10. Promote Translation Snapshots To Prod Tolgee

Production Tolgee is updated from the tracked JSON snapshots in git, not from ad-hoc manual edits.

Workflow:

- `Promote Prod Translations` in `.github/workflows/promote-prod-translations.yml`

Trigger it in either way:

- merge a commit to `main` that changes `apps/ui/messages/*.json`
- or run `workflow_dispatch` manually

What the workflow does:

- reads `TOLGEE_PROJECT_ID` from `docker/.env.app.prod`
- uses `TOLGEE_SYNC_API_URL` and `TOLGEE_SYNC_API_KEY`
- pushes the committed JSON snapshots into the production Tolgee project

Important:

- local Tolgee is the authoring source during development
- production Tolgee should be treated as a promoted target, not as a manual editing surface

## 11. Validate The Production App

Validate the public API:

```bash
curl -fsS https://gpool-api.zigordev.com/api/health/ready
```

Validate the public web app:

```bash
curl -fsS https://gpool.zigordev.com/
```

Recommended manual checks:

- complete a Google login flow in the browser
- verify the app can read translations from Tolgee
- exercise at least one flow that publishes a notification event

## 12. Troubleshooting

Google login fails in production:

- `GOOGLE_OAUTH_REDIRECT_URI` does not exactly match the Google Cloud client
- `GOOGLE_CLIENT_ID` is wrong in `docker/.env.app.prod`
- `GOOGLE_CLIENT_SECRET` is wrong in OpenBao

Translations fail:

- `TOLGEE_PROJECT_ID` does not match the real Tolgee project
- `TOLGEE_API_KEY` is wrong or stale

Translation promotion fails:

- `TOLGEE_SYNC_API_URL` is missing or points to the wrong public Tolgee URL
- `TOLGEE_SYNC_API_KEY` is missing, stale, or lacks write permissions

Deploy fails when reading OpenBao:

- OpenBao is sealed
- `kv/gpool` does not exist
- the token stored in SSM does not match the `gpool-prod-read` policy

Notification publishing fails:

- `NOTIFICATIONS_KAFKA_BROKERS` is wrong
- the shared Redpanda service in `platform-ops` is not reachable from the production host

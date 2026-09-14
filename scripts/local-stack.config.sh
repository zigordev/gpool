APP_LABEL="the gpool app stack"
APP_ENV_FILE="docker/.env.app.local"
APP_ENV_EXAMPLE_FILE="docker/.env.app.local.example"
COMPOSE_FILES=(docker/compose.app.local.yml)
DEV_COMPOSE_FILES=(docker/compose.app.dev.yml)

OPENBAO_SECRET_PATH="gpool"
OPENBAO_REQUIRED_KEYS="SESSION_SECRET,SESSION_COOKIE_SECRET,GOOGLE_CLIENT_SECRET,TOLGEE_API_KEY,POSTGRES_PASSWORD"
OPENBAO_EXPORT_KEYS="POSTGRES_PASSWORD"
OPENBAO_RUN="scripts/openbao-run.mjs"

DB_SERVICE="gpool_db"
DB_USER="gpool_admin"
DB_NAME="gpool"
DB_BOOTSTRAP_DB="gpool"

TOLGEE_SYNC="pull"
TOLGEE_WORKSPACE="@gpool/web"

RESET_MODE="volumes"
READY_MESSAGE="gpool app stack started (the API runs migrations on startup)."
READY_URLS=("http://localhost:3010/health" "http://localhost:3011")

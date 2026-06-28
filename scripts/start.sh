#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

IMAGE_NAME="aphelion"
CONTAINER_NAME="aphelion"
ENV_FILE="$ROOT_DIR/be/.env"

# Port configuration:
#   --be-port  Port Express listens on INSIDE the container (sets PORT env var). Default: 3000
#   --fe-port  Host port mapped to the container port (what you access in a browser). Default: same as --be-port
BE_PORT=3000
FE_PORT=""

usage() {
  cat <<EOF
Usage: $(basename "$0") [options]

Options:
  --be-port <n>    Port Express listens on inside the container (default: 3000)
  --fe-port <n>    Host port exposed to the outside (default: same as --be-port)
  --env-file <p>   Path to .env file (default: be/.env)
  -h, --help       Show this help

Examples:
  $(basename "$0")                          # http://localhost:3000
  $(basename "$0") --fe-port 80             # http://localhost:80  (container still on 3000)
  $(basename "$0") --be-port 4000           # http://localhost:4000
  $(basename "$0") --be-port 4000 --fe-port 80
EOF
  exit 0
}

# Returns 0 (true) if the given host port is already bound
port_in_use() {
  local port=$1
  if command -v lsof >/dev/null 2>&1; then
    lsof -i :"$port" -sTCP:LISTEN -t >/dev/null 2>&1
  elif command -v ss >/dev/null 2>&1; then
    ss -tlnH "sport = :$port" 2>/dev/null | grep -q .
  elif command -v nc >/dev/null 2>&1; then
    nc -z localhost "$port" >/dev/null 2>&1
  else
    return 1  # can't detect — let Docker fail if needed
  fi
}

while [[ $# -gt 0 ]]; do
  case $1 in
    --be-port)  BE_PORT="$2";   shift 2 ;;
    --fe-port)  FE_PORT="$2";   shift 2 ;;
    --env-file) ENV_FILE="$2";  shift 2 ;;
    -h|--help)  usage ;;
    *) echo "Unknown argument: $1"; usage ;;
  esac
done

# If --fe-port not supplied, default to --be-port
FE_PORT="${FE_PORT:-$BE_PORT}"

# ── 1. Env check ───────────────────────────────────────────────────────────────
if [[ ! -f "$ENV_FILE" ]]; then
  echo "Error: env file not found at $ENV_FILE"
  echo "  Copy be/.env.example → be/.env and fill in DATABASE_URL."
  exit 1
fi

if ! grep -qE '^DATABASE_URL=.+' "$ENV_FILE"; then
  echo "Error: DATABASE_URL is not set in $ENV_FILE"
  exit 1
fi

# ── 2. Drizzle migrations check ────────────────────────────────────────────────
if [[ ! -d "$ROOT_DIR/be/drizzle" ]] || [[ -z "$(ls -A "$ROOT_DIR/be/drizzle" 2>/dev/null)" ]]; then
  echo "Error: be/drizzle/ is missing or empty."
  echo "  Run: cd be && pnpm db:generate"
  exit 1
fi

# ── 3. Remove stale container (frees its port before we check availability) ────
if docker ps -a --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
  echo "→ Removing existing '$CONTAINER_NAME' container ..."
  docker stop "$CONTAINER_NAME" >/dev/null 2>&1 || true
  docker rm   "$CONTAINER_NAME" >/dev/null 2>&1 || true
fi

# ── 4. Port availability check ─────────────────────────────────────────────────
if port_in_use "$FE_PORT"; then
  echo "Error: host port $FE_PORT is already in use."
  echo "  Free the port or choose another with --fe-port <n>."
  exit 1
fi

# ── 5. Build ───────────────────────────────────────────────────────────────────
echo "→ Building Docker image '$IMAGE_NAME' ..."
docker build \
  -f "$SCRIPT_DIR/Dockerfile" \
  -t "$IMAGE_NAME" \
  "$ROOT_DIR"

# ── 6. Run DB migrations ───────────────────────────────────────────────────────
echo "→ Running DB migrations ..."
docker run --rm \
  --env-file "$ENV_FILE" \
  -e PORT="$BE_PORT" \
  "$IMAGE_NAME" \
  node_modules/.bin/tsx src/migrate.ts

# ── 7. Start container ─────────────────────────────────────────────────────────
echo "→ Starting '$CONTAINER_NAME' (host:$FE_PORT → container:$BE_PORT) ..."
docker run -d \
  --name "$CONTAINER_NAME" \
  --env-file "$ENV_FILE" \
  -e PORT="$BE_PORT" \
  -p "${FE_PORT}:${BE_PORT}" \
  --restart unless-stopped \
  "$IMAGE_NAME"

echo ""
echo "✓ Aphelion is running at http://localhost:${FE_PORT}"

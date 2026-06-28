#!/usr/bin/env bash
set -euo pipefail

CONTAINER_NAME="aphelion"

if ! docker ps -a --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
  echo "No container named '$CONTAINER_NAME' found."
  exit 0
fi

echo "→ Stopping '$CONTAINER_NAME' ..."
docker stop "$CONTAINER_NAME" >/dev/null 2>&1 || true

echo "→ Removing '$CONTAINER_NAME' ..."
docker rm "$CONTAINER_NAME" >/dev/null 2>&1 || true

echo "✓ Done."

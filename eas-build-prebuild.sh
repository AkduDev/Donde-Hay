#!/bin/bash
# eas-build-prebuild.sh
# Copies the appropriate .env file for the current EAS build environment.
# Called automatically by EAS via the "prebuild" hook.

set -euo pipefail

APP_ENV="${APP_ENV:-development}"

echo "[eas-build-prebuild] Setting up environment for: $APP_ENV"

case "$APP_ENV" in
  development)
    if [ -f .env.development ]; then
      cp .env.development .env
      echo "[eas-build-prebuild] Copied .env.development → .env"
    else
      echo "[eas-build-prebuild] Warning: .env.development not found, skipping"
    fi
    ;;
  preview)
    # Preview uses production env (real API, internal distribution)
    if [ -f .env.production ]; then
      cp .env.production .env
      echo "[eas-build-prebuild] Copied .env.production → .env (preview)"
    else
      echo "[eas-build-prebuild] Warning: .env.production not found, skipping"
    fi
    ;;
  production)
    if [ -f .env.production ]; then
      cp .env.production .env
      echo "[eas-build-prebuild] Copied .env.production → .env"
    else
      echo "[eas-build-prebuild] Warning: .env.production not found, skipping"
    fi
    ;;
  *)
    echo "[eas-build-prebuild] Unknown APP_ENV: $APP_ENV — skipping .env copy"
    ;;
esac

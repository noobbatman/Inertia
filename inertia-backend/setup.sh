#!/bin/bash

set -eu

HOOK_DIR=".git/hooks"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

cp "$SCRIPT_DIR/app/hooks/pre-push" "$HOOK_DIR/pre-push"
chmod +x "$HOOK_DIR/pre-push"
chmod 444 "$HOOK_DIR/pre-push"

echo "[INERTIA] Hook installed."
echo "[INERTIA] Set your student ID: export INERTIA_STUDENT_ID=your@email.com"

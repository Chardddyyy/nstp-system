#!/usr/bin/env bash
# Forwarding wrapper to backup_database.sh for backward compatibility
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
bash "$SCRIPT_DIR/backup_database.sh" "$@"

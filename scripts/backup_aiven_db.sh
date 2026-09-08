#!/usr/bin/env bash
# ==============================================================================
# CvSU Naic NSTP System - Automated Database & Disaster Recovery Backup Script
# Backs up Aiven MySQL Database to compressed SQL dump and syncs to Google Drive
# ==============================================================================

set -eo pipefail

# Determine script and project directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
ENV_FILE="$PROJECT_ROOT/backend/.env"
BACKUP_DIR="$PROJECT_ROOT/backups"
TIMESTAMP=$(date +"%Y-%m-%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/nstp_backup_${TIMESTAMP}.sql.gz"
RETENTION_DAYS=30

echo "=========================================================="
echo " Starting CvSU Naic NSTP System Database Backup"
echo " Timestamp: $(date)"
echo "=========================================================="

# 1. Load Environment Variables from backend/.env
if [ -f "$ENV_FILE" ]; then
  # Export non-comment lines
  export $(grep -v '^#' "$ENV_FILE" | grep -v '^$' | xargs)
else
  echo "⚠️ Warning: $ENV_FILE not found. Using system environment variables."
fi

# Fallback values
DB_HOST="${DB_HOST:-127.0.0.1}"
DB_PORT="${DB_PORT:-3306}"
DB_USER="${DB_USER:-root}"
DB_NAME="${DB_NAME:-nstp_system}"
CA_PATH="$PROJECT_ROOT/backend/config/ca.pem"

# 2. Ensure Backup Directory Exists
mkdir -p "$BACKUP_DIR"

echo "📦 Target Database : $DB_NAME on $DB_HOST:$DB_PORT"
echo "📂 Backup Output    : $BACKUP_FILE"

# 3. Build SSL flags if Aiven Cloud SSL is required
SSL_OPTS=""
if [ "$DB_SSL" = "true" ] || [[ "$DB_HOST" == *"aivencloud.com"* ]]; then
  if [ -f "$CA_PATH" ]; then
    SSL_OPTS="--ssl-ca=$CA_PATH"
  else
    SSL_OPTS="--ssl-mode=REQUIRED"
  fi
fi

# 4. Execute mysqldump with gzip compression
export MYSQL_PWD="$DB_PASSWORD"

echo "⏳ Creating compressed database snapshot..."
if command -v mysqldump &> /dev/null; then
  mysqldump \
    -h "$DB_HOST" \
    -P "$DB_PORT" \
    -u "$DB_USER" \
    $SSL_OPTS \
    --set-gtid-purged=OFF \
    --single-transaction \
    --quick \
    --routines \
    --triggers \
    "$DB_NAME" | gzip -9 > "$BACKUP_FILE"
else
  # Fallback to Node.js database dump if mysqldump client is not installed locally
  echo "ℹ️ mysqldump not found in PATH. Using Node.js database backup export runner..."
  node -e "
    const fs = require('fs');
    const zlib = require('zlib');
    const pool = require('$PROJECT_ROOT/backend/config/database');

    async function backup() {
      const [tables] = await pool.query('SHOW TABLES');
      const tableKey = Object.keys(tables[0])[0];
      const dump = [];
      dump.push('-- NSTP System Database Backup');
      dump.push('-- Generated at: ' + new Date().toISOString());
      dump.push('SET FOREIGN_KEY_CHECKS=0;\n');

      for (const row of tables) {
        const tableName = row[tableKey];
        const [[create]] = await pool.query('SHOW CREATE TABLE \`' + tableName + '\`');
        dump.push('DROP TABLE IF EXISTS \`' + tableName + '\`;');
        dump.push(create['Create Table'] + ';\n');
        
        const [rows] = await pool.query('SELECT * FROM \`' + tableName + '\`');
        if (rows.length > 0) {
          for (const r of rows) {
            const cols = Object.keys(r).map(c => '\`' + c + '\`').join(', ');
            const vals = Object.values(r).map(v => v === null ? 'NULL' : JSON.stringify(v instanceof Date ? v.toISOString().slice(0, 19).replace('T', ' ') : v)).join(', ');
            dump.push('INSERT INTO \`' + tableName + '\` (' + cols + ') VALUES (' + vals + ');');
          }
          dump.push('');
        }
      }
      dump.push('SET FOREIGN_KEY_CHECKS=1;');
      const sql = dump.join('\n');
      const compressed = zlib.gzipSync(Buffer.from(sql, 'utf-8'), { level: 9 });
      fs.writeFileSync('$BACKUP_FILE', compressed);
      console.log('✅ Node backup completed successfully.');
      process.exit(0);
    }
    backup().catch(err => { console.error('Backup error:', err); process.exit(1); });
  "
fi

BACKUP_SIZE=$(ls -lh "$BACKUP_FILE" | awk '{print $5}')
echo "✅ Database backup snapshot created: $BACKUP_FILE ($BACKUP_SIZE)"

# 5. Google Drive Sync (via rclone if configured)
if command -v rclone &> /dev/null; then
  echo "☁️ Uploading backup to Google Drive via rclone..."
  # Replace 'gdrive:' with your configured rclone remote name
  if rclone listremotes | grep -q "^gdrive:"; then
    rclone copy "$BACKUP_FILE" gdrive:NSTP_Backups/
    echo "✅ Successfully synced to Google Drive (gdrive:NSTP_Backups/)"
  else
    echo "ℹ️ Note: 'gdrive:' remote not found in rclone. Run 'rclone config' to link your Google Drive."
  fi
else
  echo "ℹ️ Tip: Install rclone ('brew install rclone' or 'apt install rclone') and run 'rclone config'"
  echo "    to enable automatic direct uploads to your personal or institution Google Drive."
fi

# 6. Retention Management: delete local dumps older than 30 days
echo "🧹 Cleaning up local snapshots older than $RETENTION_DAYS days..."
find "$BACKUP_DIR" -type f -name "nstp_backup_*.sql.gz" -mtime +$RETENTION_DAYS -exec rm -f {} \;

echo "🎉 Backup workflow finished successfully."

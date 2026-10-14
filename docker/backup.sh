#!/bin/sh
# Dumps the database to /backups once a day and deletes dumps older than BACKUP_KEEP_DAYS.
# Connection settings come from the standard PGHOST, PGUSER, PGPASSWORD and PGDATABASE variables.
set -u

until pg_isready --quiet; do sleep 2; done

while true; do
  file="/backups/izalapp-$(date +%Y-%m-%d_%H%M).dump"
  if pg_dump --format=custom --file="$file.partial"; then
    mv "$file.partial" "$file"
    echo "Backup saved: $file"
  else
    rm -f "$file.partial"
    echo "Backup failed" >&2
  fi
  find /backups -name 'izalapp-*.dump' -mtime +"$BACKUP_KEEP_DAYS" -delete
  sleep 86400
done

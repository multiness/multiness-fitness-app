#!/bin/bash

# Create backup directory if it doesn't exist
mkdir -p backups

# Generate timestamp
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="backups/multiness_backup_$TIMESTAMP.tar.gz"

# Create tar.gz archive excluding node_modules, dist, and git files
tar --exclude='./node_modules' \
    --exclude='./dist' \
    --exclude='./.git' \
    --exclude='./backups' \
    --exclude='*.tar.gz' \
    -czf "$BACKUP_FILE" .

echo "Backup created: $BACKUP_FILE"

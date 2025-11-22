#!/bin/bash

# Praxifi Backup Script
# Backs up Docker volumes and configuration files

set -e  # Exit on error

# Configuration
BACKUP_DIR="/opt/praxifi/backups"
DATE=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=7

echo "=== Praxifi Backup Script ==="
echo "Date: $DATE"
echo "Backup Directory: $BACKUP_DIR"
echo ""

# Create backup directory
mkdir -p $BACKUP_DIR

# Function to backup Docker volume
backup_volume() {
    local volume_name=$1
    local backup_name=$2
    
    echo "Backing up Docker volume: $volume_name"
    docker run --rm \
        -v $volume_name:/data \
        -v $BACKUP_DIR:/backup \
        alpine tar czf /backup/${backup_name}_${DATE}.tar.gz -C /data .
    
    if [ $? -eq 0 ]; then
        echo "✓ Successfully backed up $volume_name"
    else
        echo "✗ Failed to backup $volume_name"
        return 1
    fi
}

# Backup Docker volumes
backup_volume "praxifi-cfo_uploads_data" "uploads"
backup_volume "praxifi-cfo_outputs_data" "outputs"
backup_volume "praxifi-cfo_redis_data" "redis"
backup_volume "praxifi-cfo_logs_data" "logs"

# Backup configuration files
echo "Backing up configuration files"
tar czf $BACKUP_DIR/configs_$DATE.tar.gz \
    /opt/praxifi/praxifi-CFO/.env \
    /opt/praxifi/praxifi-CFO/nginx.conf \
    /opt/praxifi/praxifi-CFO/docker-compose.yml \
    /opt/praxifi/praxifi-frontend/.env.production \
    /opt/praxifi/praxifi-frontend/ecosystem.config.js \
    2>/dev/null

if [ $? -eq 0 ]; then
    echo "✓ Successfully backed up configuration files"
else
    echo "✗ Failed to backup some configuration files (may not exist)"
fi

# Clean up old backups
echo ""
echo "Cleaning up backups older than $RETENTION_DAYS days"
find $BACKUP_DIR -name "*.tar.gz" -mtime +$RETENTION_DAYS -type f -delete

# List current backups
echo ""
echo "Current backups:"
ls -lh $BACKUP_DIR | grep "\.tar\.gz$" | tail -10

# Calculate total backup size
TOTAL_SIZE=$(du -sh $BACKUP_DIR | cut -f1)
echo ""
echo "Total backup size: $TOTAL_SIZE"
echo "Backup completed successfully: $DATE"

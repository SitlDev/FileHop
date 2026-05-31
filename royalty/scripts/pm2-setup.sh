#!/usr/bin/env bash

# RoyaltyOS Sync Processor - PM2 Setup Script
# Manages the background sync job processor using PM2

set -e

echo "🚀 Setting up RoyaltyOS Sync Processor with PM2..."
echo ""

# Check if PM2 is installed
if ! command -v pm2 &> /dev/null; then
    echo "❌ PM2 is not installed."
    echo ""
    echo "Install PM2 globally:"
    echo "  npm install -g pm2"
    echo ""
    exit 1
fi

# Navigate to project directory
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_DIR"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}Project Directory:${NC} $PROJECT_DIR"
echo -e "${BLUE}Node Version:${NC} $(node --version)"
echo -e "${BLUE}PM2 Version:${NC} $(pm2 --version)"
echo ""

# Function: Start sync processor
start_processor() {
    echo -e "${YELLOW}Starting sync processor...${NC}"
    
    # Stop if already running
    pm2 stop royalty-sync 2>/dev/null || true
    
    # Delete if exists
    pm2 delete royalty-sync 2>/dev/null || true
    
    # Start the processor
    pm2 start scripts/sync-processor.js \
        --name "royalty-sync" \
        --interpreter npx \
        --interpreter-args "tsx" \
        --max-memory-restart 500M \
        --error "/tmp/royalty-sync-error.log" \
        --out "/tmp/royalty-sync.log" \
        --merge-logs \
        --env "NODE_ENV=production"
    
    echo -e "${GREEN}✓ Sync processor started${NC}"
}

# Function: Monitor processor
monitor_processor() {
    echo -e "${YELLOW}Monitoring sync processor...${NC}"
    pm2 monit
}

# Function: View logs
view_logs() {
    echo -e "${YELLOW}Recent logs:${NC}"
    pm2 logs royalty-sync --lines 50
}

# Function: Setup startup
setup_startup() {
    echo -e "${YELLOW}Setting up startup script...${NC}"
    pm2 startup
    pm2 save
    echo -e "${GREEN}✓ Processor will auto-restart on reboot${NC}"
}

# Function: Show status
show_status() {
    echo -e "${BLUE}Processor Status:${NC}"
    pm2 status royalty-sync
    echo ""
    echo -e "${BLUE}Resource Usage:${NC}"
    pm2 monit 2>/dev/null | head -20 || pm2 describe royalty-sync
}

# Function: Stop processor
stop_processor() {
    echo -e "${YELLOW}Stopping sync processor...${NC}"
    pm2 stop royalty-sync
    echo -e "${GREEN}✓ Sync processor stopped${NC}"
}

# Function: Delete processor
delete_processor() {
    echo -e "${YELLOW}Removing sync processor...${NC}"
    pm2 delete royalty-sync
    echo -e "${GREEN}✓ Sync processor removed${NC}"
}

# Function: Restart processor
restart_processor() {
    echo -e "${YELLOW}Restarting sync processor...${NC}"
    pm2 restart royalty-sync
    echo -e "${GREEN}✓ Sync processor restarted${NC}"
}

# Parse command
case "${1:-start}" in
    start)
        start_processor
        show_status
        ;;
    stop)
        stop_processor
        ;;
    restart)
        restart_processor
        ;;
    status)
        show_status
        ;;
    logs)
        view_logs
        ;;
    monitor)
        monitor_processor
        ;;
    startup)
        setup_startup
        ;;
    delete)
        delete_processor
        ;;
    *)
        echo "RoyaltyOS Sync Processor Manager"
        echo ""
        echo "Usage: $0 {start|stop|restart|status|logs|monitor|startup|delete}"
        echo ""
        echo "Commands:"
        echo "  start      - Start the sync processor daemon"
        echo "  stop       - Stop the sync processor"
        echo "  restart    - Restart the sync processor"
        echo "  status     - Show processor status and resource usage"
        echo "  logs       - View recent processor logs"
        echo "  monitor    - Monitor processor in real-time"
        echo "  startup    - Setup auto-restart on system reboot"
        echo "  delete     - Remove the processor from PM2"
        echo ""
        exit 1
        ;;
esac

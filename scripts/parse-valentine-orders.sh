#!/bin/bash
# Script to parse logs for Valentine's Day order notes
# Usage: ./parse-valentine-orders.sh [log-file-path] [order-number]

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default log locations to check
LOG_LOCATIONS=(
    "/var/log/nginx/access.log"
    "/var/log/nginx/error.log"
    "$HOME/.pm2/logs/wingside-out.log"
    "$HOME/.pm2/logs/wingside-error.log"
    "/var/log/syslog"
    "/var/log/messages"
)

# Function to search a specific log file
search_log() {
    local log_file=$1
    local search_pattern=$2

    if [ ! -f "$log_file" ]; then
        return
    fi

    echo -e "${BLUE}Searching in: $log_file${NC}"

    # Search for POST requests to /api/orders
    grep -i "POST.*\/api\/orders" "$log_file" | grep -i "$search_pattern" | head -20

    # Search for order items with notes
    grep -i "order_items\|orderItems" "$log_file" | grep -i "$search_pattern" | head -20

    # Search for Valentine-related content
    grep -i "valentine\|handwritten\|notes.*:" "$log_file" | grep -i "$search_pattern" | head -20
}

# Function to extract JSON from logs
extract_order_json() {
    local log_file=$1
    local order_number=$2

    echo -e "\n${YELLOW}Extracting order JSON for: $order_number${NC}\n"

    # Try to find complete JSON objects containing the order
    grep -o '{.*"order_number".*"'"$order_number"'".*}' "$log_file" 2>/dev/null | \
    python3 -m json.tool 2>/dev/null || \
    grep -o '{.*'"$order_number"'.*}' "$log_file" | head -1
}

# Main script
main() {
    local log_file=$1
    local order_number=$2
    local date_filter=${3:-"2026-02-13"}

    echo -e "${GREEN}=== Valentine's Order Notes Parser ===${NC}\n"

    if [ -z "$order_number" ]; then
        echo -e "${YELLOW}Usage: $0 [log-file] [order-number] [date]${NC}"
        echo -e "${YELLOW}   or: $0 auto [order-number]${NC} (searches common log locations)\n"
    fi

    # If 'auto' is specified, search all common locations
    if [ "$log_file" = "auto" ]; then
        echo -e "${BLUE}Searching common log locations...${NC}\n"

        for loc in "${LOG_LOCATIONS[@]}"; do
            if [ -f "$loc" ]; then
                echo -e "\n${GREEN}Found log: $loc${NC}"
                if [ -n "$order_number" ]; then
                    search_log "$loc" "$order_number"
                    extract_order_json "$loc" "$order_number"
                else
                    # Search for recent Valentine orders
                    search_log "$loc" "valentine\|2026-02-14\|handwritten"
                fi
            fi
        done

        # Check PM2 logs specifically
        if command -v pm2 &> /dev/null; then
            echo -e "\n${BLUE}Checking PM2 logs...${NC}"
            pm2 logs --lines 1000 --nostream | grep -i "valentine\|handwritten\|notes" | head -50
        fi

    elif [ -f "$log_file" ]; then
        # Search specific file
        if [ -n "$order_number" ]; then
            search_log "$log_file" "$order_number"
            extract_order_json "$log_file" "$order_number"
        else
            search_log "$log_file" "valentine\|2026-02-14\|handwritten"
        fi
    else
        echo -e "${RED}Log file not found: $log_file${NC}"
        echo -e "${YELLOW}Try: $0 auto [order-number]${NC}"
        exit 1
    fi

    echo -e "\n${GREEN}=== Search Complete ===${NC}"
    echo -e "${YELLOW}Tip: If you find JSON data, you can pipe it to: | python3 -m json.tool${NC}"
}

# Run main function
main "$@"

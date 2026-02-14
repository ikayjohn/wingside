#!/usr/bin/env node
/**
 * Parse logs for Valentine's Day order notes
 * Usage: node parse-valentine-orders.js [order-number]
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Common log locations
const LOG_LOCATIONS = [
  '/var/log/nginx/access.log',
  '/var/log/nginx/error.log',
  process.env.HOME + '/.pm2/logs/wingside-out.log',
  process.env.HOME + '/.pm2/logs/wingside-error.log',
  '/var/log/syslog',
  '/var/log/messages'
];

// Colors
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

function log(color, message) {
  console.log(`${color}${message}${colors.reset}`);
}

// Search a log file for order data
function searchLogFile(filePath, searchPattern) {
  if (!fs.existsSync(filePath)) {
    return null;
  }

  log(colors.blue, `\nSearching: ${filePath}`);

  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    const matches = [];

    lines.forEach((line, index) => {
      // Look for order-related content
      if (
        line.includes('POST') && line.includes('/api/orders') ||
        line.includes('order_items') ||
        line.includes('orderItems') ||
        line.includes('valentine') ||
        line.includes('handwritten') ||
        line.includes('notes')
      ) {
        if (searchPattern) {
          if (line.toLowerCase().includes(searchPattern.toLowerCase())) {
            matches.push({ line: index + 1, content: line });
          }
        } else {
          matches.push({ line: index + 1, content: line });
        }
      }
    });

    return matches;
  } catch (error) {
    log(colors.red, `Error reading ${filePath}: ${error.message}`);
    return null;
  }
}

// Extract JSON objects from log line
function extractJSON(line) {
  // Try to find JSON objects in the line
  const jsonMatches = line.match(/\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/g);
  if (jsonMatches) {
    return jsonMatches.map(json => {
      try {
        return JSON.parse(json);
      } catch {
        return null;
      }
    }).filter(Boolean);
  }
  return [];
}

// Main function
function main() {
  const orderNumber = process.argv[2];

  log(colors.green, '\n=== Valentine\'s Order Notes Parser ===\n');

  if (!orderNumber) {
    log(colors.yellow, 'Usage: node parse-valentine-orders.js [order-number]');
    log(colors.yellow, '   or: node parse-valentine-orders.js WS123456789\n');
  }

  const searchPattern = orderNumber || 'valentine';
  const allMatches = [];

  // Search all log locations
  for (const location of LOG_LOCATIONS) {
    const matches = searchLogFile(location, searchPattern);
    if (matches && matches.length > 0) {
      log(colors.green, `Found ${matches.length} matches in ${location}`);
      allMatches.push(...matches);

      // Display first few matches
      matches.slice(0, 5).forEach(match => {
        console.log(`  Line ${match.line}: ${match.content.substring(0, 200)}...`);

        // Try to extract JSON
        const jsonObjects = extractJSON(match.content);
        jsonObjects.forEach(obj => {
          if (obj.items || obj.order_items || obj.orderItems) {
            log(colors.yellow, '\n  Found order data:');
            console.log(JSON.stringify(obj, null, 2));
          }
        });
      });
    }
  }

  // Try PM2 logs if available
  try {
    log(colors.blue, '\nChecking PM2 logs...');
    const pm2Output = execSync('pm2 logs --lines 1000 --nostream 2>/dev/null', {
      encoding: 'utf8',
      timeout: 5000
    });

    const pm2Lines = pm2Output.split('\n').filter(line =>
      line.toLowerCase().includes(searchPattern.toLowerCase()) ||
      line.includes('notes') ||
      line.includes('valentine')
    );

    if (pm2Lines.length > 0) {
      log(colors.green, `Found ${pm2Lines.length} matches in PM2 logs`);
      pm2Lines.slice(0, 10).forEach(line => {
        console.log(`  ${line}`);
      });
    }
  } catch (error) {
    // PM2 not available or error - skip silently
  }

  if (allMatches.length === 0) {
    log(colors.red, '\nNo matches found in log files.');
    log(colors.yellow, 'The order data may not be logged, or logs may have been rotated.');
    log(colors.yellow, '\nTry asking the customer to check their browser localStorage:');
    log(colors.blue, '  1. Press F12 in browser');
    log(colors.blue, '  2. Application → Local Storage → your domain');
    log(colors.blue, '  3. Find "wingside-cart" key');
  } else {
    log(colors.green, `\n=== Found ${allMatches.length} total matches ===`);
  }
}

main();

#!/bin/bash
# Test PostgreSQL connection and diagnose issues

echo "=== Testing PostgreSQL connection ==="
PGPASSWORD="sms2024secure" psql -U postgres -h localhost -p 5432 -d sms_management -c "\dt" 2>&1

echo ""
echo "=== Checking pg_hba.conf ==="
cat /etc/postgresql/*/main/pg_hba.conf 2>/dev/null | grep -v "^#" | grep -v "^$"

echo ""
echo "=== Checking if sms_management DB exists ==="
sudo -u postgres psql -c "\l" | grep sms_management

echo ""
echo "=== Checking postgres user has password ==="
sudo -u postgres psql -c "SELECT usename, passwd IS NOT NULL as has_password FROM pg_shadow WHERE usename='postgres';"

echo ""
echo "=== PM2 logs last 20 lines ==="
pm2 logs sms-dashboard --lines 20 --nostream 2>&1

#!/bin/bash
# Run this ONCE on EC2 to install cloudflared and set up persistent tunnels
# for both the kiosk (port 80) and admin (port 8080) frontends.
#
# Usage: bash scripts/setup-tunnels.sh

set -e

echo "==> Installing cloudflared"
curl -fsSL https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb -o /tmp/cloudflared.deb
sudo dpkg -i /tmp/cloudflared.deb
rm /tmp/cloudflared.deb

echo "==> Creating systemd service for KIOSK tunnel (port 80)"
sudo tee /etc/systemd/system/sahayak-kiosk-tunnel.service > /dev/null <<'EOF'
[Unit]
Description=Cloudflare Tunnel - Sahayak Kiosk (port 80)
After=network.target docker.service
Wants=network.target

[Service]
Type=simple
User=ubuntu
ExecStart=/usr/local/bin/cloudflared tunnel --url http://localhost:80 --logfile /var/log/sahayak-kiosk-tunnel.log
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

echo "==> Creating systemd service for ADMIN tunnel (port 8080)"
sudo tee /etc/systemd/system/sahayak-admin-tunnel.service > /dev/null <<'EOF'
[Unit]
Description=Cloudflare Tunnel - Sahayak Admin (port 8080)
After=network.target docker.service
Wants=network.target

[Service]
Type=simple
User=ubuntu
ExecStart=/usr/local/bin/cloudflared tunnel --url http://localhost:8080 --logfile /var/log/sahayak-admin-tunnel.log
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

echo "==> Enabling and starting tunnels"
sudo systemctl daemon-reload
sudo systemctl enable sahayak-kiosk-tunnel sahayak-admin-tunnel
sudo systemctl start sahayak-kiosk-tunnel sahayak-admin-tunnel

echo ""
echo "==> Waiting 8 seconds for tunnels to come up..."
sleep 8

echo ""
echo "==> KIOSK tunnel URL:"
sudo journalctl -u sahayak-kiosk-tunnel --no-pager -n 20 | grep -o 'https://[^ ]*\.trycloudflare\.com' | tail -1

echo ""
echo "==> ADMIN tunnel URL:"
sudo journalctl -u sahayak-admin-tunnel --no-pager -n 20 | grep -o 'https://[^ ]*\.trycloudflare\.com' | tail -1

echo ""
echo "Done! Both tunnels are running and will auto-start on reboot."
echo "To check URLs again later run:"
echo "  sudo journalctl -u sahayak-kiosk-tunnel --no-pager | grep trycloudflare"
echo "  sudo journalctl -u sahayak-admin-tunnel  --no-pager | grep trycloudflare"

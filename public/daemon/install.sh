#!/bin/bash
set -e

echo "╔══════════════════════════════════════════════════════════╗"
echo "║       Price Alert Daemon — Installation                  ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""

INSTALL_DIR="/opt/price-alert-daemon"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
USER=$(whoami)

# Check dependencies
echo "📋 Checking dependencies..."
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is required."
    exit 1
fi
echo "   ✅ Node.js $(node --version)"

if ! command -v notify-send &> /dev/null; then
    echo "   ⚠️  notify-send not found. Installing..."
    sudo apt-get install -y libnotify-bin 2>/dev/null || sudo pacman -S --noconfirm libnotify 2>/dev/null || true
fi
echo "   ✅ notify-send available"

# Install daemon
echo "📦 Installing daemon..."
sudo mkdir -p "$INSTALL_DIR"
cd "$SCRIPT_DIR"
npm install
npm run build

# Create symlink
sudo ln -sf "$SCRIPT_DIR/dist/index.js" /usr/local/bin/price-alert
sudo chmod +x "$SCRIPT_DIR/dist/index.js"

# Create data directory
DATA_DIR="$HOME/.price-alert-daemon"
mkdir -p "$DATA_DIR"

if [ ! -f "$DATA_DIR/config.json" ]; then
    cat > "$DATA_DIR/config.json" << 'EOF'
{
  "port": 3456,
  "pollInterval": 10,
  "alerts": [],
  "soundEnabled": true,
  "notificationUrgency": "critical"
}
EOF
fi

echo ""
echo "╔══════════════════════════════════════════════════════════╗"
echo "║               ✅ Installation Complete!                  ║"
echo "╠══════════════════════════════════════════════════════════╣"
echo "║                                                          ║"
echo "║  Quick start:                                            ║"
echo "║    price-alert start          # Start daemon             ║"
echo "║    price-alert add CME_MINI:ES1! 5800 above  # Alert    ║"
echo "║    price-alert list           # View alerts              ║"
echo "║    price-alert status         # Check status             ║"
echo "║    price-alert symbols        # List all symbols         ║"
echo "║                                                          ║"
echo "║  Web UI: http://localhost:3456                           ║"
echo "║                                                          ║"
echo "╚══════════════════════════════════════════════════════════╝"

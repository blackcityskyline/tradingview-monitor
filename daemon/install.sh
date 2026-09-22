#!/bin/bash
set -e

# ═══════════════════════════════════════════════════════════════
#  Price Alert Daemon — Installation Script for Linux
# ═══════════════════════════════════════════════════════════════

INSTALL_DIR="/opt/price-alert-daemon"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
USER=$(whoami)

echo "╔══════════════════════════════════════════════════════════╗"
echo "║       Price Alert Daemon — Installation                  ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""

# ─── Check dependencies ───────────────────────────────────────
echo "📋 Checking dependencies..."

# Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is required. Install it:"
    echo "   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -"
    echo "   sudo apt install -y nodejs"
    exit 1
fi
echo "   ✅ Node.js $(node --version)"

# npm
if ! command -v npm &> /dev/null; then
    echo "❌ npm is required."
    exit 1
fi
echo "   ✅ npm $(npm --version)"

# notify-send
if ! command -v notify-send &> /dev/null; then
    echo "   ⚠️  notify-send not found. Installing libnotify-bin..."
    sudo apt-get install -y libnotify-bin 2>/dev/null || \
    sudo pacman -S --noconfirm libnotify 2>/dev/null || \
    sudo dnf install -y libnotify 2>/dev/null || \
    echo "   ⚠️  Could not auto-install. Please install manually."
fi
echo "   ✅ notify-send available"

# xdg-open
if ! command -v xdg-open &> /dev/null; then
    echo "   ⚠️  xdg-open not found. Installing xdg-utils..."
    sudo apt-get install -y xdg-utils 2>/dev/null || true
fi
echo "   ✅ xdg-utils available"

echo ""

# ─── Install daemon ───────────────────────────────────────────
echo "📦 Installing daemon..."

# Create install directory
sudo mkdir -p "$INSTALL_DIR"

# Copy daemon files
cd "$SCRIPT_DIR"
sudo cp -r . "$INSTALL_DIR/"
sudo chown -R "$USER:$USER" "$INSTALL_DIR"

# Install npm dependencies
cd "$INSTALL_DIR"
npm install
npm run build

echo "   ✅ Daemon installed to $INSTALL_DIR"
echo ""

# ─── Create CLI symlink ──────────────────────────────────────
echo "🔗 Creating CLI command..."
CLI_PATH="$INSTALL_DIR/dist/index.js"
sudo ln -sf "$CLI_PATH" /usr/local/bin/price-alert
sudo chmod +x "$CLI_PATH"
echo "   ✅ 'price-alert' command available globally"
echo ""

# ─── Create data directory ────────────────────────────────────
DATA_DIR="$HOME/.price-alert-daemon"
mkdir -p "$DATA_DIR"

# Create default config if not exists
if [ ! -f "$DATA_DIR/config.json" ]; then
    cat > "$DATA_DIR/config.json" << 'EOF'
{
  "port": 3456,
  "pollInterval": 10,
  "dataDir": "~/.price-alert-daemon",
  "pidFile": "/tmp/price-alert-daemon.pid",
  "logFile": "/tmp/price-alert-daemon.log",
  "alerts": [],
  "soundEnabled": true,
  "notificationUrgency": "critical"
}
EOF
    echo "   ✅ Default config created at $DATA_DIR/config.json"
fi
echo ""

# ─── Install systemd service (optional) ──────────────────────
echo "⚙️  Setting up systemd service..."
read -p "   Install as systemd user service? (y/N): " install_systemd
if [[ "$install_systemd" =~ ^[Yy]$ ]]; then
    mkdir -p "$HOME/.config/systemd/user"
    cp "$INSTALL_DIR/price-alert-daemon@.service" "$HOME/.config/systemd/user/price-alert-daemon.service"
    
    # Replace %i with actual username
    sed -i "s/%i/$USER/g" "$HOME/.config/systemd/user/price-alert-daemon.service"
    
    systemctl --user daemon-reload
    echo "   ✅ Systemd service installed"
    echo ""
    echo "   To start:  systemctl --user start price-alert-daemon"
    echo "   To enable: systemctl --user enable price-alert-daemon"
    echo "   To status: systemctl --user status price-alert-daemon"
else
    echo "   ℹ️  Skipped. You can start manually with: price-alert start"
fi
echo ""

# ─── Build web UI ─────────────────────────────────────────────
echo "🌐 Building web UI..."
if [ -f "$SCRIPT_DIR/../package.json" ]; then
    cd "$SCRIPT_DIR/.."
    npm install
    npm run build
    # Copy dist to daemon directory for serving
    cp -r dist "$INSTALL_DIR/dist"
    echo "   ✅ Web UI built and available at http://localhost:3456"
else
    echo "   ℹ️  Web UI source not found. Skipping."
fi
echo ""

# ─── Done ─────────────────────────────────────────────────────
echo "╔══════════════════════════════════════════════════════════╗"
echo "║               ✅ Installation Complete!                  ║"
echo "╠══════════════════════════════════════════════════════════╣"
echo "║                                                          ║"
echo "║  Quick start:                                            ║"
echo "║    price-alert start          # Start daemon             ║"
echo "║    price-alert add CME_MINI:ES1! 5800  # Add alert      ║"
echo "║    price-alert list           # View alerts              ║"
echo "║    price-alert status         # Check status             ║"
echo "║    price-alert test           # Test notification        ║"
echo "║    price-alert symbols        # List all symbols         ║"
echo "║                                                          ║"
echo "║  Web UI: http://localhost:3456                           ║"
echo "║                                                          ║"
echo "╚══════════════════════════════════════════════════════════╝"

#!/bin/bash
set -e

echo "🔨 Building Price Alert Daemon archive..."
echo ""

# Clean previous builds
echo "🧹 Cleaning previous builds..."
rm -rf dist daemon/dist daemon/node_modules

# Build daemon
echo "📦 Building daemon..."
cd daemon
npm install --silent
npm run build
cd ..

# Build web UI
echo "🌐 Building web UI..."
npm run build

# Create archive directory
ARCHIVE_DIR="price-alert-daemon"
rm -rf "$ARCHIVE_DIR"
mkdir -p "$ARCHIVE_DIR"

# Copy daemon files
echo "📋 Copying files..."
cp -r daemon/src "$ARCHIVE_DIR/"
cp -r daemon/dist "$ARCHIVE_DIR/"
cp daemon/package.json "$ARCHIVE_DIR/"
cp daemon/tsconfig.json "$ARCHIVE_DIR/"
cp daemon/install.sh "$ARCHIVE_DIR/"
cp daemon/price-alert-daemon@.service "$ARCHIVE_DIR/"
cp daemon/README.md "$ARCHIVE_DIR/"

# Copy web UI
cp -r dist "$ARCHIVE_DIR/web-ui"
cp index.html "$ARCHIVE_DIR/web-ui/" 2>/dev/null || true

# Create archive
echo "📦 Creating archive..."
tar -czf price-alert-daemon.tar.gz "$ARCHIVE_DIR"

# Cleanup
rm -rf "$ARCHIVE_DIR"

# Get archive size
SIZE=$(du -h price-alert-daemon.tar.gz | cut -f1)

echo ""
echo "✅ Archive created successfully!"
echo "   File: price-alert-daemon.tar.gz"
echo "   Size: $SIZE"
echo ""
echo "📦 To extract and install:"
echo "   tar -xzf price-alert-daemon.tar.gz"
echo "   cd price-alert-daemon"
echo "   chmod +x install.sh"
echo "   ./install.sh"
echo ""

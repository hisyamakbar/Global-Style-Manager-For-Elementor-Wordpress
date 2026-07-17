#!/usr/bin/env bash
# Builds a clean, installable WordPress plugin zip in dist/ — runtime files only,
# no dev tooling (node_modules, .claude, CLAUDE.md, package.json, etc.).
set -euo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")/.."

SLUG="global-style-manager"
VERSION=$(grep -m1 "GSM_VER" global-style-manager.php | grep -oE "[0-9]+\.[0-9]+\.[0-9]+")

if [ -z "$VERSION" ]; then
    echo "Could not read version from global-style-manager.php" >&2
    exit 1
fi

BUILD_DIR="dist/${SLUG}"
ZIP_PATH="dist/${SLUG}-${VERSION}.zip"

rm -rf "dist"
mkdir -p "$BUILD_DIR"

cp global-style-manager.php "$BUILD_DIR/"
cp README.md "$BUILD_DIR/"
cp -R includes "$BUILD_DIR/"
cp -R views "$BUILD_DIR/"
cp -R assets "$BUILD_DIR/"

find "$BUILD_DIR" -name ".DS_Store" -delete

(cd dist && zip -rq "${SLUG}-${VERSION}.zip" "${SLUG}")
rm -rf "$BUILD_DIR"

echo "Built ${ZIP_PATH}"

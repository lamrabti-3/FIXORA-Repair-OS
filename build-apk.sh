#!/usr/bin/env bash
set -euo pipefail

echo "=== FIXORA APK BUILD ==="

npm install --no-audit --no-fund

if [ ! -d "android" ]; then
    npx cap add android
fi

node scripts/prepare-android.mjs

npx cap sync android

cd android
chmod +x gradlew

./gradlew assembleDebug --no-daemon

cd ..

echo
echo "=== BUILD SUCCESSFUL ==="
echo "APK: android/app/build/outputs/apk/debug/app-debug.apk"

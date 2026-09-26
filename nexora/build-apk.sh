#!/usr/bin/env bash
set -euo pipefail
npm install --no-audit --no-fund
npx cap add android
npx @capacitor/assets generate --android
node scripts/prepare-android.mjs
npx cap sync android
(cd android && ./gradlew assembleDebug --no-daemon)
echo "APK: android/app/build/outputs/apk/debug/app-debug.apk"

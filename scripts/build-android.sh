#!/usr/bin/env bash
# scripts/build-android.sh
# Builds a signed/unsigned Android APK via Capacitor.
# Prerequisites:
#   - Android Studio + SDK installed (ANDROID_HOME set)
#   - Java 17+ on PATH
#   - npm run build already run (Next.js static export in ./out)
#   - npx cap sync already run

set -euo pipefail

echo "📦 Building Next.js static export..."
npm run build

echo "🔄 Syncing Capacitor assets..."
npx cap sync android

echo "🤖 Building Android APK (debug)..."
cd android
./gradlew assembleDebug

APK_PATH="app/build/outputs/apk/debug/app-debug.apk"
if [ -f "$APK_PATH" ]; then
  echo "✅ APK built successfully:"
  echo "   $(realpath $APK_PATH)"
else
  echo "❌ APK not found at expected path"
  exit 1
fi

echo ""
echo "To install on a connected device:"
echo "  adb install $APK_PATH"

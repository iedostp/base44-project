#!/bin/bash
# setup-and-build.sh — Run this AFTER installing JDK 17 with sudo
# Usage: bash android/setup-and-build.sh

set -e

export ANDROID_HOME=$HOME/android-sdk
export PATH=$PATH:$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools

echo "==> Java version"
java -version

echo ""
echo "==> Accepting SDK licenses..."
yes | sdkmanager --licenses > /dev/null 2>&1 || true

echo ""
echo "==> Installing SDK packages (build-tools, platform)..."
sdkmanager "platform-tools" "build-tools;34.0.0" "platforms;android-34"

echo ""
echo "==> Creating debug keystore (if missing)..."
KEYSTORE_PATH="$(dirname "$0")/debug.keystore"
if [ ! -f "$KEYSTORE_PATH" ]; then
    keytool -genkeypair \
        -alias debug \
        -keypass android \
        -keystore "$KEYSTORE_PATH" \
        -storepass android \
        -dname "CN=Debug, O=Debug, C=US" \
        -keyalg RSA \
        -keysize 2048 \
        -validity 10000
    echo "Keystore created at $KEYSTORE_PATH"
else
    echo "Keystore already exists, skipping."
fi

echo ""
echo "==> Building debug APK..."
cd "$(dirname "$0")"
./gradlew assembleDebug

APK_PATH="app/build/outputs/apk/debug/app-debug.apk"
echo ""
echo "==> APK built: $APK_PATH"

# Copy to Windows Desktop
WIN_USER=$(cmd.exe /c "echo %USERNAME%" 2>/dev/null | tr -d '\r')
DESKTOP="/mnt/c/Users/$WIN_USER/Desktop"
if [ -d "$DESKTOP" ]; then
    cp "$APK_PATH" "$DESKTOP/BonimBayit.apk"
    echo "==> Copied to Windows Desktop: $DESKTOP/BonimBayit.apk"
else
    echo "==> Desktop not found at $DESKTOP — copy APK manually from:"
    echo "    $(realpath $APK_PATH)"
fi

echo ""
echo "Done! Install BonimBayit.apk on your phone."

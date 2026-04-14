# Booker App - Complete Build & Deployment Guide

This guide covers building and deploying the Booker app for both Android and iOS platforms, including local testing and store submissions.

---

## 📋 Overview

| Platform | Format | Purpose | Command |
|----------|--------|---------|---------|
| **Android** | APK | Local testing & development | `npm run build:apk` |
| **Android** | AAB | Google Play Store submission | `npm run build:aab-android` |
| **iOS** | IPA | Local testing & device installation | `npm run build:ipa` |
| **iOS** | AAB/Archive | App Store submission | `npm run build:appstore` |

---

## 🚀 Quick Start - Local Testing

### For Android (APK)
```bash
npm run build:apk
```
**What it does:** Builds an APK that can be installed directly on Android devices for testing.

### For iOS (IPA)
```bash
npm run build:ipa
```
**What it does:** Builds an IPA for device testing and TestFlight distribution.

---

## 📱 Development & Local Running

### Option 1: Expo Go (Fastest)
Test your app in the Expo Go app without building:
```bash
npm start
```
Then scan the QR code with your phone's camera (Expo Go app on iPhone, or Google Play on Android).

### Option 2: Run on Native Devices

**Android with Android Studio:**
```bash
npm run dev:android
```

**iOS with Xcode:**
```bash
npm run dev:ios
```

---

## 🔧 Prerequisites

### Install EAS CLI
```bash
npm install -g eas-cli
```

### Login to EAS
```bash
eas login
```
You'll need a free Expo account. Create one at https://expo.dev

### Check Your Setup
```bash
eas diagnostics
```

---

## 🏗️ Building Locally vs Cloud

### Cloud Build (Recommended - No Local Setup Required)
Uses Expo's servers to build your app:
```bash
# Android APK
npm run build:apk

# iOS IPA
npm run build:ipa

# Android AAB (for Play Store)
npm run build:aab-android

# iOS Archive (for App Store)
npm run build:appstore
```

**Prerequisites:** EAS login only

### Local Build (Advanced - Requires SDK Setup)
Build on your machine (requires Android SDK/Xcode):
```bash
# Android (requires Android SDK)
npm run build:apk -- --local

# iOS (requires Xcode & macOS)
npm run build:ipa -- --local
```

**Prerequisites:** 
- Android SDK (for Android builds)
- Xcode (for iOS builds on macOS)

---

## 📦 Android Deployment

### Step 1: Generate APK for Testing

```bash
npm run build:apk
```

**Output:** An APK file you can download and install on any Android device via USB or email.

**Installation:**
```bash
# Via ADB (Android Debug Bridge)
adb install app-release.apk

# Or manually: Download APK, transfer to phone, tap to install
```

---

### Step 2: Generate AAB for Google Play Store

```bash
npm run build:aab-android
```

**What is AAB?**
- Android App Bundle format
- Required for Play Store since 2021
- Automatically generates optimized APKs for each device
- Smaller downloads and better performance

**Prepare for Submission:**

1. **Create a Google Play Developer Account**
   - Go to https://play.google.com/console
   - Pay $25 one-time registration fee
   - Set up store listing

2. **Generate Signing Key** (if not already done)
   ```bash
   # EAS handles this automatically on first build
   # You'll see a prompt to generate a signing key
   ```

3. **Create Release Build**
   ```bash
   npm run build:playstore
   ```

4. **Download AAB from EAS Dashboard**
   - Go to https://expo.dev
   - Find your build in the builds section
   - Download the `.aab` file

5. **Upload to Google Play Console**
   - Open Google Play Console → Your App
   - Go to "Releases" → "Production" (or Testing)
   - Click "Create Release"
   - Upload the AAB file
   - Review and publish

---

### Step 3: Submit to Play Store Automatically (Optional)

If you've configured your service account:
```bash
npm run submit:playstore
```

**Setup (One-time):**
1. Create Google Play service account at https://play.google.com/console
2. Download the JSON key file
3. Save it to `~/.android/service-account-key.json`
4. Run the submit command above

---

## 🍎 iOS Deployment

### Step 1: Generate IPA for Testing

```bash
npm run build:ipa
```

**What is IPA?**
- iOS Package Archive
- For testing on physical devices via TestFlight or direct installation
- Requires device registration

**Installation Options:**

**Option A: TestFlight (Recommended)**
- No device registration needed
- Users get beta updates automatically
- Built-in feedback collection

**Option B: Direct Installation**
- Requires signing certificate and provisioning profile
- Device must be registered in your Apple Developer account

---

### Step 2: Generate for App Store Submission

```bash
npm run build:appstore
```

This creates an archive optimized for App Store submission.

---

### Step 3: Submit to App Store

**Setup (One-time):**

1. **Enroll in Apple Developer Program**
   - Go to https://developer.apple.com/programs
   - Pay $99/year
   - Enroll as Individual or Company

2. **Create App Record in App Store Connect**
   - Go to https://appstoreconnect.apple.com
   - Click "My Apps"
   - Click "+" → "New App"
   - Fill in:
     - Platform: iOS
     - App Name: "Booker"
     - Bundle ID: `com.bookerapp.inventory` (from app.json)
     - SKU: Create any unique ID

3. **Create Signing Certificate** (if needed)
   ```bash
   # Option A: EAS handles automatic signing
   # First build will prompt you to create certificate
   
   # Option B: Manual signing via Xcode
   # This is handled by EAS automatically on first iOS build
   ```

4. **Build and Get Ready for Submission**
   ```bash
   npm run build:appstore
   ```

5. **Download and Validate the Archive**
   - Download from EAS Dashboard
   - Use Xcode to validate (optional)

6. **Upload to App Store Connect**
   ```bash
   npm run submit:appstore
   ```
   
   OR manually:
   - Open App Store Connect
   - Select your app
   - Go to "TestFlight" or "App Store"
   - Click "+" for new build
   - Upload the archive

7. **Fill App Info & Submit for Review**
   - Add screenshots, description, keywords
   - Set rating/maturity
   - Add release notes
   - Set pricing
   - Click "Submit for Review"
   - Apple reviews in 1-2 days

---

### Step 4: TestFlight Beta Testing (Optional but Recommended)

Perfect for getting user feedback before App Store release:

1. **Generate Build**
   ```bash
   npm run build:ipa
   ```

2. **Upload to TestFlight**
   ```bash
   npm run submit:appstore
   ```

3. **Invite Testers in App Store Connect**
   - Go to TestFlight tab
   - Click Internal Testing or External Testing
   - Add tester email addresses
   - Testers get invitation link

4. **Collect Feedback**
   - Users test on their devices
   - Send feedback via TestFlight
   - Fix issues before launch

---

## 🔐 Signing & Certificates

### Android Signing (Automatic via EAS)
```bash
# First time you build, EAS will ask:
# "Do you want to create a new Android Keystore?"
# Select YES and answer the prompts
# EAS stores it securely and uses it for future builds
```

### iOS Signing (Automatic via EAS)
```bash
# First time you build, EAS will ask about:
# 1. Distribution Certificate
# 2. Provisioning Profile
# Select "Let EAS handle this" for automatic setup
```

---

## 📊 Build Status & Downloads

### Monitor Builds
```bash
# View build status
eas build:list
```

### Download Artifacts
1. Go to https://expo.dev/dashboard
2. Click your app
3. Click "Builds"
4. Click the build you want
5. Download the APK/IPA file

---

## 🐛 Troubleshooting

### Build Fails with "EAS not logged in"
```bash
eas logout
eas login  # Re-authenticate
```

### Android Build Stuck
- Check `eas build:list` for status
- Try canceling and rebuilding: `eas build --platform android --profile local-android-apk --clear`

### iOS Build Fails on Distribution Certificate
```bash
# Reset signing credentials
eas credentials --platform ios --clear
# Then rebuild - EAS will create new certificates
```

### APK Won't Install on Device
- Ensure old version is uninstalled
- Enable "Unknown Sources" in Android Settings
- Check: `adb devices` to see connected devices
- Reinstall: `adb install -r app-release.apk`

### TestFlight Build Not Showing
- Verify app is on App Store Connect
- Wait 15 mins for processing
- Check build hasn't been rejected by Apple
- Ensure bundle ID matches in app.json

---

## 📝 Command Reference

### Development
```bash
npm start              # Run locally in Expo Go
npm run dev:android   # Android emulator
npm run dev:ios       # iOS simulator
npm run test:local    # Local testing (same as start)
```

### Building
```bash
npm run build:apk     # Android APK (testing)
npm run build:ipa     # iOS IPA (testing)
npm run build:ipa-sim # iOS simulator build
npm run build:aab-android        # Android AAB (Play Store)
npm run build:appstore           # iOS App Store build
npm run build:playstore          # Android Play Store
npm run build:preview            # Preview build (all platforms)
```

### Deployment
```bash
npm run submit:playstore   # Auto-submit to Play Store
npm run submit:appstore    # Auto-submit to App Store
```

---

## ✅ Pre-Launch Checklist

Before submitting to stores, verify:

- [ ] App name and description are finalized
- [ ] App icon is set (512x512 PNG in assets/)
- [ ] Splash screen is set (in app.json)
- [ ] All screens tested and working
- [ ] Dark mode toggle tested
- [ ] Inventory add/edit/delete working
- [ ] Transactions view working
- [ ] Reports generating correctly
- [ ] Settings screen functioning
- [ ] No console errors on build
- [ ] All images load properly
- [ ] No hardcoded URLs or API keys
- [ ] Permissions properly requested
- [ ] Privacy policy written and linked
- [ ] Confirm app version labels are correct (`expo.version` / `runtimeVersion` in app.json)

---

## 🎯 Typical Development Workflow

### Daily Development
```bash
npm start        # Run locally
# Make changes
# Test in Expo Go app
```

### Before TestFlight
```bash
npm run build:ipa
npm run submit:appstore
# Share TestFlight link with testers
# Collect feedback
# Fix issues
```

### Before Play Store
```bash
npm run build:aab-android
npm run submit:playstore
```

### Before App Store Release
```bash
npm run build:appstore
npm run submit:appstore
# Fill in App Store metadata
# Submit for review
```

---

## 📚 Additional Resources

- **Expo Docs:** https://docs.expo.dev
- **EAS Build Docs:** https://docs.expo.dev/build/introduction
- **Google Play Store Setup:** https://developer.android.com/google-play/console
- **App Store Connect:** https://appstoreconnect.apple.com
- **App Store Review Guidelines:** https://developer.apple.com/app-store/review/guidelines

---

## 💡 Quick Tips

1. **Use EAS Cloud Builds** - No local setup needed, more reliable
2. **Sign Up for Apple Developer** - Required for iOS, do this early
3. **Test on TestFlight First** - Catch issues before App Store review
4. **Monitor Build Sizes** - AAB should be < 100MB for store approval
5. **Keep Signing Credentials Safe** - EAS manages these securely
6. **Version Your Builds** - Build numbers auto-increment via EAS (`eas.json`); only update `expo.version` / `runtimeVersion` when needed
7. **Save Release Notes** - Document changes for each store submission

---

**Last Updated:** February 2026  
**Booker App Version:** 1.0.0  
**Expo SDK:** 49.0.0

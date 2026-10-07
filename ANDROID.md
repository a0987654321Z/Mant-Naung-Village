# Android application

The web application is packaged as a native Android app with Capacitor.

## Build a debug APK

Install Android Studio with Android SDK 36 and Java 21, then run:

```sh
pnpm install
pnpm android:apk
```

The APK is written to:

```text
android/app/build/outputs/apk/debug/app-debug.apk
```

Alternatively, run the **Build Android APK** workflow from the repository's
GitHub Actions page and download the `mant-naung-village-debug-apk` artifact.

## Open in Android Studio

```sh
pnpm android:sync
pnpm android:open
```

Create a private signing key in Android Studio before producing a release APK
or Android App Bundle. Never commit a signing key or its passwords.

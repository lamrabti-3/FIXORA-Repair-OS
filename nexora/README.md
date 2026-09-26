# FIXORA — Mobile Repair Business OS

FIXORA is a mobile-first repair-shop workspace designed for phone technicians. It works as a PWA and is structured to be wrapped as an Android application with Capacitor.

## What changed in v2.0

The project was refocused from a generic personal dashboard into a practical phone-repair workbench:

- Repair orders with automatic job numbers (`FX-YYMM-0001` style)
- Customer files and customer repair history
- 12-point intake/diagnostic checklist
- Status workflow: received → diagnosis → waiting for part → repair → ready → delivered
- Priority levels and expected delivery dates
- Parts inventory with SKU, compatibility, cost, sale price, supplier, minimum stock and quantity adjustment
- Local finance/cashbook with income and expenses
- Repair ticket printing
- Profit and sales-margin calculators
- Knowledge base for repair procedures, software notes and technician tips
- Global search across jobs, customers, parts and notes
- Local JSON backup/import
- Offline PWA caching
- Dark technician-oriented UI
- Android/Capacitor build workflow and icon/splash resources

## Data and privacy

The v2 app stores its operational data in browser/app local storage. The project does not include a remote database or analytics SDK. The app deliberately tells technicians not to store device unlock passwords or similar secrets in repair notes.

This matters for the eventual Play listing: Data Safety and the privacy policy must describe the actual shipped build. Google notes that data accessed only on-device and not sent off-device does not need to be declared as “collected” in the Data Safety section, but the developer still has to provide truthful disclosures. See the official Play guidance before submission.

## Run as a website/PWA

```bash
python3 -m http.server 8080
```

Then open `http://localhost:8080`.

For a production HTTPS deployment, host the folder on a static host such as GitHub Pages, Cloudflare Pages, Netlify or another HTTPS host.

## Build Android

The repository contains a GitHub Actions workflow at `.github/workflows/android.yml`.

It:
1. Installs Node 22 and Java 21.
2. Installs Capacitor 8.5.2.
3. Generates the Android project.
4. Generates Android icons/splash assets.
5. Forces compile/target API 36.
6. Builds a debug APK.
7. Builds a release AAB.

Google Play currently requires new apps and updates submitted from 31 August 2026 to target Android 16 / API 36 or higher. New apps on Google Play are published using Android App Bundle (AAB), not a standalone APK.

## Local Android build

```bash
./build-apk.sh
```

The debug APK is produced at:

`android/app/build/outputs/apk/debug/app-debug.apk`

The release bundle is produced by:

```bash
cd android
./gradlew bundleRelease
```

The Play upload should be a properly signed AAB. For a real production key, configure your own keystore and upload credentials; never commit the keystore or passwords into this repository.

## Google Play path

You need a verified Google Play developer account. Google currently requires the account owner to be at least 18 years old. A personal account created after 13 November 2023 must also complete a closed test with at least 12 opted-in testers continuously for 14 days before production access can be requested. The standard developer registration fee is a one-time US$25.

Because the current user is under 18, the final Play Console publishing step cannot be completed under their own developer account yet. The project can still be developed, built and privately tested now.

Before publication you will also need:

- Signed AAB
- App icon and store graphics
- Screenshots
- Store title and description
- Support contact
- Public privacy-policy URL
- Accurate Data Safety declarations
- Content rating and other Play Console declarations
- Closed testing and production-access approval when applicable

## Changing the app name

The brand is **FIXORA** and the Android application ID is `com.fixora.mobile`.

Change the visible name in:

- `index.html`
- `manifest.webmanifest`
- `capacitor.config.json`
- `privacy-policy.html`
- `docs/PLAY_STORE.md`

The application ID should not be changed casually after publishing because it identifies the Android package.

## Recommended next product upgrades

The architecture is intentionally ready for a later cloud version. Good candidates are optional cloud backup, multi-technician accounts, role permissions, supplier purchase orders, customer WhatsApp templates, barcode/QR inventory, photo attachments stored in IndexedDB/native files, invoice numbering, and a repair-time analytics dashboard.

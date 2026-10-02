# PWA Icons Setup

You need to generate PNG icons from the SVG file at `public/icons/icon.svg`.

## Option 1: Use Online Tool (Recommended)

1. Go to https://realfavicongenerator.net/
2. Upload the `public/icons/icon.svg` file
3. Configure settings for Android, iOS, and Windows
4. Download and extract to `public/icons/`

## Option 2: Use Sharp/Node Script

Run this in the project root:

```bash
npm install sharp --save-dev
node scripts/generate-icons.js
```

## Required Icon Sizes

Generate these sizes:
- 72x72
- 96x96
- 128x128
- 144x144
- 152x152
- 192x192
- 384x384
- 512x512

## Android TWA Configuration

Add to your `public/.well-known/assetlinks.json`:

```json
[
  {
    "relation": ["delegate_permission/common.handle_all_urls"],
    "target": {
      "namespace": "android_app",
      "package_name": "app.beegoo.sms",
      "sha256_cert_fingerprints": ["YOUR_APP_SIGNING_CERT_SHA256"]
    }
  }
]
```

## iOS Configuration

The manifest.json already includes:
- `apple-mobile-web-app-capable`
- `apple-mobile-web-app-status-bar-style`
- Apple touch icons

Users can add to home screen from Safari.

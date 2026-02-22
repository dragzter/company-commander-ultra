# Building for iOS (Capacitor)

The app is wrapped with [Capacitor](https://capacitorjs.com/) so you can build and run it as a native iOS app from Xcode.

## Prerequisites

- Xcode (Mac)
- iOS Simulator or a device
- CocoaPods (`brew install cocoapods` or see [Capacitor environment setup](https://capacitorjs.com/docs/getting-started/environment-setup))

## Workflow

1. **Build the web app and sync to iOS**
   ```bash
   npm run cap:sync
   ```
   This runs `npm run build` then copies `dist/` into the iOS project.

2. **Open in Xcode**
   ```bash
   npm run cap:open
   ```
   Opens `ios/App/App.xcworkspace` in Xcode. From there you can:
   - Select a simulator or your device
   - Set signing & capabilities
   - Run (▶) or archive for TestFlight/App Store

3. **After changing web code**
   Run `npm run cap:sync` again, then run from Xcode (or use “Run” again). The native project serves the files from `ios/App/App/public`.

## Config

- **App ID:** `com.companycommander.ultra` (edit in `capacitor.config.ts` if you need to change it)
- **Web output:** `dist/` (Vite build; `base: './'` is set so assets load in the native shell)

## Notes

- The `ios/` folder is the native Xcode project. You can change signing, capabilities, and icons there.
- To add native plugins later: `npm install <plugin>`, then `npm run cap:sync`.

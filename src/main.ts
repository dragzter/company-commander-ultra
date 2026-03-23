import "./style/style.css";
import "./style/animate.css";
import "./utils/name-utils.ts";
import "./game";
import "@fontsource/roboto-mono/100.css";
import "@fontsource/roboto-mono/200.css";
import "@fontsource/roboto-mono/300.css";
import "@fontsource/roboto-mono/400.css";
import "@fontsource/roboto-mono/500.css";
import "@fontsource/roboto-mono/600.css";
import "@fontsource/roboto-mono/700.css";
import { Capacitor } from "@capacitor/core";
import { SplashScreen } from "@capacitor/splash-screen";

type ScreenOrientationWithLock = ScreenOrientation & {
  lock?: (
    orientation:
      | "any"
      | "natural"
      | "landscape"
      | "portrait"
      | "portrait-primary"
      | "portrait-secondary"
      | "landscape-primary"
      | "landscape-secondary",
  ) => Promise<void>;
};

const tryLockPortrait = async (): Promise<void> => {
  try {
    const orientationApi = screen.orientation as ScreenOrientationWithLock;
    if (typeof orientationApi?.lock === "function") {
      await orientationApi.lock("portrait");
    }
  } catch {
    // Some browsers/iOS contexts reject orientation lock calls; ignore.
  }
};

void tryLockPortrait();
document.addEventListener(
  "visibilitychange",
  () => {
    if (document.visibilityState === "visible") void tryLockPortrait();
  },
  { passive: true },
);

// Prevent iOS/Safari double-tap zoom from hijacking rapid game taps.
let lastTouchEndAt = 0;
document.addEventListener(
  "touchend",
  (e) => {
    const now = Date.now();
    if (now - lastTouchEndAt <= 320) e.preventDefault();
    lastTouchEndAt = now;
  },
  { passive: false },
);

const hideNativeSplashWhenReady = async (): Promise<void> => {
  try {
    const platform = Capacitor.getPlatform();
    if (platform !== "ios" && platform !== "android") return;
    // Let the first app frame commit before dismissing native splash.
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    await SplashScreen.hide();
  } catch {
    // Ignore if plugin is unavailable in web/dev contexts.
  }
};

if (document.readyState === "complete") {
  window.setTimeout(() => {
    void hideNativeSplashWhenReady();
  }, 40);
} else {
  window.addEventListener(
    "load",
    () => {
      window.setTimeout(() => {
        void hideNativeSplashWhenReady();
      }, 40);
    },
    { once: true },
  );
}

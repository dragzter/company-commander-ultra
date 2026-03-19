import "./style/style.css";
import "./style/animate.css";
import "./utils/name-utils.ts";

import "./game";

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

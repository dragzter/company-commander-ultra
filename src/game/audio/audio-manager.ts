import { URLReader } from "../../utils/url-reader.ts";

function AudioManager() {
  const GLOBAL_AUDIO_GAIN = 0.9;
  const intro = new Audio("audio/theme/intro_2.m4a");
  const setupTrack = new Audio("audio/theme/A-Dangerous-Plan.m4a");
  const combatTracks = [
    new Audio("audio/theme/combat1.m4a"),
    new Audio("audio/theme/combat2.m4a"),
  ];
  const victoryTrack = new Audio("audio/theme/victory.m4a");
  const defeatTrack = new Audio("audio/theme/defeat.m4a");
  const buttonClickPool = Array.from(
    { length: 6 },
    () => new Audio("audio/theme/button_click.m4a"),
  );
  const itemSwapPool = Array.from(
    { length: 4 },
    () => new Audio("audio/theme/slick_swap.m4a"),
  );
  const itemSwapFallbackPool = Array.from(
    { length: 4 },
    () => new Audio("audio/theme/click_swap.m4a"),
  );
  const suppressPool = Array.from(
    { length: 5 },
    () => new Audio("audio/weapons/heavy_suppress.m4a"),
  );
  const fragImpactPool = Array.from(
    { length: 4 },
    () => new Audio("audio/weapons/frag_grenade.m4a"),
  );
  const flashbangImpactPool = Array.from(
    { length: 4 },
    () => new Audio("audio/weapons/flashbang.m4a"),
  );
  const smokeImpactPool = Array.from(
    { length: 4 },
    () => new Audio("audio/weapons/smoke.wav"),
  );
  const medevacPool = Array.from(
    { length: 3 },
    () => new Audio("audio/weapons/medevac.m4a"),
  );
  const takeCoverPool = Array.from(
    { length: 3 },
    () => new Audio("audio/weapons/take_cover.m4a"),
  );
  const reloadPool = Array.from(
    { length: 3 },
    () => new Audio("audio/weapons/reload.m4a"),
  );
  const deathGruntPool = [
    new Audio("audio/weapons/death_grunt.m4a"),
    new Audio("audio/weapons/death_grunt2.m4a"),
    new Audio("audio/weapons/death_grunt3.m4a"),
  ];
  const bandagePool = Array.from(
    { length: 3 },
    () => new Audio("audio/weapons/bandage.m4a"),
  );
  const knifeImpactPool = Array.from(
    { length: 4 },
    () => new Audio("audio/weapons/knife_impact.m4a"),
  );
  let knifeImpactPoolIndex = 0;
  const WEAPON_SHOT_DEFAULT = "audio/weapons/mg_burst_1.m4a";
  const weaponShotPools = new Map<string, HTMLAudioElement[]>();
  const weaponShotPoolIndexBySrc = new Map<string, number>();
  const sfxPoolIndexByName = new Map<string, number>();
  const sfxLastPlayedAtByKey = new Map<string, number>();
  const sfxBurstTimestampsMs: number[] = [];
  const sfxCutoffTimeoutByElement = new WeakMap<HTMLAudioElement, number>();
  let weaponShotSequence = 0;
  let currentCombatTrack: HTMLAudioElement | null = null;
  let lastCombatTrackIndex = -1;
  let combatMixActive = false;
  let lastButtonClickAt = 0;
  let audioPrimed = false;
  let primingInFlight = false;
  let gestureUnlockBound = false;
  let musicEnabled = true;
  let sfxEnabled = true;
  let appInBackground = false;
  let lifecycleBound = false;
  const urlReader = URLReader;
  const SFX_BURST_WINDOW_MS = 140;
  const SFX_BURST_LIMIT = 8;
  const SFX_GLOBAL_MIN_INTERVAL_MS = 12;
  const WEAPON_GLOBAL_MIN_INTERVAL_MS = 30;
  const WEAPON_PER_SRC_MIN_INTERVAL_MS = 78;
  const COMBAT_WEAPON_GLOBAL_MIN_INTERVAL_MS = 95;
  const COMBAT_WEAPON_PER_SRC_MIN_INTERVAL_MS = 130;
  const WEB_AUDIO_ENABLED = true;
  const WEB_AUDIO_MAX_ACTIVE_VOICES = 14;
  const webAudioBufferCache = new Map<string, AudioBuffer>();
  const webAudioBufferLoading = new Set<string>();
  const webAudioActiveSources = new Set<AudioBufferSourceNode>();
  let webAudioContext: AudioContext | null = null;
  let webAudioMasterGain: GainNode | null = null;

  function nextFromPool(
    name: string,
    pool: HTMLAudioElement[],
    allowSteal = false,
  ): HTMLAudioElement | null {
    const last = sfxPoolIndexByName.get(name) ?? 0;
    for (let i = 0; i < pool.length; i++) {
      const idx = (last + i) % pool.length;
      const candidate = pool[idx];
      const endedish =
        candidate.ended ||
        candidate.paused ||
        !Number.isFinite(candidate.duration) ||
        candidate.currentTime >= Math.max(0, candidate.duration - 0.05);
      if (endedish) {
        sfxPoolIndexByName.set(name, (idx + 1) % pool.length);
        return candidate;
      }
    }
    if (allowSteal) {
      sfxPoolIndexByName.set(name, (last + 1) % pool.length);
      return pool[last];
    }
    return null;
  }

  function playFromPool(
    name: string,
    pool: HTMLAudioElement[],
    volume: number,
    playbackRate = 1,
    startOffset = 0,
    allowSteal = false,
    maxDurationMs = 0,
    skipGate = false,
  ): void {
    if (appInBackground) return;
    if (!skipGate && !canPlaySfx(name, SFX_GLOBAL_MIN_INTERVAL_MS)) return;
    const sfx = nextFromPool(name, pool, allowSteal);
    if (!sfx) return;
    const priorTimeout = sfxCutoffTimeoutByElement.get(sfx);
    if (priorTimeout != null) {
      window.clearTimeout(priorTimeout);
      sfxCutoffTimeoutByElement.delete(sfx);
    }
    sfx.playbackRate = playbackRate;
    sfx.volume = Math.max(0, Math.min(1, volume));
    sfx.currentTime = Math.max(0, startOffset);
    void sfx.play().catch(() => {
      // Ignore transient autoplay/channel errors.
    });
    if (maxDurationMs > 0) {
      const timeoutId = window.setTimeout(() => {
        sfx.pause();
        sfx.currentTime = 0;
        sfxCutoffTimeoutByElement.delete(sfx);
      }, maxDurationMs);
      sfxCutoffTimeoutByElement.set(sfx, timeoutId);
    }
  }

  function trimSfxBurst(nowMs: number): void {
    while (
      sfxBurstTimestampsMs.length > 0 &&
      nowMs - sfxBurstTimestampsMs[0] > SFX_BURST_WINDOW_MS
    ) {
      sfxBurstTimestampsMs.shift();
    }
  }

  function canPlaySfx(
    key: string,
    minIntervalMs: number,
    bypassBurstLimit = false,
  ): boolean {
    if (isSfxDisabled() || appInBackground) return false;
    const nowMs = performance.now();
    const lastAt = sfxLastPlayedAtByKey.get(key) ?? -Infinity;
    if (nowMs - lastAt < minIntervalMs) return false;
    trimSfxBurst(nowMs);
    if (!bypassBurstLimit && sfxBurstTimestampsMs.length >= SFX_BURST_LIMIT)
      return false;
    sfxLastPlayedAtByKey.set(key, nowMs);
    sfxBurstTimestampsMs.push(nowMs);
    return true;
  }

  function primeAudioNow(): void {
    if (audioPrimed || primingInFlight) return;
    primingInFlight = true;
    const warm = [
      ...buttonClickPool,
      ...itemSwapPool,
      ...itemSwapFallbackPool,
      ...suppressPool,
      ...fragImpactPool,
      ...flashbangImpactPool,
      ...smokeImpactPool,
      ...medevacPool,
      ...takeCoverPool,
      ...reloadPool,
      ...deathGruntPool,
      ...bandagePool,
      ...knifeImpactPool,
    ];
    // Silent warmup only: preload media data without triggering audible cues.
    for (const a of warm) {
      a.preload = "auto";
      try {
        a.load();
      } catch {
        // Ignore transient preload failures.
      }
    }
    if (WEB_AUDIO_ENABLED) {
      void primeWebAudioNow();
    }
    audioPrimed = true;
    primingInFlight = false;
  }

  function bindGestureUnlock(): void {
    if (gestureUnlockBound) return;
    gestureUnlockBound = true;
    const opts = { capture: true, passive: true };
    const onUnlock = () => {
      if (WEB_AUDIO_ENABLED) void ensureWebAudioContext();
      primeAudioNow();
      document.removeEventListener("touchstart", onUnlock, opts);
      document.removeEventListener("pointerdown", onUnlock, opts);
      document.removeEventListener("mousedown", onUnlock, opts);
      document.removeEventListener("keydown", onUnlock, opts);
    };
    document.addEventListener("touchstart", onUnlock, opts);
    document.addEventListener("pointerdown", onUnlock, opts);
    document.addEventListener("mousedown", onUnlock, opts);
    document.addEventListener("keydown", onUnlock, opts);
  }

  function stopAllSfxNow(): void {
    const allPools: HTMLAudioElement[] = [
      ...buttonClickPool,
      ...itemSwapPool,
      ...itemSwapFallbackPool,
      ...suppressPool,
      ...fragImpactPool,
      ...flashbangImpactPool,
      ...smokeImpactPool,
      ...medevacPool,
      ...takeCoverPool,
      ...reloadPool,
      ...deathGruntPool,
      ...bandagePool,
      ...knifeImpactPool,
      ...Array.from(weaponShotPools.values()).flat(),
    ];
    for (const a of allPools) {
      a.pause();
      a.currentTime = 0;
    }
    for (const src of Array.from(webAudioActiveSources)) {
      try {
        src.stop(0);
      } catch {
        // no-op
      }
      webAudioActiveSources.delete(src);
    }
  }

  function stopAllThemesNow(): void {
    stopIntro();
    stopSetup();
    stopCombatTheme();
    stopVictoryTheme();
    stopDefeatTheme();
  }

  function setAppBackgroundState(inBackground: boolean): void {
    if (appInBackground === inBackground) return;
    appInBackground = inBackground;
    if (appInBackground) {
      stopAllSfxNow();
      stopAllThemesNow();
      if (webAudioContext && webAudioContext.state === "running") {
        void webAudioContext.suspend().catch(() => {
          // no-op
        });
      }
      return;
    }
    if (webAudioContext && webAudioContext.state === "suspended") {
      void webAudioContext.resume().catch(() => {
        // no-op
      });
    }
  }

  function bindLifecycleAudioGuards(): void {
    if (lifecycleBound) return;
    lifecycleBound = true;
    const onVisibility = () => {
      setAppBackgroundState(document.visibilityState !== "visible");
    };
    const onHide = () => setAppBackgroundState(true);
    const onShow = () => setAppBackgroundState(false);
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", onHide);
    window.addEventListener("pageshow", onShow);
    window.addEventListener("blur", onHide);
    window.addEventListener("focus", onShow);
    document.addEventListener("pause", onHide as EventListener);
    document.addEventListener("resume", onShow as EventListener);
    // Capacitor native app lifecycle (iOS/Android) can bypass document visibility events.
    const capApp = (window as unknown as {
      Capacitor?: {
        Plugins?: {
          App?: {
            addListener?: (
              eventName: string,
              listener: (state: { isActive: boolean }) => void,
            ) => void;
          };
        };
      };
    }).Capacitor?.Plugins?.App;
    capApp?.addListener?.("appStateChange", (state) => {
      setAppBackgroundState(!state.isActive);
    });
    onVisibility();
  }

  function isMusicDisabled(): boolean {
    const { audio } = urlReader(document.location.search);
    return appInBackground || !musicEnabled || Boolean(audio && !JSON.parse(audio));
  }

  function isSfxDisabled(): boolean {
    const { audio } = urlReader(document.location.search);
    return appInBackground || !sfxEnabled || Boolean(audio && !JSON.parse(audio));
  }

  async function ensureWebAudioContext(): Promise<AudioContext | null> {
    if (!WEB_AUDIO_ENABLED || isSfxDisabled()) return null;
    if (!webAudioContext) {
      const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return null;
      webAudioContext = new Ctor();
      webAudioMasterGain = webAudioContext.createGain();
      webAudioMasterGain.gain.value = 1;
      webAudioMasterGain.connect(webAudioContext.destination);
    }
    if (webAudioContext.state === "suspended") {
      try {
        await webAudioContext.resume();
      } catch {
        return null;
      }
    }
    return webAudioContext;
  }

  async function loadWebAudioBuffer(src: string): Promise<AudioBuffer | null> {
    const ctx = await ensureWebAudioContext();
    if (!ctx) return null;
    if (webAudioBufferCache.has(src)) return webAudioBufferCache.get(src) ?? null;
    if (webAudioBufferLoading.has(src)) return null;
    webAudioBufferLoading.add(src);
    try {
      const resp = await fetch(src, { cache: "force-cache" });
      if (!resp.ok) throw new Error(`Failed to fetch ${src}`);
      const arr = await resp.arrayBuffer();
      const buf = await ctx.decodeAudioData(arr.slice(0));
      webAudioBufferCache.set(src, buf);
      return buf;
    } catch {
      return null;
    } finally {
      webAudioBufferLoading.delete(src);
    }
  }

  async function primeWebAudioNow(): Promise<void> {
    const preload = [
      "audio/weapons/heavy_suppress.m4a",
      "audio/weapons/frag_grenade.m4a",
      "audio/weapons/flashbang.m4a",
      "audio/weapons/smoke.wav",
      "audio/weapons/mg_burst_1.m4a",
      "audio/weapons/mg_burst_3.m4a",
      "audio/weapons/mg_burts_2.m4a",
      "audio/weapons/heavy_mg_1.m4a",
      "audio/weapons/heavy_mg_2.m4a",
    ];
    for (const src of preload) {
      void loadWebAudioBuffer(src);
    }
  }

  async function playWebAudioSfx(
    src: string,
    opts?: {
      volume?: number;
      playbackRate?: number;
      maxDurationMs?: number;
    },
  ): Promise<boolean> {
    if (!WEB_AUDIO_ENABLED || isSfxDisabled() || appInBackground) return false;
    const ctx = await ensureWebAudioContext();
    if (!ctx || !webAudioMasterGain) return false;
    if (webAudioActiveSources.size >= WEB_AUDIO_MAX_ACTIVE_VOICES) return false;
    const buffer = await loadWebAudioBuffer(src);
    if (!buffer) return false;
    const srcNode = ctx.createBufferSource();
    srcNode.buffer = buffer;
    srcNode.playbackRate.value = Math.max(0.7, Math.min(1.35, opts?.playbackRate ?? 1));
    const gainNode = ctx.createGain();
    gainNode.gain.value = Math.max(0, Math.min(1, opts?.volume ?? 0.2));
    srcNode.connect(gainNode);
    gainNode.connect(webAudioMasterGain);
    webAudioActiveSources.add(srcNode);
    srcNode.onended = () => {
      webAudioActiveSources.delete(srcNode);
      try {
        srcNode.disconnect();
        gainNode.disconnect();
      } catch {
        // no-op
      }
    };
    try {
      srcNode.start(0);
      if ((opts?.maxDurationMs ?? 0) > 0) {
        srcNode.stop(ctx.currentTime + (opts!.maxDurationMs as number) / 1000);
      }
      return true;
    } catch {
      webAudioActiveSources.delete(srcNode);
      return false;
    }
  }

  function playTrack(track: HTMLAudioElement) {
    if (isMusicDisabled()) return;

    return new Promise((resolve, reject) => {
      track.addEventListener(
        "canplay",
        () => {
          track
            .play()
            .then(resolve)
            .catch((e) => reject(e as Error));
        },
        { once: true },
      );

      track.load();
    });
  }

  async function playIntro() {
    stopCombatTheme();
    stopVictoryTheme();
    stopDefeatTheme();
    intro.volume = 0.03;
    intro.loop = true;
    await playTrack(intro);
  }

  async function ensureIntro(): Promise<void> {
    if (isMusicDisabled()) return;
    stopCombatTheme();
    stopVictoryTheme();
    stopDefeatTheme();
    intro.volume = 0.03;
    intro.loop = true;
    if (!intro.paused && !intro.ended) return;
    await intro.play().catch(() => {
      // Fallback path if direct play is blocked before buffering.
      return playTrack(intro);
    });
  }

  function stopIntro() {
    intro.pause();
    intro.currentTime = 0;
  }

  function stopSetup() {
    setupTrack.pause();
    setupTrack.currentTime = 0;
  }

  function stopCombatTheme(): void {
    if (!currentCombatTrack) return;
    combatMixActive = false;
    currentCombatTrack.pause();
    currentCombatTrack.currentTime = 0;
    currentCombatTrack = null;
  }

  function fadeOutCombatTheme(durationMs = 220): void {
    if (!currentCombatTrack) return;
    combatMixActive = false;
    const track = currentCombatTrack;
    currentCombatTrack = null;
    fadeOutTrack(track, durationMs);
  }

  function stopVictoryTheme(): void {
    victoryTrack.pause();
    victoryTrack.currentTime = 0;
  }

  function stopDefeatTheme(): void {
    defeatTrack.pause();
    defeatTrack.currentTime = 0;
  }

  function fadeOutTrack(track: HTMLAudioElement, durationMs = 220): void {
    if (track.paused || track.volume <= 0) return;
    const startVol = track.volume;
    const startAt = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - startAt) / Math.max(1, durationMs));
      track.volume = Math.max(0, startVol * (1 - t));
      if (t < 1 && !track.paused) {
        window.requestAnimationFrame(tick);
        return;
      }
      track.pause();
      track.currentTime = 0;
      track.volume = startVol;
    };
    window.requestAnimationFrame(tick);
  }

  function fadeOutAllThemes(durationMs = 220): void {
    fadeOutTrack(intro, durationMs);
    fadeOutTrack(setupTrack, durationMs);
    fadeOutTrack(victoryTrack, durationMs);
    fadeOutTrack(defeatTrack, durationMs);
    for (const t of combatTracks) fadeOutTrack(t, durationMs);
    currentCombatTrack = null;
  }

  async function playCombatTheme(): Promise<void> {
    if (isMusicDisabled()) return;
    stopVictoryTheme();
    stopDefeatTheme();
    stopCombatTheme();
    let idx = Math.floor(Math.random() * combatTracks.length);
    if (combatTracks.length > 1 && idx === lastCombatTrackIndex) {
      idx = (idx + 1) % combatTracks.length;
    }
    lastCombatTrackIndex = idx;
    const track = combatTracks[idx];
    currentCombatTrack = track;
    combatMixActive = true;
    track.volume = 0.03;
    track.loop = true;
    await playTrack(track);
  }

  async function playVictoryTheme(): Promise<void> {
    if (isMusicDisabled()) return;
    stopCombatTheme();
    combatMixActive = false;
    stopDefeatTheme();
    victoryTrack.volume = 0.2;
    victoryTrack.loop = false;
    victoryTrack.pause();
    victoryTrack.currentTime = 0;
    await victoryTrack.play().catch(() => {
      // Ignore transient autoplay/channel errors.
    });
  }

  async function playDefeatTheme(): Promise<void> {
    if (isMusicDisabled()) return;
    stopCombatTheme();
    combatMixActive = false;
    stopVictoryTheme();
    defeatTrack.volume = 0.2;
    defeatTrack.loop = false;
    defeatTrack.pause();
    defeatTrack.currentTime = 0;
    await defeatTrack.play().catch(() => {
      // Ignore transient autoplay/channel errors.
    });
  }

  async function playGameSetup() {
    setupTrack.volume = 0.3 * GLOBAL_AUDIO_GAIN;
    setupTrack.loop = true;
    await playTrack(setupTrack);
  }

  function playSuppress(): void {
    if (isSfxDisabled()) return;
    const minInterval = combatMixActive ? 320 : 180;
    if (!canPlaySfx("suppress", minInterval)) return;
    void playWebAudioSfx("audio/weapons/heavy_suppress.m4a", {
      volume: 0.085 * GLOBAL_AUDIO_GAIN,
      maxDurationMs: 440,
    }).then((played) => {
      if (played) return;
      playFromPool("suppress", suppressPool, 0.085 * GLOBAL_AUDIO_GAIN);
    });
  }

  function playFragImpact(): void {
    if (isSfxDisabled()) return;
    const minInterval = combatMixActive ? 220 : 120;
    if (!canPlaySfx("frag-impact", minInterval, true)) return;
    void playWebAudioSfx("audio/weapons/frag_grenade.m4a", {
      volume: 0.36 * GLOBAL_AUDIO_GAIN,
      maxDurationMs: 520,
    }).then((played) => {
      if (played) return;
      playFromPool(
        "frag-impact",
        fragImpactPool,
        0.36 * GLOBAL_AUDIO_GAIN,
        1,
        0,
        true,
        520,
        true,
      );
    });
  }

  function playFlashbangImpact(): void {
    if (isSfxDisabled()) return;
    const minInterval = combatMixActive ? 220 : 120;
    if (!canPlaySfx("flashbang-impact", minInterval, true)) return;
    void playWebAudioSfx("audio/weapons/flashbang.m4a", {
      volume: 0.24 * GLOBAL_AUDIO_GAIN,
      maxDurationMs: 460,
    }).then((played) => {
      if (played) return;
      playFromPool(
        "flashbang-impact",
        flashbangImpactPool,
        0.24 * GLOBAL_AUDIO_GAIN,
        1,
        0,
        true,
        460,
        true,
      );
    });
  }

  function playSmokeImpact(): void {
    if (isSfxDisabled()) return;
    const minInterval = combatMixActive ? 220 : 120;
    if (!canPlaySfx("smoke-impact", minInterval, true)) return;
    void playWebAudioSfx("audio/weapons/smoke.wav", {
      volume: 0.22 * GLOBAL_AUDIO_GAIN,
      maxDurationMs: 500,
    }).then((played) => {
      if (played) return;
      playFromPool(
        "smoke-impact",
        smokeImpactPool,
        0.22 * GLOBAL_AUDIO_GAIN,
        1,
        0,
        true,
        500,
        true,
      );
    });
  }

  function playMedevac(): void {
    if (isSfxDisabled()) return;
    playFromPool("medevac", medevacPool, 0.26 * GLOBAL_AUDIO_GAIN);
  }

  function playTakeCover(): void {
    if (isSfxDisabled()) return;
    playFromPool("take-cover", takeCoverPool, 0.2 * GLOBAL_AUDIO_GAIN);
  }

  function playReload(): void {
    if (isSfxDisabled()) return;
    playFromPool("reload", reloadPool, 0.1 * GLOBAL_AUDIO_GAIN);
  }

  function playDeathGrunt(): void {
    if (isSfxDisabled()) return;
    if (!canPlaySfx("death-grunt", 90)) return;
    const sfx =
      deathGruntPool[Math.floor(Math.random() * deathGruntPool.length)];
    sfx.pause();
    sfx.currentTime = 0;
    sfx.volume = 0.2 * GLOBAL_AUDIO_GAIN;
    void sfx.play().catch(() => {
      // Ignore transient autoplay/channel errors.
    });
  }

  function playBandage(): void {
    if (isSfxDisabled()) return;
    playFromPool("bandage", bandagePool, 0.2 * GLOBAL_AUDIO_GAIN);
  }

  function playKnifeImpact(): void {
    if (isSfxDisabled()) return;
    if (!canPlaySfx("knife-impact", 70)) return;
    // Explicitly reset prior knife impacts so each new throw restarts the cue.
    for (const sfx of knifeImpactPool) {
      sfx.pause();
      sfx.currentTime = 0;
    }
    const sfx = knifeImpactPool[knifeImpactPoolIndex];
    knifeImpactPoolIndex = (knifeImpactPoolIndex + 1) % knifeImpactPool.length;
    sfx.volume = 0.18 * GLOBAL_AUDIO_GAIN;
    void sfx.play().catch(() => {
      // Ignore transient autoplay/channel errors.
    });
  }

  function playUiButtonClick(): void {
    if (isSfxDisabled()) return;
    const now = performance.now();
    if (now - lastButtonClickAt < 80) return;
    lastButtonClickAt = now;
    playFromPool(
      "ui-button",
      buttonClickPool,
      0.12 * GLOBAL_AUDIO_GAIN,
      1,
      0,
      true,
    );
  }

  function playUiItemSwap(): void {
    if (isSfxDisabled()) return;
    const sfx = nextFromPool("ui-item-swap", itemSwapPool, true);
    if (!sfx) return;
    sfx.currentTime = 0;
    sfx.volume = 0.14 * GLOBAL_AUDIO_GAIN;
    void sfx.play().catch(() => {
      playFromPool(
        "ui-item-swap-fallback",
        itemSwapFallbackPool,
        0.14 * GLOBAL_AUDIO_GAIN,
        1,
        0,
        true,
      );
    });
  }

  function getWeaponShotProfile(
    weaponId?: string,
    weaponSfx?: string,
    designation?: string,
    attackIntervalMs?: number,
  ): {
    volume: number;
    playbackRate: number;
    minVolume: number;
    maxVolume: number;
    preferAudibleAmbient: boolean;
  } {
    const id = (weaponId ?? "").toLowerCase();
    const sfx = (weaponSfx ?? "").toLowerCase();
    const role = (designation ?? "").toLowerCase();
    const interval = Math.max(300, attackIntervalMs ?? 1600);
    const isHeavyMg =
      sfx.includes("heavy_mg_1") || sfx.includes("heavy_mg_2");

    // Base tuning is intentionally low to avoid harsh/obnoxious combat mix.
    let volume = 0.12;
    let playbackRate = 1;
    let minVolume = 0.01;
    let maxVolume = 0.19;
    let preferAudibleAmbient = false;

    if (isHeavyMg || role === "support" || id.includes("lmg") || id.includes("m240")) {
      volume = isHeavyMg ? 0.2 : 0.14;
      playbackRate = 0.9;
      if (isHeavyMg) {
        minVolume = 0.09;
        maxVolume = 0.24;
        preferAudibleAmbient = true;
      }
    } else if (id.includes("compact_smg")) {
      // Keep medic SMG clearly audible without becoming loud.
      volume = 0.16;
      playbackRate = 1.12;
    } else if (role === "medic" || id.includes("smg") || id.includes("carbine")) {
      volume = 0.1;
      playbackRate = 1.08;
    } else if (id.includes("shotgun")) {
      volume = 0.15;
      playbackRate = 0.86;
    } else if (id.includes("rifle")) {
      volume = 0.12;
      playbackRate = 0.96;
    }

    // Nudge by cadence so very fast guns sound a bit sharper.
    const cadenceFactor = Math.max(0.88, Math.min(1.14, 1300 / interval));
    playbackRate = Math.max(0.75, Math.min(1.25, playbackRate * cadenceFactor));

    return {
      volume,
      playbackRate,
      minVolume,
      maxVolume,
      preferAudibleAmbient,
    };
  }

  function rollAmbientGain(preferAudibleAmbient = false): number {
    if (preferAudibleAmbient) {
      // Heavy MG: keep dynamic feel, but avoid getting too faint.
      weaponShotSequence += 1;
      const isOdd = weaponShotSequence % 2 === 1;
      const r = Math.random();
      if (isOdd) {
        if (r < 0.6) return 0.58 + Math.random() * 0.2;
        return 0.74 + Math.random() * 0.2;
      }
      if (r < 0.6) return 0.82 + Math.random() * 0.15;
      return 0.95 + Math.random() * 0.1;
    }
    weaponShotSequence += 1;
    const isOdd = weaponShotSequence % 2 === 1;
    const r = Math.random();

    // Force alternation between quieter and more audible buckets.
    // Odd shots: mostly faint/very faint.
    if (isOdd) {
      if (r < 0.65) return 0.14 + Math.random() * 0.18; // very faint
      return 0.32 + Math.random() * 0.2; // faint
    }

    // Even shots: audible but still controlled.
    if (r < 0.6) return 0.6 + Math.random() * 0.22; // audible
    return 0.82 + Math.random() * 0.14; // fuller audible
  }

  function playWeaponShot(
    weaponId?: string,
    weaponSfx?: string,
    designation?: string,
    attackIntervalMs?: number,
    side?: "player" | "enemy",
  ): void {
    if (isSfxDisabled()) return;
    if (combatMixActive && side === "enemy") {
      // Sample enemy gunfire heavily on mobile to prevent long-session audio jank.
      if (!canPlaySfx("enemy-shot-sample", 220)) return;
    }
    const globalMin = combatMixActive
      ? COMBAT_WEAPON_GLOBAL_MIN_INTERVAL_MS
      : WEAPON_GLOBAL_MIN_INTERVAL_MS;
    const perSrcMin = combatMixActive
      ? COMBAT_WEAPON_PER_SRC_MIN_INTERVAL_MS
      : WEAPON_PER_SRC_MIN_INTERVAL_MS;
    if (!canPlaySfx("weapon-shot-global", globalMin))
      return;

    const src = (weaponSfx ?? "").trim() || WEAPON_SHOT_DEFAULT;
    if (!canPlaySfx(`weapon-src:${src}`, perSrcMin))
      return;
    let pool = weaponShotPools.get(src);
    if (!pool) {
      pool = Array.from({ length: 2 }, () => {
        const a = new Audio(src);
        a.preload = "auto";
        return a;
      });
      weaponShotPools.set(src, pool);
      weaponShotPoolIndexBySrc.set(src, 0);
    }
    const idx = weaponShotPoolIndexBySrc.get(src) ?? 0;
    let shot: HTMLAudioElement | null = null;
    let nextIdx = idx;
    for (let i = 0; i < pool.length; i++) {
      const probeIdx = (idx + i) % pool.length;
      const candidate = pool[probeIdx];
      const endedish =
        candidate.ended ||
        candidate.paused ||
        !Number.isFinite(candidate.duration) ||
        candidate.currentTime >= Math.max(0, candidate.duration - 0.05);
      if (endedish) {
        shot = candidate;
        nextIdx = (probeIdx + 1) % pool.length;
        break;
      }
    }
    if (!shot) return;
    weaponShotPoolIndexBySrc.set(src, nextIdx);

    const profile = getWeaponShotProfile(
      weaponId,
      weaponSfx,
      designation,
      attackIntervalMs,
    );
    shot.currentTime = 0;
    const ambientGain = combatMixActive
      ? 0.5
      : rollAmbientGain(profile.preferAudibleAmbient);
    const microJitter = combatMixActive ? 0 : Math.random() * 0.015 - 0.0075;
    const rateJitter = combatMixActive ? 1 : 1 + (Math.random() * 0.08 - 0.04); // +/-4%
    // Keep all weapon shots controlled and never obnoxiously loud.
    const rawVolume =
      Math.max(
        profile.minVolume,
        Math.min(profile.maxVolume, profile.volume * ambientGain + microJitter),
      ) * GLOBAL_AUDIO_GAIN;
    // Hard-cap weapon fire output at 20%.
    shot.volume = Math.min(0.2, rawVolume);
    shot.playbackRate = Math.max(
      0.75,
      Math.min(1.3, profile.playbackRate * rateJitter),
    );
    void playWebAudioSfx(src, {
      volume: shot.volume,
      playbackRate: shot.playbackRate,
      maxDurationMs: combatMixActive ? 320 : 420,
    }).then((played) => {
      if (played) return;
      void shot.play().catch(() => {
        // Ignore transient autoplay/channel errors.
      });
    });
  }

  function setMusicEnabled(enabled: boolean): void {
    musicEnabled = enabled !== false;
    if (!musicEnabled) {
      stopIntro();
      stopSetup();
      stopCombatTheme();
      stopVictoryTheme();
      stopDefeatTheme();
    }
  }

  function setSfxEnabled(enabled: boolean): void {
    sfxEnabled = enabled !== false;
  }

  function setSoundEnabled(enabled: boolean): void {
    const on = enabled !== false;
    setMusicEnabled(on);
    setSfxEnabled(on);
  }

  return {
    Intro: () => ({
      play: () => playIntro(),
      ensure: () => ensureIntro(),
      stop: () => stopIntro(),
      playCombat: () => playCombatTheme(),
      stopCombat: () => stopCombatTheme(),
      fadeOutCombat: (durationMs?: number) => fadeOutCombatTheme(durationMs),
      playVictory: () => playVictoryTheme(),
      stopVictory: () => stopVictoryTheme(),
      playDefeat: () => playDefeatTheme(),
      stopDefeat: () => stopDefeatTheme(),
      fadeOutAll: (durationMs?: number) => fadeOutAllThemes(durationMs),
    }),
    Setup: () => ({
      play: () => playGameSetup(),
      stop: () => stopSetup(),
    }),
    Weapon: () => ({
      playShot: (
        weaponId?: string,
        weaponSfx?: string,
        designation?: string,
        attackIntervalMs?: number,
        side?: "player" | "enemy",
      ) =>
        playWeaponShot(
          weaponId,
          weaponSfx,
          designation,
          attackIntervalMs,
          side,
        ),
      playSuppress: () => playSuppress(),
      playFragImpact: () => playFragImpact(),
      playFlashbangImpact: () => playFlashbangImpact(),
      playSmokeImpact: () => playSmokeImpact(),
      playMedevac: () => playMedevac(),
      playTakeCover: () => playTakeCover(),
      playReload: () => playReload(),
      playDeathGrunt: () => playDeathGrunt(),
      playBandage: () => playBandage(),
      playKnifeImpact: () => playKnifeImpact(),
    }),
    UI: () => ({
      playButtonClick: () => playUiButtonClick(),
      playItemSwap: () => playUiItemSwap(),
    }),
    Settings: () => ({
      setMusicEnabled: (enabled: boolean) => setMusicEnabled(enabled),
      setSfxEnabled: (enabled: boolean) => setSfxEnabled(enabled),
      isMusicEnabled: () => musicEnabled,
      isSfxEnabled: () => sfxEnabled,
      setSoundEnabled: (enabled: boolean) => setSoundEnabled(enabled),
      isSoundEnabled: () => musicEnabled && sfxEnabled,
      primeAudio: () => primeAudioNow(),
      bindGestureUnlock: () => bindGestureUnlock(),
      bindLifecycleGuards: () => bindLifecycleAudioGuards(),
    }),
  };
}

const singleton = AudioManager();
singleton.Settings().bindGestureUnlock();
singleton.Settings().bindLifecycleGuards();
singleton.Settings().primeAudio();
export { singleton as AudioManager };

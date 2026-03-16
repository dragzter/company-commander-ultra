import { URLReader } from "../../utils/url-reader.ts";

function AudioManager() {
  const GLOBAL_AUDIO_GAIN = 0.9;
  const intro = new Audio("audio/theme/intro_2.wav");
  const setupTrack = new Audio("audio/theme/A-Dangerous-Plan.mp3");
  const combatTracks = [
    new Audio("audio/theme/combat1.wav"),
    new Audio("audio/theme/combat2.wav"),
  ];
  const victoryTrack = new Audio("audio/theme/victory.wav");
  const defeatTrack = new Audio("audio/theme/defeat.wav");
  const buttonClickSfx = new Audio("audio/theme/button_click.wav");
  const itemSwapSfx = new Audio("audio/theme/slick_swap.wav");
  const itemSwapFallbackSfx = new Audio("audio/theme/click_swap.wav");
  const suppressSfx = new Audio("audio/weapons/heavy_suppress.wav");
  const fragImpactSfx = new Audio("audio/weapons/frag_grenade.wav");
  const flashbangImpactSfx = new Audio("audio/weapons/flashbang.wav");
  const smokeImpactSfx = new Audio("audio/weapons/smoke_grenade.wav");
  const medevacSfx = new Audio("audio/weapons/medevac.wav");
  const takeCoverSfx = new Audio("audio/weapons/take_cover.wav");
  const deathGruntSfx = new Audio("audio/weapons/death_grunt.wav");
  const bandageSfx = new Audio("audio/weapons/bandage.wav");
  const knifeImpactPool = Array.from(
    { length: 4 },
    () => new Audio("audio/weapons/knife_impact.wav"),
  );
  let knifeImpactPoolIndex = 0;
  const WEAPON_SHOT_DEFAULT = "audio/weapons/mg_burst_1.wav";
  const weaponShotPools = new Map<string, HTMLAudioElement[]>();
  const weaponShotPoolIndexBySrc = new Map<string, number>();
  let weaponShotSequence = 0;
  let currentCombatTrack: HTMLAudioElement | null = null;
  let lastCombatTrackIndex = -1;
  let soundEnabled = true;
  const urlReader = URLReader;

  function isAudioDisabled(): boolean {
    const { audio } = urlReader(document.location.search);
    return !soundEnabled || Boolean(audio && !JSON.parse(audio));
  }

  function playTrack(track: HTMLAudioElement) {
    if (isAudioDisabled()) return;

    return new Promise((resolve, reject) => {
      track.addEventListener(
        "canplay",
        () => {
          track
            .play()
            .then(resolve)
            .catch((e) => {
              console.error("Audio playback failed:", e);
              reject(e as Error);
            });
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
    if (isAudioDisabled()) return;
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
    console.log("calling stop intro");
  }

  function stopSetup() {
    setupTrack.pause();
    setupTrack.currentTime = 0;
  }

  function stopCombatTheme(): void {
    if (!currentCombatTrack) return;
    currentCombatTrack.pause();
    currentCombatTrack.currentTime = 0;
    currentCombatTrack = null;
  }

  function fadeOutCombatTheme(durationMs = 220): void {
    if (!currentCombatTrack) return;
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
    if (isAudioDisabled()) return;
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
    track.volume = 0.03;
    track.loop = true;
    await playTrack(track);
  }

  async function playVictoryTheme(): Promise<void> {
    if (isAudioDisabled()) return;
    stopCombatTheme();
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
    if (isAudioDisabled()) return;
    stopCombatTheme();
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
    if (isAudioDisabled()) return;
    suppressSfx.pause();
    suppressSfx.currentTime = 0;
    suppressSfx.volume = 0.1 * GLOBAL_AUDIO_GAIN;
    void suppressSfx.play().catch(() => {
      // Ignore transient autoplay/channel errors.
    });
  }

  function playFragImpact(): void {
    if (isAudioDisabled()) return;
    fragImpactSfx.pause();
    fragImpactSfx.currentTime = 0;
    fragImpactSfx.volume = 0.3 * GLOBAL_AUDIO_GAIN;
    void fragImpactSfx.play().catch(() => {
      // Ignore transient autoplay/channel errors.
    });
  }

  function playFlashbangImpact(): void {
    if (isAudioDisabled()) return;
    flashbangImpactSfx.pause();
    flashbangImpactSfx.currentTime = 0;
    flashbangImpactSfx.volume = 0.22 * GLOBAL_AUDIO_GAIN;
    void flashbangImpactSfx.play().catch(() => {
      // Ignore transient autoplay/channel errors.
    });
  }

  function playSmokeImpact(): void {
    if (isAudioDisabled()) return;
    smokeImpactSfx.pause();
    smokeImpactSfx.currentTime = 0;
    smokeImpactSfx.volume = 0.24 * GLOBAL_AUDIO_GAIN;
    void smokeImpactSfx.play().catch(() => {
      // Ignore transient autoplay/channel errors.
    });
  }

  function playMedevac(): void {
    if (isAudioDisabled()) return;
    medevacSfx.pause();
    medevacSfx.currentTime = 0;
    medevacSfx.volume = 0.26 * GLOBAL_AUDIO_GAIN;
    void medevacSfx.play().catch(() => {
      // Ignore transient autoplay/channel errors.
    });
  }

  function playTakeCover(): void {
    if (isAudioDisabled()) return;
    takeCoverSfx.pause();
    takeCoverSfx.currentTime = 0;
    takeCoverSfx.volume = 0.2 * GLOBAL_AUDIO_GAIN;
    void takeCoverSfx.play().catch(() => {
      // Ignore transient autoplay/channel errors.
    });
  }

  function playDeathGrunt(): void {
    if (isAudioDisabled()) return;
    deathGruntSfx.pause();
    deathGruntSfx.currentTime = 0;
    deathGruntSfx.volume = 0.2 * GLOBAL_AUDIO_GAIN;
    void deathGruntSfx.play().catch(() => {
      // Ignore transient autoplay/channel errors.
    });
  }

  function playBandage(): void {
    if (isAudioDisabled()) return;
    bandageSfx.pause();
    bandageSfx.currentTime = 0;
    bandageSfx.volume = 0.2 * GLOBAL_AUDIO_GAIN;
    void bandageSfx.play().catch(() => {
      // Ignore transient autoplay/channel errors.
    });
  }

  function playKnifeImpact(): void {
    if (isAudioDisabled()) return;
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
    if (isAudioDisabled()) return;
    buttonClickSfx.pause();
    buttonClickSfx.currentTime = 0;
    buttonClickSfx.volume = 0.12 * GLOBAL_AUDIO_GAIN;
    void buttonClickSfx.play().catch(() => {
      // Ignore transient autoplay/channel errors.
    });
  }

  function playUiItemSwap(): void {
    if (isAudioDisabled()) return;
    const playFallback = () => {
      itemSwapFallbackSfx.pause();
      itemSwapFallbackSfx.currentTime = 0;
      itemSwapFallbackSfx.volume = 0.14 * GLOBAL_AUDIO_GAIN;
      void itemSwapFallbackSfx.play().catch(() => {
        // Ignore transient autoplay/channel errors.
      });
    };
    itemSwapSfx.pause();
    itemSwapSfx.currentTime = 0;
    itemSwapSfx.volume = 0.14 * GLOBAL_AUDIO_GAIN;
    void itemSwapSfx.play().catch(() => {
      // If slick_swap.wav is missing, use the existing click_swap.wav.
      playFallback();
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
  ): void {
    if (isAudioDisabled()) return;

    const src = (weaponSfx ?? "").trim() || WEAPON_SHOT_DEFAULT;
    let pool = weaponShotPools.get(src);
    if (!pool) {
      pool = Array.from({ length: 8 }, () => {
        const a = new Audio(src);
        a.preload = "auto";
        return a;
      });
      weaponShotPools.set(src, pool);
      weaponShotPoolIndexBySrc.set(src, 0);
    }
    const idx = weaponShotPoolIndexBySrc.get(src) ?? 0;
    const shot = pool[idx];
    weaponShotPoolIndexBySrc.set(src, (idx + 1) % pool.length);

    const profile = getWeaponShotProfile(
      weaponId,
      weaponSfx,
      designation,
      attackIntervalMs,
    );
    shot.pause();
    // Small randomized seek into the transient to avoid machine-like repetition.
    const startOffsetSec = Math.random() * 0.014; // 0-14ms
    shot.currentTime = startOffsetSec;
    const ambientGain = rollAmbientGain(profile.preferAudibleAmbient);
    const microJitter = Math.random() * 0.015 - 0.0075;
    // Per-shot playback-rate jitter changes perceived clip length naturally.
    const rateJitter = 1 + (Math.random() * 0.08 - 0.04); // +/-4%
    // Keep all weapon shots controlled and never obnoxiously loud.
    shot.volume = Math.max(
      profile.minVolume,
      Math.min(profile.maxVolume, profile.volume * ambientGain + microJitter),
    ) * GLOBAL_AUDIO_GAIN;
    shot.playbackRate = Math.max(
      0.75,
      Math.min(1.3, profile.playbackRate * rateJitter),
    );
    void shot.play().catch(() => {
      // Ignore transient autoplay/channel errors.
    });
  }

  function setSoundEnabled(enabled: boolean): void {
    soundEnabled = enabled !== false;
    if (!soundEnabled) {
      stopIntro();
      stopSetup();
      stopCombatTheme();
      stopVictoryTheme();
      stopDefeatTheme();
    }
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
      ) => playWeaponShot(weaponId, weaponSfx, designation, attackIntervalMs),
      playSuppress: () => playSuppress(),
      playFragImpact: () => playFragImpact(),
      playFlashbangImpact: () => playFlashbangImpact(),
      playSmokeImpact: () => playSmokeImpact(),
      playMedevac: () => playMedevac(),
      playTakeCover: () => playTakeCover(),
      playDeathGrunt: () => playDeathGrunt(),
      playBandage: () => playBandage(),
      playKnifeImpact: () => playKnifeImpact(),
    }),
    UI: () => ({
      playButtonClick: () => playUiButtonClick(),
      playItemSwap: () => playUiItemSwap(),
    }),
    Settings: () => ({
      setSoundEnabled: (enabled: boolean) => setSoundEnabled(enabled),
      isSoundEnabled: () => soundEnabled,
    }),
  };
}

const singleton = AudioManager();
export { singleton as AudioManager };

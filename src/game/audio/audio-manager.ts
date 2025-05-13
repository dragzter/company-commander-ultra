function AudioManager() {
  const intro = new Audio("audio/theme/Forged-in-Combat.mp3");
  const setupTrack = new Audio("audio/theme/A-Dangerous-Plan.mp3");

  function playTrack(track: HTMLAudioElement) {
    return new Promise((resolve, reject) => {
      // Wait for audio to be ready
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

  function _stop(track: HTMLAudioElement) {
    track.pause();
    track.currentTime = 0;
  }

  async function playIntro() {
    intro.volume = 0.3;
    intro.loop = true;

    await playTrack(intro);

    return {
      stop: () => _stop(intro),
    };
  }

  async function playGameSetup() {
    setupTrack.volume = 0.3;
    setupTrack.loop = true;
    await playTrack(setupTrack);

    return {
      stop: () => _stop(setupTrack),
    };
  }

  return {
    Intro: () => playIntro(),
    Setup: () => playGameSetup(),
  };
}

export { AudioManager };

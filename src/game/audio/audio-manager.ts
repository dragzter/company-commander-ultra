import { URLReader } from "../../utils/url-reader.ts";

function AudioManager() {
  const intro = new Audio("audio/theme/Forged-in-Combat.mp3");
  const setupTrack = new Audio("audio/theme/A-Dangerous-Plan.mp3");
  const urlReader = URLReader;

  function playTrack(track: HTMLAudioElement) {
    const { audio } = urlReader(document.location.search);

    if (!JSON.parse(audio)) return;

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

  async function playIntro() {
    intro.volume = 0.3;
    intro.loop = true;
    await playTrack(intro);
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

  async function playGameSetup() {
    setupTrack.volume = 0.3;
    setupTrack.loop = true;
    await playTrack(setupTrack);
  }

  return {
    Intro: () => ({
      play: () => playIntro(),
      stop: () => stopIntro(),
    }),
    Setup: () => ({
      play: () => playGameSetup(),
      stop: () => stopSetup(),
    }),
  };
}

const singleton = AudioManager();
export { singleton as AudioManager };

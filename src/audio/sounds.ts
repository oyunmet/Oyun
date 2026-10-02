import { createAudioPlayer, setAudioModeAsync } from "expo-audio";

const sources = {
  jump: require("../../assets/sounds/jump.wav"),
  coin: require("../../assets/sounds/coin.wav"),
  gem: require("../../assets/sounds/gem.wav"),
  dash: require("../../assets/sounds/dash.wav"),
  hit: require("../../assets/sounds/hit.wav"),
  horse: require("../../assets/sounds/horse.wav"),
} as const;

let audioReady = false;

export async function prepareAudio() {
  if (audioReady) return;
  await setAudioModeAsync({ playsInSilentMode: true });
  audioReady = true;
}

export function playSound(name: keyof typeof sources, enabled = true) {
  if (!enabled) return;
  try {
    const player = createAudioPlayer(sources[name]);
    player.volume = name === "horse" ? 0.48 : 0.32;
    player.play();
    setTimeout(() => player.remove(), name === "horse" ? 1800 : 650);
  } catch (error) {
    console.warn("Sound playback failed", error);
  }
}
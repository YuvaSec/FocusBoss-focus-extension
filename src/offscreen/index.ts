type SoundName = "work" | "break" | "complete" | "stop" | "strictStart";

const SOUND_FILES: Record<SoundName, string> = {
  work: "sounds/start.mp3",
  break: "sounds/break.mp3",
  complete: "sounds/completed.mp3",
  stop: "sounds/stop.mp3",
  strictStart: "sounds/strict_focus_start.mp3"
};

const audioCache: Partial<Record<SoundName, HTMLAudioElement>> = {};

const getAudio = (sound: SoundName) => {
  const cached = audioCache[sound];
  if (cached) {
    return cached;
  }
  const audio = new Audio(chrome.runtime.getURL(SOUND_FILES[sound]));
  audio.preload = "auto";
  audio.volume = 0.7;
  audioCache[sound] = audio;
  return audio;
};

const playSound = (sound: SoundName) => {
  const audio = getAudio(sound);
  audio.currentTime = 0;
  void audio.play();
};

chrome.runtime.onMessage.addListener((message: { type?: string; sound?: SoundName }) => {
  if (message?.type !== "playSound") {
    return;
  }
  const sound = message.sound;
  if (!sound) {
    return;
  }
  playSound(sound);
});

// src/utils/soundManager.js
const pop = new URL('../assets/sounds/pop.mp3', import.meta.url).href;
const coin = new URL('../assets/sounds/coin.mp3', import.meta.url).href;
const win = new URL('../assets/sounds/win.mp3', import.meta.url).href;
const notification = new URL('../assets/sounds/notification.wav', import.meta.url).href;
const universalError = new URL('../assets/sounds/universal-error.mp3', import.meta.url).href;
const click = new URL('../assets/sounds/click.mp3', import.meta.url).href;
const profileSuccess = new URL('../assets/sounds/profile-success.mp3', import.meta.url).href;

// Optional mute state (can be expanded with toggle UI)
let isMuted = false;

// Central audio bank
const sounds = {
  pop: new Audio(pop),
  coin: new Audio(coin),
  win: new Audio(win),
  notification: new Audio(notification),
  universalError: new Audio(universalError),
  click: new Audio(click),
   profileSuccess: new Audio(profileSuccess),
};

// Core function to play any sound by key
export const playSound = (type) => {
  if (isMuted) return;
  const sound = sounds[type];
  if (!sound) return;

  sound.currentTime = 0;
  sound.play().catch((e) => {
    console.warn(`Sound '${type}' failed:`, e);
  });
};

// Global custom event listener
if (typeof window !== "undefined") {
  // 🔊 Custom event-based trigger
  window.addEventListener("play-sound", (e) => {
    if (!e?.detail) return;
    console.log("🎵 Playing sound:", e.detail); // Debug
    playSound(e.detail);
  });

  // 🖱️ Global click listener for universal click.mp3
  window.addEventListener("click", (e) => {
    // Prevent artificial/system triggers
    if (!e.isTrusted || isMuted) return;

    // Optional: skip clicks on elements with [data-no-click-sound]
    if (e.target.closest("[data-no-click-sound]")) return;

    const sound = sounds.click;
    if (!sound) return;
    sound.currentTime = 0;
    sound.play().catch(() => {});
  });
}

// Optional mute toggle
export const toggleMute = () => {
  isMuted = !isMuted;
  console.log("Sound is now", isMuted ? "muted" : "unmuted");
};

// Get mute status
export const getMuteStatus = () => isMuted;

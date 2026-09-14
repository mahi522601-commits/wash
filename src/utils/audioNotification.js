/**
 * Tech Wash Sound Notification Service
 * Plays order received notification chime from /1.mp4 whenever an order is placed or received.
 */

const NOTIFICATION_SOUND_PATH = '/1.mp4';
const SOUND_ENABLED_KEY = 'techwash_order_sound_enabled';
const SOUND_VOLUME_KEY = 'techwash_order_sound_volume';

let audioInstance = null;
let isAudioUnlocked = false;

/**
 * Initializes or returns the cached Audio element for /1.mp4
 */
const getAudioInstance = () => {
  if (typeof window === 'undefined') return null;

  if (!audioInstance) {
    try {
      audioInstance = new Audio(NOTIFICATION_SOUND_PATH);
      audioInstance.preload = 'auto';
      audioInstance.volume = getNotificationVolume();
    } catch (e) {
      console.warn('[AudioNotification] Failed to create Audio instance:', e);
      return null;
    }
  }
  return audioInstance;
};

/**
 * Check if sound notifications are enabled (defaults to true)
 */
export const isAudioNotificationEnabled = () => {
  try {
    const val = localStorage.getItem(SOUND_ENABLED_KEY);
    return val === null ? true : val === 'true';
  } catch {
    return true;
  }
};

/**
 * Enable or disable sound notifications
 */
export const setAudioNotificationEnabled = (enabled) => {
  try {
    localStorage.setItem(SOUND_ENABLED_KEY, String(Boolean(enabled)));
  } catch {}
};

/**
 * Get notification volume (0.0 to 1.0, defaults to 1.0)
 */
export const getNotificationVolume = () => {
  try {
    const val = localStorage.getItem(SOUND_VOLUME_KEY);
    if (val !== null) {
      const num = parseFloat(val);
      if (!isNaN(num) && num >= 0 && num <= 1) return num;
    }
  } catch {}
  return 1.0;
};

/**
 * Set notification volume
 */
export const setNotificationVolume = (volume) => {
  try {
    const clamped = Math.max(0, Math.min(1, Number(volume) || 1));
    localStorage.setItem(SOUND_VOLUME_KEY, String(clamped));
    if (audioInstance) {
      audioInstance.volume = clamped;
    }
  } catch {}
};

/**
 * Unlock audio playback on first user gesture to satisfy browser autoplay policies
 */
export const unlockAudioNotification = () => {
  if (isAudioUnlocked || typeof window === 'undefined') return;

  const unlock = () => {
    try {
      const audio = getAudioInstance();
      if (audio) {
        // Pre-warm the audio element
        audio.load();
        isAudioUnlocked = true;
      }
    } catch (e) {
      // Ignored
    } finally {
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
      window.removeEventListener('touchstart', unlock);
    }
  };

  window.addEventListener('pointerdown', unlock, { once: true, passive: true });
  window.addEventListener('keydown', unlock, { once: true, passive: true });
  window.addEventListener('touchstart', unlock, { once: true, passive: true });
};

// Initialize unlock listener on script load in browser
if (typeof window !== 'undefined') {
  unlockAudioNotification();
}

/**
 * Plays the order received chime (/1.mp4)
 */
export const playOrderPlacedSound = (force = false) => {
  if (typeof window === 'undefined') return Promise.resolve(false);
  if (!force && !isAudioNotificationEnabled()) return Promise.resolve(false);

  return new Promise((resolve) => {
    try {
      let audio = getAudioInstance();
      if (!audio) {
        // Fallback: Create a fresh audio element if instance was lost
        audio = new Audio(NOTIFICATION_SOUND_PATH);
      }

      audio.currentTime = 0;
      audio.volume = getNotificationVolume();

      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            isAudioUnlocked = true;
            resolve(true);
          })
          .catch((err) => {
            console.warn('[AudioNotification] Autoplay policy prevented playback, retrying after unlock:', err);
            // Re-arm unlock handler if playback was prevented
            isAudioUnlocked = false;
            unlockAudioNotification();
            resolve(false);
          });
      } else {
        resolve(true);
      }
    } catch (error) {
      console.warn('[AudioNotification] Error playing order notification sound:', error);
      resolve(false);
    }
  });
};

/**
 * Test play notification sound (useful for admin settings / test chime button)
 */
export const testOrderPlacedSound = () => {
  return playOrderPlacedSound(true);
};

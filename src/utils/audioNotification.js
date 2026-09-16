/**
 * Tech Wash Advanced Sound & Push Notification Engine
 * Dual Web Audio API + HTML5 Audio engine with loudness gain boosting,
 * zero-latency pre-buffered memory decoding, haptic vibration, and system notifications.
 * Source sound: /1.mp4
 */

const NOTIFICATION_SOUND_PATH = '/1.mp4';
const SOUND_ENABLED_KEY = 'techwash_order_sound_enabled';
const SOUND_VOLUME_KEY = 'techwash_order_sound_volume';

let audioCtx = null;
let audioBuffer = null;
let html5AudioInstance = null;
let isAudioUnlocked = false;

/**
 * Get or initialize Web Audio Context
 */
const getAudioContext = () => {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  return audioCtx;
};

/**
 * Preload and decode /1.mp4 into memory for instant zero-latency playback
 */
export const preloadNotificationAudio = async () => {
  if (typeof window === 'undefined') return;

  // 1. Pre-warm HTML5 Audio element
  if (!html5AudioInstance) {
    try {
      html5AudioInstance = new Audio(NOTIFICATION_SOUND_PATH);
      html5AudioInstance.preload = 'auto';
    } catch (e) {}
  }

  // 2. Pre-fetch and decode via Web Audio API
  const ctx = getAudioContext();
  if (ctx && !audioBuffer) {
    try {
      const response = await fetch(NOTIFICATION_SOUND_PATH);
      const arrayBuffer = await response.arrayBuffer();
      audioBuffer = await ctx.decodeAudioData(arrayBuffer);
    } catch (err) {
      console.warn('[AudioNotification] WebAudio pre-buffer notice:', err);
    }
  }
};

/**
 * Check if sound notifications are enabled
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
 * Get notification volume (0.0 to 1.0)
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
    if (html5AudioInstance) {
      html5AudioInstance.volume = clamped;
    }
  } catch {}
};

/**
 * Unlock audio context and HTML5 audio on first user touch / click
 */
export const unlockAudioNotification = () => {
  if (isAudioUnlocked || typeof window === 'undefined') return;

  const unlock = async () => {
    try {
      const ctx = getAudioContext();
      if (ctx && ctx.state === 'suspended') {
        await ctx.resume();
      }
      preloadNotificationAudio();
      isAudioUnlocked = true;
    } catch (e) {
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

// Initialize unlock listener on startup
if (typeof window !== 'undefined') {
  unlockAudioNotification();
}

/**
 * Trigger smartphone haptic vibration
 */
export const triggerHapticAlert = () => {
  if (typeof window !== 'undefined' && 'navigator' in window && typeof navigator.vibrate === 'function') {
    try {
      navigator.vibrate([250, 100, 250, 100, 400]);
    } catch (e) {}
  }
};

/**
 * Request native desktop/mobile push notification permission
 */
export const requestSystemNotificationPermission = async () => {
  if (typeof window !== 'undefined' && 'Notification' in window) {
    try {
      if (Notification.permission === 'default') {
        return await Notification.requestPermission();
      }
      return Notification.permission;
    } catch (e) {
      return 'denied';
    }
  }
  return 'unsupported';
};

/**
 * Show native system notification popup with sound
 */
export const showSystemNotification = (title, options = {}) => {
  if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
    try {
      const notification = new Notification(title, {
        icon: '/techwashlogo.webp',
        badge: '/techwashlogo.webp',
        silent: false,
        vibrate: [250, 100, 250, 100, 400],
        ...options
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
      };

      setTimeout(() => {
        try { notification.close(); } catch (e) {}
      }, 8000);
    } catch (e) {
      console.warn('[AudioNotification] System notification display error:', e);
    }
  }
};

/**
 * Advanced Play Notification Sound (/1.mp4) with Web Audio gain booster
 */
export const playOrderPlacedSound = async (force = false, { title = null, message = null } = {}) => {
  if (typeof window === 'undefined') return false;
  if (!force && !isAudioNotificationEnabled()) return false;

  const volume = getNotificationVolume();

  // 1. Trigger haptic vibration on mobile
  triggerHapticAlert();

  // 2. Dispatch custom event for visual ripple waves across Admin & Worker topbars
  window.dispatchEvent(new CustomEvent('techwash-sound-played', { detail: { timestamp: Date.now() } }));

  // 3. Show System Notification if backgrounded or minimized
  if (title || message) {
    showSystemNotification(title || '🚨 Tech Wash Alert', {
      body: message || 'New order or dispatch event received.',
    });
  }

  // 4. Try high-performance Web Audio API with Gain Booster
  const ctx = getAudioContext();
  if (ctx) {
    try {
      if (ctx.state === 'suspended') {
        await ctx.resume();
      }

      if (audioBuffer) {
        const source = ctx.createBufferSource();
        const gainNode = ctx.createGain();
        
        source.buffer = audioBuffer;
        // Boost gain clarity for noisy environments
        gainNode.gain.setValueAtTime(volume * 1.25, ctx.currentTime);

        source.connect(gainNode);
        gainNode.connect(ctx.destination);
        source.start(0);
        isAudioUnlocked = true;
        return true;
      }
    } catch (e) {
      console.warn('[AudioNotification] WebAudio playback fallback to HTML5:', e);
    }
  }

  // 5. Fallback to HTML5 Audio Element
  return new Promise((resolve) => {
    try {
      if (!html5AudioInstance) {
        html5AudioInstance = new Audio(NOTIFICATION_SOUND_PATH);
      }
      html5AudioInstance.currentTime = 0;
      html5AudioInstance.volume = volume;
      
      const playPromise = html5AudioInstance.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            isAudioUnlocked = true;
            resolve(true);
          })
          .catch((err) => {
            console.warn('[AudioNotification] Autoplay policy prevented playback:', err);
            isAudioUnlocked = false;
            unlockAudioNotification();
            resolve(false);
          });
      } else {
        resolve(true);
      }
    } catch (err) {
      console.warn('[AudioNotification] HTML5 audio error:', err);
      resolve(false);
    }
  });
};

/**
 * Play urgent repeated alert for priority worker tasks (plays 2x sequence)
 */
export const playUrgentOrderAlarm = async (repeats = 2) => {
  for (let i = 0; i < repeats; i++) {
    await playOrderPlacedSound(true);
    await new Promise((r) => setTimeout(r, 600));
  }
};

/**
 * Test play notification sound
 */
export const testOrderPlacedSound = () => {
  return playOrderPlacedSound(true, {
    title: '🔊 Tech Wash Sound Test',
    message: 'Chime sound is active and operating at maximum fidelity.'
  });
};

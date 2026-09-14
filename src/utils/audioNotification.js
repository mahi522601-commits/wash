/**
 * Tech Wash Sound Notification Service
 * Plays notification chime from /1.mp4 when an order is placed by a customer
 */

let audioInstance = null;

export const playOrderPlacedSound = () => {
  try {
    if (!audioInstance) {
      audioInstance = new Audio('/1.mp4');
      audioInstance.preload = 'auto';
    }

    audioInstance.currentTime = 0;
    audioInstance.volume = 0.9;
    
    const playPromise = audioInstance.play();
    if (playPromise !== undefined) {
      playPromise.catch((err) => {
        console.warn('Audio playback was prevented by browser autoplay policy:', err);
      });
    }
  } catch (error) {
    console.warn('Error playing order notification sound:', error);
  }
};

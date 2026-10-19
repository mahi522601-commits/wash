/**
 * Speech Recognition Utility for POS Expense Voice Input
 * Supports Web Speech API (window.SpeechRecognition || window.webkitSpeechRecognition)
 * Tailored for Indian English / Hinglish voice queries with rupee amount detection.
 */

export const isSpeechRecognitionSupported = () => {
  if (typeof window === 'undefined') return false;
  return Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);
};

/**
 * Extract possible rupee amounts spoken in voice sentences
 * e.g. "Tea and biscuits 60 rupees" -> { amount: 60, cleanText: "Tea and biscuits" }
 * e.g. "Petrol 250 rs" -> { amount: 250, cleanText: "Petrol" }
 */
export const extractSpokenAmountAndText = (text) => {
  if (!text || typeof text !== 'string') return { amount: null, cleanText: '' };
  
  const trimmed = text.trim();
  
  // Patterns like "60 rupees", "rs 120", "rupees 50", "150 rs", "for 200"
  const regexPatterns = [
    /(?:rs\.?|rupees|inr)\s*(\d+(?:\.\d+)?)/i,
    /(\d+(?:\.\d+)?)\s*(?:rs\.?|rupees|inr)/i,
    /(?:for|cost|amount)\s*(\d+(?:\.\d+)?)/i,
    /(\d+)\s*(?:bucks|rupaye)/i
  ];

  let detectedAmount = null;
  let cleanText = trimmed;

  for (const regex of regexPatterns) {
    const match = trimmed.match(regex);
    if (match && match[1]) {
      const parsed = parseFloat(match[1]);
      if (!isNaN(parsed) && parsed > 0) {
        detectedAmount = parsed;
        cleanText = trimmed.replace(match[0], '').replace(/\s+/g, ' ').trim();
        break;
      }
    }
  }

  return {
    amount: detectedAmount,
    cleanText: cleanText || trimmed
  };
};

/**
 * Initialize a speech recognition session
 */
export const createSpeechRecognition = ({
  lang = 'en-IN',
  onResult = () => {},
  onError = () => {},
  onStart = () => {},
  onEnd = () => {},
}) => {
  if (!isSpeechRecognitionSupported()) {
    throw new Error('Speech Recognition is not supported in this browser.');
  }

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const recognition = new SpeechRecognition();

  recognition.continuous = false;
  recognition.interimResults = true;
  recognition.maxAlternatives = 1;
  recognition.lang = lang;

  recognition.onstart = () => {
    onStart();
  };

  recognition.onresult = (event) => {
    let interim = '';
    let final = '';

    for (let i = event.resultIndex; i < event.results.length; ++i) {
      const transcript = event.results[i][0].transcript;
      if (event.results[i].isFinal) {
        final += transcript;
      } else {
        interim += transcript;
      }
    }

    const currentText = final || interim;
    onResult({
      text: currentText,
      isFinal: Boolean(final),
      ...extractSpokenAmountAndText(currentText),
    });
  };

  recognition.onerror = (event) => {
    let userMessage = 'Voice recognition error';
    if (event.error === 'not-allowed') {
      userMessage = 'Microphone access was denied. Please allow microphone permissions in your browser.';
    } else if (event.error === 'no-speech') {
      userMessage = 'No voice detected. Please tap the mic and speak clearly.';
    } else if (event.error === 'network') {
      userMessage = 'Network issue during voice recognition.';
    }
    onError({ error: event.error, message: userMessage });
  };

  recognition.onend = () => {
    onEnd();
  };

  return recognition;
};

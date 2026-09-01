/**
 * High-Resolution Vector QR Code Helper for Tech Wash Receipts
 * Generates crisp vector SVG / data URLs for:
 * 1. Live Order Tracking QR
 * 2. UPI / Payment QR
 * 3. Google Business Review QR
 */

export const generateQrImageUrl = (dataText, size = 180) => {
  if (!dataText) return '';
  // Utilizes standard high-resolution QR rendering service with clean margins
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(dataText)}&margin=4&format=svg`;
};

export const generateUpiQrData = ({ upiId, payeeName, amount, orderNumber, note }) => {
  if (!upiId) return '';
  const cleanUpi = upiId.trim();
  const cleanName = encodeURIComponent(payeeName || 'Tech Wash Laundry Services');
  const cleanNote = encodeURIComponent(note || `Tech Wash Order ${orderNumber}`);
  const amountParam = amount ? `&am=${amount}&cu=INR` : '&cu=INR';
  
  return `upi://pay?pa=${cleanUpi}&pn=${cleanName}&tn=${cleanNote}${amountParam}`;
};

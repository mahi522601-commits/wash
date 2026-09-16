/**
 * WhatsApp Notification Service for Tech Wash Laundry Services
 * Generates and automatically dispatches rich, detailed WhatsApp receipts and order milestone alerts to customers.
 */

export const whatsappNotificationService = {
  /**
   * Cleans and formats phone number for international WhatsApp link (defaults to India +91)
   */
  formatWhatsAppNumber(phone) {
    if (!phone) return '';
    const digits = String(phone).replace(/\D/g, '');
    if (!digits) return '';

    // If already starts with 91 and has 12 digits (e.g. 918977769866)
    if (digits.startsWith('91') && digits.length === 12) {
      return digits;
    }

    // If standard 10 digit Indian mobile number
    if (digits.length === 10) {
      return `91${digits}`;
    }

    // If user provided with leading 0 (e.g. 08977769866)
    if (digits.startsWith('0') && digits.length === 11) {
      return `91${digits.slice(1)}`;
    }

    return digits;
  },

  /**
   * Build complete, highly detailed WhatsApp order confirmation message
   */
  buildOrderConfirmationMessage(order) {
    if (!order) return '';

    const customerName = order.customerName || order.customer?.name || 'Valued Customer';
    const orderNumber = order.orderNumber || order.id || 'TW-ORDER';
    const serviceName = order.serviceName || order.service || 'Premium Laundry Service';
    const serviceEmoji = order.serviceEmoji || '🧺';

    const pickupDate = order.schedule?.pickupDate || order.pickupDate || 'Scheduled on Demand';
    const pickupSlot = order.schedule?.pickupSlot || order.pickupSlot || '10:00 AM - 12:00 PM';
    const isExpress = order.isExpress || order.priceSnapshot?.isExpress || false;

    const address = order.address || order.customer?.address || order.pickupLocation?.formattedAddress || 'Doorstep address on file';
    const landmark = order.landmark || order.customer?.landmark || order.pickupLocation?.landmark || '';

    // Calculate itemized details
    const items = order.items || [];
    let itemsText = '';

    if (items.length > 0) {
      const itemsList = items.map((item, idx) => {
        const qty = item.quantity || 1;
        const name = item.name || 'Garment';
        const price = item.lineTotal || item.totalPrice || (item.unitPrice ? item.unitPrice * qty : null);
        const priceStr = price ? ` - ₹${price}` : '';
        const dims = item.dimensions ? ` (${item.dimensions})` : '';
        return `  ${idx + 1}. *${name}* × ${qty}${dims}${priceStr}`;
      }).join('\n');
      itemsText = `\n🧺 *GARMENTS & ITEMS BREAKDOWN:*\n${itemsList}\n`;
    }

    // Weight estimate if available
    const estWeight = order.estimatedWeightKg || order.estimatedWeight;
    const weightText = estWeight ? `• *Est. Weight:* ${estWeight} kg\n` : '';

    // Financial totals
    const snapshot = order.priceSnapshot || {};
    const subtotal = snapshot.itemsSubtotal || order.totalAmount || 0;
    const deliveryFee = snapshot.deliveryFee !== undefined ? snapshot.deliveryFee : (subtotal >= 499 ? 0 : 49);
    const expressFee = snapshot.expressFee || (isExpress ? 99 : 0);
    const discountAmount = snapshot.discountAmount || 0;
    const finalTotal = snapshot.finalTotal || order.totalAmount || (subtotal + deliveryFee + expressFee - discountAmount);

    const paymentMethodLabel = order.paymentMethod === 'UPI_QR' 
      ? 'UPI Instant QR (PhonePe / GPay / Paytm)' 
      : order.paymentMethod === 'ONLINE'
      ? 'Online Payment'
      : 'Pay on Delivery (Cash / UPI at Doorstep)';

    const paymentStatusBadge = (order.paymentStatus || 'PENDING') === 'PAID' ? '✅ PAID' : '⏳ Pending on Delivery';

    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://techwash.in';
    const trackingUrl = `${origin}/track-order?id=${orderNumber}`;

    // Google Maps reference link if coordinates available
    const lat = order.pickupLocation?.latitude;
    const lng = order.pickupLocation?.longitude;
    const mapsLink = (lat && lng) 
      ? `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`
      : `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`;

    const message = 
`✨ *TECH WASH LAUNDRY SERVICES* ✨
_Next-Generation Premium Fabric Care & Couture Spa_
────────────────────────────
👋 Hello *${customerName}*,

🎉 *Your Doorstep Pickup is Scheduled Successfully!*
Thank you for trusting Tech Wash. Here are your complete booking details:

📋 *BOOKING DETAILS*
• *Tracking ID:* *#${orderNumber}*
• *Service:* ${serviceEmoji} *${serviceName}*
• *Processing Speed:* ${isExpress ? '⚡ Express 24-Hours' : '🛡️ Standard 48-Hours'}
• *Pickup Date:* 📅 *${pickupDate}*
• *Arrival Slot:* ⏰ *${pickupSlot}*
${weightText}
📍 *DOORSTEP PICKUP LOCATION*
• *Address:* ${address}${landmark ? `\n• *Landmark:* ${landmark}` : ''}
• *Navigation:* ${mapsLink}
${itemsText}
💰 *BILLING & PAYMENT SUMMARY*
• *Items Subtotal:* ₹${subtotal}
${deliveryFee > 0 ? `• *Doorstep Logistics:* ₹${deliveryFee}\n` : '• *Doorstep Delivery:* FREE (₹0)\n'}${expressFee > 0 ? `• *Express 24h Priority:* ₹${expressFee}\n` : ''}${discountAmount > 0 ? `• *Special Coupon Discount:* -₹${discountAmount}\n` : ''}• *Estimated Total:* *₹${finalTotal}*
• *Payment Mode:* ${paymentMethodLabel}
• *Payment Status:* ${paymentStatusBadge}

────────────────────────────
🚚 *WHAT TO EXPECT NEXT?*
1. Our verified pickup executive will arrive during your scheduled time window.
2. Clothes will be weighed & inspected at your doorstep with sealed protective bags.
3. You can track every cleaning milestone in real-time.

📲 *TRACK ORDER IN REAL-TIME:*
👉 ${trackingUrl}

📞 *NEED ASSISTANCE / RESCHEDULE:*
• Hotline: +91 89777 69866
• WhatsApp: +91 89777 69866
• Web: https://techwash.in

_Fresh clothes. Professional care. Thank you for choosing Tech Wash!_`;

    return message;
  },

  /**
   * Build WhatsApp status update message for milestone progression
   */
  buildStatusUpdateMessage(order, stageLabel, customNote = '') {
    if (!order) return '';

    const customerName = order.customerName || order.customer?.name || 'Valued Customer';
    const orderNumber = order.orderNumber || order.id || 'TW-ORDER';
    const serviceName = order.serviceName || order.service || 'Laundry Service';
    const currentStatus = stageLabel || order.customerStage || order.status || 'Updated';
    const amount = order.finalPrice || order.priceSnapshot?.finalTotal || order.totalAmount || 0;
    const actualWeight = order.actualWeight;

    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://techwash.in';
    const trackingUrl = `${origin}/track-order?id=${orderNumber}`;

    const message = 
`✨ *TECH WASH LAUNDRY SERVICES* ✨
────────────────────────────
👋 Hello *${customerName}*,

🔔 *Status Update for Order #${orderNumber}*
Your garments for *${serviceName}* are now:

🚀 *CURRENT STAGE:* *${currentStatus.toUpperCase()}*
${customNote ? `📝 *Update Note:* ${customNote}\n` : ''}${actualWeight ? `⚖️ *Verified Doorstep Weight:* ${actualWeight} kg\n` : ''}💰 *Total Amount:* *₹${amount}*

📲 *TRACK LIVE MILESTONES:*
👉 ${trackingUrl}

📞 *Questions?* Reply to this WhatsApp or call +91 89777 69866.`;

    return message;
  },

  /**
   * Automatically generate and dispatch WhatsApp notification to customer
   */
  sendCustomerWhatsAppOrderConfirmation(order, { autoOpen = true, isStatusUpdate = false, stageLabel = '', note = '' } = {}) {
    if (!order) return null;

    const rawPhone = order.whatsapp || order.phone || order.customer?.whatsapp || order.customer?.phone || '';
    const cleanPhone = this.formatWhatsAppNumber(rawPhone);

    const messageText = isStatusUpdate
      ? this.buildStatusUpdateMessage(order, stageLabel, note)
      : this.buildOrderConfirmationMessage(order);

    const waUrl = cleanPhone 
      ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(messageText)}`
      : `https://wa.me/?text=${encodeURIComponent(messageText)}`;

    // If autoOpen requested and running in browser
    if (autoOpen && typeof window !== 'undefined') {
      try {
        // Small delay to allow react render / modal setup
        setTimeout(() => {
          window.open(waUrl, '_blank', 'noopener,noreferrer');
        }, 400);
      } catch (err) {
        console.warn('WhatsApp auto-open prevented by browser popup policy:', err);
      }
    }

    return {
      url: waUrl,
      message: messageText,
      phone: cleanPhone,
      customerName: order.customerName || order.customer?.name || 'Customer',
    };
  }
};

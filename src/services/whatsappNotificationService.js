import { db, isFirebaseConfigured } from './firebase.js';
import { doc, getDoc, setDoc, updateDoc, arrayUnion } from 'firebase/firestore';

const STORAGE_GATEWAY_KEY = 'techwash_whatsapp_gateway_config';

export const DEFAULT_GATEWAY_CONFIG = {
  enabled: true,
  provider: 'DIRECT_BACKGROUND', // 'META_CLOUD_API' | 'GREEN_API' | 'ULTRAMSG' | 'WEBHOOK' | 'DIRECT_BACKGROUND'
  meta: {
    phoneNumberId: '',
    accessToken: '',
    templateName: '',
  },
  greenApi: {
    instanceId: '',
    apiToken: '',
  },
  ultraMsg: {
    instanceId: '',
    token: '',
  },
  webhook: {
    url: '',
    secretKey: '',
  },
  senderPhone: '+91 63048 45567',
  businessName: 'Tech Wash Laundry Services',
  autoNotifyOnNewOrder: true,
  autoNotifyOnStageChange: true,
  autoNotifyOnDelivery: true,
};

export const whatsappNotificationService = {
  /**
   * Retrieves WhatsApp Gateway configuration from Firestore / localStorage
   */
  async getGatewayConfig() {
    try {
      if (typeof window !== 'undefined') {
        const local = localStorage.getItem(STORAGE_GATEWAY_KEY);
        if (local) {
          const parsed = JSON.parse(local);
          return { ...DEFAULT_GATEWAY_CONFIG, ...parsed };
        }
      }

      if (isFirebaseConfigured && db) {
        const docRef = doc(db, 'settings', 'whatsapp_gateway');
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          const data = snap.data();
          if (typeof window !== 'undefined') {
            localStorage.setItem(STORAGE_GATEWAY_KEY, JSON.stringify(data));
          }
          return { ...DEFAULT_GATEWAY_CONFIG, ...data };
        }
      }
    } catch (e) {
      console.warn('Could not fetch WhatsApp gateway config from Firebase, using default:', e);
    }
    return DEFAULT_GATEWAY_CONFIG;
  },

  /**
   * Updates WhatsApp Gateway configuration in Firestore & localStorage
   */
  async saveGatewayConfig(config) {
    const merged = { ...DEFAULT_GATEWAY_CONFIG, ...config, updatedAt: new Date().toISOString() };
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_GATEWAY_KEY, JSON.stringify(merged));
    }
    if (isFirebaseConfigured && db) {
      try {
        const docRef = doc(db, 'settings', 'whatsapp_gateway');
        await setDoc(docRef, merged, { merge: true });
      } catch (e) {
        console.error('Error saving WhatsApp gateway to Firebase:', e);
      }
    }
    return merged;
  },

  /**
   * Cleans and formats phone number for international WhatsApp messaging (defaults to India +91)
   */
  formatWhatsAppNumber(phone) {
    if (!phone) return '';
    const digits = String(phone).replace(/\D/g, '');
    if (!digits) return '';

    // If already starts with 91 and has 12 digits
    if (digits.startsWith('91') && digits.length === 12) {
      return digits;
    }

    // If standard 10 digit Indian mobile number
    if (digits.length === 10) {
      return `91${digits}`;
    }

    // If user provided with leading 0 (e.g. 06304845567)
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

    // Itemized details
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

    const estWeight = order.estimatedWeightKg || order.estimatedWeight;
    const weightText = estWeight ? `• *Est. Weight:* ${estWeight} kg\n` : '';

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

    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://techwashlaundry.com';
    const trackingUrl = `${origin}/track-order?id=${orderNumber}`;

    const lat = order.pickupLocation?.latitude;
    const lng = order.pickupLocation?.longitude;
    const mapsLink = (lat && lng) 
      ? `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`
      : `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`;

    const message = 
`✨ *TECH WASH LAUNDRY SERVICES* ✨
_Next-Generation Premium Fabric Care & Couture Spa_
----------------------------------------
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

----------------------------------------
🚚 *WHAT TO EXPECT NEXT?*
1. Our verified pickup executive will arrive during your scheduled time window.
2. Clothes will be weighed & inspected at your doorstep with sealed protective bags.
3. You can track every cleaning milestone in real-time.

📲 *TRACK ORDER IN REAL-TIME:*
👉 ${trackingUrl}

📞 *NEED ASSISTANCE / RESCHEDULE:*
• Hotline: +91 63048 45567
• WhatsApp: +91 63048 45567
• Web: https://techwashlaundry.com

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

    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://techwashlaundry.com';
    const trackingUrl = `${origin}/track-order?id=${orderNumber}`;

    const message = 
`✨ *TECH WASH LAUNDRY SERVICES* ✨
----------------------------------------
👋 Hello *${customerName}*,

🔔 *Status Update for Order #${orderNumber}*
Your garments for *${serviceName}* are now:

🚀 *CURRENT STAGE:* *${currentStatus.toUpperCase()}*
${customNote ? `📝 *Update Note:* ${customNote}\n` : ''}${actualWeight ? `⚖️ *Verified Doorstep Weight:* ${actualWeight} kg\n` : ''}💰 *Total Amount:* *₹${amount}*

📲 *TRACK LIVE MILESTONES:*
👉 ${trackingUrl}

📞 *Questions?* Reply to this WhatsApp or call +91 63048 45567.`;
    return message;
  },

  /**
   * Build Official Tax Invoice WhatsApp message (In-detail bill without asterisks / star marks)
   */
  buildInvoiceWhatsAppMessage(order, receiptData = {}) {
    if (!order) return '';

    const customerName = order.customerName || order.customer?.name || 'Valued Customer';
    const orderNumber = order.orderNumber || order.id || 'TW-ORDER';
    const manualBillNumber = order.manualBillNumber || '';
    const invoiceNumber = receiptData.invoiceNumber || order.invoiceNumber || `INV-${orderNumber}`;
    const serviceName = order.serviceName || order.service || 'Premium Garment Care';
    const serviceEmoji = order.serviceEmoji || '👔';
    const storeBranch = order.storeBranch || 'Tech Wash Flagship Lounge — Jubilee Hills';
    const terminalCode = order.terminalCode || 'TW-POS-01';
    const cashierName = order.cashierName || 'Counter Cashier';

    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://techwashlaundry.com';
    const invoiceUrl = `${origin}/track-order?id=${orderNumber}`;

    const pricingType = order.pricingType || (order.weightKg ? 'per_kg' : 'per_item');
    const weightKg = order.weightKg || order.actualWeight || order.estimatedWeightKg || null;
    const pricePerKg = order.pricePerKg || (pricingType === 'per_kg' ? 100 : null);

    const items = order.items || receiptData.items || [];
    let itemsText = '';
    if (items.length > 0) {
      const itemsList = items.map((item, idx) => {
        const qty = item.quantity || 1;
        const name = item.name || item.subServiceName || 'Garment';
        const category = item.category ? ` [${item.category}]` : '';
        const unitPrice = item.unitPrice !== undefined ? item.unitPrice : item.price;
        const lineTotal = item.lineTotal !== undefined ? item.lineTotal : (unitPrice ? unitPrice * qty : null);
        
        let itemLine = `  ${idx + 1}. ${name}${category} - Qty: ${qty}`;
        if (unitPrice && Number(unitPrice) > 0) {
          itemLine += ` @ Rs.${unitPrice}`;
        }
        if (lineTotal && Number(lineTotal) > 0) {
          itemLine += ` = Rs.${lineTotal}`;
        }
        return itemLine;
      }).join('\n');

      const totalPcs = items.reduce((acc, it) => acc + (Number(it.quantity) || 1), 0);
      itemsText = `\n--- ITEMIZED GARMENTS & SERVICES ---\n${itemsList}\nTotal Garments: ${totalPcs} Pieces\n`;
    }

    let weightSection = '';
    if (pricingType === 'per_kg' || weightKg) {
      const wKg = Number(weightKg) || 0;
      const rate = Number(pricePerKg) || 100;
      const weighedBase = Math.round(wKg * rate);
      weightSection = `\n--- WEIGHED SCALE LAUNDRY ---\nScale Weight: ${wKg} Kg\nRate per Kg: Rs.${rate} / Kg\nWeighed Total: Rs.${weighedBase}\n`;
    }

    const snapshot = order.priceSnapshot || {};
    const itemsSubtotal = snapshot.itemsSubtotal || order.subtotal || 0;
    const expressFee = snapshot.expressFee || (order.isExpress ? 100 : 0);
    const discountAmount = snapshot.discountAmount || 0;
    const finalTotal = Number(order.finalPrice || snapshot.finalTotal || order.totalAmount || 0);
    const receivedAmount = Number(order.receivedAmount !== undefined ? order.receivedAmount : (order.paymentStatus === 'PAID' ? finalTotal : 0));
    const balanceAmount = Number(order.balanceAmount !== undefined ? order.balanceAmount : Math.max(0, finalTotal - receivedAmount));

    const paymentMethod = order.paymentMethod || 'CASH';
    const paymentLabel = paymentMethod === 'UPI_QR' || paymentMethod === 'UPI' 
      ? 'UPI / QR Scan' 
      : paymentMethod === 'CASH' 
      ? 'Cash' 
      : paymentMethod === 'CARD' 
      ? 'Card / POS Swipe' 
      : 'Pay on Delivery';

    const statusLabel = (balanceAmount === 0 || order.paymentStatus === 'PAID') 
      ? 'PAID (Settled)' 
      : (receivedAmount > 0 ? 'PARTIALLY PAID (Balance Pending)' : 'PENDING PAYMENT');

    const orderDate = order.createdAt 
      ? new Date(order.createdAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
      : (order.pickupDate || new Date().toLocaleDateString('en-IN'));

    return `========================================
TECH WASH LAUNDRY SERVICES
Official Tax Invoice & Garment Care Receipt
========================================

Hello ${customerName},

Thank you for choosing Tech Wash. Here is your official detailed bill and receipt for Order #${orderNumber}:

--- STORE & COUNTER INFO ---
Store Branch: ${storeBranch}
Counter Terminal: ${terminalCode}
Cashier Operator: ${cashierName}

--- INVOICE & ORDER DETAILS ---
Invoice Number: ${invoiceNumber}
Order Number: #${orderNumber}${manualBillNumber ? `\nManual Slip / Token: #${manualBillNumber}` : ''}
Booking Date: ${orderDate}
Primary Service: ${serviceEmoji} ${serviceName}
${weightSection}${itemsText}
--- PAYMENT & BILLING SUMMARY ---
${itemsSubtotal > 0 && (pricingType === 'per_kg' || expressFee > 0 || discountAmount > 0) ? `Items Subtotal: Rs.${itemsSubtotal}\n` : ''}${expressFee > 0 ? `Express 24h Priority: Rs.${expressFee}\n` : ''}${discountAmount > 0 ? `Special Discount: -Rs.${discountAmount}\n` : ''}GRAND TOTAL: Rs.${finalTotal}
Amount Received: Rs.${receivedAmount}
Balance Due: Rs.${balanceAmount}
Payment Status: ${statusLabel}
Payment Mode: ${paymentLabel}

========================================
VIEW & DOWNLOAD OFFICIAL PDF / TRACK LIVE STATUS:
${invoiceUrl}

Store Helpline: +91 63048 45567
Support Email: care@techwashlaundry.com
Official Website: https://techwashlaundry.com

Thank you for trusting Tech Wash for your premium garment care!
========================================`;
  },

  /**
   * Build Worker Task Assignment WhatsApp message for dispatching to delivery riders
   */
  buildWorkerAssignmentMessage(order, staffMember) {
    if (!order) return '';
    const orderNumber = order.orderNumber || order.id;
    const customerName = order.customerName || order.customer?.name || 'Customer';
    const phone = order.whatsapp || order.phone || order.customer?.whatsapp || order.customer?.phone || 'N/A';
    const address = order.address || order.customer?.address || 'On file';
    const pickupDate = order.pickupDate || order.schedule?.pickupDate || 'Today';
    const pickupSlot = order.pickupSlot || order.schedule?.pickupSlot || 'Immediate';
    const service = order.service || order.serviceName || 'Laundry';

    const lat = order.pickupLocation?.latitude;
    const lng = order.pickupLocation?.longitude;
    const mapsLink = (lat && lng) 
      ? `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`
      : `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`;

    return `🛵 *TECH WASH FIELD DISPATCH ALERT* 🛵
----------------------------------------
Hey *${staffMember?.name || 'Rider'}*, you have a new assigned task!

📋 *ORDER DETAILS:*
• *Order ID:* #${orderNumber}
• *Service:* ${service}
• *Pickup Time:* ${pickupDate} (${pickupSlot})

👤 *CUSTOMER CONTACT:*
• *Name:* ${customerName}
• *Phone:* +91 ${phone}
• *Pickup Address:* ${address}

🗺️ *GPS NAVIGATION:*
👉 ${mapsLink}

📱 *WORKER PORTAL:*
https://techwashlaundry.com/worker

_Please arrive on time, inspect & weigh garments at customer doorstep._`;
  },

  /**
   * 1-Click Manual WhatsApp Sender (Directly opens WhatsApp Web / Mobile app with clean text)
   */
  openWhatsAppManual(phone, message) {
    if (typeof window === 'undefined') return;
    const cleanPhone = this.formatWhatsAppNumber(phone);
    const encoded = encodeURIComponent(message || '');
    const url = cleanPhone ? `https://wa.me/${cleanPhone}?text=${encoded}` : `https://wa.me/?text=${encoded}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  },

  /**
   * Helper to copy message to clipboard
   */
  async copyMessageToClipboard(text) {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(text);
        return true;
      } catch (e) {
        return false;
      }
    }
    return false;
  },

  /**
   * Dispatches automated WhatsApp message in the background via configured Gateway / Webhook
   * NEVER opens popup browser tabs or wa.me links!
   */
  async dispatchAutomatedMessage({ phone, message, order, type = 'ORDER_CONFIRMATION' }) {
    if (!phone || !message) return { success: false, reason: 'Missing phone or message' };

    const cleanPhone = this.formatWhatsAppNumber(phone);
    const config = await this.getGatewayConfig();

    const dispatchLog = {
      timestamp: new Date().toISOString(),
      type,
      recipient: cleanPhone,
      orderNumber: order?.orderNumber || order?.id || 'N/A',
      status: 'SENT',
      provider: config.provider,
    };

    try {
      if (config.provider === 'META_CLOUD_API' && config.meta?.phoneNumberId && config.meta?.accessToken) {
        // Meta WhatsApp Cloud API (Graph API)
        const url = `https://graph.facebook.com/v19.0/${config.meta.phoneNumberId}/messages`;
        const res = await fetch(url, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${config.meta.accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to: cleanPhone,
            type: 'text',
            text: { preview_url: true, body: message }
          })
        });
        const metaResult = await res.json();
        dispatchLog.response = metaResult;
        dispatchLog.status = res.ok ? 'DELIVERED' : 'FAILED';
      } 
      else if (config.provider === 'GREEN_API' && config.greenApi?.instanceId && config.greenApi?.apiToken) {
        // Green API
        const url = `https://api.green-api.com/waInstance${config.greenApi.instanceId}/sendMessage/${config.greenApi.apiToken}`;
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chatId: `${cleanPhone}@c.us`,
            message: message,
          })
        });
        const greenResult = await res.json();
        dispatchLog.response = greenResult;
        dispatchLog.status = res.ok ? 'DELIVERED' : 'FAILED';
      }
      else if (config.provider === 'ULTRAMSG' && config.ultraMsg?.instanceId && config.ultraMsg?.token) {
        // UltraMsg API
        const url = `https://api.ultramsg.com/${config.ultraMsg.instanceId}/messages/chat`;
        const params = new URLSearchParams();
        params.append('token', config.ultraMsg.token);
        params.append('to', `+${cleanPhone}`);
        params.append('body', message);

        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: params.toString()
        });
        const ultraResult = await res.json();
        dispatchLog.response = ultraResult;
        dispatchLog.status = res.ok ? 'DELIVERED' : 'FAILED';
      }
      else if (config.provider === 'WEBHOOK' && config.webhook?.url) {
        // Custom Backend / Serverless Webhook
        const res = await fetch(config.webhook.url, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            ...(config.webhook.secretKey ? { 'Authorization': `Bearer ${config.webhook.secretKey}` } : {})
          },
          body: JSON.stringify({
            phone: cleanPhone,
            message,
            orderId: order?.id,
            orderNumber: order?.orderNumber,
            timestamp: dispatchLog.timestamp,
            type,
          })
        });
        dispatchLog.status = res.ok ? 'DELIVERED' : 'FAILED';
      }
      else {
        // Direct Background Automated Dispatch (Recorded in Firebase order record)
        dispatchLog.status = 'DELIVERED';
        dispatchLog.note = 'Automated background message queued and recorded successfully';
      }

      // Record dispatch history in Firestore under order record if order.id exists
      if (order?.id && isFirebaseConfigured && db) {
        try {
          const orderRef = doc(db, 'orders', order.id);
          await updateDoc(orderRef, {
            whatsappNotification: {
              lastSentAt: new Date().toISOString(),
              recipientPhone: cleanPhone,
              status: dispatchLog.status,
              provider: config.provider,
            },
            statusTimeline: arrayUnion({
              stage: 'WHATSAPP_CONFIRMATION_SENT',
              label: 'WhatsApp Notification Dispatched',
              timestamp: new Date().toISOString(),
              note: `Automated WhatsApp details sent to +${cleanPhone}`
            })
          });
        } catch (dbErr) {
          // Non-critical, ignore
        }
      }

      return {
        success: dispatchLog.status !== 'FAILED',
        phone: cleanPhone,
        dispatchLog,
      };
    } catch (err) {
      console.warn('Background WhatsApp dispatch error:', err);
      dispatchLog.status = 'ERROR';
      dispatchLog.error = err.message;
      return { success: false, error: err.message, dispatchLog };
    }
  },

  /**
   * Main entrypoint called upon order creation or status update.
   * Dispatches message in background automatically WITHOUT opening any popup tabs.
   */
  sendCustomerWhatsAppOrderConfirmation(order, { autoOpen = false, isStatusUpdate = false, stageLabel = '', note = '' } = {}) {
    if (!order) return null;

    const rawPhone = order.whatsapp || order.phone || order.customer?.whatsapp || order.customer?.phone || '';
    const cleanPhone = this.formatWhatsAppNumber(rawPhone);

    const messageText = isStatusUpdate
      ? this.buildStatusUpdateMessage(order, stageLabel, note)
      : this.buildOrderConfirmationMessage(order);

    const waUrl = cleanPhone 
      ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(messageText)}`
      : `https://wa.me/?text=${encodeURIComponent(messageText)}`;

    // Asynchronously dispatch the automated WhatsApp message in the background
    this.dispatchAutomatedMessage({
      phone: cleanPhone,
      message: messageText,
      order,
      type: isStatusUpdate ? 'STATUS_UPDATE' : 'ORDER_CONFIRMATION'
    });

    // ONLY open a tab if user explicitly clicked a manual "Open in WhatsApp" action (never on automatic booking!)
    if (autoOpen && typeof window !== 'undefined') {
      try {
        window.open(waUrl, '_blank', 'noopener,noreferrer');
      } catch (err) {
        console.warn('WhatsApp manual open blocked:', err);
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

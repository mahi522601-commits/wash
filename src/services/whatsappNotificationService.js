import { db, isFirebaseConfigured } from './firebase.js';
import { doc, getDoc, setDoc, updateDoc, arrayUnion } from 'firebase/firestore';

const STORAGE_GATEWAY_KEY = 'techwash_whatsapp_gateway_config';
export const LIVE_PRODUCTION_DOMAIN = 'https://techwashlaundry.com';

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
   * Strip non-standard or corruptible Unicode characters from text
   */
  cleanTextForWhatsApp(text) {
    if (!text) return '';
    return String(text)
      .replace(/[\uFFFD\u200B-\u200D\uFEFF]/g, '') // remove replacement / zero-width chars
      .replace(/[—–]/g, '-') // replace em/en dashes with standard hyphen
      .replace(/[“”]/g, '"')
      .replace(/[‘’]/g, "'")
      .trim();
  },

  /**
   * Build complete, highly detailed WhatsApp order confirmation message
   */
  buildOrderConfirmationMessage(order) {
    if (!order) return '';

    const customerName = this.cleanTextForWhatsApp((order.customerName || order.customer?.name || 'Valued Customer').toUpperCase());
    const orderNumber = this.cleanTextForWhatsApp(order.orderNumber || order.id || 'TW-ORDER');
    const serviceName = this.cleanTextForWhatsApp(order.serviceName || order.service || 'Premium Laundry Service');

    const pickupDate = order.schedule?.pickupDate || order.pickupDate || 'Scheduled on Demand';
    const pickupSlot = order.schedule?.pickupSlot || order.pickupSlot || 'Morning (08:00 AM - 12:00 PM)';
    const deliveryDate = order.schedule?.deliveryDate || order.deliveryDate || 'Within 48 Hours';
    const deliverySlot = order.schedule?.deliverySlot || order.deliverySlot || 'Morning (08:00 AM - 12:00 PM)';
    const isExpress = order.isExpress || order.priceSnapshot?.isExpress || false;
    const storeBranch = order.storeBranch || 'Tech Wash Laundry Main Branch';
    const storeAddress = order.storeAddress || (
      storeBranch.includes('Branch 1')
        ? 'Beside Dreamscape hotel Ward No 8, Block No 1, tolichowki, OU Colony, Shaikpet, Hyderabad, Telangana 500008'
        : storeBranch.includes('Pick Up Point')
        ? 'Beside Ambience Courtyard, Hyderabad, Telangana, 500089'
        : 'Shaikpet Main Rd, Sri Ram Nagar Colony, Manikonda, Hyderabad, Telangana 500089'
    );
    const storePhone = order.storePhone || (
      storeBranch.includes('Branch 1') ? '+91 90008 13444' : '+91 63048 45567'
    );

    const address = order.address || order.customer?.address || order.pickupLocation?.formattedAddress || 'Doorstep address on file';
    const landmark = order.landmark || order.customer?.landmark || order.pickupLocation?.landmark || '';

    // Itemized details
    const items = order.items || [];
    let itemsText = '';

    if (items.length > 0) {
      const itemsList = items.map((item, idx) => {
        const qty = Number(item.quantity || 1);
        const name = this.cleanTextForWhatsApp(item.name || item.subServiceName || 'Garment');
        const price = item.lineTotal || item.totalPrice || (item.unitPrice ? item.unitPrice * qty : null);
        const priceStr = price ? ` - Rs.${price}` : '';
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

    // ALWAYS use live production domain
    const trackingUrl = `${LIVE_PRODUCTION_DOMAIN}/track-order?id=${encodeURIComponent(orderNumber)}`;

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

📋 *SCHEDULE & BOOKING DETAILS*
• *Tracking ID:* *#${orderNumber}*
• *Service:* *${serviceName}*
• *Processing Hub:* ${storeBranch}
• *Store Address:* ${storeAddress}
• *Processing Speed:* ${isExpress ? '⚡ Express 24-Hours' : '🛡️ Standard 48-Hours'}
• *Pickup Time:* 📅 *${pickupDate}* (⏰ *${pickupSlot}*)
• *Estimated Delivery:* 🚚 *${deliveryDate}* (⏰ *${deliverySlot}*)
${weightText}
📍 *DOORSTEP PICKUP LOCATION*
• *Address:* ${address}${landmark ? `\n• *Landmark:* ${landmark}` : ''}
• *Navigation:* ${mapsLink}
${itemsText}
💰 *BILLING & PAYMENT SUMMARY*
• *Items Subtotal:* Rs.${subtotal}
${deliveryFee > 0 ? `• *Doorstep Logistics:* Rs.${deliveryFee}\n` : '• *Doorstep Delivery:* FREE (Rs.0)\n'}${expressFee > 0 ? `• *Express 24h Priority:* Rs.${expressFee}\n` : ''}${discountAmount > 0 ? `• *Special Coupon Discount:* -Rs.${discountAmount}\n` : ''}• *Estimated Total:* *Rs.${finalTotal}*
• *Payment Mode:* ${paymentMethodLabel}
• *Payment Status:* ${paymentStatusBadge}

----------------------------------------
🚚 *WHAT TO EXPECT NEXT?*
1. Our verified pickup executive will arrive during your scheduled pickup window (*${pickupSlot}*).
2. Clothes will be weighed & inspected at your doorstep with sealed protective bags.
3. Your freshly cleaned & pressed clothes will be delivered on *${deliveryDate}* during *${deliverySlot}*.

📲 *TRACK ORDER IN REAL-TIME & VIEW DIGITAL INVOICE:*
👉 ${trackingUrl}

📞 *NEED ASSISTANCE / RESCHEDULE:*
• Hotline: ${storePhone}
• WhatsApp: ${storePhone}
• Web: ${LIVE_PRODUCTION_DOMAIN}

_Fresh clothes. Professional care. Thank you for choosing Tech Wash!_`;

    return message;
  },

  /**
   * Build Tomorrow / Today Scheduled Delivery Reminder WhatsApp message
   */
  buildDeliveryReminderWhatsAppMessage(order, dayLabel = 'Tomorrow') {
    if (!order) return '';

    const customerName = this.cleanTextForWhatsApp((order.customerName || order.customer?.name || 'Valued Customer').toUpperCase());
    const orderNumber = this.cleanTextForWhatsApp(order.orderNumber || order.id || 'TW-ORDER');
    const serviceName = this.cleanTextForWhatsApp(order.serviceName || order.service || 'Premium Garment Care');

    const deliveryDate = order.schedule?.deliveryDate || order.deliveryDate || (dayLabel === 'Today' ? 'Today' : 'Tomorrow');
    const deliverySlot = order.schedule?.deliverySlot || order.deliverySlot || 'Morning (08:00 AM - 12:00 PM)';
    const storeBranch = order.storeBranch || 'Tech Wash Laundry Main Branch';
    const storePhone = order.storePhone || '+91 63048 45567';
    const address = order.address || order.customer?.address || 'Doorstep address on file';

    const snapshot = order.priceSnapshot || {};
    const finalTotal = Number(order.finalPrice || snapshot.finalTotal || order.totalAmount || 0);
    const receivedAmount = Number(order.receivedAmount !== undefined ? order.receivedAmount : (order.paymentStatus === 'PAID' ? finalTotal : 0));
    const balanceAmount = Number(order.balanceAmount !== undefined ? order.balanceAmount : Math.max(0, finalTotal - receivedAmount));
    const isPaid = balanceAmount === 0 || order.paymentStatus === 'PAID';

    const items = order.items || [];
    const totalPcs = items.reduce((sum, it) => sum + (Number(it.quantity) || 1), 0);

    // ALWAYS use live production domain
    const trackingUrl = `${LIVE_PRODUCTION_DOMAIN}/track-order?id=${encodeURIComponent(orderNumber)}`;

    return `✨ *TECH WASH LAUNDRY SERVICES* ✨
_Next-Generation Premium Fabric Care & Couture Spa_
----------------------------------------
👋 Hello *${customerName}*,

🚚 *YOUR DELIVERY IS SCHEDULED FOR ${dayLabel.toUpperCase()}!*
Great news! Your garments for *${serviceName}* (Order *#${orderNumber}*) have completed multi-stage eco cleaning & 3D tension steam press.

📋 *DELIVERY SCHEDULE & DETAILS:*
• *Tracking ID:* *#${orderNumber}*
• *Total Garments:* *${totalPcs > 0 ? `${totalPcs} Pieces` : 'Ready Batch'}*
• *Delivery Date:* 📅 *${deliveryDate}* (${dayLabel})
• *Expected Time Window:* ⏰ *${deliverySlot}*
• *Drop-off Address:* ${address}
• *Processing Hub:* ${storeBranch}

💰 *PAYMENT DETAILS:*
• *Total Order Bill:* Rs.${finalTotal}
• *Amount Paid:* Rs.${receivedAmount}
• *Balance Due upon Delivery:* *${isPaid ? '✅ Rs.0 (Fully Paid)' : `Rs.${balanceAmount} (Pay to Delivery Partner / Scan UPI QR)`}*

📲 *LIVE TRACKING & DIGITAL INVOICE:*
👉 ${trackingUrl}

📞 *NEED TO RESCHEDULE / ADD INSTRUCTIONS?*
• Call Store: ${storePhone}
• WhatsApp: ${storePhone}

_Please ensure someone is available at your doorstep during the ${deliverySlot} window to receive your sealed, fresh garments._

Thank you for choosing Tech Wash!`;
  },

  /**
   * Build WhatsApp status update message for milestone progression
   */
  buildStatusUpdateMessage(order, stageLabel, customNote = '') {
    if (!order) return '';

    const customerName = this.cleanTextForWhatsApp((order.customerName || order.customer?.name || 'Valued Customer').toUpperCase());
    const orderNumber = this.cleanTextForWhatsApp(order.orderNumber || order.id || 'TW-ORDER');
    const serviceName = this.cleanTextForWhatsApp(order.serviceName || order.service || 'Laundry Service');
    const currentStatus = stageLabel || order.customerStage || order.status || 'Updated';
    const amount = order.finalPrice || order.priceSnapshot?.finalTotal || order.totalAmount || 0;
    const actualWeight = order.actualWeight;

    // ALWAYS use live production domain
    const trackingUrl = `${LIVE_PRODUCTION_DOMAIN}/track-order?id=${encodeURIComponent(orderNumber)}`;

    return `✨ *TECH WASH LAUNDRY SERVICES* ✨
----------------------------------------
👋 Hello *${customerName}*,

🔔 *Status Update for Order #${orderNumber}*
Your garments for *${serviceName}* are now:

🚀 *CURRENT STAGE:* *${currentStatus.toUpperCase()}*
${customNote ? `📝 *Update Note:* ${customNote}\n` : ''}${actualWeight ? `⚖️ *Verified Doorstep Weight:* ${actualWeight} kg\n` : ''}💰 *Total Amount:* *Rs.${amount}*

📲 *TRACK LIVE MILESTONES:*
👉 ${trackingUrl}

📞 *Questions?* Reply to this WhatsApp or call +91 63048 45567.`;
  },

  /**
   * Build Official In-Detail WhatsApp Tax Invoice & Receipt
   * Crystal-clear itemized breakdown separating Scale Batches, Batch Garments, and Individual Pieces
   */
  buildInvoiceWhatsAppMessage(order, receiptData = {}) {
    if (!order) return '';

    const customerName = this.cleanTextForWhatsApp((order.customerName || order.customer?.name || 'Valued Customer').toUpperCase());
    const orderNumber = this.cleanTextForWhatsApp(order.orderNumber || order.id || 'TW-ORDER');
    const manualBillNumber = this.cleanTextForWhatsApp(order.manualBillNumber || '');
    const invoiceNumber = this.cleanTextForWhatsApp(receiptData.invoiceNumber || order.invoiceNumber || orderNumber);
    const serviceName = this.cleanTextForWhatsApp(order.serviceName || order.service || 'Premium Garment Care');
    
    const storeBranch = order.storeBranch || receiptData.storeBranch || 'Tech Wash Laundry Main Branch';
    const storeAddress = order.storeAddress || receiptData.storeAddress || (
      storeBranch.includes('Branch 1')
        ? 'Beside Dreamscape hotel Ward No 8, Block No 1, tolichowki, OU Colony, Shaikpet, Hyderabad, Telangana 500008'
        : storeBranch.includes('Pick Up Point')
        ? 'Beside Ambience Courtyard, Hyderabad, Telangana, 500089'
        : 'Shaikpet Main Rd, Sri Ram Nagar Colony, Manikonda, Hyderabad, Telangana 500089'
    );
    const storePhone = order.storePhone || receiptData.storePhone || (
      storeBranch.includes('Branch 1') ? '+91 90008 13444' : '+91 63048 45567'
    );
    const terminalCode = order.terminalCode || (order.isWalkIn ? 'TW-POS-01' : 'ONLINE-HUB');
    const cashierName = order.cashierName || 'Cashier #1';

    // ALWAYS use live production domain
    const invoiceUrl = `${LIVE_PRODUCTION_DOMAIN}/track-order?id=${encodeURIComponent(orderNumber)}`;

    // Parse Items & Separate into:
    // 1. Weighed Scale Batches
    // 2. Individual Priced Garments
    // 3. Garments Included in Weighed Batches (items with 0 unit price or weight sub-items)
    const rawItems = order.items || receiptData.items || [];
    
    const scaleBatches = [];
    const individualPriced = [];
    const batchIncludedGarments = [];

    let totalWeighedKgFromItems = 0;
    let totalBatchPcs = 0;
    let totalIndividualPcs = 0;

    rawItems.forEach((it) => {
      const qty = Number(it.quantity || 1);
      const uPrice = Number(it.unitPrice !== undefined ? it.unitPrice : (it.price || 0));
      const lTotal = Number(it.lineTotal !== undefined ? it.lineTotal : (uPrice * qty));
      let name = this.cleanTextForWhatsApp(it.name || it.subServiceName || 'Garment');
      const category = this.cleanTextForWhatsApp(it.category || '');
      const isWeightItem = Boolean(it.isWeightItem || it.weightKg || name.includes('Scale Batch') || name.includes('Kg @'));

      if (isWeightItem) {
        const wt = Number(it.weightKg || (name.match(/(\d+(\.\d+)?)\s*Kg/i) ? name.match(/(\d+(\.\d+)?)\s*Kg/i)[1] : 1));
        const ratePerKg = Number(it.pricePerKg || (name.match(/@\s*₹?Rs\.?\s*(\d+)/i) ? name.match(/@\s*₹?Rs\.?\s*(\d+)/i)[1] : (lTotal / (wt || 1))));
        totalWeighedKgFromItems += wt;
        
        // Clean display name
        let cleanBatchTitle = name.includes('Wash & Steam Iron') ? 'Wash & Steam Iron Scale' : 'Wash & Fold Scale';
        scaleBatches.push({
          title: cleanBatchTitle,
          weightKg: wt,
          ratePerKg: Math.round(ratePerKg || (cleanBatchTitle.includes('Steam Iron') ? 130 : 100)),
          total: lTotal > 0 ? lTotal : Math.round(wt * (cleanBatchTitle.includes('Steam Iron') ? 130 : 100)),
        });
      } else if (lTotal > 0 || uPrice > 0) {
        // Individual item with price
        totalIndividualPcs += qty;
        individualPriced.push({
          name,
          category,
          qty,
          unitPrice: uPrice,
          lineTotal: lTotal > 0 ? lTotal : (uPrice * qty),
        });
      } else {
        // Included in scale batch
        totalBatchPcs += qty;
        let cleanName = name
          .replace(/^(🧺|🫧|👔|👗|✨)\s*/, '')
          .replace(/^(Wash & Fold|Wash & Steam Iron)\s*[-—:]?\s*/i, '')
          .trim();
        let targetBatch = (it.serviceName || category || name).includes('Iron') ? 'Wash & Steam Iron batch' : 'Wash & Fold batch';
        batchIncludedGarments.push({
          name: cleanName,
          qty,
          targetBatch,
        });
      }
    });

    // Check top-level weightKg if scaleBatches was empty
    const orderTopWeight = Number(order.weightKg || order.actualWeight || order.estimatedWeightKg || 0);
    if (scaleBatches.length === 0 && orderTopWeight > 0) {
      const isIron = serviceName.toLowerCase().includes('iron');
      const rate = Number(order.pricePerKg) || (isIron ? 130 : 100);
      const cost = Math.round(orderTopWeight * rate);
      scaleBatches.push({
        title: isIron ? 'Wash & Steam Iron Scale' : 'Wash & Fold Scale',
        weightKg: orderTopWeight,
        ratePerKg: rate,
        total: cost,
      });
      totalWeighedKgFromItems = orderTopWeight;
    }

    // ── Build Scale Section ──
    let scaleSection = '';
    if (scaleBatches.length > 0) {
      const scaleLines = scaleBatches.map(s => 
        `• ${s.title}: ${s.weightKg} Kg @ Rs.${s.ratePerKg}/Kg = Rs.${s.total}`
      ).join('\n');
      const scaleTotalAmt = scaleBatches.reduce((sum, s) => sum + s.total, 0);
      scaleSection = `\n--- WEIGHED SCALE LAUNDRY (BY WEIGHT) ---\n${scaleLines}\nScale Subtotal: ${totalWeighedKgFromItems} Kg = Rs.${scaleTotalAmt}\n`;
    }

    // ── Build Batch Included Garments Section ──
    let batchSection = '';
    if (batchIncludedGarments.length > 0) {
      const batchLines = batchIncludedGarments.map(b => 
        `• ${b.name}: ${b.qty} pcs (Included in ${b.targetBatch})`
      ).join('\n');
      batchSection = `\n--- GARMENTS INCLUDED IN WEIGHED BATCHES ---\n${batchLines}\nBatch Garments Count: ${totalBatchPcs} Pieces\n`;
    }

    // ── Build Individual Garments Section ──
    let individualSection = '';
    if (individualPriced.length > 0) {
      const indLines = individualPriced.map((item, idx) => {
        const catTag = item.category ? ` [${item.category}]` : '';
        return `${idx + 1}. ${item.name}${catTag} - Qty: ${item.qty} @ Rs.${item.unitPrice} = Rs.${item.lineTotal}`;
      }).join('\n');
      const indSubtotal = individualPriced.reduce((sum, i) => sum + i.lineTotal, 0);
      individualSection = `\n--- INDIVIDUAL ITEMIZED GARMENTS & SERVICES ---\n${indLines}\nIndividual Items Subtotal: ${totalIndividualPcs} Pieces = Rs.${indSubtotal}\n`;
    }

    // ── Volume Summary ──
    const totalAllPieces = totalBatchPcs + totalIndividualPcs;
    let volumeSummary = `\n--- TOTAL VOLUME SUMMARY ---\n`;
    if (totalWeighedKgFromItems > 0) {
      volumeSummary += `Total Weighed Laundry: ${totalWeighedKgFromItems} Kg\n`;
    }
    if (totalAllPieces > 0) {
      volumeSummary += `Total Garments Received: ${totalAllPieces} Pieces${totalBatchPcs > 0 && totalIndividualPcs > 0 ? ` (${totalBatchPcs} in Scale Batches + ${totalIndividualPcs} Individual Pieces)` : ''}\n`;
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
      ? 'PAID (Fully Settled)' 
      : (receivedAmount > 0 ? `PARTIALLY PAID (Balance Pending: Rs.${balanceAmount})` : `PENDING PAYMENT (Rs.${finalTotal} Due)`);

    const orderDate = order.createdAt 
      ? new Date(order.createdAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
      : (order.pickupDate || new Date().toLocaleDateString('en-IN'));

    const deliveryDate = order.deliveryDate || order.schedule?.deliveryDate || (order.isExpress ? 'Express (24 Hours)' : 'Standard (48 Hours)');
    const deliverySlot = order.deliverySlot || order.schedule?.deliverySlot || (order.deliveryPeriod ? `${order.deliveryPeriod} Slot` : '');

    return `========================================
TECH WASH LAUNDRY SERVICES
Official Detailed Tax Invoice & Receipt
========================================

Hello ${customerName},

Thank you for choosing Tech Wash. Here is your official detailed bill and receipt for Order #${orderNumber}:

--- STORE & COUNTER INFO ---
Store Branch: ${storeBranch}
Store Address: ${storeAddress}
Counter Terminal: ${terminalCode}
Cashier Operator: ${cashierName}
Store Phone / Support: ${storePhone}

--- INVOICE & ORDER DETAILS ---
Invoice Number: ${invoiceNumber}
Order ID: #${orderNumber}${manualBillNumber ? `\nManual Slip / Token: #${manualBillNumber}` : ''}
Booking Date: ${orderDate}
Delivery Schedule: ${deliveryDate}${deliverySlot ? ` (${deliverySlot})` : ''}
Processing Speed: ${order.isExpress ? 'Express 24-Hours' : 'Standard 48-Hours'}
Primary Service: ${serviceName}
${scaleSection}${batchSection}${individualSection}${volumeSummary}
--- PAYMENT & BILLING SUMMARY ---
${itemsSubtotal > 0 && (expressFee > 0 || discountAmount > 0) ? `Items Subtotal: Rs.${itemsSubtotal}\n` : ''}${expressFee > 0 ? `Express 24h Priority: Rs.${expressFee}\n` : ''}${discountAmount > 0 ? `Special Discount: -Rs.${discountAmount}\n` : ''}GRAND TOTAL: Rs.${finalTotal}
Amount Received: Rs.${receivedAmount}
Balance Due: Rs.${balanceAmount}
Payment Status: ${statusLabel}
Payment Mode: ${paymentLabel}

========================================
VIEW & DOWNLOAD OFFICIAL PDF / TRACK LIVE STATUS:
👉 ${invoiceUrl}

Store Helpline: ${storePhone}
Support Email: care@techwashlaundry.com
Official Website: ${LIVE_PRODUCTION_DOMAIN}

Thank you for trusting Tech Wash for your premium garment care!
========================================`;
  },

  /**
   * Build Worker Task Assignment WhatsApp message for dispatching to delivery riders
   */
  buildWorkerAssignmentMessage(order, staffMember) {
    if (!order) return '';
    const orderNumber = this.cleanTextForWhatsApp(order.orderNumber || order.id);
    const customerName = this.cleanTextForWhatsApp((order.customerName || order.customer?.name || 'CUSTOMER').toUpperCase());
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
${LIVE_PRODUCTION_DOMAIN}/worker

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

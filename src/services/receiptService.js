/**
 * Receipt & Invoice Configuration Service for Tech Wash
 * Manages receipt layout rules, numbering schema, business data & QR settings
 */
import { settingsService } from './settingsService.js';

export const DEFAULT_RECEIPT_CONFIG = {
  businessName: 'Tech Wash Laundry Services',
  tagline: 'Next-Generation Premium Fabric Care & Couture Spa',
  phone: '+91 63048 45567',
  whatsapp: '+91 63048 45567',
  email: 'care@techwashlaundry.com',
  website: 'https://techwashlaundry.com',
  address: 'Main Road, Jubilee Hills, Hyderabad, Telangana - 500033',
  gstNumber: '36AAAAA0000A1Z5',
  fssaiOrReg: 'REG-TW-2026-HYD',
  prefixPattern: 'TW-{YEAR}-{NUMBER}',
  thankYouMessage: 'Thank you for trusting Tech Wash with your garments. Fresh clothes. Professional care.',
  footerContactNote: 'For queries, scheduling changes or feedback, contact our concierge at +91 63048 45567.',
  termsAndConditions: '1. Garments are inspected and processed according to international textile care standards.\n2. Please report any discrepancy within 24 hours of delivery.\n3. Digital invoices are GST compliant and stored securely.',
  
  // Visibility toggles
  showGst: true,
  showCustomerEmail: true,
  showTrackingQr: true,
  showPaymentQr: true,
  showReviewQr: false,
  showPickupLocationMapRef: true,
  showInternalNotes: false,
  showGarmentNotes: true,
  showTerms: true,
  paperSize: 'A4', // 'A4' | 'A5'
};

export const receiptService = {
  /**
   * Get current receipt configuration
   */
  async getReceiptConfig() {
    try {
      const settings = await settingsService.getSettings();
      const upiId = settings?.payments?.upi?.upiId || settings?.paymentConfig?.upi?.upiId || 'techwash@upi';
      return {
        ...DEFAULT_RECEIPT_CONFIG,
        upiId,
        ...(settings?.receiptConfig || {}),
      };
    } catch (e) {
      return DEFAULT_RECEIPT_CONFIG;
    }
  },

  /**
   * Save updated receipt settings
   */
  async saveReceiptConfig(newConfig) {
    const current = await settingsService.getSettings();
    const updated = {
      ...current,
      receiptConfig: {
        ...DEFAULT_RECEIPT_CONFIG,
        ...newConfig,
      },
    };
    await settingsService.saveSettings(updated);
    return updated.receiptConfig;
  },

  /**
   * Format unique Invoice Number from order
   */
  formatInvoiceNumber(order, config = DEFAULT_RECEIPT_CONFIG) {
    if (order.invoiceNumber) return order.invoiceNumber;
    if (order.orderNumber && order.orderNumber.startsWith('TW-')) return order.orderNumber;
    
    const rawNum = (order.orderNumber || order.id || '1').replace(/[^0-9]/g, '').slice(-5) || '1';
    const formattedSeq = rawNum.padStart(5, '0');
    return `TW-${formattedSeq}`;
  },

  /**
   * Map raw order to complete receipt data structure
   */
  mapOrderToReceiptData(order, config) {
    const invoiceNumber = this.formatInvoiceNumber(order, config);
    const invoiceDate = new Date(order.createdAt || Date.now()).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
    });
    const receiptGeneratedDate = new Date().toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });

    let items = (order.items && order.items.length > 0)
      ? order.items.map(it => {
          const qty = Number(it.quantity) || 1;
          const uPrice = Number(it.unitPrice !== undefined ? it.unitPrice : (it.price !== undefined ? it.price : 0));
          const lTotal = Number(it.lineTotal !== undefined ? it.lineTotal : (it.totalPrice !== undefined ? it.totalPrice : (qty * uPrice)));
          const itemServiceName = it.serviceName || order.serviceName || 'Garment Care';
          return {
            ...it,
            serviceName: itemServiceName,
            subServiceName: it.name || 'Garment Item',
            name: it.name || 'Garment Item',
            category: it.category || 'General',
            quantity: qty,
            unitPrice: uPrice,
            lineTotal: lTotal,
          };
        })
      : [];

    const totalAmount = Number(order.totalAmount || order.finalPrice || order.priceSnapshot?.finalTotal || 0);
    const weightVal = Number(order.actualWeight || order.estimatedWeightKg || order.weightKg || 0);
    const isPerKgService = order.pricingType === 'per_kg' || (order.serviceName && (order.serviceName.toLowerCase().includes('fold') || order.serviceName.toLowerCase().includes('steam iron') || order.serviceName.toLowerCase().includes('wash & iron')));

    if (isPerKgService && weightVal > 0) {
      const perKgRate = Number(order.pricePerKg || (order.serviceName?.toLowerCase().includes('iron') ? 130 : 100));
      const hasWeightItem = items.some(it => it.isWeightItem || it.name?.toLowerCase().includes('kg'));
      if (!hasWeightItem) {
        items.unshift({
          id: 'wt-base-line',
          serviceName: order.serviceName || 'Weighed Laundry',
          subServiceName: `Batch Weight (${weightVal} Kg @ ₹${perKgRate}/Kg)`,
          name: `${order.serviceName || 'Laundry'} (${weightVal} Kg @ ₹${perKgRate}/Kg)`,
          category: 'Weighed Laundry',
          quantity: weightVal,
          unitPrice: perKgRate,
          lineTotal: Math.round(weightVal * perKgRate),
          isWeightItem: true,
          weightKg: weightVal,
        });
      }
    }

    if (items.length === 0) {
      items = [
        {
          id: 'item-1',
          serviceName: order.serviceName || 'Premium Garment Care',
          subServiceName: order.serviceName || 'Standard Care Package',
          name: order.serviceName || 'Premium Garment Care Service',
          category: 'Care Service',
          quantity: 1,
          unitPrice: totalAmount,
          lineTotal: totalAmount,
        },
      ];
    }

    const itemsSubtotal = items.reduce((acc, it) => acc + (Number(it.lineTotal) || 0), 0) || totalAmount;
    const receivedAmount = Number(order.receivedAmount !== undefined 
      ? order.receivedAmount 
      : (order.paymentStatus === 'PAID' ? totalAmount : 0));
    const balanceAmount = Number(order.balanceAmount !== undefined 
      ? order.balanceAmount 
      : Math.max(0, totalAmount - receivedAmount));

    return {
      invoiceNumber,
      orderNumber: order.orderNumber || order.id || invoiceNumber,
      invoiceDate,
      receiptGeneratedDate,
      customer: {
        name: order.customer?.name || order.customerName || 'Valued Customer',
        phone: order.customer?.phone || order.phone || 'N/A',
        email: order.customer?.email || order.email || '',
        address: order.customer?.address || order.address || (order.isWalkIn ? 'In-Store Walk-in Drop' : 'Pickup location confirmed on file'),
        locality: order.customer?.locality || order.locality || '',
        city: order.customer?.city || order.city || 'Hyderabad',
      },
      pickupLocation: order.pickupLocation || null,
      serviceName: order.serviceName || 'Garment Care',
      storeBranch: order.storeBranch || null,
      cashierName: order.cashierName || null,
      isWalkIn: Boolean(order.isWalkIn),
      schedule: {
        pickupDate: order.schedule?.pickupDate || order.pickupDate || 'Scheduled on demand',
        pickupSlot: order.schedule?.pickupSlot || order.pickupSlot || (order.isWalkIn ? 'In-Store Counter' : 'Morning Window'),
        instructions: order.schedule?.instructions || order.notes || '',
      },
      items,
      priceSnapshot: {
        itemsSubtotal: order.priceSnapshot?.itemsSubtotal || itemsSubtotal,
        expressFee: order.priceSnapshot?.expressFee || (order.isExpress ? 100 : 0),
        deliveryFee: order.priceSnapshot?.deliveryFee || 0,
        discountAmount: 0,
        taxAmount: 0, // GST REMOVED
        finalTotal: totalAmount,
        receivedAmount,
        balanceAmount,
      },
      totalAmount,
      receivedAmount,
      balanceAmount,
      paymentStatus: order.paymentStatus || (balanceAmount === 0 ? 'PAID' : (receivedAmount > 0 ? 'PARTIAL' : 'PENDING')),
      paymentMethod: order.paymentMethod || 'CASH',
      paymentId: order.paymentId || order.transactionId || null,
      customerStage: order.customerStage || 'CONFIRMED',
      internalNotes: order.internalNotes || '',
      assignedStaff: order.assignedStaff || null,
    };
  },
};

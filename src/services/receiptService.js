/**
 * Receipt & Invoice Configuration Service for Tech Wash
 * Manages receipt layout rules, numbering schema, business data & QR settings
 */
import { settingsService } from './settingsService.js';

export const DEFAULT_RECEIPT_CONFIG = {
  businessName: 'Tech Wash Laundry Services',
  tagline: 'Next-Generation Premium Fabric Care & Couture Spa',
  phone: '+91 98765 43210',
  whatsapp: '+91 98765 43210',
  email: 'care@techwash.in',
  website: 'https://techwash.in',
  address: 'Main Road, Jubilee Hills, Hyderabad, Telangana - 500033',
  gstNumber: '36AAAAA0000A1Z5',
  fssaiOrReg: 'REG-TW-2026-HYD',
  prefixPattern: 'TW-{YEAR}-{NUMBER}',
  thankYouMessage: 'Thank you for trusting Tech Wash with your garments. Fresh clothes. Professional care.',
  footerContactNote: 'For queries, scheduling changes or feedback, contact our concierge at +91 98765 43210.',
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
    
    const year = new Date(order.createdAt || Date.now()).getFullYear();
    const rawNum = (order.orderNumber || order.id || '100001').replace(/[^0-9]/g, '').slice(-6) || '001245';
    const formattedSeq = rawNum.padStart(6, '0');
    
    const pattern = config.prefixPattern || 'TW-{YEAR}-{NUMBER}';
    return pattern
      .replace('{YEAR}', year)
      .replace('{NUMBER}', formattedSeq);
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

    const items = (order.items && order.items.length > 0)
      ? order.items
      : [
          {
            id: 'item-1',
            name: order.serviceName || 'Premium Garment Care',
            category: 'Care Service',
            quantity: 1,
            unitPrice: order.totalAmount || 499,
            totalPrice: order.totalAmount || 499,
          },
        ];

    return {
      invoiceNumber,
      orderNumber: order.orderNumber || order.id,
      invoiceDate,
      receiptGeneratedDate,
      customer: {
        name: order.customer?.name || 'Valued Customer',
        phone: order.customer?.phone || 'N/A',
        email: order.customer?.email || '',
        address: order.customer?.address || 'Pickup location confirmed on file',
        locality: order.customer?.locality || '',
        city: order.customer?.city || 'Hyderabad',
      },
      pickupLocation: order.pickupLocation || null,
      serviceName: order.serviceName || 'Garment Care',
      schedule: {
        pickupDate: order.schedule?.pickupDate || 'Scheduled on demand',
        pickupSlot: order.schedule?.pickupSlot || 'Morning Window',
        instructions: order.schedule?.instructions || '',
      },
      items,
      priceSnapshot: order.priceSnapshot || {
        itemsSubtotal: order.totalAmount || 499,
        expressFee: order.isExpress ? 99 : 0,
        deliveryFee: 0,
        discountAmount: 0,
        taxAmount: 0,
        finalTotal: order.totalAmount || 499,
      },
      totalAmount: order.totalAmount || order.priceSnapshot?.finalTotal || 499,
      paymentStatus: order.paymentStatus || 'PENDING',
      paymentMethod: order.paymentMethod || 'PAY_ON_DELIVERY',
      paymentId: order.paymentId || order.transactionId || null,
      customerStage: order.customerStage || 'CONFIRMED',
      internalNotes: order.internalNotes || '',
      assignedStaff: order.assignedStaff || null,
    };
  },
};

/**
 * Tech Wash Dynamic Pricing Engine
 * Computes base price, line items, express add-on, delivery fees, taxes, and generates
 * an immutable `priceSnapshot` frozen inside the order.
 */

export const PRICING_UNITS = {
  PER_PIECE: 'per piece',
  PER_KG: 'per kg',
  PER_PAIR: 'per pair',
  STARTING_AT: 'starting at',
  FIXED_PACKAGE: 'fixed package',
  CUSTOM_QUOTE: 'custom quote',
};

export const DEFAULT_DELIVERY_RULES = {
  freeDeliveryThreshold: 499,
  standardDeliveryFee: 49,
  expressDeliveryMultiplier: 1.5, // 50% extra for 24-hr express turnaround
  expressFlatFee: 99,
  taxRate: 0.05, // 5% GST on laundry services in India
};

/**
 * Calculates accurate order financial totals and produces the immutable snapshot
 */
export const calculateOrderTotal = ({
  items = [],
  service = null,
  isExpress = false,
  coupon = null,
  deliveryRules = DEFAULT_DELIVERY_RULES,
}) => {
  // 1. Calculate items subtotal
  let itemsSubtotal = 0;
  const processedItems = items.map((item) => {
    const itemPrice = Number(item.unitPrice || item.price || 0);
    const itemQty = Number(item.quantity || 1);
    const lineTotal = itemPrice * itemQty;
    itemsSubtotal += lineTotal;

    return {
      id: item.id || `item-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      name: item.name || 'Garment Item',
      category: item.category || 'General',
      unit: item.unit || 'piece',
      unitPrice: itemPrice,
      quantity: itemQty,
      lineTotal,
      tag: item.tag || null, // Future Barcode/RFID tag ID readiness
    };
  });

  // If no items were individually selected, use service base price if available
  let baseAmount = itemsSubtotal;
  if (itemsSubtotal === 0 && service?.startingPrice) {
    baseAmount = Number(service.startingPrice);
  }

  // 2. Express Delivery surcharge
  const expressFee = isExpress ? deliveryRules.expressFlatFee : 0;

  // 3. Delivery Fee (Free if above threshold)
  const deliveryFee = (baseAmount >= deliveryRules.freeDeliveryThreshold || baseAmount === 0)
    ? 0
    : deliveryRules.standardDeliveryFee;

  // 4. Calculate Discount
  let discountAmount = 0;
  if (coupon) {
    if (coupon.type === 'percentage') {
      discountAmount = Math.round((baseAmount * (coupon.value / 100)));
      if (coupon.maxDiscount) {
        discountAmount = Math.min(discountAmount, coupon.maxDiscount);
      }
    } else if (coupon.type === 'flat') {
      discountAmount = Math.min(baseAmount, coupon.value);
    }
  }

  // 5. Tax Calculation
  const taxableAmount = Math.max(0, baseAmount + expressFee - discountAmount);
  const taxAmount = Math.round(taxableAmount * deliveryRules.taxRate);

  // 6. Final Payable Total
  const finalTotal = Math.max(0, taxableAmount + deliveryFee + taxAmount);

  // 7. Generate Immutable Price Snapshot
  const priceSnapshot = {
    calculatedAt: new Date().toISOString(),
    currency: 'INR',
    itemsSubtotal: baseAmount,
    expressFee,
    deliveryFee,
    discountAmount,
    taxAmount,
    finalTotal,
    appliedCoupon: coupon ? { code: coupon.code, discount: discountAmount } : null,
    itemsSnapshot: processedItems,
    taxRate: deliveryRules.taxRate,
    isExpress,
  };

  return {
    itemsSubtotal: baseAmount,
    expressFee,
    deliveryFee,
    discountAmount,
    taxAmount,
    finalTotal,
    processedItems,
    priceSnapshot,
  };
};

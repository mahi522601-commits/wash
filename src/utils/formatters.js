/**
 * Currency, date, and text formatters for Tech Wash
 */

export const formatCurrency = (amount) => {
  if (amount === undefined || amount === null || isNaN(amount)) return '₹0';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
};

export const formatDate = (dateInput) => {
  if (!dateInput) return '—';
  try {
    const date = dateInput.toDate ? dateInput.toDate() : new Date(dateInput);
    if (isNaN(date.getTime())) return '—';
    return new Intl.DateTimeFormat('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(date);
  } catch (e) {
    return '—';
  }
};

export const formatDateTime = (dateInput) => {
  if (!dateInput) return '—';
  try {
    const date = dateInput.toDate ? dateInput.toDate() : new Date(dateInput);
    if (isNaN(date.getTime())) return '—';
    return new Intl.DateTimeFormat('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }).format(date);
  } catch (e) {
    return '—';
  }
};

export const formatFileSize = (bytes) => {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

export const slugify = (text) => {
  if (!text) return '';
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-');
};

export const truncateText = (text, maxLength = 100) => {
  if (!text || text.length <= maxLength) return text || '';
  return `${text.substring(0, maxLength)}...`;
};

/**
 * Parse order items into structured, human-readable Pin-to-Pin categorization
 * Splits into:
 * 1. scales: Weighed batches with weight, rate, line total (e.g. 🧺 Wash & Fold: 2.0 Kg @ ₹100/Kg = ₹200)
 * 2. clothes: Weighed piece counts without messy @₹0 (e.g. 👔 4 pcs: 2x Shirt, 2x Pant)
 * 3. specialServices: Itemized garments & specialty care (e.g. ✨ 1x Silk Saree @ ₹220, 1x Sneaker Spa @ ₹350)
 * 4. expressFee: Express rush charge if applicable
 * 5. textSummary: Clean single-line pipe-separated string for CSV & WhatsApp
 */
export const parsePinToPinItems = (order) => {
  if (!order) return { scales: [], clothes: [], specialServices: [], totalClothesCount: 0, expressFee: 0, textSummary: 'Garment Care' };

  const items = Array.isArray(order.items) ? order.items : [];
  const scales = [];
  const clothes = [];
  const specialServices = [];

  items.forEach(it => {
    const rawName = String(it.name || it.subServiceName || '').trim();
    const unitPrice = Number(it.unitPrice !== undefined ? it.unitPrice : (it.price !== undefined ? it.price : 0));
    const qty = Math.max(1, Number(it.quantity || 1));
    const lineTotal = Number(it.lineTotal !== undefined ? it.lineTotal : unitPrice * qty);

    const isWeightScaleItem = Boolean(
      it.isWeightItem === true ||
      rawName.toLowerCase().includes('scale batch') ||
      rawName.toLowerCase().includes('scale (') ||
      (it.category && it.category.toLowerCase().includes('scale')) ||
      (it.weightKg && (it.pricePerKg || unitPrice > 0))
    );

    if (isWeightScaleItem) {
      // Extract weight and rate from item properties or name
      const weightMatch = rawName.match(/([\d\.]+)\s*kg/i);
      const rateMatch = rawName.match(/@\s*₹?\s*(\d+(?:\.\d+)?)/i);
      const weight = it.weightKg || (weightMatch ? weightMatch[1] : '');
      const rate = it.pricePerKg || (rateMatch ? rateMatch[1] : (weight && lineTotal ? Math.round(lineTotal / Number(weight)) : ''));
      
      const isFold = rawName.toLowerCase().includes('fold') || (it.serviceName && it.serviceName.toLowerCase().includes('fold'));
      const serviceTitle = isFold ? 'Wash & Fold' : 'Wash & Steam Iron';
      const emoji = isFold ? '🧺' : '🫧';

      scales.push({
        emoji,
        serviceTitle,
        weight: weight ? `${weight} Kg` : '',
        rate: rate ? `₹${rate}/Kg` : '',
        lineTotal,
        rawName,
      });
    } else if (unitPrice === 0 || it.isCountOnly === true || (it.category && it.category.toLowerCase().includes('clothes'))) {
      // Weighed garment piece tally (Billed under weighed batch, unitPrice: 0)
      // Clean up repetitive prefixes like "🧺 Wash & Fold — " or "🫧 Wash & Steam Iron — "
      let cleanName = rawName
        .replace(/^[🧺🫧👔✨⚡\s]+/, '')
        .replace(/^(?:Wash\s*&\s*(?:Fold|Steam\s*Iron|Iron))\s*[—–-]\s*/i, '')
        .replace(/\s*\(@?₹0\)/gi, '')
        .trim();

      clothes.push({
        name: cleanName || rawName,
        quantity: qty,
        emoji: it.emoji || '👔',
      });
    } else {
      // Itemized Specialty Garment / Service (Dry Clean, Steam Press, Shoes, Starch, Custom Charges)
      let cleanName = rawName
        .replace(/^[🧺🫧👔✨⚡\s]+/, '')
        .replace(/\s*\(@?₹\d+\)/gi, '')
        .trim();

      specialServices.push({
        name: cleanName || rawName,
        quantity: qty,
        unitPrice,
        lineTotal,
        emoji: it.emoji || '✨',
      });
    }
  });

  // Fallback for orders with weightKg on order object but no scale item in array
  if (scales.length === 0 && (order.pricingType === 'per_kg' || order.actualWeight || order.estimatedWeightKg || order.weightKg)) {
    const w = Number(order.actualWeight || order.estimatedWeightKg || order.weightKg || 0);
    if (w > 0) {
      const rate = order.pricePerKg || order.priceSnapshot?.pricePerKg || 100;
      const sName = order.serviceName || order.service || 'Wash & Fold';
      const isFold = !sName.toLowerCase().includes('iron');
      scales.push({
        emoji: isFold ? '🧺' : '🫧',
        serviceTitle: sName,
        weight: `${w} Kg`,
        rate: `₹${rate}/Kg`,
        lineTotal: Math.round(w * rate),
        rawName: `${sName} (${w} Kg @ ₹${rate}/Kg)`
      });
    }
  }

  // Fallback if no items at all
  if (scales.length === 0 && clothes.length === 0 && specialServices.length === 0) {
    const sName = order.serviceName || order.service || 'Garment Care';
    const total = Number(order.totalAmount || order.finalPrice || 0);
    specialServices.push({
      name: sName,
      quantity: 1,
      unitPrice: total,
      lineTotal: total,
      emoji: '🧺',
    });
  }

  const expressFee = Number(order.priceSnapshot?.expressFee || (order.isExpress ? 100 : 0));
  const totalClothesCount = clothes.reduce((sum, c) => sum + c.quantity, 0);

  // Build clean text summary for CSV, exports, logs & WhatsApp
  const textParts = [];
  if (scales.length > 0) {
    scales.forEach(s => {
      textParts.push(`${s.emoji} ${s.serviceTitle}${s.weight ? ` [${s.weight}${s.rate ? ` @ ${s.rate}` : ''} = ₹${s.lineTotal}]` : ''}`);
    });
  }
  if (clothes.length > 0) {
    const pieceDetails = clothes.map(c => `${c.quantity}x ${c.name}`).join(', ');
    textParts.push(`👔 Weighed Clothes (${totalClothesCount} pcs): ${pieceDetails}`);
  }
  if (specialServices.length > 0) {
    const srvDetails = specialServices.map(s => `${s.quantity}x ${s.name} (₹${s.lineTotal})`).join(', ');
    textParts.push(`✨ Itemized: ${srvDetails}`);
  }
  if (expressFee > 0) {
    textParts.push(`⚡ Express 24H (₹${expressFee})`);
  }

  return {
    scales,
    clothes,
    totalClothesCount,
    specialServices,
    expressFee,
    textSummary: textParts.join(' | ') || (order.serviceName || 'Garment Care'),
  };
};


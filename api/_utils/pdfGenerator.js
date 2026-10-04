import PDFDocument from 'pdfkit';

/**
 * Generate A4 PDF Report Buffer for Tech Wash Daily Sales Summary
 * @param {Object} reportData - Calculated financial metrics matching reportService
 * @returns {Promise<Buffer>} - Resolves to PDF Buffer
 */
export function generateDailyReportPDF(reportData) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 40,
        info: {
          Title: `Tech Wash Daily Sales Report - ${reportData.dateFormatted}`,
          Author: 'Tech Wash Laundry Financial System',
          Subject: 'Daily Sales & Financial Settlement Audit',
        },
      });

      const buffers = [];
      doc.on('data', chunk => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', err => reject(err));

      const primaryColor = '#1e3a8a';   // Deep navy blue
      const secondaryColor = '#0284c7'; // Cyan / sky blue
      const textColor = '#1f2937';      // Dark gray
      const subTextColor = '#4b5563';   // Light gray
      const accentBg = '#f0f9ff';       // Light cyan fill
      const tableBorder = '#e5e7eb';
      const noDataBg = '#fef2f2';       // Rose fill for no data
      const noDataBorder = '#f87171';   // Rose border

      // --- BRAND HEADER ---
      doc
        .rect(40, 40, 515, 60)
        .fill(primaryColor);

      doc
        .fillColor('#ffffff')
        .fontSize(18)
        .font('Helvetica-Bold')
        .text('TECH WASH LAUNDRY SERVICES', 55, 52);

      doc
        .fontSize(10)
        .font('Helvetica')
        .text('DAILY EXECUTIVE SALES & RECONCILIATION AUDIT', 55, 75);

      doc
        .fontSize(9)
        .text(`Date: ${reportData.dateFormatted}`, 410, 55, { align: 'right' })
        .text(`Period: ${reportData.windowStr || '10:00 PM - 10:00 PM'}`, 350, 72, { align: 'right' });

      let y = 115;

      const metrics = reportData.metrics || {};
      const c1 = metrics.category1 || {};
      const c2 = metrics.category2 || {};
      const totalOrdersCount = metrics.totalOrdersCount || 0;

      // --- NO DATA BANNER IF 0 TRANSACTIONS ---
      if (totalOrdersCount === 0) {
        doc
          .rect(40, y, 515, 45)
          .fillAndStroke(noDataBg, noDataBorder);

        doc
          .fillColor('#991b1b')
          .fontSize(12)
          .font('Helvetica-Bold')
          .text('NO SALES DATA / NO BILLS FOR THIS REPORTING PERIOD', 55, y + 12, { align: 'center' });

        doc
          .fillColor(subTextColor)
          .fontSize(9)
          .font('Helvetica')
          .text('Zero transaction records were logged during this cutoff window across all 3 store branches.', 55, y + 28, { align: 'center' });

        y += 60;
      }

      // --- SECTION 1: OVERALL EXECUTIVE SUMMARY ---
      doc
        .fillColor(primaryColor)
        .fontSize(12)
        .font('Helvetica-Bold')
        .text('1. OVERALL REVENUE & SALES SUMMARY', 40, y);

      y += 18;

      // Card Grid Box
      doc
        .rect(40, y, 515, 60)
        .fillAndStroke(accentBg, secondaryColor);

      doc
        .fillColor(textColor)
        .fontSize(9)
        .font('Helvetica-Bold')
        .text('Gross Billed Sales:', 55, y + 12)
        .font('Helvetica')
        .text(`Rs. ${(metrics.totalGrossBilled || 0).toLocaleString('en-IN')}`, 160, y + 12)

        .font('Helvetica-Bold')
        .text('Collections Inflow:', 300, y + 12)
        .font('Helvetica')
        .text(`Rs. ${(c1.totalInflowCollections || 0).toLocaleString('en-IN')}`, 410, y + 12)

        .font('Helvetica-Bold')
        .text('Net Pending Dues:', 55, y + 36)
        .font('Helvetica')
        .text(`Rs. ${(c2.totalNetPendingDues || 0).toLocaleString('en-IN')}`, 160, y + 36)

        .font('Helvetica-Bold')
        .text('Recovered Dues:', 300, y + 36)
        .font('Helvetica')
        .text(`Rs. ${(c2.totalRecoveredDues || 0).toLocaleString('en-IN')}`, 410, y + 36);

      y += 75;

      // --- SECTION 2: COLLECTIONS BY PAYMENT METHOD ---
      doc
        .fillColor(primaryColor)
        .fontSize(12)
        .font('Helvetica-Bold')
        .text('2. COLLECTIONS INFLOW BY PAYMENT METHOD', 40, y);

      y += 18;

      // Table Header
      doc.rect(40, y, 515, 18).fill(secondaryColor);
      doc
        .fillColor('#ffffff')
        .fontSize(9)
        .font('Helvetica-Bold')
        .text('Payment Mode', 55, y + 4)
        .text('Description', 200, y + 4)
        .text('Amount Received', 420, y + 4, { align: 'right' });

      y += 18;

      const paymentModes = [
        { mode: 'Cash', desc: 'Cash collected at counter / doorstep', amt: c1.cashReceived || 0 },
        { mode: 'UPI / Dynamic QR', desc: 'PhonePe, GPay, Paytm, BHIM QR', amt: c1.upiReceived || 0 },
        { mode: 'Card / POS', desc: 'Credit / Debit card machine swipe', amt: c1.cardReceived || 0 },
        { mode: 'Online Web', desc: 'Website pre-paid portal bookings', amt: c1.onlineReceived || 0 },
      ];

      paymentModes.forEach((pm, idx) => {
        const bg = idx % 2 === 0 ? '#f9fafb' : '#ffffff';
        doc.rect(40, y, 515, 18).fillAndStroke(bg, tableBorder);
        doc
          .fillColor(textColor)
          .fontSize(9)
          .font('Helvetica')
          .text(pm.mode, 55, y + 4)
          .text(pm.desc, 200, y + 4)
          .text(`Rs. ${pm.amt.toLocaleString('en-IN')}`, 420, y + 4, { align: 'right' });
        y += 18;
      });

      // Total Row
      doc.rect(40, y, 515, 20).fillAndStroke('#f0f9ff', secondaryColor);
      doc
        .fillColor(primaryColor)
        .fontSize(9)
        .font('Helvetica-Bold')
        .text('TOTAL INFLOW COLLECTED', 55, y + 5)
        .text(`Rs. ${(c1.totalInflowCollections || 0).toLocaleString('en-IN')}`, 420, y + 5, { align: 'right' });

      y += 32;

      // --- SECTION 3: BRANCH-WISE PERFORMANCE ---
      doc
        .fillColor(primaryColor)
        .fontSize(12)
        .font('Helvetica-Bold')
        .text('3. BRANCH-WISE SALES & COLLECTIONS', 40, y);

      y += 18;

      doc.rect(40, y, 515, 18).fill(secondaryColor);
      doc
        .fillColor('#ffffff')
        .fontSize(9)
        .font('Helvetica-Bold')
        .text('Store Branch / Terminal', 55, y + 4)
        .text('Orders', 250, y + 4)
        .text('Gross Sales', 340, y + 4, { align: 'right' })
        .text('Collected', 440, y + 4, { align: 'right' });

      y += 18;

      const branches = reportData.branchStats || [
        { name: 'Main Branch — Manikonda (POS-01)', count: 0, billed: 0, received: 0 },
        { name: 'Branch 1 — Tolichowki (POS-02)', count: 0, billed: 0, received: 0 },
        { name: 'Pick Up Point — Ambience (POS-03)', count: 0, billed: 0, received: 0 },
        { name: 'Website Online Pickup', count: 0, billed: 0, received: 0 },
      ];

      branches.forEach((b, idx) => {
        const bg = idx % 2 === 0 ? '#f9fafb' : '#ffffff';
        doc.rect(40, y, 515, 18).fillAndStroke(bg, tableBorder);
        doc
          .fillColor(textColor)
          .fontSize(9)
          .font('Helvetica')
          .text(b.name, 55, y + 4)
          .text(String(b.count || 0), 250, y + 4)
          .text(`Rs. ${(b.billed || 0).toLocaleString('en-IN')}`, 340, y + 4, { align: 'right' })
          .text(`Rs. ${(b.received || 0).toLocaleString('en-IN')}`, 440, y + 4, { align: 'right' });
        y += 18;
      });

      y += 28;

      // --- SECTION 4: OUTSTANDING DUES & VOLUME METRICS ---
      doc
        .fillColor(primaryColor)
        .fontSize(12)
        .font('Helvetica-Bold')
        .text('4. DUES LIFECYCLE & VOLUME METRICS', 40, y);

      y += 18;

      doc
        .rect(40, y, 515, 50)
        .fillAndStroke('#fdf2f8', '#f472b6');

      doc
        .fillColor(textColor)
        .fontSize(9)
        .font('Helvetica-Bold')
        .text('Total Invoices:', 55, y + 10)
        .font('Helvetica')
        .text(`${totalOrdersCount} Bills`, 160, y + 10)

        .font('Helvetica-Bold')
        .text('Fully Paid Invoices:', 300, y + 10)
        .font('Helvetica')
        .text(`${c2.fullyPaidOrdersCount || 0} Bills`, 410, y + 10)

        .font('Helvetica-Bold')
        .text('Unpaid / Partial Invoices:', 55, y + 28)
        .font('Helvetica')
        .text(`${(c2.partialOrdersCount || 0) + (c2.unpaidOrdersCount || 0)} Bills`, 160, y + 28)

        .font('Helvetica-Bold')
        .text('Volume Cleaned:', 300, y + 28)
        .font('Helvetica')
        .text(`${metrics.totalPiecesCount || 0} Pcs / ${metrics.totalWeightKg || 0} Kg`, 410, y + 28);

      y += 65;

      // --- SECTION 5: CANCELLATIONS & REFUNDS ---
      doc
        .fillColor(primaryColor)
        .fontSize(12)
        .font('Helvetica-Bold')
        .text('5. CANCELLATIONS & REFUNDS SUMMARY', 40, y);

      y += 18;

      const canc = reportData.cancellations || { count: 0, totalAmount: 0 };
      doc
        .rect(40, y, 515, 32)
        .fillAndStroke('#fff1f2', '#fda4af');

      doc
        .fillColor(textColor)
        .fontSize(9)
        .font('Helvetica-Bold')
        .text('Cancelled Orders Count:', 55, y + 10)
        .font('Helvetica')
        .text(`${canc.count} Orders`, 190, y + 10)

        .font('Helvetica-Bold')
        .text('Total Cancelled Value:', 300, y + 10)
        .font('Helvetica')
        .text(`Rs. ${(canc.totalAmount || 0).toLocaleString('en-IN')}`, 430, y + 10);

      // --- FOOTER ---
      doc
        .fontSize(8)
        .fillColor(subTextColor)
        .text('Tech Wash Laundry Services • Certified Operations Audit • Confidential Internal Document', 40, 785, { align: 'center' });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

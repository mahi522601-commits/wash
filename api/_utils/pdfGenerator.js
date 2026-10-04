import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

function getActualLogoPath() {
  const possiblePaths = [
    path.join(process.cwd(), 'public', 'techwashlogo.webp'),
    path.join(process.cwd(), 'public', 'techwashh.webp'),
    path.join(process.cwd(), 'src', 'assets', 'techwashlogo.webp'),
  ];
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) return p;
  }
  return null;
}

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

      // --- BRAND HEADER WITH ACTUAL LOGO ---
      doc.rect(40, 40, 515, 65).fill(primaryColor);

      const logoPath = getActualLogoPath();
      if (logoPath) {
        try {
          doc.image(logoPath, 50, 47, { fit: [140, 50] });
        } catch (e) {
          doc.fillColor('#ffffff').fontSize(18).font('Helvetica-Bold').text('TECH WASH', 55, 52);
        }
      } else {
        doc.fillColor('#ffffff').fontSize(18).font('Helvetica-Bold').text('TECH WASH', 55, 52);
      }

      doc
        .fillColor('#ffffff')
        .fontSize(14)
        .font('Helvetica-Bold')
        .text('TECH WASH LAUNDRY SERVICES', 190, 48);

      doc
        .fontSize(9)
        .font('Helvetica')
        .text('DAILY EXECUTIVE SALES & RECONCILIATION AUDIT', 190, 66);

      doc
        .fontSize(8.5)
        .text(`Date: ${reportData.dateFormatted}`, 380, 84, { align: 'right' })
        .text(`Period: ${reportData.windowStr || '10:00 PM - 10:00 PM'}`, 340, 95, { align: 'right' });

      let y = 120;

      const metrics = reportData.metrics || {};
      const c1 = metrics.category1 || {};
      const c2 = metrics.category2 || {};
      const totalOrdersCount = metrics.totalOrdersCount || 0;

      // --- NO DATA BANNER IF 0 TRANSACTIONS ---
      if (totalOrdersCount === 0) {
        doc
          .rect(40, y, 515, 42)
          .fillAndStroke(noDataBg, noDataBorder);

        doc
          .fillColor('#991b1b')
          .fontSize(11)
          .font('Helvetica-Bold')
          .text('NO SALES DATA / NO BILLS FOR THIS REPORTING PERIOD', 55, y + 10, { align: 'center' });

        doc
          .fillColor(subTextColor)
          .fontSize(8.5)
          .font('Helvetica')
          .text('Zero transaction records were logged during this cutoff window across all 3 store branches.', 55, y + 25, { align: 'center' });

        y += 55;
      }

      // --- SECTION 1: OVERALL EXECUTIVE SUMMARY ---
      doc
        .fillColor(primaryColor)
        .fontSize(11)
        .font('Helvetica-Bold')
        .text('1. OVERALL REVENUE & SALES SUMMARY', 40, y);

      y += 16;

      // Card Grid Box
      doc
        .rect(40, y, 515, 55)
        .fillAndStroke(accentBg, secondaryColor);

      doc
        .fillColor(textColor)
        .fontSize(8.5)
        .font('Helvetica-Bold')
        .text('Gross Billed Sales:', 55, y + 10)
        .font('Helvetica')
        .text(`Rs. ${(metrics.totalGrossBilled || 0).toLocaleString('en-IN')}`, 155, y + 10)

        .font('Helvetica-Bold')
        .text('Collections Inflow:', 300, y + 10)
        .font('Helvetica')
        .text(`Rs. ${(c1.totalInflowCollections || 0).toLocaleString('en-IN')}`, 405, y + 10)

        .font('Helvetica-Bold')
        .text('Net Pending Dues:', 55, y + 32)
        .font('Helvetica')
        .text(`Rs. ${(c2.totalNetPendingDues || 0).toLocaleString('en-IN')}`, 155, y + 32)

        .font('Helvetica-Bold')
        .text('Recovered Dues:', 300, y + 32)
        .font('Helvetica')
        .text(`Rs. ${(c2.totalRecoveredDues || 0).toLocaleString('en-IN')}`, 405, y + 32);

      y += 68;

      // --- SECTION 2: COLLECTIONS BY PAYMENT METHOD ---
      doc
        .fillColor(primaryColor)
        .fontSize(11)
        .font('Helvetica-Bold')
        .text('2. COLLECTIONS INFLOW BY PAYMENT METHOD', 40, y);

      y += 16;

      // Table Header
      doc.rect(40, y, 515, 16).fill(secondaryColor);
      doc
        .fillColor('#ffffff')
        .fontSize(8.5)
        .font('Helvetica-Bold')
        .text('Payment Mode', 55, y + 3)
        .text('Description', 200, y + 3)
        .text('Amount Received', 420, y + 3, { align: 'right' });

      y += 16;

      const paymentModes = [
        { mode: 'Cash', desc: 'Cash collected at register / doorstep', amt: c1.cashReceived || 0 },
        { mode: 'UPI / Dynamic QR', desc: 'PhonePe, GPay, Paytm, BHIM QR', amt: c1.upiReceived || 0 },
        { mode: 'Card / POS', desc: 'Credit / Debit card machine swipe', amt: c1.cardReceived || 0 },
        { mode: 'Online Web', desc: 'Website pre-paid portal bookings', amt: c1.onlineReceived || 0 },
      ];

      paymentModes.forEach((pm, idx) => {
        const bg = idx % 2 === 0 ? '#f9fafb' : '#ffffff';
        doc.rect(40, y, 515, 16).fillAndStroke(bg, tableBorder);
        doc
          .fillColor(textColor)
          .fontSize(8.5)
          .font('Helvetica')
          .text(pm.mode, 55, y + 3)
          .text(pm.desc, 200, y + 3)
          .text(`Rs. ${pm.amt.toLocaleString('en-IN')}`, 420, y + 3, { align: 'right' });
        y += 16;
      });

      // Total Row
      doc.rect(40, y, 515, 18).fillAndStroke('#f0f9ff', secondaryColor);
      doc
        .fillColor(primaryColor)
        .fontSize(8.5)
        .font('Helvetica-Bold')
        .text('TOTAL INFLOW COLLECTED', 55, y + 4)
        .text(`Rs. ${(c1.totalInflowCollections || 0).toLocaleString('en-IN')}`, 420, y + 4, { align: 'right' });

      y += 28;

      // --- SECTION 3: BRANCH-WISE PERFORMANCE ---
      doc
        .fillColor(primaryColor)
        .fontSize(11)
        .font('Helvetica-Bold')
        .text('3. BRANCH-WISE SALES & COLLECTIONS', 40, y);

      y += 16;

      doc.rect(40, y, 515, 16).fill(secondaryColor);
      doc
        .fillColor('#ffffff')
        .fontSize(8.5)
        .font('Helvetica-Bold')
        .text('Store Branch / Terminal', 55, y + 3)
        .text('Orders', 250, y + 3)
        .text('Gross Sales', 340, y + 3, { align: 'right' })
        .text('Collected', 440, y + 3, { align: 'right' });

      y += 16;

      const branches = reportData.branchStats || [
        { name: 'Main Branch — Manikonda (POS-01)', count: 0, billed: 0, received: 0 },
        { name: 'Branch 1 — Tolichowki (POS-02)', count: 0, billed: 0, received: 0 },
        { name: 'Pick Up Point — Ambience (POS-03)', count: 0, billed: 0, received: 0 },
        { name: 'Website Online Pickup', count: 0, billed: 0, received: 0 },
      ];

      branches.forEach((b, idx) => {
        const bg = idx % 2 === 0 ? '#f9fafb' : '#ffffff';
        doc.rect(40, y, 515, 16).fillAndStroke(bg, tableBorder);
        doc
          .fillColor(textColor)
          .fontSize(8.5)
          .font('Helvetica')
          .text(b.name, 55, y + 3)
          .text(String(b.count || 0), 250, y + 3)
          .text(`Rs. ${(b.billed || 0).toLocaleString('en-IN')}`, 340, y + 3, { align: 'right' })
          .text(`Rs. ${(b.received || 0).toLocaleString('en-IN')}`, 440, y + 3, { align: 'right' });
        y += 16;
      });

      y += 25;

      // --- SECTION 4: SERVICE CATEGORY REVENUE BREAKDOWN ---
      doc
        .fillColor(primaryColor)
        .fontSize(11)
        .font('Helvetica-Bold')
        .text('4. SERVICE CATEGORY REVENUE & VOLUME BREAKDOWN', 40, y);

      y += 16;

      doc.rect(40, y, 515, 16).fill(secondaryColor);
      doc
        .fillColor('#ffffff')
        .fontSize(8.5)
        .font('Helvetica-Bold')
        .text('Service Category', 55, y + 3)
        .text('Pieces', 240, y + 3)
        .text('Weight (Kg)', 340, y + 3, { align: 'right' })
        .text('Revenue Billed', 440, y + 3, { align: 'right' });

      y += 16;

      const serviceCats = reportData.serviceCategories || [
        { category: 'Premium Dry Cleaning', count: 0, pieces: 0, weight: 0, amount: 0 },
        { category: 'Wash & Fold', count: 0, pieces: 0, weight: 0, amount: 0 },
        { category: 'Wash & Iron', count: 0, pieces: 0, weight: 0, amount: 0 },
        { category: 'Steam Pressing', count: 0, pieces: 0, weight: 0, amount: 0 },
      ];

      serviceCats.forEach((sc, idx) => {
        const bg = idx % 2 === 0 ? '#f9fafb' : '#ffffff';
        doc.rect(40, y, 515, 16).fillAndStroke(bg, tableBorder);
        doc
          .fillColor(textColor)
          .fontSize(8.5)
          .font('Helvetica')
          .text(sc.category, 55, y + 3)
          .text(String(sc.pieces || 0), 240, y + 3)
          .text(`${sc.weight || 0} Kg`, 340, y + 3, { align: 'right' })
          .text(`Rs. ${(sc.amount || 0).toLocaleString('en-IN')}`, 440, y + 3, { align: 'right' });
        y += 16;
      });

      y += 25;

      // --- SECTION 5: OUTSTANDING DUES & VOLUME METRICS ---
      doc
        .fillColor(primaryColor)
        .fontSize(11)
        .font('Helvetica-Bold')
        .text('5. DUES LIFECYCLE & VOLUME SUMMARY', 40, y);

      y += 16;

      doc
        .rect(40, y, 515, 45)
        .fillAndStroke('#fdf2f8', '#f472b6');

      doc
        .fillColor(textColor)
        .fontSize(8.5)
        .font('Helvetica-Bold')
        .text('Total Invoices:', 55, y + 8)
        .font('Helvetica')
        .text(`${totalOrdersCount} Bills`, 155, y + 8)

        .font('Helvetica-Bold')
        .text('Fully Paid Invoices:', 300, y + 8)
        .font('Helvetica')
        .text(`${c2.fullyPaidOrdersCount || 0} Bills`, 405, y + 8)

        .font('Helvetica-Bold')
        .text('Unpaid / Partial Invoices:', 55, y + 26)
        .font('Helvetica')
        .text(`${(c2.partialOrdersCount || 0) + (c2.unpaidOrdersCount || 0)} Bills`, 155, y + 26)

        .font('Helvetica-Bold')
        .text('Volume Cleaned:', 300, y + 26)
        .font('Helvetica')
        .text(`${metrics.totalPiecesCount || 0} Pcs / ${metrics.totalWeightKg || 0} Kg`, 405, y + 26);

      y += 58;

      // --- SECTION 6: CANCELLATIONS & REFUNDS ---
      doc
        .fillColor(primaryColor)
        .fontSize(11)
        .font('Helvetica-Bold')
        .text('6. CANCELLATIONS & REFUNDS SUMMARY', 40, y);

      y += 16;

      const canc = reportData.cancellations || { count: 0, totalAmount: 0 };
      doc
        .rect(40, y, 515, 28)
        .fillAndStroke('#fff1f2', '#fda4af');

      doc
        .fillColor(textColor)
        .fontSize(8.5)
        .font('Helvetica-Bold')
        .text('Cancelled Orders Count:', 55, y + 8)
        .font('Helvetica')
        .text(`${canc.count} Orders`, 185, y + 8)

        .font('Helvetica-Bold')
        .text('Total Cancelled Value:', 300, y + 8)
        .font('Helvetica')
        .text(`Rs. ${(canc.totalAmount || 0).toLocaleString('en-IN')}`, 425, y + 8);

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

import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

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

      // --- BRAND HEADER WITH LOGO IMAGE / FALLBACK ---
      doc.rect(40, 40, 515, 65).fill(primaryColor);

      try {
        const logoPath = path.join(process.cwd(), 'public', 'techwashlogo.webp');
        if (fs.existsSync(logoPath)) {
          const logoBuf = fs.readFileSync(logoPath);
          doc.image(logoBuf, 50, 47, { fit: [130, 50] });
        } else {
          doc.fillColor('#ffffff').fontSize(16).font('Helvetica-Bold').text('TECH WASH', 55, 52);
        }
      } catch (imgErr) {
        console.warn('PDFKit logo image rendering fallback:', imgErr.message);
        doc.fillColor('#ffffff').fontSize(16).font('Helvetica-Bold').text('TECH WASH', 55, 52);
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

      y += 38;

      // --- SECTION 7: STAFF ATTENDANCE SUMMARY ---
      if (reportData.attendance && reportData.attendance.totalStaff > 0) {
        doc
          .fillColor(primaryColor)
          .fontSize(11)
          .font('Helvetica-Bold')
          .text('7. STAFF ON-DUTY & ATTENDANCE SUMMARY', 40, y);

        y += 16;

        const att = reportData.attendance;
        doc
          .rect(40, y, 515, 28)
          .fillAndStroke('#f0fdf4', '#86efac');

        const onDutyStr = att.onDutyList.length > 0 ? att.onDutyList.slice(0, 3).join(', ') : 'None';
        doc
          .fillColor(textColor)
          .fontSize(8.5)
          .font('Helvetica-Bold')
          .text('Staff on Duty:', 55, y + 8)
          .font('Helvetica')
          .text(`${att.presentCount} / ${att.totalStaff} (${onDutyStr})`, 130, y + 8)
          .font('Helvetica-Bold')
          .text('Absent / Leave:', 350, y + 8)
          .font('Helvetica')
          .text(`${att.absentCount} Staff`, 430, y + 8);
      }

      // --- PAGE 1 FOOTER ---
      doc
        .fontSize(8)
        .fillColor(subTextColor)
        .text('Tech Wash Laundry Services • Certified Operations Audit • Page 1', 40, 785, { align: 'center' });

      // ─────────────────────────────────────────────────────────────
      // PAGE 2: SECTION 8 — POS 1 & POS 2 COUNTER EXPENSES & ATTACHED BILLS
      // ─────────────────────────────────────────────────────────────
      const expData = reportData.expenses || {
        pos1: { count: 0, totalAmount: 0, cashAmount: 0, items: [] },
        pos2: { count: 0, totalAmount: 0, cashAmount: 0, items: [] },
        totalCount: 0,
        totalAmount: 0,
        totalCashAmount: 0,
        items: [],
        netCashDrawer: {
          grossCashInflow: c1.cashReceived || 0,
          totalCashExpenses: 0,
          netCashRemaining: c1.cashReceived || 0,
        }
      };

      doc.addPage({ size: 'A4', margin: 40 });
      let p2Y = 40;

      // Header Banner
      doc.rect(40, p2Y, 515, 42).fill(primaryColor);
      doc
        .fillColor('#ffffff')
        .fontSize(12)
        .font('Helvetica-Bold')
        .text('8. POS 1 & POS 2 COUNTER EXPENSES AUDIT & ATTACHED BILLS', 55, p2Y + 8);
      doc
        .fontSize(8)
        .font('Helvetica')
        .text(`Date: ${reportData.dateFormatted} | Certified Counter Operating Outflows, Cash Drawer Reconciliation & Attached Receipts`, 55, p2Y + 24);

      p2Y += 52;

      // Summary KPI Cards (3 Cards Across)
      // Card 1: POS-01
      doc.rect(40, p2Y, 165, 54).fillAndStroke('#eff6ff', '#93c5fd');
      doc
        .fillColor(primaryColor)
        .fontSize(8.5)
        .font('Helvetica-Bold')
        .text('POS-01 (Manikonda Main)', 48, p2Y + 8)
        .fillColor(textColor)
        .fontSize(8)
        .font('Helvetica')
        .text(`Bills Logged: ${expData.pos1?.count || 0}`, 48, p2Y + 22)
        .text(`Total Spent: Rs. ${(expData.pos1?.totalAmount || 0).toLocaleString('en-IN')}`, 48, p2Y + 32)
        .font('Helvetica-Bold')
        .text(`Cash Out: Rs. ${(expData.pos1?.cashAmount || 0).toLocaleString('en-IN')}`, 48, p2Y + 42);

      // Card 2: POS-02
      doc.rect(215, p2Y, 165, 54).fillAndStroke('#eff6ff', '#93c5fd');
      doc
        .fillColor(primaryColor)
        .fontSize(8.5)
        .font('Helvetica-Bold')
        .text('POS-02 (Tolichowki Br-1)', 223, p2Y + 8)
        .fillColor(textColor)
        .fontSize(8)
        .font('Helvetica')
        .text(`Bills Logged: ${expData.pos2?.count || 0}`, 223, p2Y + 22)
        .text(`Total Spent: Rs. ${(expData.pos2?.totalAmount || 0).toLocaleString('en-IN')}`, 223, p2Y + 32)
        .font('Helvetica-Bold')
        .text(`Cash Out: Rs. ${(expData.pos2?.cashAmount || 0).toLocaleString('en-IN')}`, 223, p2Y + 42);

      // Card 3: Net Cash Drawer Reconciliation
      const drawerCashRemaining = expData.netCashDrawer?.netCashRemaining !== undefined
        ? expData.netCashDrawer.netCashRemaining
        : Math.max(0, (c1.cashReceived || 0) - (expData.totalCashAmount || 0));

      doc.rect(390, p2Y, 165, 54).fillAndStroke('#f0fdf4', '#86efac');
      doc
        .fillColor('#15803d')
        .fontSize(8.5)
        .font('Helvetica-Bold')
        .text('Net Physical Cash Drawer', 398, p2Y + 8)
        .fillColor(textColor)
        .fontSize(8)
        .font('Helvetica')
        .text(`Gross Cash In: Rs. ${(c1.cashReceived || 0).toLocaleString('en-IN')}`, 398, p2Y + 22)
        .text(`Less Counter Cash: -Rs. ${(expData.totalCashAmount || 0).toLocaleString('en-IN')}`, 398, p2Y + 32)
        .fillColor('#15803d')
        .font('Helvetica-Bold')
        .text(`Net Drawer Cash: Rs. ${drawerCashRemaining.toLocaleString('en-IN')}`, 398, p2Y + 42);

      p2Y += 64;

      // Itemized Table
      doc.rect(40, p2Y, 515, 16).fill(secondaryColor);
      doc
        .fillColor('#ffffff')
        .fontSize(8)
        .font('Helvetica-Bold')
        .text('#', 46, p2Y + 4)
        .text('Counter / POS', 60, p2Y + 4)
        .text('Time', 145, p2Y + 4)
        .text('Expense Description / Category', 190, p2Y + 4)
        .text('Mode', 380, p2Y + 4)
        .text('Bill Photo', 430, p2Y + 4)
        .text('Amount', 490, p2Y + 4, { align: 'right' });

      p2Y += 16;

      const expenseItems = expData.items || [];
      if (expenseItems.length === 0) {
        doc.rect(40, p2Y, 515, 20).fillAndStroke('#ffffff', tableBorder);
        doc
          .fillColor(subTextColor)
          .fontSize(8)
          .font('Helvetica')
          .text('No counter expenses logged for POS 1 or POS 2 on this date.', 55, p2Y + 6);
        p2Y += 28;
      } else {
        expenseItems.forEach((exp, idx) => {
          if (p2Y > 730) {
            doc
              .fontSize(8)
              .fillColor(subTextColor)
              .text('Tech Wash Laundry Services • Certified Operations Audit • Page 2', 40, 785, { align: 'center' });
            doc.addPage({ size: 'A4', margin: 40 });
            p2Y = 40;
          }
          const bg = idx % 2 === 0 ? '#f9fafb' : '#ffffff';
          doc.rect(40, p2Y, 515, 18).fillAndStroke(bg, tableBorder);
          const hasPhoto = Boolean(exp.receiptAttachmentUrl);
          const time = exp.time || (exp.createdAt ? new Date(exp.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '-');
          const desc = `${exp.title || exp.categoryName || 'Expense'}${exp.notes ? ` (${exp.notes})` : ''}`.slice(0, 40);

          doc
            .fillColor(textColor)
            .fontSize(8)
            .font('Helvetica')
            .text(String(idx + 1), 46, p2Y + 4)
            .text(exp.posLabel || exp.source || 'POS', 60, p2Y + 4)
            .text(time, 145, p2Y + 4)
            .text(desc, 190, p2Y + 4)
            .text(String(exp.paymentMode || 'CASH').toUpperCase(), 380, p2Y + 4)
            .text(hasPhoto ? '✓ ATTACHED' : 'No Bill', 430, p2Y + 4)
            .font('Helvetica-Bold')
            .text(`Rs. ${(Number(exp.amount) || 0).toLocaleString('en-IN')}`, 490, p2Y + 4, { align: 'right' });

          p2Y += 18;
        });

        // Total Row
        doc.rect(40, p2Y, 515, 18).fillAndStroke('#f0f9ff', secondaryColor);
        doc
          .fillColor(primaryColor)
          .fontSize(8.5)
          .font('Helvetica-Bold')
          .text('TOTAL COUNTER EXPENSES (POS 1 + POS 2)', 55, p2Y + 4)
          .text(`Rs. ${(expData.totalAmount || 0).toLocaleString('en-IN')}`, 490, p2Y + 4, { align: 'right' });

        p2Y += 28;
      }

      // ─────────────────────────────────────────────────────────────
      // ATTACHED BILL RECEIPTS (VISUAL PHOTO GALLERY AUDIT)
      // ─────────────────────────────────────────────────────────────
      const itemsWithBills = expenseItems.filter(e => e.receiptAttachmentUrl && typeof e.receiptAttachmentUrl === 'string');

      if (itemsWithBills.length > 0) {
        if (p2Y > 560) {
          doc
            .fontSize(8)
            .fillColor(subTextColor)
            .text('Tech Wash Laundry Services • Certified Operations Audit • Page 2', 40, 785, { align: 'center' });
          doc.addPage({ size: 'A4', margin: 40 });
          p2Y = 40;
        }

        doc
          .fillColor(primaryColor)
          .fontSize(11)
          .font('Helvetica-Bold')
          .text(`ATTACHED BILL RECEIPTS (${itemsWithBills.length} BILLS VERIFIED <= 50 KB)`, 40, p2Y);

        p2Y += 16;

        let imgCol = 0;
        const colWidth = 248;
        const colHeight = 165;

        for (let i = 0; i < itemsWithBills.length; i++) {
          const item = itemsWithBills[i];

          // Check page break
          if (p2Y + colHeight + 25 > 770 && imgCol === 0) {
            doc
              .fontSize(8)
              .fillColor(subTextColor)
              .text('Tech Wash Laundry Services • Certified Operations Audit • Attached Receipts', 40, 785, { align: 'center' });
            doc.addPage({ size: 'A4', margin: 40 });
            p2Y = 40;
          }

          const cardX = 40 + (imgCol * (colWidth + 19));
          const cardY = p2Y;

          // Box container
          doc.rect(cardX, cardY, colWidth, colHeight).fillAndStroke('#ffffff', '#cbd5e1');

          // Header strip for this bill
          doc.rect(cardX, cardY, colWidth, 18).fill(primaryColor);
          const billTitle = `${item.posLabel || item.source || 'POS'} — Rs. ${Number(item.amount || 0).toLocaleString('en-IN')} (${(item.title || item.categoryName || 'Bill').slice(0, 20)})`;
          doc
            .fillColor('#ffffff')
            .fontSize(7.5)
            .font('Helvetica-Bold')
            .text(billTitle, cardX + 6, cardY + 5);

          // Embed Compressed Bill Image
          try {
            const rawDataUrl = item.receiptAttachmentUrl;
            let imgBuffer = null;
            if (rawDataUrl.startsWith('data:image')) {
              const parts = rawDataUrl.split(',');
              if (parts.length > 1) {
                imgBuffer = Buffer.from(parts[1], 'base64');
              }
            }
            if (imgBuffer) {
              doc.image(imgBuffer, cardX + 8, cardY + 22, {
                fit: [colWidth - 16, colHeight - 40],
                align: 'center',
                valign: 'center',
              });
            } else {
              doc.fillColor(subTextColor).fontSize(7.5).text('Bill photo attached on local storage', cardX + 20, cardY + 70);
            }
          } catch (imgRenderErr) {
            console.warn('PDFKit bill image embed warning:', imgRenderErr.message);
            doc.fillColor(subTextColor).fontSize(7.5).text('Bill photo attached on local storage', cardX + 20, cardY + 70);
          }

          // Verified Stamp at bottom of card
          doc
            .fillColor('#15803d')
            .fontSize(6.5)
            .font('Helvetica-Bold')
            .text(`✓ CERTIFIED EXPENSE BILL (${item.receiptSizeKb ? `${item.receiptSizeKb} KB` : '<= 50 KB'})`, cardX + 6, cardY + colHeight - 12);

          if (imgCol === 1 || i === itemsWithBills.length - 1) {
            imgCol = 0;
            p2Y += colHeight + 14;
          } else {
            imgCol = 1;
          }
        }
      }

      // --- FINAL FOOTER ---
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

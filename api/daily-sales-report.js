import { getFirebaseAdmin } from './_utils/firebaseAdmin.js';
import { generateDailyReportPDF } from './_utils/pdfGenerator.js';
import { sendDailyReportEmail } from './_utils/emailService.js';

export default async function handler(req, res) {
  // CORS & Header checks
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { app, db, auth } = getFirebaseAdmin();

    // 1. AUTHENTICATION & AUTHORIZATION
    const authHeader = req.headers.authorization || '';
    const querySecret = req.query.secret || req.query.cron_secret;
    const cronSecret = process.env.CRON_SECRET;

    let isAuthorized = false;
    let authType = 'UNAUTHORIZED';
    let authenticatedUid = 'ANONYMOUS';

    if (cronSecret && (authHeader === `Bearer ${cronSecret}` || querySecret === cronSecret)) {
      isAuthorized = true;
      authType = 'VERCEL_CRON';
      authenticatedUid = 'SYSTEM_CRON';
    } else if (authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7).trim();
      try {
        const decodedToken = await auth.verifyIdToken(token);
        authenticatedUid = decodedToken.uid;
        authType = 'FIREBASE_USER';

        // Check if Admin
        const isMasterAdmin = authenticatedUid === 'aVvIo6WxWahTcNTuVRCQxk5nAuK2';
        const adminDocSnap = await db.collection('admins').doc(authenticatedUid).get();
        const userDocSnap = await db.collection('users').doc(authenticatedUid).get();
        const isRegisteredAdmin = adminDocSnap.exists || (userDocSnap.exists && userDocSnap.data()?.role === 'admin');

        if (isMasterAdmin || isRegisteredAdmin) {
          isAuthorized = true;
        }
      } catch (authErr) {
        // ID token invalid
      }
    }

    if (!isAuthorized) {
      return res.status(401).json({
        success: false,
        status: 'UNAUTHORIZED',
        error: 'Unauthorized: Missing or invalid Cron Secret / Admin Authentication token.',
      });
    }

    const isForce = req.query.force === 'true' || req.body?.force === true;

    // 2. FETCH ADMIN REPORT SETTINGS & CUTOFF TIME
    let scheduleData = { enabled: true, hour: 10, minute: 0, amPm: 'PM' };
    try {
      const settingsSnap = await db.collection('settings').doc('daily_report').get();
      if (settingsSnap.exists) {
        scheduleData = { ...scheduleData, ...settingsSnap.data() };
      } else {
        const fallbackSnap = await db.collection('settings').doc('daily_report_schedule').get();
        if (fallbackSnap.exists) {
          scheduleData = { ...scheduleData, ...fallbackSnap.data() };
        }
      }
    } catch (e) {
      console.warn('Could not fetch daily_report settings, using default 10:00 PM IST cutoff.');
    }

    if (scheduleData.enabled === false && !isForce && authType === 'VERCEL_CRON') {
      return res.status(200).json({
        success: true,
        status: 'SKIPPED_REPORT_DISABLED',
        message: 'Daily sales report automation is currently disabled by administrator.',
      });
    }

    // Parse cutoff time (default: 10:00 PM IST = 22:00 IST)
    let cutoffHour24 = 22;
    let cutoffMinute = 0;

    if (scheduleData.hour !== undefined) {
      let h = Number(scheduleData.hour);
      const ampm = String(scheduleData.amPm || 'PM').toUpperCase();
      if (ampm === 'PM' && h < 12) h += 12;
      if (ampm === 'AM' && h === 12) h = 0;
      cutoffHour24 = h;
    }
    if (scheduleData.minute !== undefined) {
      cutoffMinute = Number(scheduleData.minute);
    }

    const displayHour12 = cutoffHour24 % 12 === 0 ? 12 : cutoffHour24 % 12;
    const displayAmPm = cutoffHour24 >= 12 ? 'PM' : 'AM';
    const cutoffFormatted = `${String(displayHour12).padStart(2, '0')}:${String(cutoffMinute).padStart(2, '0')} ${displayAmPm}`;

    // 3. CALCULATE TARGET DATE & REPORTING CUTOFF WINDOW (IST OFFSET +5:30)
    const targetDateParam = req.query.date || req.body?.date;
    const nowUtc = new Date();
    const istOffsetMs = (5 * 60 + 30) * 60 * 1000;
    const nowIst = new Date(nowUtc.getTime() + istOffsetMs);

    let reportYear = nowIst.getUTCFullYear();
    let reportMonth = nowIst.getUTCMonth();
    let reportDay = nowIst.getUTCDate();

    if (targetDateParam && /^\d{4}-\d{2}-\d{2}$/.test(targetDateParam)) {
      const parts = targetDateParam.split('-').map(Number);
      reportYear = parts[0];
      reportMonth = parts[1] - 1;
      reportDay = parts[2];
    }

    const reportDateStr = `${reportYear}-${String(reportMonth + 1).padStart(2, '0')}-${String(reportDay).padStart(2, '0')}`;

    // Reporting Window:
    // From: (Report Date - 1 day) Cutoff Time IST
    // To:   (Report Date) Cutoff Time IST
    const windowEndIst = new Date(Date.UTC(reportYear, reportMonth, reportDay, cutoffHour24, cutoffMinute, 0, 0));
    const windowEndUtc = new Date(windowEndIst.getTime() - istOffsetMs);
    const windowStartUtc = new Date(windowEndUtc.getTime() - 24 * 60 * 60 * 1000);

    const windowStr = `${cutoffFormatted} - ${cutoffFormatted}`;

    // 4. DUPLICATE-RUN / IDEMPOTENCY PROTECTION
    const runId = `report-${reportDateStr}`;
    const logDocRef = db.collection('dailyReportLogs').doc(runId);
    const existingLogSnap = await logDocRef.get();

    if (!isForce && existingLogSnap.exists && existingLogSnap.data().status === 'COMPLETED') {
      return res.status(200).json({
        success: true,
        status: 'ALREADY_COMPLETED',
        message: `Daily report for date ${reportDateStr} was already generated and sent successfully.`,
        reportDate: reportDateStr,
        log: existingLogSnap.data(),
      });
    }

    // Mark status: RUNNING
    const startedAt = new Date().toISOString();
    await logDocRef.set({
      runId,
      reportDate: reportDateStr,
      startedAt,
      status: 'RUNNING',
      triggeredBy: authenticatedUid,
      authType,
      windowStart: windowStartUtc.toISOString(),
      windowEnd: windowEndUtc.toISOString(),
      cutoffTime: cutoffFormatted,
    }, { merge: true });

    // 5. FETCH & AGGREGATE FIRESTORE ORDERS WITHIN REPORTING WINDOW
    const ordersSnap = await db.collection('orders').limit(5000).get();
    const allOrders = ordersSnap.docs.map(d => ({ id: d.id, ...d.data() }));

    const filteredOrders = [];
    let totalGrossBilled = 0;
    let totalPiecesCount = 0;
    let totalWeightKg = 0;

    let cashReceived = 0;
    let upiReceived = 0;
    let cardReceived = 0;
    let onlineReceived = 0;

    let totalRecoveredDues = 0;
    let totalNetPendingDues = 0;
    let fullyPaidOrdersCount = 0;
    let partialOrdersCount = 0;
    let unpaidOrdersCount = 0;

    let cancelledCount = 0;
    let cancelledAmount = 0;

    const branchStatsMap = {
      main: { id: 'counter-1', code: 'TW-POS-01', name: 'Main Branch — Manikonda (POS-01)', count: 0, billed: 0, received: 0 },
      branch1: { id: 'counter-2', code: 'TW-POS-02', name: 'Branch 1 — Tolichowki (POS-02)', count: 0, billed: 0, received: 0 },
      pickup: { id: 'counter-3', code: 'TW-POS-03', name: 'Pick Up Point — Ambience (POS-03)', count: 0, billed: 0, received: 0 },
      online: { id: 'online', code: 'ONLINE', name: 'Website Online Pickup', count: 0, billed: 0, received: 0 },
    };

    const serviceCatMap = {};

    allOrders.forEach(order => {
      // Exclude Test Data
      if (order.isTestData === true || (order.customerName && String(order.customerName).toLowerCase().includes('test'))) {
        return;
      }

      const createdAtRaw = order.createdAt || order.created_at || order.orderDate || order.date;
      let orderDate = null;

      if (createdAtRaw) {
        if (typeof createdAtRaw.toDate === 'function') orderDate = createdAtRaw.toDate();
        else if (createdAtRaw._seconds) orderDate = new Date(createdAtRaw._seconds * 1000);
        else orderDate = new Date(createdAtRaw);
      }

      const isWithinWindow = orderDate && orderDate >= windowStartUtc && orderDate <= windowEndUtc;
      const isCancelled = String(order.status || order.customerStage || '').toUpperCase() === 'CANCELLED';

      if (isCancelled) {
        if (isWithinWindow) {
          cancelledCount += 1;
          cancelledAmount += Number(order.totalAmount || order.finalPrice || 0);
        }
        return;
      }

      if (isWithinWindow) {
        filteredOrders.push(order);
        const billTotal = Number(order.totalAmount || order.finalPrice || order.priceSnapshot?.finalTotal || 0);
        const recAmount = Number(order.receivedAmount !== undefined
          ? order.receivedAmount
          : (order.paymentStatus === 'PAID' ? billTotal : 0));
        const balAmount = Number(order.balanceAmount !== undefined
          ? order.balanceAmount
          : Math.max(0, billTotal - recAmount));

        totalGrossBilled += billTotal;

        if (Array.isArray(order.items)) {
          order.items.forEach(it => {
            const qty = Number(it.quantity) || 1;
            const itemPrice = Number(it.price || it.total || it.itemTotal || 0);
            const itemW = Number(it.weightKg || it.weight || 0);
            const catName = it.serviceName || it.category || it.name || 'Laundry Services';

            totalPiecesCount += qty;
            if (!serviceCatMap[catName]) {
              serviceCatMap[catName] = { category: catName, pieces: 0, weight: 0, amount: 0 };
            }
            serviceCatMap[catName].pieces += qty;
            serviceCatMap[catName].weight += itemW;
            serviceCatMap[catName].amount += itemPrice;
          });
        }
        totalWeightKg += Number(order.actualWeight || order.estimatedWeightKg || order.weightKg || 0);

        const pMethod = String(order.paymentMethod || 'CASH').toUpperCase();
        if (pMethod.includes('CASH')) cashReceived += recAmount;
        else if (pMethod.includes('UPI') || pMethod.includes('QR')) upiReceived += recAmount;
        else if (pMethod.includes('CARD') || pMethod.includes('POS')) cardReceived += recAmount;
        else onlineReceived += recAmount;

        if (balAmount === 0 || order.paymentStatus === 'PAID') fullyPaidOrdersCount += 1;
        else if (recAmount > 0) { partialOrdersCount += 1; totalNetPendingDues += balAmount; }
        else { unpaidOrdersCount += 1; totalNetPendingDues += balAmount; }

        const isPos = Boolean(order.isWalkIn || order.orderSource === 'OFFLINE_POS' || order.terminalCode || order.terminalId);
        const tId = (order.terminalId || '').toLowerCase();
        const tCode = (order.terminalCode || '').toLowerCase();
        const branchName = (order.storeBranch || order.branchName || '').toLowerCase();

        if (!isPos) {
          branchStatsMap.online.count += 1; branchStatsMap.online.billed += billTotal; branchStatsMap.online.received += recAmount;
        } else if (tId === 'counter-2' || tCode.includes('pos-02') || branchName.includes('branch 1') || branchName.includes('tolichowki')) {
          branchStatsMap.branch1.count += 1; branchStatsMap.branch1.billed += billTotal; branchStatsMap.branch1.received += recAmount;
        } else if (tId === 'counter-3' || tCode.includes('pos-03') || branchName.includes('ambience')) {
          branchStatsMap.pickup.count += 1; branchStatsMap.pickup.billed += billTotal; branchStatsMap.pickup.received += recAmount;
        } else {
          branchStatsMap.main.count += 1; branchStatsMap.main.billed += billTotal; branchStatsMap.main.received += recAmount;
        }
      }

      // Recovered Dues in Window
      if (Array.isArray(order.paymentHistory)) {
        order.paymentHistory.forEach(h => {
          let hDate = null;
          if (h.timestamp) {
            hDate = typeof h.timestamp.toDate === 'function' ? h.timestamp.toDate() : new Date(h.timestamp);
          }
          if (hDate && hDate >= windowStartUtc && hDate <= windowEndUtc && (h.isBalanceSettlement || h.type === 'BALANCE_COLLECTION' || h.note?.includes('settlement'))) {
            totalRecoveredDues += Number(h.amount || 0);
          }
        });
      }
    });

    const totalInflowCollections = cashReceived + upiReceived + cardReceived + onlineReceived;
    const dateFormatted = `${String(reportDay).padStart(2, '0')}/${String(reportMonth + 1).padStart(2, '0')}/${reportYear}`;
    const generatedAtFormatted = nowIst.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });

    const serviceCategoriesList = Object.values(serviceCatMap);

    const reportData = {
      dateStr: reportDateStr,
      dateFormatted,
      generatedAtFormatted,
      cutoffTime: cutoffFormatted,
      windowStr,
      metrics: {
        totalOrdersCount: filteredOrders.length,
        totalGrossBilled,
        totalPiecesCount,
        totalWeightKg: Math.round(totalWeightKg * 10) / 10,
        category1: { cashReceived, upiReceived, cardReceived, onlineReceived, totalInflowCollections },
        category2: {
          totalInitialDuesCreated: totalGrossBilled - totalInflowCollections,
          totalRecoveredDues, totalNetPendingDues, fullyPaidOrdersCount, partialOrdersCount, unpaidOrdersCount
        },
      },
      branchStats: Object.values(branchStatsMap),
      serviceCategories: serviceCategoriesList.length > 0 ? serviceCategoriesList : [
        { category: 'Premium Dry Cleaning', pieces: totalPiecesCount, weight: Math.round(totalWeightKg * 10) / 10, amount: totalGrossBilled }
      ],
      cancellations: { count: cancelledCount, totalAmount: cancelledAmount },
    };

    // 6. GENERATE COMPLETE A4 PDF ATTACHMENT
    let pdfBuffer;
    try {
      pdfBuffer = await generateDailyReportPDF(reportData);
    } catch (pdfErr) {
      console.error('PDF Generation Failed:', pdfErr);
      await logDocRef.set({
        status: 'FAILED',
        errorDetails: `PDF Generation Failed: ${pdfErr.message}`,
        failedAt: new Date().toISOString()
      }, { merge: true });
      return res.status(500).json({
        success: false,
        status: 'FAILED',
        error: `PDF Generation Error: ${pdfErr.message}`,
      });
    }

    // 7. FORMAT EXECUTIVE OVERVIEW EMAIL TEXT & HTML
    const emailSubject = `Tech Wash Laundry — Daily Sales Report — ${dateFormatted}`;

    const serviceCatText = serviceCategoriesList.map(sc =>
      `• ${sc.category}: ${sc.pieces} Pcs | ${sc.weight || 0} Kg | Billed: ₹${sc.amount.toLocaleString('en-IN')}`
    ).join('\n') || '• Premium Dry Cleaning & Eco Wash Services';

    let emailTextBody = '';
    if (filteredOrders.length === 0) {
      emailTextBody =
`TECH WASH LAUNDRY SERVICES — DAILY SALES REPORT
Date: ${dateFormatted} (${cutoffFormatted} IST Settlement Window)

==================================================
NO SALES DATA / NO BILLS FOR THIS REPORTING PERIOD
==================================================
Zero transaction records were logged during this cutoff window across all 3 store branches.

1. OVERALL REVENUE SUMMARY
• Gross Billed Sales: ₹0
• Total Collections Inflow: ₹0
• Net Pending Dues: ₹0
• Dues Recovered: ₹0

2. BRANCH-WISE BREAKDOWN
• POS-01 (Main Branch — Manikonda): 0 Orders • ₹0
• POS-02 (Branch 1 — Tolichowki): 0 Orders • ₹0
• POS-03 (Pick Up Point — Ambience): 0 Orders • ₹0
• Website Online: 0 Orders • ₹0

Please see the attached A4 PDF report for certified reconciliation details.
`;
    } else {
      emailTextBody =
`TECH WASH LAUNDRY SERVICES — DAILY SALES REPORT
Date: ${dateFormatted} (${cutoffFormatted} IST Settlement Window)

==================================================
1. OVERALL REVENUE & SALES SUMMARY
==================================================
• Gross Billed Sales: ₹${totalGrossBilled.toLocaleString('en-IN')}
• Total Collections Inflow: ₹${totalInflowCollections.toLocaleString('en-IN')}
• Net Pending Dues: ₹${totalNetPendingDues.toLocaleString('en-IN')}
• Dues Recovered Today: ₹${totalRecoveredDues.toLocaleString('en-IN')}

==================================================
2. COLLECTIONS BY PAYMENT METHOD
==================================================
• Cash at Register: ₹${cashReceived.toLocaleString('en-IN')}
• UPI / Dynamic QR: ₹${upiReceived.toLocaleString('en-IN')}
• Card / POS Machine: ₹${cardReceived.toLocaleString('en-IN')}
• Online Web Pre-paid: ₹${onlineReceived.toLocaleString('en-IN')}

==================================================
3. BRANCH-WISE PERFORMANCE
==================================================
• POS-01 (Manikonda Main): ${branchStatsMap.main.count} Orders | Billed: ₹${branchStatsMap.main.billed.toLocaleString('en-IN')} | Collected: ₹${branchStatsMap.main.received.toLocaleString('en-IN')}
• POS-02 (Tolichowki Branch 1): ${branchStatsMap.branch1.count} Orders | Billed: ₹${branchStatsMap.branch1.billed.toLocaleString('en-IN')} | Collected: ₹${branchStatsMap.branch1.received.toLocaleString('en-IN')}
• POS-03 (Ambience Pick Up Point): ${branchStatsMap.pickup.count} Orders | Billed: ₹${branchStatsMap.pickup.billed.toLocaleString('en-IN')} | Collected: ₹${branchStatsMap.pickup.received.toLocaleString('en-IN')}
• Website Online: ${branchStatsMap.online.count} Orders | Billed: ₹${branchStatsMap.online.billed.toLocaleString('en-IN')}

==================================================
4. SERVICE CATEGORY BREAKDOWN
==================================================
${serviceCatText}

==================================================
5. VOLUME & CANCELLATION METRICS
==================================================
• Total Billed Orders: ${filteredOrders.length} (${fullyPaidOrdersCount} Paid, ${partialOrdersCount + unpaidOrdersCount} Unpaid/Partial)
• Volume Cleaned: ${totalPiecesCount} Pcs / ${reportData.metrics.totalWeightKg} Kg
• Cancelled Orders: ${cancelledCount} Orders (₹${cancelledAmount.toLocaleString('en-IN')})

Please see the attached official A4 PDF report for complete management audit.
`;
    }

    const emailHtmlBody = `<div style="font-family: Arial, sans-serif; color: #1f2937; max-width: 650px; line-height: 1.6;">
      <div style="background-color: #1e3a8a; color: #ffffff; padding: 20px; border-radius: 6px 6px 0 0;">
        <h2 style="margin: 0; font-size: 20px;">TECH WASH LAUNDRY SERVICES</h2>
        <p style="margin: 5px 0 0 0; font-size: 13px; opacity: 0.9;">Daily Executive Sales Report — ${dateFormatted} (${cutoffFormatted} IST Settlement)</p>
      </div>
      <div style="padding: 20px; border: 1px solid #e5e7eb; border-top: none; background: #ffffff;">
        <pre style="font-family: monospace; white-space: pre-wrap; font-size: 13px; background: #f9fafb; padding: 15px; border-radius: 4px; border: 1px solid #e5e7eb;">${emailTextBody}</pre>
        <p style="font-size: 12px; color: #6b7280; margin-top: 20px; text-align: center;">
          📄 The complete certified A4 PDF report is attached to this email.
        </p>
      </div>
    </div>`;

    // 8. DELIVER EMAIL VIA SERVER-SIDE EMAIL SERVICE
    const recipientTo = req.body?.to || req.query.to || scheduleData.recipientsTo || process.env.EMAIL_TO || 'admin@techwash.in';
    const recipientCc = req.body?.cc || req.query.cc || scheduleData.recipientsCc || process.env.EMAIL_CC;

    let emailResult;
    try {
      emailResult = await sendDailyReportEmail({
        to: recipientTo,
        cc: recipientCc,
        subject: emailSubject,
        textBody: emailTextBody,
        htmlBody: emailHtmlBody,
        pdfBuffer,
        pdfFilename: `TechWash_Daily_Sales_Report_${reportDateStr.replace(/-/g, '_')}.pdf`,
        idempotencyKey: `daily-report-${reportDateStr}`
      });
    } catch (emailErr) {
      console.error('Email Delivery Failed:', emailErr);
      await logDocRef.set({
        status: 'FAILED',
        emailStatus: 'FAILED',
        errorDetails: `Email Delivery Failed: ${emailErr.message}`,
        failedAt: new Date().toISOString()
      }, { merge: true });

      return res.status(500).json({
        success: false,
        status: 'FAILED',
        error: `Email Delivery Error: ${emailErr.message}`,
      });
    }

    // 9. LOG SUCCESSFUL RUN TO dailyReportLogs
    const completedAt = new Date().toISOString();
    const finalLogData = {
      runId,
      reportDate: reportDateStr,
      startedAt,
      completedAt,
      status: 'COMPLETED',
      statusLabel: 'COMPLETED — Email Delivered with PDF Attachment',
      pdfStatus: 'GENERATED',
      emailStatus: 'SENT',
      emailProvider: emailResult.provider,
      recipients: emailResult.recipients,
      ccRecipients: emailResult.cc || [],
      messageId: emailResult.messageId,
      ordersCount: filteredOrders.length,
      totalGrossBilled,
      totalCollections: totalInflowCollections,
      metrics: reportData.metrics,
      branchStats: reportData.branchStats,
      serviceCategories: reportData.serviceCategories,
      errorDetails: null,
    };

    await logDocRef.set(finalLogData, { merge: true });

    return res.status(200).json({
      success: true,
      status: 'COMPLETED',
      reportDate: reportDateStr,
      dateFormatted,
      ordersCount: filteredOrders.length,
      grossBilledSales: totalGrossBilled,
      totalCollections: totalInflowCollections,
      emailProvider: emailResult.provider,
      recipients: emailResult.recipients,
      messageId: emailResult.messageId,
      logDocId: `dailyReportLogs/${runId}`
    });

  } catch (error) {
    console.error('Error executing daily sales report server endpoint:', error);
    return res.status(500).json({
      success: false,
      status: 'FAILED',
      error: error.message || 'Internal Server Error during daily report execution.',
    });
  }
}

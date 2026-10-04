import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';

const BRIDGE_URL = 'http://127.0.0.1:9123/api/save-transaction';

const todayOrders = [
  {
    localId: 'TW-8786',
    orderNumber: 'TW-8786',
    invoiceNumber: 'INV-TW-8786',
    customerName: 'MAHI',
    customerPhone: '9398724704',
    customerAddress: 'In-Store Walk-in Drop (TechWash)',
    items: [
      { name: 'Premium Dry Cleaning', quantity: 2, weightKg: 1.4, price: 780 }
    ],
    totalAmount: 780,
    subtotal: 780,
    discount: 0,
    taxAmount: 0,
    amountPaid: 780,
    balanceDue: 0,
    paymentStatus: 'PAID',
    paymentMethod: 'CASH',
    createdAt: '2026-10-04T14:16:00.000Z',
    orderDate: '2026-10-04',
    dateKey: '2026-10-04',
    terminalId: 'counter-1',
    terminalCode: 'TW-POS-01',
    branch: 'Main Branch (Manikonda) (TW-POS-01)',
  },
  {
    localId: 'TW-2329',
    orderNumber: 'TW-2329',
    invoiceNumber: 'INV-TW-2329',
    customerName: 'MAHESH',
    customerPhone: '9398724704',
    customerAddress: 'In-Store Walk-in Drop (TechWash)',
    items: [
      { name: 'Premium Dry Cleaning', quantity: 3, weightKg: 2.1, price: 730 }
    ],
    totalAmount: 730,
    subtotal: 730,
    discount: 0,
    taxAmount: 0,
    amountPaid: 730,
    balanceDue: 0,
    paymentStatus: 'PAID',
    paymentMethod: 'CASH',
    createdAt: '2026-10-04T14:06:00.000Z',
    orderDate: '2026-10-04',
    dateKey: '2026-10-04',
    terminalId: 'counter-1',
    terminalCode: 'TW-POS-01',
    branch: 'Main Branch (Manikonda) (TW-POS-01)',
  },
];

function postTransactionToBridge(payload) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(payload);
    const req = http.request(
      {
        hostname: '127.0.0.1',
        port: 9123,
        path: '/api/save-transaction',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(data),
          'x-terminal-id': payload.terminalId || 'counter-1',
        },
      },
      res => {
        let resData = '';
        res.on('data', chunk => (resData += chunk));
        res.on('end', () => {
          try {
            resolve(JSON.parse(resData));
          } catch (e) {
            reject(new Error(`Failed to parse response: ${resData}`));
          }
        });
      }
    );
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function run() {
  console.log('Sending today\'s orders (TW-8786 & TW-2329) to local POS bridge...');
  for (const ord of todayOrders) {
    const res = await postTransactionToBridge(ord);
    console.log(`Order ${ord.orderNumber}: status=${res.status}, pdf=${res.paths?.pdf}, excel=${res.paths?.excel}`);
  }

  // Inspect generated filesystem contents
  const invDir = path.join('C:\\TechWash\\POS-01\\Invoices', '2026-10-04');
  if (fs.existsSync(invDir)) {
    const files = fs.readdirSync(invDir);
    console.log(`\n✅ Invoices generated under ${invDir}:`);
    files.forEach(f => console.log(`   - ${f}`));
  } else {
    console.error(`❌ Folder ${invDir} was not created!`);
  }

  const exportFile = path.join('C:\\TechWash\\POS-01\\Exports', '2026-10-04.xlsx');
  if (fs.existsSync(exportFile)) {
    console.log(`\n✅ Excel ledger generated: ${exportFile}`);
  } else {
    console.error(`❌ Export file ${exportFile} missing!`);
  }

  process.exit(0);
}

run().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});

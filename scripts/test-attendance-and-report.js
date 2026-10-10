import { attendanceService } from '../src/services/attendanceService.js';
import { reportService } from '../src/services/reportService.js';

async function runTest() {
  console.log("==================================================");
  console.log("🧪 TESTING ATTENDANCE STORAGE & DAILY REPORT INTEGRATION");
  console.log("==================================================");

  const todayStr = new Date().toISOString().split('T')[0];

  // Test 1: Save Attendance with employee name
  console.log("\nTest 1: Saving employee attendance record...");
  const savedRecord = await attendanceService.saveEmployeeAttendance(todayStr, 'emp-106', {
    employeeName: 'Priyanka Reddy',
    name: 'Priyanka Reddy',
    role: '🏪 Store Counter Cashier / Manager',
    branch: 'counter-1',
    status: 'PRESENT',
    checkInTime: '09:00 AM',
    checkOutTime: '08:00 PM',
    workingHours: 11
  });

  console.log(`✅ Saved attendance record:`, {
    employeeId: savedRecord.employeeId,
    employeeName: savedRecord.employeeName,
    name: savedRecord.name,
    status: savedRecord.status,
    role: savedRecord.role
  });

  if (!savedRecord.employeeName || savedRecord.employeeName !== 'Priyanka Reddy') {
    throw new Error("FAIL: employeeName was not stored!");
  }

  // Test 2: Fetch daily attendance
  console.log("\nTest 2: Fetching daily attendance list...");
  const dailyList = await attendanceService.getDailyAttendance(todayStr);
  const priyanka = dailyList.find(d => d.employeeId === 'emp-106');
  console.log(`✅ Found employee record in daily roster:`, {
    name: priyanka?.name,
    employeeName: priyanka?.employeeName,
    status: priyanka?.status,
    role: priyanka?.employee?.role
  });

  if (!priyanka?.name || !priyanka?.employeeName) {
    throw new Error("FAIL: Employee name missing from daily attendance query!");
  }

  // Test 3: Generate financial report with attendance summary
  console.log("\nTest 3: Generating financial report with attendance summary...");
  const report = await reportService.generateFinancialReport({
    datePreset: 'today',
    branchFilter: 'ALL'
  });

  console.log(`✅ Report generated successfully:`, {
    dateRangeLabel: report.dateRangeLabel,
    totalOrdersCount: report.metrics?.totalOrdersCount,
    attendance: {
      totalStaff: report.attendance?.totalStaff,
      presentCount: report.attendance?.presentCount,
      rosterCount: report.attendance?.roster?.length,
      sampleStaff: report.attendance?.roster?.[0]
    }
  });

  if (!report.attendance) {
    throw new Error("FAIL: report.attendance is undefined!");
  }

  console.log("\n==================================================");
  console.log("🎉 ALL ATTENDANCE & REPORT TESTS PASSED!");
  console.log("==================================================");
}

runTest().catch(err => {
  console.error("❌ TEST FAILED:", err);
  process.exit(1);
});

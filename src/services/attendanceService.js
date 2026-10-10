/**
 * Tech Wash Laundry - Advanced Employee & Daily Attendance Management Service
 * Handles employee profiles, daily roll call, check-in/out timings, 31-day monthly matrix,
 * effective payable days calculation, and payroll estimation.
 * Supports Cloud Firestore with offline local storage cache & cross-tab sync.
 */

import { db, isFirebaseConfigured } from './firebase.js';
import { 
  collection, 
  doc, 
  getDocs, 
  setDoc, 
  deleteDoc, 
  query, 
  where 
} from 'firebase/firestore';
import { expenseService } from './expenseService.js';

const EMPLOYEES_STORAGE_KEY = 'techwash_employee_directory_v2';
const ATTENDANCE_STORAGE_KEY = 'techwash_attendance_records_v2';

export const ATTENDANCE_STATUSES = {
  PRESENT: {
    key: 'PRESENT',
    label: 'Present',
    code: 'P',
    payableValue: 1.0,
    color: 'emerald',
    badgeClass: 'bg-emerald-500/10 text-emerald-700 border-emerald-300',
    cellBg: 'bg-emerald-500 text-white font-bold',
    dotColor: 'bg-emerald-500',
    description: 'Full day active on duty'
  },
  HALF_DAY: {
    key: 'HALF_DAY',
    label: 'Half Day',
    code: 'HD',
    payableValue: 0.5,
    color: 'amber',
    badgeClass: 'bg-amber-500/10 text-amber-700 border-amber-300',
    cellBg: 'bg-amber-500 text-white font-bold',
    dotColor: 'bg-amber-500',
    description: 'Half day shift (4 hrs)'
  },
  LATE: {
    key: 'LATE',
    label: 'Late In',
    code: 'L',
    payableValue: 1.0,
    color: 'cyan',
    badgeClass: 'bg-cyan-500/10 text-cyan-700 border-cyan-300',
    cellBg: 'bg-cyan-600 text-white font-bold',
    dotColor: 'bg-cyan-500',
    description: 'Arrived after shift grace period'
  },
  ABSENT: {
    key: 'ABSENT',
    label: 'Absent',
    code: 'A',
    payableValue: 0.0,
    color: 'rose',
    badgeClass: 'bg-rose-500/10 text-rose-700 border-rose-300',
    cellBg: 'bg-rose-500 text-white font-bold',
    dotColor: 'bg-rose-500',
    description: 'Unplanned absence (Unpaid)'
  },
  PAID_LEAVE: {
    key: 'PAID_LEAVE',
    label: 'Paid Leave',
    code: 'PL',
    payableValue: 1.0,
    color: 'purple',
    badgeClass: 'bg-purple-500/10 text-purple-700 border-purple-300',
    cellBg: 'bg-purple-600 text-white font-bold',
    dotColor: 'bg-purple-500',
    description: 'Approved sick or casual leave'
  },
  WEEKLY_OFF: {
    key: 'WEEKLY_OFF',
    label: 'Weekly Off',
    code: 'WO',
    payableValue: 1.0,
    color: 'slate',
    badgeClass: 'bg-slate-500/10 text-slate-700 border-slate-300',
    cellBg: 'bg-slate-400 text-white font-bold',
    dotColor: 'bg-slate-400',
    description: 'Scheduled weekly rest day'
  },
  HOLIDAY: {
    key: 'HOLIDAY',
    label: 'Holiday',
    code: 'H',
    payableValue: 1.0,
    color: 'blue',
    badgeClass: 'bg-blue-500/10 text-blue-700 border-blue-300',
    cellBg: 'bg-blue-600 text-white font-bold',
    dotColor: 'bg-blue-500',
    description: 'Public or national holiday'
  }
};

export const EMPLOYEE_ROLES = [
  { id: 'PRESS_MASTER', name: '👔 Steam Press & Ironing Master', department: 'Finishing & Press' },
  { id: 'WASH_OPERATOR', name: '🧺 Wash Plant & Detergent Operator', department: 'Washing' },
  { id: 'DRY_CLEANER', name: '🧴 Dry Cleaning & Stain Specialist', department: 'Dry Cleaning' },
  { id: 'DELIVERY_RIDER', name: '🛵 Delivery Executive / Rider', department: 'Logistics' },
  { id: 'QC_INSPECTOR', name: '🔍 QC Inspector & Tagging Master', department: 'Quality & Packing' },
  { id: 'STORE_CASHIER', name: '🏪 Store Counter Cashier / Manager', department: 'Front Office' },
  { id: 'MAINTENANCE_TECH', name: '🛠️ Machine & Boiler Technician', department: 'Maintenance' },
  { id: 'STORE_SUPERVISOR', name: '📋 Plant Operations Supervisor', department: 'Management' },
];

export const SHIFT_TIMINGS = [
  { id: 'GENERAL', label: 'General Shift (09:00 AM – 06:00 PM)', defaultIn: '09:00', defaultOut: '18:00', totalHours: 9 },
  { id: 'MORNING', label: 'Morning Shift (07:00 AM – 03:30 PM)', defaultIn: '07:00', defaultOut: '15:30', totalHours: 8.5 },
  { id: 'EVENING', label: 'Evening Shift (01:00 PM – 09:30 PM)', defaultIn: '13:00', defaultOut: '21:30', totalHours: 8.5 },
  { id: 'NIGHT', label: 'Night Plant Shift (08:00 PM – 04:30 AM)', defaultIn: '20:00', defaultOut: '04:30', totalHours: 8.5 },
];

export const BRANCH_LOCATIONS = [
  { id: 'ALL', name: 'All Branches & Processing Hubs' },
  { id: 'counter-1', name: 'Counter 1 — Main Branch (Shaikpet / Manikonda)', locationName: 'Tech Wash Laundry Main Branch', address: 'Shaikpet Main Rd, Sri Ram Nagar Colony, Manikonda, Hyderabad, Telangana 500089', code: 'TW-POS-01' },
  { id: 'counter-2', name: 'Counter 2 — Branch 1 (Tolichowki / OU Colony)', locationName: 'Tech Wash Laundry Services (Branch 1)', address: 'Beside Dreamscape hotel Ward No 8, Block No 1, tolichowki, OU Colony, Shaikpet, Hyderabad, Telangana 500008', code: 'TW-POS-02' },
  { id: 'counter-3', name: 'Counter 3 — Pick Up Point (Ambience Courtyard)', locationName: 'Tech Wash Pick Up Point', address: 'Beside Ambience Courtyard, Hyderabad, Telangana, 500089', code: 'TW-POS-03' },
  { id: 'central-plant', name: 'Central Washing & Processing Plant', code: 'TW-PL' },
];

// Realistic Pre-Seeded Staff Roster
export const DEFAULT_EMPLOYEES = [
  {
    id: 'emp-101',
    empCode: 'TW-EMP-101',
    name: 'Rameshwar Sharma',
    phone: '+91 98765 43210',
    email: 'ramesh.sharma@techwash.in',
    role: '👔 Steam Press & Ironing Master',
    department: 'Finishing & Press',
    branch: 'counter-1',
    shift: 'GENERAL',
    employmentType: 'FULL_TIME',
    salaryType: 'MONTHLY',
    baseSalary: 18500,
    dailyWage: 650,
    otHourlyRate: 90,
    joiningDate: '2024-01-15',
    emergencyContact: '+91 98765 00001 (Wife)',
    aadhaarNumber: 'XXXX-XXXX-4812',
    bankDetails: {
      accountNumber: '48920193849102',
      ifsc: 'HDFC0001248',
      upiId: 'rameshwar@okhdfcbank'
    },
    active: true,
    avatarColor: 'from-amber-500 to-orange-600'
  },
  {
    id: 'emp-102',
    empCode: 'TW-EMP-102',
    name: 'Mohammad Imran',
    phone: '+91 98480 22334',
    email: 'imran.wash@techwash.in',
    role: '🧺 Wash Plant & Detergent Operator',
    department: 'Washing',
    branch: 'central-plant',
    shift: 'MORNING',
    employmentType: 'FULL_TIME',
    salaryType: 'MONTHLY',
    baseSalary: 21000,
    dailyWage: 750,
    otHourlyRate: 110,
    joiningDate: '2023-11-01',
    emergencyContact: '+91 98480 99887 (Brother)',
    aadhaarNumber: 'XXXX-XXXX-9120',
    bankDetails: {
      accountNumber: '91827364510293',
      ifsc: 'SBIN0004521',
      upiId: 'imranm@oksbi'
    },
    active: true,
    avatarColor: 'from-blue-500 to-cyan-600'
  },
  {
    id: 'emp-103',
    empCode: 'TW-EMP-103',
    name: 'Suresh Kumar Yadav',
    phone: '+91 97001 88992',
    email: 'suresh.dryclean@techwash.in',
    role: '🧴 Dry Cleaning & Stain Specialist',
    department: 'Dry Cleaning',
    branch: 'central-plant',
    shift: 'GENERAL',
    employmentType: 'FULL_TIME',
    salaryType: 'MONTHLY',
    baseSalary: 23500,
    dailyWage: 820,
    otHourlyRate: 125,
    joiningDate: '2023-08-20',
    emergencyContact: '+91 97001 11223 (Father)',
    aadhaarNumber: 'XXXX-XXXX-3341',
    bankDetails: {
      accountNumber: '11223344556677',
      ifsc: 'ICIC0000842',
      upiId: 'sureshyadav@icici'
    },
    active: true,
    avatarColor: 'from-purple-500 to-indigo-600'
  },
  {
    id: 'emp-104',
    empCode: 'TW-EMP-104',
    name: 'Kiran Goud (Rider 01)',
    phone: '+91 91234 56789',
    email: 'kiran.rider@techwash.in',
    role: '🛵 Delivery Executive / Rider',
    department: 'Logistics',
    branch: 'counter-1',
    shift: 'MORNING',
    employmentType: 'FULL_TIME',
    salaryType: 'MONTHLY',
    baseSalary: 16500,
    dailyWage: 580,
    otHourlyRate: 85,
    vehicleNumber: 'TS 09 EA 4421',
    joiningDate: '2024-03-10',
    emergencyContact: '+91 91234 99999 (Mother)',
    aadhaarNumber: 'XXXX-XXXX-7729',
    bankDetails: {
      accountNumber: '88776655443322',
      ifsc: 'KKBK0000912',
      upiId: 'kirangoud@kotak'
    },
    active: true,
    avatarColor: 'from-emerald-500 to-teal-600'
  },
  {
    id: 'emp-105',
    empCode: 'TW-EMP-105',
    name: 'Arjun Das (Rider 02)',
    phone: '+91 90591 44556',
    email: 'arjun.rider@techwash.in',
    role: '🛵 Delivery Executive / Rider',
    department: 'Logistics',
    branch: 'counter-2',
    shift: 'EVENING',
    employmentType: 'FULL_TIME',
    salaryType: 'MONTHLY',
    baseSalary: 16500,
    dailyWage: 580,
    otHourlyRate: 85,
    vehicleNumber: 'TS 07 FG 8812',
    joiningDate: '2024-04-05',
    emergencyContact: '+91 90591 00000 (Sister)',
    aadhaarNumber: 'XXXX-XXXX-6612',
    bankDetails: {
      accountNumber: '99887766554433',
      ifsc: 'UTIB0001092',
      upiId: 'arjundas@axisbank'
    },
    active: true,
    avatarColor: 'from-rose-500 to-pink-600'
  },
  {
    id: 'emp-106',
    empCode: 'TW-EMP-106',
    name: 'Priyanka Reddy',
    phone: '+91 99887 65432',
    email: 'priyanka.front@techwash.in',
    role: '🏪 Store Counter Cashier / Manager',
    department: 'Front Office',
    branch: 'counter-1',
    shift: 'GENERAL',
    employmentType: 'FULL_TIME',
    salaryType: 'MONTHLY',
    baseSalary: 19500,
    dailyWage: 680,
    otHourlyRate: 95,
    joiningDate: '2024-02-01',
    emergencyContact: '+91 99887 11111 (Husband)',
    aadhaarNumber: 'XXXX-XXXX-1934',
    bankDetails: {
      accountNumber: '33445566778899',
      ifsc: 'HDFC0000412',
      upiId: 'priyankareddy@okhdfcbank'
    },
    active: true,
    avatarColor: 'from-violet-500 to-fuchsia-600'
  },
  {
    id: 'emp-107',
    empCode: 'TW-EMP-107',
    name: 'Venkat Rao',
    phone: '+91 96180 33445',
    email: 'venkat.qc@techwash.in',
    role: '🔍 QC Inspector & Tagging Master',
    department: 'Quality & Packing',
    branch: 'central-plant',
    shift: 'GENERAL',
    employmentType: 'FULL_TIME',
    salaryType: 'MONTHLY',
    baseSalary: 17500,
    dailyWage: 620,
    otHourlyRate: 90,
    joiningDate: '2024-02-15',
    emergencyContact: '+91 96180 99881 (Uncle)',
    aadhaarNumber: 'XXXX-XXXX-8821',
    bankDetails: {
      accountNumber: '44556677889900',
      ifsc: 'SBIN0001099',
      upiId: 'venkatrao@oksbi'
    },
    active: true,
    avatarColor: 'from-sky-500 to-blue-600'
  },
  {
    id: 'emp-108',
    empCode: 'TW-EMP-108',
    name: 'Balaji Naidu',
    phone: '+91 93901 22114',
    email: 'balaji.tech@techwash.in',
    role: '🛠️ Machine & Boiler Technician',
    department: 'Maintenance',
    branch: 'central-plant',
    shift: 'GENERAL',
    employmentType: 'FULL_TIME',
    salaryType: 'MONTHLY',
    baseSalary: 22000,
    dailyWage: 780,
    otHourlyRate: 120,
    joiningDate: '2023-10-10',
    emergencyContact: '+91 93901 00000 (Brother)',
    aadhaarNumber: 'XXXX-XXXX-5523',
    bankDetails: {
      accountNumber: '55667788990011',
      ifsc: 'BARB0BANJAR',
      upiId: 'balajinaidu@barodampay'
    },
    active: true,
    avatarColor: 'from-yellow-500 to-amber-600'
  }
];

export const attendanceService = {
  // ─────────────────────────────────────────────────────────────────────────────
  // 1. EMPLOYEE DIRECTORY CRUD
  // ─────────────────────────────────────────────────────────────────────────────

  async getEmployees(options = {}) {
    const { branchFilter = 'ALL', departmentFilter = 'ALL', search = '', activeOnly = false } = options;
    let list = [];

    // 1. Try Firebase Firestore
    if (isFirebaseConfigured && db) {
      try {
        const snap = await getDocs(collection(db, 'employees'));
        if (!snap.empty) {
          list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
          try {
            localStorage.setItem(EMPLOYEES_STORAGE_KEY, JSON.stringify(list));
          } catch (e) {}
        }
      } catch (e) {
        console.warn("Firestore employees read error:", e);
      }
    }

    // 2. Fallback to LocalStorage
    if (list.length === 0) {
      try {
        const stored = localStorage.getItem(EMPLOYEES_STORAGE_KEY);
        if (stored) {
          list = JSON.parse(stored);
        }
      } catch (e) {}
    }

    // 3. Fallback to default pre-seeded employees
    if (!list || list.length === 0) {
      list = [...DEFAULT_EMPLOYEES];
      try {
        localStorage.setItem(EMPLOYEES_STORAGE_KEY, JSON.stringify(list));
      } catch (e) {}
    }

    // Apply filtering
    return list.filter(emp => {
      if (activeOnly && emp.active === false) return false;
      if (branchFilter !== 'ALL' && emp.branch !== branchFilter) return false;
      if (departmentFilter !== 'ALL' && emp.department !== departmentFilter) return false;
      if (search && search.trim()) {
        const q = search.toLowerCase();
        const match = 
          (emp.name || '').toLowerCase().includes(q) ||
          (emp.empCode || '').toLowerCase().includes(q) ||
          (emp.phone || '').toLowerCase().includes(q) ||
          (emp.role || '').toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  },

  async saveEmployee(employeeData) {
    const isNew = !employeeData.id;
    const id = employeeData.id || `emp-${Date.now()}`;
    const code = employeeData.empCode || `TW-EMP-${Math.floor(100 + Math.random() * 900)}`;

    const payload = {
      ...employeeData,
      id,
      empCode: code,
      active: employeeData.active !== false,
      baseSalary: Number(employeeData.baseSalary || 0),
      dailyWage: Number(employeeData.dailyWage || 0),
      otHourlyRate: Number(employeeData.otHourlyRate || 0),
      updatedAt: new Date().toISOString(),
      createdAt: employeeData.createdAt || new Date().toISOString(),
    };

    // Save to Firestore
    if (isFirebaseConfigured && db) {
      try {
        await setDoc(doc(db, 'employees', id), payload, { merge: true });
      } catch (e) {
        console.warn("Firestore save employee error:", e);
      }
    }

    // Save to LocalStorage
    try {
      const all = await this.getEmployees();
      const idx = all.findIndex(e => e.id === id);
      if (idx >= 0) all[idx] = payload;
      else all.unshift(payload);
      localStorage.setItem(EMPLOYEES_STORAGE_KEY, JSON.stringify(all));
    } catch (e) {}

    // Dispatch update event
    this._broadcastUpdate();
    return payload;
  },

  async deleteEmployee(employeeId) {
    if (isFirebaseConfigured && db) {
      try {
        await deleteDoc(doc(db, 'employees', employeeId));
      } catch (e) {
        console.warn("Firestore delete employee error:", e);
      }
    }

    try {
      const all = (await this.getEmployees()).filter(e => e.id !== employeeId);
      localStorage.setItem(EMPLOYEES_STORAGE_KEY, JSON.stringify(all));
    } catch (e) {}

    this._broadcastUpdate();
    return true;
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // 2. DAILY ATTENDANCE ROLL CALL
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Fetch all attendance records for a specific date (YYYY-MM-DD)
   */
  async getDailyAttendance(dateString, branchFilter = 'ALL') {
    const dateKey = dateString || new Date().toISOString().split('T')[0];
    let allRecords = this._getLocalAttendanceMap();

    // 1. Read from Firestore for target date
    if (isFirebaseConfigured && db) {
      try {
        const q = query(collection(db, 'attendance'), where('date', '==', dateKey));
        const snap = await getDocs(q);
        if (!snap.empty) {
          snap.docs.forEach(docSnap => {
            const data = docSnap.data();
            const key = `${dateKey}_${data.employeeId}`;
            allRecords[key] = data;
          });
          this._setLocalAttendanceMap(allRecords);
        }
      } catch (e) {
        console.warn("Firestore daily attendance read error:", e);
      }
    }

    // Get active employees list
    const employees = await this.getEmployees({ branchFilter, activeOnly: true });

    // Build combined attendance list
    return employees.map(emp => {
      const recordKey = `${dateKey}_${emp.id}`;
      const existing = allRecords[recordKey];

      const shiftConfig = SHIFT_TIMINGS.find(s => s.id === emp.shift) || SHIFT_TIMINGS[0];
      const empName = existing?.employeeName || existing?.name || emp.name;

      return {
        employee: { ...emp, name: empName },
        employeeId: emp.id,
        employeeName: empName,
        name: empName,
        date: dateKey,
        status: existing?.status || 'UNMARKED',
        checkInTime: existing?.checkInTime || (existing?.status === 'PRESENT' ? shiftConfig.defaultIn : ''),
        checkOutTime: existing?.checkOutTime || (existing?.status === 'PRESENT' ? shiftConfig.defaultOut : ''),
        workingHours: existing?.workingHours !== undefined ? existing.workingHours : (existing?.status === 'PRESENT' ? shiftConfig.totalHours : 0),
        otHours: Number(existing?.otHours || 0),
        lateMinutes: Number(existing?.lateMinutes || 0),
        notes: existing?.notes || '',
        markedAt: existing?.markedAt || null,
        markedBy: existing?.markedBy || 'Admin'
      };
    });
  },

  /**
   * Save / update attendance for a single employee on a date
   */
  async saveEmployeeAttendance(dateString, employeeId, recordData = {}) {
    const dateKey = dateString || new Date().toISOString().split('T')[0];
    const key = `${dateKey}_${employeeId}`;

    let emp = recordData.employee;
    if (!emp) {
      try {
        const emps = await this.getEmployees();
        emp = emps.find(e => e.id === employeeId || e.empCode === employeeId);
      } catch (e) {}
    }

    const employeeName = recordData.employeeName || recordData.name || emp?.name || 'Staff Member';
    const employeeRole = recordData.role || recordData.employeeRole || emp?.role || 'Staff';
    const employeeBranch = recordData.branch || emp?.branch || 'counter-1';
    const empCode = recordData.empCode || emp?.empCode || '';

    const payload = {
      ...recordData,
      date: dateKey,
      employeeId,
      employeeName,
      name: employeeName,
      role: employeeRole,
      branch: employeeBranch,
      empCode,
      employee: {
        id: employeeId,
        name: employeeName,
        role: employeeRole,
        branch: employeeBranch,
        empCode,
        ...(emp || {})
      },
      status: recordData.status || 'PRESENT',
      checkInTime: recordData.checkInTime || '',
      checkOutTime: recordData.checkOutTime || '',
      workingHours: Number(recordData.workingHours || 0),
      otHours: Number(recordData.otHours || 0),
      lateMinutes: Number(recordData.lateMinutes || 0),
      notes: recordData.notes || '',
      markedAt: new Date().toISOString(),
      markedBy: recordData.markedBy || 'Admin'
    };

    // Save to Firestore
    if (isFirebaseConfigured && db) {
      try {
        await setDoc(doc(db, 'attendance', key), payload, { merge: true });
      } catch (e) {
        console.warn("Firestore attendance save notice:", e);
      }
    }

    // Save to LocalStorage
    const map = this._getLocalAttendanceMap();
    map[key] = payload;
    this._setLocalAttendanceMap(map);

    // Save to posIndexedDB terminalSettings
    try {
      const { posIndexedDB } = await import('./posIndexedDB.js');
      await posIndexedDB.saveItem('terminalSettings', {
        id: `att_${key}`,
        key: `att_${key}`,
        value: payload
      });
    } catch (e) {}

    this._broadcastUpdate();
    return payload;
  },

  /**
   * Bulk mark attendance for all active employees on a date
   */
  async bulkMarkAttendance(dateString, targetStatus = 'PRESENT', options = {}) {
    const { branchFilter = 'ALL', shiftFilter = 'ALL' } = options;
    const dateKey = dateString || new Date().toISOString().split('T')[0];
    const employees = await this.getEmployees({ branchFilter, activeOnly: true });

    const results = [];
    const map = this._getLocalAttendanceMap();
    const firestorePromises = [];

    for (const emp of employees) {
      if (shiftFilter !== 'ALL' && emp.shift !== shiftFilter) continue;

      const shiftConfig = SHIFT_TIMINGS.find(s => s.id === emp.shift) || SHIFT_TIMINGS[0];
      const isPresent = targetStatus === 'PRESENT';

      const key = `${dateKey}_${emp.id}`;
      const payload = {
        date: dateKey,
        employeeId: emp.id,
        employeeName: emp.name,
        name: emp.name,
        role: emp.role || 'Staff',
        branch: emp.branch || 'counter-1',
        empCode: emp.empCode || '',
        employee: emp,
        status: targetStatus,
        checkInTime: isPresent ? shiftConfig.defaultIn : '',
        checkOutTime: isPresent ? shiftConfig.defaultOut : '',
        workingHours: isPresent ? shiftConfig.totalHours : 0,
        otHours: 0,
        lateMinutes: 0,
        notes: targetStatus === 'PRESENT' ? 'Bulk marked present' : '',
        markedAt: new Date().toISOString(),
        markedBy: 'Admin (Bulk Action)'
      };

      map[key] = payload;
      results.push(payload);

      // Async Firestore write
      if (isFirebaseConfigured && db) {
        firestorePromises.push(
          setDoc(doc(db, 'attendance', key), payload, { merge: true }).catch(err => {
            console.warn(`Firestore attendance write warning for ${emp.name}:`, err);
          })
        );
      }
    }

    if (firestorePromises.length > 0) {
      await Promise.all(firestorePromises);
    }

    this._setLocalAttendanceMap(map);
    this._broadcastUpdate();
    return results;
  },

  /**
   * Calculate daily summary metrics for a given date
   */
  async getDailyMetrics(dateString, branchFilter = 'ALL') {
    const list = await this.getDailyAttendance(dateString, branchFilter);
    const totalStaff = list.length;

    let present = 0;
    let halfDay = 0;
    let late = 0;
    let absent = 0;
    let paidLeave = 0;
    let weeklyOff = 0;
    let holiday = 0;
    let unmarked = 0;
    let totalOtHours = 0;

    list.forEach(item => {
      totalOtHours += Number(item.otHours || 0);
      switch (item.status) {
        case 'PRESENT': present++; break;
        case 'HALF_DAY': halfDay++; break;
        case 'LATE': late++; present++; break; // Late is counted as present with note
        case 'ABSENT': absent++; break;
        case 'PAID_LEAVE': paidLeave++; break;
        case 'WEEKLY_OFF': weeklyOff++; break;
        case 'HOLIDAY': holiday++; break;
        default: unmarked++; break;
      }
    });

    const activeWorkingCount = totalStaff - weeklyOff - holiday;
    const effectivePresent = present + (halfDay * 0.5);
    const attendanceRate = activeWorkingCount > 0 
      ? Math.min(100, Math.round((effectivePresent / activeWorkingCount) * 100))
      : 100;

    return {
      date: dateString,
      totalStaff,
      present,
      halfDay,
      late,
      absent,
      paidLeave,
      weeklyOff,
      holiday,
      unmarked,
      totalOtHours,
      attendanceRate
    };
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // 3. MONTHLY ATTENDANCE MATRIX & CALENDAR HEATMAP
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Generates a 31-day attendance grid for all employees across the specified month.
   */
  async getMonthlyAttendanceMatrix(year = new Date().getFullYear(), month = new Date().getMonth(), branchFilter = 'ALL') {
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const employees = await this.getEmployees({ branchFilter, activeOnly: true });
    const allRecords = this._getLocalAttendanceMap();

    // 1. Fetch from Firestore for the entire month
    if (isFirebaseConfigured && db) {
      try {
        const monthPrefix = `${year}-${String(month + 1).padStart(2, '0')}`;
        const startStr = `${monthPrefix}-01`;
        const endStr = `${monthPrefix}-${String(daysInMonth).padStart(2, '0')}`;

        const q = query(
          collection(db, 'attendance'),
          where('date', '>=', startStr),
          where('date', '<=', endStr)
        );
        const snap = await getDocs(q);
        if (!snap.empty) {
          snap.docs.forEach(docSnap => {
            const data = docSnap.data();
            allRecords[`${data.date}_${data.employeeId}`] = data;
          });
          this._setLocalAttendanceMap(allRecords);
        }
      } catch (e) {
        console.warn("Firestore monthly attendance read error:", e);
      }
    }

    // Build day columns metadata
    const dayHeaders = [];
    for (let day = 1; day <= daysInMonth; day++) {
      const dateObj = new Date(year, month, day);
      const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dayOfWeek = dateObj.toLocaleDateString('en-US', { weekday: 'short' }); // Mon, Tue, etc.
      const isSunday = dateObj.getDay() === 0;

      dayHeaders.push({
        day,
        dateKey,
        dayOfWeek,
        isSunday,
        isToday: dateKey === new Date().toISOString().split('T')[0]
      });
    }

    // Build row for every employee
    const rows = employees.map(emp => {
      const dailyStatuses = {};
      let countPresent = 0;
      let countHalfDay = 0;
      let countLate = 0;
      let countAbsent = 0;
      let countPaidLeave = 0;
      let countWeeklyOff = 0;
      let countHoliday = 0;
      let countUnmarked = 0;
      let totalOtHours = 0;

      dayHeaders.forEach(({ day, dateKey, isSunday }) => {
        const recordKey = `${dateKey}_${emp.id}`;
        const rec = allRecords[recordKey];

        let status = rec?.status;
        // Default Sunday to WEEKLY_OFF if unmarked
        if (!status) {
          status = isSunday ? 'WEEKLY_OFF' : 'UNMARKED';
        }

        const ot = Number(rec?.otHours || 0);
        totalOtHours += ot;

        dailyStatuses[day] = {
          status,
          otHours: ot,
          checkIn: rec?.checkInTime || '',
          checkOut: rec?.checkOutTime || '',
          notes: rec?.notes || '',
          config: ATTENDANCE_STATUSES[status] || null
        };

        switch (status) {
          case 'PRESENT': countPresent++; break;
          case 'HALF_DAY': countHalfDay++; break;
          case 'LATE': countLate++; countPresent++; break;
          case 'ABSENT': countAbsent++; break;
          case 'PAID_LEAVE': countPaidLeave++; break;
          case 'WEEKLY_OFF': countWeeklyOff++; break;
          case 'HOLIDAY': countHoliday++; break;
          default: countUnmarked++; break;
        }
      });

      // Calculate Effective Payable Days
      const effectivePayableDays = countPresent + (countHalfDay * 0.5) + countPaidLeave + countWeeklyOff + countHoliday;
      const totalActiveDays = daysInMonth;
      const attendancePercent = totalActiveDays > 0
        ? Math.min(100, Math.round((effectivePayableDays / totalActiveDays) * 100))
        : 100;

      return {
        employee: emp,
        dailyStatuses,
        summary: {
          daysInMonth,
          present: countPresent,
          halfDay: countHalfDay,
          late: countLate,
          absent: countAbsent,
          paidLeave: countPaidLeave,
          weeklyOff: countWeeklyOff,
          holiday: countHoliday,
          unmarked: countUnmarked,
          totalOtHours,
          effectivePayableDays: Number(effectivePayableDays.toFixed(1)),
          attendancePercent
        }
      };
    });

    return {
      year,
      month,
      monthName: new Date(year, month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
      daysInMonth,
      dayHeaders,
      rows
    };
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // 4. WAGE & PAYROLL ESTIMATOR
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Calculates monthly payroll payout based on recorded attendance and OT hours
   */
  async calculateMonthlyPayroll(year = new Date().getFullYear(), month = new Date().getMonth(), branchFilter = 'ALL') {
    const matrix = await this.getMonthlyAttendanceMatrix(year, month, branchFilter);
    const daysInMonth = matrix.daysInMonth;

    let totalPayrollGross = 0;
    let totalOtPayout = 0;
    let totalDeductions = 0;
    let totalNetPayable = 0;

    const employeePayrolls = matrix.rows.map(row => {
      const { employee, summary } = row;
      const { effectivePayableDays, totalOtHours, absent, halfDay } = summary;

      let baseMonthly = Number(employee.baseSalary || 0);
      let dailyRate = Number(employee.dailyWage || 0);
      let otRate = Number(employee.otHourlyRate || 0);

      // If daily wage worker
      let earnedBaseSalary = 0;
      if (employee.salaryType === 'DAILY') {
        earnedBaseSalary = Math.round(dailyRate * effectivePayableDays);
      } else {
        // Monthly Fixed: (BaseSalary / DaysInMonth) * PayableDays
        const perDayRate = baseMonthly / (daysInMonth || 30);
        earnedBaseSalary = Math.round(perDayRate * effectivePayableDays);
      }

      // Overtime Earnings
      const earnedOtPay = Math.round(totalOtHours * otRate);

      // Absent Deductions (for Monthly Fixed workers)
      let absenceDeductions = 0;
      if (employee.salaryType === 'MONTHLY' && baseMonthly > 0) {
        const perDayRate = baseMonthly / (daysInMonth || 30);
        const unpaidDays = absent + (halfDay * 0.5);
        absenceDeductions = Math.round(perDayRate * unpaidDays);
      }

      const grossEarnings = earnedBaseSalary + earnedOtPay;
      const netPayable = Math.max(0, grossEarnings);

      totalPayrollGross += earnedBaseSalary;
      totalOtPayout += earnedOtPay;
      totalDeductions += absenceDeductions;
      totalNetPayable += netPayable;

      return {
        employee,
        payableDays: effectivePayableDays,
        totalDays: daysInMonth,
        baseSalary: baseMonthly,
        dailyRate,
        otRate,
        otHours: totalOtHours,
        earnedBaseSalary,
        earnedOtPay,
        absenceDeductions,
        grossEarnings,
        netPayable
      };
    });

    return {
      year,
      month,
      monthName: matrix.monthName,
      daysInMonth,
      employeePayrolls,
      totalPayrollGross,
      totalOtPayout,
      totalDeductions,
      totalNetPayable
    };
  },

  /**
   * 1-Click: Sync & Push Monthly Payroll to Admin Expense Ledger
   */
  async syncPayrollToExpenseLedger(year, month, branchFilter = 'ALL') {
    const payroll = await this.calculateMonthlyPayroll(year, month, branchFilter);
    const monthKey = `${year}-${String(month + 1).padStart(2, '0')}`;
    const dateStr = `${monthKey}-28`; // Standard month-end payroll settlement date

    const title = `Staff Payroll & Wages — ${payroll.monthName}`;
    const amount = payroll.totalNetPayable;

    if (amount <= 0) {
      throw new Error('Calculated payroll amount is ₹0. Please mark attendance before logging payroll.');
    }

    const payload = {
      title,
      categoryId: 'labour',
      amount,
      unitCount: payroll.employeePayrolls.length,
      unitRate: Math.round(amount / (payroll.employeePayrolls.length || 1)),
      date: dateStr,
      branchId: branchFilter === 'ALL' ? 'ALL_BRANCHES' : branchFilter,
      paymentMode: 'BANK_TRANSFER',
      notes: `Automated payroll ledger sync for ${payroll.employeePayrolls.length} employees (Base: ₹${payroll.totalPayrollGross}, OT: ₹${payroll.totalOtPayout}).`,
      status: 'PAID'
    };

    const saved = await expenseService.addExpense(payload);
    return { savedExpense: saved, payroll };
  },

  /**
   * Export Monthly Attendance Sheet to CSV Format
   */
  exportAttendanceToCSV(matrix) {
    const { monthName, dayHeaders, rows } = matrix;

    const headers = [
      'Emp Code',
      'Employee Name',
      'Role',
      'Branch',
      ...dayHeaders.map(d => `${d.day} (${d.dayOfWeek})`),
      'Present (P)',
      'Half Days (HD)',
      'Absent (A)',
      'Paid Leaves (PL)',
      'Weekly Offs (WO)',
      'OT Hours',
      'Payable Days',
      'Attendance %'
    ];

    const dataRows = rows.map(r => {
      const emp = r.employee;
      const s = r.summary;

      const dayCols = dayHeaders.map(d => {
        const dayStat = r.dailyStatuses[d.day];
        const code = dayStat?.config?.code || (dayStat?.status === 'WEEKLY_OFF' ? 'WO' : '-');
        const ot = dayStat?.otHours ? ` (+${dayStat.otHours}h OT)` : '';
        return `"${code}${ot}"`;
      });

      return [
        `"${emp.empCode}"`,
        `"${emp.name}"`,
        `"${emp.role}"`,
        `"${emp.branch}"`,
        ...dayCols,
        s.present,
        s.halfDay,
        s.absent,
        s.paidLeave,
        s.weeklyOff,
        s.totalOtHours,
        s.effectivePayableDays,
        `"${s.attendancePercent}%"`
      ].join(',');
    });

    return [
      `"TECH WASH LAUNDRY SERVICES - MONTHLY ATTENDANCE REGISTER"`,
      `"Month: ${monthName}"`,
      `"Generated: ${new Date().toLocaleString()}"`,
      '',
      headers.join(','),
      ...dataRows
    ].join('\n');
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // INTERNAL HELPERS & LOCALSTORAGE
  // ─────────────────────────────────────────────────────────────────────────────

  _getLocalAttendanceMap() {
    try {
      const stored = localStorage.getItem(ATTENDANCE_STORAGE_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch (e) {
      return {};
    }
  },

  _setLocalAttendanceMap(map) {
    try {
      localStorage.setItem(ATTENDANCE_STORAGE_KEY, JSON.stringify(map));
    } catch (e) {}
  },

  _broadcastUpdate() {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('techwash_attendance_updated', {
        detail: { timestamp: Date.now() }
      }));
    }
  }
};

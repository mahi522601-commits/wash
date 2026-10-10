import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  attendanceService, 
  ATTENDANCE_STATUSES, 
  EMPLOYEE_ROLES, 
  SHIFT_TIMINGS, 
  BRANCH_LOCATIONS 
} from '../../services/attendanceService';
import { formatCurrency } from '../../utils/formatters';
import { useToast } from '../../context/ToastContext';
import { AdminPageHeader } from '../../components/admin/AdminPageHeader';
import { Table } from '../../components/ui/Table';
import { Button } from '../../components/ui/Button';
import { Input, Select } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { Tabs } from '../../components/ui/Tabs';
import { Badge } from '../../components/ui/Badge';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { 
  UserCheck, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Plus, 
  Search, 
  Filter, 
  Printer, 
  Download, 
  Edit3, 
  Trash2, 
  Eye, 
  Phone, 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Layers, 
  Sliders, 
  Sparkles, 
  RefreshCw, 
  ChevronLeft, 
  ChevronRight, 
  Check, 
  X, 
  Building, 
  Briefcase, 
  ShieldCheck, 
  CreditCard, 
  Share2, 
  Award, 
  HelpCircle,
  Zap,
  ArrowRight
} from 'lucide-react';

const MONTHS = [
  { value: 0, label: 'January' },
  { value: 1, label: 'February' },
  { value: 2, label: 'March' },
  { value: 3, label: 'April' },
  { value: 4, label: 'May' },
  { value: 5, label: 'June' },
  { value: 6, label: 'July' },
  { value: 7, label: 'August' },
  { value: 8, label: 'September' },
  { value: 9, label: 'October' },
  { value: 10, label: 'November' },
  { value: 11, label: 'December' },
];

const YEARS = [2025, 2026, 2027, 2028];

const INITIAL_EMPLOYEE = {
  name: '',
  phone: '',
  email: '',
  role: '👔 Steam Press & Ironing Master',
  department: 'Finishing & Press',
  branch: 'counter-1',
  shift: 'GENERAL',
  employmentType: 'FULL_TIME',
  salaryType: 'MONTHLY',
  baseSalary: 18000,
  dailyWage: 650,
  otHourlyRate: 90,
  vehicleNumber: '',
  joiningDate: new Date().toISOString().split('T')[0],
  emergencyContact: '',
  aadhaarNumber: '',
  bankDetails: {
    accountNumber: '',
    ifsc: '',
    upiId: ''
  },
  active: true,
  avatarColor: 'from-purple-600 to-indigo-600'
};

const INITIAL_ATTENDANCE_FORM = {
  employeeId: '',
  date: new Date().toISOString().split('T')[0],
  status: 'PRESENT',
  shift: 'GENERAL',
  checkInTime: '09:00',
  checkOutTime: '18:00',
  workingHours: 9,
  otHours: 0,
  branch: 'counter-1',
  notes: '',
};

export const AdminAttendancePage = () => {
  const { success, error, info } = useToast();

  // Active Main Tab: 'daily' | 'monthly' | 'payroll' | 'employees'
  const [activeTab, setActiveTab] = useState('daily');

  // Filter States
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [branchFilter, setBranchFilter] = useState('ALL');
  const [departmentFilter, setDepartmentFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Data States
  const [dailyAttendance, setDailyAttendance] = useState([]);
  const [dailyMetrics, setDailyMetrics] = useState(null);
  const [monthlyMatrix, setMonthlyMatrix] = useState(null);
  const [payrollData, setPayrollData] = useState(null);
  const [employeesList, setEmployeesList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSyncingPayroll, setIsSyncingPayroll] = useState(false);

  // Modals
  const [attendanceModalOpen, setAttendanceModalOpen] = useState(false);
  const [attendanceForm, setAttendanceForm] = useState(INITIAL_ATTENDANCE_FORM);
  const [employeeModalOpen, setEmployeeModalOpen] = useState(false);
  const [currentEmployee, setCurrentEmployee] = useState(INITIAL_EMPLOYEE);
  const [viewEmployee, setViewEmployee] = useState(null);
  const [deleteTargetEmployee, setDeleteTargetEmployee] = useState(null);
  const [cellEditModal, setCellEditModal] = useState(null); // { employee, day, dateKey, currentRecord }

  // ─────────────────────────────────────────────────────────────────────────────
  // LOAD DATA HANDLERS
  // ─────────────────────────────────────────────────────────────────────────────

  const loadAllData = useCallback(async () => {
    setLoading(true);
    try {
      const [daily, metrics, matrix, payroll, employees] = await Promise.all([
        attendanceService.getDailyAttendance(selectedDate, branchFilter),
        attendanceService.getDailyMetrics(selectedDate, branchFilter),
        attendanceService.getMonthlyAttendanceMatrix(selectedYear, selectedMonth, branchFilter),
        attendanceService.calculateMonthlyPayroll(selectedYear, selectedMonth, branchFilter),
        attendanceService.getEmployees({ branchFilter, departmentFilter, search: searchQuery })
      ]);

      setDailyAttendance(daily || []);
      setDailyMetrics(metrics);
      setMonthlyMatrix(matrix);
      setPayrollData(payroll);
      setEmployeesList(employees || []);
    } catch (err) {
      console.error("Attendance loading error:", err);
      error("Data Load Error", "Failed to retrieve attendance and employee records.");
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [selectedDate, selectedMonth, selectedYear, branchFilter, departmentFilter, searchQuery]);

  useEffect(() => {
    loadAllData();

    // Listen for cross-tab or service updates
    const handleUpdate = () => loadAllData();
    window.addEventListener('techwash_attendance_updated', handleUpdate);
    return () => window.removeEventListener('techwash_attendance_updated', handleUpdate);
  }, [loadAllData]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadAllData();
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // DATE NAVIGATION
  // ─────────────────────────────────────────────────────────────────────────────

  const handlePrevDay = () => {
    const cur = new Date(selectedDate);
    cur.setDate(cur.getDate() - 1);
    setSelectedDate(cur.toISOString().split('T')[0]);
  };

  const handleNextDay = () => {
    const cur = new Date(selectedDate);
    cur.setDate(cur.getDate() + 1);
    setSelectedDate(cur.toISOString().split('T')[0]);
  };

  const handleSetToday = () => {
    setSelectedDate(new Date().toISOString().split('T')[0]);
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // DAILY ATTENDANCE MARKING
  // ─────────────────────────────────────────────────────────────────────────────

  const handleUpdateStatus = async (item, newStatus) => {
    try {
      const empName = item.employee?.name || item.employeeName || item.name || 'Staff Member';
      const shiftConfig = SHIFT_TIMINGS.find(s => s.id === (item.employee?.shift || item.shift)) || SHIFT_TIMINGS[0];
      const isPresent = newStatus === 'PRESENT' || newStatus === 'LATE';

      const updatedRecord = {
        ...item,
        employeeName: empName,
        name: empName,
        status: newStatus,
        checkInTime: isPresent ? (item.checkInTime || shiftConfig.defaultIn) : '',
        checkOutTime: isPresent ? (item.checkOutTime || shiftConfig.defaultOut) : '',
        workingHours: isPresent ? shiftConfig.totalHours : 0,
      };

      await attendanceService.saveEmployeeAttendance(selectedDate, item.employeeId, updatedRecord);
      success('Attendance Saved', `${empName} marked as ${ATTENDANCE_STATUSES[newStatus]?.label || newStatus}.`);
      loadAllData();
    } catch (err) {
      error('Update Failed', err.message);
    }
  };

  const handleUpdateTimings = async (item, field, val) => {
    try {
      const updated = { ...item, [field]: val };
      await attendanceService.saveEmployeeAttendance(selectedDate, item.employeeId, updated);
      loadAllData();
    } catch (err) {
      error('Timing Error', err.message);
    }
  };

  const handleUpdateOT = async (item, delta) => {
    const nextOt = Math.max(0, Number((Number(item.otHours || 0) + delta).toFixed(1)));
    try {
      await attendanceService.saveEmployeeAttendance(selectedDate, item.employeeId, {
        ...item,
        otHours: nextOt
      });
      loadAllData();
    } catch (err) {
      error('OT Update Error', err.message);
    }
  };

  const handleBulkMarkPresent = async () => {
    try {
      await attendanceService.bulkMarkAttendance(selectedDate, 'PRESENT', { branchFilter });
      success('Roll Call Completed', `All active staff marked Present for ${selectedDate}.`);
      loadAllData();
    } catch (err) {
      error('Bulk Action Failed', err.message);
    }
  };

  const handleBulkMarkWeeklyOff = async () => {
    try {
      await attendanceService.bulkMarkAttendance(selectedDate, 'WEEKLY_OFF', { branchFilter });
      success('Weekly Off Set', `All active staff marked on Weekly Off for ${selectedDate}.`);
      loadAllData();
    } catch (err) {
      error('Bulk Action Failed', err.message);
    }
  };

  const handleOpenAddAttendance = (targetEmployee = null) => {
    const emp = targetEmployee || (employeesList.length > 0 ? employeesList[0] : null);
    const shiftConfig = SHIFT_TIMINGS.find(s => s.id === (emp?.shift || 'GENERAL')) || SHIFT_TIMINGS[0];
    const existing = emp ? dailyAttendance.find(d => d.employeeId === emp.id) : null;

    setAttendanceForm({
      employeeId: emp ? emp.id : '',
      date: selectedDate,
      status: existing?.status || 'PRESENT',
      shift: emp?.shift || 'GENERAL',
      checkInTime: existing?.checkInTime || shiftConfig.defaultIn,
      checkOutTime: existing?.checkOutTime || shiftConfig.defaultOut,
      workingHours: existing?.workingHours !== undefined ? existing.workingHours : shiftConfig.totalHours,
      otHours: existing?.otHours || 0,
      branch: emp?.branch || (branchFilter !== 'ALL' ? branchFilter : 'counter-1'),
      notes: existing?.notes || '',
    });
    setAttendanceModalOpen(true);
  };

  const handleSaveAttendanceForm = async (e) => {
    if (e) e.preventDefault();
    if (!attendanceForm.employeeId) {
      error('Employee Required', 'Please select an employee.');
      return;
    }

    try {
      const selectedEmp = employeesList.find(emp => emp.id === attendanceForm.employeeId);
      const empName = selectedEmp?.name || attendanceForm.employeeName || 'Staff Member';
      await attendanceService.saveEmployeeAttendance(
        attendanceForm.date,
        attendanceForm.employeeId,
        {
          employee: selectedEmp,
          employeeName: empName,
          name: empName,
          role: selectedEmp?.role || '',
          branch: attendanceForm.branch || selectedEmp?.branch,
          shift: attendanceForm.shift || selectedEmp?.shift,
          status: attendanceForm.status,
          checkInTime: attendanceForm.checkInTime || '',
          checkOutTime: attendanceForm.checkOutTime || '',
          workingHours: Number(attendanceForm.workingHours || 0),
          otHours: Number(attendanceForm.otHours || 0),
          notes: attendanceForm.notes || '',
          markedBy: 'Admin (Attendance Hub)'
        }
      );

      success('Attendance Recorded', `Saved attendance record for ${empName} on ${attendanceForm.date}.`);
      setAttendanceModalOpen(false);
      loadAllData();
    } catch (err) {
      error('Save Failed', err.message || 'Could not save attendance.');
    }
  };

  const handleSendWhatsAppSummary = () => {
    if (!dailyMetrics) return;
    const dateFormatted = new Date(selectedDate).toLocaleDateString('en-IN', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });

    const presentList = dailyAttendance
      .filter(d => d.status === 'PRESENT' || d.status === 'LATE')
      .map(d => `• ${d.employee?.name || d.employeeName || d.name || 'Staff'} (${d.employee?.role || d.role || 'Staff'}) - In: ${d.checkInTime || '09:00'} ${d.otHours > 0 ? `(+${d.otHours}h OT)` : ''}`)
      .join('\n');

    const absentList = dailyAttendance
      .filter(d => d.status === 'ABSENT' || d.status === 'PAID_LEAVE')
      .map(d => `• ${d.employee?.name || d.employeeName || d.name || 'Staff'} (${d.employee?.role || d.role || 'Staff'}) - ${d.status === 'PAID_LEAVE' ? 'Leave' : 'Absent'}`)
      .join('\n');

    const msg = `✨ *Tech Wash Laundry Services — Daily Staff Attendance Report*
📅 *Date:* ${dateFormatted}
📍 *Store Branch:* ${branchFilter === 'ALL' ? 'All Tech Wash Branches' : branchFilter}

📊 *ATTENDANCE SUMMARY:*
👥 *Total Staff:* ${dailyMetrics.totalStaff}
✅ *Present:* ${dailyMetrics.present} (Attendance: ${dailyMetrics.attendanceRate}%)
⏰ *Late In:* ${dailyMetrics.late}
🌓 *Half Day:* ${dailyMetrics.halfDay}
❌ *Absent:* ${dailyMetrics.absent}
🏖️ *On Leave:* ${dailyMetrics.paidLeave + dailyMetrics.weeklyOff}
⚡ *Total OT Logged:* ${dailyMetrics.totalOtHours} Hours

🟢 *ON DUTY STAFF:*
${presentList || 'None'}
${absentList ? `\n🔴 *ABSENT / ON LEAVE:*\n${absentList}` : ''}

Generated automatically by Tech Wash Admin Suite.`;

    const encoded = encodeURIComponent(msg);
    window.open(`https://api.whatsapp.com/send?text=${encoded}`, '_blank');
    success('WhatsApp Summary Ready', 'Daily attendance roll call prepared for sharing.');
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // MONTHLY CELL QUICK EDIT
  // ─────────────────────────────────────────────────────────────────────────────

  const handleSaveCellModal = async (e) => {
    e.preventDefault();
    if (!cellEditModal) return;

    try {
      await attendanceService.saveEmployeeAttendance(
        cellEditModal.dateKey,
        cellEditModal.employee.id,
        {
          status: cellEditModal.status,
          checkInTime: cellEditModal.checkInTime || '',
          checkOutTime: cellEditModal.checkOutTime || '',
          otHours: Number(cellEditModal.otHours || 0),
          notes: cellEditModal.notes || ''
        }
      );
      success('Attendance Updated', `Record saved for ${cellEditModal.employee.name} on Day ${cellEditModal.day}.`);
      setCellEditModal(null);
      loadAllData();
    } catch (err) {
      error('Cell Save Error', err.message);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // PAYROLL SYNC TO EXPENSES
  // ─────────────────────────────────────────────────────────────────────────────

  const handleSyncPayrollToExpenses = async () => {
    setIsSyncingPayroll(true);
    try {
      const res = await attendanceService.syncPayrollToExpenseLedger(selectedYear, selectedMonth, branchFilter);
      success(
        'Payroll Logged to Expenses!', 
        `₹${res.payroll.totalNetPayable.toLocaleString('en-IN')} logged under "👷 Labour & Staff Wages" for ${res.payroll.monthName}.`
      );
    } catch (err) {
      error('Sync Failed', err.message);
    } finally {
      setIsSyncingPayroll(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // EXPORTS & PRINTS
  // ─────────────────────────────────────────────────────────────────────────────

  const handleExportCSV = () => {
    if (!monthlyMatrix) return;
    const csv = attendanceService.exportAttendanceToCSV(monthlyMatrix);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `techwash-attendance-${selectedYear}-${selectedMonth + 1}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    success('CSV Exported', `Attendance Register for ${monthlyMatrix.monthName} downloaded.`);
  };

  const handlePrint = () => {
    window.print();
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // EMPLOYEE CMS (SAVE / DELETE)
  // ─────────────────────────────────────────────────────────────────────────────

  const handleOpenAddEmployee = () => {
    setCurrentEmployee({
      ...INITIAL_EMPLOYEE,
      id: null,
      empCode: `TW-EMP-${Math.floor(100 + Math.random() * 900)}`
    });
    setEmployeeModalOpen(true);
  };

  const handleOpenEditEmployee = (emp) => {
    setCurrentEmployee({ ...emp });
    setEmployeeModalOpen(true);
  };

  const handleSaveEmployee = async (e) => {
    e.preventDefault();
    if (!currentEmployee.name.trim() || !currentEmployee.phone.trim()) {
      error('Required Fields', 'Please enter employee name and mobile phone number.');
      return;
    }

    try {
      await attendanceService.saveEmployee(currentEmployee);
      success('Employee Saved', `${currentEmployee.name} details have been saved.`);
      setEmployeeModalOpen(false);
      loadAllData();
    } catch (err) {
      error('Save Failed', err.message);
    }
  };

  const handleDeleteEmployee = async () => {
    if (!deleteTargetEmployee) return;
    try {
      await attendanceService.deleteEmployee(deleteTargetEmployee.id);
      success('Employee Removed', `${deleteTargetEmployee.name} removed from roster.`);
      setDeleteTargetEmployee(null);
      loadAllData();
    } catch (err) {
      error('Delete Failed', err.message);
    }
  };

  // Filtered employees for directory tab
  const filteredDirectoryEmployees = useMemo(() => {
    return employeesList.filter(emp => {
      if (branchFilter !== 'ALL' && emp.branch !== branchFilter) return false;
      if (departmentFilter !== 'ALL' && emp.department !== departmentFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          emp.name?.toLowerCase().includes(q) ||
          emp.empCode?.toLowerCase().includes(q) ||
          emp.phone?.toLowerCase().includes(q) ||
          emp.role?.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [employeesList, branchFilter, departmentFilter, searchQuery]);

  return (
    <div className="space-y-6 pb-20">
      
      {/* ─────────────────────────────────────────────────────────
          1. HEADER & GLOBAL CONTROLS
      ───────────────────────────────────────────────────────── */}
      <div className="no-print space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <UserCheck className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 font-display flex items-center gap-2">
                  <span>Staff Directory & Daily Attendance</span>
                  <Badge variant="primary" className="bg-emerald-500/10 text-emerald-700 border-emerald-300">
                    Smart Roll Call
                  </Badge>
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                  Real-time daily attendance terminal, 31-day monthly heatmap register, shift timings, overtime tracking, and payroll sync.
                </p>
              </div>
            </div>
          </div>

          {/* Quick Action Hub */}
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              icon={RefreshCw}
              onClick={handleRefresh}
              loading={isRefreshing}
              className="text-slate-700 hover:text-slate-900"
            >
              Refresh
            </Button>

            <Button
              variant="outline"
              size="sm"
              icon={Download}
              onClick={handleExportCSV}
              className="text-slate-700"
            >
              Export CSV
            </Button>

            <Button
              variant="outline"
              size="sm"
              icon={Printer}
              onClick={handlePrint}
              className="text-slate-700"
            >
              Print Register
            </Button>

            <Button
              variant="primary"
              size="sm"
              icon={CheckCircle2}
              onClick={() => handleOpenAddAttendance(null)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20 font-bold"
            >
              + Record Attendance
            </Button>

            <Button
              variant="outline"
              size="sm"
              icon={Plus}
              onClick={handleOpenAddEmployee}
              className="text-slate-700 hover:text-slate-900 border-slate-300"
            >
              + Add Employee
            </Button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 p-1.5 bg-slate-200/80 rounded-2xl w-fit shadow-inner overflow-x-auto max-w-full">
          <button
            type="button"
            onClick={() => setActiveTab('daily')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'daily'
                ? 'bg-slate-900 text-white shadow-md'
                : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Daily Roll Call</span>
            {dailyMetrics && (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-emerald-500 text-white">
                {dailyMetrics.present}/{dailyMetrics.totalStaff}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('monthly')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'monthly'
                ? 'bg-slate-900 text-white shadow-md'
                : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>31-Day Monthly Register</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('payroll')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'payroll'
                ? 'bg-slate-900 text-white shadow-md'
                : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <DollarSign className="w-4 h-4" />
            <span>Wage & Payroll Estimator</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('employees')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'employees'
                ? 'bg-slate-900 text-white shadow-md'
                : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Building className="w-4 h-4" />
            <span>Employee Directory ({employeesList.length})</span>
          </button>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────
          TAB 1: 📅 DAILY ATTENDANCE TERMINAL & ROLL CALL
      ───────────────────────────────────────────────────────── */}
      {activeTab === 'daily' && (
        <div className="space-y-6">
          
          {/* Top Control Bar: Date Selector & Branch Filters */}
          <div className="p-4 sm:p-5 rounded-3xl bg-white border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            
            {/* Date Navigator */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center bg-slate-100 rounded-2xl p-1 border border-slate-200">
                <button
                  type="button"
                  onClick={handlePrevDay}
                  className="p-1.5 rounded-xl hover:bg-white text-slate-700 hover:shadow-xs transition-all"
                  title="Previous Day"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="bg-transparent px-2 py-1 text-xs font-bold text-slate-800 border-none focus:outline-none cursor-pointer"
                />

                <button
                  type="button"
                  onClick={handleNextDay}
                  className="p-1.5 rounded-xl hover:bg-white text-slate-700 hover:shadow-xs transition-all"
                  title="Next Day"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={handleSetToday}
                className="text-xs font-bold"
              >
                Today
              </Button>
            </div>

            {/* Branch & Role Filters */}
            <div className="flex items-center gap-3 flex-wrap">
              <select
                value={branchFilter}
                onChange={(e) => setBranchFilter(e.target.value)}
                className="text-xs font-bold px-3 py-2 rounded-xl bg-slate-100 border border-slate-200 text-slate-800 focus:outline-none"
              >
                {BRANCH_LOCATIONS.map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>

              <Button
                variant="primary"
                size="sm"
                icon={Plus}
                onClick={() => handleOpenAddAttendance(null)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm font-bold text-xs"
              >
                + Record Entry
              </Button>

              <Button
                variant="outline"
                size="sm"
                icon={Zap}
                onClick={handleBulkMarkPresent}
                className="font-bold text-xs text-slate-700 hover:text-slate-900 border-slate-300"
              >
                ⚡ All Present
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={handleBulkMarkWeeklyOff}
                className="font-bold text-xs text-slate-700 hover:text-slate-900 border-slate-300"
              >
                Weekly Off
              </Button>

              <Button
                variant="outline"
                size="sm"
                icon={Share2}
                onClick={handleSendWhatsAppSummary}
                className="font-bold text-xs text-emerald-700 hover:bg-emerald-50 border-emerald-300 flex items-center gap-1.5"
                title="Share Daily Attendance Summary via WhatsApp"
              >
                <span>WhatsApp Summary</span>
              </Button>
            </div>
          </div>

          {/* Daily KPI Metric Cards */}
          {dailyMetrics && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <div className="p-4 rounded-3xl bg-emerald-50 border border-emerald-200 flex flex-col justify-between">
                <div className="flex items-center justify-between text-emerald-700 text-xs font-bold">
                  <span>Present</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                </div>
                <div className="mt-2 text-2xl font-black text-emerald-950 font-display">
                  {dailyMetrics.present}
                </div>
                <div className="text-[10px] text-emerald-600 mt-0.5">
                  {dailyMetrics.late > 0 ? `Includes ${dailyMetrics.late} late in` : 'Full day active'}
                </div>
              </div>

              <div className="p-4 rounded-3xl bg-amber-50 border border-amber-200 flex flex-col justify-between">
                <div className="flex items-center justify-between text-amber-700 text-xs font-bold">
                  <span>Half Day</span>
                  <Clock className="w-3.5 h-3.5" />
                </div>
                <div className="mt-2 text-2xl font-black text-amber-950 font-display">
                  {dailyMetrics.halfDay}
                </div>
                <div className="text-[10px] text-amber-600 mt-0.5">
                  0.5 Day credit
                </div>
              </div>

              <div className="p-4 rounded-3xl bg-rose-50 border border-rose-200 flex flex-col justify-between">
                <div className="flex items-center justify-between text-rose-700 text-xs font-bold">
                  <span>Absent</span>
                  <X className="w-3.5 h-3.5" />
                </div>
                <div className="mt-2 text-2xl font-black text-rose-950 font-display">
                  {dailyMetrics.absent}
                </div>
                <div className="text-[10px] text-rose-600 mt-0.5">
                  Unpaid absence
                </div>
              </div>

              <div className="p-4 rounded-3xl bg-purple-50 border border-purple-200 flex flex-col justify-between">
                <div className="flex items-center justify-between text-purple-700 text-xs font-bold">
                  <span>On Leave / Off</span>
                  <ShieldCheck className="w-3.5 h-3.5" />
                </div>
                <div className="mt-2 text-2xl font-black text-purple-950 font-display">
                  {dailyMetrics.paidLeave + dailyMetrics.weeklyOff}
                </div>
                <div className="text-[10px] text-purple-600 mt-0.5">
                  {dailyMetrics.paidLeave} Leave • {dailyMetrics.weeklyOff} Off
                </div>
              </div>

              <div className="p-4 rounded-3xl bg-blue-50 border border-blue-200 flex flex-col justify-between">
                <div className="flex items-center justify-between text-blue-700 text-xs font-bold">
                  <span>Overtime (OT)</span>
                  <Zap className="w-3.5 h-3.5" />
                </div>
                <div className="mt-2 text-2xl font-black text-blue-950 font-display">
                  {dailyMetrics.totalOtHours}h
                </div>
                <div className="text-[10px] text-blue-600 mt-0.5">
                  Logged OT hours
                </div>
              </div>

              <div className="p-4 rounded-3xl bg-slate-900 text-white border border-slate-800 flex flex-col justify-between shadow-lg">
                <div className="flex items-center justify-between text-slate-400 text-xs font-bold">
                  <span>Attendance Rate</span>
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                </div>
                <div className="mt-2 text-2xl font-black text-emerald-400 font-display">
                  {dailyMetrics.attendanceRate}%
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  {dailyMetrics.present + dailyMetrics.halfDay}/{dailyMetrics.totalStaff} Operational
                </div>
              </div>
            </div>
          )}

          {/* Daily Roll Call Table / Cards */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden divide-y divide-slate-100">
            <div className="p-4 bg-slate-50 flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
              <span>Employee Roster ({dailyAttendance.length} Staff)</span>
              <span>Daily Status, Timings & Overtime</span>
            </div>

            {dailyAttendance.length === 0 ? (
              <div className="py-16 text-center text-slate-400 text-xs">
                <UserCheck className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                <p className="font-bold text-slate-600">No active employees found for this filter.</p>
                <p className="mt-1">Click "+ Add Employee" to create new staff profiles.</p>
              </div>
            ) : (
              dailyAttendance.map((item) => {
                const emp = item.employee;
                const statusConfig = ATTENDANCE_STATUSES[item.status] || null;

                return (
                  <div 
                    key={emp.id} 
                    className="p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 hover:bg-slate-50/70 transition-colors"
                  >
                    {/* Employee Profile Summary */}
                    <div className="flex items-center gap-3.5 min-w-[260px]">
                      <div className={`w-11 h-11 rounded-2xl bg-gradient-to-tr ${emp.avatarColor || 'from-purple-600 to-indigo-600'} text-white font-black text-sm flex items-center justify-center shadow-md shrink-0`}>
                        {(emp.name || 'E')[0].toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 text-sm">{emp.name}</span>
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 text-slate-600 border border-slate-200">
                            {emp.empCode}
                          </span>
                        </div>
                        <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5 flex-wrap">
                          <span>{emp.role}</span>
                          <span>•</span>
                          <span className="text-slate-400">{emp.branch}</span>
                          {item.notes && (
                            <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200" title={item.notes}>
                              📝 {item.notes}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Status Pill Buttons */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {Object.values(ATTENDANCE_STATUSES).map((st) => {
                        const isSelected = item.status === st.key;
                        return (
                          <button
                            key={st.key}
                            type="button"
                            onClick={() => handleUpdateStatus(item, st.key)}
                            className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                              isSelected
                                ? `${st.cellBg} shadow-sm scale-105`
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                            title={st.description}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : st.dotColor}`} />
                            <span>{st.label}</span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Time Tracking & Overtime */}
                    <div className="flex items-center gap-3 shrink-0 flex-wrap lg:flex-nowrap">
                      {/* Check-In */}
                      <div className="flex flex-col">
                        <span className="text-[10px] text-slate-400 font-bold uppercase">In</span>
                        <input
                          type="time"
                          value={item.checkInTime || ''}
                          onChange={(e) => handleUpdateTimings(item, 'checkInTime', e.target.value)}
                          className="w-24 text-xs font-bold px-2 py-1 bg-slate-100 border border-slate-200 rounded-lg text-slate-800"
                        />
                      </div>

                      {/* Check-Out */}
                      <div className="flex flex-col">
                        <span className="text-[10px] text-slate-400 font-bold uppercase">Out</span>
                        <input
                          type="time"
                          value={item.checkOutTime || ''}
                          onChange={(e) => handleUpdateTimings(item, 'checkOutTime', e.target.value)}
                          className="w-24 text-xs font-bold px-2 py-1 bg-slate-100 border border-slate-200 rounded-lg text-slate-800"
                        />
                      </div>

                      {/* OT Counter */}
                      <div className="flex flex-col">
                        <span className="text-[10px] text-slate-400 font-bold uppercase">OT Hours</span>
                        <div className="flex items-center bg-slate-100 border border-slate-200 rounded-lg overflow-hidden">
                          <button
                            type="button"
                            onClick={() => handleUpdateOT(item, -0.5)}
                            className="px-2 py-1 text-slate-600 hover:bg-slate-200 text-xs font-bold"
                          >
                            -
                          </button>
                          <span className="px-2 text-xs font-black text-slate-800">
                            {item.otHours || 0}h
                          </span>
                          <button
                            type="button"
                            onClick={() => handleUpdateOT(item, 0.5)}
                            className="px-2 py-1 text-slate-600 hover:bg-slate-200 text-xs font-bold"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      {/* Daily Earnings Preview */}
                      <div className="hidden sm:flex flex-col text-right px-1">
                        <span className="text-[10px] text-slate-400 font-bold uppercase">Estimated Pay</span>
                        <span className="text-xs font-black text-emerald-700 font-mono">
                          ₹{(() => {
                            const wagePerDay = emp.salaryType === 'DAILY' ? emp.dailyWage : Math.round((emp.baseSalary || 18000) / 26);
                            const otPay = Math.round((Number(item.otHours) || 0) * (emp.otHourlyRate || 90));
                            const isPres = item.status === 'PRESENT' || item.status === 'LATE';
                            const isHalf = item.status === 'HALF_DAY';
                            return (isPres ? wagePerDay : (isHalf ? Math.round(wagePerDay / 2) : (item.status === 'PAID_LEAVE' ? wagePerDay : 0))) + otPay;
                          })()}
                        </span>
                      </div>

                      {/* Edit Full Attendance Record */}
                      <button
                        type="button"
                        onClick={() => handleOpenAddAttendance(emp)}
                        className="p-2 rounded-xl text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 transition-colors"
                        title="Edit Full Attendance Record & Details"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>

                      {/* View Profile / Actions */}
                      <button
                        type="button"
                        onClick={() => setViewEmployee(emp)}
                        className="p-2 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                        title="View Full Profile"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>

                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────
          TAB 2: 🗓️ 31-DAY MONTHLY ATTENDANCE REGISTER (HEATMAP MATRIX)
      ───────────────────────────────────────────────────────── */}
      {activeTab === 'monthly' && monthlyMatrix && (
        <div className="space-y-6">
          
          {/* Controls: Month, Year, Branch */}
          <div className="no-print p-4 sm:p-5 rounded-3xl bg-white border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-wrap">
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="text-xs font-bold px-3 py-2 rounded-xl bg-slate-100 border border-slate-200 text-slate-800 focus:outline-none"
              >
                {MONTHS.map(m => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>

              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="text-xs font-bold px-3 py-2 rounded-xl bg-slate-100 border border-slate-200 text-slate-800 focus:outline-none"
              >
                {YEARS.map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>

              <select
                value={branchFilter}
                onChange={(e) => setBranchFilter(e.target.value)}
                className="text-xs font-bold px-3 py-2 rounded-xl bg-slate-100 border border-slate-200 text-slate-800 focus:outline-none"
              >
                {BRANCH_LOCATIONS.map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>

            {/* Status Color Legend */}
            <div className="flex items-center gap-2 flex-wrap text-[11px] font-bold">
              <span className="text-slate-400 uppercase text-[10px]">Legend:</span>
              <span className="px-2 py-0.5 rounded bg-emerald-500 text-white">P: Present</span>
              <span className="px-2 py-0.5 rounded bg-amber-500 text-white">HD: Half Day</span>
              <span className="px-2 py-0.5 rounded bg-cyan-600 text-white">L: Late</span>
              <span className="px-2 py-0.5 rounded bg-rose-500 text-white">A: Absent</span>
              <span className="px-2 py-0.5 rounded bg-purple-600 text-white">PL: Leave</span>
              <span className="px-2 py-0.5 rounded bg-slate-400 text-white">WO: Off</span>
            </div>
          </div>

          {/* Printable Header */}
          <div className="hidden print:block mb-6 text-center border-b pb-4">
            <h1 className="text-xl font-black uppercase tracking-wider text-slate-900">
              Tech Wash Laundry Services — Monthly Attendance Register
            </h1>
            <p className="text-xs text-slate-600 mt-1">
              Month: <strong>{monthlyMatrix.monthName}</strong> • Generated: {new Date().toLocaleDateString()}
            </p>
          </div>

          {/* 31-Day Attendance Heatmap Grid */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto max-w-full">
              <table className="w-full text-left border-collapse min-w-[1200px]">
                <thead>
                  <tr className="bg-slate-900 text-white text-[11px] font-bold uppercase tracking-wider">
                    <th className="p-3 sticky left-0 z-20 bg-slate-900 min-w-[200px] border-r border-slate-800">
                      Employee & Code
                    </th>
                    {monthlyMatrix.dayHeaders.map((d) => (
                      <th
                        key={d.day}
                        className={`p-2 text-center border-r border-slate-800 text-[10px] min-w-[32px] ${
                          d.isSunday ? 'bg-rose-950/60 text-rose-300' : ''
                        } ${d.isToday ? 'bg-emerald-950/80 text-emerald-300' : ''}`}
                      >
                        <div>{d.day}</div>
                        <div className="text-[8px] font-normal opacity-70">{d.dayOfWeek}</div>
                      </th>
                    ))}
                    <th className="p-3 text-center border-r border-slate-800 bg-emerald-950 text-emerald-300">P</th>
                    <th className="p-3 text-center border-r border-slate-800 bg-amber-950 text-amber-300">HD</th>
                    <th className="p-3 text-center border-r border-slate-800 bg-rose-950 text-rose-300">A</th>
                    <th className="p-3 text-center border-r border-slate-800 bg-purple-950 text-purple-300">PL</th>
                    <th className="p-3 text-center border-r border-slate-800 bg-blue-950 text-blue-300">OT</th>
                    <th className="p-3 text-center bg-slate-800 text-white font-black min-w-[100px]">Payable</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100 text-xs">
                  {monthlyMatrix.rows.map((row) => {
                    const emp = row.employee;
                    const sum = row.summary;

                    return (
                      <tr key={emp.id} className="hover:bg-slate-50/80 transition-colors">
                        {/* Sticky Employee Info */}
                        <td className="p-3 sticky left-0 z-10 bg-white border-r border-slate-200">
                          <div className="font-bold text-slate-900 text-xs truncate max-w-[190px]">
                            {emp.name}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1.5 mt-0.5">
                            <span>{emp.empCode}</span>
                            <span>•</span>
                            <span className="truncate">{emp.role}</span>
                          </div>
                        </td>

                        {/* 1..31 Days Heatmap Cells */}
                        {monthlyMatrix.dayHeaders.map((d) => {
                          const cell = row.dailyStatuses[d.day];
                          const config = cell?.config;
                          const code = config?.code || (cell?.status === 'WEEKLY_OFF' ? 'WO' : '–');
                          const cellBg = config?.cellBg || (cell?.status === 'WEEKLY_OFF' ? 'bg-slate-200 text-slate-600' : 'bg-slate-100 text-slate-400');

                          return (
                            <td
                              key={d.day}
                              onClick={() => {
                                setCellEditModal({
                                  employee: emp,
                                  day: d.day,
                                  dateKey: d.dateKey,
                                  status: cell?.status || 'PRESENT',
                                  checkInTime: cell?.checkIn || '',
                                  checkOutTime: cell?.checkOut || '',
                                  otHours: cell?.otHours || 0,
                                  notes: cell?.notes || ''
                                });
                              }}
                              className={`p-1 text-center border-r border-slate-100 cursor-pointer hover:scale-110 transition-transform ${
                                d.isSunday ? 'bg-rose-50/40' : ''
                              }`}
                              title={`${emp.name} — Day ${d.day} (${d.dateKey}): ${config?.label || cell?.status || 'Unmarked'}`}
                            >
                              <div className={`w-6 h-6 mx-auto rounded flex items-center justify-center text-[10px] font-black ${cellBg}`}>
                                {code}
                              </div>
                              {cell?.otHours > 0 && (
                                <div className="text-[8px] font-bold text-blue-600 mt-0.5 leading-none">
                                  +{cell.otHours}h
                                </div>
                              )}
                            </td>
                          );
                        })}

                        {/* Summary Columns */}
                        <td className="p-2 text-center font-bold text-emerald-700 bg-emerald-50/60 border-r border-slate-200">
                          {sum.present}
                        </td>
                        <td className="p-2 text-center font-bold text-amber-700 bg-amber-50/60 border-r border-slate-200">
                          {sum.halfDay}
                        </td>
                        <td className="p-2 text-center font-bold text-rose-700 bg-rose-50/60 border-r border-slate-200">
                          {sum.absent}
                        </td>
                        <td className="p-2 text-center font-bold text-purple-700 bg-purple-50/60 border-r border-slate-200">
                          {sum.paidLeave}
                        </td>
                        <td className="p-2 text-center font-bold text-blue-700 bg-blue-50/60 border-r border-slate-200">
                          {sum.totalOtHours}h
                        </td>
                        <td className="p-2 text-center font-black text-slate-900 bg-slate-100">
                          <div>{sum.effectivePayableDays} Days</div>
                          <div className="text-[10px] text-emerald-600 font-bold">{sum.attendancePercent}%</div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────
          TAB 3: 💰 WAGE & PAYROLL ESTIMATOR
      ───────────────────────────────────────────────────────── */}
      {activeTab === 'payroll' && payrollData && (
        <div className="space-y-6">
          
          {/* Executive Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Staff On Payroll</span>
              <div className="mt-2 text-3xl font-black text-slate-900 font-display">
                {payrollData.employeePayrolls.length} Active Staff
              </div>
              <span className="text-xs text-slate-500 mt-1">Period: {payrollData.monthName}</span>
            </div>

            <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Base Earned Wages</span>
              <div className="mt-2 text-3xl font-black text-slate-900 font-display">
                {formatCurrency(payrollData.totalPayrollGross)}
              </div>
              <span className="text-xs text-slate-500 mt-1">Payable days multiplier</span>
            </div>

            <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between">
              <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">Overtime Payout</span>
              <div className="mt-2 text-3xl font-black text-blue-600 font-display">
                {formatCurrency(payrollData.totalOtPayout)}
              </div>
              <span className="text-xs text-blue-500 mt-1">Extra shift compensation</span>
            </div>

            <div className="p-5 rounded-3xl bg-gradient-to-tr from-slate-900 to-indigo-950 text-white shadow-xl flex flex-col justify-between">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Total Net Payable</span>
              <div className="mt-2 text-3xl font-black text-emerald-400 font-display">
                {formatCurrency(payrollData.totalNetPayable)}
              </div>
              <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/10">
                <span className="text-[11px] text-slate-300">Ready for disbursement</span>
                <Button
                  variant="primary"
                  size="xs"
                  loading={isSyncingPayroll}
                  onClick={handleSyncPayrollToExpenses}
                  className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold"
                  title="Push this monthly payroll total into Expense Ledger"
                >
                  Sync to Expenses
                </Button>
              </div>
            </div>
          </div>

          {/* Itemized Payroll Breakdown Table */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 bg-slate-50 flex items-center justify-between text-xs font-bold text-slate-700">
              <span>Employee Salary & Overtime Calculation Sheet</span>
              <span>Month: {payrollData.monthName}</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider text-[10px]">
                    <th className="p-3">Employee</th>
                    <th className="p-3">Pay Type & Rate</th>
                    <th className="p-3 text-center">Payable / Total Days</th>
                    <th className="p-3 text-right">Base Earned</th>
                    <th className="p-3 text-center">OT Hours</th>
                    <th className="p-3 text-right">OT Pay</th>
                    <th className="p-3 text-right">Deductions</th>
                    <th className="p-3 text-right font-black text-slate-900">Net Payable</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {payrollData.employeePayrolls.map((p) => {
                    const emp = p.employee;
                    return (
                      <tr key={emp.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-3">
                          <div className="font-bold text-slate-900">{emp.name}</div>
                          <div className="text-[11px] text-slate-400 font-mono">{emp.empCode} • {emp.role}</div>
                        </td>
                        <td className="p-3">
                          <Badge variant="outline" size="sm">
                            {emp.salaryType === 'DAILY' ? 'Daily Wage' : 'Monthly Fixed'}
                          </Badge>
                          <div className="text-[11px] text-slate-500 font-bold mt-1">
                            {emp.salaryType === 'DAILY' ? `₹${p.dailyRate}/day` : `₹${p.baseSalary}/mo`}
                          </div>
                        </td>
                        <td className="p-3 text-center font-bold">
                          <span className="text-emerald-700 font-black">{p.payableDays}</span>
                          <span className="text-slate-400"> / {p.totalDays} Days</span>
                        </td>
                        <td className="p-3 text-right font-bold text-slate-800">
                          {formatCurrency(p.earnedBaseSalary)}
                        </td>
                        <td className="p-3 text-center font-bold text-blue-600">
                          {p.otHours > 0 ? `${p.otHours}h` : '–'}
                        </td>
                        <td className="p-3 text-right font-bold text-blue-600">
                          {p.earnedOtPay > 0 ? formatCurrency(p.earnedOtPay) : '–'}
                        </td>
                        <td className="p-3 text-right font-bold text-rose-600">
                          {p.absenceDeductions > 0 ? `-${formatCurrency(p.absenceDeductions)}` : '₹0'}
                        </td>
                        <td className="p-3 text-right font-black text-sm text-emerald-700">
                          {formatCurrency(p.netPayable)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────
          TAB 4: 👥 EMPLOYEE DIRECTORY CMS
      ───────────────────────────────────────────────────────── */}
      {activeTab === 'employees' && (
        <div className="space-y-6">
          
          {/* Search & Filter Bar */}
          <div className="p-4 sm:p-5 rounded-3xl bg-white border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search staff by name, code, phone, role..."
                className="w-full pl-9 pr-4 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <select
                value={branchFilter}
                onChange={(e) => setBranchFilter(e.target.value)}
                className="text-xs font-bold px-3 py-2 rounded-xl bg-slate-100 border border-slate-200 text-slate-800 focus:outline-none"
              >
                {BRANCH_LOCATIONS.map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>

              <Button
                variant="primary"
                size="sm"
                icon={Plus}
                onClick={handleOpenAddEmployee}
                className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20 text-xs font-bold"
              >
                + Add Employee
              </Button>
            </div>
          </div>

          {/* Employee Roster Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredDirectoryEmployees.map((emp) => (
              <div 
                key={emp.id}
                className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-2xl bg-gradient-to-tr ${emp.avatarColor || 'from-purple-600 to-indigo-600'} text-white font-black text-base flex items-center justify-center shadow-md shrink-0`}>
                        {(emp.name || 'E')[0].toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 text-sm">{emp.name}</h3>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 text-slate-600 border border-slate-200">
                            {emp.empCode}
                          </span>
                          <span className="text-xs text-slate-500 font-medium">{emp.phone}</span>
                        </div>
                      </div>
                    </div>

                    <Badge variant={emp.active !== false ? 'success' : 'neutral'} size="sm">
                      {emp.active !== false ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5 text-xs text-slate-600">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Designation</span>
                      <span className="font-bold text-slate-800">{emp.role}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Branch & Shift</span>
                      <span className="font-medium text-slate-800">{emp.branch} ({emp.shift})</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Base Compensation</span>
                      <span className="font-black text-emerald-700">
                        {emp.salaryType === 'DAILY' ? `₹${emp.dailyWage}/Day` : `₹${emp.baseSalary?.toLocaleString('en-IN')}/Mo`}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Action Buttons */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <Button
                    variant="outline"
                    size="xs"
                    icon={Eye}
                    onClick={() => setViewEmployee(emp)}
                    className="flex-1 text-slate-700"
                  >
                    View Dossier
                  </Button>

                  <Button
                    variant="outline"
                    size="xs"
                    icon={Edit3}
                    onClick={() => handleOpenEditEmployee(emp)}
                    className="text-slate-700"
                  >
                    Edit
                  </Button>

                  <button
                    type="button"
                    onClick={() => setDeleteTargetEmployee(emp)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                    title="Remove Employee"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

              </div>
            ))}
          </div>

        </div>
      )}

      {/* ─────────────────────────────────────────────────────────
          MODAL: ADD / EDIT EMPLOYEE
      ───────────────────────────────────────────────────────── */}
      {employeeModalOpen && (
        <Modal
          isOpen={employeeModalOpen}
          onClose={() => setEmployeeModalOpen(false)}
          title={currentEmployee.id ? `Edit Employee — ${currentEmployee.name}` : '➕ Add New Laundry Employee'}
          size="lg"
        >
          <form onSubmit={handleSaveEmployee} className="space-y-5">
            
            {/* 1. Basic Details */}
            <div className="space-y-3">
              <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider">1. Personal & Contact Info</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  label="Full Employee Name *"
                  value={currentEmployee.name}
                  onChange={(e) => setCurrentEmployee({ ...currentEmployee, name: e.target.value })}
                  placeholder="e.g. Rameshwar Sharma"
                  required
                />

                <Input
                  label="Phone Number *"
                  value={currentEmployee.phone}
                  onChange={(e) => setCurrentEmployee({ ...currentEmployee, phone: e.target.value })}
                  placeholder="+91 98765 43210"
                  required
                />

                <Input
                  label="Email Address"
                  type="email"
                  value={currentEmployee.email}
                  onChange={(e) => setCurrentEmployee({ ...currentEmployee, email: e.target.value })}
                  placeholder="ramesh@techwash.in"
                />

                <Input
                  label="Employee Code"
                  value={currentEmployee.empCode}
                  onChange={(e) => setCurrentEmployee({ ...currentEmployee, empCode: e.target.value })}
                  placeholder="TW-EMP-101"
                />
              </div>
            </div>

            {/* 2. Role & Location */}
            <div className="space-y-3 pt-3 border-t border-slate-100">
              <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider">2. Role, Branch & Shift</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Select
                  label="Designation / Role"
                  value={currentEmployee.role}
                  onChange={(e) => {
                    const r = EMPLOYEE_ROLES.find(item => item.name === e.target.value);
                    setCurrentEmployee({ 
                      ...currentEmployee, 
                      role: e.target.value,
                      department: r ? r.department : currentEmployee.department
                    });
                  }}
                  options={EMPLOYEE_ROLES.map(r => ({ value: r.name, label: r.name }))}
                />

                <Select
                  label="Branch / Work Location"
                  value={currentEmployee.branch}
                  onChange={(e) => setCurrentEmployee({ ...currentEmployee, branch: e.target.value })}
                  options={BRANCH_LOCATIONS.filter(b => b.id !== 'ALL').map(b => ({ value: b.id, label: b.name }))}
                />

                <Select
                  label="Shift Timings"
                  value={currentEmployee.shift}
                  onChange={(e) => setCurrentEmployee({ ...currentEmployee, shift: e.target.value })}
                  options={SHIFT_TIMINGS.map(s => ({ value: s.id, label: s.label }))}
                />
              </div>
            </div>

            {/* 3. Salary & Pay Structure */}
            <div className="space-y-3 pt-3 border-t border-slate-100">
              <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider">3. Salary & Compensation</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Select
                  label="Pay Structure"
                  value={currentEmployee.salaryType}
                  onChange={(e) => setCurrentEmployee({ ...currentEmployee, salaryType: e.target.value })}
                  options={[
                    { value: 'MONTHLY', label: 'Fixed Monthly Salary' },
                    { value: 'DAILY', label: 'Daily Wage' }
                  ]}
                />

                {currentEmployee.salaryType === 'MONTHLY' ? (
                  <Input
                    label="Base Monthly Salary (₹)"
                    type="number"
                    value={currentEmployee.baseSalary}
                    onChange={(e) => setCurrentEmployee({ ...currentEmployee, baseSalary: Number(e.target.value) })}
                    placeholder="18000"
                  />
                ) : (
                  <Input
                    label="Daily Wage Rate (₹/day)"
                    type="number"
                    value={currentEmployee.dailyWage}
                    onChange={(e) => setCurrentEmployee({ ...currentEmployee, dailyWage: Number(e.target.value) })}
                    placeholder="650"
                  />
                )}

                <Input
                  label="Overtime Rate (₹/hr)"
                  type="number"
                  value={currentEmployee.otHourlyRate}
                  onChange={(e) => setCurrentEmployee({ ...currentEmployee, otHourlyRate: Number(e.target.value) })}
                  placeholder="90"
                />
              </div>
            </div>

            {/* 4. KYC & Bank Details */}
            <div className="space-y-3 pt-3 border-t border-slate-100">
              <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider">4. KYC & Bank Account</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Input
                  label="Aadhaar / ID Proof"
                  value={currentEmployee.aadhaarNumber}
                  onChange={(e) => setCurrentEmployee({ ...currentEmployee, aadhaarNumber: e.target.value })}
                  placeholder="XXXX-XXXX-1234"
                />

                <Input
                  label="Emergency Contact Phone"
                  value={currentEmployee.emergencyContact}
                  onChange={(e) => setCurrentEmployee({ ...currentEmployee, emergencyContact: e.target.value })}
                  placeholder="+91 98765 00000 (Relation)"
                />

                <Input
                  label="Bank Account / UPI ID"
                  value={currentEmployee.bankDetails?.upiId || ''}
                  onChange={(e) => setCurrentEmployee({
                    ...currentEmployee,
                    bankDetails: { ...currentEmployee.bankDetails, upiId: e.target.value }
                  })}
                  placeholder="name@okhdfcbank"
                />
              </div>
            </div>

            {/* Modal Actions */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEmployeeModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
              >
                Save Employee Profile
              </Button>
            </div>

          </form>
        </Modal>
      )}

      {/* ─────────────────────────────────────────────────────────
          MODAL: VIEW FULL EMPLOYEE PROFILE DOSSIER
      ───────────────────────────────────────────────────────── */}
      {viewEmployee && (
        <Modal
          isOpen={Boolean(viewEmployee)}
          onClose={() => setViewEmployee(null)}
          title={`Employee Dossier — ${viewEmployee.name}`}
          size="md"
        >
          <div className="space-y-5">
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-tr ${viewEmployee.avatarColor || 'from-purple-600 to-indigo-600'} text-white font-black text-xl flex items-center justify-center shadow-lg`}>
                {(viewEmployee.name || 'E')[0].toUpperCase()}
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">{viewEmployee.name}</h3>
                <div className="text-xs text-slate-500 font-mono mt-0.5">{viewEmployee.empCode} • {viewEmployee.role}</div>
                <div className="text-xs text-emerald-700 font-bold mt-1">{viewEmployee.branch}</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-400 font-bold block text-[10px] uppercase">Contact Phone</span>
                <span className="font-bold text-slate-800 text-xs">{viewEmployee.phone}</span>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-400 font-bold block text-[10px] uppercase">Email</span>
                <span className="font-bold text-slate-800 text-xs">{viewEmployee.email || 'N/A'}</span>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-400 font-bold block text-[10px] uppercase">Joining Date</span>
                <span className="font-bold text-slate-800 text-xs">{viewEmployee.joiningDate || '2024-01-01'}</span>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-400 font-bold block text-[10px] uppercase">Compensation</span>
                <span className="font-black text-emerald-700 text-xs">
                  {viewEmployee.salaryType === 'DAILY' ? `₹${viewEmployee.dailyWage}/Day` : `₹${viewEmployee.baseSalary?.toLocaleString('en-IN')}/Mo`}
                </span>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-400 font-bold block text-[10px] uppercase">Aadhaar KYC</span>
                <span className="font-mono text-slate-800 text-xs">{viewEmployee.aadhaarNumber || 'Verified'}</span>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-400 font-bold block text-[10px] uppercase">Emergency Contact</span>
                <span className="font-bold text-slate-800 text-xs">{viewEmployee.emergencyContact || 'N/A'}</span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end">
              <Button
                variant="outline"
                onClick={() => setViewEmployee(null)}
              >
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* ─────────────────────────────────────────────────────────
          MODAL: 31-DAY MATRIX CELL QUICK EDIT
      ───────────────────────────────────────────────────────── */}
      {cellEditModal && (
        <Modal
          isOpen={Boolean(cellEditModal)}
          onClose={() => setCellEditModal(null)}
          title={`Edit Attendance — ${cellEditModal.employee?.name} (Day ${cellEditModal.day})`}
          size="sm"
        >
          <form onSubmit={handleSaveCellModal} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Attendance Status</label>
              <div className="grid grid-cols-2 gap-2">
                {Object.values(ATTENDANCE_STATUSES).map((st) => (
                  <button
                    key={st.key}
                    type="button"
                    onClick={() => setCellEditModal({ ...cellEditModal, status: st.key })}
                    className={`p-2 rounded-xl text-xs font-bold text-left transition-all border ${
                      cellEditModal.status === st.key
                        ? `${st.cellBg} border-transparent shadow-sm`
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {st.label} ({st.code})
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Check-In Time"
                type="time"
                value={cellEditModal.checkInTime || ''}
                onChange={(e) => setCellEditModal({ ...cellEditModal, checkInTime: e.target.value })}
              />

              <Input
                label="Check-Out Time"
                type="time"
                value={cellEditModal.checkOutTime || ''}
                onChange={(e) => setCellEditModal({ ...cellEditModal, checkOutTime: e.target.value })}
              />
            </div>

            <Input
              label="Overtime Hours (OT)"
              type="number"
              step="0.5"
              value={cellEditModal.otHours || 0}
              onChange={(e) => setCellEditModal({ ...cellEditModal, otHours: Number(e.target.value) })}
            />

            <Input
              label="Notes / Remarks"
              value={cellEditModal.notes || ''}
              onChange={(e) => setCellEditModal({ ...cellEditModal, notes: e.target.value })}
              placeholder="e.g. Extra festival shift"
            />

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setCellEditModal(null)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
              >
                Save Day Record
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* ─────────────────────────────────────────────────────────
          MODAL: RECORD / ADD ATTENDANCE ENTRY (SIMPLE & ADVANCED)
      ───────────────────────────────────────────────────────── */}
      {attendanceModalOpen && (
        <Modal
          isOpen={attendanceModalOpen}
          onClose={() => setAttendanceModalOpen(false)}
          title="Record Staff Attendance Entry"
          size="md"
        >
          <form onSubmit={handleSaveAttendanceForm} className="space-y-4 text-slate-800">
            {/* 1. Employee Selection */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Select Employee <span className="text-rose-500">*</span>
              </label>
              <select
                value={attendanceForm.employeeId}
                onChange={(e) => {
                  const empId = e.target.value;
                  const emp = employeesList.find(x => x.id === empId);
                  const shiftConfig = SHIFT_TIMINGS.find(s => s.id === (emp?.shift || 'GENERAL')) || SHIFT_TIMINGS[0];
                  setAttendanceForm(prev => ({
                    ...prev,
                    employeeId: empId,
                    branch: emp?.branch || prev.branch,
                    shift: emp?.shift || prev.shift,
                    checkInTime: shiftConfig.defaultIn,
                    checkOutTime: shiftConfig.defaultOut,
                    workingHours: shiftConfig.totalHours
                  }));
                }}
                className="w-full text-xs font-bold px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              >
                <option value="">-- Choose Staff Member --</option>
                {employeesList.map(emp => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name} ({emp.empCode}) — {emp.role} [{emp.branch}]
                  </option>
                ))}
              </select>
            </div>

            {/* Selected Employee Summary Card (if selected) */}
            {(() => {
              const selectedEmp = employeesList.find(x => x.id === attendanceForm.employeeId);
              if (!selectedEmp) return null;
              const wagePerDay = selectedEmp.salaryType === 'DAILY' ? selectedEmp.dailyWage : Math.round((selectedEmp.baseSalary || 18000) / 26);
              const otPay = Math.round((Number(attendanceForm.otHours) || 0) * (selectedEmp.otHourlyRate || 90));
              const isPresent = attendanceForm.status === 'PRESENT' || attendanceForm.status === 'LATE';
              const isHalf = attendanceForm.status === 'HALF_DAY';
              const dayEarnings = (isPresent ? wagePerDay : (isHalf ? Math.round(wagePerDay / 2) : (attendanceForm.status === 'PAID_LEAVE' ? wagePerDay : 0))) + otPay;

              return (
                <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-2xl flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-8 h-8 rounded-xl bg-gradient-to-tr ${selectedEmp.avatarColor || 'from-emerald-600 to-teal-600'} text-white font-bold flex items-center justify-center text-xs shadow-xs`}>
                      {selectedEmp.name[0]}
                    </div>
                    <div>
                      <span className="font-bold text-emerald-950 block">{selectedEmp.name}</span>
                      <span className="text-[10px] text-emerald-700 font-mono">{selectedEmp.empCode} • {selectedEmp.role}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-emerald-600 block font-bold uppercase">Estimated Day Pay</span>
                    <span className="font-black text-emerald-900 text-sm">₹{dayEarnings}</span>
                  </div>
                </div>
              );
            })()}

            {/* 2. Date Selection with Quick Shortcuts */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-700">Attendance Date</label>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setAttendanceForm(prev => ({ ...prev, date: new Date().toISOString().split('T')[0] }))}
                    className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700"
                  >
                    Today
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const y = new Date();
                      y.setDate(y.getDate() - 1);
                      setAttendanceForm(prev => ({ ...prev, date: y.toISOString().split('T')[0] }));
                    }}
                    className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700"
                  >
                    Yesterday
                  </button>
                </div>
              </div>
              <input
                type="date"
                value={attendanceForm.date}
                onChange={(e) => setAttendanceForm(prev => ({ ...prev, date: e.target.value }))}
                className="w-full text-xs font-bold px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800"
                required
              />
            </div>

            {/* 3. Status Selection Grid */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Status</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {Object.values(ATTENDANCE_STATUSES).map((st) => {
                  const isSel = attendanceForm.status === st.key;
                  return (
                    <button
                      key={st.key}
                      type="button"
                      onClick={() => {
                        const isPres = st.key === 'PRESENT' || st.key === 'LATE';
                        const isHalf = st.key === 'HALF_DAY';
                        const curShift = SHIFT_TIMINGS.find(s => s.id === attendanceForm.shift) || SHIFT_TIMINGS[0];
                        setAttendanceForm(prev => ({
                          ...prev,
                          status: st.key,
                          checkInTime: isPres ? (prev.checkInTime || curShift.defaultIn) : (isHalf ? curShift.defaultIn : ''),
                          checkOutTime: isPres ? (prev.checkOutTime || curShift.defaultOut) : (isHalf ? '13:00' : ''),
                          workingHours: isPres ? curShift.totalHours : (isHalf ? 4 : 0),
                        }));
                      }}
                      className={`p-2 rounded-xl text-xs font-bold flex items-center gap-2 border transition-all text-left ${
                        isSel
                          ? `${st.cellBg} border-transparent shadow-sm scale-102`
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <span className={`w-2 h-2 rounded-full shrink-0 ${isSel ? 'bg-white' : st.dotColor}`} />
                      <span className="truncate">{st.label} ({st.code})</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 4. Shift & Timings */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Shift</label>
                <select
                  value={attendanceForm.shift}
                  onChange={(e) => {
                    const sId = e.target.value;
                    const shiftConfig = SHIFT_TIMINGS.find(s => s.id === sId) || SHIFT_TIMINGS[0];
                    setAttendanceForm(prev => ({
                      ...prev,
                      shift: sId,
                      checkInTime: shiftConfig.defaultIn,
                      checkOutTime: shiftConfig.defaultOut,
                      workingHours: shiftConfig.totalHours
                    }));
                  }}
                  className="w-full text-xs font-bold px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl"
                >
                  {SHIFT_TIMINGS.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.window})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Check-In</label>
                <input
                  type="time"
                  value={attendanceForm.checkInTime || ''}
                  onChange={(e) => setAttendanceForm(prev => ({ ...prev, checkInTime: e.target.value }))}
                  className="w-full text-xs font-bold px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Check-Out</label>
                <input
                  type="time"
                  value={attendanceForm.checkOutTime || ''}
                  onChange={(e) => setAttendanceForm(prev => ({ ...prev, checkOutTime: e.target.value }))}
                  className="w-full text-xs font-bold px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>
            </div>

            {/* 5. Overtime Hours Stepper */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-bold text-slate-600">Overtime Hours (OT)</label>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setAttendanceForm(prev => ({ ...prev, otHours: 0 }))}
                    className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 hover:bg-slate-200"
                  >
                    0h
                  </button>
                  <button
                    type="button"
                    onClick={() => setAttendanceForm(prev => ({ ...prev, otHours: Number((Number(prev.otHours || 0) + 0.5).toFixed(1)) }))}
                    className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 hover:bg-blue-100"
                  >
                    +0.5h
                  </button>
                  <button
                    type="button"
                    onClick={() => setAttendanceForm(prev => ({ ...prev, otHours: Number((Number(prev.otHours || 0) + 1.0).toFixed(1)) }))}
                    className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 hover:bg-blue-100"
                  >
                    +1.0h
                  </button>
                  <button
                    type="button"
                    onClick={() => setAttendanceForm(prev => ({ ...prev, otHours: Number((Number(prev.otHours || 0) + 2.0).toFixed(1)) }))}
                    className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 hover:bg-blue-100"
                  >
                    +2.0h
                  </button>
                </div>
              </div>

              <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl overflow-hidden">
                <button
                  type="button"
                  onClick={() => setAttendanceForm(prev => ({ ...prev, otHours: Math.max(0, Number((Number(prev.otHours || 0) - 0.5).toFixed(1))) }))}
                  className="px-3 py-2 text-slate-600 hover:bg-slate-200 text-xs font-bold"
                >
                  -
                </button>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  max="12"
                  value={attendanceForm.otHours}
                  onChange={(e) => setAttendanceForm(prev => ({ ...prev, otHours: Math.max(0, Number(e.target.value)) }))}
                  className="w-full text-center text-xs font-black bg-transparent border-none focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setAttendanceForm(prev => ({ ...prev, otHours: Number((Number(prev.otHours || 0) + 0.5).toFixed(1)) }))}
                  className="px-3 py-2 text-slate-600 hover:bg-slate-200 text-xs font-bold"
                >
                  +
                </button>
              </div>
            </div>

            {/* 6. Notes / Reason */}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Remarks / Permission Note</label>
              <input
                type="text"
                value={attendanceForm.notes}
                onChange={(e) => setAttendanceForm(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="e.g. Doctor appointment, arrived 15 mins late with prior notice"
                className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>

            {/* Modal Actions */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
              <Button
                type="button"
                variant="outline"
                onClick={() => setAttendanceModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
              >
                Save Attendance Record
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* ─────────────────────────────────────────────────────────
          CONFIRM DELETE EMPLOYEE DIALOG
      ───────────────────────────────────────────────────────── */}
      {deleteTargetEmployee && (
        <ConfirmDialog
          isOpen={Boolean(deleteTargetEmployee)}
          title={`Remove ${deleteTargetEmployee.name}?`}
          message={`Are you sure you want to remove ${deleteTargetEmployee.name} (${deleteTargetEmployee.empCode}) from the employee directory?`}
          confirmLabel="Yes, Remove"
          cancelLabel="Cancel"
          variant="danger"
          onConfirm={handleDeleteEmployee}
          onCancel={() => setDeleteTargetEmployee(null)}
        />
      )}

    </div>
  );
};

export default AdminAttendancePage;

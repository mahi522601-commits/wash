import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  expenseService, 
  DEFAULT_EXPENSE_CONFIG,
  DEFAULT_BUDGET_CONFIG
} from '../../services/expenseService';
import { formatCurrency } from '../../utils/formatters';
import { useToast } from '../../context/ToastContext';
import { AdminPageHeader } from '../../components/admin/AdminPageHeader';
import { Button } from '../../components/ui/Button';
import { Input, Select } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { Tabs } from '../../components/ui/Tabs';
import { Badge } from '../../components/ui/Badge';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { PnLReportModal } from '../../components/expenses/PnLReportModal';
import { 
  Wallet, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Plus, 
  Trash2, 
  Edit3, 
  Printer, 
  Download, 
  Calendar, 
  Sliders, 
  CheckCircle2, 
  AlertCircle, 
  Layers, 
  BarChart3, 
  Zap, 
  Droplet, 
  Flame, 
  Truck, 
  Package, 
  Users, 
  Wrench, 
  Search, 
  RotateCcw,
  Sparkles,
  ChevronRight,
  PieChart as PieChartIcon,
  ArrowUpRight,
  ArrowDownRight,
  Building,
  Award,
  FileText,
  Send,
  RefreshCw,
  Clock,
  Check,
  ShieldCheck,
  Percent,
  Receipt,
  AlertTriangle,
  Lightbulb,
  CheckCircle
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';

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

const BRANCH_OPTIONS = [
  { value: 'ALL', label: 'All 3 Branches & Counters (Consolidated)' },
  { value: 'counter-1', label: 'Counter 1 — Main Branch (Shaikpet / Manikonda)' },
  { value: 'counter-2', label: 'Counter 2 — Branch 1 (Tolichowki / OU Colony)' },
  { value: 'counter-3', label: 'Counter 3 — Pick Up Point (Ambience Courtyard)' },
];

const PAYMENT_MODES = [
  { value: 'CASH', label: '💵 Cash' },
  { value: 'UPI_ONLINE', label: '📱 UPI / QR Transfer' },
  { value: 'BANK_TRANSFER', label: '🏦 Bank Transfer / NEFT' },
  { value: 'CARD', label: '💳 Credit / Debit Card' },
  { value: 'CHEQUE', label: '📄 Cheque' },
];

const GST_RATES = [
  { value: 0, label: '0% (Exempted / Unregistered)' },
  { value: 5, label: '5% (LPG / Essential Utilities)' },
  { value: 12, label: '12% (Standard Supplies)' },
  { value: 18, label: '18% (Commercial Rent / Chemicals / AMC / Telecom)' },
  { value: 28, label: '28% (Luxury / High Tax Goods)' },
];

const CHART_COLORS = [
  '#f97316', '#06b6d4', '#10b981', '#8b5cf6', '#ec4899', 
  '#eab308', '#3b82f6', '#14b8a6', '#6366f1', '#f43f5e',
  '#84cc16', '#a855f7'
];

export const AdminExpensesPage = () => {
  const { success, error, info } = useToast();

  const currentDate = new Date();
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth());
  const [selectedBranch, setSelectedBranch] = useState('ALL');
  const [activeTab, setActiveTab] = useState('pnl'); // 'pnl' | 'analytics' | 'budgets' | 'recurring' | 'ledger' | 'categories'

  // Financial Datasets
  const [pnlData, setPnlData] = useState(null);
  const [comparativePnL, setComparativePnL] = useState(null);
  const [yearlyTrends, setYearlyTrends] = useState(null);
  const [config, setConfig] = useState(DEFAULT_EXPENSE_CONFIG);
  const [expenses, setExpenses] = useState([]);
  const [budgetVsActual, setBudgetVsActual] = useState(null);
  const [budgetConfig, setBudgetConfig] = useState(DEFAULT_BUDGET_CONFIG);
  const [recurringRules, setRecurringRules] = useState([]);
  const [gstSummary, setGstSummary] = useState(null);
  const [aiInsights, setAiInsights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isGeneratingRecurring, setIsGeneratingRecurring] = useState(false);

  // Search & Filters for Ledger
  const [ledgerSearch, setLedgerSearch] = useState('');
  const [ledgerCategoryFilter, setLedgerCategoryFilter] = useState('ALL');
  const [ledgerBranchFilter, setLedgerBranchFilter] = useState('ALL');
  const [ledgerPaymentFilter, setLedgerPaymentFilter] = useState('ALL');
  const [ledgerGstFilter, setLedgerGstFilter] = useState('ALL'); // 'ALL' | 'CLAIMABLE' | 'NON_CLAIMABLE'

  // Modals
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [recurringModalOpen, setRecurringModalOpen] = useState(false);
  const [editingRecurringRule, setEditingRecurringRule] = useState(null);
  const [budgetModalOpen, setBudgetModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteTargetType, setDeleteTargetType] = useState('expense'); // 'expense' | 'category' | 'recurring'

  // Form State: Expense
  const [expenseForm, setExpenseForm] = useState({
    date: new Date().toISOString().split('T')[0],
    categoryId: 'electricity',
    title: '',
    unitsCount: 1,
    unitRate: 8.50,
    amount: 8.50,
    unitType: 'kWh',
    branchId: 'counter-1',
    paymentMode: 'CASH',
    paymentReference: '',
    vendorName: '',
    vendorGstin: '',
    invoiceNumber: '',
    gstRate: 0,
    gstAmount: 0,
    isGstClaimable: false,
    notes: '',
  });

  // Form State: Custom Category
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    icon: '💸',
    unitType: 'monthly',
    formulaLabel: 'Monthly cost',
    defaultRate: 1000,
    categoryGroup: 'General Overhead',
    description: '',
  });

  // Form State: Recurring Rule
  const [recurringForm, setRecurringForm] = useState({
    title: '',
    categoryId: 'store_rent',
    amount: 25000,
    unitRate: 25000,
    unitsCount: 1,
    unitType: 'monthly',
    branchId: 'counter-1',
    vendorName: '',
    vendorGstin: '',
    frequency: 'MONTHLY',
    dayOfMonth: 5,
    paymentMode: 'BANK_TRANSFER',
    paymentReference: '',
    gstRate: 18,
    isGstClaimable: true,
    notes: '',
    isActive: true,
  });

  // Form State: Budgets Form (Editable per category)
  const [budgetsForm, setBudgetsForm] = useState({});

  // ─────────────────────────────────────────────────────────────
  // LOAD ALL FINANCIAL DATA
  // ─────────────────────────────────────────────────────────────
  const loadAllData = useCallback(async () => {
    setLoading(true);
    try {
      const [cfg, pnl, yearly, allExp, compPnL, bVsA, bCfg, recRules, gstSum] = await Promise.all([
        expenseService.getExpenseConfig(),
        expenseService.getMonthlyPnL({
          year: selectedYear,
          month: selectedMonth,
          branchFilter: selectedBranch,
        }),
        expenseService.getYearlyPnLSummary(selectedYear, selectedBranch),
        expenseService.getExpenses({
          year: selectedYear,
          month: selectedMonth,
          branchFilter: selectedBranch,
        }),
        expenseService.getThreeBranchesComparativePnL({
          year: selectedYear,
          month: selectedMonth,
        }),
        expenseService.getBudgetVsActualComparison({
          year: selectedYear,
          month: selectedMonth,
          branchFilter: selectedBranch,
        }),
        expenseService.getBudgetConfig(),
        expenseService.getRecurringExpenseRules(),
        expenseService.getGstItcSummary({
          year: selectedYear,
          month: selectedMonth,
          branchFilter: selectedBranch,
        }),
      ]);

      setConfig(cfg);
      setPnlData(pnl);
      setYearlyTrends(yearly);
      setExpenses(allExp);
      setComparativePnL(compPnL);
      setBudgetVsActual(bVsA);
      setBudgetConfig(bCfg);
      setBudgetsForm(bCfg.monthlyBudgets || DEFAULT_BUDGET_CONFIG.monthlyBudgets);
      setRecurringRules(recRules);
      setGstSummary(gstSum);

      const insights = expenseService.generateCostOptimizationInsights(pnl, bVsA, yearly);
      setAiInsights(insights);
    } catch (err) {
      console.error('Failed to load expense and P&L data:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedYear, selectedMonth, selectedBranch]);

  useEffect(() => {
    loadAllData();

    const handleUpdate = () => {
      loadAllData();
    };

    window.addEventListener('techwash-expenses-updated', handleUpdate);
    window.addEventListener('techwash-expense-config-updated', handleUpdate);
    window.addEventListener('techwash-expense-budgets-updated', handleUpdate);
    window.addEventListener('techwash-recurring-rules-updated', handleUpdate);
    window.addEventListener('techwash-new-order-placed', handleUpdate);

    return () => {
      window.removeEventListener('techwash-expenses-updated', handleUpdate);
      window.removeEventListener('techwash-expense-config-updated', handleUpdate);
      window.removeEventListener('techwash-expense-budgets-updated', handleUpdate);
      window.removeEventListener('techwash-recurring-rules-updated', handleUpdate);
      window.removeEventListener('techwash-new-order-placed', handleUpdate);
    };
  }, [loadAllData]);

  // Combined all categories (Built-in + Custom)
  const allCategories = useMemo(() => {
    return [
      ...(config.builtInCategories || DEFAULT_EXPENSE_CONFIG.builtInCategories),
      ...(config.customCategories || DEFAULT_EXPENSE_CONFIG.customCategories),
    ];
  }, [config]);

  // When changing category in expense form, auto-fill unit rate and formula
  const handleCategorySelectInForm = (catId) => {
    const selected = allCategories.find(c => c.id === catId);
    if (!selected) return;

    const rate = Number(selected.defaultRate) || 0;
    const count = Number(expenseForm.unitsCount) || 1;
    const calcAmount = Math.round(count * rate * 100) / 100;
    const gstR = Number(expenseForm.gstRate) || 0;
    const gstAmt = gstR > 0 ? Math.round((calcAmount * gstR / (100 + gstR)) * 100) / 100 : 0;

    setExpenseForm(prev => ({
      ...prev,
      categoryId: selected.id,
      categoryName: selected.name,
      icon: selected.icon,
      categoryGroup: selected.categoryGroup,
      unitType: selected.unitType,
      unitRate: rate,
      amount: calcAmount,
      gstAmount: gstAmt,
      title: prev.title || `${selected.name} (${selected.formulaLabel})`,
    }));
  };

  // Recalculate amount when units or rate changes
  const handleUnitsOrRateChange = (units, rate, gstRateOverride = null) => {
    const u = Math.max(0, Number(units) || 0);
    const r = Math.max(0, Number(rate) || 0);
    const amt = Math.round(u * r * 100) / 100;
    const gRate = gstRateOverride !== null ? Number(gstRateOverride) : Number(expenseForm.gstRate || 0);
    const gAmt = gRate > 0 ? Math.round((amt * gRate / (100 + gRate)) * 100) / 100 : 0;

    setExpenseForm(prev => ({
      ...prev,
      unitsCount: u,
      unitRate: r,
      amount: amt,
      gstRate: gRate,
      gstAmount: gAmt,
    }));
  };

  // Open Log Expense Modal
  const handleOpenAddExpense = (presetCatId = null) => {
    const targetCatId = presetCatId || 'electricity';
    const cat = allCategories.find(c => c.id === targetCatId) || allCategories[0];
    const rate = Number(cat?.defaultRate) || 0;

    setEditingExpense(null);
    setExpenseForm({
      date: new Date().toISOString().split('T')[0],
      categoryId: cat.id,
      categoryName: cat.name,
      icon: cat.icon,
      categoryGroup: cat.categoryGroup,
      title: `${cat.name} Payment`,
      unitsCount: 1,
      unitRate: rate,
      amount: rate,
      unitType: cat.unitType,
      branchId: selectedBranch !== 'ALL' ? selectedBranch : 'counter-1',
      paymentMode: 'CASH',
      paymentReference: '',
      vendorName: '',
      vendorGstin: '',
      invoiceNumber: '',
      gstRate: 0,
      gstAmount: 0,
      isGstClaimable: false,
      notes: '',
    });
    setExpenseModalOpen(true);
  };

  // Open Edit Expense Modal
  const handleOpenEditExpense = (exp) => {
    setEditingExpense(exp);
    setExpenseForm({
      date: exp.date || new Date().toISOString().split('T')[0],
      categoryId: exp.categoryId,
      categoryName: exp.categoryName,
      icon: exp.icon,
      categoryGroup: exp.categoryGroup,
      title: exp.title,
      unitsCount: exp.unitsCount || 1,
      unitRate: exp.unitRate || exp.amount,
      amount: exp.amount,
      unitType: exp.unitType || 'unit',
      branchId: exp.branchId || 'counter-1',
      paymentMode: exp.paymentMode || 'CASH',
      paymentReference: exp.paymentReference || '',
      vendorName: exp.vendorName || '',
      vendorGstin: exp.vendorGstin || '',
      invoiceNumber: exp.invoiceNumber || '',
      gstRate: exp.gstRate || 0,
      gstAmount: exp.gstAmount || 0,
      isGstClaimable: Boolean(exp.isGstClaimable),
      notes: exp.notes || '',
    });
    setExpenseModalOpen(true);
  };

  // Save Expense (Create or Update)
  const handleSaveExpense = async (e) => {
    e.preventDefault();
    if (!expenseForm.title.trim()) {
      error('Title Required', 'Please enter a description for this expense.');
      return;
    }
    if (Number(expenseForm.amount) <= 0) {
      error('Amount Required', 'Expense amount must be greater than zero.');
      return;
    }

    try {
      const branchDef = BRANCH_OPTIONS.find(b => b.value === expenseForm.branchId) || BRANCH_OPTIONS[1];
      const catDef = allCategories.find(c => c.id === expenseForm.categoryId) || allCategories[0];

      const payload = {
        ...expenseForm,
        categoryName: catDef.name,
        icon: catDef.icon,
        categoryGroup: catDef.categoryGroup,
        branchName: branchDef.label.split(' — ')[0],
        calculationText: `${expenseForm.unitsCount} ${expenseForm.unitType} × ₹${expenseForm.unitRate}`,
      };

      if (editingExpense) {
        await expenseService.updateExpense(editingExpense.id, payload);
        success('Expense Updated', `Updated "${payload.title}" (₹${payload.amount})`);
      } else {
        await expenseService.addExpense(payload);
        success('Expense Logged', `Logged ₹${payload.amount} for ${payload.categoryName}`);
      }

      setExpenseModalOpen(false);
      loadAllData();
    } catch (err) {
      error('Save Failed', 'Could not save expense entry.');
    }
  };

  // 1-Click Auto-Populate Monthly Recurring Expenses
  const handleAutoPopulateRecurring = async () => {
    setIsGeneratingRecurring(true);
    try {
      const res = await expenseService.autoGenerateMonthlyRecurringExpenses({
        year: selectedYear,
        month: selectedMonth,
        branchFilter: selectedBranch,
      });

      if (res.generatedCount > 0) {
        success('Overheads Populated', `Successfully auto-populated ${res.generatedCount} monthly fixed recurring expenses! (${res.skippedCount} already existed).`);
      } else {
        info('Already Up to Date', `All ${res.skippedCount} monthly recurring overheads are already present in this month's ledger.`);
      }
      loadAllData();
    } catch (err) {
      error('Error', 'Failed to generate recurring expenses.');
    } finally {
      setIsGeneratingRecurring(false);
    }
  };

  // Save Recurring Expense Rule
  const handleSaveRecurringRule = async (e) => {
    e.preventDefault();
    if (!recurringForm.title.trim()) {
      error('Title Required', 'Please enter a title for the recurring rule.');
      return;
    }
    if (Number(recurringForm.amount) <= 0) {
      error('Amount Required', 'Amount must be greater than zero.');
      return;
    }

    try {
      const catDef = allCategories.find(c => c.id === recurringForm.categoryId) || allCategories[0];
      const branchDef = BRANCH_OPTIONS.find(b => b.value === recurringForm.branchId) || BRANCH_OPTIONS[1];

      const payload = {
        ...recurringForm,
        categoryName: catDef.name,
        icon: catDef.icon,
        categoryGroup: catDef.categoryGroup,
        branchName: branchDef.label.split(' — ')[0],
      };

      if (editingRecurringRule) {
        payload.id = editingRecurringRule.id;
      }

      await expenseService.saveRecurringExpenseRule(payload);
      success('Rule Saved', `Saved recurring rule "${payload.title}"`);
      setRecurringModalOpen(false);
      loadAllData();
    } catch (err) {
      error('Save Failed', 'Could not save recurring rule.');
    }
  };

  // Save Category
  const handleSaveCategory = async (e) => {
    e.preventDefault();
    if (!categoryForm.name.trim()) {
      error('Name Required', 'Please enter a category name.');
      return;
    }

    try {
      if (editingCategory) {
        await expenseService.updateCategory(editingCategory.id, categoryForm);
        success('Category Updated', `Updated "${categoryForm.name}"`);
      } else {
        await expenseService.addCustomCategory(categoryForm);
        success('Category Added', `Added new category "${categoryForm.name}"`);
      }
      setCategoryModalOpen(false);
      loadAllData();
    } catch (err) {
      error('Error', 'Failed to save expense category.');
    }
  };

  // Save Budgets
  const handleSaveBudgets = async (e) => {
    e.preventDefault();
    try {
      await expenseService.saveBudgetConfig({
        ...budgetConfig,
        monthlyBudgets: budgetsForm,
      });
      success('Budgets Saved', 'Monthly budget limits updated successfully.');
      setBudgetModalOpen(false);
      loadAllData();
    } catch (err) {
      error('Save Failed', 'Could not update budget limits.');
    }
  };

  // Delete Action Confirmation
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;

    try {
      if (deleteTargetType === 'expense') {
        await expenseService.deleteExpense(deleteTarget.id);
        success('Expense Deleted', `Removed expense entry.`);
      } else if (deleteTargetType === 'category') {
        await expenseService.deleteCustomCategory(deleteTarget.id);
        success('Category Deleted', `Removed custom category "${deleteTarget.name}".`);
      } else if (deleteTargetType === 'recurring') {
        await expenseService.deleteRecurringExpenseRule(deleteTarget.id);
        success('Rule Deleted', `Removed recurring overhead rule.`);
      }
      setDeleteTarget(null);
      loadAllData();
    } catch (err) {
      error('Delete Failed', 'Could not delete item.');
    }
  };

  // Filtered Ledger List
  const filteredLedger = useMemo(() => {
    let list = expenses;
    if (ledgerCategoryFilter !== 'ALL') {
      list = list.filter(e => e.categoryId === ledgerCategoryFilter);
    }
    if (ledgerBranchFilter !== 'ALL') {
      list = list.filter(e => e.branchId === ledgerBranchFilter || e.branchId === 'ALL');
    }
    if (ledgerPaymentFilter !== 'ALL') {
      list = list.filter(e => e.paymentMode === ledgerPaymentFilter);
    }
    if (ledgerGstFilter === 'CLAIMABLE') {
      list = list.filter(e => e.isGstClaimable && Number(e.gstAmount) > 0);
    } else if (ledgerGstFilter === 'NON_CLAIMABLE') {
      list = list.filter(e => !e.isGstClaimable || !e.gstAmount);
    }

    if (ledgerSearch.trim()) {
      const q = ledgerSearch.toLowerCase();
      list = list.filter(e => 
        (e.title && e.title.toLowerCase().includes(q)) ||
        (e.categoryName && e.categoryName.toLowerCase().includes(q)) ||
        (e.notes && e.notes.toLowerCase().includes(q)) ||
        (e.paymentReference && e.paymentReference.toLowerCase().includes(q)) ||
        (e.vendorName && e.vendorName.toLowerCase().includes(q)) ||
        (e.vendorGstin && e.vendorGstin.toLowerCase().includes(q)) ||
        (e.invoiceNumber && e.invoiceNumber.toLowerCase().includes(q))
      );
    }
    return list;
  }, [expenses, ledgerCategoryFilter, ledgerBranchFilter, ledgerPaymentFilter, ledgerGstFilter, ledgerSearch]);

  // 1-Click Download CSV
  const handleDownloadCSV = () => {
    if (!pnlData) return;

    const headers = ['Category', 'Category Group', 'Formula / Units', 'Total Amount (Rs)', '% of Expenses', '% of Revenue'];
    const rows = (pnlData.categoryBreakdown || []).map(c => [
      `"${c.categoryName}"`,
      `"${c.categoryGroup}"`,
      `"${c.entriesCount} entries"`,
      c.totalAmount,
      `"${c.percentageOfExpenses}%"`,
      `"${c.percentageOfRevenue}%"`
    ]);

    rows.push([]);
    rows.push(['"--- FINANCIAL SUMMARY ---"', '""', '""', '""', '""', '""']);
    rows.push(['"Gross Revenue"', '""', '""', pnlData.grossRevenue, '""', '100%']);
    rows.push(['"Total Operating Expenses"', '""', '""', pnlData.totalOperatingExpenses, '100%', `"${pnlData.grossRevenue > 0 ? ((pnlData.totalOperatingExpenses/pnlData.grossRevenue)*100).toFixed(1) : 0}%"`]);
    rows.push(['"Net Operating Profit"', '""', '""', pnlData.netOperatingProfit, '""', `"${pnlData.profitMarginPercentage}%"`]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `TechWash_PnL_${pnlData.monthLabel.replace(' ', '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    success('CSV Exported', `Downloaded P&L statement for ${pnlData.monthLabel}`);
  };

  // Pie chart data for expense distribution
  const pieChartData = useMemo(() => {
    if (!pnlData?.categoryBreakdown) return [];
    return pnlData.categoryBreakdown.map((cat, idx) => ({
      name: cat.categoryName,
      value: cat.totalAmount,
      color: CHART_COLORS[idx % CHART_COLORS.length],
      percent: cat.percentageOfExpenses,
    }));
  }, [pnlData]);

  // 3-Branch Bar chart data
  const branchComparisonChartData = useMemo(() => {
    if (!comparativePnL?.branches) return [];
    return comparativePnL.branches.map(b => ({
      name: b.shortName.split(' (')[0],
      code: b.code,
      Revenue: b.pnl.grossRevenue,
      Expenses: b.pnl.totalOperatingExpenses,
      Profit: b.pnl.netOperatingProfit,
      Margin: b.pnl.profitMarginPercentage,
    }));
  }, [comparativePnL]);

  return (
    <div className="space-y-6 pb-24">
      
      {/* ── HEADER & TIME-PERIOD CONTROLS ── */}
      <AdminPageHeader
        title="Enterprise Expenses & Profit/Loss (P&L) Suite"
        description="Comprehensive 3-Branch financial matrix, 11 laundry operational cost formulas, automated recurring overheads, budget tracking & GST ITC ledger."
        breadcrumbs={[
          { label: 'Admin', path: '/admin' },
          { label: 'Expenses & P&L', path: '/admin/expenses' }
        ]}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {/* Year Selector */}
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-bold text-white outline-none cursor-pointer hover:border-slate-700"
            >
              {YEARS.map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>

            {/* Month Selector */}
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-bold text-white outline-none cursor-pointer hover:border-slate-700"
            >
              {MONTHS.map(m => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>

            {/* Branch Filter */}
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-bold text-orange-400 outline-none cursor-pointer max-w-[210px] truncate"
            >
              {BRANCH_OPTIONS.map(b => (
                <option key={b.value} value={b.value}>{b.label}</option>
              ))}
            </select>

            <Button
              variant="outline"
              size="md"
              icon={Printer}
              onClick={() => setIsPrintModalOpen(true)}
              className="text-white border-white/20 hover:bg-white/10"
            >
              Print P&L (PDF)
            </Button>

            <Button
              variant="primary"
              size="md"
              icon={Plus}
              onClick={() => handleOpenAddExpense()}
              className="bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 shadow-md shadow-orange-500/20"
            >
              Log Expense
            </Button>
          </div>
        }
      />

      {/* ── 6 SPECIALIZED TABS ── */}
      <Tabs
        tabs={[
          { id: 'pnl', label: '📊 Executive P&L Matrix', icon: BarChart3 },
          { id: 'analytics', label: '📈 Analytics & Charts', icon: TrendingUp },
          { id: 'budgets', label: `🎯 Budget Radar (${budgetVsActual?.overrunCount || 0} Overruns)`, icon: ShieldCheck },
          { id: 'recurring', label: `🔁 Recurring Overheads (${recurringRules.length})`, icon: RotateCcw },
          { id: 'ledger', label: `📝 Expense & GST Vault (${expenses.length})`, icon: Wallet },
          { id: 'categories', label: `⚙️ 11 Cost Drivers CMS (${allCategories.length})`, icon: Sliders },
        ]}
        activeTab={activeTab}
        onChange={setActiveTab}
      />

      {/* ========================================================================= */}
      {/* TAB 1: EXECUTIVE P&L & 3-BRANCH COMPARATIVE MATRIX                        */}
      {/* ========================================================================= */}
      {activeTab === 'pnl' && (
        <div className="space-y-6">
          
          {/* Executive KPI Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Card 1: Gross Revenue */}
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Gross Revenue
                </span>
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5" />
                </div>
              </div>
              <div>
                <div className="text-2xl sm:text-3xl font-black font-display text-slate-900">
                  {formatCurrency(pnlData?.grossRevenue || 0)}
                </div>
                <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-500">
                  <span className="font-bold text-slate-700">{pnlData?.totalOrdersCount || 0}</span> orders • <span className="font-bold text-slate-700">{pnlData?.totalProcessedKg || 0} kg</span>
                </div>
              </div>
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                <span>Received: <strong className="text-emerald-700">{formatCurrency(pnlData?.totalReceivedRevenue || 0)}</strong></span>
                <span>Due: <strong className="text-rose-600">{formatCurrency(pnlData?.totalBalanceDue || 0)}</strong></span>
              </div>
            </div>

            {/* Card 2: Total Operating Expenses */}
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Total Expenses
                </span>
                <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                  <TrendingDown className="w-5 h-5" />
                </div>
              </div>
              <div>
                <div className="text-2xl sm:text-3xl font-black font-display text-rose-600">
                  {formatCurrency(pnlData?.totalOperatingExpenses || 0)}
                </div>
                <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-500">
                  <span>Cost Ratio:</span>
                  <span className="font-bold text-rose-700">
                    {pnlData?.grossRevenue > 0 ? ((pnlData.totalOperatingExpenses / pnlData.grossRevenue) * 100).toFixed(1) : 0}% of Revenue
                  </span>
                </div>
              </div>
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                <span>Entries: <strong className="text-slate-800">{pnlData?.expensesList?.length || 0} logged</strong></span>
                <span>Cost / Order: <strong className="text-slate-800">₹{pnlData?.avgExpensePerOrder || 0}</strong></span>
              </div>
            </div>

            {/* Card 3: Net Operating Profit */}
            <div className={`p-5 rounded-2xl border shadow-sm space-y-3 ${
              (pnlData?.netOperatingProfit || 0) >= 0 
                ? 'bg-gradient-to-br from-emerald-50/70 via-white to-teal-50/40 border-emerald-200' 
                : 'bg-gradient-to-br from-rose-50/70 via-white to-amber-50/40 border-rose-200'
            }`}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Net Operating Profit
                </span>
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                  (pnlData?.netOperatingProfit || 0) >= 0 ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
                }`}>
                  {(pnlData?.netOperatingProfit || 0) >= 0 ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownRight className="w-5 h-5" />}
                </div>
              </div>
              <div>
                <div className={`text-2xl sm:text-3xl font-black font-display ${
                  (pnlData?.netOperatingProfit || 0) >= 0 ? 'text-emerald-700' : 'text-rose-700'
                }`}>
                  {formatCurrency(pnlData?.netOperatingProfit || 0)}
                </div>
                <div className="flex items-center gap-1.5 mt-1 text-xs">
                  <span className="text-slate-600">Profit Margin:</span>
                  <span className={`font-black px-2 py-0.5 rounded-full text-xs ${
                    (pnlData?.netOperatingProfit || 0) >= 0 
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                      : 'bg-rose-100 text-rose-800 border border-rose-200'
                  }`}>
                    {pnlData?.profitMarginPercentage || 0}%
                  </span>
                </div>
              </div>
              <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-600">
                <span>Avg Profit/Order:</span>
                <strong className={pnlData?.avgProfitPerOrder >= 0 ? 'text-emerald-700 font-bold' : 'text-rose-700 font-bold'}>
                  {formatCurrency(pnlData?.avgProfitPerOrder || 0)}
                </strong>
              </div>
            </div>

            {/* Card 4: Unit Economics */}
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Unit Economics
                </span>
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Percent className="w-5 h-5" />
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500">Cost / Kg Processed:</span>
                  <span className="font-bold text-slate-900">₹{pnlData?.costPerKgProcessed || 0} / kg</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500">Avg Revenue / Order:</span>
                  <span className="font-bold text-slate-900">₹{pnlData?.avgRevenuePerOrder || 0}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500">Total Garment Pieces:</span>
                  <span className="font-bold text-slate-900">{pnlData?.totalItemizedPieces || 0} pcs</span>
                </div>
              </div>
              <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500 truncate">
                Period: <strong className="text-slate-800">{pnlData?.monthLabel}</strong>
              </div>
            </div>

          </div>

          {/* ─────────────────────────────────────────────────────
              3-BRANCH COMPARATIVE PERFORMANCE MATRIX WITH ADDRESSES
          ───────────────────────────────────────────────────── */}
          {comparativePnL?.branches && (
            <div className="space-y-4 p-5 sm:p-6 rounded-3xl bg-slate-900 text-white shadow-xl border border-slate-800">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-orange-500/20 text-orange-300 border border-orange-500/30 text-[10px] font-black uppercase tracking-wider mb-1">
                    <Building className="w-3 h-3 text-orange-400" />
                    <span>3-Branch Multi-Store Audit & Reconciliation</span>
                  </div>
                  <h3 className="text-lg font-black font-display text-white">
                    Separate 3-Branch Performance & Margin Matrix
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Side-by-side Revenue, Operating Costs, Net Operating Profit, and Margin % across Counter 1, Counter 2, and Counter 3.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    icon={Printer}
                    onClick={() => setIsPrintModalOpen(true)}
                    className="text-white border-white/20 hover:bg-white/10 text-xs font-bold"
                  >
                    Compare & Print PDF
                  </Button>
                </div>
              </div>

              {/* 3 Branch Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                {comparativePnL.branches.map((b) => {
                  const bp = b.pnl;
                  const isSelected = selectedBranch === b.id;

                  return (
                    <div
                      key={b.id}
                      onClick={() => setSelectedBranch(b.id)}
                      className={`p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between space-y-4 ${
                        isSelected
                          ? 'bg-gradient-to-br from-purple-950/80 to-slate-950 border-cyan-400/60 shadow-lg shadow-purple-950/80 ring-2 ring-cyan-400/30'
                          : 'bg-white/5 hover:bg-white/10 border-white/10'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold bg-white/10 text-cyan-300">
                            {b.code}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            bp.profitMarginPercentage >= 20
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          }`}>
                            {bp.profitMarginPercentage}% Margin
                          </span>
                        </div>

                        <h4 className="text-sm font-bold text-white mt-2">
                          {b.name}
                        </h4>
                        <div className="text-[11px] text-slate-400 flex items-start gap-1 mt-1 leading-snug">
                          <span className="text-orange-400 shrink-0">📍</span>
                          <span>{b.address}</span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-white/10 text-xs">
                          <div>
                            <span className="text-[10px] uppercase font-bold text-slate-400 block">Revenue</span>
                            <span className="font-black text-sm text-white">
                              {formatCurrency(bp.grossRevenue)}
                            </span>
                            <span className="text-[10px] text-slate-500 block">({b.revenueShare}% share)</span>
                          </div>
                          <div>
                            <span className="text-[10px] uppercase font-bold text-slate-400 block">Expenses</span>
                            <span className="font-black text-sm text-rose-400">
                              {formatCurrency(bp.totalOperatingExpenses)}
                            </span>
                            <span className="text-[10px] text-slate-500 block">({b.expenseShare}% share)</span>
                          </div>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs">
                        <div>
                          <span className="text-[10px] uppercase font-bold text-slate-400 block">Net Profit</span>
                          <span className={`font-black text-sm ${bp.isProfitable ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {formatCurrency(bp.netOperatingProfit)}
                          </span>
                        </div>
                        <div className="text-right text-[11px] text-slate-400">
                          <div>{bp.totalOrdersCount} orders</div>
                          <div className="text-[10px] text-slate-500">{bp.totalProcessedKg} Kg</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ─────────────────────────────────────────────────────
              AI COST OPTIMIZATION & PROFIT INSIGHTS
          ───────────────────────────────────────────────────── */}
          {aiInsights.length > 0 && (
            <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-slate-900 border border-amber-500/20 text-white shadow-lg space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">
                      AI Cost Optimization & Operational Diagnostics
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Machine learning analytics evaluating utility ratios, chemical consumption, and facility budget efficiency.
                    </p>
                  </div>
                </div>
                <div className="text-xs font-bold text-amber-300 bg-amber-500/20 px-3 py-1 rounded-full border border-amber-500/30">
                  Potential Monthly Savings: ₹{aiInsights.reduce((sum, i) => sum + (i.potentialSavings || 0), 0).toLocaleString()}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {aiInsights.map((insight) => (
                  <div 
                    key={insight.id}
                    className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                          <span>{insight.icon}</span>
                          <span>{insight.category}</span>
                        </span>
                        {insight.potentialSavings > 0 && (
                          <span className="text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                            Save ₹{insight.potentialSavings.toLocaleString()}
                          </span>
                        )}
                      </div>
                      <h4 className="text-xs font-bold text-white mt-1.5">{insight.title}</h4>
                      <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">{insight.recommendation}</p>
                    </div>

                    {insight.actionLabel && (
                      <div className="pt-2 border-t border-slate-800 text-[10px] text-orange-400 font-bold flex items-center gap-1">
                        <span>Action: {insight.actionLabel}</span>
                        <ChevronRight className="w-3 h-3" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 11 Operational Cost Drivers & Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left Col (8 cols): Itemized Expense Category Breakdown */}
            <div className="lg:col-span-8 p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-lg">📋</span>
                  <h3 className="font-bold text-slate-900 text-sm">
                    Operating Cost Breakdown by Driver ({pnlData?.categoryBreakdown?.length || 0} Active)
                  </h3>
                </div>
                <span className="text-xs font-bold text-slate-500">
                  Sum: <strong className="text-rose-600">{formatCurrency(pnlData?.totalOperatingExpenses || 0)}</strong>
                </span>
              </div>

              {pnlData?.categoryBreakdown?.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400 space-y-2">
                  <Wallet className="w-8 h-8 mx-auto text-slate-300" />
                  <p>No expenses logged yet for {pnlData?.monthLabel}.</p>
                  <Button size="sm" variant="outline" onClick={() => handleOpenAddExpense()}>
                    + Log First Expense
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {pnlData?.categoryBreakdown?.map((cat) => (
                    <div key={cat.categoryId} className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-base shrink-0">{cat.icon}</span>
                          <div className="min-w-0">
                            <span className="font-bold text-slate-900 truncate block">
                              {cat.categoryName}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {cat.categoryGroup} • {cat.entriesCount} entries
                            </span>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="font-mono font-bold text-slate-900 block text-xs">
                            {formatCurrency(cat.totalAmount)}
                          </span>
                          <span className="text-[10px] text-slate-500">
                            {cat.percentageOfExpenses}% of expenses
                          </span>
                        </div>
                      </div>

                      {/* Progress bar */}
                      <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                        <div 
                          className="bg-gradient-to-r from-orange-500 to-rose-500 h-1.5 rounded-full" 
                          style={{ width: `${Math.min(100, Math.max(3, cat.percentageOfExpenses))}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Right Col (4 cols): Quick Log 1-Click Operational Buttons */}
            <div className="lg:col-span-4 p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
              <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider text-slate-500">
                1-Click Quick Expense Logger
              </h3>
              <p className="text-[11px] text-slate-500">
                Tap any operational driver below to quickly log utility bills or costs:
              </p>

              <div className="grid grid-cols-2 gap-2 pt-1">
                {allCategories.slice(0, 10).map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => handleOpenAddExpense(cat.id)}
                    className="p-2.5 rounded-xl border border-slate-200 hover:border-orange-400 hover:bg-orange-50/50 text-left transition-all flex flex-col justify-between group active:scale-95"
                  >
                    <span className="text-lg mb-1">{cat.icon}</span>
                    <span className="text-xs font-bold text-slate-800 group-hover:text-orange-700 truncate block">
                      {cat.name}
                    </span>
                    <span className="text-[9px] text-slate-400 font-mono mt-0.5">
                      ₹{cat.defaultRate} / {cat.unitType}
                    </span>
                  </button>
                ))}
              </div>
            </div>

          </div>

          {/* 12-Month Historical Profitability Trend Table */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  12-Month Financial Performance & Net Profit History ({selectedYear})
                </h3>
                <p className="text-xs text-slate-500">
                  Annual Gross Revenue vs Operating Expenses & Net Margin Trends
                </p>
              </div>

              <div className="text-right">
                <span className="text-xs font-bold text-slate-500 block">Annual Net Profit:</span>
                <span className={`text-base font-black font-display ${
                  (yearlyTrends?.totalAnnualNetProfit || 0) >= 0 ? 'text-emerald-700' : 'text-rose-600'
                }`}>
                  {formatCurrency(yearlyTrends?.totalAnnualNetProfit || 0)} ({yearlyTrends?.annualMargin || 0}%)
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase">
                    <th className="p-2.5">Month</th>
                    <th className="p-2.5 text-right">Gross Revenue</th>
                    <th className="p-2.5 text-right">Operating Expenses</th>
                    <th className="p-2.5 text-right">Net Operating Profit</th>
                    <th className="p-2.5 text-right">Profit Margin</th>
                    <th className="p-2.5 text-center">Orders</th>
                    <th className="p-2.5 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {yearlyTrends?.monthlyTrends?.map((m) => {
                    const isCurrent = m.monthIndex === selectedMonth;
                    return (
                      <tr 
                        key={m.monthIndex}
                        className={`hover:bg-slate-50/80 transition-colors ${
                          isCurrent ? 'bg-orange-50/40 font-bold' : ''
                        }`}
                      >
                        <td className="p-2.5 text-slate-900 flex items-center gap-1.5">
                          {isCurrent && <span className="text-orange-600">●</span>}
                          <span>{m.monthName}</span>
                        </td>
                        <td className="p-2.5 text-right font-mono font-bold text-slate-900">
                          {formatCurrency(m.grossRevenue)}
                        </td>
                        <td className="p-2.5 text-right font-mono font-bold text-rose-600">
                          {formatCurrency(m.totalExpenses)}
                        </td>
                        <td className={`p-2.5 text-right font-mono font-black ${
                          m.netProfit >= 0 ? 'text-emerald-700' : 'text-rose-600'
                        }`}>
                          {formatCurrency(m.netProfit)}
                        </td>
                        <td className="p-2.5 text-right">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            m.netProfit >= 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                          }`}>
                            {m.profitMargin}%
                          </span>
                        </td>
                        <td className="p-2.5 text-center text-slate-600 font-mono">
                          {m.ordersCount}
                        </td>
                        <td className="p-2.5 text-center">
                          <button
                            type="button"
                            onClick={() => setSelectedMonth(m.monthIndex)}
                            className="text-[11px] text-orange-600 hover:text-orange-800 font-bold hover:underline"
                          >
                            View Month ➔
                          </button>
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

      {/* ========================================================================= */}
      {/* TAB 2: INTERACTIVE ANALYTICS & CHARTS                                     */}
      {/* ========================================================================= */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          
          {/* Chart 1: 12-Month Revenue vs Expenses Area Chart */}
          <div className="p-5 sm:p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  12-Month Financial Performance & Net Profit Curve ({selectedYear})
                </h3>
                <p className="text-xs text-slate-500">
                  Monthly Revenue (Green) vs Operating Expenses (Orange) and resulting Net Profit margin trajectory.
                </p>
              </div>
              <div className="flex items-center gap-3 text-xs font-bold">
                <span className="flex items-center gap-1.5 text-emerald-600">
                  <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" /> Revenue
                </span>
                <span className="flex items-center gap-1.5 text-rose-500">
                  <span className="w-3 h-3 rounded-full bg-rose-500 inline-block" /> Expenses
                </span>
                <span className="flex items-center gap-1.5 text-blue-600">
                  <span className="w-3 h-3 rounded-full bg-blue-500 inline-block" /> Net Profit
                </span>
              </div>
            </div>

            <div className="h-72 w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={yearlyTrends?.monthlyTrends || []}>
                  <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.0}/>
                    </linearGradient>
                    <linearGradient id="colorExp" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="monthShort" tickLine={false} axisLine={{ stroke: '#e2e8f0' }} tick={{ fontSize: 11, fill: '#64748b' }} />
                  <YAxis tickLine={false} axisLine={{ stroke: '#e2e8f0' }} tick={{ fontSize: 11, fill: '#64748b' }} tickFormatter={(v) => `₹${v >= 1000 ? (v/1000).toFixed(0) + 'k' : v}`} />
                  <Tooltip 
                    formatter={(val) => [formatCurrency(val), '']}
                    contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '12px' }}
                  />
                  <Area type="monotone" dataKey="grossRevenue" name="Revenue" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRev)" />
                  <Area type="monotone" dataKey="totalExpenses" name="Expenses" stroke="#f43f5e" strokeWidth={2.5} fillOpacity={1} fill="url(#colorExp)" />
                  <Line type="monotone" dataKey="netProfit" name="Net Profit" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Grid: 2 Charts (Cost Breakdown Doughnut + 3-Branch Bar Comparison) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Chart 2 (6 cols): Expense Breakdown Doughnut */}
            <div className="lg:col-span-6 p-5 sm:p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4 flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Operating Cost Distribution ({pnlData?.monthLabel})
                </h3>
                <p className="text-xs text-slate-500">
                  Breakdown by operational driver and percentage of total expenditure.
                </p>
              </div>

              {pieChartData.length === 0 ? (
                <div className="h-64 flex items-center justify-center text-xs text-slate-400">
                  No expense records logged for this month.
                </div>
              ) : (
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={85}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {pieChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(val, name) => [formatCurrency(val), name]}
                        contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '11px' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Top 4 Legend Badges */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                {pieChartData.slice(0, 4).map((p, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-xs">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: p.color }} />
                    <span className="truncate text-slate-700 font-medium">{p.name}</span>
                    <span className="text-[10px] font-bold text-slate-400 font-mono ml-auto">{p.percent}%</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Chart 3 (6 cols): 3-Branch Side-by-Side Bar Comparison */}
            <div className="lg:col-span-6 p-5 sm:p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4 flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  3-Branch Side-by-Side Revenue vs Operating Cost ({pnlData?.monthLabel})
                </h3>
                <p className="text-xs text-slate-500">
                  Comparative performance across Counter 1 (Main), Counter 2 (Tolichowki), and Counter 3 (Ambience).
                </p>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={branchComparisonChartData} barSize={20}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" tickLine={false} axisLine={{ stroke: '#e2e8f0' }} tick={{ fontSize: 11, fill: '#64748b' }} />
                    <YAxis tickLine={false} axisLine={{ stroke: '#e2e8f0' }} tick={{ fontSize: 11, fill: '#64748b' }} tickFormatter={(v) => `₹${v >= 1000 ? (v/1000).toFixed(0) + 'k' : v}`} />
                    <Tooltip 
                      formatter={(val) => [formatCurrency(val), '']}
                      contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '11px' }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                    <Bar dataKey="Revenue" fill="#10b981" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Expenses" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Profit" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="text-[11px] text-slate-500 text-center pt-2 border-t border-slate-100">
                Top performer: <strong className="text-emerald-700">{comparativePnL?.topBranch?.name}</strong> with {comparativePnL?.topBranch?.pnl?.profitMarginPercentage}% margin
              </div>
            </div>

          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: MONTHLY BUDGET RADAR & OVERRUN THRESHOLDS                          */}
      {/* ========================================================================= */}
      {activeTab === 'budgets' && (
        <div className="space-y-6">
          
          {/* Top Banner & Configure Action */}
          <div className="p-5 sm:p-6 rounded-3xl bg-slate-900 text-white shadow-xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[10px] font-black uppercase tracking-wider mb-1">
                <ShieldCheck className="w-3 h-3 text-cyan-400" />
                <span>Monthly Budget Radar & Cost Caps</span>
              </div>
              <h3 className="text-lg font-black font-display text-white">
                Category Spending vs Monthly Allocated Budget
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Monitor live expenses against category budget caps. Flags overruns (&gt;100%) and warning thresholds (80-100%).
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="primary"
                size="md"
                icon={Sliders}
                onClick={() => {
                  setBudgetsForm(budgetConfig.monthlyBudgets || DEFAULT_BUDGET_CONFIG.monthlyBudgets);
                  setBudgetModalOpen(true);
                }}
                className="bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700"
              >
                Configure Monthly Budgets
              </Button>
            </div>
          </div>

          {/* Budget KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Monthly Budget</span>
              <div className="text-2xl font-black font-display text-slate-900">{formatCurrency(budgetVsActual?.totalBudget || 0)}</div>
              <div className="text-xs text-slate-500">Allocated across {allCategories.length} categories</div>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Spent so Far</span>
              <div className="text-2xl font-black font-display text-rose-600">{formatCurrency(budgetVsActual?.totalActual || 0)}</div>
              <div className="text-xs text-slate-500">{budgetVsActual?.overallPercentage || 0}% of total budget consumed</div>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Budget Variance / Remaining</span>
              <div className={`text-2xl font-black font-display ${(budgetVsActual?.totalVariance || 0) >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                {formatCurrency(budgetVsActual?.totalVariance || 0)}
              </div>
              <div className="text-xs text-slate-500">{(budgetVsActual?.totalVariance || 0) >= 0 ? 'Within budget cap' : 'Budget exceeded'}</div>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Overrun Alerts</span>
              <div className="text-2xl font-black font-display text-amber-600 flex items-center gap-2">
                <span>{budgetVsActual?.overrunCount || 0}</span>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800">
                  {budgetVsActual?.overrunCount || 0} Overruns
                </span>
              </div>
              <div className="text-xs text-slate-500">{budgetVsActual?.warningCount || 0} categories in warning zone</div>
            </div>
          </div>

          {/* Category Budget Progress Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {budgetVsActual?.categoriesComparison?.map((cat) => {
              const isOverrun = cat.status === 'overrun';
              const isWarning = cat.status === 'warning';

              return (
                <div 
                  key={cat.id}
                  className={`p-4 sm:p-5 rounded-2xl border transition-all space-y-3 ${
                    isOverrun 
                      ? 'bg-rose-50/40 border-rose-300 ring-1 ring-rose-200' 
                      : isWarning
                      ? 'bg-amber-50/40 border-amber-300'
                      : 'bg-white border-slate-200'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="text-2xl p-2 rounded-xl bg-white border border-slate-200">{cat.icon}</span>
                      <div>
                        <h4 className="text-xs sm:text-sm font-bold text-slate-900">{cat.name}</h4>
                        <span className="text-[10px] text-slate-400">{cat.categoryGroup}</span>
                      </div>
                    </div>

                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      isOverrun
                        ? 'bg-rose-600 text-white'
                        : isWarning
                        ? 'bg-amber-100 text-amber-900 border border-amber-300'
                        : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                    }`}>
                      {isOverrun ? '🚨 OVERRUN' : isWarning ? '⚠️ WARNING' : '✅ SAFE'} ({cat.spentPercentage}%)
                    </span>
                  </div>

                  <div className="space-y-1.5 pt-1">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-500">Actual Spent:</span>
                      <span className={`font-mono font-bold ${isOverrun ? 'text-rose-600 font-black' : 'text-slate-900'}`}>
                        {formatCurrency(cat.actualSpent)}
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-500">Monthly Budget Cap:</span>
                      <span className="font-mono font-medium text-slate-600">
                        {formatCurrency(cat.budgetLimit)}
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden mt-2">
                      <div 
                        className={`h-2 rounded-full transition-all ${
                          isOverrun
                            ? 'bg-rose-600'
                            : isWarning
                            ? 'bg-amber-500'
                            : 'bg-emerald-500'
                        }`}
                        style={{ width: `${Math.min(100, cat.spentPercentage)}%` }}
                      />
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                    <span>
                      {isOverrun ? (
                        <span className="text-rose-700 font-bold">Exceeded by {formatCurrency(cat.overrunAmount)}</span>
                      ) : (
                        <span>Remaining: <strong className="text-emerald-700">{formatCurrency(cat.remaining)}</strong></span>
                      )}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleOpenAddExpense(cat.id)}
                      className="text-orange-600 hover:text-orange-800 font-bold text-[10px]"
                    >
                      + Log Bill
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: RECURRING OVERHEAD AUTO-GENERATOR                                  */}
      {/* ========================================================================= */}
      {activeTab === 'recurring' && (
        <div className="space-y-6">
          
          {/* Top Action Header with 1-Click Auto-Populate Button */}
          <div className="p-5 sm:p-6 rounded-3xl bg-slate-900 text-white shadow-xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-black uppercase tracking-wider mb-1">
                <RotateCcw className="w-3 h-3 text-emerald-400" />
                <span>Automated Overhead Rules & Batch Generation</span>
              </div>
              <h3 className="text-lg font-black font-display text-white">
                Monthly Recurring Overheads & Payroll Engine
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Fixed monthly costs (Store Rents, Staff Payroll, Broadband, AMC) automatically generated in 1-Click into the monthly ledger.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="primary"
                size="md"
                icon={Zap}
                loading={isGeneratingRecurring}
                onClick={handleAutoPopulateRecurring}
                className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 shadow-md shadow-emerald-500/20 text-xs font-bold"
              >
                ⚡ 1-Click Auto-Populate This Month Overheads
              </Button>
              <Button
                variant="outline"
                size="md"
                icon={Plus}
                onClick={() => {
                  setEditingRecurringRule(null);
                  setRecurringForm({
                    title: '',
                    categoryId: 'store_rent',
                    amount: 25000,
                    unitRate: 25000,
                    unitsCount: 1,
                    unitType: 'monthly',
                    branchId: selectedBranch !== 'ALL' ? selectedBranch : 'counter-1',
                    vendorName: '',
                    vendorGstin: '',
                    frequency: 'MONTHLY',
                    dayOfMonth: 5,
                    paymentMode: 'BANK_TRANSFER',
                    paymentReference: '',
                    gstRate: 18,
                    isGstClaimable: true,
                    notes: '',
                    isActive: true,
                  });
                  setRecurringModalOpen(true);
                }}
                className="text-white border-white/20 hover:bg-white/10 text-xs font-bold"
              >
                Add Recurring Rule
              </Button>
            </div>
          </div>

          {/* Recurring Rules Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {recurringRules.map((rule) => (
              <div 
                key={rule.id}
                className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between space-y-4 hover:border-slate-300 transition-all"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <span className="text-2xl p-2 rounded-xl bg-orange-50">{rule.icon || '🏢'}</span>
                      <div>
                        <h4 className="text-xs sm:text-sm font-bold text-slate-900">{rule.title}</h4>
                        <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full inline-block mt-0.5">
                          {rule.categoryName || rule.categoryId}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingRecurringRule(rule);
                          setRecurringForm(rule);
                          setRecurringModalOpen(true);
                        }}
                        className="p-1.5 text-slate-400 hover:text-orange-600 rounded-lg hover:bg-orange-50"
                        title="Edit Rule"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setDeleteTarget(rule);
                          setDeleteTargetType('recurring');
                        }}
                        className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50"
                        title="Delete Rule"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="mt-3 space-y-1.5 text-xs">
                    <div className="flex justify-between items-center text-slate-500">
                      <span>Assigned Branch:</span>
                      <span className="font-bold text-slate-800">
                        {BRANCH_OPTIONS.find(b => b.value === rule.branchId)?.label.split(' — ')[0] || rule.branchName || rule.branchId}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-slate-500">
                      <span>Schedule:</span>
                      <span className="font-mono text-slate-800">Day {rule.dayOfMonth || 1} of each month</span>
                    </div>
                    {rule.vendorName && (
                      <div className="flex justify-between items-center text-slate-500">
                        <span>Vendor:</span>
                        <span className="text-slate-800 truncate max-w-[140px]">{rule.vendorName}</span>
                      </div>
                    )}
                    {rule.gstRate > 0 && (
                      <div className="flex justify-between items-center text-slate-500">
                        <span>GST Slab:</span>
                        <span className="font-mono text-emerald-700 font-bold">{rule.gstRate}% (ITC Claimable)</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase block font-bold">Fixed Monthly Cost</span>
                    <span className="font-mono font-black text-base text-slate-900">
                      {formatCurrency(rule.amount)}
                    </span>
                  </div>

                  <Badge variant={rule.isActive !== false ? 'emerald' : 'slate'} size="sm">
                    {rule.isActive !== false ? 'Active Rule' : 'Inactive'}
                  </Badge>
                </div>
              </div>
            ))}
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: EXPENSE LEDGER & GST ITC VAULT                                     */}
      {/* ========================================================================= */}
      {activeTab === 'ledger' && (
        <div className="space-y-6">
          
          {/* GST Input Tax Credit (ITC) Summary Cards */}
          {gstSummary && (
            <div className="p-5 sm:p-6 rounded-3xl bg-slate-900 text-white shadow-xl border border-slate-800 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center">
                    <Receipt className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">
                      GST Input Tax Credit (ITC) & Vendor Tax Vault ({pnlData?.monthLabel})
                    </h3>
                    <p className="text-xs text-slate-400">
                      Track GST paid on commercial purchases, facility rents, chemicals, and offset against sales GST liability.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setLedgerGstFilter(ledgerGstFilter === 'CLAIMABLE' ? 'ALL' : 'CLAIMABLE')}
                    className={`text-xs font-bold ${ledgerGstFilter === 'CLAIMABLE' ? 'bg-orange-500 text-white border-orange-500' : 'text-white border-white/20'}`}
                  >
                    {ledgerGstFilter === 'CLAIMABLE' ? 'Showing Claimable ITC' : 'Filter Claimable ITC'}
                  </Button>
                </div>
              </div>

              {/* GST Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Taxable Purchases</span>
                  <div className="text-lg sm:text-xl font-black font-display text-white">{formatCurrency(gstSummary.totalTaxableValue)}</div>
                  <span className="text-[10px] text-slate-400">Gross: {formatCurrency(gstSummary.totalExpensesGross)}</span>
                </div>

                <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total GST Paid</span>
                  <div className="text-lg sm:text-xl font-black font-display text-rose-400">{formatCurrency(gstSummary.totalGstPaid)}</div>
                  <span className="text-[10px] text-slate-400">Paid to all suppliers</span>
                </div>

                <div className="p-3.5 rounded-2xl bg-emerald-950/50 border border-emerald-500/30 space-y-1">
                  <span className="text-[10px] font-bold text-emerald-300 uppercase tracking-wider block">Claimable Input Tax Credit (ITC)</span>
                  <div className="text-lg sm:text-xl font-black font-display text-emerald-400">{formatCurrency(gstSummary.claimableItcAmount)}</div>
                  <span className="text-[10px] text-emerald-300/70">Offsets sales GST payable</span>
                </div>

                <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">ITC by Tax Slabs</span>
                  <div className="flex flex-wrap gap-1.5 pt-1 text-[10px] font-mono">
                    <span className="bg-white/10 px-1.5 py-0.5 rounded">18%: {formatCurrency(gstSummary.itcBreakdownByRate['18%'] || 0)}</span>
                    <span className="bg-white/10 px-1.5 py-0.5 rounded">5%: {formatCurrency(gstSummary.itcBreakdownByRate['5%'] || 0)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Controls & Filter Bar */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search title, vendor, GSTIN, invoice..."
                  value={ledgerSearch}
                  onChange={(e) => setLedgerSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium outline-none focus:border-orange-500"
                />
              </div>

              <select
                value={ledgerCategoryFilter}
                onChange={(e) => setLedgerCategoryFilter(e.target.value)}
                className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 outline-none cursor-pointer"
              >
                <option value="ALL">All Categories</option>
                {allCategories.map(c => (
                  <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                ))}
              </select>

              <select
                value={ledgerBranchFilter}
                onChange={(e) => setLedgerBranchFilter(e.target.value)}
                className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 outline-none cursor-pointer max-w-[160px] truncate"
              >
                <option value="ALL">All Branches</option>
                <option value="counter-1">Counter 1 (Main)</option>
                <option value="counter-2">Counter 2 (Tolichowki)</option>
                <option value="counter-3">Counter 3 (Ambience)</option>
              </select>

              <select
                value={ledgerPaymentFilter}
                onChange={(e) => setLedgerPaymentFilter(e.target.value)}
                className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 outline-none cursor-pointer"
              >
                <option value="ALL">All Payments</option>
                {PAYMENT_MODES.map(p => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            </div>

            <Button
              variant="primary"
              size="md"
              icon={Plus}
              onClick={() => handleOpenAddExpense()}
            >
              Log New Expense
            </Button>
          </div>

          {/* Ledger Table */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-500 border-b border-slate-100 pb-2">
              <span>Showing <strong>{filteredLedger.length}</strong> expense entries for {pnlData?.monthLabel}</span>
              <span>Total: <strong className="text-rose-600 font-mono text-sm">{formatCurrency(filteredLedger.reduce((sum, e) => sum + (Number(e.amount) || 0), 0))}</strong></span>
            </div>

            {filteredLedger.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-xs space-y-2">
                <Wallet className="w-10 h-10 mx-auto text-slate-300" />
                <p>No expense entries found matching your filter.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase">
                      <th className="p-3">Date & Branch</th>
                      <th className="p-3">Category</th>
                      <th className="p-3">Title & Vendor Details</th>
                      <th className="p-3">Formula / Units</th>
                      <th className="p-3">GST & ITC</th>
                      <th className="p-3">Payment</th>
                      <th className="p-3 text-right">Amount (₹)</th>
                      <th className="p-3 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {filteredLedger.map((exp) => (
                      <tr key={exp.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="p-3 font-mono text-slate-600 whitespace-nowrap">
                          <div className="font-bold text-slate-900">{exp.date}</div>
                          <div className="text-[10px] text-slate-400">
                            {BRANCH_OPTIONS.find(b => b.value === exp.branchId)?.label.split(' — ')[0] || exp.branchName || exp.branchId}
                          </div>
                        </td>
                        <td className="p-3 whitespace-nowrap">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 font-bold text-slate-800 text-[11px]">
                            <span>{exp.icon}</span>
                            <span>{exp.categoryName}</span>
                          </span>
                        </td>
                        <td className="p-3">
                          <div className="font-bold text-slate-900">{exp.title}</div>
                          {exp.vendorName && (
                            <div className="text-[10px] text-slate-500 font-medium mt-0.5">
                              Vendor: <strong className="text-slate-700">{exp.vendorName}</strong>
                              {exp.vendorGstin && <span className="font-mono text-slate-400 ml-1">({exp.vendorGstin})</span>}
                            </div>
                          )}
                          {exp.invoiceNumber && (
                            <div className="text-[10px] text-slate-400 font-mono">Inv: {exp.invoiceNumber}</div>
                          )}
                        </td>
                        <td className="p-3 text-slate-600 font-mono text-[11px]">
                          {exp.calculationText || `${exp.unitsCount} ${exp.unitType} @ ₹${exp.unitRate}`}
                        </td>
                        <td className="p-3 whitespace-nowrap text-[11px]">
                          {exp.gstRate > 0 ? (
                            <div>
                              <span className="font-mono font-bold text-emerald-700">{exp.gstRate}% GST</span>
                              <div className="text-[10px] text-slate-500 font-mono">ITC: ₹{exp.gstAmount || 0}</div>
                            </div>
                          ) : (
                            <span className="text-slate-400 text-[10px]">0% / Exempt</span>
                          )}
                        </td>
                        <td className="p-3 whitespace-nowrap">
                          <span className="text-[11px] font-medium text-slate-600">
                            {PAYMENT_MODES.find(p => p.value === exp.paymentMode)?.label || exp.paymentMode}
                          </span>
                          {exp.paymentReference && (
                            <div className="text-[9px] text-slate-400 font-mono">{exp.paymentReference}</div>
                          )}
                        </td>
                        <td className="p-3 text-right font-mono font-black text-rose-600 text-sm whitespace-nowrap">
                          {formatCurrency(exp.amount)}
                        </td>
                        <td className="p-3 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleOpenEditExpense(exp)}
                              className="p-1.5 text-slate-400 hover:text-orange-600 rounded-lg hover:bg-orange-50 transition-colors"
                              title="Edit Expense"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setDeleteTarget(exp);
                                setDeleteTargetType('expense');
                              }}
                              className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                              title="Delete Expense"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 6: COST FORMULAS & CUSTOM CATEGORIES CMS                              */}
      {/* ========================================================================= */}
      {activeTab === 'categories' && (
        <div className="space-y-6">
          
          {/* Header Bar */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">
                Operational Cost Drivers & Rate Configuration
              </h3>
              <p className="text-xs text-slate-500">
                11 Built-in Laundry Cost Formulas + Custom Operational Overhead Categories
              </p>
            </div>

            <Button
              variant="primary"
              size="md"
              icon={Plus}
              onClick={() => {
                setEditingCategory(null);
                setCategoryForm({
                  name: '',
                  icon: '💸',
                  unitType: 'monthly',
                  formulaLabel: 'Monthly cost',
                  defaultRate: 1000,
                  categoryGroup: 'General Overhead',
                  description: '',
                });
                setCategoryModalOpen(true);
              }}
            >
              Add Custom Category
            </Button>
          </div>

          {/* 11 Official Built-in Cost Formulas Cards */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              ⚡ 11 Official Operational Cost Drivers
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {(config.builtInCategories || DEFAULT_EXPENSE_CONFIG.builtInCategories).map((cat) => (
                <div key={cat.id} className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between gap-3 hover:border-slate-300 transition-all">
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <span className="text-2xl p-2 rounded-xl bg-slate-100">{cat.icon}</span>
                        <div>
                          <h4 className="text-xs sm:text-sm font-bold text-slate-900">{cat.name}</h4>
                          <span className="text-[10px] font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full inline-block mt-0.5">
                            {cat.categoryGroup}
                          </span>
                        </div>
                      </div>
                      <Badge variant="emerald" size="sm">Built-in</Badge>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-2 leading-relaxed">
                      {cat.description}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase">Formula & Unit</span>
                      <span className="font-mono font-bold text-xs text-slate-800">{cat.formulaLabel}</span>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block uppercase">Default Rate</span>
                      <span className="font-mono font-bold text-sm text-slate-900">
                        ₹{cat.defaultRate} / {cat.unitType}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Custom Admin Categories */}
          <div className="space-y-3 pt-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                🏢 Custom Operational & Overhead Categories ({(config.customCategories || []).length})
              </h4>
              <span className="text-xs text-slate-400">Admin defined custom categories</span>
            </div>

            {(config.customCategories || []).length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400 bg-white rounded-2xl border border-slate-200">
                No custom categories added yet. Click "Add Custom Category" to create one.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {(config.customCategories || []).map((cat) => (
                  <div key={cat.id} className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between gap-3 hover:border-slate-300 transition-all">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <span className="text-2xl p-2 rounded-xl bg-orange-50">{cat.icon}</span>
                          <div>
                            <h4 className="text-xs sm:text-sm font-bold text-slate-900">{cat.name}</h4>
                            <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full inline-block mt-0.5">
                              {cat.categoryGroup}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingCategory(cat);
                              setCategoryForm(cat);
                              setCategoryModalOpen(true);
                            }}
                            className="p-1.5 text-slate-400 hover:text-orange-600 rounded-lg hover:bg-orange-50"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setDeleteTarget(cat);
                              setDeleteTargetType('category');
                            }}
                            className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {cat.description && (
                        <p className="text-[11px] text-slate-500 mt-2 leading-relaxed">
                          {cat.description}
                        </p>
                      )}
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-slate-400 block uppercase">Unit Type</span>
                        <span className="font-mono font-bold text-xs text-slate-800">{cat.unitType}</span>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 block uppercase">Default Rate</span>
                        <span className="font-mono font-bold text-sm text-slate-900">
                          ₹{cat.defaultRate} / {cat.unitType}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: LOG / EDIT EXPENSE ENTRY (WITH GST & VENDOR FIELDS)                 */}
      {/* ========================================================================= */}
      {expenseModalOpen && (
        <Modal
          isOpen={expenseModalOpen}
          onClose={() => setExpenseModalOpen(false)}
          title={editingExpense ? 'Edit Expense Entry' : 'Log New Operational Expense'}
        >
          <form onSubmit={handleSaveExpense} className="space-y-4 max-h-[80vh] overflow-y-auto pr-1">
            
            {/* Category Picker */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Select Cost Driver / Category *
              </label>
              <select
                value={expenseForm.categoryId}
                onChange={(e) => handleCategorySelectInForm(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 outline-none focus:border-orange-500"
              >
                {allCategories.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.icon} {c.name} ({c.formulaLabel})
                  </option>
                ))}
              </select>
            </div>

            {/* Date & Branch */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Date *</label>
                <Input
                  type="date"
                  required
                  value={expenseForm.date}
                  onChange={(e) => setExpenseForm({ ...expenseForm, date: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Branch / Location *</label>
                <select
                  value={expenseForm.branchId}
                  onChange={(e) => setExpenseForm({ ...expenseForm, branchId: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-900 outline-none"
                >
                  {BRANCH_OPTIONS.map(b => (
                    <option key={b.value} value={b.value}>{b.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Title / Description */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Expense Description / Title *</label>
              <Input
                required
                placeholder="e.g. September Commercial Power Bill (420 kWh)"
                value={expenseForm.title}
                onChange={(e) => setExpenseForm({ ...expenseForm, title: e.target.value })}
              />
            </div>

            {/* Dynamic Formula Rate Calculator */}
            <div className="p-3.5 rounded-2xl bg-orange-50/60 border border-orange-200 space-y-3">
              <span className="text-[11px] font-bold text-orange-800 uppercase tracking-wider block">
                ⚡ Cost Formula Calculation
              </span>

              <div className="grid grid-cols-3 gap-2.5">
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                    Units ({expenseForm.unitType})
                  </label>
                  <input
                    type="number"
                    min="0.01"
                    step="any"
                    value={expenseForm.unitsCount}
                    onChange={(e) => handleUnitsOrRateChange(e.target.value, expenseForm.unitRate)}
                    className="w-full p-2 rounded-xl bg-white border border-slate-200 font-mono font-bold text-xs text-center"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                    Rate (₹/{expenseForm.unitType})
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={expenseForm.unitRate}
                    onChange={(e) => handleUnitsOrRateChange(expenseForm.unitsCount, e.target.value)}
                    className="w-full p-2 rounded-xl bg-white border border-slate-200 font-mono font-bold text-xs text-center"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                    Total Amount (₹) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={expenseForm.amount}
                    onChange={(e) => setExpenseForm({ ...expenseForm, amount: Number(e.target.value) || 0 })}
                    className="w-full p-2 rounded-xl bg-white border-2 border-orange-400 font-mono font-black text-sm text-center text-orange-600"
                  />
                </div>
              </div>

              <div className="text-[10px] text-slate-500 text-center font-mono">
                {expenseForm.unitsCount} {expenseForm.unitType} × ₹{expenseForm.unitRate} = <strong className="text-slate-900">₹{expenseForm.amount}</strong>
              </div>
            </div>

            {/* Vendor & GST Details */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                🧾 Vendor & GST Input Tax Credit (ITC)
              </span>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Vendor / Supplier Name</label>
                  <Input
                    placeholder="e.g. TSSPDCL, Seitz India, HP Gas"
                    value={expenseForm.vendorName}
                    onChange={(e) => setExpenseForm({ ...expenseForm, vendorName: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Vendor GSTIN (15 Digits)</label>
                  <Input
                    placeholder="e.g. 36AAACS1234D1Z8"
                    value={expenseForm.vendorGstin}
                    onChange={(e) => setExpenseForm({ ...expenseForm, vendorGstin: e.target.value.toUpperCase() })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">GST Tax Slab</label>
                  <select
                    value={expenseForm.gstRate}
                    onChange={(e) => handleUnitsOrRateChange(expenseForm.unitsCount, expenseForm.unitRate, e.target.value)}
                    className="w-full p-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-900 outline-none"
                  >
                    {GST_RATES.map(r => (
                      <option key={r.value} value={r.value}>{r.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Computed GST (₹)</label>
                  <input
                    type="number"
                    value={expenseForm.gstAmount}
                    onChange={(e) => setExpenseForm({ ...expenseForm, gstAmount: Number(e.target.value) || 0 })}
                    className="w-full p-2 rounded-xl bg-white border border-slate-200 font-mono font-bold text-xs"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="claimableCheckbox"
                  checked={expenseForm.isGstClaimable}
                  onChange={(e) => setExpenseForm({ ...expenseForm, isGstClaimable: e.target.checked })}
                  className="rounded border-slate-300 text-orange-600 focus:ring-orange-500"
                />
                <label htmlFor="claimableCheckbox" className="text-xs text-slate-700 font-medium cursor-pointer">
                  Eligible for GST Input Tax Credit (ITC) offset against sales tax
                </label>
              </div>
            </div>

            {/* Payment Mode & Reference */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Payment Mode</label>
                <select
                  value={expenseForm.paymentMode}
                  onChange={(e) => setExpenseForm({ ...expenseForm, paymentMode: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-900 outline-none"
                >
                  {PAYMENT_MODES.map(p => (
                    <option key={p.value} value={p.value}>{p.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Invoice / Receipt Ref #</label>
                <Input
                  placeholder="e.g. EB-REC-9912"
                  value={expenseForm.paymentReference}
                  onChange={(e) => setExpenseForm({ ...expenseForm, paymentReference: e.target.value })}
                />
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Internal Notes (Optional)</label>
              <Input
                placeholder="e.g. Paid to electricity board via online portal"
                value={expenseForm.notes}
                onChange={(e) => setExpenseForm({ ...expenseForm, notes: e.target.value })}
              />
            </div>

            {/* Submit Buttons */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setExpenseModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary">
                {editingExpense ? 'Update Expense' : 'Save Expense Entry'}
              </Button>
            </div>

          </form>
        </Modal>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ADD / EDIT RECURRING OVERHEAD RULE                                  */}
      {/* ========================================================================= */}
      {recurringModalOpen && (
        <Modal
          isOpen={recurringModalOpen}
          onClose={() => setRecurringModalOpen(false)}
          title={editingRecurringRule ? 'Edit Recurring Rule' : 'Add Monthly Recurring Overhead Rule'}
        >
          <form onSubmit={handleSaveRecurringRule} className="space-y-4">
            
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Category *
              </label>
              <select
                value={recurringForm.categoryId}
                onChange={(e) => {
                  const cat = allCategories.find(c => c.id === e.target.value);
                  setRecurringForm({
                    ...recurringForm,
                    categoryId: e.target.value,
                    categoryName: cat?.name || 'Overhead',
                    icon: cat?.icon || '🏢',
                    categoryGroup: cat?.categoryGroup || 'Facility Overhead',
                  });
                }}
                className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 outline-none"
              >
                {allCategories.map(c => (
                  <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Rule Title / Description *</label>
              <Input
                required
                placeholder="e.g. Monthly Store Rental - Tolichowki Branch 1"
                value={recurringForm.title}
                onChange={(e) => setRecurringForm({ ...recurringForm, title: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Monthly Amount (₹) *</label>
                <Input
                  type="number"
                  required
                  min="1"
                  value={recurringForm.amount}
                  onChange={(e) => setRecurringForm({ ...recurringForm, amount: Number(e.target.value) || 0 })}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Assigned Branch *</label>
                <select
                  value={recurringForm.branchId}
                  onChange={(e) => setRecurringForm({ ...recurringForm, branchId: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-900 outline-none"
                >
                  {BRANCH_OPTIONS.map(b => (
                    <option key={b.value} value={b.value}>{b.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Day of Month (1-28)</label>
                <Input
                  type="number"
                  min="1"
                  max="28"
                  value={recurringForm.dayOfMonth}
                  onChange={(e) => setRecurringForm({ ...recurringForm, dayOfMonth: Number(e.target.value) || 1 })}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Payment Mode</label>
                <select
                  value={recurringForm.paymentMode}
                  onChange={(e) => setRecurringForm({ ...recurringForm, paymentMode: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-900 outline-none"
                >
                  {PAYMENT_MODES.map(p => (
                    <option key={p.value} value={p.value}>{p.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Vendor / Payee</label>
                <Input
                  placeholder="e.g. Manikonda Commercial Properties"
                  value={recurringForm.vendorName}
                  onChange={(e) => setRecurringForm({ ...recurringForm, vendorName: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Vendor GSTIN</label>
                <Input
                  placeholder="e.g. 36AAACM1234F1Z5"
                  value={recurringForm.vendorGstin}
                  onChange={(e) => setRecurringForm({ ...recurringForm, vendorGstin: e.target.value.toUpperCase() })}
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setRecurringModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary">
                {editingRecurringRule ? 'Update Rule' : 'Save Recurring Rule'}
              </Button>
            </div>

          </form>
        </Modal>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CONFIGURE MONTHLY BUDGETS                                          */}
      {/* ========================================================================= */}
      {budgetModalOpen && (
        <Modal
          isOpen={budgetModalOpen}
          onClose={() => setBudgetModalOpen(false)}
          title="Configure Category Monthly Budgets (₹)"
        >
          <form onSubmit={handleSaveBudgets} className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
            <p className="text-xs text-slate-500">
              Set maximum monthly expenditure caps for each laundry operational driver. The system will alert on overruns.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {allCategories.map(cat => (
                <div key={cat.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                    <span>{cat.icon}</span>
                    <span>{cat.name}</span>
                  </div>
                  <input
                    type="number"
                    min="0"
                    step="500"
                    value={budgetsForm[cat.id] !== undefined ? budgetsForm[cat.id] : 5000}
                    onChange={(e) => setBudgetsForm({
                      ...budgetsForm,
                      [cat.id]: Number(e.target.value) || 0
                    })}
                    className="w-full p-2 rounded-lg bg-white border border-slate-200 font-mono font-bold text-xs text-slate-900"
                  />
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setBudgetModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary">
                Save Budget Limits
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ADD / EDIT CUSTOM CATEGORY                                         */}
      {/* ========================================================================= */}
      {categoryModalOpen && (
        <Modal
          isOpen={categoryModalOpen}
          onClose={() => setCategoryModalOpen(false)}
          title={editingCategory ? 'Edit Expense Category' : 'Add Custom Operational Category'}
        >
          <form onSubmit={handleSaveCategory} className="space-y-4">
            
            <div className="grid grid-cols-12 gap-3">
              <div className="col-span-3">
                <label className="block text-xs font-bold text-slate-700 mb-1">Emoji Icon</label>
                <Input
                  required
                  placeholder="e.g. 🏢"
                  value={categoryForm.icon}
                  onChange={(e) => setCategoryForm({ ...categoryForm, icon: e.target.value })}
                  className="text-center text-lg"
                />
              </div>

              <div className="col-span-9">
                <label className="block text-xs font-bold text-slate-700 mb-1">Category Name *</label>
                <Input
                  required
                  placeholder="e.g. Store Rent, Local Ads, Tea & Snacks"
                  value={categoryForm.name}
                  onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Unit Type *</label>
                <Input
                  required
                  placeholder="e.g. monthly, kg, piece, order"
                  value={categoryForm.unitType}
                  onChange={(e) => setCategoryForm({ ...categoryForm, unitType: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Default Rate (₹) *</label>
                <Input
                  type="number"
                  required
                  min="0"
                  step="any"
                  value={categoryForm.defaultRate}
                  onChange={(e) => setCategoryForm({ ...categoryForm, defaultRate: Number(e.target.value) || 0 })}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Category Group</label>
              <select
                value={categoryForm.categoryGroup}
                onChange={(e) => setCategoryForm({ ...categoryForm, categoryGroup: e.target.value })}
                className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-900 outline-none"
              >
                <option value="Facility Overhead">Facility Overhead</option>
                <option value="Utilities">Utilities</option>
                <option value="Consumables">Consumables</option>
                <option value="Direct Processing">Direct Processing</option>
                <option value="Logistics">Logistics</option>
                <option value="Staff Welfare">Staff Welfare</option>
                <option value="Sales & Growth">Sales & Growth</option>
                <option value="Admin Overhead">Admin Overhead</option>
                <option value="General Expenses">General Expenses</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Description / Formula Note</label>
              <Input
                placeholder="e.g. Monthly commercial rental for Manikonda branch"
                value={categoryForm.description}
                onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
              />
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setCategoryModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary">
                {editingCategory ? 'Update Category' : 'Save Category'}
              </Button>
            </div>

          </form>
        </Modal>
      )}

      {/* ========================================================================= */}
      {/* CONFIRM DELETE DIALOG                                                     */}
      {/* ========================================================================= */}
      {deleteTarget && (
        <ConfirmDialog
          isOpen={Boolean(deleteTarget)}
          title={`Delete ${deleteTargetType === 'expense' ? 'Expense Entry' : deleteTargetType === 'category' ? 'Custom Category' : 'Recurring Rule'}?`}
          message={
            deleteTargetType === 'expense'
              ? `Are you sure you want to delete the expense entry "${deleteTarget.title}" (₹${deleteTarget.amount})? This will update your monthly P&L totals immediately.`
              : deleteTargetType === 'category'
              ? `Are you sure you want to delete the custom category "${deleteTarget.name}"?`
              : `Are you sure you want to delete the recurring rule "${deleteTarget.title}"?`
          }
          confirmLabel="Yes, Delete"
          cancelLabel="Cancel"
          variant="danger"
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      {/* ========================================================================= */}
      {/* 3-BRANCH PROFIT & LOSS A4 PRINTABLE PDF STATEMENT MODAL                   */}
      {/* ========================================================================= */}
      {isPrintModalOpen && pnlData && (
        <PnLReportModal
          isOpen={isPrintModalOpen}
          onClose={() => setIsPrintModalOpen(false)}
          pnlData={pnlData}
          comparativeData={comparativePnL}
          selectedYear={selectedYear}
          selectedMonth={selectedMonth}
          selectedBranch={selectedBranch}
          onBranchChange={(bId) => setSelectedBranch(bId)}
        />
      )}

    </div>
  );
};

export default AdminExpensesPage;

/**
 * Expense Tracking, Cost Analysis & Monthly Profit and Loss (P&L) Engine for Tech Wash
 * Features:
 * - 11 Built-in Operational Cost Formulas (Electricity, Water, Detergent, Gas, Washing, Drying, Ironing, Maintenance, Packaging, Delivery, Labour)
 * - Custom Expense Categories with full CRUD (Add, Edit, Delete)
 * - Daily & Monthly Expense Entry Ledger with Vendor Vault & GST Input Tax Credit (ITC)
 * - Real-time Monthly P&L Reconciliation (Gross Revenue - Itemized Operating Expenses = Net Operating Profit & Margin %)
 * - 3-Branch Comparative Matrix & Reconciliation (Counter 1 Manikonda, Counter 2 Tolichowki, Counter 3 Ambience Courtyard)
 * - Monthly Budget Radar & Overrun Thresholds
 * - Recurring Overhead Rules & 1-Click Monthly Auto-Populate Generator
 * - AI Cost Optimization & Profit Insights Engine
 * - Firebase Firestore single source of truth (`expenses`, `settings/expense_config`, `settings/expense_budgets`, `settings/recurring_expenses`) + localStorage offline caching
 */

import { db, isFirebaseConfigured } from './firebase.js';
import { collection, doc, getDocs, getDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { orderService } from './orderService.js';
import { parseOrderDateSafe } from './reportService.js';

const EXPENSE_CONFIG_STORAGE_KEY = 'techwash_expense_config_v1';
const EXPENSES_STORAGE_KEY = 'techwash_expenses_ledger_v1';
const EXPENSE_BUDGETS_STORAGE_KEY = 'techwash_expense_budgets_v1';
const RECURRING_EXPENSES_STORAGE_KEY = 'techwash_recurring_expense_rules_v1';

export const DEFAULT_EXPENSE_CONFIG = {
  // 11 Official Laundry Operational Cost Drivers
  builtInCategories: [
    {
      id: 'electricity',
      name: 'Electricity',
      icon: '⚡',
      unitType: 'kWh',
      formulaLabel: '₹/kWh × units consumed',
      defaultRate: 8.50,
      categoryGroup: 'Utilities',
      description: 'Power consumption for washers, tumblers, steam boilers & plant lighting',
      isBuiltIn: true,
    },
    {
      id: 'water',
      name: 'Water',
      icon: '💧',
      unitType: 'Litres',
      formulaLabel: 'Litres × water cost',
      defaultRate: 0.08, // ₹80 per 1,000 L / 1 kL
      categoryGroup: 'Utilities',
      description: 'RO softened water and municipal water supply consumption',
      isBuiltIn: true,
    },
    {
      id: 'detergent',
      name: 'Detergent & Chemicals',
      icon: '🧴',
      unitType: 'kg/load',
      formulaLabel: '₹ per kg/load',
      defaultRate: 6.00,
      categoryGroup: 'Consumables',
      description: 'Eco-hydrocarbon solvents, bio-enzyme detergents, softeners & pre-spotters',
      isBuiltIn: true,
    },
    {
      id: 'gas_lpg',
      name: 'Gas / LPG',
      icon: '🔥',
      unitType: 'cycle',
      formulaLabel: '₹ per drying cycle',
      defaultRate: 18.00,
      categoryGroup: 'Utilities',
      description: 'Commercial LPG cylinder refills for high-efficiency gas dryers and steam generators',
      isBuiltIn: true,
    },
    {
      id: 'washing',
      name: 'Washing Cost',
      icon: '🧺',
      unitType: 'kg',
      formulaLabel: 'Cost per kg',
      defaultRate: 8.00,
      categoryGroup: 'Direct Processing',
      description: 'Drum operational cycle costs, wash-in additives & machine wear per kg',
      isBuiltIn: true,
    },
    {
      id: 'drying',
      name: 'Drying Cost',
      icon: '♨️',
      unitType: 'kg/cycle',
      formulaLabel: 'Cost per kg/cycle',
      defaultRate: 7.00,
      categoryGroup: 'Direct Processing',
      description: 'Moisture-extraction blower power and lint filter maintenance per batch',
      isBuiltIn: true,
    },
    {
      id: 'ironing',
      name: 'Ironing Cost',
      icon: '👔',
      unitType: 'piece',
      formulaLabel: 'Cost per piece',
      defaultRate: 3.50,
      categoryGroup: 'Direct Processing',
      description: 'High-pressure vacuum steam press energy and operator touch time per piece',
      isBuiltIn: true,
    },
    {
      id: 'maintenance',
      name: 'Machinery Maintenance',
      icon: '🛠️',
      unitType: 'monthly',
      formulaLabel: 'Monthly machine cost',
      defaultRate: 5000,
      categoryGroup: 'Maintenance & Repairs',
      description: 'Monthly machine AMC, boiler descaling, motor belts, valve servicing & spare parts',
      isBuiltIn: true,
    },
    {
      id: 'packaging',
      name: 'Packaging Supplies',
      icon: '📦',
      unitType: 'order',
      formulaLabel: 'Cost per order',
      defaultRate: 12.00,
      categoryGroup: 'Packaging & Supplies',
      description: 'Eco polybags, garment covers, hanger wraps, barcode labels & sealing tape',
      isBuiltIn: true,
    },
    {
      id: 'delivery',
      name: 'Delivery & Logistics',
      icon: '🚚',
      unitType: 'delivery',
      formulaLabel: 'Cost per delivery',
      defaultRate: 35.00,
      categoryGroup: 'Logistics',
      description: 'Delivery two-wheeler fuel, vehicle maintenance & rider trip incentive',
      isBuiltIn: true,
    },
    {
      id: 'labour',
      name: 'Labour & Payroll',
      icon: '👷',
      unitType: 'monthly',
      formulaLabel: 'Daily/monthly cost',
      defaultRate: 35000,
      categoryGroup: 'Staff Payroll',
      description: 'Washing operators, ironers, folding staff, cashier & store attendant wages',
      isBuiltIn: true,
    },
  ],

  // Admin Custom Categories
  customCategories: [
    {
      id: 'store_rent',
      name: 'Store Rent',
      icon: '🏢',
      unitType: 'monthly',
      formulaLabel: 'Monthly facility rent',
      defaultRate: 25000,
      categoryGroup: 'Facility Overhead',
      description: 'Monthly commercial rental for shop and processing plant',
      isBuiltIn: false,
    },
    {
      id: 'marketing_ads',
      name: 'Marketing & Local Ads',
      icon: '📢',
      unitType: 'monthly',
      formulaLabel: 'Monthly ad spend',
      defaultRate: 5000,
      categoryGroup: 'Sales & Growth',
      description: 'Google Maps ads, social media campaigns, flyers and local promotions',
      isBuiltIn: false,
    },
    {
      id: 'software_telecom',
      name: 'Internet & Cloud Software',
      icon: '💻',
      unitType: 'monthly',
      formulaLabel: 'Monthly broadband & cloud subscription',
      defaultRate: 2500,
      categoryGroup: 'Admin Overhead',
      description: 'Store high-speed internet, WhatsApp API gateway and cloud hosting',
      isBuiltIn: false,
    },
    {
      id: 'tea_pantry',
      name: 'Staff Tea & Refreshments',
      icon: '☕',
      unitType: 'monthly',
      formulaLabel: 'Monthly pantry expense',
      defaultRate: 1800,
      categoryGroup: 'Staff Welfare',
      description: 'Daily tea, coffee, drinking water jars and staff refreshments',
      isBuiltIn: false,
    },
  ],
};

// Default Monthly Budgets per category (in ₹)
export const DEFAULT_BUDGET_CONFIG = {
  monthlyBudgets: {
    electricity: 15000,
    water: 5000,
    detergent: 12000,
    gas_lpg: 8000,
    washing: 10000,
    drying: 8000,
    ironing: 6000,
    maintenance: 10000,
    packaging: 15000,
    delivery: 20000,
    labour: 75000,
    store_rent: 65000,
    marketing_ads: 10000,
    software_telecom: 5000,
    tea_pantry: 3000,
  },
  warningThresholdPercent: 80,
  overrunThresholdPercent: 100,
};

// Default Monthly Recurring Fixed Overhead Rules
export const DEFAULT_RECURRING_EXPENSES = [
  {
    id: 'rec-rent-manikonda',
    title: 'Monthly Facility Rental - Manikonda Main Store',
    categoryId: 'store_rent',
    categoryName: 'Store Rent',
    icon: '🏢',
    categoryGroup: 'Facility Overhead',
    amount: 25000,
    unitRate: 25000,
    unitsCount: 1,
    unitType: 'monthly',
    branchId: 'counter-1',
    branchName: 'Tech Wash Laundry Main Branch',
    vendorName: 'Manikonda Commercial Properties Ltd',
    vendorGstin: '36AAACM1234F1Z5',
    frequency: 'MONTHLY',
    dayOfMonth: 5,
    paymentMode: 'BANK_TRANSFER',
    paymentReference: 'NEFT-RENT-MNK',
    notes: 'Primary processing plant and store space lease',
    isActive: true,
    gstRate: 18,
    isGstClaimable: true,
  },
  {
    id: 'rec-labour-manikonda',
    title: 'Staff Salaries (Operators, Steam Ironers & Counter)',
    categoryId: 'labour',
    categoryName: 'Labour & Payroll',
    icon: '👷',
    categoryGroup: 'Staff Payroll',
    amount: 35000,
    unitRate: 35000,
    unitsCount: 1,
    unitType: 'monthly',
    branchId: 'counter-1',
    branchName: 'Tech Wash Laundry Main Branch',
    vendorName: 'Tech Wash Payroll Direct',
    vendorGstin: '',
    frequency: 'MONTHLY',
    dayOfMonth: 1,
    paymentMode: 'BANK_TRANSFER',
    paymentReference: 'SAL-MANIKONDA-PAYROLL',
    notes: 'Main plant washing operators and counter staff wages',
    isActive: true,
    gstRate: 0,
    isGstClaimable: false,
  },
  {
    id: 'rec-rent-tolichowki',
    title: 'Monthly Store Rental - Tolichowki Branch 1',
    categoryId: 'store_rent',
    categoryName: 'Store Rent',
    icon: '🏢',
    categoryGroup: 'Facility Overhead',
    amount: 20000,
    unitRate: 20000,
    unitsCount: 1,
    unitType: 'monthly',
    branchId: 'counter-2',
    branchName: 'Tech Wash Laundry Services (Branch 1)',
    vendorName: 'OU Colony Retail Spaces',
    vendorGstin: '36AAACR9981K1Z2',
    frequency: 'MONTHLY',
    dayOfMonth: 5,
    paymentMode: 'BANK_TRANSFER',
    paymentReference: 'NEFT-RENT-TOL',
    notes: 'Tolichowki customer drop-off store lease',
    isActive: true,
    gstRate: 18,
    isGstClaimable: true,
  },
  {
    id: 'rec-labour-tolichowki',
    title: 'Staff Payroll - Tolichowki Counter & Ironing',
    categoryId: 'labour',
    categoryName: 'Labour & Payroll',
    icon: '👷',
    categoryGroup: 'Staff Payroll',
    amount: 28000,
    unitRate: 28000,
    unitsCount: 1,
    unitType: 'monthly',
    branchId: 'counter-2',
    branchName: 'Tech Wash Laundry Services (Branch 1)',
    vendorName: 'Tech Wash Payroll Direct',
    vendorGstin: '',
    frequency: 'MONTHLY',
    dayOfMonth: 1,
    paymentMode: 'BANK_TRANSFER',
    paymentReference: 'SAL-TOLICHOWKI-PAYROLL',
    notes: 'Tolichowki retail counter and steam ironing staff wages',
    isActive: true,
    gstRate: 0,
    isGstClaimable: false,
  },
  {
    id: 'rec-rent-ambience',
    title: 'Monthly Kiosk Rental - Ambience Courtyard Pick Up Point',
    categoryId: 'store_rent',
    categoryName: 'Store Rent',
    icon: '🏢',
    categoryGroup: 'Facility Overhead',
    amount: 15000,
    unitRate: 15000,
    unitsCount: 1,
    unitType: 'monthly',
    branchId: 'counter-3',
    branchName: 'Tech Wash Pick Up Point',
    vendorName: 'Ambience Courtyard Management',
    vendorGstin: '36AAACA4455P1Z9',
    frequency: 'MONTHLY',
    dayOfMonth: 5,
    paymentMode: 'BANK_TRANSFER',
    paymentReference: 'NEFT-RENT-AMB',
    notes: 'Ambience Courtyard drop & pickup kiosk lease',
    isActive: true,
    gstRate: 18,
    isGstClaimable: true,
  },
  {
    id: 'rec-labour-ambience',
    title: 'Staff Payroll - Ambience Pick Up Point Attendant',
    categoryId: 'labour',
    categoryName: 'Labour & Payroll',
    icon: '👷',
    categoryGroup: 'Staff Payroll',
    amount: 18000,
    unitRate: 18000,
    unitsCount: 1,
    unitType: 'monthly',
    branchId: 'counter-3',
    branchName: 'Tech Wash Pick Up Point',
    vendorName: 'Tech Wash Payroll Direct',
    vendorGstin: '',
    frequency: 'MONTHLY',
    dayOfMonth: 1,
    paymentMode: 'BANK_TRANSFER',
    paymentReference: 'SAL-AMBIENCE-PAYROLL',
    notes: 'Kiosk reception and garment intake attendant',
    isActive: true,
    gstRate: 0,
    isGstClaimable: false,
  },
  {
    id: 'rec-amc-maintenance',
    title: 'Commercial Boiler & Washer-Dryer AMC',
    categoryId: 'maintenance',
    categoryName: 'Machinery Maintenance',
    icon: '🛠️',
    categoryGroup: 'Maintenance & Repairs',
    amount: 5000,
    unitRate: 5000,
    unitsCount: 1,
    unitType: 'monthly',
    branchId: 'counter-1',
    branchName: 'Tech Wash Laundry Main Branch',
    vendorName: 'HydraPro Laundry Tech Services',
    vendorGstin: '36AAACH8821B1Z3',
    frequency: 'MONTHLY',
    dayOfMonth: 10,
    paymentMode: 'UPI_ONLINE',
    paymentReference: 'AMC-HYD-0926',
    notes: 'Monthly preventive maintenance and chemical descaling AMC',
    isActive: true,
    gstRate: 18,
    isGstClaimable: true,
  },
  {
    id: 'rec-broadband-cloud',
    title: 'Store High-Speed Fiber Internet & Cloud POS Software',
    categoryId: 'software_telecom',
    categoryName: 'Internet & Cloud Software',
    icon: '💻',
    categoryGroup: 'Admin Overhead',
    amount: 2500,
    unitRate: 2500,
    unitsCount: 1,
    unitType: 'monthly',
    branchId: 'ALL',
    branchName: 'All Branches / Central Hub',
    vendorName: 'ACT Fibernet & Cloud Tech',
    vendorGstin: '36AAACA7722M1Z8',
    frequency: 'MONTHLY',
    dayOfMonth: 1,
    paymentMode: 'UPI_ONLINE',
    paymentReference: 'ACT-BROADBAND-0926',
    notes: 'High-speed store connectivity & WhatsApp API gateway',
    isActive: true,
    gstRate: 18,
    isGstClaimable: true,
  },
];

// Seed initial sample expenses for demonstration and immediate P&L visualization
export const INITIAL_SAMPLE_EXPENSES = [
  {
    id: 'exp-2026-09-01-elec',
    date: '2026-09-25',
    categoryId: 'electricity',
    categoryName: 'Electricity',
    icon: '⚡',
    categoryGroup: 'Utilities',
    title: 'September Commercial Power Bill (420 Units)',
    unitsCount: 420,
    unitRate: 8.50,
    unitType: 'kWh',
    amount: 3570,
    calculationText: '420 kWh × ₹8.50/kWh',
    branchId: 'counter-1',
    branchName: 'Tech Wash Laundry Main Branch',
    paymentMode: 'UPI_ONLINE',
    paymentReference: 'EB-TEL-HYD-99812',
    vendorName: 'TSSPDCL Southern Power',
    vendorGstin: '36AAACT0998Q1Z1',
    invoiceNumber: 'EB-BILL-2026-09',
    gstRate: 0,
    gstAmount: 0,
    isGstClaimable: false,
    notes: 'Commercial meter power bill for main branch and plant',
    createdAt: '2026-09-25T10:00:00.000Z',
  },
  {
    id: 'exp-2026-09-02-water',
    date: '2026-09-24',
    categoryId: 'water',
    categoryName: 'Water',
    icon: '💧',
    categoryGroup: 'Utilities',
    title: 'Water Supply Tanker (15,000 Litres)',
    unitsCount: 15000,
    unitRate: 0.08,
    unitType: 'Litres',
    amount: 1200,
    calculationText: '15,000 Litres × ₹0.08/L',
    branchId: 'counter-1',
    branchName: 'Tech Wash Laundry Main Branch',
    paymentMode: 'CASH',
    paymentReference: 'TANKER-REC-441',
    vendorName: 'Sri Balaji Water Suppliers',
    vendorGstin: '36AAACB5512N1Z4',
    invoiceNumber: 'WT-441',
    gstRate: 5,
    gstAmount: 57,
    isGstClaimable: true,
    notes: 'RO water soft tank refill for laundry cycle',
    createdAt: '2026-09-24T14:30:00.000Z',
  },
  {
    id: 'exp-2026-09-03-det',
    date: '2026-09-20',
    categoryId: 'detergent',
    categoryName: 'Detergent & Chemicals',
    icon: '🧴',
    categoryGroup: 'Consumables',
    title: 'Hydrocarbon Solvent & Liquid Detergent Batch (120 kg)',
    unitsCount: 120,
    unitRate: 25,
    unitType: 'kg/load',
    amount: 3000,
    calculationText: '120 kg wash chemical kit × ₹25',
    branchId: 'ALL',
    branchName: 'All Branches / Central Hub',
    paymentMode: 'BANK_TRANSFER',
    paymentReference: 'TXN-DET-88319',
    vendorName: 'Seitz Eco Chemical India Ltd',
    vendorGstin: '36AAACS1234D1Z8',
    invoiceNumber: 'INV-SEITZ-9981',
    gstRate: 18,
    gstAmount: 457,
    isGstClaimable: true,
    notes: 'High-grade non-toxic eco hydrocarbon cleaning fluids',
    createdAt: '2026-09-20T11:00:00.000Z',
  },
  {
    id: 'exp-2026-09-04-gas',
    date: '2026-09-18',
    categoryId: 'gas_lpg',
    categoryName: 'Gas / LPG',
    icon: '🔥',
    categoryGroup: 'Utilities',
    title: '2x Commercial LPG Cylinder Refill (19kg each)',
    unitsCount: 2,
    unitRate: 1950,
    unitType: 'cycle',
    amount: 3900,
    calculationText: '2 Cylinders × ₹1,950',
    branchId: 'counter-1',
    branchName: 'Tech Wash Laundry Main Branch',
    paymentMode: 'CASH',
    paymentReference: 'HP-GAS-7712',
    vendorName: 'HP Commercial Gas Agency',
    vendorGstin: '36AAACH4411C1Z7',
    invoiceNumber: 'HP-GAS-7712',
    gstRate: 5,
    gstAmount: 185,
    isGstClaimable: true,
    notes: 'Gas supply for commercial moisture tumblers',
    createdAt: '2026-09-18T16:00:00.000Z',
  },
  {
    id: 'exp-2026-09-05-pack',
    date: '2026-09-15',
    categoryId: 'packaging',
    categoryName: 'Packaging Supplies',
    icon: '📦',
    categoryGroup: 'Packaging & Supplies',
    title: 'Custom Branded Garment Covers & Hanger Bags (500 sets)',
    unitsCount: 500,
    unitRate: 12,
    unitType: 'order',
    amount: 6000,
    calculationText: '500 Order Sets × ₹12.00',
    branchId: 'ALL',
    branchName: 'All Branches / Central Hub',
    paymentMode: 'UPI_ONLINE',
    paymentReference: 'PACK-SUP-0915',
    vendorName: 'PolyPack Hyderabad Enterprises',
    vendorGstin: '36AAACP8844P1Z3',
    invoiceNumber: 'PP-HYD-551',
    gstRate: 18,
    gstAmount: 915,
    isGstClaimable: true,
    notes: 'Sealed garment covers and dry cleaning tags',
    createdAt: '2026-09-15T12:00:00.000Z',
  },
  {
    id: 'exp-2026-09-06-rent',
    date: '2026-09-05',
    categoryId: 'store_rent',
    categoryName: 'Store Rent',
    icon: '🏢',
    categoryGroup: 'Facility Overhead',
    title: 'Monthly Facility Rental - Manikonda Main Store',
    unitsCount: 1,
    unitRate: 25000,
    unitType: 'monthly',
    amount: 25000,
    calculationText: '1 Month Fixed Rental',
    branchId: 'counter-1',
    branchName: 'Tech Wash Laundry Main Branch',
    paymentMode: 'BANK_TRANSFER',
    paymentReference: 'RENT-SEP-2026-001',
    vendorName: 'Manikonda Commercial Properties Ltd',
    vendorGstin: '36AAACM1234F1Z5',
    invoiceNumber: 'RENT-MNK-0926',
    gstRate: 18,
    gstAmount: 3813,
    isGstClaimable: true,
    notes: 'Main store & customer counter lease',
    createdAt: '2026-09-05T09:00:00.000Z',
  },
  {
    id: 'exp-2026-09-07-labour',
    date: '2026-09-01',
    categoryId: 'labour',
    categoryName: 'Labour & Payroll',
    icon: '👷',
    categoryGroup: 'Staff Payroll',
    title: 'Staff Salaries (Operators, Steam Ironers & Counter Attendant)',
    unitsCount: 1,
    unitRate: 35000,
    unitType: 'monthly',
    amount: 35000,
    calculationText: 'Monthly Payroll Batch',
    branchId: 'counter-1',
    branchName: 'Tech Wash Laundry Main Branch',
    paymentMode: 'BANK_TRANSFER',
    paymentReference: 'SAL-SEP-2026',
    vendorName: 'Tech Wash Payroll Direct',
    vendorGstin: '',
    invoiceNumber: 'PAYROLL-2026-09',
    gstRate: 0,
    gstAmount: 0,
    isGstClaimable: false,
    notes: 'Staff wages for month of September',
    createdAt: '2026-09-01T09:00:00.000Z',
  },
];

export const expenseService = {
  /**
   * Fetch Master Expense Configuration (Built-in + Custom Categories)
   */
  async getExpenseConfig() {
    try {
      if (isFirebaseConfigured && db) {
        const snap = await getDoc(doc(db, 'settings', 'expense_config'));
        if (snap.exists()) {
          const data = snap.data();
          const merged = {
            ...DEFAULT_EXPENSE_CONFIG,
            ...data,
            builtInCategories: (data.builtInCategories && data.builtInCategories.length > 0)
              ? data.builtInCategories
              : DEFAULT_EXPENSE_CONFIG.builtInCategories,
            customCategories: Array.isArray(data.customCategories)
              ? data.customCategories
              : DEFAULT_EXPENSE_CONFIG.customCategories,
          };
          if (typeof window !== 'undefined') {
            localStorage.setItem(EXPENSE_CONFIG_STORAGE_KEY, JSON.stringify(merged));
          }
          return merged;
        }
      }
    } catch (e) {
      console.warn('Could not fetch expense config from Firebase:', e);
    }

    try {
      const local = localStorage.getItem(EXPENSE_CONFIG_STORAGE_KEY);
      if (local) return JSON.parse(local);
    } catch (e) {}

    return DEFAULT_EXPENSE_CONFIG;
  },

  /**
   * Save Master Expense Configuration
   */
  async saveExpenseConfig(config) {
    const payload = {
      ...DEFAULT_EXPENSE_CONFIG,
      ...config,
      updatedAt: new Date().toISOString(),
    };

    if (typeof window !== 'undefined') {
      localStorage.setItem(EXPENSE_CONFIG_STORAGE_KEY, JSON.stringify(payload));
      window.dispatchEvent(new CustomEvent('techwash-expense-config-updated', { detail: payload }));
    }

    if (isFirebaseConfigured && db) {
      try {
        await setDoc(doc(db, 'settings', 'expense_config'), payload, { merge: true });
      } catch (e) {
        console.warn('Could not save expense config to Firebase:', e);
      }
    }

    return payload;
  },

  /**
   * Add a new Custom Expense Category
   */
  async addCustomCategory(newCategory) {
    const config = await this.getExpenseConfig();
    const id = newCategory.id || `cat-${Date.now()}`;
    const formatted = {
      id,
      name: newCategory.name || 'Custom Expense',
      icon: newCategory.icon || '💸',
      unitType: newCategory.unitType || 'unit',
      formulaLabel: newCategory.formulaLabel || `${newCategory.unitType || 'unit'} cost`,
      defaultRate: Number(newCategory.defaultRate) || 0,
      categoryGroup: newCategory.categoryGroup || 'Custom Overhead',
      description: newCategory.description || '',
      isBuiltIn: false,
      createdAt: new Date().toISOString(),
    };

    const updatedCustom = [...(config.customCategories || []).filter(c => c.id !== id), formatted];
    const updatedConfig = { ...config, customCategories: updatedCustom };
    await this.saveExpenseConfig(updatedConfig);
    return formatted;
  },

  /**
   * Delete a Custom Expense Category
   */
  async deleteCustomCategory(categoryId) {
    const config = await this.getExpenseConfig();
    const updatedCustom = (config.customCategories || []).filter(c => c.id !== categoryId);
    const updatedConfig = { ...config, customCategories: updatedCustom };
    await this.saveExpenseConfig(updatedConfig);
    return true;
  },

  /**
   * Update an existing category rate / info (both built-in and custom)
   */
  async updateCategory(categoryId, updates) {
    const config = await this.getExpenseConfig();
    let builtIn = [...(config.builtInCategories || DEFAULT_EXPENSE_CONFIG.builtInCategories)];
    let custom = [...(config.customCategories || DEFAULT_EXPENSE_CONFIG.customCategories)];

    const bIdx = builtIn.findIndex(c => c.id === categoryId);
    if (bIdx >= 0) {
      builtIn[bIdx] = { ...builtIn[bIdx], ...updates };
    } else {
      const cIdx = custom.findIndex(c => c.id === categoryId);
      if (cIdx >= 0) {
        custom[cIdx] = { ...custom[cIdx], ...updates };
      }
    }

    const updatedConfig = { ...config, builtInCategories: builtIn, customCategories: custom };
    await this.saveExpenseConfig(updatedConfig);
    return true;
  },

  /**
   * Get all active categories combined (11 Built-in + Custom)
   */
  async getAllCategories() {
    const config = await this.getExpenseConfig();
    return [
      ...(config.builtInCategories || DEFAULT_EXPENSE_CONFIG.builtInCategories),
      ...(config.customCategories || DEFAULT_EXPENSE_CONFIG.customCategories),
    ];
  },

  // ─────────────────────────────────────────────────────────────
  // BUDGETS MANAGEMENT & OVERRUN THRESHOLDS
  // ─────────────────────────────────────────────────────────────

  /**
   * Get Monthly Budget Configurations
   */
  async getBudgetConfig() {
    try {
      if (isFirebaseConfigured && db) {
        const snap = await getDoc(doc(db, 'settings', 'expense_budgets'));
        if (snap.exists()) {
          const data = snap.data();
          const merged = {
            ...DEFAULT_BUDGET_CONFIG,
            ...data,
            monthlyBudgets: {
              ...DEFAULT_BUDGET_CONFIG.monthlyBudgets,
              ...(data.monthlyBudgets || {}),
            }
          };
          if (typeof window !== 'undefined') {
            localStorage.setItem(EXPENSE_BUDGETS_STORAGE_KEY, JSON.stringify(merged));
          }
          return merged;
        }
      }
    } catch (e) {
      console.warn('Could not fetch budget config from Firebase:', e);
    }

    try {
      const local = localStorage.getItem(EXPENSE_BUDGETS_STORAGE_KEY);
      if (local) return JSON.parse(local);
    } catch (e) {}

    return DEFAULT_BUDGET_CONFIG;
  },

  /**
   * Save Monthly Budget Configurations
   */
  async saveBudgetConfig(budgetConfig) {
    const payload = {
      ...DEFAULT_BUDGET_CONFIG,
      ...budgetConfig,
      updatedAt: new Date().toISOString(),
    };

    if (typeof window !== 'undefined') {
      localStorage.setItem(EXPENSE_BUDGETS_STORAGE_KEY, JSON.stringify(payload));
      window.dispatchEvent(new CustomEvent('techwash-expense-budgets-updated', { detail: payload }));
    }

    if (isFirebaseConfigured && db) {
      try {
        await setDoc(doc(db, 'settings', 'expense_budgets'), payload, { merge: true });
      } catch (e) {
        console.warn('Could not save budget config to Firebase:', e);
      }
    }

    return payload;
  },

  /**
   * Compare Monthly Budget vs Actual Expenses
   */
  async getBudgetVsActualComparison({ year = new Date().getFullYear(), month = new Date().getMonth(), branchFilter = 'ALL' } = {}) {
    const [budgetConfig, pnlData, allCategories] = await Promise.all([
      this.getBudgetConfig(),
      this.getMonthlyPnL({ year, month, branchFilter }),
      this.getAllCategories(),
    ]);

    const budgets = budgetConfig.monthlyBudgets || DEFAULT_BUDGET_CONFIG.monthlyBudgets;
    const warnThreshold = budgetConfig.warningThresholdPercent || 80;
    const overrunThreshold = budgetConfig.overrunThresholdPercent || 100;

    let totalBudget = 0;
    let totalActual = pnlData.totalOperatingExpenses || 0;
    let overrunCount = 0;
    let warningCount = 0;

    const actualMap = new Map();
    (pnlData.categoryBreakdown || []).forEach(cat => {
      actualMap.set(cat.categoryId, cat.totalAmount);
    });

    const categoriesComparison = allCategories.map(cat => {
      const budgetLimit = Number(budgets[cat.id]) || (cat.defaultRate ? Number(cat.defaultRate) * 1.2 : 5000);
      const actualSpent = actualMap.get(cat.id) || 0;
      totalBudget += budgetLimit;

      const spentPercentage = budgetLimit > 0 ? Number(((actualSpent / budgetLimit) * 100).toFixed(1)) : 0;
      const variance = budgetLimit - actualSpent;

      let status = 'safe'; // 'safe' | 'warning' | 'overrun'
      if (spentPercentage >= overrunThreshold) {
        status = 'overrun';
        overrunCount++;
      } else if (spentPercentage >= warnThreshold) {
        status = 'warning';
        warningCount++;
      }

      return {
        id: cat.id,
        name: cat.name,
        icon: cat.icon,
        categoryGroup: cat.categoryGroup,
        budgetLimit,
        actualSpent,
        variance,
        spentPercentage,
        status,
        remaining: Math.max(0, variance),
        overrunAmount: Math.max(0, actualSpent - budgetLimit),
      };
    }).sort((a, b) => b.spentPercentage - a.spentPercentage);

    const overallPercentage = totalBudget > 0 ? Number(((totalActual / totalBudget) * 100).toFixed(1)) : 0;
    const totalVariance = totalBudget - totalActual;

    return {
      year: Number(year),
      month: Number(month),
      branchFilter,
      totalBudget: Math.round(totalBudget),
      totalActual: Math.round(totalActual),
      totalVariance: Math.round(totalVariance),
      overallPercentage,
      overrunCount,
      warningCount,
      safeCount: categoriesComparison.length - (overrunCount + warningCount),
      categoriesComparison,
    };
  },

  // ─────────────────────────────────────────────────────────────
  // RECURRING OVERHEAD EXPENSE RULES & AUTO-GENERATOR
  // ─────────────────────────────────────────────────────────────

  /**
   * Get all Recurring Expense Rules
   */
  async getRecurringExpenseRules() {
    try {
      if (isFirebaseConfigured && db) {
        const snap = await getDoc(doc(db, 'settings', 'recurring_expenses'));
        if (snap.exists()) {
          const data = snap.data();
          if (Array.isArray(data.rules) && data.rules.length > 0) {
            if (typeof window !== 'undefined') {
              localStorage.setItem(RECURRING_EXPENSES_STORAGE_KEY, JSON.stringify(data.rules));
            }
            return data.rules;
          }
        }
      }
    } catch (e) {
      console.warn('Could not fetch recurring rules from Firebase:', e);
    }

    try {
      const local = localStorage.getItem(RECURRING_EXPENSES_STORAGE_KEY);
      if (local) return JSON.parse(local);
      localStorage.setItem(RECURRING_EXPENSES_STORAGE_KEY, JSON.stringify(DEFAULT_RECURRING_EXPENSES));
    } catch (e) {}

    return DEFAULT_RECURRING_EXPENSES;
  },

  /**
   * Save a Recurring Expense Rule (Create or Update)
   */
  async saveRecurringExpenseRule(ruleData) {
    const rules = await this.getRecurringExpenseRules();
    const id = ruleData.id || `rec-${Date.now()}`;
    const payload = {
      ...ruleData,
      id,
      amount: Math.max(0, Number(ruleData.amount) || 0),
      unitsCount: Number(ruleData.unitsCount) || 1,
      unitRate: Number(ruleData.unitRate) || Number(ruleData.amount) || 0,
      unitType: ruleData.unitType || 'monthly',
      frequency: ruleData.frequency || 'MONTHLY',
      dayOfMonth: Number(ruleData.dayOfMonth) || 1,
      branchId: ruleData.branchId || 'counter-1',
      branchName: ruleData.branchName || 'Tech Wash Laundry Main Branch',
      isActive: ruleData.isActive !== false,
      gstRate: Number(ruleData.gstRate) || 0,
      isGstClaimable: Boolean(ruleData.isGstClaimable),
      updatedAt: new Date().toISOString(),
    };

    const updated = [...rules.filter(r => r.id !== id), payload];

    if (typeof window !== 'undefined') {
      localStorage.setItem(RECURRING_EXPENSES_STORAGE_KEY, JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent('techwash-recurring-rules-updated', { detail: updated }));
    }

    if (isFirebaseConfigured && db) {
      try {
        await setDoc(doc(db, 'settings', 'recurring_expenses'), { rules: updated, updatedAt: new Date().toISOString() }, { merge: true });
      } catch (e) {
        console.warn('Could not save recurring rules to Firebase:', e);
      }
    }

    return payload;
  },

  /**
   * Delete a Recurring Expense Rule
   */
  async deleteRecurringExpenseRule(ruleId) {
    const rules = await this.getRecurringExpenseRules();
    const updated = rules.filter(r => r.id !== ruleId);

    if (typeof window !== 'undefined') {
      localStorage.setItem(RECURRING_EXPENSES_STORAGE_KEY, JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent('techwash-recurring-rules-updated', { detail: updated }));
    }

    if (isFirebaseConfigured && db) {
      try {
        await setDoc(doc(db, 'settings', 'recurring_expenses'), { rules: updated, updatedAt: new Date().toISOString() }, { merge: true });
      } catch (e) {
        console.warn('Could not delete recurring rule in Firebase:', e);
      }
    }

    return true;
  },

  /**
   * ⚡ 1-Click Auto-Populate Monthly Recurring Overheads for a Specific Month & Year
   * Prevents duplicate insertion if already populated for the given month
   */
  async autoGenerateMonthlyRecurringExpenses({ year = new Date().getFullYear(), month = new Date().getMonth(), branchFilter = 'ALL' } = {}) {
    const rules = await this.getRecurringExpenseRules();
    const activeRules = rules.filter(r => r.isActive !== false);

    const existingMonthExpenses = await this.getExpenses({ year, month });
    const generated = [];
    let skippedCount = 0;

    const y = Number(year);
    const m = Number(month);
    const padM = String(m + 1).padStart(2, '0');

    for (const rule of activeRules) {
      // Branch filter check
      if (branchFilter && branchFilter !== 'ALL' && rule.branchId !== 'ALL' && rule.branchId !== branchFilter) {
        continue;
      }

      const day = String(Math.min(28, Math.max(1, rule.dayOfMonth || 1))).padStart(2, '0');
      const entryDate = `${y}-${padM}-${day}`;

      // Check if duplicate entry already exists for this rule in this month
      const isDuplicate = existingMonthExpenses.some(e => 
        e.recurringRuleId === rule.id || 
        (e.title === rule.title && e.categoryId === rule.categoryId && String(e.date || '').startsWith(`${y}-${padM}`))
      );

      if (isDuplicate) {
        skippedCount++;
        continue;
      }

      const gstRate = Number(rule.gstRate) || 0;
      const amount = Number(rule.amount) || 0;
      const gstAmount = gstRate > 0 ? Math.round((amount * gstRate / (100 + gstRate)) * 100) / 100 : 0;

      const newExpense = {
        id: `exp-rec-${rule.id}-${y}-${padM}`,
        recurringRuleId: rule.id,
        date: entryDate,
        categoryId: rule.categoryId,
        categoryName: rule.categoryName,
        icon: rule.icon || '🔁',
        categoryGroup: rule.categoryGroup || 'Recurring Overhead',
        title: rule.title,
        unitsCount: rule.unitsCount || 1,
        unitRate: rule.unitRate || rule.amount,
        unitType: rule.unitType || 'monthly',
        amount: rule.amount,
        calculationText: `1 Month Fixed Overhead (${rule.title})`,
        branchId: rule.branchId || 'counter-1',
        branchName: rule.branchName || 'Tech Wash Laundry Main Branch',
        paymentMode: rule.paymentMode || 'BANK_TRANSFER',
        paymentReference: rule.paymentReference || `REC-${y}-${padM}`,
        vendorName: rule.vendorName || '',
        vendorGstin: rule.vendorGstin || '',
        invoiceNumber: `INV-${y}${padM}-${rule.id.slice(-4)}`,
        gstRate,
        gstAmount,
        taxableAmount: Math.max(0, amount - gstAmount),
        isGstClaimable: Boolean(rule.isGstClaimable),
        notes: `Auto-populated monthly fixed overhead for ${entryDate}. ${rule.notes || ''}`,
        isRecurringAutoGenerated: true,
      };

      const saved = await this.addExpense(newExpense);
      generated.push(saved);
    }

    return {
      generatedCount: generated.length,
      skippedCount,
      generatedExpenses: generated,
    };
  },

  // ─────────────────────────────────────────────────────────────
  // GST INPUT TAX CREDIT (ITC) & VENDOR VAULT
  // ─────────────────────────────────────────────────────────────

  /**
   * Aggregate GST Paid, Taxable Purchases, and Claimable Input Tax Credit (ITC)
   */
  async getGstItcSummary({ year = new Date().getFullYear(), month = new Date().getMonth(), branchFilter = 'ALL' } = {}) {
    const monthExpenses = await this.getExpenses({ year, month, branchFilter });

    let totalExpensesGross = 0;
    let totalTaxableValue = 0;
    let totalGstPaid = 0;
    let claimableItcAmount = 0;
    let nonClaimableGst = 0;

    const itcByRate = {
      '0%': 0,
      '5%': 0,
      '12%': 0,
      '18%': 0,
      '28%': 0,
    };

    const vendorMap = new Map();

    monthExpenses.forEach(exp => {
      const grossAmt = Number(exp.amount) || 0;
      totalExpensesGross += grossAmt;

      const rate = Number(exp.gstRate) || 0;
      const isClaimable = exp.isGstClaimable !== false && Boolean(exp.vendorGstin || exp.isGstClaimable);
      
      let gstAmt = Number(exp.gstAmount) || 0;
      if (rate > 0 && (!exp.gstAmount || exp.gstAmount === 0)) {
        gstAmt = Math.round((grossAmt * rate / (100 + rate)) * 100) / 100;
      }
      const taxable = Math.max(0, grossAmt - gstAmt);

      totalTaxableValue += taxable;
      totalGstPaid += gstAmt;

      if (isClaimable && gstAmt > 0) {
        claimableItcAmount += gstAmt;
        const rateKey = `${rate}%`;
        if (itcByRate[rateKey] !== undefined) {
          itcByRate[rateKey] += gstAmt;
        }
      } else {
        nonClaimableGst += gstAmt;
      }

      const vName = exp.vendorName || (exp.vendorGstin ? 'Registered Vendor' : 'Direct Expenses / Unregistered');
      if (!vendorMap.has(vName)) {
        vendorMap.set(vName, {
          vendorName: vName,
          vendorGstin: exp.vendorGstin || 'Unregistered',
          invoiceCount: 0,
          totalPurchases: 0,
          totalGst: 0,
          claimableItc: 0,
        });
      }
      const vEntry = vendorMap.get(vName);
      vEntry.invoiceCount += 1;
      vEntry.totalPurchases += grossAmt;
      vEntry.totalGst += gstAmt;
      if (isClaimable) vEntry.claimableItc += gstAmt;
    });

    return {
      year: Number(year),
      month: Number(month),
      branchFilter,
      totalExpensesGross: Math.round(totalExpensesGross),
      totalTaxableValue: Math.round(totalTaxableValue),
      totalGstPaid: Math.round(totalGstPaid),
      claimableItcAmount: Math.round(claimableItcAmount),
      nonClaimableGst: Math.round(nonClaimableGst),
      itcBreakdownByRate: itcByRate,
      vendorsList: Array.from(vendorMap.values()).sort((a, b) => b.totalPurchases - a.totalPurchases),
    };
  },

  // ─────────────────────────────────────────────────────────────
  // AI COST OPTIMIZATION & PROFIT INSIGHTS ENGINE
  // ─────────────────────────────────────────────────────────────

  /**
   * AI-powered financial diagnostics and cost reduction suggestions
   */
  generateCostOptimizationInsights(pnlData, budgetVsActual, yearlyTrends) {
    if (!pnlData) return [];
    const insights = [];
    const grossRev = pnlData.grossRevenue || 0;
    const totalExp = pnlData.totalOperatingExpenses || 0;
    const processedKg = pnlData.totalProcessedKg || 0;
    const margin = pnlData.profitMarginPercentage || 0;

    // 1. Energy & Electricity Efficiency Insight
    const elecExp = (pnlData.categoryBreakdown || []).find(c => c.categoryId === 'electricity');
    if (elecExp && processedKg > 0) {
      const elecPerKg = elecExp.totalAmount / processedKg;
      if (elecPerKg > 10) {
        insights.push({
          id: 'opt-elec-high',
          category: '⚡ Electricity & Power',
          title: 'High Power Consumption per kg Processed',
          type: 'warning',
          impact: 'High',
          potentialSavings: Math.round(elecExp.totalAmount * 0.18),
          recommendation: `Power cost is currently ₹${elecPerKg.toFixed(1)}/kg (target benchmark: ₹6.00-8.50/kg). Stagger heavy wash & tumble dryer heating cycles during off-peak commercial tariff hours to save up to 18% on monthly utility bills.`,
          icon: '⚡',
          actionLabel: 'Audit Equipment Load',
        });
      } else {
        insights.push({
          id: 'opt-elec-opt',
          category: '⚡ Electricity & Power',
          title: 'Optimal Power Efficiency Achieved',
          type: 'success',
          impact: 'Low',
          potentialSavings: 0,
          recommendation: `Power cost is ₹${elecPerKg.toFixed(1)}/kg, operating within the top quartile of laundry plant energy efficiency.`,
          icon: '⚡',
        });
      }
    }

    // 2. Chemical & Detergent Dosing Ratio
    const chemExp = (pnlData.categoryBreakdown || []).find(c => c.categoryId === 'detergent');
    if (chemExp && processedKg > 0) {
      const chemPerKg = chemExp.totalAmount / processedKg;
      if (chemPerKg > 8) {
        insights.push({
          id: 'opt-chem-high',
          category: '🧴 Detergent & Solvents',
          title: 'Chemical Spend Above Standard Dosage',
          type: 'warning',
          impact: 'Medium',
          potentialSavings: Math.round(chemExp.totalAmount * 0.15),
          recommendation: `Chemical cost is ₹${chemPerKg.toFixed(1)}/kg. Implementing automated auto-dosing pumps on commercial washers will reduce chemical waste and overdosing by ~15%.`,
          icon: '🧴',
          actionLabel: 'Calibrate Auto-Dosing',
        });
      }
    }

    // 3. Packaging Cost Efficiency
    const packExp = (pnlData.categoryBreakdown || []).find(c => c.categoryId === 'packaging');
    if (packExp && pnlData.totalOrdersCount > 0) {
      const packPerOrder = packExp.totalAmount / pnlData.totalOrdersCount;
      if (packPerOrder > 18) {
        insights.push({
          id: 'opt-pack-bulk',
          category: '📦 Packaging Supplies',
          title: 'Bulk Packaging Procurement Opportunity',
          type: 'info',
          impact: 'Medium',
          potentialSavings: Math.round(packExp.totalAmount * 0.12),
          recommendation: `Packaging cost is ₹${packPerOrder.toFixed(1)} per order. Consolidating garment covers, hanger wraps, and tags into 3-month bulk mill orders saves ~12%.`,
          icon: '📦',
          actionLabel: 'Order Bulk Supply',
        });
      }
    }

    // 4. Overrun Budgets Alert
    if (budgetVsActual?.overrunCount > 0) {
      const overrunCats = (budgetVsActual.categoriesComparison || []).filter(c => c.status === 'overrun');
      insights.push({
        id: 'opt-budget-overrun',
        category: '🎯 Budget Overruns',
        title: `${budgetVsActual.overrunCount} Categories Exceeded Monthly Cap`,
        type: 'critical',
        impact: 'High',
        potentialSavings: Math.round(overrunCats.reduce((acc, c) => acc + (c.actualSpent - c.budgetLimit), 0)),
        recommendation: `Categories [${overrunCats.map(c => c.name).join(', ')}] have exceeded their monthly allocated limits. Review expense authorization limits.`,
        icon: '🚨',
        actionLabel: 'Inspect Budgets',
      });
    }

    // 5. Overall Profitability Margin Health
    if (grossRev > 0) {
      if (margin < 15) {
        insights.push({
          id: 'opt-margin-low',
          category: '📈 Profit Margin',
          title: 'Net Margin Below 15% Target',
          type: 'warning',
          impact: 'High',
          potentialSavings: Math.round(totalExp * 0.08),
          recommendation: `Operating net margin is ${margin}%. Boosting premium services (Express 12h, Silk & Heavy Blankets) and optimizing fixed facility overhead can push margins to 25%+.`,
          icon: '💡',
          actionLabel: 'Boost Premium Intake',
        });
      } else {
        insights.push({
          id: 'opt-margin-healthy',
          category: '📈 Profit Margin',
          title: 'Strong Operating Margin Performance',
          type: 'success',
          impact: 'Positive',
          potentialSavings: 0,
          recommendation: `Operating margin is healthy at ${margin}%. Centralized processing at Manikonda plant is effectively scaling profit across all 3 counters.`,
          icon: '🏆',
        });
      }
    }

    return insights;
  },

  // ─────────────────────────────────────────────────────────────
  // EXPENSES LEDGER CRUD
  // ─────────────────────────────────────────────────────────────

  /**
   * Fetch all Expense ledger entries (with optional month, year & branch filter)
   */
  async getExpenses({ year = null, month = null, branchFilter = 'ALL', categoryId = null } = {}) {
    let list = [];

    if (isFirebaseConfigured && db) {
      try {
        const colRef = collection(db, 'expenses');
        const snap = await getDocs(colRef);
        list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      } catch (e) {
        console.warn('Could not fetch expenses from Firebase:', e);
      }
    }

    if (!list || list.length === 0) {
      try {
        const local = localStorage.getItem(EXPENSES_STORAGE_KEY);
        if (local) {
          list = JSON.parse(local);
        } else {
          list = INITIAL_SAMPLE_EXPENSES;
          localStorage.setItem(EXPENSES_STORAGE_KEY, JSON.stringify(list));
        }
      } catch (e) {
        list = INITIAL_SAMPLE_EXPENSES;
      }
    }

    // Filter by year & month if provided
    if (year !== null) {
      list = list.filter(exp => {
        const d = parseOrderDateSafe(exp.date || exp.createdAt);
        if (!d) return true;
        const matchesYear = d.getFullYear() === Number(year);
        const matchesMonth = month === null || month === 'ALL' || d.getMonth() === Number(month);
        return matchesYear && matchesMonth;
      });
    }

    // Filter by branch
    if (branchFilter && branchFilter !== 'ALL') {
      list = list.filter(exp => exp.branchId === branchFilter || exp.branchId === 'ALL' || !exp.branchId);
    }

    // Filter by category
    if (categoryId && categoryId !== 'ALL') {
      list = list.filter(exp => exp.categoryId === categoryId);
    }

    // Sort descending by date
    return list.sort((a, b) => {
      const dA = new Date(a.date || a.createdAt || 0).getTime();
      const dB = new Date(b.date || b.createdAt || 0).getTime();
      return dB - dA;
    });
  },

  /**
   * Add a new Expense Entry to Ledger
   */
  async addExpense(expenseData) {
    const id = expenseData.id || `exp-${Date.now()}`;
    const gstRate = Number(expenseData.gstRate) || 0;
    const amount = Math.max(0, Number(expenseData.amount) || 0);
    const gstAmount = expenseData.gstAmount !== undefined 
      ? Number(expenseData.gstAmount) 
      : (gstRate > 0 ? Math.round((amount * gstRate / (100 + gstRate)) * 100) / 100 : 0);

    const payload = {
      ...expenseData,
      id,
      date: expenseData.date || new Date().toISOString().split('T')[0],
      amount,
      unitsCount: Number(expenseData.unitsCount) || 1,
      unitRate: Number(expenseData.unitRate) || Number(expenseData.amount) || 0,
      unitType: expenseData.unitType || 'unit',
      categoryName: expenseData.categoryName || 'Expense',
      categoryId: expenseData.categoryId || 'misc',
      icon: expenseData.icon || '💸',
      categoryGroup: expenseData.categoryGroup || 'General Expenses',
      branchId: expenseData.branchId || 'ALL',
      branchName: expenseData.branchName || 'All Branches',
      paymentMode: expenseData.paymentMode || 'CASH',
      paymentReference: expenseData.paymentReference || '',
      vendorName: expenseData.vendorName || '',
      vendorGstin: expenseData.vendorGstin || '',
      invoiceNumber: expenseData.invoiceNumber || '',
      gstRate,
      gstAmount,
      taxableAmount: Math.max(0, amount - gstAmount),
      isGstClaimable: expenseData.isGstClaimable !== undefined ? Boolean(expenseData.isGstClaimable) : Boolean(expenseData.vendorGstin),
      receiptAttachmentUrl: expenseData.receiptAttachmentUrl || '',
      notes: expenseData.notes || '',
      createdAt: expenseData.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (isFirebaseConfigured && db) {
      try {
        await setDoc(doc(db, 'expenses', id), payload, { merge: true });
      } catch (e) {
        console.warn('Could not save expense to Firebase:', e);
      }
    }

    // Save to localStorage cache
    try {
      const all = await this.getExpenses();
      const updated = [payload, ...all.filter(e => e.id !== id)];
      localStorage.setItem(EXPENSES_STORAGE_KEY, JSON.stringify(updated));
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('techwash-expenses-updated', { detail: payload }));
      }
    } catch (e) {}

    return payload;
  },

  /**
   * Update an existing expense entry
   */
  async updateExpense(id, updates) {
    const gstRate = updates.gstRate !== undefined ? Number(updates.gstRate) : undefined;
    const amount = updates.amount !== undefined ? Math.max(0, Number(updates.amount)) : undefined;

    let gstAmount = updates.gstAmount;
    if (gstAmount === undefined && gstRate !== undefined && amount !== undefined) {
      gstAmount = gstRate > 0 ? Math.round((amount * gstRate / (100 + gstRate)) * 100) / 100 : 0;
    }

    const payload = {
      ...updates,
      id,
      ...(amount !== undefined && { amount }),
      ...(gstRate !== undefined && { gstRate }),
      ...(gstAmount !== undefined && { gstAmount, taxableAmount: Math.max(0, (amount || 0) - gstAmount) }),
      updatedAt: new Date().toISOString(),
    };

    if (isFirebaseConfigured && db) {
      try {
        await setDoc(doc(db, 'expenses', id), payload, { merge: true });
      } catch (e) {
        console.warn('Could not update expense in Firebase:', e);
      }
    }

    try {
      const all = await this.getExpenses();
      const idx = all.findIndex(e => e.id === id);
      if (idx >= 0) {
        all[idx] = { ...all[idx], ...payload };
        localStorage.setItem(EXPENSES_STORAGE_KEY, JSON.stringify(all));
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('techwash-expenses-updated', { detail: all[idx] }));
        }
      }
    } catch (e) {}

    return payload;
  },

  /**
   * Delete an expense entry
   */
  async deleteExpense(id) {
    if (isFirebaseConfigured && db) {
      try {
        await deleteDoc(doc(db, 'expenses', id));
      } catch (e) {
        console.warn('Could not delete expense from Firebase:', e);
      }
    }

    try {
      const all = await this.getExpenses();
      const filtered = all.filter(e => e.id !== id);
      localStorage.setItem(EXPENSES_STORAGE_KEY, JSON.stringify(filtered));
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('techwash-expenses-updated', { detail: { id, deleted: true } }));
      }
    } catch (e) {}

    return true;
  },

  /**
   * Comprehensive Monthly Profit & Loss (P&L) Reconciliation
   * Reconciles Gross Revenue (Orders & POS) with All Logged & Operational Expenses
   */
  async getMonthlyPnL({ year = new Date().getFullYear(), month = new Date().getMonth(), branchFilter = 'ALL' } = {}) {
    const parsedYear = Number(year);
    const parsedMonth = Number(month);

    // 1. Fetch all orders for this month to calculate Gross Revenue & Volumes
    const allOrders = await orderService.getOrders({ limitCount: 5000 });
    
    const monthOrders = allOrders.filter(order => {
      const d = parseOrderDateSafe(order.createdAt || order.pickupDate);
      if (!d) return false;
      const isMatch = d.getFullYear() === parsedYear && d.getMonth() === parsedMonth;
      if (!isMatch) return false;

      if (branchFilter && branchFilter !== 'ALL') {
        const oBranch = order.terminalId || order.terminalCode || order.storeBranch || '';
        return oBranch.includes(branchFilter) || order.branchId === branchFilter;
      }
      return true;
    });

    // Gross Revenue & Order Volumes
    let grossRevenue = 0;
    let totalCashReceived = 0;
    let totalUpiReceived = 0;
    let totalCardReceived = 0;
    let totalBalanceDue = 0;
    let totalOrdersCount = monthOrders.length;
    let totalProcessedKg = 0;
    let totalItemizedPieces = 0;

    monthOrders.forEach(ord => {
      const finalAmt = Number(ord.finalPrice || ord.totalAmount || ord.priceSnapshot?.finalTotal || 0);
      grossRevenue += finalAmt;

      const received = Number(ord.receivedAmount !== undefined 
        ? ord.receivedAmount 
        : (ord.paymentStatus === 'PAID' ? finalAmt : 0));
      
      const pMode = ord.paymentMethod || 'CASH';
      if (pMode === 'CASH') totalCashReceived += received;
      else if (pMode === 'UPI_QR' || pMode === 'UPI' || pMode === 'ONLINE') totalUpiReceived += received;
      else if (pMode === 'CARD') totalCardReceived += received;

      const bal = Number(ord.balanceAmount !== undefined ? ord.balanceAmount : Math.max(0, finalAmt - received));
      totalBalanceDue += bal;

      // Volumes
      const wt = Number(ord.actualWeight || ord.estimatedWeightKg || ord.weightKg || 0);
      totalProcessedKg += wt;

      const pcs = (ord.items || []).reduce((acc, it) => acc + (Number(it.quantity) || 1), 0);
      totalItemizedPieces += pcs;
    });

    // 2. Fetch all expenses logged for this month
    const monthExpenses = await this.getExpenses({ year: parsedYear, month: parsedMonth, branchFilter });

    // Group expenses by category
    const categoryBreakdownMap = new Map();
    let totalOperatingExpenses = 0;

    monthExpenses.forEach(exp => {
      const amt = Number(exp.amount) || 0;
      totalOperatingExpenses += amt;

      const catKey = exp.categoryId || 'misc';
      if (!categoryBreakdownMap.has(catKey)) {
        categoryBreakdownMap.set(catKey, {
          categoryId: catKey,
          categoryName: exp.categoryName || 'Expense',
          icon: exp.icon || '💸',
          categoryGroup: exp.categoryGroup || 'General Expenses',
          totalAmount: 0,
          entriesCount: 0,
          entries: [],
        });
      }
      const existing = categoryBreakdownMap.get(catKey);
      existing.totalAmount += amt;
      existing.entriesCount += 1;
      existing.entries.push(exp);
    });

    const categoryBreakdown = Array.from(categoryBreakdownMap.values()).map(cat => ({
      ...cat,
      percentageOfExpenses: totalOperatingExpenses > 0 ? Number(((cat.totalAmount / totalOperatingExpenses) * 100).toFixed(1)) : 0,
      percentageOfRevenue: grossRevenue > 0 ? Number(((cat.totalAmount / grossRevenue) * 100).toFixed(1)) : 0,
    })).sort((a, b) => b.totalAmount - a.totalAmount);

    // 3. Profitability Calculations
    const netOperatingProfit = grossRevenue - totalOperatingExpenses;
    const profitMarginPercentage = grossRevenue > 0 ? Number(((netOperatingProfit / grossRevenue) * 100).toFixed(2)) : 0;
    const isProfitable = netOperatingProfit >= 0;

    // Unit Economics
    const avgRevenuePerOrder = totalOrdersCount > 0 ? Math.round(grossRevenue / totalOrdersCount) : 0;
    const avgExpensePerOrder = totalOrdersCount > 0 ? Math.round(totalOperatingExpenses / totalOrdersCount) : 0;
    const avgProfitPerOrder = totalOrdersCount > 0 ? Math.round(netOperatingProfit / totalOrdersCount) : 0;
    const costPerKgProcessed = totalProcessedKg > 0 ? Number((totalOperatingExpenses / totalProcessedKg).toFixed(2)) : 0;

    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const monthLabel = `${monthNames[parsedMonth]} ${parsedYear}`;

    return {
      year: parsedYear,
      month: parsedMonth,
      monthLabel,
      branchFilter,
      
      // Financial Summary
      grossRevenue,
      totalOperatingExpenses,
      netOperatingProfit,
      profitMarginPercentage,
      isProfitable,

      // Collections & Receivables
      totalCashReceived,
      totalUpiReceived,
      totalCardReceived,
      totalReceivedRevenue: totalCashReceived + totalUpiReceived + totalCardReceived,
      totalBalanceDue,

      // Operating Volumes
      totalOrdersCount,
      totalProcessedKg: Number(totalProcessedKg.toFixed(1)),
      totalItemizedPieces,

      // Unit Economics
      avgRevenuePerOrder,
      avgExpensePerOrder,
      avgProfitPerOrder,
      costPerKgProcessed,

      // Itemized Lists
      categoryBreakdown,
      expensesList: monthExpenses,
      ordersList: monthOrders,
    };
  },

  /**
   * 12-Month Year-to-Date (YTD) Historical Trend for Annual P&L Charting
   */
  async getYearlyPnLSummary(year = new Date().getFullYear(), branchFilter = 'ALL') {
    const parsedYear = Number(year);
    const months = Array.from({ length: 12 }, (_, i) => i);
    const results = [];

    for (const m of months) {
      const pnl = await this.getMonthlyPnL({ year: parsedYear, month: m, branchFilter });
      results.push({
        monthIndex: m,
        monthName: pnl.monthLabel.split(' ')[0],
        monthShort: pnl.monthLabel.split(' ')[0].slice(0, 3),
        grossRevenue: pnl.grossRevenue,
        totalExpenses: pnl.totalOperatingExpenses,
        netProfit: pnl.netOperatingProfit,
        profitMargin: pnl.profitMarginPercentage,
        ordersCount: pnl.totalOrdersCount,
        processedKg: pnl.totalProcessedKg,
      });
    }

    const totalAnnualRevenue = results.reduce((acc, r) => acc + r.grossRevenue, 0);
    const totalAnnualExpenses = results.reduce((acc, r) => acc + r.totalExpenses, 0);
    const totalAnnualNetProfit = totalAnnualRevenue - totalAnnualExpenses;
    const annualMargin = totalAnnualRevenue > 0 ? Number(((totalAnnualNetProfit / totalAnnualRevenue) * 100).toFixed(2)) : 0;

    return {
      year: parsedYear,
      branchFilter,
      monthlyTrends: results,
      totalAnnualRevenue,
      totalAnnualExpenses,
      totalAnnualNetProfit,
      annualMargin,
    };
  },

  /**
   * 3-Branch Comparative Profit & Loss Reconciliation
   * Separates and compares Counter 1 (Main Branch), Counter 2 (Branch 1 - Tolichowki), and Counter 3 (Pick Up Point - Ambience) side-by-side with Consolidated Total
   */
  async getThreeBranchesComparativePnL({ year = new Date().getFullYear(), month = new Date().getMonth() } = {}) {
    const branchDefs = [
      { 
        id: 'counter-1', 
        code: 'TW-POS-01', 
        name: 'Tech Wash Laundry Main Branch', 
        counterName: 'Counter 1 — Main Branch (Shaikpet / Manikonda)', 
        shortName: 'Main Branch (Manikonda)', 
        address: 'Shaikpet Main Rd, Sri Ram Nagar Colony, Manikonda, Hyderabad, Telangana 500089',
        phone: '+91 63048 45567',
        color: 'emerald' 
      },
      { 
        id: 'counter-2', 
        code: 'TW-POS-02', 
        name: 'Tech Wash Laundry Services (Branch 1)', 
        counterName: 'Counter 2 — Branch 1 (Tolichowki / OU Colony)', 
        shortName: 'Branch 1 (Tolichowki / OU Colony)', 
        address: 'Beside Dreamscape hotel Ward No 8, Block No 1, tolichowki, OU Colony, Shaikpet, Hyderabad, Telangana 500008',
        phone: '+91 90008 13444',
        color: 'amber' 
      },
      { 
        id: 'counter-3', 
        code: 'TW-POS-03', 
        name: 'Tech Wash Pick Up Point', 
        counterName: 'Counter 3 — Pick Up Point (Ambience Courtyard)', 
        shortName: 'Pick Up Point (Ambience Courtyard)', 
        address: 'Beside Ambience Courtyard, Hyderabad, Telangana, 500089',
        phone: '+91 63048 45567',
        color: 'purple' 
      },
    ];

    const [consolidated, branch1, branch2, branch3] = await Promise.all([
      this.getMonthlyPnL({ year, month, branchFilter: 'ALL' }),
      this.getMonthlyPnL({ year, month, branchFilter: 'counter-1' }),
      this.getMonthlyPnL({ year, month, branchFilter: 'counter-2' }),
      this.getMonthlyPnL({ year, month, branchFilter: 'counter-3' }),
    ]);

    const branchesPnL = [
      { ...branchDefs[0], pnl: branch1 },
      { ...branchDefs[1], pnl: branch2 },
      { ...branchDefs[2], pnl: branch3 },
    ];

    // Compute share percentages
    const totalRev = consolidated.grossRevenue || 1;
    const totalExp = consolidated.totalOperatingExpenses || 1;

    branchesPnL.forEach(b => {
      b.revenueShare = Number(((b.pnl.grossRevenue / totalRev) * 100).toFixed(1));
      b.expenseShare = Number(((b.pnl.totalOperatingExpenses / totalExp) * 100).toFixed(1));
    });

    // Determine top performing branch
    const topBranch = [...branchesPnL].sort((a, b) => b.pnl.netOperatingProfit - a.pnl.netOperatingProfit)[0];

    return {
      year,
      month,
      monthLabel: consolidated.monthLabel,
      consolidated,
      branches: branchesPnL,
      topBranch,
      branch1,
      branch2,
      branch3,
    };
  },
};

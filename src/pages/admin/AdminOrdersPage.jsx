import React, { useState, useEffect, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { orderService, getOrderBranchKey, ORDER_CUSTOMER_STAGES, INTERNAL_OPERATIONAL_STAGES } from '../../services/orderService';
import { staffService } from '../../services/staffService';
import { auditService } from '../../services/auditService';
import { whatsappNotificationService } from '../../services/whatsappNotificationService';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { formatCurrency, formatDate, formatDateTime } from '../../utils/formatters';
import { AdminPageHeader } from '../../components/admin/AdminPageHeader';
import { Table } from '../../components/ui/Table';
import { Button } from '../../components/ui/Button';
import { Input, Textarea, Select } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { Badge } from '../../components/ui/Badge';
import { StatusBadge } from '../../components/admin/StatusBadge';
import { OrderMapCard } from '../../components/location/OrderMapCard';
import { ReceiptModal } from '../../components/receipt/ReceiptModal';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { 
  ShoppingBag, 
  Search, 
  Download, 
  Printer, 
  Edit3, 
  CheckCircle2, 
  Clock, 
  Truck, 
  User, 
  Phone,
  MessageSquare,
  FileText,
  MapPin,
  ExternalLink,
  Scale,
  DollarSign,
  Send,
  Navigation,
  Bike,
  UserCheck,
  Sparkles,
  Trash2,
  Plus,
  Minus,
  Receipt,
  Store,
  Tag,
  Percent,
  Check,
  Zap,
  Layers,
  Wrench,
  HelpCircle,
  FolderPlus
} from 'lucide-react';

export const WALK_IN_SERVICES = [
  { id: 'srv-dry-cleaning', name: 'Premium Dry Cleaning', emoji: '👔', defaultPrice: 90 },
  { id: 'srv-wash-and-fold', name: 'Wash & Fold', emoji: '🧺', defaultPrice: 100, perKg: true },
  { id: 'srv-wash-and-iron', name: 'Wash & Steam Iron', emoji: '👕', defaultPrice: 130, perKg: true },
  { id: 'srv-steam-ironing', name: 'Steam Ironing Only', emoji: '✨', defaultPrice: 25 },
  { id: 'srv-saree-spa', name: 'Sarees & Ethnic Spa', emoji: '🥻', defaultPrice: 60 },
  { id: 'srv-shoe-spa', name: 'Shoe & Sneaker Spa', emoji: '👟', defaultPrice: 350 },
  { id: 'srv-curtain-spa', name: 'Curtain Service', emoji: '🪟', defaultPrice: 200 },
  { id: 'srv-starch-and-iron', name: 'Starch & Finishing', emoji: '🌾', defaultPrice: 45 },
];

export const POS_CATEGORIES = [
  { key: 'ALL', label: 'All Items', emoji: '✨' },
  { key: 'MEN', label: "Men's Wear", emoji: '👔' },
  { key: 'WOMEN', label: "Women's Wear", emoji: '👗' },
  { key: 'SAREES_ETHNIC', label: 'Sarees & Ethnic', emoji: '🥻' },
  { key: 'STEAM_IRONING', label: 'Steam Ironing', emoji: '♨️' },
  { key: 'HOUSEHOLD', label: 'Home & Linens', emoji: '🏠' },
  { key: 'FOOTWEAR_BAGS', label: 'Shoes & Bags', emoji: '👟' },
  { key: 'STARCH_FINISHING', label: 'Starch & Iron', emoji: '🌾' },
  { key: 'KIDS', label: 'Kids & Baby', emoji: '👶' },
  { key: 'EXTRA_SERVICES', label: 'Custom & Extra Charges', emoji: '⚙️' },
];

export const MASTER_CATALOG_ITEMS = [
  // ── MEN'S WEAR (DRY CLEAN / CARE) ──
  { id: 'm-1', name: 'Cotton Shirt', price: 90, emoji: '👔', categoryKey: 'MEN', categoryName: "Men's Tops" },
  { id: 'm-2', name: 'Shirt with Starch', price: 100, emoji: '👔', categoryKey: 'MEN', categoryName: "Men's Tops" },
  { id: 'm-3', name: 'T-Shirt / Polo', price: 90, emoji: '👕', categoryKey: 'MEN', categoryName: "Men's Tops" },
  { id: 'm-4', name: 'Silk Shirt', price: 90, emoji: '👔', categoryKey: 'MEN', categoryName: "Men's Tops" },
  { id: 'm-5', name: 'Jeans / Denim', price: 90, emoji: '👖', categoryKey: 'MEN', categoryName: "Men's Bottoms" },
  { id: 'm-6', name: 'Cotton Trouser / Pant', price: 90, emoji: '👖', categoryKey: 'MEN', categoryName: "Men's Bottoms" },
  { id: 'm-7', name: 'Trouser with Starch', price: 100, emoji: '👖', categoryKey: 'MEN', categoryName: "Men's Bottoms" },
  { id: 'm-8', name: 'Shorts / Bermudas', price: 60, emoji: '🩳', categoryKey: 'MEN', categoryName: "Men's Bottoms" },
  { id: 'm-9', name: 'Trackpant', price: 90, emoji: '👖', categoryKey: 'MEN', categoryName: "Men's Bottoms" },
  { id: 'm-10', name: 'Pyjama', price: 90, emoji: '🩳', categoryKey: 'MEN', categoryName: "Men's Bottoms" },
  { id: 'm-11', name: 'Cotton Kurta', price: 120, emoji: '👘', categoryKey: 'MEN', categoryName: "Ethnic" },
  { id: 'm-12', name: 'Kurta Medium Worked', price: 150, emoji: '👘', categoryKey: 'MEN', categoryName: "Ethnic" },
  { id: 'm-13', name: 'Kurta Long / Heavy Worked', price: 180, emoji: '👘', categoryKey: 'MEN', categoryName: "Ethnic" },
  { id: 'm-14', name: 'Sherwani / Bandgala', price: 250, emoji: '🧥', categoryKey: 'MEN', categoryName: "Suits & Outerwear" },
  { id: 'm-15', name: 'Blazer / Sports Coat', price: 250, emoji: '🧥', categoryKey: 'MEN', categoryName: "Suits & Outerwear" },
  { id: 'm-16', name: '2-Piece Formal Suit', price: 350, emoji: '🤵', categoryKey: 'MEN', categoryName: "Suits & Outerwear" },
  { id: 'm-17', name: '3-Piece Designer Suit', price: 450, emoji: '🧥', categoryKey: 'MEN', categoryName: "Suits & Outerwear" },
  { id: 'm-18', name: 'Jacket - Normal', price: 200, emoji: '🧥', categoryKey: 'MEN', categoryName: "Suits & Outerwear" },
  { id: 'm-19', name: 'Jacket - Leather / Heavy Winter', price: 300, emoji: '🧥', categoryKey: 'MEN', categoryName: "Suits & Outerwear" },
  { id: 'm-20', name: 'Pullover / Sweater', price: 120, emoji: '🧶', categoryKey: 'MEN', categoryName: "Suits & Outerwear" },
  { id: 'm-21', name: 'Waist Coat', price: 90, emoji: '🦺', categoryKey: 'MEN', categoryName: "Suits & Outerwear" },
  { id: 'm-22', name: 'Neck Tie', price: 40, emoji: '👔', categoryKey: 'MEN', categoryName: "Accessories" },
  { id: 'm-23', name: 'Silk Dhoti', price: 140, emoji: '🥻', categoryKey: 'MEN', categoryName: "Ethnic" },
  { id: 'm-24', name: 'Silk Kanduva / Angavastram', price: 100, emoji: '🧣', categoryKey: 'MEN', categoryName: "Ethnic" },
  { id: 'm-25', name: 'Traditional Lungi', price: 80, emoji: '🩲', categoryKey: 'MEN', categoryName: "Ethnic" },
  { id: 'm-26', name: 'Shalu', price: 100, emoji: '🧣', categoryKey: 'MEN', categoryName: "Ethnic" },
  { id: 'm-27', name: 'Apron White', price: 60, emoji: '🥼', categoryKey: 'MEN', categoryName: "Workwear" },

  // ── WOMEN'S WEAR ──
  { id: 'w-1', name: 'Normal Top / Tunic', price: 120, emoji: '👚', categoryKey: 'WOMEN', categoryName: "Women's Tops" },
  { id: 'w-2', name: 'Medium Top / Kurti', price: 140, emoji: '👚', categoryKey: 'WOMEN', categoryName: "Women's Tops" },
  { id: 'w-3', name: 'Long Top / Anarkali', price: 180, emoji: '👚', categoryKey: 'WOMEN', categoryName: "Women's Tops" },
  { id: 'w-4', name: 'Worked / Embroidered Top', price: 220, emoji: '✨', categoryKey: 'WOMEN', categoryName: "Women's Tops" },
  { id: 'w-5', name: 'Slack Pant / Leggings', price: 80, emoji: '👖', categoryKey: 'WOMEN', categoryName: "Women's Bottoms" },
  { id: 'w-6', name: 'Lehanga Bottom', price: 200, emoji: '👗', categoryKey: 'WOMEN', categoryName: "Women's Bottoms" },
  { id: 'w-7', name: 'Petticoat / Inskirt', price: 50, emoji: '👗', categoryKey: 'WOMEN', categoryName: "Women's Bottoms" },
  { id: 'w-8', name: 'Dupatta Short', price: 50, emoji: '🧣', categoryKey: 'WOMEN', categoryName: "Ethnic" },
  { id: 'w-9', name: 'Dupatta Long', price: 70, emoji: '🧣', categoryKey: 'WOMEN', categoryName: "Ethnic" },
  { id: 'w-10', name: 'Dupatta Heavy Worked', price: 100, emoji: '✨', categoryKey: 'WOMEN', categoryName: "Ethnic" },
  { id: 'w-11', name: 'Saree (Daily / Georgette / Chiffon)', price: 220, emoji: '🥻', categoryKey: 'WOMEN', categoryName: "Sarees" },
  { id: 'w-12', name: 'Saree Worked / Zari / Stone', price: 250, emoji: '✨', categoryKey: 'WOMEN', categoryName: "Sarees" },
  { id: 'w-13', name: 'Saree Blouse Plain', price: 60, emoji: '👚', categoryKey: 'WOMEN', categoryName: "Sarees" },
  { id: 'w-14', name: 'Saree Blouse Designer / Worked', price: 70, emoji: '✨', categoryKey: 'WOMEN', categoryName: "Sarees" },
  { id: 'w-15', name: 'Pattu Saree Original (>10K)', price: 900, emoji: '👑', categoryKey: 'WOMEN', categoryName: "Luxury Silk" },
  { id: 'w-16', name: 'Western Skirt', price: 100, emoji: '👗', categoryKey: 'WOMEN', categoryName: "Dresses" },
  { id: 'w-17', name: 'Pullover / Sweater (Women)', price: 100, emoji: '🧶', categoryKey: 'WOMEN', categoryName: "Outerwear" },
  { id: 'w-18', name: 'Nighties / Sleepwear', price: 90, emoji: '👗', categoryKey: 'WOMEN', categoryName: "Dresses" },
  { id: 'w-19', name: 'Gown / Evening Dress', price: 280, emoji: '👗', categoryKey: 'WOMEN', categoryName: "Couture" },
  { id: 'w-20', name: 'Bridal Lehanga Heavy Set', price: 550, emoji: '👑', categoryKey: 'WOMEN', categoryName: "Couture" },

  // ── STEAM IRONING ONLY (PER ITEM) ──
  { id: 'st-1', name: 'Shirt Steam Ironing', price: 25, emoji: '👔', categoryKey: 'STEAM_IRONING', categoryName: "Steam Press" },
  { id: 'st-2', name: 'Trouser / Pant Steam Ironing', price: 25, emoji: '👖', categoryKey: 'STEAM_IRONING', categoryName: "Steam Press" },
  { id: 'st-3', name: 'T-Shirt / Polo Steam Ironing', price: 20, emoji: '👕', categoryKey: 'STEAM_IRONING', categoryName: "Steam Press" },
  { id: 'st-4', name: 'Cotton Kurta Steam Press', price: 30, emoji: '👘', categoryKey: 'STEAM_IRONING', categoryName: "Steam Press" },
  { id: 'st-5', name: 'Saree Steam Ironing Only', price: 60, emoji: '🥻', categoryKey: 'STEAM_IRONING', categoryName: "Steam Press" },
  { id: 'st-6', name: 'Saree Blouse Steam Iron', price: 20, emoji: '👚', categoryKey: 'STEAM_IRONING', categoryName: "Steam Press" },
  { id: 'st-7', name: 'Silk Dhoti Steam Press', price: 40, emoji: '🥻', categoryKey: 'STEAM_IRONING', categoryName: "Steam Press" },
  { id: 'st-8', name: 'Dupatta / Chunni Steam Press', price: 25, emoji: '🧣', categoryKey: 'STEAM_IRONING', categoryName: "Steam Press" },
  { id: 'st-9', name: 'Blazer / Coat Steam Press', price: 90, emoji: '🧥', categoryKey: 'STEAM_IRONING', categoryName: "Steam Press" },
  { id: 'st-10', name: '2-Piece Suit Steam Press', price: 120, emoji: '🤵', categoryKey: 'STEAM_IRONING', categoryName: "Steam Press" },
  { id: 'st-11', name: 'Single Bedsheet Steam Press', price: 40, emoji: '🛏️', categoryKey: 'STEAM_IRONING', categoryName: "Steam Press" },
  { id: 'st-12', name: 'Double / King Bedsheet Steam Press', price: 60, emoji: '🛌', categoryKey: 'STEAM_IRONING', categoryName: "Steam Press" },
  { id: 'st-13', name: 'Kids Dress / Uniform Steam Press', price: 20, emoji: '👗', categoryKey: 'STEAM_IRONING', categoryName: "Steam Press" },

  // ── KIDS WEAR ──
  { id: 'k-1', name: 'Kids Frock / Dress', price: 60, emoji: '👗', categoryKey: 'KIDS', categoryName: "Kids" },
  { id: 'k-2', name: 'Kids Shirt', price: 70, emoji: '👕', categoryKey: 'KIDS', categoryName: "Kids" },
  { id: 'k-3', name: 'Kids Pant / Shorts', price: 70, emoji: '👖', categoryKey: 'KIDS', categoryName: "Kids" },
  { id: 'k-4', name: 'Kids Dhoti / Pyjama', price: 90, emoji: '🥻', categoryKey: 'KIDS', categoryName: "Kids" },
  { id: 'k-5', name: 'Soft Toys - Small', price: 100, emoji: '🧸', categoryKey: 'KIDS', categoryName: "Toys" },
  { id: 'k-6', name: 'Soft Toys - Medium', price: 150, emoji: '🧸', categoryKey: 'KIDS', categoryName: "Toys" },
  { id: 'k-7', name: 'Soft Toys - Large Giant', price: 200, emoji: '🧸', categoryKey: 'KIDS', categoryName: "Toys" },
  { id: 'k-8', name: 'Kids School Uniform Set', price: 120, emoji: '🎒', categoryKey: 'KIDS', categoryName: "Kids" },

  // ── SAREES & ETHNIC SPA ──
  { id: 'e-1', name: 'Pattu Saree Original (>10K Hydrocarbon)', price: 900, emoji: '👑', categoryKey: 'SAREES_ETHNIC', categoryName: "Luxury Silk" },
  { id: 'e-2', name: 'Silk Saree (Kanchipuram / Banarasi / Pattu)', price: 220, emoji: '🥻', categoryKey: 'SAREES_ETHNIC', categoryName: "Silk Sarees" },
  { id: 'e-3', name: 'Saree with Heavy Zari / Stone Embroidery', price: 250, emoji: '✨', categoryKey: 'SAREES_ETHNIC', categoryName: "Designer Sarees" },
  { id: 'e-4', name: 'Saree Rolling & Polishing', price: 150, emoji: '🥻', categoryKey: 'SAREES_ETHNIC', categoryName: "Saree Rolling" },
  { id: 'e-5', name: 'Saree Steam Ironing Only', price: 60, emoji: '🥻', categoryKey: 'SAREES_ETHNIC', categoryName: "Steam Press" },
  { id: 'e-6', name: 'Cotton Saree Starch & Steam Iron', price: 80, emoji: '🌾', categoryKey: 'SAREES_ETHNIC', categoryName: "Starch & Iron" },
  { id: 'e-7', name: 'Designer Saree Blouse (Padded/Worked)', price: 70, emoji: '👚', categoryKey: 'SAREES_ETHNIC', categoryName: "Blouses" },
  { id: 'e-8', name: 'Silk Dhoti & Kanduva Set', price: 240, emoji: '🥻', categoryKey: 'SAREES_ETHNIC', categoryName: "Men Ethnic" },
  { id: 'e-9', name: 'Sherwani / Brocade Bandgala', price: 250, emoji: '🧥', categoryKey: 'SAREES_ETHNIC', categoryName: "Occasion" },
  { id: 'e-10', name: 'Men Silk / Heavy Kurta', price: 180, emoji: '👘', categoryKey: 'SAREES_ETHNIC', categoryName: "Men Ethnic" },
  { id: 'e-11', name: 'Bridal Lehanga Set (Heavy Zari)', price: 550, emoji: '👑', categoryKey: 'SAREES_ETHNIC', categoryName: "Bridal" },

  // ── HOUSEHOLD & LINENS ──
  { id: 'h-1', name: 'Single Bedsheet', price: 150, emoji: '🛏️', categoryKey: 'HOUSEHOLD', categoryName: "Bedding" },
  { id: 'h-2', name: 'Double / King Bedsheet + 2 Pillow Covers', price: 220, emoji: '🛌', categoryKey: 'HOUSEHOLD', categoryName: "Bedding" },
  { id: 'h-3', name: 'Pillow Cover (Pair)', price: 40, emoji: '🛋️', categoryKey: 'HOUSEHOLD', categoryName: "Bedding" },
  { id: 'h-4', name: 'Single Blanket / Dohar / Comforter', price: 200, emoji: '🛋️', categoryKey: 'HOUSEHOLD', categoryName: "Blankets" },
  { id: 'h-5', name: 'Double Heavy Quilt / Razai', price: 350, emoji: '🛋️', categoryKey: 'HOUSEHOLD', categoryName: "Quilts" },
  { id: 'h-6', name: 'Cotton Table Cloth', price: 80, emoji: '🍽️', categoryKey: 'HOUSEHOLD', categoryName: "Linens" },
  { id: 'c-dc', name: 'Curtain Dry Cleaning', price: 200, emoji: '🧺', categoryKey: 'HOUSEHOLD', categoryName: "Curtains", serviceName: "Curtain Service", subServiceName: "Dry Cleaning" },
  { id: 'c-wi', name: 'Curtain Wash & Iron', price: 150, emoji: '🫧', categoryKey: 'HOUSEHOLD', categoryName: "Curtains", serviceName: "Curtain Service", subServiceName: "Wash and Iron" },
  { id: 'c-ir', name: 'Curtain Iron', price: 60, emoji: '✨', categoryKey: 'HOUSEHOLD', categoryName: "Curtains", serviceName: "Curtain Service", subServiceName: "Iron" },
  { id: 'c-wf', name: 'Curtain Wash & Fold', price: 100, emoji: '👕', categoryKey: 'HOUSEHOLD', categoryName: "Curtains", serviceName: "Curtain Service", subServiceName: "Wash and Fold" },
  { id: 'h-11', name: 'Living Room Carpet / Wool Rug Spa', price: 450, emoji: '🧶', categoryKey: 'HOUSEHOLD', categoryName: "Carpets" },

  // ── FOOTWEAR & BAGS ──
  { id: 'f-1', name: 'Sneakers & Casual Shoes Spa', price: 350, emoji: '👟', categoryKey: 'FOOTWEAR_BAGS', categoryName: "Shoes" },
  { id: 'f-2', name: 'Sports & Running Shoes Spa', price: 350, emoji: '🏃', categoryKey: 'FOOTWEAR_BAGS', categoryName: "Shoes" },
  { id: 'f-3', name: 'Formal Leather Shoes Nourish & Shine', price: 350, emoji: '👞', categoryKey: 'FOOTWEAR_BAGS', categoryName: "Shoes" },
  { id: 'f-4', name: 'Suede Boots & Loafers Restoration', price: 399, emoji: '🥾', categoryKey: 'FOOTWEAR_BAGS', categoryName: "Shoes" },
  { id: 'f-5', name: 'School / College Backpack Spa', price: 150, emoji: '🎒', categoryKey: 'FOOTWEAR_BAGS', categoryName: "Bags" },
  { id: 'f-6', name: 'Leather / Designer Handbag Conditioning', price: 250, emoji: '👜', categoryKey: 'FOOTWEAR_BAGS', categoryName: "Bags" },
  { id: 'f-7', name: 'Travel Duffel / Trolley Bag Cleanse', price: 299, emoji: '🧳', categoryKey: 'FOOTWEAR_BAGS', categoryName: "Bags" },

  // ── STARCH & FINISHING ──
  { id: 's-1', name: 'Cotton Shirt (Starch & Iron)', price: 45, emoji: '👔', categoryKey: 'STARCH_FINISHING', categoryName: "Starch" },
  { id: 's-2', name: 'Khadi / Linen Shirt Starch', price: 50, emoji: '👔', categoryKey: 'STARCH_FINISHING', categoryName: "Starch" },
  { id: 's-3', name: 'Cotton Kurta (Starch & Iron)', price: 60, emoji: '👘', categoryKey: 'STARCH_FINISHING', categoryName: "Starch" },
  { id: 's-4', name: 'Cotton Dhoti / Lungi Starch', price: 50, emoji: '🥻', categoryKey: 'STARCH_FINISHING', categoryName: "Starch" },
  { id: 's-5', name: 'Cotton Saree (Starch & Iron)', price: 80, emoji: '🥻', categoryKey: 'STARCH_FINISHING', categoryName: "Starch" },
  { id: 's-6', name: 'Silk Cotton Saree Starch & Polish', price: 90, emoji: '✨', categoryKey: 'STARCH_FINISHING', categoryName: "Starch" },
  { id: 's-7', name: 'Cotton Dupatta / Chunni Starch', price: 30, emoji: '🧣', categoryKey: 'STARCH_FINISHING', categoryName: "Starch" },
  { id: 's-8', name: 'Cotton Kurti / Top Starch', price: 40, emoji: '👚', categoryKey: 'STARCH_FINISHING', categoryName: "Starch" },
  { id: 's-9', name: 'Chef / White Apron Starch', price: 50, emoji: '🥼', categoryKey: 'STARCH_FINISHING', categoryName: "Starch" },
  { id: 's-10', name: 'Cotton Table Cloth Starch', price: 60, emoji: '🍽️', categoryKey: 'STARCH_FINISHING', categoryName: "Starch" },
  { id: 's-11', name: 'Cotton Bedsheet Starch', price: 90, emoji: '🛏️', categoryKey: 'STARCH_FINISHING', categoryName: "Starch" },

  // ── EXTRA CHARGES & CUSTOM SERVICES ──
  { id: 'ex-1', name: 'Urgent Heavy Stain Removal Treatment', price: 100, emoji: '🧼', categoryKey: 'EXTRA_SERVICES', categoryName: "Special Care" },
  { id: 'ex-2', name: 'Gold/Silver Zari Polishing & Shield', price: 150, emoji: '✨', categoryKey: 'EXTRA_SERVICES', categoryName: "Special Care" },
  { id: 'ex-3', name: 'Zip Replacement & Minor Tailoring Alteration', price: 80, emoji: '🪡', categoryKey: 'EXTRA_SERVICES', categoryName: "Alteration" },
  { id: 'ex-4', name: 'Button Stitch & Hemming Repair', price: 40, emoji: '🪡', categoryKey: 'EXTRA_SERVICES', categoryName: "Alteration" },
  { id: 'ex-5', name: 'Luxury Gift Box Packaging & Hanger', price: 50, emoji: '🎁', categoryKey: 'EXTRA_SERVICES', categoryName: "Packing" },
  { id: 'ex-6', name: 'Antiseptic Fabric Sanitization Surcharge', price: 40, emoji: '🛡️', categoryKey: 'EXTRA_SERVICES', categoryName: "Special Care" },
];

export const STORE_BRANCHES = [
  {
    id: 'counter-1',
    code: 'TW-POS-01',
    name: 'Counter 1 — Jubilee Hills Flagship',
    shortName: 'Jubilee Hills Flagship',
    locationName: 'Tech Wash Flagship Lounge — Jubilee Hills',
    address: 'Road No. 36, CBI Colony, Jubilee Hills, Hyderabad',
    phone: '+91 63048 45567',
    cashierName: 'Rahul Verma (Cashier #1)',
    posUrl: '/billing/counter-1',
    reportUrl: '/admin/reports?branch=counter-1',
    themeColor: 'blue',
    gradient: 'from-blue-600 to-indigo-700',
    cardBorder: 'border-blue-200 hover:border-blue-400',
    activeRing: 'ring-2 ring-blue-500 bg-blue-50/70 border-blue-400',
    badgeClass: 'bg-blue-100 text-blue-900 border-blue-200',
    iconBg: 'bg-blue-600 text-white',
  },
  {
    id: 'counter-2',
    code: 'TW-POS-02',
    name: 'Counter 2 — Hitec City Express Hub',
    shortName: 'Hitec City Hub',
    locationName: 'Tech Wash Express Hub — Hitec City',
    address: 'Near Cyber Towers, Madhapur, Hitec City, Hyderabad',
    phone: '+91 63048 45567',
    cashierName: 'Sneha Reddy (Cashier #2)',
    posUrl: '/billing/counter-2',
    reportUrl: '/admin/reports?branch=counter-2',
    themeColor: 'purple',
    gradient: 'from-purple-600 to-violet-700',
    cardBorder: 'border-purple-200 hover:border-purple-400',
    activeRing: 'ring-2 ring-purple-500 bg-purple-50/70 border-purple-400',
    badgeClass: 'bg-purple-100 text-purple-900 border-purple-200',
    iconBg: 'bg-purple-600 text-white',
  },
  {
    id: 'counter-3',
    code: 'TW-POS-03',
    name: 'Counter 3 — Banjara Hills Care Center',
    shortName: 'Banjara Hills Express',
    locationName: 'Tech Wash Care Center — Banjara Hills',
    address: 'Road No. 12, MLA Colony, Banjara Hills, Hyderabad',
    phone: '+91 63048 45567',
    cashierName: 'Vikram Rao (Cashier #3)',
    posUrl: '/billing/counter-3',
    reportUrl: '/admin/reports?branch=counter-3',
    themeColor: 'orange',
    gradient: 'from-orange-600 to-amber-700',
    cardBorder: 'border-orange-200 hover:border-orange-400',
    activeRing: 'ring-2 ring-orange-500 bg-orange-50/70 border-orange-400',
    badgeClass: 'bg-orange-100 text-orange-900 border-orange-200',
    iconBg: 'bg-orange-600 text-white',
  },
];

const INITIAL_WALK_IN_FORM = {
  customerName: '',
  phone: '',
  email: '',
  serviceId: 'srv-dry-cleaning',
  serviceName: 'Premium Dry Cleaning',
  serviceEmoji: '👔',
  pricingType: 'per_item', // 'per_item' | 'per_kg'
  weightKg: '',
  pricePerKg: 100,
  customGrandTotal: '', // Admin override for total bill amount
  items: [],
  expressOption: 'STANDARD', // 'STANDARD' | 'EXPRESS_24' | 'SAME_DAY'
  receivedAmount: '', // empty defaults to full or custom entered
  paymentStatus: 'PAID', // 'PAID' | 'PARTIAL' | 'PENDING'
  paymentMethod: 'CASH', // 'CASH' | 'UPI_QR' | 'CARD' | 'PAY_ON_DELIVERY'
  notes: '',
  internalAdminNotes: 'In-Store Walk-in Customer POS Order',
  terminalId: 'counter-1',
  terminalCode: 'TW-POS-01',
  storeBranch: 'Tech Wash Flagship Lounge — Jubilee Hills',
  cashierName: 'Rahul Verma (Cashier #1)',
  autoOpenReceipt: true,
  autoSendWhatsApp: true,
};

export const AdminOrdersPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { currentUser } = useAuth();
  const { success, error } = useToast();

  // Read initial filter from URL parameters if available
  const initialBranch = searchParams.get('branch') || 'ALL';
  const initialChannel = searchParams.get('channel') || 'ALL';

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [branchFilter, setBranchFilter] = useState(initialBranch); // 'ALL' | 'counter-1' | 'counter-2' | 'counter-3' | 'ONLINE_WEBSITE'
  const [channelFilter, setChannelFilter] = useState(initialChannel); // 'ALL' | 'ONLINE_WEBSITE' | 'OFFLINE_POS'
  const [searchQuery, setSearchQuery] = useState('');
  const [activeOrder, setActiveOrder] = useState(null);
  const [receiptModalOrder, setReceiptModalOrder] = useState(null);
  const [assignModalOrder, setAssignModalOrder] = useState(null);
  const [staffList, setStaffList] = useState([]);
  const [isDispatching, setIsDispatching] = useState(false);
  const [deleteTargetOrder, setDeleteTargetOrder] = useState(null);
  const [isDeletingOrder, setIsDeletingOrder] = useState(false);
  const [showGatewayModal, setShowGatewayModal] = useState(false);
  const [gatewayConfig, setGatewayConfig] = useState(null);
  const [isSavingGateway, setIsSavingGateway] = useState(false);
  const [testPhone, setTestPhone] = useState('');
  const [isTestingGateway, setIsTestingGateway] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  // Sync state with URL params
  const updateBranchFilter = (newBranch) => {
    setBranchFilter(newBranch);
    const nextParams = new URLSearchParams(searchParams);
    if (newBranch && newBranch !== 'ALL') {
      nextParams.set('branch', newBranch);
    } else {
      nextParams.delete('branch');
    }
    setSearchParams(nextParams, { replace: true });
  };

  const updateChannelFilter = (newChannel) => {
    setChannelFilter(newChannel);
    const nextParams = new URLSearchParams(searchParams);
    if (newChannel && newChannel !== 'ALL') {
      nextParams.set('channel', newChannel);
    } else {
      nextParams.delete('channel');
    }
    setSearchParams(nextParams, { replace: true });
  };

  useEffect(() => {
    const b = searchParams.get('branch') || 'ALL';
    const c = searchParams.get('channel') || 'ALL';
    if (b !== branchFilter) setBranchFilter(b);
    if (c !== channelFilter) setChannelFilter(c);
  }, [searchParams]);

  // Quick payment collection state inside active order modal
  const [collectionAmount, setCollectionAmount] = useState('');
  const [collectionMode, setCollectionMode] = useState('UPI_QR');
  const [collectionNotes, setCollectionNotes] = useState('');
  const [isCollectingPayment, setIsCollectingPayment] = useState(false);

  // Walk-in / In-store POS Order creation state
  const [showWalkInModal, setShowWalkInModal] = useState(false);
  const [isCreatingWalkIn, setIsCreatingWalkIn] = useState(false);
  const [walkInForm, setWalkInForm] = useState(INITIAL_WALK_IN_FORM);
  const [walkInItemCategory, setWalkInItemCategory] = useState('ALL');
  const [walkInItemSearch, setWalkInItemSearch] = useState('');
  const [manualCustomItem, setManualCustomItem] = useState({
    name: '',
    unitPrice: '',
    quantity: 1,
    tag: 'Custom Charge'
  });

  // Status & Weight edit state in modal
  const [newCustomerStage, setNewCustomerStage] = useState('CONFIRMED');
  const [newInternalStage, setNewInternalStage] = useState('RECEIVED_AT_HUB');
  const [newPaymentStatus, setNewPaymentStatus] = useState('PENDING');
  const [assignedStaff, setAssignedStaff] = useState('');
  const [actualWeight, setActualWeight] = useState('');
  const [finalPrice, setFinalPrice] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [statusNote, setStatusNote] = useState('');

  // Live Multi-Branch & Channel Statistics Calculation
  const branchStats = useMemo(() => {
    const stats = {
      'counter-1': { count: 0, billed: 0, collected: 0, due: 0 },
      'counter-2': { count: 0, billed: 0, collected: 0, due: 0 },
      'counter-3': { count: 0, billed: 0, collected: 0, due: 0 },
      'ONLINE_WEBSITE': { count: 0, billed: 0, collected: 0, due: 0 },
      'ALL': { count: 0, billed: 0, collected: 0, due: 0 },
      'POS_ONLY': { count: 0, billed: 0, collected: 0, due: 0 },
    };

    orders.forEach((ord) => {
      const isPos = ord.isWalkIn || ord.orderSource === 'OFFLINE_POS' || ord.orderSource === 'WALK_IN' || !!ord.terminalId || !!ord.terminalCode;
      const bKey = getOrderBranchKey(ord);
      const total = Number(ord.finalPrice || ord.priceSnapshot?.finalTotal || ord.totalAmount || 0);
      const received = Number(ord.receivedAmount !== undefined && ord.receivedAmount !== null ? ord.receivedAmount : (ord.paymentStatus === 'PAID' ? total : 0));
      const balance = Number(ord.balanceAmount !== undefined && ord.balanceAmount !== null ? ord.balanceAmount : Math.max(0, total - received));

      // Consolidated
      stats.ALL.count += 1;
      stats.ALL.billed += total;
      stats.ALL.collected += received;
      stats.ALL.due += balance;

      if (isPos) {
        stats.POS_ONLY.count += 1;
        stats.POS_ONLY.billed += total;
        stats.POS_ONLY.collected += received;
        stats.POS_ONLY.due += balance;

        if (stats[bKey]) {
          stats[bKey].count += 1;
          stats[bKey].billed += total;
          stats[bKey].collected += received;
          stats[bKey].due += balance;
        }
      } else {
        stats.ONLINE_WEBSITE.count += 1;
        stats.ONLINE_WEBSITE.billed += total;
        stats.ONLINE_WEBSITE.collected += received;
        stats.ONLINE_WEBSITE.due += balance;
      }
    });

    return stats;
  }, [orders]);

  const handleAssignWorker = async (order, staffMember) => {
    setIsDispatching(true);
    try {
      await orderService.assignWorkerToOrder(order.id, staffMember);
      await auditService.logAction({
        action: 'ASSIGN_STAFF',
        entity: 'Order',
        entityId: order.id,
        entityName: `Order #${order.orderNumber}`,
        newValue: { assignedStaff: staffMember.name, staffId: staffMember.id },
        user: currentUser,
      });

      success('Rider Dispatched!', `Order #${order.orderNumber} assigned to ${staffMember.name}. Rider notified.`);
      setAssignModalOrder(null);
      loadOrders();
    } catch (err) {
      error('Dispatch Error', err.message || 'Failed to assign worker');
    } finally {
      setIsDispatching(false);
    }
  };

  const handleDeleteOrder = async () => {
    if (!deleteTargetOrder) return;
    setIsDeletingOrder(true);
    try {
      await orderService.deleteOrder(deleteTargetOrder.id);
      
      try {
        await auditService.logAction({
          action: 'DELETE',
          entity: 'Order',
          entityId: deleteTargetOrder.id,
          entityName: `Order #${deleteTargetOrder.orderNumber || deleteTargetOrder.id}`,
          user: currentUser,
        });
      } catch (e) {}

      success('Order Deleted', `Order #${deleteTargetOrder.orderNumber || deleteTargetOrder.id} permanently removed.`);
      setDeleteTargetOrder(null);
      if (activeOrder && (activeOrder.id === deleteTargetOrder.id || activeOrder.orderNumber === deleteTargetOrder.orderNumber)) {
        setActiveOrder(null);
      }
      loadOrders();
    } catch (err) {
      error('Delete Error', err.message || 'Failed to delete order.');
    } finally {
      setIsDeletingOrder(false);
    }
  };

  // Calculations for Walk-In POS Order
  const getWalkInSubtotal = () => {
    if (walkInForm.pricingType === 'per_kg') {
      const base = (Number(walkInForm.weightKg) || 0) * (Number(walkInForm.pricePerKg) || 100);
      const itemsAddon = walkInForm.items.reduce((sum, it) => sum + (Number(it.unitPrice) * Number(it.quantity)), 0);
      return Math.round(base + itemsAddon);
    }
    return walkInForm.items.reduce((sum, it) => sum + (Number(it.unitPrice) * Number(it.quantity)), 0);
  };

  const getWalkInExpressFee = (subtotal) => {
    if (walkInForm.expressOption === 'EXPRESS_24') return Math.round(subtotal * 0.25);
    if (walkInForm.expressOption === 'SAME_DAY') return Math.round(subtotal * 0.50);
    return 0;
  };

  const walkInSubtotal = getWalkInSubtotal();
  const walkInExpressFee = getWalkInExpressFee(walkInSubtotal);
  const walkInCalculatedTotal = Math.max(0, walkInSubtotal + walkInExpressFee);
  const hasWalkInCustomTotal = walkInForm.customGrandTotal !== '' && walkInForm.customGrandTotal !== undefined && !isNaN(Number(walkInForm.customGrandTotal));
  const walkInFinalTotal = hasWalkInCustomTotal ? Math.max(0, Number(walkInForm.customGrandTotal)) : walkInCalculatedTotal;

  const walkInReceived = walkInForm.receivedAmount !== '' 
    ? Number(walkInForm.receivedAmount) 
    : (walkInForm.paymentStatus === 'PAID' ? walkInFinalTotal : 0);
  const walkInBalanceDue = Math.max(0, walkInFinalTotal - (isNaN(walkInReceived) ? 0 : walkInReceived));

  // Comprehensive Multi-Branch & Channel filtering
  const filteredOrders = useMemo(() => {
    return orders.filter(ord => {
      const isPos = ord.isWalkIn || ord.orderSource === 'OFFLINE_POS' || ord.orderSource === 'WALK_IN' || !!ord.terminalId || !!ord.terminalCode;
      
      // 1. Channel Filter
      if (channelFilter === 'ONLINE_WEBSITE' && isPos) return false;
      if (channelFilter === 'OFFLINE_POS' && !isPos) return false;

      // 2. Branch Filter
      if (branchFilter && branchFilter !== 'ALL') {
        if (branchFilter === 'ONLINE_WEBSITE') {
          if (isPos) return false;
        } else {
          const bKey = getOrderBranchKey(ord);
          if (bKey !== branchFilter) return false;
        }
      }

      return true;
    });
  }, [orders, channelFilter, branchFilter]);

  const onlineOrdersCount = useMemo(() => {
    return orders.filter(o => !o.isWalkIn && o.orderSource !== 'OFFLINE_POS' && o.orderSource !== 'WALK_IN' && !o.terminalId).length;
  }, [orders]);

  const offlinePosOrdersCount = useMemo(() => {
    return orders.filter(o => o.isWalkIn || o.orderSource === 'OFFLINE_POS' || o.orderSource === 'WALK_IN' || !!o.terminalId || !!o.terminalCode).length;
  }, [orders]);

  const filteredCatalogItems = useMemo(() => {
    return MASTER_CATALOG_ITEMS.filter((item) => {
      const matchesCategory = walkInItemCategory === 'ALL' || item.categoryKey === walkInItemCategory;
      const matchesSearch = !walkInItemSearch || 
        item.name.toLowerCase().includes(walkInItemSearch.toLowerCase()) ||
        (item.categoryName && item.categoryName.toLowerCase().includes(walkInItemSearch.toLowerCase()));
      return matchesCategory && matchesSearch;
    });
  }, [walkInItemCategory, walkInItemSearch]);

  const handleSelectWalkInService = (srv) => {
    setWalkInForm(prev => ({
      ...prev,
      serviceId: srv.id,
      serviceName: srv.name,
      serviceEmoji: srv.emoji,
      pricingType: srv.perKg ? 'per_kg' : 'per_item',
      pricePerKg: srv.perKg ? srv.defaultPrice : prev.pricePerKg,
    }));
  };

  const handleAddCatalogItem = (catalogItem) => {
    setWalkInForm(prev => {
      const existingIdx = prev.items.findIndex(it => it.name === catalogItem.name);
      if (existingIdx >= 0) {
        const updated = [...prev.items];
        const newQ = updated[existingIdx].quantity + 1;
        updated[existingIdx] = {
          ...updated[existingIdx],
          quantity: newQ,
          lineTotal: newQ * updated[existingIdx].unitPrice
        };
        return { ...prev, items: updated };
      } else {
        const newItem = {
          id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          name: catalogItem.name,
          emoji: catalogItem.emoji || '👔',
          category: catalogItem.categoryName || 'General',
          unitPrice: Number(catalogItem.price),
          quantity: 1,
          lineTotal: Number(catalogItem.price),
        };
        return { ...prev, items: [...prev.items, newItem] };
      }
    });
  };

  const handleAddManualCustomCharge = (e) => {
    e?.preventDefault();
    if (!manualCustomItem.name.trim()) {
      error('Item Name Required', 'Please enter a name or description for this manual charge.');
      return;
    }
    const priceNum = Number(manualCustomItem.unitPrice);
    if (isNaN(priceNum) || priceNum <= 0) {
      error('Valid Amount Required', 'Please enter a valid amount in ₹ (e.g. 150).');
      return;
    }
    const qty = Math.max(1, Number(manualCustomItem.quantity) || 1);
    
    const newItem = {
      id: `manual-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: manualCustomItem.name.trim(),
      emoji: '⚡',
      category: manualCustomItem.tag || 'Custom Charge',
      unitPrice: priceNum,
      quantity: qty,
      lineTotal: priceNum * qty,
      isManual: true,
    };

    setWalkInForm(prev => ({
      ...prev,
      items: [...prev.items, newItem]
    }));

    setManualCustomItem({
      name: '',
      unitPrice: '',
      quantity: 1,
      tag: 'Custom Charge'
    });

    success('Custom Charge Added', `"${newItem.name}" (₹${newItem.unitPrice} × ${newItem.quantity}) added and calculated.`);
  };

  const handleUpdateItemQty = (index, delta) => {
    setWalkInForm(prev => {
      const updated = [...prev.items];
      const newQty = updated[index].quantity + delta;
      if (newQty <= 0) {
        return { ...prev, items: updated.filter((_, i) => i !== index) };
      }
      updated[index] = {
        ...updated[index],
        quantity: newQty,
        lineTotal: newQty * updated[index].unitPrice
      };
      return { ...prev, items: updated };
    });
  };

  const handleUpdateWalkInItemName = (index, newName) => {
    setWalkInForm(prev => {
      const updated = [...prev.items];
      if (!updated[index]) return prev;
      updated[index] = {
        ...updated[index],
        name: newName,
        subServiceName: newName
      };
      return { ...prev, items: updated };
    });
  };

  const handleUpdateItemUnitPrice = (index, newPrice) => {
    setWalkInForm(prev => {
      const updated = [...prev.items];
      if (!updated[index]) return prev;
      const parsedPrice = Math.max(0, Number(newPrice) || 0);
      updated[index] = {
        ...updated[index],
        unitPrice: parsedPrice,
        lineTotal: parsedPrice * (Number(updated[index].quantity) || 1)
      };
      return { ...prev, items: updated };
    });
  };

  const handleRemoveItem = (index) => {
    setWalkInForm(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const handleCreateWalkInOrder = async (e) => {
    e.preventDefault();
    if (!walkInForm.customerName.trim()) {
      error('Customer Name Required', 'Please enter customer full name.');
      return;
    }
    const cleanPhone = String(walkInForm.phone).replace(/\D/g, '');
    if (!cleanPhone || cleanPhone.length < 10) {
      error('Valid Mobile Required', 'Please enter a valid 10-digit mobile number.');
      return;
    }

    if (walkInForm.pricingType === 'per_item' && walkInForm.items.length === 0) {
      error('No Items Added', 'Please add at least 1 garment/item to the invoice.');
      return;
    }

    if (walkInForm.pricingType === 'per_kg' && (!walkInForm.weightKg || Number(walkInForm.weightKg) <= 0)) {
      error('Weight Required', 'Please enter the weighed laundry weight in Kg.');
      return;
    }

    setIsCreatingWalkIn(true);
    try {
      const totalGrams = walkInForm.items.reduce((acc, it) => acc + (it.quantity * 350), 0);
      const estWeight = walkInForm.pricingType === 'per_kg' ? Number(walkInForm.weightKg) : (totalGrams > 0 ? (totalGrams / 1000) : null);

      const parsedReceived = walkInForm.receivedAmount !== '' 
        ? Math.max(0, Number(walkInForm.receivedAmount) || 0)
        : (walkInForm.paymentStatus === 'PAID' ? walkInFinalTotal : 0);
      const computedBalance = Math.max(0, walkInFinalTotal - parsedReceived);
      const computedPaymentStatus = computedBalance === 0 ? 'PAID' : (parsedReceived > 0 ? 'PARTIAL' : 'PENDING');

      const orderPayload = {
        isWalkIn: true,
        orderSource: 'OFFLINE_POS',
        terminalId: walkInForm.terminalId || 'counter-1',
        terminalCode: walkInForm.terminalCode || 'TW-POS-01',
        storeBranch: walkInForm.storeBranch || 'Tech Wash Flagship Lounge — Jubilee Hills',
        cashierName: walkInForm.cashierName || 'Rahul Verma (Cashier #1)',
        customer: {
          name: walkInForm.customerName.trim(),
          phone: cleanPhone,
          whatsapp: cleanPhone,
          email: walkInForm.email.trim(),
          address: `In-Store Walk-in Drop (${walkInForm.storeBranch})`,
          city: 'Hyderabad',
        },
        customerName: walkInForm.customerName.trim(),
        phone: cleanPhone,
        whatsapp: cleanPhone,
        address: `In-Store Walk-in Drop (${walkInForm.storeBranch})`,
        serviceId: walkInForm.serviceId,
        serviceName: walkInForm.serviceName,
        serviceEmoji: walkInForm.serviceEmoji,
        pricingType: walkInForm.pricingType,
        items: walkInForm.items.map(it => ({
          name: it.name,
          emoji: it.emoji || '👔',
          category: it.category || 'General',
          unitPrice: Number(it.unitPrice),
          quantity: Number(it.quantity),
          lineTotal: Number(it.unitPrice) * Number(it.quantity),
        })),
        estimatedWeightKg: estWeight,
        actualWeight: estWeight,
        priceSnapshot: {
          itemsSubtotal: walkInSubtotal,
          deliveryFee: 0,
          expressFee: walkInExpressFee,
          discountAmount: 0,
          taxes: 0,
          finalTotal: walkInFinalTotal,
          receivedAmount: parsedReceived,
          balanceAmount: computedBalance,
          isExpress: walkInForm.expressOption !== 'STANDARD',
        },
        totalAmount: walkInFinalTotal,
        finalPrice: walkInFinalTotal,
        receivedAmount: parsedReceived,
        balanceAmount: computedBalance,
        paymentStatus: computedPaymentStatus,
        paymentMethod: walkInForm.paymentMethod,
        customerStage: 'INSPECTION',
        internalStage: 'RECEIVED_AT_HUB',
        notes: walkInForm.notes || 'In-store counter drop-off',
        adminNotes: walkInForm.internalAdminNotes || 'In-Store Walk-in Customer POS Order',
        schedule: {
          pickupDate: new Date().toLocaleDateString('en-GB'),
          pickupSlot: 'In-Store Counter',
        },
      };

      const created = await orderService.createOrder(orderPayload);

      try {
        await auditService.logAction({
          action: 'CREATE',
          entity: 'Order',
          entityId: created.id,
          entityName: `In-Store Order #${created.orderNumber}`,
          newValue: {
            customerName: created.customerName,
            totalAmount: created.totalAmount,
            receivedAmount: parsedReceived,
            balanceAmount: computedBalance,
            paymentStatus: created.paymentStatus,
          },
          user: currentUser,
        });
      } catch (e) {}

      success('Invoice Generated!', `In-Store Order #${created.orderNumber} saved with official tax invoice.`);
      setShowWalkInModal(false);
      setWalkInForm(INITIAL_WALK_IN_FORM);
      loadOrders();

      if (walkInForm.autoOpenReceipt) {
        setReceiptModalOrder(created);
      }

      if (walkInForm.autoSendWhatsApp) {
        setTimeout(() => {
          const msg = whatsappNotificationService.buildInvoiceWhatsAppMessage(created);
          whatsappNotificationService.openWhatsAppManual(cleanPhone, msg);
        }, 600);
      }
    } catch (err) {
      error('Invoice Error', err.message || 'Failed to create in-store invoice.');
    } finally {
      setIsCreatingWalkIn(false);
    }
  };

  const handleQuickCollectPayment = async (e) => {
    e?.preventDefault();
    if (!activeOrder) return;
    const amountNum = Number(collectionAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      error('Invalid Amount', 'Please enter a valid amount in ₹ to collect (e.g. 200).');
      return;
    }

    setIsCollectingPayment(true);
    try {
      const updated = await orderService.updateOrderPayment(activeOrder.id, {
        amountCollected: amountNum,
        paymentMethod: collectionMode,
        paymentNotes: collectionNotes || 'Settled in Admin Order Manager',
        recordedBy: currentUser?.email || 'Admin Staff',
      });

      await auditService.logAction({
        action: 'PAYMENT_COLLECT',
        entity: 'Order',
        entityId: activeOrder.id,
        entityName: `Order #${activeOrder.orderNumber}`,
        newValue: {
          amountCollected: amountNum,
          paymentMethod: collectionMode,
          newReceivedAmount: updated.receivedAmount,
          newBalanceAmount: updated.balanceAmount,
          newPaymentStatus: updated.paymentStatus,
        },
        user: currentUser,
      });

      success('Payment Recorded!', `₹${amountNum} recorded for Order #${activeOrder.orderNumber}. Balance updated.`);
      setActiveOrder(updated);
      setCollectionAmount('');
      setCollectionNotes('');
      loadOrders();
    } catch (err) {
      error('Collection Error', err.message || 'Failed to record balance payment.');
    } finally {
      setIsCollectingPayment(false);
    }
  };

  const loadOrders = async () => {
    try {
      const [orderData, staffData] = await Promise.all([
        orderService.getOrders({ status: selectedStatus, search: searchQuery }),
        staffService.getStaff(),
      ]);
      setOrders(orderData);
      setStaffList(staffData);
    } catch (e) {
      console.warn("Failed to load orders:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, [selectedStatus, searchQuery]);

  // Real-time listener for incoming orders to update table instantly
  useEffect(() => {
    const unsubscribe = orderService.subscribeToNewOrders(() => {
      loadOrders();
    });
    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, [selectedStatus, searchQuery]);

  const openOrderModal = (ord) => {
    setActiveOrder(ord);
    setNewCustomerStage(ord.customerStage || ord.status || 'CONFIRMED');
    setNewInternalStage(ord.internalStage || 'RECEIVED_AT_HUB');
    setNewPaymentStatus(ord.paymentStatus || 'PENDING');
    setAssignedStaff(ord.assignedStaff || '');
    setActualWeight(ord.actualWeight !== null && ord.actualWeight !== undefined ? String(ord.actualWeight) : '');
    setFinalPrice(ord.finalPrice !== null && ord.finalPrice !== undefined ? String(ord.finalPrice) : (ord.priceSnapshot?.finalTotal || ord.totalAmount || ''));
    setAdminNotes(ord.adminNotes || '');
    setStatusNote('');
  };

  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    if (!activeOrder) return;
    setIsUpdating(true);

    try {
      const previousState = {
        customerStage: activeOrder.customerStage,
        internalStage: activeOrder.internalStage,
        paymentStatus: activeOrder.paymentStatus,
        actualWeight: activeOrder.actualWeight,
        finalPrice: activeOrder.finalPrice,
      };

      const updated = await orderService.updateOrderStatus(activeOrder.id, {
        customerStage: newCustomerStage,
        internalStage: newInternalStage,
        paymentStatus: newPaymentStatus,
        assignedStaff: assignedStaff || null,
        actualWeight: actualWeight !== '' ? Number(actualWeight) : null,
        finalPrice: finalPrice !== '' ? Number(finalPrice) : null,
        adminNotes: adminNotes,
        note: statusNote || `Status updated to ${newCustomerStage}`,
      });

      await auditService.logAction({
        action: 'STATUS_CHANGE',
        entity: 'Order',
        entityId: activeOrder.id,
        entityName: `Order #${activeOrder.orderNumber}`,
        previousValue: previousState,
        newValue: { 
          customerStage: newCustomerStage, 
          internalStage: newInternalStage, 
          paymentStatus: newPaymentStatus,
          actualWeight: actualWeight !== '' ? Number(actualWeight) : null,
          finalPrice: finalPrice !== '' ? Number(finalPrice) : null,
        },
        user: currentUser,
      });

      success('Order Updated', `Status changed to ${newCustomerStage} with financial record saved.`);
      setActiveOrder(updated);
      loadOrders();
    } catch (err) {
      error('Update Error', err.message || 'Failed to update order');
    } finally {
      setIsUpdating(false);
    }
  };

  useEffect(() => {
    whatsappNotificationService.getGatewayConfig().then((cfg) => {
      setGatewayConfig(cfg);
    });
  }, []);

  const handleSendWhatsAppUpdate = (ord) => {
    const phone = ord.whatsapp || ord.phone || ord.customer?.whatsapp || ord.customer?.phone;
    if (!phone) {
      error('No Phone', 'No customer phone number available.');
      return;
    }

    const stageLabel = ORDER_CUSTOMER_STAGES.find(s => s.key === (ord.customerStage || ord.status))?.label || ord.customerStage || 'Updated';
    const isInitialConfirmation = (ord.customerStage || ord.status) === 'CONFIRMED';
    const msg = isInitialConfirmation
      ? whatsappNotificationService.buildOrderConfirmationMessage(ord)
      : whatsappNotificationService.buildStatusUpdateMessage(ord, stageLabel, ord.statusTimeline?.[ord.statusTimeline.length - 1]?.note || '');

    whatsappNotificationService.openWhatsAppManual(phone, msg);
    success('WhatsApp Opened', `Opening WhatsApp for +91 ${phone}`);
  };

  const handleWhatsAppToWorker = (ord, staffMember) => {
    if (!staffMember?.phone) {
      error('No Rider Phone', 'This delivery worker does not have a phone number on file.');
      return;
    }
    const msg = whatsappNotificationService.buildWorkerAssignmentMessage(ord, staffMember);
    whatsappNotificationService.openWhatsAppManual(staffMember.phone, msg);
    success('WhatsApp Opened for Rider', `Sending dispatch order details to ${staffMember.name} (+91 ${staffMember.phone})`);
  };

  const handleSaveGateway = async (e) => {
    e.preventDefault();
    if (!gatewayConfig) return;
    setIsSavingGateway(true);
    try {
      await whatsappNotificationService.saveGatewayConfig(gatewayConfig);
      success('Gateway Updated', 'WhatsApp notification gateway configuration saved successfully.');
      setShowGatewayModal(false);
    } catch (err) {
      error('Save Error', err.message || 'Failed to save gateway config');
    } finally {
      setIsSavingGateway(false);
    }
  };

  const handleTestGatewayDispatch = async () => {
    if (!testPhone) {
      error('Test Phone Required', 'Please enter a 10-digit mobile number to test.');
      return;
    }
    setIsTestingGateway(true);
    try {
      const dummyOrder = {
        orderNumber: 'TEST-9999',
        customerName: 'Test Customer',
        serviceName: 'Premium Dry Cleaning',
        serviceEmoji: '👔',
        schedule: { pickupDate: 'Tomorrow', pickupSlot: '10:00 AM - 12:00 PM' },
        address: 'Flagship Lounge, Jubilee Hills, Hyderabad',
        totalAmount: 499,
        paymentStatus: 'PAID',
        paymentMethod: 'UPI_QR',
        customer: { name: 'Test Customer', phone: testPhone }
      };

      const result = await whatsappNotificationService.dispatchAutomatedMessage({
        phone: testPhone,
        message: whatsappNotificationService.buildOrderConfirmationMessage(dummyOrder),
        order: dummyOrder,
        type: 'GATEWAY_TEST'
      });

      if (result.success) {
        success('Test Dispatched', `Automated WhatsApp test packet sent to +91 ${testPhone} via ${gatewayConfig?.provider || 'Direct Gateway'}`);
      } else {
        error('Test Failed', result.error || 'Failed to dispatch test message');
      }
    } catch (err) {
      error('Test Error', err.message);
    } finally {
      setIsTestingGateway(false);
    }
  };


  const handleOpenGoogleMaps = (ord) => {
    const lat = ord.pickupLocation?.latitude || 17.385044;
    const lng = ord.pickupLocation?.longitude || 78.486671;
    const address = ord.address || ord.customer?.address || `${lat},${lng}`;
    const url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`;
    window.open(url, '_blank');
  };

  const exportCSV = () => {
    if (orders.length === 0) {
      error('No Data', 'No orders available to export.');
      return;
    }
    const headers = ['Order Number,Customer Name,Phone,Service,Est Weight,Actual Weight,Est Amount,Final Amount,Customer Stage,Internal Stage,Payment Status,Created At'];
    const rows = orders.map(o => `"${o.orderNumber}","${o.customerName || o.customer?.name || ''}","${o.phone || o.customer?.phone || ''}","${o.service || o.serviceName || ''}","${o.estimatedWeightKg || o.estimatedWeight || ''}","${o.actualWeight || ''}","${o.estimatedPrice || o.priceSnapshot?.finalTotal || ''}","${o.finalPrice || o.totalAmount || ''}","${o.customerStage || o.status}","${o.internalStage || ''}","${o.paymentStatus}","${o.createdAt}"`);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `techwash_orders_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    success('Export Complete', 'Orders exported to CSV.');
  };

  const columns = [
    {
      title: 'Order ID & Slip',
      key: 'orderNumber',
      className: 'whitespace-nowrap',
      render: (val, row) => (
        <div className="space-y-1">
          <span className="font-mono font-black text-xs text-purple-800 bg-purple-100/80 px-2 py-1 rounded-lg border border-purple-200 shadow-2xs block w-fit">
            #{val || row.id}
          </span>
          {row.manualBillNumber && (
            <span className="inline-block text-[10px] font-mono font-bold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
              Slip: #{row.manualBillNumber}
            </span>
          )}
        </div>
      ),
    },
    {
      title: 'Date & Time / Branch',
      key: 'createdAt',
      className: 'whitespace-nowrap min-w-[200px]',
      render: (val, row) => {
        const isOffline = row.isWalkIn || row.orderSource === 'OFFLINE_POS' || row.orderSource === 'WALK_IN' || !!row.terminalId || !!row.terminalCode;
        const bKey = getOrderBranchKey(row);
        const branchObj = STORE_BRANCHES.find(b => b.id === bKey);
        const formattedDateTime = formatDateTime(row.createdAt || val);
        const formattedDateOnly = formatDate(row.createdAt || val);

        return (
          <div className="space-y-1">
            {/* Exact Timestamp */}
            <div className="flex items-center gap-1.5 text-xs text-slate-900 font-bold">
              <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="font-mono text-[11px] text-slate-800">
                {formattedDateTime !== '—' ? formattedDateTime : (row.pickupDate || formattedDateOnly)}
              </span>
            </div>

            {/* Branch Identification Badge */}
            {isOffline ? (
              <div className="space-y-0.5">
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black border shadow-2xs ${
                  bKey === 'counter-1' ? 'bg-blue-50 text-blue-800 border-blue-200' :
                  bKey === 'counter-2' ? 'bg-purple-50 text-purple-800 border-purple-200' :
                  'bg-orange-50 text-orange-800 border-orange-200'
                }`}>
                  <span>🏪 {branchObj ? branchObj.shortName : 'Counter POS'}</span>
                  <span className="font-mono text-[9px] opacity-75">({row.terminalCode || (branchObj ? branchObj.code : 'POS')})</span>
                </span>
                {row.cashierName && (
                  <div className="text-[10px] text-slate-400 pl-0.5">
                    Cashier: <strong className="text-slate-600">{row.cashierName.split(' ')[0]}</strong>
                  </div>
                )}
              </div>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black bg-blue-50 text-blue-800 border border-blue-200 shadow-2xs">
                🌐 ONLINE DOORSTEP
              </span>
            )}
          </div>
        );
      },
    },
    {
      title: 'Customer',
      key: 'customer',
      render: (_, row) => (
        <div>
          <div className="font-bold text-slate-900 text-xs">{row.customerName || row.customer?.name || 'Customer'}</div>
          <div className="text-[11px] text-slate-400 font-medium">{row.phone || row.customer?.phone}</div>
          {row.address && (
            <div className="text-[10px] text-slate-400 truncate max-w-[150px]" title={row.address}>
              {row.address}
            </div>
          )}
        </div>
      ),
    },
    {
      title: 'Service & Items',
      key: 'service',
      render: (val, row) => (
        <div>
          <span className="text-xs font-bold text-slate-800 flex items-center gap-1">
            <span>{row.serviceEmoji || '🧺'}</span>
            <span>{row.service || row.serviceName}</span>
          </span>
          <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
            {row.items && row.items.length > 0 && (
              <span>{row.items.length} {row.items.length === 1 ? 'item' : 'items'}</span>
            )}
            {(row.actualWeight || row.estimatedWeightKg || row.estimatedWeight) && (
              <span>• {row.actualWeight ? `Act: ${row.actualWeight} Kg` : `Est: ${row.estimatedWeightKg || row.estimatedWeight} Kg`}</span>
            )}
          </div>
        </div>
      ),
    },
    {
      title: 'Amount & Balance',
      key: 'finalPrice',
      render: (val, row) => {
        const total = Number(val || row.priceSnapshot?.finalTotal || row.totalAmount || 0);
        const received = Number(row.receivedAmount !== undefined && row.receivedAmount !== null ? row.receivedAmount : (row.paymentStatus === 'PAID' ? total : 0));
        const balance = Number(row.balanceAmount !== undefined && row.balanceAmount !== null ? row.balanceAmount : Math.max(0, total - received));

        return (
          <div className="space-y-0.5 min-w-[125px]">
            <div className="font-bold text-xs text-slate-900 flex items-center justify-between gap-2">
              <span className="text-slate-500 font-normal">Bill:</span>
              <span className="font-mono font-black">{formatCurrency(total)}</span>
            </div>
            <div className="text-[11px] text-emerald-700 flex items-center justify-between gap-2">
              <span className="text-slate-400">Recv:</span>
              <span className="font-mono font-bold">{formatCurrency(received)}</span>
            </div>
            {balance > 0 ? (
              <div className="text-[10px] font-black text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200 flex items-center justify-between gap-1">
                <span>DUE:</span>
                <span className="font-mono font-black">{formatCurrency(balance)}</span>
              </div>
            ) : (
              <div className="text-[10px] font-bold text-emerald-600 flex items-center gap-1">
                <Check className="w-3 h-3 text-emerald-500" />
                <span>Cleared (₹0 Due)</span>
              </div>
            )}
          </div>
        );
      },
    },
    {
      title: 'Stage',
      key: 'customerStage',
      render: (val, row) => <StatusBadge status={val || row.status} />,
    },
    {
      title: 'Payment',
      key: 'paymentStatus',
      render: (val) => <StatusBadge status={val} />,
    },
    {
      title: 'Schedule / Slot',
      key: 'pickupDate',
      className: 'whitespace-nowrap',
      render: (val, row) => (
        <div className="text-xs text-slate-600">
          <div className="font-bold text-slate-800">{val || formatDate(row.createdAt)}</div>
          <div className="text-[11px] text-slate-400 font-medium">{row.pickupSlot || row.schedule?.pickupSlot || 'Standard Slot'}</div>
        </div>
      ),
    },
    {
      title: 'Assigned Worker',
      key: 'assignedStaff',
      className: 'whitespace-nowrap',
      render: (val, row) => (
        <div>
          {val ? (
            <button
              type="button"
              onClick={() => setAssignModalOrder(row)}
              className="group px-3 py-1.5 rounded-xl bg-purple-100 hover:bg-purple-200 border border-purple-300 text-purple-950 text-xs font-bold flex items-center gap-1.5 shadow-2xs active:scale-95 transition-all"
              title="Click to reassign worker"
            >
              <Bike className="w-3.5 h-3.5 text-purple-700 shrink-0" />
              <span className="font-extrabold">{val}</span>
              <span className="text-[10px] text-purple-600 group-hover:translate-x-0.5 transition-transform font-bold">➔</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setAssignModalOrder(row)}
              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-sm active:scale-95 transition-all"
            >
              <Sparkles className="w-3.5 h-3.5 text-slate-950" />
              <span>⚡ Assign Rider</span>
            </button>
          )}
        </div>
      ),
    },
    {
      title: 'Actions',
      key: 'id',
      className: 'whitespace-nowrap min-w-[210px]',
      render: (_, row) => (
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => openOrderModal(row)}
            className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs active:scale-95 transition-all"
          >
            <Edit3 className="w-3.5 h-3.5 text-amber-400" />
            <span>Manage</span>
          </button>

          <button
            type="button"
            onClick={() => handleSendWhatsAppUpdate(row)}
            title="WhatsApp Customer Update"
            className="w-8 h-8 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-white flex items-center justify-center shadow-xs active:scale-95 transition-all"
          >
            <MessageSquare className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => handleOpenGoogleMaps(row)}
            title="Open Google Maps Directions"
            className="w-8 h-8 rounded-xl bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center shadow-xs active:scale-95 transition-all"
          >
            <Navigation className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => setReceiptModalOrder(row)}
            title="Print Official Tax Invoice"
            className="w-8 h-8 rounded-xl bg-purple-600 hover:bg-purple-700 text-white flex items-center justify-center shadow-xs active:scale-95 transition-all"
          >
            <Printer className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => setDeleteTargetOrder(row)}
            title="Delete Order Permanently"
            className="w-8 h-8 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200/80 flex items-center justify-center shadow-2xs active:scale-95 transition-all"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 pos-workspace-screen print:hidden no-print">
      <AdminPageHeader
        title="Order Lifecycle & Pickup Management"
        subtitle="Manage 10-stage customer milestones, record verified actual weights, assign delivery staff, and track offline POS & online channels."
      >
        <Button 
          variant="primary" 
          size="md" 
          icon={Plus} 
          onClick={() => setShowWalkInModal(true)}
          className="bg-gradient-to-r from-[#F97316] to-[#EA580C] hover:from-[#EA580C] hover:to-[#C2410C] text-white shadow-md hover:shadow-lg font-bold"
        >
          ➕ New Walk-in / In-Store Invoice
        </Button>
        <Button 
          variant="outline" 
          size="md" 
          icon={MessageSquare} 
          onClick={() => setShowGatewayModal(true)}
          className="bg-emerald-50 border-emerald-300 text-emerald-800 hover:bg-emerald-100"
        >
          WhatsApp Auto-Gateway
        </Button>
        <Button variant="outline" size="md" icon={Download} onClick={exportCSV}>
          Export CSV
        </Button>
      </AdminPageHeader>

      {/* ── TOP 3-BRANCH ISOLATION & SALES METRICS CARDS ── */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-black text-slate-900 font-display flex items-center gap-2">
              <Store className="w-4 h-4 text-[#F97316]" />
              <span>3-Branch Store Isolation & Sales Channels</span>
            </h3>
            <p className="text-[11px] text-slate-500">
              Isolate billings and view orders, gross billed, collections, and dues independently for all 3 store branches, online doorstep, or master consolidated.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-500 font-medium">Active Branch Filter:</span>
            <span className="px-2.5 py-1 rounded-lg bg-slate-900 text-white font-bold text-xs">
              {branchFilter === 'ALL' ? '🏢 All Branches Consolidated' :
               branchFilter === 'counter-1' ? '🏪 Counter 1 — Jubilee Hills' :
               branchFilter === 'counter-2' ? '🏪 Counter 2 — Hitec City' :
               branchFilter === 'counter-3' ? '🏪 Counter 3 — Banjara Hills' :
               '🌐 Online Website Pickups'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
          {/* 3 Dedicated Physical Branch Cards */}
          {STORE_BRANCHES.map((br) => {
            const isSelected = branchFilter === br.id;
            const stats = branchStats[br.id] || { count: 0, billed: 0, collected: 0, due: 0 };
            return (
              <div
                key={br.id}
                className={`p-4 rounded-3xl border transition-all duration-200 flex flex-col justify-between gap-3 shadow-xs bg-white ${
                  isSelected
                    ? br.activeRing
                    : `${br.cardBorder} hover:shadow-md`
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-xl ${br.iconBg} flex items-center justify-center font-bold text-xs shadow-2xs`}>
                        <Store className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-[10px] font-mono font-black text-slate-500 uppercase">{br.code}</div>
                        <h4 className="font-black text-xs text-slate-900 leading-tight line-clamp-1" title={br.name}>
                          {br.shortName}
                        </h4>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black font-mono bg-slate-100 text-slate-800 border border-slate-200">
                      {stats.count} {stats.count === 1 ? 'Order' : 'Orders'}
                    </span>
                  </div>

                  <div className="space-y-1 pt-2 border-t border-slate-100 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 text-[11px]">Gross Billed:</span>
                      <span className="font-mono font-black text-slate-900">{formatCurrency(stats.billed)}</span>
                    </div>
                    <div className="flex justify-between items-center text-emerald-700">
                      <span className="text-slate-500 text-[11px]">Collected:</span>
                      <span className="font-mono font-bold">{formatCurrency(stats.collected)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 text-[11px]">Balance Due:</span>
                      <span className={`font-mono font-black text-[11px] ${stats.due > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                        {stats.due > 0 ? formatCurrency(stats.due) : '₹0 (Cleared)'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => updateBranchFilter(isSelected ? 'ALL' : br.id)}
                    className={`w-full py-1.5 px-2 rounded-xl font-bold text-xs flex items-center justify-center gap-1 transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
                    }`}
                  >
                    {isSelected ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Filtering Branch</span>
                      </>
                    ) : (
                      <span>Filter This Branch</span>
                    )}
                  </button>

                  <div className="grid grid-cols-2 gap-1 text-[10px]">
                    <Link
                      to={br.posUrl}
                      target="_blank"
                      className="py-1 px-1.5 rounded-lg bg-orange-50 hover:bg-orange-100 text-orange-800 font-bold border border-orange-200 flex items-center justify-center gap-1 transition-colors text-center"
                      title={`Open ${br.name} POS Billing Machine`}
                    >
                      <span>POS Machine</span>
                      <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                    </Link>
                    <Link
                      to={br.reportUrl}
                      target="_blank"
                      className="py-1 px-1.5 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-800 font-bold border border-purple-200 flex items-center justify-center gap-1 transition-colors text-center"
                      title={`Open ${br.name} Shift Reports`}
                    >
                      <span>Shift Report</span>
                      <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Card 4: Online Website Orders */}
          <div
            className={`p-4 rounded-3xl border transition-all duration-200 flex flex-col justify-between gap-3 shadow-xs bg-white ${
              branchFilter === 'ONLINE_WEBSITE'
                ? 'ring-2 ring-blue-500 bg-blue-50/70 border-blue-400'
                : 'border-blue-200 hover:border-blue-300 hover:shadow-md'
            }`}
          >
            <div>
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-2xs">
                    🌐
                  </div>
                  <div>
                    <div className="text-[10px] font-mono font-black text-blue-600 uppercase">WEBSITE</div>
                    <h4 className="font-black text-xs text-slate-900 leading-tight">
                      Online Pickups
                    </h4>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black font-mono bg-blue-100 text-blue-900 border border-blue-200">
                  {branchStats.ONLINE_WEBSITE.count} Orders
                </span>
              </div>

              <div className="space-y-1 pt-2 border-t border-slate-100 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 text-[11px]">Gross Billed:</span>
                  <span className="font-mono font-black text-slate-900">{formatCurrency(branchStats.ONLINE_WEBSITE.billed)}</span>
                </div>
                <div className="flex justify-between items-center text-emerald-700">
                  <span className="text-slate-500 text-[11px]">Collected:</span>
                  <span className="font-mono font-bold">{formatCurrency(branchStats.ONLINE_WEBSITE.collected)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 text-[11px]">Balance Due:</span>
                  <span className={`font-mono font-black text-[11px] ${branchStats.ONLINE_WEBSITE.due > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                    {branchStats.ONLINE_WEBSITE.due > 0 ? formatCurrency(branchStats.ONLINE_WEBSITE.due) : '₹0 (Cleared)'}
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => updateBranchFilter(branchFilter === 'ONLINE_WEBSITE' ? 'ALL' : 'ONLINE_WEBSITE')}
                className={`w-full py-2 px-2 rounded-xl font-bold text-xs flex items-center justify-center gap-1 transition-all cursor-pointer ${
                  branchFilter === 'ONLINE_WEBSITE'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-blue-50 hover:bg-blue-100 text-blue-900'
                }`}
              >
                {branchFilter === 'ONLINE_WEBSITE' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-white" />
                    <span>Filtering Online</span>
                  </>
                ) : (
                  <span>Filter Online Pickups</span>
                )}
              </button>
            </div>
          </div>

          {/* Card 5: Master Consolidated */}
          <div
            className={`p-4 rounded-3xl border transition-all duration-200 flex flex-col justify-between gap-3 shadow-xs bg-white ${
              branchFilter === 'ALL'
                ? 'ring-2 ring-slate-900 bg-slate-50/90 border-slate-900'
                : 'border-slate-200 hover:border-slate-400 hover:shadow-md'
            }`}
          >
            <div>
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-xs shadow-2xs">
                    🏢
                  </div>
                  <div>
                    <div className="text-[10px] font-mono font-black text-slate-500 uppercase">ALL STORE</div>
                    <h4 className="font-black text-xs text-slate-900 leading-tight">
                      Master Consolidated
                    </h4>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black font-mono bg-slate-900 text-white">
                  {branchStats.ALL.count} Total
                </span>
              </div>

              <div className="space-y-1 pt-2 border-t border-slate-100 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 text-[11px]">Total Volume:</span>
                  <span className="font-mono font-black text-slate-900">{formatCurrency(branchStats.ALL.billed)}</span>
                </div>
                <div className="flex justify-between items-center text-emerald-700">
                  <span className="text-slate-500 text-[11px]">Total Recv:</span>
                  <span className="font-mono font-bold">{formatCurrency(branchStats.ALL.collected)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 text-[11px]">Total Due:</span>
                  <span className={`font-mono font-black text-[11px] ${branchStats.ALL.due > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                    {branchStats.ALL.due > 0 ? formatCurrency(branchStats.ALL.due) : '₹0 (Cleared)'}
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => updateBranchFilter('ALL')}
                className={`w-full py-2 px-2 rounded-xl font-bold text-xs flex items-center justify-center gap-1 transition-all cursor-pointer ${
                  branchFilter === 'ALL'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
                }`}
              >
                {branchFilter === 'ALL' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Showing All Branches</span>
                  </>
                ) : (
                  <span>View All Consolidated</span>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Top Channel Filter Tabs & Quick Link to Balances */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Channel Filter:</span>
          <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200">
            <button
              type="button"
              onClick={() => updateChannelFilter('ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                channelFilter === 'ALL'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Channels ({orders.length})
            </button>
            <button
              type="button"
              onClick={() => updateChannelFilter('OFFLINE_POS')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                channelFilter === 'OFFLINE_POS'
                  ? 'bg-[#F97316] text-white shadow-xs'
                  : 'text-slate-600 hover:text-orange-700'
              }`}
            >
              <span>🏪 In-Store POS (Offline)</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                channelFilter === 'OFFLINE_POS' ? 'bg-white/20 text-white' : 'bg-orange-100 text-orange-800'
              }`}>
                {offlinePosOrdersCount}
              </span>
            </button>
            <button
              type="button"
              onClick={() => updateChannelFilter('ONLINE_WEBSITE')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                channelFilter === 'ONLINE_WEBSITE'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-blue-700'
              }`}
            >
              <span>🌐 Online Pickups</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                channelFilter === 'ONLINE_WEBSITE' ? 'bg-white/20 text-white' : 'bg-blue-100 text-blue-800'
              }`}>
                {onlineOrdersCount}
              </span>
            </button>
          </div>
        </div>

        <Link
          to="/admin/balances"
          className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-rose-500/10 to-amber-500/10 hover:from-rose-500/20 hover:to-amber-500/20 text-rose-800 border border-rose-200 text-xs font-black flex items-center gap-2 transition-all"
        >
          <span>💳 Dedicated Balance Due Tracker</span>
          <span className="text-xs">➔</span>
        </Link>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 scrollbar-none">
          {[
            { key: 'ALL', label: 'All Milestones' },
            { key: 'CONFIRMED', label: 'Confirmed' },
            { key: 'PICKUP_SCHEDULED', label: 'Pickup Scheduled' },
            { key: 'PICKED_UP', label: 'Picked Up' },
            { key: 'CLEANING', label: 'Cleaning' },
            { key: 'FINISHING', label: 'Finishing' },
            { key: 'PACKED', label: 'Packed' },
            { key: 'OUT_FOR_DELIVERY', label: 'Out for Delivery' },
            { key: 'DELIVERED', label: 'Delivered' },
            { key: 'CANCELLED', label: 'Cancelled' }
          ].map((st) => (
            <button
              key={st.key}
              type="button"
              onClick={() => setSelectedStatus(st.key)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap border ${
                selectedStatus === st.key
                  ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200'
              }`}
            >
              {st.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by ID, name, phone, address..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:ring-2 focus:ring-purple-500 font-medium"
          />
        </div>
      </div>

      {/* Orders Table */}
      <Table
        columns={columns}
        data={filteredOrders}
        isLoading={loading}
        emptyMessage="No orders found matching the channel or milestone filter."
      />

      {/* Order Management Modal */}
      <Modal
        isOpen={!!activeOrder}
        onClose={() => setActiveOrder(null)}
        maxWidth="max-w-4xl"
        title={activeOrder ? `Manage Order #${activeOrder.orderNumber}` : 'Order Details'}
        subtitle="Update milestone stages, record inspected weight, collect balance payments, and send updates."
      >
        {activeOrder && (
          <div className="space-y-6 max-h-[80vh] overflow-y-auto pr-1">
            
            {/* Channel Source Banner & Financial Card */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 to-slate-950 text-white shadow-md flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center font-bold text-lg">
                  {activeOrder.isWalkIn || activeOrder.orderSource === 'OFFLINE_POS' ? '🏪' : '🌐'}
                </div>
                <div>
                  <div className="font-bold text-xs text-slate-300 uppercase tracking-wider">
                    {activeOrder.isWalkIn || activeOrder.orderSource === 'OFFLINE_POS' 
                      ? 'In-Store Walk-in Drop (Offline POS Counter)' 
                      : 'Online Website Doorstep Pickup Booking'}
                  </div>
                  <div className="text-sm font-black text-white">
                    Order #{activeOrder.orderNumber} • {activeOrder.customerName || activeOrder.customer?.name}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 text-xs font-mono">
                <div>
                  <span className="text-slate-400 block text-[10px]">TOTAL BILL</span>
                  <span className="text-sm font-black text-white">
                    {formatCurrency(activeOrder.finalPrice || activeOrder.priceSnapshot?.finalTotal || activeOrder.totalAmount || 0)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">RECEIVED</span>
                  <span className="text-sm font-black text-emerald-400">
                    {formatCurrency(activeOrder.receivedAmount !== undefined ? activeOrder.receivedAmount : (activeOrder.paymentStatus === 'PAID' ? (activeOrder.finalPrice || activeOrder.totalAmount) : 0))}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">BALANCE DUE</span>
                  <span className={`text-sm font-black ${
                    (activeOrder.balanceAmount > 0 || (activeOrder.balanceAmount === undefined && activeOrder.paymentStatus !== 'PAID')) 
                      ? 'text-rose-400' 
                      : 'text-emerald-400'
                  }`}>
                    {formatCurrency(activeOrder.balanceAmount !== undefined ? activeOrder.balanceAmount : (activeOrder.paymentStatus === 'PAID' ? 0 : (activeOrder.finalPrice || activeOrder.totalAmount)))}
                  </span>
                </div>
              </div>
            </div>

            {/* Customer Overview & Contact Actions */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1.5">
                <span className="text-slate-400 font-bold uppercase tracking-wider block">Customer Details</span>
                <div className="font-bold text-slate-900 text-sm">{activeOrder.customerName || activeOrder.customer?.name}</div>
                <div className="text-slate-600">📞 {activeOrder.phone || activeOrder.customer?.phone}</div>
                {activeOrder.whatsapp && activeOrder.whatsapp !== activeOrder.phone && (
                  <div className="text-slate-600">💬 WhatsApp: {activeOrder.whatsapp}</div>
                )}
                <div className="text-slate-600">📍 {activeOrder.address || activeOrder.customer?.address || 'Doorstep Pickup'}</div>
                {activeOrder.landmark && (
                  <div className="text-slate-500 text-[11px]">Landmark: {activeOrder.landmark}</div>
                )}
              </div>

              <div className="flex flex-col justify-between space-y-3">
                <div className="space-y-1">
                  <span className="text-slate-400 font-bold uppercase tracking-wider block">Service & Pickup Slot</span>
                  <div className="font-bold text-slate-900">{activeOrder.serviceEmoji || '🧺'} {activeOrder.service || activeOrder.serviceName}</div>
                  <div className="text-slate-600">🗓️ {activeOrder.pickupDate || activeOrder.schedule?.pickupDate} ({activeOrder.pickupSlot || activeOrder.schedule?.pickupSlot})</div>
                  {activeOrder.notes && (
                    <div className="text-amber-800 bg-amber-50 p-2 rounded-lg border border-amber-200 text-[11px] mt-1">
                      <strong>Customer Note:</strong> {activeOrder.notes}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    icon={MessageSquare}
                    onClick={() => handleSendWhatsAppUpdate(activeOrder)}
                    className="flex-1 justify-center bg-emerald-50 border-emerald-300 text-emerald-700 hover:bg-emerald-100"
                  >
                    WhatsApp Update
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    icon={Navigation}
                    onClick={() => handleOpenGoogleMaps(activeOrder)}
                    className="flex-1 justify-center bg-blue-50 border-blue-300 text-blue-700 hover:bg-blue-100"
                  >
                    Maps Directions
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    icon={Printer}
                    onClick={() => setReceiptModalOrder(activeOrder)}
                    className="flex-1 justify-center bg-white border-brand-300 text-brand-700 hover:bg-brand-50"
                  >
                    Invoice
                  </Button>
                </div>
              </div>
            </div>

            {/* Quick Balance Payment Collection Card */}
            {(activeOrder.balanceAmount > 0 || (activeOrder.balanceAmount === undefined && activeOrder.paymentStatus !== 'PAID')) && (
              <div className="p-4 rounded-2xl bg-gradient-to-r from-rose-50 via-amber-50 to-orange-50 border border-rose-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-rose-600" />
                    <span className="font-black text-rose-950 text-xs uppercase tracking-wider">
                      Record In-Person / Online Balance Collection
                    </span>
                  </div>
                  <span className="font-mono font-bold text-xs text-rose-700 bg-rose-100 px-2 py-0.5 rounded-md">
                    Outstanding: {formatCurrency(activeOrder.balanceAmount !== undefined ? activeOrder.balanceAmount : (activeOrder.finalPrice || activeOrder.totalAmount))}
                  </span>
                </div>

                <form onSubmit={handleQuickCollectPayment} className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-end">
                  <div className="sm:col-span-4">
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Amount to Collect (₹) *</label>
                    <Input
                      type="number"
                      required
                      placeholder={`e.g. ${activeOrder.balanceAmount || activeOrder.totalAmount || 100}`}
                      value={collectionAmount}
                      onChange={(e) => setCollectionAmount(e.target.value)}
                      className="bg-white font-mono font-bold"
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Payment Method</label>
                    <select
                      value={collectionMode}
                      onChange={(e) => setCollectionMode(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-xl py-2 px-2 text-xs font-bold text-slate-800"
                    >
                      <option value="UPI_QR">📱 UPI / QR</option>
                      <option value="CASH">💵 Cash</option>
                      <option value="CARD">💳 Card</option>
                      <option value="NET_BANKING">🏦 Bank</option>
                    </select>
                  </div>

                  <div className="sm:col-span-3">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setCollectionAmount(String(activeOrder.balanceAmount !== undefined ? activeOrder.balanceAmount : activeOrder.totalAmount))}
                      className="w-full justify-center bg-white text-xs border-amber-300 text-amber-900 hover:bg-amber-100 py-2 font-bold"
                    >
                      [Collect Full Balance]
                    </Button>
                  </div>

                  <div className="sm:col-span-2">
                    <Button
                      type="submit"
                      variant="primary"
                      size="sm"
                      isLoading={isCollectingPayment}
                      className="w-full justify-center bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2"
                    >
                      ✓ Record
                    </Button>
                  </div>
                </form>
              </div>
            )}

            {/* GPS & Pickup Location Card */}
            <OrderMapCard
              location={activeOrder.pickupLocation || {
                formattedAddress: activeOrder.address || activeOrder.customer?.address,
                street: activeOrder.address || activeOrder.customer?.address,
                city: activeOrder.city || activeOrder.customer?.city || 'Hyderabad',
                latitude: 17.385044,
                longitude: 78.486671,
                locationSource: 'MANUAL',
              }}
              customerName={activeOrder.customerName || activeOrder.customer?.name}
              title="Doorstep Pickup Location Map"
            />

            {/* Status & Operational Progression Form */}
            <form onSubmit={handleUpdateStatus} className="p-5 rounded-2xl bg-brand-50/50 border border-brand-200 space-y-4">
              <h4 className="text-sm font-bold uppercase tracking-wider text-brand-900 font-display flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-brand-600" />
                <span>Update Order Progression & Inspection Details</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                    Customer Milestone *
                  </label>
                  <select
                    value={newCustomerStage}
                    onChange={(e) => setNewCustomerStage(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl py-2 px-3 text-xs font-bold text-slate-800"
                  >
                    {ORDER_CUSTOMER_STAGES.map((s) => (
                      <option key={s.key} value={s.key}>
                        {s.stepNumber > 0 ? `Stage ${s.stepNumber}: ` : ''}{s.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                    Internal Sub-Stage
                  </label>
                  <select
                    value={newInternalStage}
                    onChange={(e) => setNewInternalStage(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl py-2 px-3 text-xs font-semibold text-slate-800"
                  >
                    {Object.entries(INTERNAL_OPERATIONAL_STAGES).map(([k, v]) => (
                      <option key={k} value={k}>
                        {v.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                    Payment Status
                  </label>
                  <select
                    value={newPaymentStatus}
                    onChange={(e) => setNewPaymentStatus(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl py-2 px-3 text-xs font-bold text-slate-800"
                  >
                    <option value="PENDING">PENDING</option>
                    <option value="PAID">PAID</option>
                    <option value="REFUNDED">REFUNDED</option>
                    <option value="CANCELLED">CANCELLED</option>
                  </select>
                </div>
              </div>

              {/* Actual Weight & Final Price Fields for Doorstep Weighing / Inspection */}
              <div className="p-4 bg-white rounded-xl border border-brand-200 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1 flex items-center gap-1.5">
                    <Scale className="w-3.5 h-3.5 text-brand-600" />
                    <span>Actual Inspected Weight (Kg)</span>
                  </label>
                  <Input
                    type="number"
                    step="0.05"
                    placeholder={activeOrder.estimatedWeightKg || activeOrder.estimatedWeight ? `Est: ${activeOrder.estimatedWeightKg || activeOrder.estimatedWeight} Kg` : 'e.g. 4.5'}
                    value={actualWeight}
                    onChange={(e) => setActualWeight(e.target.value)}
                  />
                  <span className="text-[10px] text-slate-400">Doorstep calibrated weight in kilograms</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1 flex items-center gap-1.5">
                    <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Final Verified Amount (₹)</span>
                  </label>
                  <Input
                    type="number"
                    placeholder={`₹${activeOrder.priceSnapshot?.finalTotal || activeOrder.totalAmount || 0}`}
                    value={finalPrice}
                    onChange={(e) => setFinalPrice(e.target.value)}
                  />
                  <span className="text-[10px] text-slate-400">Final bill amount after weight/item verification</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                    Assign Delivery Executive / Staff
                  </label>
                  <select
                    value={assignedStaff}
                    onChange={(e) => setAssignedStaff(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl py-2 px-3 text-xs text-slate-800"
                  >
                    <option value="">Unassigned</option>
                    {staffList.map((st) => (
                      <option key={st.id} value={st.name}>
                        {st.name} ({st.role})
                      </option>
                    ))}
                  </select>
                </div>

                <Input
                  label="Customer Milestone Update Note"
                  placeholder="e.g. Garments picked up and verified at central hub"
                  value={statusNote}
                  onChange={(e) => setStatusNote(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                  Internal Admin Notes (Private)
                </label>
                <Textarea
                  rows={2}
                  placeholder="Internal notes, stains identified, special handling..."
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                />
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setDeleteTargetOrder(activeOrder)}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors active:scale-95"
                >
                  <Trash2 className="w-4 h-4 text-rose-600" />
                  <span>Delete Order</span>
                </button>

                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  className="w-full sm:flex-1 justify-center"
                  isLoading={isUpdating}
                >
                  Save Changes to Firebase
                </Button>
              </div>
            </form>

            {/* Selected Clothes / Items List */}
            {activeOrder.items && activeOrder.items.length > 0 && (
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 font-display">
                  Selected Items ({activeOrder.items.length})
                </h4>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 divide-y divide-slate-100 max-h-48 overflow-y-auto">
                  {activeOrder.items.map((it, idx) => (
                    <div key={idx} className="py-1.5 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span>{it.emoji || '👕'}</span>
                        <span className="font-semibold text-slate-800">{it.name}</span>
                        <span className="text-slate-400">× {it.quantity}</span>
                      </div>
                      <span className="font-bold text-slate-700">
                        {it.lineTotal ? formatCurrency(it.lineTotal) : (it.weightGramsEach ? `${(it.weightGramsEach * it.quantity) / 1000} Kg` : '—')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Status Timeline History */}
            {activeOrder.statusTimeline && activeOrder.statusTimeline.length > 0 && (
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 font-display">
                  Milestone Audit Timeline
                </h4>
                <div className="space-y-2">
                  {activeOrder.statusTimeline.map((tl, idx) => (
                    <div key={idx} className="p-3 rounded-xl bg-white border border-slate-200 text-xs flex items-center justify-between">
                      <div>
                        <span className="font-bold text-slate-900">{tl.label || tl.stage}</span>
                        {tl.note && <span className="text-slate-500 ml-2">• {tl.note}</span>}
                      </div>
                      <span className="text-[10px] text-slate-400">{formatDateTime(tl.timestamp)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        )}
      </Modal>

      {/* Assign Worker & Dispatch Modal */}
      <Modal
        isOpen={!!assignModalOrder}
        onClose={() => setAssignModalOrder(null)}
        maxWidth="max-w-lg"
        title={assignModalOrder ? `Dispatch Order #${assignModalOrder.orderNumber}` : 'Assign Delivery Rider'}
        subtitle="Select an active worker to attach to this order. The worker will instantly receive full customer location & contact details on their portal."
      >
        {assignModalOrder && (
          <div className="space-y-4">
            
            {/* Target Order Summary */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 font-display">
                  {assignModalOrder.serviceEmoji || '🧺'} {assignModalOrder.service || assignModalOrder.serviceName}
                </span>
                <span className="font-mono font-bold text-brand-600">
                  {formatCurrency(assignModalOrder.finalPrice || assignModalOrder.priceSnapshot?.finalTotal || assignModalOrder.totalAmount)}
                </span>
              </div>
              <div className="text-slate-600">
                <strong>Customer:</strong> {assignModalOrder.customerName || assignModalOrder.customer?.name} • 📞 {assignModalOrder.phone || assignModalOrder.customer?.phone}
              </div>
              <div className="text-slate-500 truncate">
                <strong>Pickup Address:</strong> {assignModalOrder.address || assignModalOrder.customer?.address}
              </div>
            </div>

            {/* Rider Selection List */}
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                Select Available Worker / Delivery Executive:
              </label>

              {staffList.filter(s => s.active !== false).length === 0 ? (
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-800 text-center">
                  No active workers available. Please create staff in the Staff Directory.
                </div>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {staffList.filter(s => s.active !== false).map((st) => {
                    const isCurrentAssigned = assignModalOrder.assignedStaff === st.name || assignModalOrder.assignedStaffId === st.id;
                    const activeAssignedCount = orders.filter(o => 
                      (o.assignedStaff === st.name || o.assignedStaffId === st.id) && 
                      o.customerStage !== 'DELIVERED' && 
                      o.customerStage !== 'CANCELLED'
                    ).length;

                    return (
                      <div
                        key={st.id}
                        className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                          isCurrentAssigned 
                            ? 'bg-purple-50/80 border-purple-300 ring-2 ring-purple-500/20' 
                            : 'bg-white border-slate-200 hover:border-purple-300 hover:bg-slate-50/80'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-xs">
                            {(st.name || 'W')[0].toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-slate-900 text-xs flex items-center gap-2">
                              <span className="truncate">{st.name}</span>
                              {st.dutyStatus === 'ON_DUTY' ? (
                                <span className="px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[9px] font-bold">
                                  🟢 Online
                                </span>
                              ) : (
                                <span className="px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[9px] font-bold">
                                  ⚪ Offline
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-500 mt-0.5 truncate">
                              📞 {st.phone} • {st.hub || 'Central Hub'}
                            </div>
                            <div className="text-[10px] text-purple-700 font-medium">
                              📦 {activeAssignedCount} active order{activeAssignedCount !== 1 ? 's' : ''} in queue
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleWhatsAppToWorker(assignModalOrder, st)}
                            title={`Send WhatsApp task alert to ${st.name}`}
                            className="w-8 h-8 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-white flex items-center justify-center shadow-xs active:scale-95 transition-all"
                          >
                            <MessageSquare className="w-4 h-4" />
                          </button>

                          <Button
                            type="button"
                            variant={isCurrentAssigned ? 'outline' : 'primary'}
                            size="sm"
                            isLoading={isDispatching}
                            onClick={() => handleAssignWorker(assignModalOrder, st)}
                            className="text-xs"
                          >
                            {isCurrentAssigned ? 'Re-Dispatch' : '⚡ Dispatch'}
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <Button variant="ghost" size="sm" onClick={() => setAssignModalOrder(null)}>
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Official Tax Invoice & Print Receipt Modal */}
      <ReceiptModal
        isOpen={!!receiptModalOrder}
        order={receiptModalOrder}
        onClose={() => setReceiptModalOrder(null)}
      />

      {/* Delete Order Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deleteTargetOrder}
        onClose={() => setDeleteTargetOrder(null)}
        onConfirm={handleDeleteOrder}
        title={`Delete Order #${deleteTargetOrder?.orderNumber || deleteTargetOrder?.id || ''}?`}
        message="This order will be permanently deleted from Firebase Firestore and removed from all dispatch queues. This action cannot be undone."
        confirmText="Delete Order"
        isLoading={isDeletingOrder}
      />

      {/* WhatsApp Automated Gateway Settings Modal */}
      <Modal
        isOpen={showGatewayModal}
        onClose={() => setShowGatewayModal(false)}
        maxWidth="max-w-2xl"
        title="WhatsApp Automated Notification Gateway"
        subtitle="Configure backend WhatsApp delivery so receipts and status updates are sent automatically to customer mobile phones without browser popups."
      >
        {gatewayConfig && (
          <form onSubmit={handleSaveGateway} className="space-y-5 text-left text-xs">
            <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200 space-y-2">
              <div className="flex items-center gap-2 font-bold text-emerald-950 text-sm">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>Zero-Popup Automated WhatsApp Architecture</span>
              </div>
              <p className="text-emerald-800 leading-relaxed">
                When customers book pickups, the system dispatches their full order confirmation and real-time tracking link directly to their WhatsApp number via your backend gateway.
              </p>
            </div>

            {/* Provider Selector */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Select WhatsApp Delivery Gateway:
              </label>
              <select
                value={gatewayConfig.provider || 'DIRECT_BACKGROUND'}
                onChange={(e) => setGatewayConfig({ ...gatewayConfig, provider: e.target.value })}
                className="w-full bg-white border border-slate-300 rounded-xl py-2.5 px-3 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500"
              >
                <option value="DIRECT_BACKGROUND">⚡ Direct Automated Background Service (Built-In Zero Setup)</option>
                <option value="META_CLOUD_API">🌐 Meta WhatsApp Cloud API (Official Business API)</option>
                <option value="GREEN_API">🟢 Green API (Instance & Token)</option>
                <option value="ULTRAMSG">💬 UltraMsg WhatsApp Gateway</option>
                <option value="WEBHOOK">🔗 Custom Webhook / Firebase Cloud Function / Zapier</option>
              </select>
            </div>

            {/* Provider Specific Configuration Fields */}
            {gatewayConfig.provider === 'META_CLOUD_API' && (
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <h4 className="font-bold text-slate-900 text-xs">Meta WhatsApp Cloud API Credentials</h4>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Phone Number ID</label>
                  <Input
                    placeholder="e.g. 109283746592817"
                    value={gatewayConfig.meta?.phoneNumberId || ''}
                    onChange={(e) => setGatewayConfig({
                      ...gatewayConfig,
                      meta: { ...gatewayConfig.meta, phoneNumberId: e.target.value }
                    })}
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">System User Access Token (Permanent)</label>
                  <Input
                    type="password"
                    placeholder="EAAG..."
                    value={gatewayConfig.meta?.accessToken || ''}
                    onChange={(e) => setGatewayConfig({
                      ...gatewayConfig,
                      meta: { ...gatewayConfig.meta, accessToken: e.target.value }
                    })}
                  />
                </div>
              </div>
            )}

            {gatewayConfig.provider === 'GREEN_API' && (
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <h4 className="font-bold text-slate-900 text-xs">Green API Credentials</h4>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Instance ID</label>
                  <Input
                    placeholder="e.g. 1101823928"
                    value={gatewayConfig.greenApi?.instanceId || ''}
                    onChange={(e) => setGatewayConfig({
                      ...gatewayConfig,
                      greenApi: { ...gatewayConfig.greenApi, instanceId: e.target.value }
                    })}
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">API Token Instance</label>
                  <Input
                    type="password"
                    placeholder="e.g. 4d7f9a8b1c..."
                    value={gatewayConfig.greenApi?.apiToken || ''}
                    onChange={(e) => setGatewayConfig({
                      ...gatewayConfig,
                      greenApi: { ...gatewayConfig.greenApi, apiToken: e.target.value }
                    })}
                  />
                </div>
              </div>
            )}

            {gatewayConfig.provider === 'ULTRAMSG' && (
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <h4 className="font-bold text-slate-900 text-xs">UltraMsg API Credentials</h4>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Instance ID</label>
                  <Input
                    placeholder="e.g. instance12345"
                    value={gatewayConfig.ultraMsg?.instanceId || ''}
                    onChange={(e) => setGatewayConfig({
                      ...gatewayConfig,
                      ultraMsg: { ...gatewayConfig.ultraMsg, instanceId: e.target.value }
                    })}
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Token</label>
                  <Input
                    type="password"
                    placeholder="e.g. abcdef123456"
                    value={gatewayConfig.ultraMsg?.token || ''}
                    onChange={(e) => setGatewayConfig({
                      ...gatewayConfig,
                      ultraMsg: { ...gatewayConfig.ultraMsg, token: e.target.value }
                    })}
                  />
                </div>
              </div>
            )}

            {gatewayConfig.provider === 'WEBHOOK' && (
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <h4 className="font-bold text-slate-900 text-xs">Custom Backend Webhook Endpoint</h4>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Webhook URL (POST payload)</label>
                  <Input
                    placeholder="https://your-api.com/api/send-whatsapp"
                    value={gatewayConfig.webhook?.url || ''}
                    onChange={(e) => setGatewayConfig({
                      ...gatewayConfig,
                      webhook: { ...gatewayConfig.webhook, url: e.target.value }
                    })}
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Optional Secret Header Token</label>
                  <Input
                    type="password"
                    placeholder="Bearer secret_token_here"
                    value={gatewayConfig.webhook?.secretKey || ''}
                    onChange={(e) => setGatewayConfig({
                      ...gatewayConfig,
                      webhook: { ...gatewayConfig.webhook, secretKey: e.target.value }
                    })}
                  />
                </div>
              </div>
            )}

            {/* Test Gateway Box */}
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 space-y-2">
              <div className="font-bold text-amber-950 text-xs">Test Live WhatsApp Dispatch</div>
              <div className="flex gap-2">
                <Input
                  placeholder="Enter 10-digit mobile number (e.g. 6304845567)"
                  value={testPhone}
                  onChange={(e) => setTestPhone(e.target.value)}
                  className="flex-1 bg-white"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  isLoading={isTestingGateway}
                  onClick={handleTestGatewayDispatch}
                  className="bg-white border-amber-300 text-amber-900 hover:bg-amber-100 shrink-0"
                >
                  Send Test
                </Button>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <Button type="button" variant="ghost" size="sm" onClick={() => setShowGatewayModal(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm" isLoading={isSavingGateway}>
                Save Gateway Settings
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* ─────────────────────────────────────────────────────────
          In-Store / Walk-in Customer POS & Invoice Creation Modal
      ───────────────────────────────────────────────────────── */}
      <Modal
        isOpen={showWalkInModal}
        onClose={() => setShowWalkInModal(false)}
        maxWidth="max-w-5xl"
        title="➕ In-Store Walk-in Customer POS & Tax Invoice Generator"
        subtitle="Create official shop walk-in orders, add garments/starch items, compute totals, collect payment, and generate printable & WhatsApp invoices instantly."
      >
        <form onSubmit={handleCreateWalkInOrder} className="space-y-6 text-xs max-h-[82vh] overflow-y-auto pr-1">
          
          {/* Top Banner & Branch Selector */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-orange-50 via-amber-50 to-orange-50 border border-orange-200 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#F97316] text-white flex items-center justify-center font-black">
                <Store className="w-4 h-4" />
              </div>
              <div>
                <div className="font-black text-slate-900 text-xs">Direct Shop Walk-in / Drop Counter POS</div>
                <div className="text-[11px] text-slate-500">Auto-generates verified Tax Invoice & WhatsApp message upon submission</div>
              </div>
            </div>
            <div className="w-full sm:w-auto flex items-center gap-2">
              <label className="text-slate-700 font-bold text-[11px] whitespace-nowrap">Counter Machine:</label>
              <select
                value={walkInForm.terminalId || 'counter-1'}
                onChange={(e) => {
                  const selectedId = e.target.value;
                  const branch = STORE_BRANCHES.find(b => b.id === selectedId) || STORE_BRANCHES[0];
                  setWalkInForm({
                    ...walkInForm,
                    terminalId: branch.id,
                    terminalCode: branch.code,
                    storeBranch: branch.locationName,
                    cashierName: branch.cashierName,
                  });
                }}
                className="bg-white border border-orange-300 rounded-xl py-1.5 px-3 text-xs font-bold text-slate-900 shadow-2xs outline-none focus:ring-2 focus:ring-[#F97316]"
              >
                {STORE_BRANCHES.map((b) => (
                  <option key={b.id} value={b.id}>
                    🏪 {b.name} ({b.code}) — {b.cashierName.split(' ')[0]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Customer Information Grid */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3">
            <div className="flex items-center gap-2 font-bold text-slate-900 uppercase tracking-wider text-xs border-b border-slate-100 pb-2">
              <User className="w-4 h-4 text-[#F97316]" />
              <span>Customer Information</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Customer Full Name *</label>
                <Input
                  required
                  placeholder="e.g. Ramesh Kumar"
                  value={walkInForm.customerName}
                  onChange={(e) => setWalkInForm({ ...walkInForm, customerName: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">10-Digit Mobile / WhatsApp *</label>
                <Input
                  required
                  type="tel"
                  placeholder="e.g. 9876543210"
                  value={walkInForm.phone}
                  onChange={(e) => setWalkInForm({ ...walkInForm, phone: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Email (Optional)</label>
                <Input
                  type="email"
                  placeholder="customer@example.com"
                  value={walkInForm.email}
                  onChange={(e) => setWalkInForm({ ...walkInForm, email: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* Service Selector Chips */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2 font-bold text-slate-900 uppercase tracking-wider text-xs">
                <Sparkles className="w-4 h-4 text-[#F97316]" />
                <span>Select Core Service</span>
              </div>
              <span className="text-[11px] font-bold text-[#EA580C]">
                Selected: {walkInForm.serviceEmoji} {walkInForm.serviceName}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
              {WALK_IN_SERVICES.map((srv) => {
                const isSelected = walkInForm.serviceId === srv.id;
                return (
                  <button
                    key={srv.id}
                    type="button"
                    onClick={() => handleSelectWalkInService(srv)}
                    className={`p-2.5 rounded-xl border text-left transition-all flex flex-col justify-between gap-1 cursor-pointer ${
                      isSelected
                        ? 'bg-[#FFF7ED] border-[#F97316] ring-2 ring-[#F97316]/20 shadow-xs'
                        : 'bg-slate-50 border-slate-200 hover:bg-slate-100/80 hover:border-slate-300'
                    }`}
                  >
                    <div className="text-xl">{srv.emoji}</div>
                    <div className="font-bold text-slate-900 text-[11px] leading-tight line-clamp-2">
                      {srv.name}
                    </div>
                    <div className="text-[10px] text-slate-500 font-semibold">
                      {srv.perKg ? `₹${srv.defaultPrice}/Kg` : `From ₹${srv.defaultPrice}`}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Pricing Mode Toggle: Per Item vs Per Kg */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-700">Billing Mode:</span>
                <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200">
                  <button
                    type="button"
                    onClick={() => setWalkInForm({ ...walkInForm, pricingType: 'per_item' })}
                    className={`px-3 py-1 rounded-lg font-bold text-xs cursor-pointer transition-all ${
                      walkInForm.pricingType === 'per_item'
                        ? 'bg-white text-slate-900 shadow-2xs'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    👔 Itemized Garments
                  </button>
                  <button
                    type="button"
                    onClick={() => setWalkInForm({ ...walkInForm, pricingType: 'per_kg' })}
                    className={`px-3 py-1 rounded-lg font-bold text-xs cursor-pointer transition-all ${
                      walkInForm.pricingType === 'per_kg'
                        ? 'bg-white text-slate-900 shadow-2xs'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    ⚖️ Weight Based (Per Kg)
                  </button>
                </div>
              </div>

              {walkInForm.pricingType === 'per_kg' && (
                <div className="flex flex-wrap items-center gap-2 bg-purple-50 px-3 py-1.5 rounded-xl border border-purple-200">
                  <span className="font-bold text-purple-900 text-xs">Weighed Laundry:</span>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      step="0.1"
                      placeholder="Weight"
                      value={walkInForm.weightKg}
                      onChange={(e) => setWalkInForm({ ...walkInForm, weightKg: e.target.value })}
                      className="w-20 px-2 py-1 bg-white border border-purple-300 rounded-lg text-xs font-bold text-purple-950 outline-none"
                      title="Edit Weight (Kg)"
                    />
                    <span className="font-bold text-purple-700 text-xs">Kg @ ₹</span>
                    <input
                      type="number"
                      min="1"
                      value={walkInForm.pricePerKg}
                      onChange={(e) => setWalkInForm({ ...walkInForm, pricePerKg: Number(e.target.value) || 0 })}
                      className="w-16 px-1.5 py-1 bg-white border border-purple-300 rounded-lg text-xs font-bold text-purple-950 outline-none"
                      title="Edit Rate per Kg"
                    />
                    <span className="font-bold text-purple-700 text-xs">/Kg</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Master Catalog Category Filter & Search Bar */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2 font-bold text-slate-900 uppercase tracking-wider text-xs">
                <Tag className="w-4 h-4 text-[#F97316]" />
                <span>Garment & Service Master Price Catalog ({MASTER_CATALOG_ITEMS.length} Items)</span>
              </div>
              <span className="text-[11px] text-slate-400">Filter by category or search item name</span>
            </div>

            {/* Category Filter Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {POS_CATEGORIES.map((cat) => {
                const isActive = walkInItemCategory === cat.key;
                const count = cat.key === 'ALL' 
                  ? MASTER_CATALOG_ITEMS.length 
                  : MASTER_CATALOG_ITEMS.filter(it => it.categoryKey === cat.key).length;
                return (
                  <button
                    key={cat.key}
                    type="button"
                    onClick={() => setWalkInItemCategory(cat.key)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap border flex items-center gap-1.5 cursor-pointer ${
                      isActive
                        ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                    }`}
                  >
                    <span>{cat.emoji}</span>
                    <span>{cat.label}</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                      isActive ? 'bg-white/20 text-white' : 'bg-slate-200/80 text-slate-600'
                    }`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Search Input for Instant Filtering */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="🔍 Search across 70+ catalog items (e.g. Saree, Blazer, Kurta, Bedsheet, Shoes, Quilt, Stain, Zari)..."
                value={walkInItemSearch}
                onChange={(e) => setWalkInItemSearch(e.target.value)}
                className="w-full pl-10 pr-24 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 font-medium focus:ring-2 focus:ring-[#F97316] outline-none"
              />
              {walkInItemSearch && (
                <button
                  type="button"
                  onClick={() => setWalkInItemSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 font-bold text-xs cursor-pointer"
                >
                  ✕ Clear
                </button>
              )}
            </div>

            {/* Catalog Items Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 max-h-64 overflow-y-auto pr-1">
              {filteredCatalogItems.length === 0 ? (
                <div className="col-span-full py-6 text-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-xs">
                  No items match "{walkInItemSearch}". Use the Manual Custom Billing box below to add any custom item or rate.
                </div>
              ) : (
                filteredCatalogItems.map((item) => {
                  const existingItem = walkInForm.items.find(it => it.name === item.name);
                  const isAdded = !!existingItem;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleAddCatalogItem(item)}
                      className={`p-2.5 rounded-xl border text-left transition-all group flex flex-col justify-between gap-1.5 cursor-pointer active:scale-95 ${
                        isAdded
                          ? 'bg-orange-50/90 border-orange-300 ring-1 ring-orange-400/30'
                          : 'bg-slate-50 hover:bg-orange-50/50 border-slate-200 hover:border-orange-200'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-1">
                        <span className="text-base">{item.emoji}</span>
                        {isAdded && (
                          <span className="px-1.5 py-0.5 rounded-md bg-[#F97316] text-white text-[9px] font-black font-mono">
                            ×{existingItem.quantity}
                          </span>
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="font-bold text-slate-900 text-[11px] truncate group-hover:text-orange-950" title={item.name}>
                          {item.name}
                        </div>
                        <div className="text-[10px] text-slate-500 truncate">
                          {item.categoryName}
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 mt-0.5">
                        <span className="font-mono font-bold text-[#EA580C] text-xs">
                          ₹{item.price}
                        </span>
                        <span className="text-[10px] font-bold text-slate-600 group-hover:text-[#EA580C]">
                          + Add
                        </span>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* ─────────────────────────────────────────────────────────
              Dedicated Manual Custom Billing & Extra Charges Section
          ───────────────────────────────────────────────────────── */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-emerald-500/10 border-2 border-[#F97316]/30 shadow-xs space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-orange-200/60 pb-2">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-[#F97316] to-[#EA580C] text-white flex items-center justify-center shadow-xs">
                  <Zap className="w-3.5 h-3.5" />
                </div>
                <div>
                  <span className="font-black text-slate-900 text-xs uppercase tracking-wider">
                    Manual Custom Billing & Extra Charges
                  </span>
                  <span className="text-[11px] text-slate-600 block">
                    Enter any custom garment, urgent stain treatment, alteration, zari polishing, extra delivery or custom fee with direct calculation.
                  </span>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-white border border-orange-300 text-[10px] font-bold text-[#EA580C]">
                ⚡ Live Calculation
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-end">
              <div className="sm:col-span-5">
                <label className="block text-[11px] font-bold text-slate-800 mb-1">
                  Custom Item / Service Description *
                </label>
                <Input
                  placeholder="e.g. Heavy Wine Stain Removal, Silk Lehenga Dry Clean, Zari Polishing, Extra Packaging"
                  value={manualCustomItem.name}
                  onChange={(e) => setManualCustomItem({ ...manualCustomItem, name: e.target.value })}
                  className="bg-white text-xs font-semibold"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] font-bold text-slate-800 mb-1">
                  Amount (₹) *
                </label>
                <Input
                  type="number"
                  placeholder="e.g. 250"
                  value={manualCustomItem.unitPrice}
                  onChange={(e) => setManualCustomItem({ ...manualCustomItem, unitPrice: e.target.value })}
                  className="bg-white text-xs font-bold font-mono text-emerald-900"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] font-bold text-slate-800 mb-1">
                  Quantity
                </label>
                <Input
                  type="number"
                  min="1"
                  placeholder="1"
                  value={manualCustomItem.quantity}
                  onChange={(e) => setManualCustomItem({ ...manualCustomItem, quantity: e.target.value })}
                  className="bg-white text-xs font-bold font-mono"
                />
              </div>

              <div className="sm:col-span-3">
                <Button
                  type="button"
                  variant="primary"
                  size="md"
                  onClick={handleAddManualCustomCharge}
                  className="w-full justify-center bg-gradient-to-r from-[#F97316] to-[#EA580C] hover:from-[#EA580C] hover:to-[#C2410C] text-white shadow-md font-bold text-xs py-2.5"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  <span>+ Add to Bill & Calculate</span>
                </Button>
              </div>
            </div>
          </div>

          {/* Itemized Line Items Table */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2 font-bold text-slate-900 uppercase tracking-wider text-xs">
                <Receipt className="w-4 h-4 text-[#F97316]" />
                <span>Invoice Line Items ({walkInForm.items.length})</span>
              </div>
              {walkInForm.items.length > 0 && (
                <button
                  type="button"
                  onClick={() => setWalkInForm({ ...walkInForm, items: [] })}
                  className="text-rose-600 hover:text-rose-700 font-bold text-[11px] cursor-pointer"
                >
                  Clear All Items
                </button>
              )}
            </div>

            {walkInForm.items.length === 0 ? (
              <div className="py-6 text-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                No items added yet. Click on popular garments above or enter a custom item.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 max-h-56 overflow-y-auto pr-1">
                {walkInForm.items.map((item, idx) => (
                  <div key={item.id || idx} className="py-2.5 flex flex-wrap sm:flex-nowrap items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2 min-w-0 sm:w-1/3">
                      <span className="text-base shrink-0">{item.emoji || '👕'}</span>
                      <div className="min-w-0 flex-1">
                        <input
                          type="text"
                          value={item.name}
                          onChange={(e) => handleUpdateWalkInItemName(idx, e.target.value)}
                          className="font-bold text-slate-900 bg-transparent hover:bg-slate-100 focus:bg-white border-b border-transparent hover:border-slate-300 focus:border-orange-500 px-1 py-0.5 rounded outline-none w-full text-xs"
                          title="Click to edit item / sub-service name"
                        />
                        <div className="text-[10px] text-slate-400 truncate pl-1">{item.category || 'General'}</div>
                      </div>
                    </div>

                    {/* Rate / Unit Price Editor */}
                    <div className="flex items-center gap-1.5 shrink-0 bg-orange-50/70 px-2 py-1 rounded-xl border border-orange-200">
                      <span className="text-[10px] font-bold text-slate-600 uppercase">Rate:</span>
                      <span className="text-xs font-bold text-[#EA580C]">₹</span>
                      <input
                        type="number"
                        min="0"
                        step="5"
                        value={item.unitPrice}
                        onChange={(e) => handleUpdateItemUnitPrice(idx, e.target.value)}
                        className="w-16 px-1.5 py-0.5 text-xs font-black font-mono text-slate-900 bg-white border border-orange-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F97316] text-center"
                        title="Edit unit price / rate in ₹"
                      />
                      <div className="flex items-center gap-0.5">
                        <button
                          type="button"
                          onClick={() => handleUpdateItemUnitPrice(idx, Math.max(0, Number(item.unitPrice) - 10))}
                          className="w-4 h-4 rounded bg-white hover:bg-orange-100 text-[10px] font-bold text-slate-600 flex items-center justify-center border border-orange-200 transition-colors cursor-pointer"
                          title="Decrease rate by ₹10"
                        >
                          -
                        </button>
                        <button
                          type="button"
                          onClick={() => handleUpdateItemUnitPrice(idx, Number(item.unitPrice) + 10)}
                          className="w-4 h-4 rounded bg-white hover:bg-orange-100 text-[10px] font-bold text-slate-600 flex items-center justify-center border border-orange-200 transition-colors cursor-pointer"
                          title="Increase rate by ₹10"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      {/* Quantity Stepper */}
                      <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                        <button
                          type="button"
                          onClick={() => handleUpdateItemQty(idx, -1)}
                          className="w-6 h-6 rounded bg-white hover:bg-rose-50 text-slate-700 hover:text-rose-600 font-bold flex items-center justify-center transition-colors cursor-pointer"
                          title="Decrease quantity"
                        >
                          -
                        </button>
                        <span className="w-6 text-center font-bold font-mono text-slate-900">{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => handleUpdateItemQty(idx, 1)}
                          className="w-6 h-6 rounded bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-600 font-bold flex items-center justify-center transition-colors cursor-pointer"
                          title="Increase quantity"
                        >
                          +
                        </button>
                      </div>

                      <div className="w-18 text-right font-black font-mono text-slate-900">
                        ₹{item.unitPrice * item.quantity}
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveItem(idx)}
                        className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer transition-colors"
                        title="Remove garment"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Speed & Payment Configuration */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Speed */}
            <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-2">
              <label className="block text-slate-700 font-bold uppercase tracking-wider text-[11px]">
                ⚡ Turnaround Speed
              </label>
              <select
                value={walkInForm.expressOption}
                onChange={(e) => setWalkInForm({ ...walkInForm, expressOption: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl py-2 px-3 text-xs font-bold text-slate-800"
              >
                <option value="STANDARD">🛡️ Standard (48 Hours) — Regular</option>
                <option value="EXPRESS_24">⚡ Express 24-Hours (+25%)</option>
                <option value="SAME_DAY">🚀 Same-Day 12-Hours (+50%)</option>
              </select>
            </div>

            {/* Payment Method & Received / Balance Due */}
            <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-slate-700 font-bold uppercase tracking-wider text-[11px]">
                  💳 In-Store Payment & Receipt
                </label>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setWalkInForm({ ...walkInForm, receivedAmount: String(walkInFinalTotal), paymentStatus: 'PAID' })}
                    className="text-[10px] font-black px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 hover:bg-emerald-200 cursor-pointer"
                  >
                    [Full Paid]
                  </button>
                  <button
                    type="button"
                    onClick={() => setWalkInForm({ ...walkInForm, receivedAmount: '0', paymentStatus: 'PENDING' })}
                    className="text-[10px] font-black px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 hover:bg-rose-200 cursor-pointer"
                  >
                    [Unpaid]
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Amount Received (₹)</label>
                  <Input
                    type="number"
                    placeholder={`₹${walkInFinalTotal}`}
                    value={walkInForm.receivedAmount}
                    onChange={(e) => {
                      const val = e.target.value;
                      const num = Number(val) || 0;
                      const status = num >= walkInFinalTotal ? 'PAID' : (num > 0 ? 'PARTIAL' : 'PENDING');
                      setWalkInForm({ ...walkInForm, receivedAmount: val, paymentStatus: status });
                    }}
                    className="bg-slate-50 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Payment Mode</label>
                  <select
                    value={walkInForm.paymentMethod}
                    onChange={(e) => setWalkInForm({ ...walkInForm, paymentMethod: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl py-2 px-2 text-xs font-bold text-slate-800"
                  >
                    <option value="CASH">💵 Cash</option>
                    <option value="UPI_QR">📱 UPI / QR</option>
                    <option value="CARD">💳 Card</option>
                    <option value="NET_BANKING">🏦 Net Banking</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[11px]">
                <span className="text-slate-500 font-semibold">Balance Due:</span>
                <span className={`font-mono font-black ${walkInBalanceDue > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                  {walkInBalanceDue > 0 ? `₹${walkInBalanceDue} Due` : '✅ ₹0 (Cleared)'}
                </span>
              </div>
            </div>
          </div>

          {/* Notes & Instructions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-700 font-bold mb-1">Customer / Garment Notes (Printed on Invoice)</label>
              <Input
                placeholder="e.g. Collar starch extra crisp, silk saree dry clean only"
                value={walkInForm.notes}
                onChange={(e) => setWalkInForm({ ...walkInForm, notes: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-slate-700 font-bold mb-1">Internal Counter Remarks (Admin Only)</label>
              <Input
                placeholder="e.g. Counter rack #B3, hanger delivery"
                value={walkInForm.internalAdminNotes}
                onChange={(e) => setWalkInForm({ ...walkInForm, internalAdminNotes: e.target.value })}
              />
            </div>
          </div>

          {/* Live Bill Summary Card */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 text-white shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1 text-left w-full sm:w-auto">
              <div className="text-slate-400 text-xs font-semibold">Bill Calculation Breakdown (0% GST)</div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-300">
                <span>Subtotal: <strong>₹{walkInSubtotal}</strong></span>
                {walkInExpressFee > 0 && <span className="text-amber-400">Express: <strong>+₹{walkInExpressFee}</strong></span>}
              </div>
            </div>

            <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
              <div className="text-right">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Total Bill (Editable)</span>
                <div className="flex items-center gap-1">
                  <span className="text-base font-bold text-[#F97316]">₹</span>
                  <input
                    type="number"
                    min="0"
                    value={walkInForm.customGrandTotal !== '' ? walkInForm.customGrandTotal : walkInCalculatedTotal}
                    onChange={(e) => setWalkInForm({ ...walkInForm, customGrandTotal: e.target.value })}
                    className="w-24 px-2 py-1 bg-slate-800 border border-orange-400/50 rounded-lg text-lg font-black font-mono text-[#F97316] text-right outline-none focus:ring-2 focus:ring-orange-500"
                    title="Click to edit total bill amount"
                  />
                  {walkInForm.customGrandTotal !== '' && (
                    <button
                      type="button"
                      onClick={() => setWalkInForm({ ...walkInForm, customGrandTotal: '' })}
                      className="text-[10px] text-slate-400 hover:text-white px-1.5 py-1 rounded bg-slate-700 font-bold cursor-pointer"
                      title="Reset to auto-calculated total"
                    >
                      ↺
                    </button>
                  )}
                </div>
              </div>
              <div className="text-right border-l border-white/10 pl-4">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Balance Due</span>
                <span className={`text-xl sm:text-2xl font-black font-mono ${walkInBalanceDue > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {formatCurrency(walkInBalanceDue)}
                </span>
              </div>
            </div>
          </div>

          {/* Instant Actions & Generation Options */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-800">
                <input
                  type="checkbox"
                  checked={walkInForm.autoOpenReceipt}
                  onChange={(e) => setWalkInForm({ ...walkInForm, autoOpenReceipt: e.target.checked })}
                  className="rounded text-[#F97316] focus:ring-[#F97316] w-4 h-4 cursor-pointer"
                />
                <span>Auto-open Printable Tax Invoice Modal</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer font-bold text-emerald-800">
                <input
                  type="checkbox"
                  checked={walkInForm.autoSendWhatsApp}
                  onChange={(e) => setWalkInForm({ ...walkInForm, autoSendWhatsApp: e.target.checked })}
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                />
                <span>📲 Dispatch WhatsApp Invoice Instantly</span>
              </label>
            </div>

            <div className="flex items-center gap-2">
              <Button type="button" variant="ghost" size="sm" onClick={() => setShowWalkInModal(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="md"
                isLoading={isCreatingWalkIn}
                className="bg-gradient-to-r from-[#F97316] to-[#EA580C] hover:from-[#EA580C] hover:to-[#C2410C] text-white shadow-lg font-bold"
              >
                🧾 Save Order & Generate Invoice
              </Button>
            </div>
          </div>

        </form>
      </Modal>

      {/* Printable Receipt Modal */}
      {receiptModalOrder && (
        <ReceiptModal
          isOpen={Boolean(receiptModalOrder)}
          order={receiptModalOrder}
          onClose={() => setReceiptModalOrder(null)}
        />
      )}

    </div>
  );
};



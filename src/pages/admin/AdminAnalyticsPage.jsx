import React, { useState, useEffect } from 'react';
import { analyticsService } from '../../services/analyticsService';
import { formatCurrency } from '../../utils/formatters';
import { Card } from '../../components/ui/Card';
import { StatCard } from '../../components/ui/StatCard';
import { AdminPageHeader } from '../../components/admin/AdminPageHeader';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Phone, 
  MessageSquare, 
  Activity, 
  Globe, 
  Layers, 
  DollarSign, 
  ShoppingBag 
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid,
  LineChart,
  Line
} from 'recharts';

export const AdminAnalyticsPage = () => {
  const [biData, setBiData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    analyticsService.getBusinessIntelligence()
      .then(setBiData)
      .finally(() => setLoading(false));
  }, []);

  const ops = biData?.operations || {};
  const rev = biData?.revenue || {};
  const cust = biData?.customers || {};
  const funnel = biData?.funnel || [];
  const telemetry = biData?.telemetry || {};

  return (
    <div className="space-y-8">
      <AdminPageHeader
        title="Analytics & Telemetry Intelligence"
        subtitle="SaaS conversion telemetry, customer retention KPIs, and revenue analytics."
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Total Platform Revenue"
          value={formatCurrency(rev.totalRevenue || 0)}
          subtitle="Net accumulated revenue"
          icon={DollarSign}
          iconBg="bg-emerald-50 text-emerald-600"
        />
        <StatCard
          title="Total Lifetime Orders"
          value={ops.totalOrders || 0}
          subtitle={`Delivered: ${ops.deliveredCount || 0}`}
          icon={ShoppingBag}
          iconBg="bg-brand-50 text-brand-600"
        />
        <StatCard
          title="WhatsApp Inquiries"
          value={telemetry.whatsappClicks || 0}
          subtitle="Direct customer leads"
          icon={MessageSquare}
          iconBg="bg-emerald-50 text-emerald-600"
        />
        <StatCard
          title="Phone Inquiries"
          value={telemetry.phoneClicks || 0}
          subtitle="Direct phone call clicks"
          icon={Phone}
          iconBg="bg-royal-50 text-royal-600"
        />
      </div>

      {/* Conversion Funnel */}
      <Card variant="luxury" className="p-8">
        <h3 className="text-base font-bold uppercase tracking-wider text-slate-900 font-display mb-6">
          Full Conversion Funnel Analysis
        </h3>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 text-center">
          {funnel.map((step, idx) => (
            <div key={idx} className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Stage {idx + 1}
              </span>
              <h4 className="text-2xl font-black text-slate-900 font-display">
                {step.count}
              </h4>
              <div className="text-xs font-semibold text-slate-700">
                {step.step}
              </div>
              <div className="text-[11px] font-bold text-brand-600">
                {step.percentage}% conversion
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Revenue Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-6">
          <Card variant="luxury" className="p-6">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 font-display mb-4">
              Service Revenue Distribution
            </h3>
            <div className="h-64">
              {rev.serviceRevenueChart && rev.serviceRevenueChart.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={rev.serviceRevenueChart}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
                    <YAxis stroke="#94a3b8" fontSize={11} tickFormatter={(v) => `₹${v}`} />
                    <Tooltip
                      formatter={(val) => [formatCurrency(val), 'Revenue']}
                      contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
                    />
                    <Bar dataKey="revenue" fill="#0284c7" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-slate-400">
                  Data will populate with orders.
                </div>
              )}
            </div>
          </Card>
        </div>

        <div className="lg:col-span-6">
          <Card variant="luxury" className="p-6">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 font-display mb-4">
              Customer Retention Breakdown
            </h3>
            <div className="space-y-4 pt-4">
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-600">New Customers:</span>
                <span className="font-bold text-slate-900">{cust.newCustomers || 0}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-600">Returning Customers:</span>
                <span className="font-bold text-brand-600">{cust.returningCustomers || 0}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-600">VIP High-Value Segment:</span>
                <span className="font-bold text-purple-600">{cust.vipCustomers || 0}</span>
              </div>
              <div className="flex justify-between items-center text-sm pt-3 border-t border-slate-100 font-bold">
                <span className="text-slate-800">Repeat Retention Rate:</span>
                <span className="text-emerald-600 text-base">{cust.repeatRatePercent || 0}%</span>
              </div>
            </div>
          </Card>
        </div>
      </div>

    </div>
  );
};

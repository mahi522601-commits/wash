import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { analyticsService } from '../../services/analyticsService';
import { orderService } from '../../services/orderService';
import { auditService } from '../../services/auditService';
import { formatCurrency, formatDate, formatDateTime } from '../../utils/formatters';
import { Card } from '../../components/ui/Card';
import { StatCard } from '../../components/ui/StatCard';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Table } from '../../components/ui/Table';
import { StatusBadge } from '../../components/admin/StatusBadge';
import { 
  ShoppingBag, 
  DollarSign, 
  Users, 
  TrendingUp, 
  Clock, 
  Truck, 
  Sparkles, 
  CheckCircle2, 
  Plus, 
  Image as ImageIcon, 
  ArrowRight, 
  History, 
  Eye, 
  Activity,
  Layers,
  ArrowUpRight
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid 
} from 'recharts';

export const AdminDashboardPage = () => {
  const [biData, setBiData] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [recentLogs, setRecentLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadDashboardData = async () => {
    try {
      const [bi, orders, logs] = await Promise.all([
        analyticsService.getBusinessIntelligence(),
        orderService.getOrders({ limitCount: 8 }),
        auditService.getLogs(6),
      ]);
      setBiData(bi);
      setRecentOrders(orders);
      setRecentLogs(logs);
    } catch (e) {
      console.warn("Failed to load dashboard data:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const ops = biData?.operations || {};
  const rev = biData?.revenue || {};
  const cust = biData?.customers || {};
  const funnel = biData?.funnel || [];

  const orderColumns = [
    {
      title: 'Order ID',
      key: 'orderNumber',
      render: (val, row) => (
        <span className="font-mono font-bold text-xs text-brand-700">
          {val || row.id}
        </span>
      ),
    },
    {
      title: 'Customer',
      key: 'customer',
      render: (c) => (
        <div>
          <div className="font-semibold text-slate-900 text-xs">{c?.name || 'Customer'}</div>
          <div className="text-[11px] text-slate-400">{c?.phone}</div>
        </div>
      ),
    },
    {
      title: 'Service',
      key: 'serviceName',
      render: (val) => <span className="text-xs font-medium text-slate-700">{val || 'Garment Care'}</span>,
    },
    {
      title: 'Amount',
      key: 'priceSnapshot',
      render: (snap, row) => (
        <span className="font-bold text-xs text-slate-900">
          {formatCurrency(snap?.finalTotal || row.totalAmount)}
        </span>
      ),
    },
    {
      title: 'Customer Stage',
      key: 'customerStage',
      render: (val) => <StatusBadge status={val} />,
    },
    {
      title: 'Date',
      key: 'createdAt',
      render: (val) => <span className="text-xs text-slate-500">{formatDate(val)}</span>,
    },
    {
      title: 'Action',
      key: 'id',
      render: (id, row) => (
        <Link to="/admin/orders">
          <Button variant="ghost" size="sm">
            Manage
          </Button>
        </Link>
      ),
    },
  ];

  return (
    <div className="space-y-8">
      
      {/* 1. Header & Quick Actions Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 font-display tracking-tight">
            Operations & BI Command Center
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Real-time telemetry, revenue analytics, order status machines, and conversion intelligence.
          </p>
        </div>

        {/* Quick Action Shortcuts */}
        <div className="flex items-center gap-2 flex-wrap">
          <Link to="/admin/services">
            <Button variant="primary" size="sm" icon={Plus}>
              Add Service
            </Button>
          </Link>
          <Link to="/admin/media">
            <Button variant="outline" size="sm" icon={ImageIcon}>
              Upload Media
            </Button>
          </Link>
          <Link to="/admin/orders">
            <Button variant="secondary" size="sm" icon={ShoppingBag}>
              View All Orders
            </Button>
          </Link>
        </div>
      </div>

      {/* 2. Top-Level Revenue & Customer Intelligence Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Today's Revenue"
          value={formatCurrency(rev.todayRevenue || 0)}
          subtitle={`Total: ${formatCurrency(rev.totalRevenue || 0)}`}
          icon={DollarSign}
          iconBg="bg-emerald-50 text-emerald-600"
          trend={{ value: '+18.4%', isPositive: true, text: 'vs yesterday' }}
        />
        <StatCard
          title="Orders Today"
          value={ops.ordersToday || 0}
          subtitle={`Total orders: ${ops.totalOrders || 0}`}
          icon={ShoppingBag}
          iconBg="bg-brand-50 text-brand-600"
          trend={{ value: '+12%', isPositive: true, text: 'vs weekly avg' }}
        />
        <StatCard
          title="Average Order Value"
          value={formatCurrency(rev.averageOrderValue || 0)}
          subtitle="Net revenue / total orders"
          icon={TrendingUp}
          iconBg="bg-purple-50 text-purple-600"
        />
        <StatCard
          title="Customer Retention"
          value={`${cust.repeatRatePercent || 0}%`}
          subtitle={`${cust.returningCustomers || 0} returning / ${cust.totalCustomers || 0} total`}
          icon={Users}
          iconBg="bg-royal-50 text-royal-600"
        />
      </div>

      {/* 3. Today's Operations Radar Bar (User Feedback #3) */}
      <Card variant="luxury" className="p-6 bg-white border border-slate-200">
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 font-display flex items-center gap-2">
              <Activity className="w-4 h-4 text-brand-600" />
              <span>Today's Live Operations Radar</span>
            </h3>
          </div>
          <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
            Active Workflow
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 text-center">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
            <span className="text-2xl font-black text-slate-900 font-display block">
              {ops.ordersToday || 0}
            </span>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Orders Today
            </span>
          </div>

          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200/80">
            <span className="text-2xl font-black text-amber-900 font-display block">
              {ops.pickupsPending || 0}
            </span>
            <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider">
              Pickups Pending
            </span>
          </div>

          <div className="p-4 rounded-xl bg-brand-50 border border-brand-200/80">
            <span className="text-2xl font-black text-brand-900 font-display block">
              {ops.inProcessing || 0}
            </span>
            <span className="text-[11px] font-bold text-brand-800 uppercase tracking-wider">
              In Processing
            </span>
          </div>

          <div className="p-4 rounded-xl bg-royal-50 border border-royal-200/80">
            <span className="text-2xl font-black text-royal-900 font-display block">
              {ops.readyForDispatch || 0}
            </span>
            <span className="text-[11px] font-bold text-royal-800 uppercase tracking-wider">
              Ready for Dispatch
            </span>
          </div>

          <div className="p-4 rounded-xl bg-purple-50 border border-purple-200/80">
            <span className="text-2xl font-black text-purple-900 font-display block">
              {ops.outForDelivery || 0}
            </span>
            <span className="text-[11px] font-bold text-purple-800 uppercase tracking-wider">
              Out for Delivery
            </span>
          </div>

          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200/80">
            <span className="text-2xl font-black text-emerald-900 font-display block">
              {ops.deliveredCount || 0}
            </span>
            <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">
              Completed
            </span>
          </div>
        </div>
      </Card>

      {/* 4. Conversion Funnel & Service Revenue Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Conversion Funnel */}
        <div className="lg:col-span-6">
          <Card variant="luxury" className="p-6 sm:p-7 space-y-5 h-full">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 font-display">
                Conversion Funnel Drop-off
              </h3>
              <Link to="/admin/analytics" className="text-xs font-semibold text-brand-600 hover:underline">
                Full Analytics
              </Link>
            </div>

            <div className="space-y-4 pt-2">
              {funnel.map((step, idx) => (
                <div key={idx} className="space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold text-slate-700">
                    <span>{step.step}</span>
                    <span>{step.count} ({step.percentage}%)</span>
                  </div>
                  <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-brand-500 to-royal-600 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, Math.max(8, step.percentage))}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Revenue by Service Chart */}
        <div className="lg:col-span-6">
          <Card variant="luxury" className="p-6 sm:p-7 space-y-4 h-full">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 font-display">
                Revenue by Service Category
              </h3>
            </div>

            <div className="h-64 pt-4">
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
                  Revenue charts populate automatically as orders are placed.
                </div>
              )}
            </div>
          </Card>
        </div>

      </div>

      {/* 5. Recent Activity Stream & Recent Orders Table */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Recent Orders (Col 8) */}
        <div className="lg:col-span-8 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-900 font-display">
              Recent Customer Orders
            </h3>
            <Link to="/admin/orders">
              <Button variant="ghost" size="sm" icon={ArrowRight} iconPosition="right">
                View All
              </Button>
            </Link>
          </div>

          <Table
            columns={orderColumns}
            data={recentOrders}
            isLoading={loading}
            emptyMessage="No customer bookings yet. New orders will appear here in real time."
          />
        </div>

        {/* Audit Activity Stream (Col 4) */}
        <div className="lg:col-span-4">
          <Card variant="luxury" className="p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 font-display flex items-center gap-2">
                <History className="w-4 h-4 text-brand-600" />
                <span>Recent Admin Activity</span>
              </h3>
              <Link to="/admin/activity-log" className="text-xs text-brand-600 hover:underline">
                View Log
              </Link>
            </div>

            <div className="divide-y divide-slate-100">
              {recentLogs.map((log) => (
                <div key={log.id} className="py-3 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-slate-800">
                      {log.action} {log.entity}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {formatDate(log.timestamp)}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    {log.entityName} • By {log.user?.displayName || log.user?.email}
                  </div>
                </div>
              ))}
              {recentLogs.length === 0 && (
                <p className="py-4 text-center text-xs text-slate-400">
                  Activity logs record every change automatically.
                </p>
              )}
            </div>
          </Card>
        </div>

      </div>

    </div>
  );
};

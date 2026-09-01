/**
 * Deep Business Intelligence & Analytics Engine for Tech Wash
 * Aggregates operations radar, revenue trends, customer retention, and conversion funnel
 */
import { logEvent } from 'firebase/analytics';
import { analytics } from './firebase.js';
import { orderService } from './orderService.js';
import { customerService } from './customerService.js';
import { serviceService } from './serviceService.js';

const LOCAL_EVENTS_KEY = 'techwash_analytics_events';

export const analyticsService = {
  /**
   * Dispatch analytics event
   */
  trackEvent(eventName, eventParams = {}) {
    // 1. Google Analytics 4 / Firebase Analytics
    if (analytics) {
      try {
        logEvent(analytics, eventName, eventParams);
      } catch (e) {
        // Analytics error ignored in dev
      }
    }

    // 2. Local buffer for Dashboard Funnel & Activity Insights
    try {
      const existing = JSON.parse(localStorage.getItem(LOCAL_EVENTS_KEY) || '[]');
      existing.unshift({
        event: eventName,
        params: eventParams,
        timestamp: new Date().toISOString(),
      });
      if (existing.length > 500) existing.pop();
      localStorage.setItem(LOCAL_EVENTS_KEY, JSON.stringify(existing));
    } catch (e) {
      // Local storage fallback
    }
  },

  /**
   * Compute comprehensive SaaS BI Dashboard Metrics
   */
  async getBusinessIntelligence() {
    const orders = await orderService.getOrders({ limitCount: 1000 });
    const customers = await customerService.getCustomers();
    const services = await serviceService.getServices();

    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // 1. Operations Radar Breakdown
    let ordersToday = 0;
    let pickupsPending = 0;
    let inProcessing = 0;
    let readyForDispatch = 0;
    let outForDelivery = 0;
    let deliveredCount = 0;

    // 2. Revenue Breakdown
    let todayRevenue = 0;
    let weeklyRevenue = 0;
    let monthlyRevenue = 0;
    let totalRevenue = 0;
    const serviceRevenueMap = {};

    orders.forEach((order) => {
      const orderDate = new Date(order.createdAt);
      const isToday = order.createdAt?.startsWith(todayStr);
      const isPastWeek = orderDate >= sevenDaysAgo;
      const isPastMonth = orderDate >= thirtyDaysAgo;
      const amount = Number(order.priceSnapshot?.finalTotal || order.totalAmount || 0);

      totalRevenue += amount;
      if (isToday) {
        ordersToday += 1;
        todayRevenue += amount;
      }
      if (isPastWeek) weeklyRevenue += amount;
      if (isPastMonth) monthlyRevenue += amount;

      // Status counters
      switch (order.customerStage) {
        case 'CONFIRMED':
        case 'PICKUP_SCHEDULED':
          pickupsPending += 1;
          break;
        case 'PICKED_UP':
        case 'INSPECTION':
        case 'CLEANING':
        case 'FINISHING':
          inProcessing += 1;
          break;
        case 'QUALITY_CHECK':
        case 'PACKED':
          readyForDispatch += 1;
          break;
        case 'OUT_FOR_DELIVERY':
          outForDelivery += 1;
          break;
        case 'DELIVERED':
          deliveredCount += 1;
          break;
        default:
          break;
      }

      // Service Revenue
      const sName = order.serviceName || 'General Laundry';
      serviceRevenueMap[sName] = (serviceRevenueMap[sName] || 0) + amount;
    });

    const averageOrderValue = orders.length > 0 ? Math.round(totalRevenue / orders.length) : 0;

    // 3. Customer Retention Intelligence
    const totalCustomers = customers.length;
    const returningCustomers = customers.filter(c => c.orderCount > 1).length;
    const newCustomers = customers.filter(c => c.orderCount <= 1).length;
    const repeatRatePercent = totalCustomers > 0 ? Math.round((returningCustomers / totalCustomers) * 100) : 0;
    const vipCustomers = customers.filter(c => c.segment === 'VIP').length;

    // 4. Conversion Funnel Intelligence (derived from telemetry events + orders)
    const localEvents = JSON.parse(localStorage.getItem(LOCAL_EVENTS_KEY) || '[]');
    const serviceViews = localEvents.filter(e => e.event === 'service_view').length;
    const bookingStarts = localEvents.filter(e => e.event === 'booking_start').length;
    const whatsappClicks = localEvents.filter(e => e.event === 'whatsapp_click').length;
    const phoneClicks = localEvents.filter(e => e.event === 'phone_click').length;

    // Base estimated visitors
    const websiteVisitors = Math.max(localEvents.length + orders.length * 3, 10);
    const completedBookings = orders.length;
    const paidOrders = orders.filter(o => o.paymentStatus === 'PAID').length;

    const conversionFunnel = [
      { step: 'Website Visitors', count: websiteVisitors, percentage: 100 },
      { step: 'Service Views', count: Math.max(serviceViews, Math.round(websiteVisitors * 0.65)), percentage: 65 },
      { step: 'Booking Starts', count: Math.max(bookingStarts, Math.round(websiteVisitors * 0.35)), percentage: 35 },
      { step: 'Completed Bookings', count: completedBookings, percentage: websiteVisitors > 0 ? Math.round((completedBookings / websiteVisitors) * 100) : 0 },
      { step: 'Paid Orders', count: paidOrders, percentage: completedBookings > 0 ? Math.round((paidOrders / completedBookings) * 100) : 0 },
    ];

    // Service Revenue Array for Recharts
    const serviceRevenueChart = Object.keys(serviceRevenueMap).map((name) => ({
      name,
      revenue: serviceRevenueMap[name],
    }));

    return {
      operations: {
        ordersToday,
        pickupsPending,
        inProcessing,
        readyForDispatch,
        outForDelivery,
        deliveredCount,
        totalOrders: orders.length,
      },
      revenue: {
        todayRevenue,
        weeklyRevenue,
        monthlyRevenue,
        totalRevenue,
        averageOrderValue,
        serviceRevenueChart,
      },
      customers: {
        totalCustomers,
        newCustomers,
        returningCustomers,
        repeatRatePercent,
        vipCustomers,
      },
      funnel: conversionFunnel,
      telemetry: {
        whatsappClicks,
        phoneClicks,
      }
    };
  }
};

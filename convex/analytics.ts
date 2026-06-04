import { query } from "./_generated/server";
import { v } from "convex/values";
import { requireAdmin } from "./lib/auth";

function monthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export const adminOverview = query({
  args: {
    sessionToken: v.string(),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.sessionToken);
    const orders = await ctx.db
      .query("orders")
      .withIndex("by_createdAt", (q) => q)
      .order("desc")
      .take(500);

    const services = await ctx.db
      .query("services")
      .withIndex("by_isActive_and_sortOrder", (q) => q.eq("isActive", true))
      .take(50);
    const serviceNameMap = new Map(services.map((service) => [service.code, service.name]));

    const monthly = new Map<string, { orders: number; revenue: number }>();
    const popularServices = new Map<string, number>();
    const popularTemplates = new Map<string, number>();

    for (const order of orders) {
      const key = monthKey(new Date(order.createdAt));
      const bucket = monthly.get(key) ?? { orders: 0, revenue: 0 };
      bucket.orders += 1;
      if (order.paymentStatus === "paid") {
        bucket.revenue += order.totalAmount;
      }
      monthly.set(key, bucket);

      if (order.serviceCode) {
        popularServices.set(
          order.serviceCode,
          (popularServices.get(order.serviceCode) ?? 0) + 1,
        );
      }
      if (order.templateCode) {
        popularTemplates.set(
          order.templateCode,
          (popularTemplates.get(order.templateCode) ?? 0) + 1,
        );
      }
    }

    return {
      monthly_revenue: Array.from(monthly.entries())
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([month, bucket]) => ({
          month,
          orders: bucket.orders,
          revenue: bucket.revenue,
        })),
      popular_services: Array.from(popularServices.entries())
        .sort((left, right) => right[1] - left[1])
        .slice(0, 5)
        .map(([code, count]) => ({
          code,
          name: serviceNameMap.get(code) ?? code,
          count,
        })),
      popular_templates: Array.from(popularTemplates.entries())
        .sort((left, right) => right[1] - left[1])
        .slice(0, 5)
        .map(([code, count]) => ({
          code,
          count,
        })),
      kpis: {
        total_orders: orders.length,
        paid_orders: orders.filter((order) => order.paymentStatus === "paid").length,
        pending_orders: orders.filter((order) => order.status === "pending").length,
        paid_revenue: orders
          .filter((order) => order.paymentStatus === "paid")
          .reduce((sum, order) => sum + order.totalAmount, 0),
      },
    };
  },
});

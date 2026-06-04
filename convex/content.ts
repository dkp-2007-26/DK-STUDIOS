import { query } from "./_generated/server";

export const listServices = query({
  args: {},
  handler: async (ctx) => {
    const services = await ctx.db
      .query("services")
      .withIndex("by_isActive_and_sortOrder", (q) => q.eq("isActive", true))
      .take(20);

    return services.map((service) => ({
      id: service.code,
      name: service.name,
      description: service.description,
      base_price: service.basePrice,
      print_price: service.printPrice,
      category: service.category,
      is_active: service.isActive,
      sort_order: service.sortOrder,
      created_at: service.createdAt,
    }));
  },
});

export const listTestimonials = query({
  args: {},
  handler: async (ctx) => {
    const testimonials = await ctx.db
      .query("testimonials")
      .withIndex("by_isActive_and_sortOrder", (q) => q.eq("isActive", true))
      .take(20);
    const approvedReviews = await ctx.db
      .query("reviews")
      .withIndex("by_status_and_createdAt", (q) => q.eq("status", "approved"))
      .order("desc")
      .take(12);

    return [
      ...testimonials.map((item) => ({
        id: item.code,
        name: item.name,
        location: item.location,
        message: item.message,
        rating: item.rating,
        is_active: item.isActive,
        sort_order: item.sortOrder,
        created_at: item.createdAt,
      })),
      ...approvedReviews.map((review, index) => ({
        id: `review-${review._id}`,
        name: review.customerName,
        location: review.publicLocation,
        message: review.message,
        rating: review.rating,
        is_active: true,
        sort_order: testimonials.length + index + 1,
        created_at: review.createdAt,
      })),
    ].slice(0, 20);
  },
});

export const listTemplates = query({
  args: {},
  handler: async (ctx) => {
    const templates = await ctx.db
      .query("templates")
      .withIndex("by_isActive_and_sortOrder", (q) => q.eq("isActive", true))
      .take(100);

    return templates.map((template) => ({
      id: template.code,
      name: template.name,
      category: template.category,
      description: template.description,
      image_url: template.imageUrl,
      tag: template.tag,
      is_active: template.isActive,
      sort_order: template.sortOrder,
      created_at: template.createdAt,
      updated_at: template.updatedAt,
    }));
  },
});

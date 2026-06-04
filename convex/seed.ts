import { mutation } from "./_generated/server";

const ADMIN_EMAIL = "kumarpanditdhruv@gmail.com";
const LEGACY_ADMIN_EMAIL = "admin@dkpstudios.in";
const ADMIN_PASSWORD_HASH = "5fd3c05f6e5263deb1abc104473e80e63835040da2c685e674d689078f911f94";
const ADMIN_DISPLAY_NAME = "Dhruv Kumar Pandit";
const DELIVERY_EMAIL = "delivery@dkpstudios.in";
const DELIVERY_PASSWORD_HASH = "6d1618208f00b6ab984a068413013f6f5994b417c104e915876d52e3a4b85900";
const DELIVERY_DISPLAY_NAME = "DK STUDIOS Delivery Desk";

const servicesSeed = [
  { code: "birthday-editing", name: "Birthday Photo Editing", description: "Beautiful birthday collages and photo edits with custom themes", basePrice: 199, printPrice: 99, category: "editing", isActive: true, sortOrder: 1 },
  { code: "anniversary-editing", name: "Anniversary Photo Editing", description: "Romantic anniversary layouts and memory collages", basePrice: 249, printPrice: 99, category: "editing", isActive: true, sortOrder: 2 },
  { code: "premium-retouching", name: "Premium Retouching", description: "Professional skin retouching, color grading, and enhancement", basePrice: 349, printPrice: 149, category: "retouching", isActive: true, sortOrder: 3 },
  { code: "pencil-sketch", name: "Pencil Sketch (B&W)", description: "Hand-drawn style black & white pencil sketch from your photo", basePrice: 299, printPrice: 99, category: "sketch", isActive: true, sortOrder: 4 },
  { code: "color-digital-sketch", name: "Color Digital Sketch", description: "Vibrant color digital sketch with artistic effects", basePrice: 399, printPrice: 149, category: "sketch", isActive: true, sortOrder: 5 },
  { code: "poster-making", name: "Poster Making", description: "Custom poster design for events, promotions, and more", basePrice: 149, printPrice: 79, category: "design", isActive: true, sortOrder: 6 },
  { code: "printing", name: "Printing (A4 or smaller)", description: "High-quality print on premium paper up to A4 size", basePrice: 79, printPrice: 0, category: "print", isActive: true, sortOrder: 7 },
  { code: "custom", name: "Custom Design", description: "Your vision, our craft - fully custom artwork", basePrice: 299, printPrice: 99, category: "custom", isActive: true, sortOrder: 8 },
];

const testimonialsSeed = [
  { code: "priya-sharma", name: "Priya Sharma", location: "Mumbai", message: "DK STUDIOS transformed our anniversary photos into something truly magical. The digital sketch was beyond our expectations!", rating: 5, isActive: true, sortOrder: 1, source: "manual" as const },
  { code: "rahul-mehta", name: "Rahul Mehta", location: "Pune", message: "Ordered a birthday collage for my wife and she was speechless. The quality and attention to detail is outstanding.", rating: 5, isActive: true, sortOrder: 2, source: "manual" as const },
  { code: "anita-verma", name: "Anita Verma", location: "Delhi", message: "The pencil sketch they made from our family photo is now framed in our living room. Absolutely gorgeous work!", rating: 5, isActive: true, sortOrder: 3, source: "manual" as const },
  { code: "kiran-patel", name: "Kiran Patel", location: "Ahmedabad", message: "Fast delivery, beautiful work, and very affordable. DK STUDIOS is my go-to for all photo editing needs.", rating: 5, isActive: true, sortOrder: 4, source: "manual" as const },
];

const templatesSeed = [
  { code: "birthday-elegant-frame", name: "Elegant Birthday Frame", category: "Birthday", description: "Gold-accent birthday layout with room for headline text and 6 photos.", imageUrl: "https://images.pexels.com/photos/1729931/pexels-photo-1729931.jpeg?auto=compress&cs=tinysrgb&w=600", tag: "Most Popular", isActive: true, sortOrder: 1 },
  { code: "birthday-festive-collage", name: "Festive Birthday Collage", category: "Birthday", description: "Colorful collage composition for up to 12 photos.", imageUrl: "https://images.pexels.com/photos/1128318/pexels-photo-1128318.jpeg?auto=compress&cs=tinysrgb&w=600", tag: "New", isActive: true, sortOrder: 2 },
  { code: "anniversary-romantic-frame", name: "Romantic Love Frame", category: "Anniversary", description: "Elegant anniversary design with couple headline and floral highlights.", imageUrl: "https://images.pexels.com/photos/1024993/pexels-photo-1024993.jpeg?auto=compress&cs=tinysrgb&w=600", tag: "Premium", isActive: true, sortOrder: 3 },
  { code: "poster-modern-promo", name: "Modern Promo Poster", category: "Poster", description: "Strong poster composition suited for events and store promotions.", imageUrl: "https://images.pexels.com/photos/3379934/pexels-photo-3379934.jpeg?auto=compress&cs=tinysrgb&w=600", tag: "Bestseller", isActive: true, sortOrder: 4 },
];

export const initialize = mutation({
  args: {},
  handler: async (ctx) => {
    const now = new Date().toISOString();

    if ((await ctx.db.query("services").take(1)).length === 0) {
      for (const service of servicesSeed) {
        await ctx.db.insert("services", {
          ...service,
          createdAt: now,
        });
      }
    }

    if ((await ctx.db.query("testimonials").take(1)).length === 0) {
      for (const testimonial of testimonialsSeed) {
        await ctx.db.insert("testimonials", {
          ...testimonial,
          createdAt: now,
          updatedAt: now,
        });
      }
    }

    if ((await ctx.db.query("templates").take(1)).length === 0) {
      for (const template of templatesSeed) {
        await ctx.db.insert("templates", {
          ...template,
          createdAt: now,
          updatedAt: now,
        });
      }
    }

    const existingPromo = await ctx.db
      .query("promotions")
      .withIndex("by_code", (q) => q.eq("code", "SUMMER20"))
      .unique();
    if (!existingPromo) {
      await ctx.db.insert("promotions", {
        code: "SUMMER20",
        description: "20% off all premium photo edits",
        discountPercentage: 20,
        maxUses: 100,
        usesCount: 0,
        validUntil: "2026-12-31T23:59:59.000Z",
        isActive: true,
        createdAt: now,
        updatedAt: now,
      });
    }

    const adminUserByNewEmail = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", ADMIN_EMAIL))
      .unique();
    const adminUserByLegacyEmail = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", LEGACY_ADMIN_EMAIL))
      .unique();

    let adminUser = adminUserByNewEmail ?? adminUserByLegacyEmail;

    if (!adminUser) {
      const adminId = await ctx.db.insert("users", {
        email: ADMIN_EMAIL,
        displayName: ADMIN_DISPLAY_NAME,
        passwordHash: ADMIN_PASSWORD_HASH,
        isAdmin: true,
        role: "admin",
        createdAt: now,
        updatedAt: now,
      });
      adminUser = await ctx.db.get(adminId);
    } else {
      await ctx.db.patch(adminUser._id, {
        email: ADMIN_EMAIL,
        displayName: ADMIN_DISPLAY_NAME,
        passwordHash: ADMIN_PASSWORD_HASH,
        isAdmin: true,
        role: "admin",
        updatedAt: now,
      });
      adminUser = await ctx.db.get(adminUser._id);
    }

    const existingDeliveryUser = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", DELIVERY_EMAIL))
      .unique();

    if (!existingDeliveryUser) {
      await ctx.db.insert("users", {
        email: DELIVERY_EMAIL,
        displayName: DELIVERY_DISPLAY_NAME,
        passwordHash: DELIVERY_PASSWORD_HASH,
        isAdmin: false,
        role: "delivery",
        createdAt: now,
        updatedAt: now,
      });
    } else {
      await ctx.db.patch(existingDeliveryUser._id, {
        displayName: DELIVERY_DISPLAY_NAME,
        passwordHash: DELIVERY_PASSWORD_HASH,
        isAdmin: false,
        role: "delivery",
        updatedAt: now,
      });
    }

    if (adminUser && (await ctx.db.query("orders").take(1)).length === 0) {
      const barcodeValue = `DK-${Date.now()}`;
      const orderId = await ctx.db.insert("orders", {
        userId: adminUser._id,
        serviceCode: "premium-retouching",
        templateCode: "birthday-elegant-frame",
        customerName: ADMIN_DISPLAY_NAME,
        customerEmail: ADMIN_EMAIL,
        customerPhone: "+919999999999",
        instructions: "Sample premium retouching order for dashboard preview.",
        frameOption: "Classic Gold Border",
        frameSize: "12x18",
        collagePreference: "make_for_me",
        personalizationText: "Happy Birthday, Maa!",
        photoCount: 6,
        photoNames: ["family-1.jpg", "family-2.jpg", "family-3.jpg"],
        deliveryType: "digital",
        status: "in_progress",
        paymentStatus: "paid",
        paymentProvider: "razorpay",
        paymentOrderId: "order_seed_1001",
        paymentId: "pay_seed_1001",
        paymentLinkUrl: null,
        subtotalAmount: 349,
        discountCode: null,
        discountPercentage: null,
        discountAmount: null,
        totalAmount: 349,
        advanceAmount: 175,
        adminNotes: "Seeded sample order.",
        barcodeValue,
        barcodeUrl: `https://quickchart.io/barcode?type=code128&text=${encodeURIComponent(barcodeValue)}&format=svg&includeText=true&width=360&height=120`,
        trackingUrl: `https://quickchart.io/barcode?type=code128&text=${encodeURIComponent(barcodeValue)}&format=svg&includeText=true&width=360&height=120`,
        billNumber: `INV-${new Date().getFullYear()}-1001`,
        reviewToken: "seed-review-token",
        paymentCompletedAt: "2026-04-20T08:45:00.000Z",
        completedAt: null,
        deliveredAt: null,
        pickupReadyAt: null,
        pickupReadyBy: null,
        pickupReadyNotifiedAt: null,
        pickupCompletedAt: null,
        lastBarcodeScannedAt: null,
        barcodeScanCount: 0,
        customerNotifiedAt: null,
        reviewRequestSentAt: null,
        reviewSubmittedAt: null,
        deliveryVerifiedBy: null,
        createdAt: "2026-04-20T08:30:00.000Z",
        updatedAt: "2026-04-21T09:15:00.000Z",
      });

      await ctx.db.insert("orderPhotos", {
        orderId,
        userId: adminUser._id,
        storageProvider: "google_drive",
        fileName: "family-1.jpg",
        fileSize: 245000,
        mimeType: "image/jpeg",
        googleDriveFileId: null,
        googleDriveFolderId: null,
        googleDriveWebViewLink: null,
        googleDriveWebContentLink: null,
        googleDriveThumbnailLink: null,
        previewUrl: "https://images.pexels.com/photos/1729931/pexels-photo-1729931.jpeg?auto=compress&cs=tinysrgb&w=600",
        sortOrder: 0,
        cropX: null,
        cropY: null,
        cropWidth: null,
        cropHeight: null,
        createdAt: now,
      });

      await ctx.db.insert("payments", {
        orderId,
        userId: adminUser._id,
        provider: "razorpay",
        providerOrderId: "order_seed_1001",
        providerPaymentId: "pay_seed_1001",
        providerSignature: null,
        status: "paid",
        amount: 175,
        currency: "INR",
        receipt: `INV-${new Date().getFullYear()}-1001`,
        checkoutUrl: null,
        metadataSummary: "Seed payment",
        createdAt: "2026-04-20T08:45:00.000Z",
        updatedAt: "2026-04-20T08:45:00.000Z",
      });

      await ctx.db.insert("reviews", {
        orderId,
        userId: adminUser._id,
        customerName: ADMIN_DISPLAY_NAME,
        customerEmail: ADMIN_EMAIL,
        publicLocation: "Kolkata",
        rating: 5,
        message: "Absolutely loved the finish quality and how quickly the team delivered the concept.",
        status: "approved",
        reviewToken: "seed-review-token",
        requestedAt: null,
        submittedAt: "2026-04-22T10:00:00.000Z",
        approvedAt: "2026-04-22T12:30:00.000Z",
        rejectedAt: null,
        adminNotes: "Seed approved review",
        createdAt: "2026-04-20T08:30:00.000Z",
        updatedAt: "2026-04-22T12:30:00.000Z",
      });
    }

    return { ok: true };
  },
});

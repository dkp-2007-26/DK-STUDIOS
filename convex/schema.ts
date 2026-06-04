import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

const nullableString = v.union(v.string(), v.null());
const nullableNumber = v.union(v.number(), v.null());
const optionalNullableString = v.optional(nullableString);
const optionalNullableNumber = v.optional(nullableNumber);

export default defineSchema({
  users: defineTable({
    email: v.string(),
    displayName: v.string(),
    passwordHash: v.string(),
    isAdmin: v.boolean(),
    role: v.optional(
      v.union(
        v.literal("customer"),
        v.literal("admin"),
        v.literal("delivery"),
      ),
    ),
    createdAt: v.string(),
    updatedAt: v.string(),
  }).index("by_email", ["email"]),

  sessions: defineTable({
    token: v.string(),
    userId: v.id("users"),
    expiresAt: v.string(),
    createdAt: v.string(),
  })
    .index("by_token", ["token"])
    .index("by_userId", ["userId"]),

  services: defineTable({
    code: v.string(),
    name: v.string(),
    description: nullableString,
    basePrice: v.number(),
    printPrice: v.number(),
    category: v.string(),
    isActive: v.boolean(),
    sortOrder: v.number(),
    createdAt: v.string(),
  })
    .index("by_code", ["code"])
    .index("by_isActive_and_sortOrder", ["isActive", "sortOrder"]),

  testimonials: defineTable({
    code: v.string(),
    name: v.string(),
    location: nullableString,
    message: v.string(),
    rating: v.number(),
    isActive: v.boolean(),
    sortOrder: v.number(),
    source: v.optional(
      v.union(v.literal("manual"), v.literal("review")),
    ),
    createdAt: v.string(),
    updatedAt: v.optional(v.string()),
  })
    .index("by_code", ["code"])
    .index("by_isActive_and_sortOrder", ["isActive", "sortOrder"]),

  templates: defineTable({
    code: v.string(),
    name: v.string(),
    category: v.string(),
    description: nullableString,
    imageUrl: v.string(),
    tag: nullableString,
    isActive: v.boolean(),
    sortOrder: v.number(),
    createdAt: v.string(),
    updatedAt: v.string(),
  })
    .index("by_code", ["code"])
    .index("by_isActive_and_sortOrder", ["isActive", "sortOrder"]),

  promotions: defineTable({
    code: v.string(),
    description: nullableString,
    discountPercentage: v.number(),
    maxUses: nullableNumber,
    usesCount: v.number(),
    validUntil: nullableString,
    isActive: v.boolean(),
    createdAt: v.string(),
    updatedAt: v.string(),
  })
    .index("by_code", ["code"])
    .index("by_isActive_and_validUntil", ["isActive", "validUntil"]),

  orders: defineTable({
    userId: v.id("users"),
    serviceCode: nullableString,
    templateCode: optionalNullableString,
    customerName: v.string(),
    customerEmail: v.string(),
    customerPhone: nullableString,
    instructions: nullableString,
    frameOption: optionalNullableString,
    frameSize: optionalNullableString,
    collagePreference: optionalNullableString,
    personalizationText: optionalNullableString,
    photoCount: v.optional(v.number()),
    photoNames: v.optional(v.array(v.string())),
    photoStorageIds: v.optional(v.array(v.id("_storage"))),
    googleDriveFolderId: optionalNullableString,
    deliveryType: v.union(v.literal("digital"), v.literal("printed")),
    status: v.union(
      v.literal("pending"),
      v.literal("confirmed"),
      v.literal("in_progress"),
      v.literal("completed"),
      v.literal("cancelled"),
    ),
    paymentStatus: v.union(
      v.literal("pending"),
      v.literal("paid"),
      v.literal("refunded"),
      v.literal("failed"),
    ),
    paymentProvider: optionalNullableString,
    paymentOrderId: optionalNullableString,
    paymentId: optionalNullableString,
    paymentLinkUrl: optionalNullableString,
    subtotalAmount: v.optional(v.number()),
    discountCode: optionalNullableString,
    discountPercentage: optionalNullableNumber,
    discountAmount: optionalNullableNumber,
    totalAmount: v.number(),
    advanceAmount: v.number(),
    adminNotes: nullableString,
    barcodeValue: optionalNullableString,
    barcodeUrl: optionalNullableString,
    trackingUrl: optionalNullableString,
    billNumber: optionalNullableString,
    reviewToken: optionalNullableString,
    paymentCompletedAt: optionalNullableString,
    completedAt: optionalNullableString,
    deliveredAt: optionalNullableString,
    pickupReadyAt: optionalNullableString,
    pickupReadyBy: optionalNullableString,
    pickupReadyNotifiedAt: optionalNullableString,
    pickupCompletedAt: optionalNullableString,
    lastBarcodeScannedAt: optionalNullableString,
    barcodeScanCount: v.optional(v.number()),
    customerNotifiedAt: optionalNullableString,
    reviewRequestSentAt: optionalNullableString,
    reviewSubmittedAt: optionalNullableString,
    deliveryVerifiedBy: optionalNullableString,
    fileRetentionStatus: v.optional(v.union(
      v.literal("retained"),
      v.literal("scheduled"),
      v.literal("deleted"),
      v.literal("failed"),
      v.literal("skipped"),
    )),
    filesDeletionScheduledAt: optionalNullableString,
    filesDeletedAt: optionalNullableString,
    filesDeletionFailedAt: optionalNullableString,
    filesDeletionError: optionalNullableString,
    createdAt: v.string(),
    updatedAt: v.string(),
  })
    .index("by_userId_and_createdAt", ["userId", "createdAt"])
    .index("by_createdAt", ["createdAt"])
    .index("by_barcodeValue", ["barcodeValue"])
    .index("by_billNumber", ["billNumber"])
    .index("by_paymentOrderId", ["paymentOrderId"]),

  orderPhotos: defineTable({
    orderId: v.id("orders"),
    userId: v.id("users"),
    storageProvider: v.optional(v.literal("google_drive")),
    fileName: v.string(),
    fileSize: v.number(),
    mimeType: nullableString,
    googleDriveFileId: optionalNullableString,
    googleDriveFolderId: optionalNullableString,
    googleDriveWebViewLink: optionalNullableString,
    googleDriveWebContentLink: optionalNullableString,
    googleDriveThumbnailLink: optionalNullableString,
    previewUrl: nullableString,
    sortOrder: v.number(),
    cropX: optionalNullableNumber,
    cropY: optionalNullableNumber,
    cropWidth: optionalNullableNumber,
    cropHeight: optionalNullableNumber,
    createdAt: v.string(),
  })
    .index("by_orderId_and_sortOrder", ["orderId", "sortOrder"])
    .index("by_userId_and_createdAt", ["userId", "createdAt"]),

  printJobs: defineTable({
    orderId: v.union(v.id("orders"), v.null()),
    sourceType: v.union(
      v.literal("final_artwork"),
      v.literal("original_upload"),
      v.literal("manual"),
    ),
    title: v.string(),
    fileName: v.string(),
    fileSize: v.number(),
    mimeType: nullableString,
    googleDriveFileId: v.string(),
    googleDriveFolderId: optionalNullableString,
    googleDriveWebViewLink: optionalNullableString,
    googleDriveWebContentLink: optionalNullableString,
    googleDriveThumbnailLink: optionalNullableString,
    previewUrl: optionalNullableString,
    target: v.union(v.literal("auto"), v.literal("color"), v.literal("bw")),
    copies: v.number(),
    notes: nullableString,
    status: v.union(
      v.literal("queued"),
      v.literal("claimed"),
      v.literal("printing"),
      v.literal("printed"),
      v.literal("failed"),
      v.literal("cancelled"),
    ),
    requestedByUserId: v.id("users"),
    requestedByEmail: v.string(),
    desktopDeviceId: optionalNullableString,
    desktopDeviceName: optionalNullableString,
    desktopClaimedAt: optionalNullableString,
    printStartedAt: optionalNullableString,
    printedAt: optionalNullableString,
    failedAt: optionalNullableString,
    errorMessage: optionalNullableString,
    isReprint: v.boolean(),
    parentPrintJobId: v.union(v.id("printJobs"), v.null()),
    createdAt: v.string(),
    updatedAt: v.string(),
  })
    .index("by_orderId_and_createdAt", ["orderId", "createdAt"])
    .index("by_status_and_createdAt", ["status", "createdAt"])
    .index("by_createdAt", ["createdAt"]),

  payments: defineTable({
    orderId: v.id("orders"),
    userId: v.id("users"),
    provider: v.string(),
    providerOrderId: nullableString,
    providerPaymentId: nullableString,
    providerSignature: nullableString,
    status: v.union(
      v.literal("created"),
      v.literal("paid"),
      v.literal("failed"),
      v.literal("refunded"),
    ),
    amount: v.number(),
    currency: v.string(),
    receipt: v.string(),
    checkoutUrl: nullableString,
    metadataSummary: nullableString,
    createdAt: v.string(),
    updatedAt: v.string(),
  })
    .index("by_orderId_and_createdAt", ["orderId", "createdAt"])
    .index("by_providerOrderId", ["providerOrderId"]),

  notifications: defineTable({
    orderId: v.id("orders"),
    userId: v.id("users"),
    event: v.string(),
    channel: v.union(
      v.literal("email"),
      v.literal("sms"),
      v.literal("whatsapp"),
    ),
    provider: v.string(),
    recipient: v.string(),
    status: v.union(
      v.literal("queued"),
      v.literal("sent"),
      v.literal("skipped"),
      v.literal("failed"),
    ),
    externalId: nullableString,
    errorMessage: nullableString,
    createdAt: v.string(),
    updatedAt: v.string(),
  })
    .index("by_orderId_and_createdAt", ["orderId", "createdAt"])
    .index("by_userId_and_createdAt", ["userId", "createdAt"]),

  reviews: defineTable({
    orderId: v.id("orders"),
    userId: v.id("users"),
    customerName: v.string(),
    customerEmail: v.string(),
    publicLocation: nullableString,
    rating: v.number(),
    message: v.string(),
    status: v.union(
      v.literal("pending"),
      v.literal("approved"),
      v.literal("rejected"),
    ),
    reviewToken: v.string(),
    requestedAt: nullableString,
    submittedAt: nullableString,
    approvedAt: nullableString,
    rejectedAt: nullableString,
    adminNotes: nullableString,
    createdAt: v.string(),
    updatedAt: v.string(),
  })
    .index("by_orderId", ["orderId"])
    .index("by_reviewToken", ["reviewToken"])
    .index("by_status_and_createdAt", ["status", "createdAt"])
    .index("by_userId_and_createdAt", ["userId", "createdAt"]),

  supportMessages: defineTable({
    project: v.optional(v.string()),
    sourceId: v.optional(v.string()),
    category: v.optional(v.string()),
    subject: v.optional(v.string()),
    customerName: v.optional(v.string()),
    customerEmail: v.optional(v.string()),
    customerPhone: v.optional(v.string()),
    message: v.string(),
    status: v.optional(v.union(
      v.literal("open"),
      v.literal("replied"),
      v.literal("closed"),
    )),
    adminReply: v.optional(v.string()),
    responder: v.optional(v.string()),
    createdAt: v.optional(v.number()),
    updatedAt: v.optional(v.number()),
    repliedAt: v.optional(v.number()),
  }).index("by_status", ["status"]),
});

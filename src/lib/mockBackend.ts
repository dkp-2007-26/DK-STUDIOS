import { Order, Profile, Service, Testimonial } from '../types/database';

export interface AuthUser {
  id: string;
  email: string;
  displayName: string;
  isAdmin: boolean;
}

interface StoredAccount extends AuthUser {
  password: string;
}

interface CreateOrderInput {
  userId: string;
  serviceId: string | null;
  customerName: string;
  customerEmail: string;
  customerPhone: string | null;
  instructions: string | null;
  deliveryType: Order['delivery_type'];
  totalAmount: number;
  advanceAmount: number;
}

const ACCOUNTS_KEY = 'd.k-studios.accounts';
const CURRENT_USER_KEY = 'd.k-studios.currentUserId';
const ORDERS_KEY = 'd.k-studios.orders';
export const DATA_EVENT = 'd.k-studios:data-changed';

export const servicesCatalog: Service[] = [
  { id: 'premium-retouching', name: 'Premium Retouching', description: 'Professional photo retouching with polished cleanup, tone correction, and final soft-copy delivery.', base_price: 49, print_price: 0, category: 'retouching', image_url: '/services/premium-retouching.jpg', source_url: null, supplier: null, supplier_label: null, product_details: ['Rs. 49', 'Soft copy', 'All customisations included'], product_options: [{ key: 'delivery_package', label: 'Delivery package', type: 'select', values: ['Soft Copy (All customisations)'], required: true }], is_active: true, sort_order: 1, created_at: '2026-01-01T00:00:00.000Z' },
  { id: 'digital-sketch', name: 'Digital Sketch', description: 'Digital sketch artwork with colour or black and white output options, delivered as soft copy or framed output.', base_price: 49, print_price: 0, category: 'sketch', image_url: '/services/digital-sketch.jpg', source_url: null, supplier: null, supplier_label: null, product_details: ['Rs. 49 soft copy', 'Rs. 199 standard photo frame', 'Premium Vistaprint frame subject to customisations'], product_options: [{ key: 'output_package', label: 'Output package', type: 'select', values: ['Soft Copy (All customisations)', 'Standard Photo Frame (Local) - Rs. 199', 'Premium Photo Frame (Vistaprint) - quote after final design'], required: true }, { key: 'sketch_style', label: 'Sketch style', type: 'select', values: ['Colour', 'Black and White'], required: true }, { key: 'frame_size', label: 'Frame size', type: 'select', values: ['No frame', '4 x 4 in', '4 x 8 in', '6 x 6 in', '6 x 12 in', '8 x 8 in', '8.5 x 11 in', '10 x 10 in'], required: true }], is_active: true, sort_order: 2, created_at: '2026-01-01T00:00:00.000Z' },
  { id: 'custom-sketch', name: 'Custom Sketch', description: 'Tell us what you want; DK STUDIOS creates the sketch and refines it with you. Frame pricing may vary by customisation.', base_price: 49, print_price: 0, category: 'sketch', image_url: '/services/custom-sketch.jpg', source_url: null, supplier: null, supplier_label: null, product_details: ['Rs. 49 soft copy', 'Rs. 199 standard photo frame', 'Premium Vistaprint frame subject to customisations'], product_options: [{ key: 'output_package', label: 'Output package', type: 'select', values: ['Soft Copy (All customisations)', 'Standard Photo Frame (Local) - Rs. 199', 'Premium Photo Frame (Vistaprint) - quote after final design'], required: true }, { key: 'sketch_style', label: 'Sketch style', type: 'select', values: ['Colour', 'Black and White'], required: true }, { key: 'frame_size', label: 'Frame size', type: 'select', values: ['No frame', '4 x 4 in', '4 x 8 in', '6 x 6 in', '6 x 12 in', '8 x 8 in', '8.5 x 11 in', '10 x 10 in'], required: true }], is_active: true, sort_order: 3, created_at: '2026-01-01T00:00:00.000Z' },
  { id: 'poster-making', name: 'Poster Making', description: 'Premium poster layout for events, launches, announcements, and promotions with final soft-copy delivery.', base_price: 49, print_price: 0, category: 'design', image_url: '/services/poster-making.jpg', source_url: null, supplier: null, supplier_label: null, product_details: ['Rs. 49', 'Soft copy', 'All customisations included'], product_options: [{ key: 'poster_size', label: 'Poster size', type: 'select', values: ['Digital poster', 'A4', 'A3', 'A2', '16 x 20 in'], required: true }, { key: 'design_status', label: 'Design input', type: 'select', values: ['I will upload final content', 'DK STUDIOS should prepare layout'], required: true }], is_active: true, sort_order: 4, created_at: '2026-01-01T00:00:00.000Z' },
  { id: 'vp-photo-with-frame', name: 'Photo With Frame', description: 'Vistaprint photo frame from your final photo or design, with black or white frame colour options and multiple sizes.', base_price: 195, print_price: 0, category: 'vistaprint_photo_frames', image_url: '/vistaprint/frames/photo-with-frame.jpg', source_url: 'https://www.vistaprint.in/photo-gifts/photo-with-frame', supplier: 'vistaprint', supplier_label: 'Powered by Vistaprint', product_details: ['From Rs. 195', 'Black or white frame', 'Sizes from 4 x 4 in to 10 x 10 in'], product_options: [{ key: 'quantity', label: 'Quantity', type: 'select', values: ['1', '2', '5', '10'], required: true }, { key: 'size', label: 'Size', type: 'select', values: ['4 x 4 in', '4 x 8 in', '6 x 6 in', '6 x 12 in', '8 x 8 in', '8.5 x 11 in', '10 x 10 in'], required: true }, { key: 'orientation', label: 'Orientation', type: 'select', values: ['Horizontal', 'Vertical'], required: true }, { key: 'frame_color', label: 'Frame color', type: 'select', values: ['Black', 'White'], required: true }, { key: 'design_status', label: 'Design file', type: 'select', values: ['I will upload final design', 'DK STUDIOS should prepare design'], required: true }], is_active: true, sort_order: 190, created_at: '2026-01-01T00:00:00.000Z' },
  { id: 'vp-premium-photo-frame', name: 'Premium Photo with Frame', description: 'Vistaprint premium photo frame for higher-end framed photo output, subject to selected size and customisations.', base_price: 390, print_price: 0, category: 'vistaprint_photo_frames', image_url: '/vistaprint/frames/premium-photo-frame.jpg', source_url: 'https://www.vistaprint.in/photo-gifts/premium-photo-frames', supplier: 'vistaprint', supplier_label: 'Powered by Vistaprint', product_details: ['From Rs. 390', 'Black frame', '8 x 8 in and 8.5 x 11 in'], product_options: [{ key: 'quantity', label: 'Quantity', type: 'select', values: ['1', '2', '5', '10'], required: true }, { key: 'size', label: 'Size', type: 'select', values: ['8 x 8 in', '8.5 x 11 in'], required: true }, { key: 'frame_color', label: 'Frame color', type: 'select', values: ['Black'], required: true }, { key: 'design_status', label: 'Design file', type: 'select', values: ['I will upload final design', 'DK STUDIOS should prepare design'], required: true }], is_active: true, sort_order: 191, created_at: '2026-01-01T00:00:00.000Z' },
  { id: 'vp-acrylic-photo-frame', name: 'Acrylic Photo Frame', description: 'Vistaprint acrylic photo frame with stand, suitable for premium desk or gift presentation.', base_price: 492, print_price: 0, category: 'vistaprint_photo_frames', image_url: '/vistaprint/frames/acrylic-photo-frame.jpg', source_url: 'https://www.vistaprint.in/photo-gifts/acrylic-photo-frame', supplier: 'vistaprint', supplier_label: 'Powered by Vistaprint', product_details: ['From Rs. 492', 'Acrylic frame', 'A5 style options'], product_options: [{ key: 'quantity', label: 'Quantity', type: 'select', values: ['1', '2', '5', '10'], required: true }, { key: 'size', label: 'Size', type: 'select', values: ['A5', 'A4'], required: true }, { key: 'orientation', label: 'Orientation', type: 'select', values: ['Horizontal', 'Vertical'], required: true }, { key: 'design_status', label: 'Design file', type: 'select', values: ['I will upload final design', 'DK STUDIOS should prepare design'], required: true }], is_active: true, sort_order: 192, created_at: '2026-01-01T00:00:00.000Z' },
  { id: 'vp-led-photo-frame', name: 'LED Photo Frames', description: 'Vistaprint LED photo frame for illuminated photo gifts and premium display orders.', base_price: 932, print_price: 0, category: 'vistaprint_photo_frames', image_url: '/vistaprint/frames/led-photo-frame.jpg', source_url: 'https://www.vistaprint.in/photo-gifts/led-photo-frames', supplier: 'vistaprint', supplier_label: 'Powered by Vistaprint', product_details: ['From Rs. 932', 'LED frame', 'Premium display'], product_options: [{ key: 'quantity', label: 'Quantity', type: 'select', values: ['1', '2', '5', '10'], required: true }, { key: 'design_status', label: 'Design file', type: 'select', values: ['I will upload final design', 'DK STUDIOS should prepare design'], required: true }], is_active: true, sort_order: 193, created_at: '2026-01-01T00:00:00.000Z' },
];

export const testimonialsCatalog: Testimonial[] = [
  { id: '1', name: 'Priya Sharma', location: 'Mumbai', message: 'DK STUDIOS transformed our anniversary photos into something truly magical. The digital sketch was beyond our expectations!', rating: 5, is_active: true, sort_order: 1, created_at: '2026-01-01T00:00:00.000Z' },
  { id: '2', name: 'Rahul Mehta', location: 'Pune', message: 'Ordered a birthday collage for my wife and she was speechless. The quality and attention to detail is outstanding.', rating: 5, is_active: true, sort_order: 2, created_at: '2026-01-01T00:00:00.000Z' },
  { id: '3', name: 'Anita Verma', location: 'Delhi', message: 'The pencil sketch they made from our family photo is now framed in our living room. Absolutely gorgeous work!', rating: 5, is_active: true, sort_order: 3, created_at: '2026-01-01T00:00:00.000Z' },
  { id: '4', name: 'Kiran Patel', location: 'Ahmedabad', message: 'Fast delivery, beautiful work, and very affordable. DK STUDIOS is my go-to for all photo editing needs.', rating: 5, is_active: true, sort_order: 4, created_at: '2026-01-01T00:00:00.000Z' },
];

const seededAccounts: StoredAccount[] = [
  {
    id: 'admin-1',
    email: 'admin@dkpstudios.in',
    displayName: 'DK STUDIOS Admin',
    isAdmin: true,
    password: 'admin123',
  },
];

const seededOrders: Order[] = [
  {
    id: 'ord-demo-1',
    user_id: 'admin-1',
    service_id: '3',
    template_id: null,
    customer_name: 'DK STUDIOS Admin',
    customer_email: 'admin@dkpstudios.in',
    customer_phone: '+919999999999',
    fulfillment_method: 'pickup',
    shipping_name: null,
    shipping_phone: null,
    shipping_address_line1: null,
    shipping_address_line2: null,
    shipping_city: null,
    shipping_state: null,
    shipping_pincode: null,
    shipping_country: null,
    instructions: 'Sample premium retouching order for dashboard preview.',
    delivery_type: 'digital',
    status: 'in_progress',
    payment_status: 'paid',
    total_amount: 349,
    advance_amount: 175,
    admin_notes: 'Use this as a placeholder record until Supabase is connected.',
    supplier: 'none',
    supplier_status: 'not_required',
    supplier_order_id: null,
    supplier_submitted_at: null,
    supplier_error: null,
    frame_fulfillment_tier: null,
    product_kind: 'digital',
    qikink_status: 'not_required',
    qikink_order_id: null,
    qikink_submitted_at: null,
    qikink_error: null,
    created_at: '2026-04-20T08:30:00.000Z',
    updated_at: '2026-04-21T09:15:00.000Z',
  },
];

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  const raw = window.localStorage.getItem(key);
  if (!raw) return fallback;

  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson<T>(key: string, value: T) {
  window.localStorage.setItem(key, JSON.stringify(value));
}

function emitDataChange() {
  window.dispatchEvent(new Event(DATA_EVENT));
}

function ensureInitialized() {
  if (typeof window === 'undefined') return;

  if (!window.localStorage.getItem(ACCOUNTS_KEY)) {
    writeJson(ACCOUNTS_KEY, seededAccounts);
  }

  if (!window.localStorage.getItem(ORDERS_KEY)) {
    writeJson(ORDERS_KEY, seededOrders);
  }
}

function getAccounts() {
  ensureInitialized();
  return readJson<StoredAccount[]>(ACCOUNTS_KEY, seededAccounts);
}

function saveAccounts(accounts: StoredAccount[]) {
  writeJson(ACCOUNTS_KEY, accounts);
}

function getStoredOrders() {
  ensureInitialized();
  return readJson<Order[]>(ORDERS_KEY, seededOrders);
}

function saveOrders(orders: Order[]) {
  writeJson(ORDERS_KEY, orders);
}

export function getServices() {
  return servicesCatalog.filter(service => service.is_active).sort((a, b) => a.sort_order - b.sort_order);
}

export function getTestimonials() {
  return testimonialsCatalog.filter(item => item.is_active).sort((a, b) => a.sort_order - b.sort_order);
}

function toPublicAccount(account: StoredAccount) {
  return {
    id: account.id,
    email: account.email,
    displayName: account.displayName,
    isAdmin: account.isAdmin,
  };
}

export function getCurrentUser() {
  ensureInitialized();
  const currentUserId = window.localStorage.getItem(CURRENT_USER_KEY);
  if (!currentUserId) return null;

  const account = getAccounts().find(item => item.id === currentUserId);
  if (!account) return null;

  return toPublicAccount(account);
}

export function signUpAccount(email: string, password: string, name: string) {
  const normalizedEmail = email.trim().toLowerCase();
  const accounts = getAccounts();

  if (accounts.some(account => account.email === normalizedEmail)) {
    return { error: new Error('An account with this email already exists.') };
  }

  const account: StoredAccount = {
    id: crypto.randomUUID(),
    email: normalizedEmail,
    displayName: name.trim(),
    isAdmin: normalizedEmail === 'admin@dkpstudios.in',
    password,
  };

  saveAccounts([...accounts, account]);
  emitDataChange();
  return { error: null };
}

export function signInAccount(email: string, password: string) {
  const normalizedEmail = email.trim().toLowerCase();
  const account = getAccounts().find(item => item.email === normalizedEmail && item.password === password);

  if (!account) {
    return { user: null, error: new Error('Invalid email or password.') };
  }

  window.localStorage.setItem(CURRENT_USER_KEY, account.id);
  emitDataChange();
  return { user: toPublicAccount(account), error: null };
}

export function signOutAccount() {
  window.localStorage.removeItem(CURRENT_USER_KEY);
  emitDataChange();
}

export function getProfile(userId: string): Profile | null {
  const account = getAccounts().find(item => item.id === userId);
  if (!account) return null;

  return {
    id: account.id,
    display_name: account.displayName,
    phone: null,
    avatar_url: null,
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
  };
}

export function getOrders() {
  return getStoredOrders().slice().sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export function getOrdersForUser(userId: string) {
  return getOrders().filter(order => order.user_id === userId);
}

export function createOrder(input: CreateOrderInput) {
  const now = new Date().toISOString();
  const order: Order = {
    id: crypto.randomUUID(),
    user_id: input.userId,
    service_id: input.serviceId,
    template_id: null,
    customer_name: input.customerName,
    customer_email: input.customerEmail,
    customer_phone: input.customerPhone,
    fulfillment_method: 'pickup',
    shipping_name: null,
    shipping_phone: null,
    shipping_address_line1: null,
    shipping_address_line2: null,
    shipping_city: null,
    shipping_state: null,
    shipping_pincode: null,
    shipping_country: null,
    instructions: input.instructions,
    delivery_type: input.deliveryType,
    status: 'pending',
    payment_status: 'pending',
    total_amount: input.totalAmount,
    advance_amount: input.advanceAmount,
    admin_notes: null,
    supplier: input.deliveryType === 'printed' ? 'vistaprint' : 'none',
    supplier_status: input.deliveryType === 'printed' ? 'queued' : 'not_required',
    supplier_order_id: null,
    supplier_submitted_at: null,
    supplier_error: null,
    frame_fulfillment_tier: null,
    product_kind: input.deliveryType === 'printed' ? 'print' : 'digital',
    qikink_status: 'not_required',
    qikink_order_id: null,
    qikink_submitted_at: null,
    qikink_error: null,
    created_at: now,
    updated_at: now,
  };

  const orders = [order, ...getStoredOrders()];
  saveOrders(orders);
  emitDataChange();
  return order;
}

export function updateOrder(orderId: string, updates: Partial<Order>) {
  const orders = getStoredOrders().map(order =>
    order.id === orderId
      ? { ...order, ...updates, updated_at: new Date().toISOString() }
      : order
  );

  saveOrders(orders);
  emitDataChange();
  return orders.find(order => order.id === orderId) ?? null;
}

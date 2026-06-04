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
  { id: '1', name: 'Birthday Photo Editing', description: 'Beautiful birthday collages and photo edits with custom themes', base_price: 199, print_price: 99, category: 'editing', is_active: true, sort_order: 1, created_at: '2026-01-01T00:00:00.000Z' },
  { id: '2', name: 'Anniversary Photo Editing', description: 'Romantic anniversary layouts and memory collages', base_price: 249, print_price: 99, category: 'editing', is_active: true, sort_order: 2, created_at: '2026-01-01T00:00:00.000Z' },
  { id: '3', name: 'Premium Retouching', description: 'Professional skin retouching, color grading, and enhancement', base_price: 349, print_price: 149, category: 'retouching', is_active: true, sort_order: 3, created_at: '2026-01-01T00:00:00.000Z' },
  { id: '4', name: 'Pencil Sketch (B&W)', description: 'Hand-drawn style black & white pencil sketch from your photo', base_price: 299, print_price: 99, category: 'sketch', is_active: true, sort_order: 4, created_at: '2026-01-01T00:00:00.000Z' },
  { id: '5', name: 'Color Digital Sketch', description: 'Vibrant color digital sketch with artistic effects', base_price: 399, print_price: 149, category: 'sketch', is_active: true, sort_order: 5, created_at: '2026-01-01T00:00:00.000Z' },
  { id: '6', name: 'Poster Making', description: 'Custom poster design for events, promotions, and more', base_price: 149, print_price: 79, category: 'design', is_active: true, sort_order: 6, created_at: '2026-01-01T00:00:00.000Z' },
  { id: '7', name: 'Printing (A4 or smaller)', description: 'High-quality print on premium paper up to A4 size', base_price: 79, print_price: 0, category: 'print', is_active: true, sort_order: 7, created_at: '2026-01-01T00:00:00.000Z' },
  { id: 'custom', name: 'Custom Design', description: 'Your vision, our craft - fully custom artwork', base_price: 299, print_price: 99, category: 'custom', is_active: true, sort_order: 8, created_at: '2026-01-01T00:00:00.000Z' },
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

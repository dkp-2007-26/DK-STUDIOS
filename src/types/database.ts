export interface Profile {
  id: string;
  display_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Service {
  id: string;
  name: string;
  description: string | null;
  base_price: number;
  print_price: number;
  category: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

export interface Order {
  id: string;
  user_id: string | null;
  service_id: string | null;
  template_id: string | null;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  fulfillment_method: 'pickup' | 'home_delivery';
  shipping_name: string | null;
  shipping_phone: string | null;
  shipping_address_line1: string | null;
  shipping_address_line2: string | null;
  shipping_city: string | null;
  shipping_state: string | null;
  shipping_pincode: string | null;
  shipping_country: string | null;
  instructions: string | null;
  frame_option: string | null;
  frame_size: string | null;
  collage_preference: string | null;
  personalization_text: string | null;
  photo_count: number;
  photo_names: string[];
  google_drive_folder_id: string | null;
  delivery_type: 'digital' | 'printed';
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
  payment_status: 'pending' | 'paid' | 'refunded' | 'failed';
  payment_provider: string | null;
  payment_order_id: string | null;
  payment_id: string | null;
  payment_link_url: string | null;
  subtotal_amount: number;
  discount_code: string | null;
  discount_percentage: number | null;
  discount_amount: number | null;
  total_amount: number;
  advance_amount: number;
  advance_amount_paise: number;
  admin_notes: string | null;
  barcode_value: string | null;
  barcode_url: string | null;
  tracking_url: string | null;
  bill_number: string | null;
  review_token: string | null;
  payment_completed_at: string | null;
  completed_at: string | null;
  delivered_at: string | null;
  pickup_ready_at: string | null;
  pickup_ready_by: string | null;
  pickup_ready_notified_at: string | null;
  pickup_completed_at: string | null;
  last_barcode_scanned_at: string | null;
  barcode_scan_count: number;
  customer_notified_at: string | null;
  review_request_sent_at: string | null;
  review_submitted_at: string | null;
  delivery_verified_by: string | null;
  file_retention_status: 'retained' | 'scheduled' | 'deleted' | 'failed' | 'skipped';
  files_deletion_scheduled_at: string | null;
  files_deleted_at: string | null;
  files_deletion_failed_at: string | null;
  files_deletion_error: string | null;
  qikink_status: 'not_required' | 'queued' | 'submitted' | 'failed';
  qikink_order_id: string | null;
  qikink_submitted_at: string | null;
  qikink_error: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrderPhoto {
  id: string;
  order_id?: string;
  user_id?: string;
  file_name: string;
  file_url: string;
  storage_provider?: 'google_drive';
  google_drive_file_id?: string | null;
  google_drive_web_view_link?: string | null;
  google_drive_web_content_link?: string | null;
  file_size: number;
  sort_order: number;
  created_at: string;
}

export interface PrintJob {
  id: string;
  order_id: string | null;
  source_type: 'final_artwork' | 'original_upload' | 'manual';
  title: string;
  file_name: string;
  file_size: number;
  mime_type: string | null;
  google_drive_file_id: string;
  google_drive_folder_id: string | null;
  google_drive_web_view_link: string | null;
  google_drive_web_content_link: string | null;
  google_drive_thumbnail_link: string | null;
  preview_url: string | null;
  target: 'auto' | 'color' | 'bw';
  copies: number;
  notes: string | null;
  status: 'queued' | 'claimed' | 'printing' | 'printed' | 'failed' | 'cancelled';
  requested_by_user_id: string;
  requested_by_email: string;
  desktop_device_id: string | null;
  desktop_device_name: string | null;
  desktop_claimed_at: string | null;
  print_started_at: string | null;
  printed_at: string | null;
  failed_at: string | null;
  error_message: string | null;
  is_reprint: boolean;
  parent_print_job_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface AdminUser {
  id: string;
  user_id: string;
  email: string;
  is_active: boolean;
  created_at: string;
}

export interface Testimonial {
  id: string;
  name: string;
  location: string | null;
  message: string;
  rating: number;
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

export interface Promotion {
  id: string;
  code: string;
  description: string | null;
  discount_percentage: number;
  max_uses: number | null;
  uses_count: number;
  valid_until: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Review {
  id: string;
  order_id: string;
  user_id: string;
  customer_name: string;
  customer_email: string;
  public_location: string | null;
  rating: number;
  message: string;
  status: 'pending' | 'approved' | 'rejected';
  review_token: string;
  requested_at: string | null;
  submitted_at: string | null;
  approved_at: string | null;
  rejected_at: string | null;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface AnalyticsOverview {
  monthly_revenue: Array<{
    month: string;
    orders: number;
    revenue: number;
  }>;
  popular_services: Array<{
    code: string;
    name: string;
    count: number;
  }>;
  popular_templates: Array<{
    code: string;
    count: number;
  }>;
  kpis: {
    total_orders: number;
    paid_orders: number;
    pending_orders: number;
    paid_revenue: number;
  };
}

export interface Template {
  id: string;
  name: string;
  category: string;
  description: string | null;
  image_url: string;
  tag: string | null;
  is_active: boolean;
  sort_order: number;
  created_at?: string;
  updated_at?: string;
}

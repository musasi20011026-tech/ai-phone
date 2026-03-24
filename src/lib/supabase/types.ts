export interface Store {
  id: string;
  user_id: string;
  name: string;
  phone_number: string | null;
  address: string | null;
  business_hours: string;
  closed_days: string;
  seat_count: number | null;
  tone: 'polite' | 'casual';
  greeting: string;
  fallback_message: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface StoreFaq {
  id: string;
  store_id: string;
  question: string;
  answer: string;
  sort_order: number;
}

export interface StoreMenuItem {
  id: string;
  store_id: string;
  name: string;
  price: string | null;
  description: string | null;
  sort_order: number;
}

export interface Call {
  id: string;
  store_id: string;
  call_sid: string;
  from_number: string;
  to_number: string;
  direction: string;
  status: string;
  duration: number;
  category: 'RESERVATION' | 'INQUIRY' | 'CHANGE' | 'COMPLAINT' | 'ESCALATION' | 'OTHER';
  urgency: 'high' | 'medium' | 'low';
  summary: string | null;
  caller_name: string | null;
  callback_needed: boolean;
  key_details: string | null;
  staff_status: 'unread' | 'read' | 'in-progress' | 'done';
  staff_notes: string | null;
  started_at: string;
  ended_at: string | null;
}

export interface CallMessage {
  id: string;
  call_id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

export interface Reservation {
  id: string;
  store_id: string;
  call_id: string | null;
  customer_name: string;
  customer_phone: string;
  party_size: number;
  reservation_date: string;
  reservation_time: string;
  seat_type: 'counter' | 'table' | 'private' | 'any';
  course_type: 'course' | 'a_la_carte';
  course_name: string | null;
  allergies: string | null;
  special_requests: string | null;
  status: 'confirmed' | 'cancelled' | 'completed' | 'no_show';
  reminder_day_before_sent: boolean;
  reminder_same_day_sent: boolean;
  language: string;
  created_at: string;
  updated_at: string;
}

export interface StoreSeat {
  id: string;
  store_id: string;
  seat_type: string;
  seat_label: string;
  capacity: number;
  count: number;
  created_at: string;
}

export interface StoreCourse {
  id: string;
  store_id: string;
  name: string;
  price: number;
  description: string | null;
  recommended_party_size: string | null;
  is_recommended: boolean;
  sort_order: number;
  created_at: string;
}

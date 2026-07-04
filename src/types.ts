export interface RewardState {
  active: boolean;
  start_tip_count: number;
  next_reward_at: number;
  trips_remaining: number;
  reward_cycle_size: number;
  started_at: string;
  last_calculated_at: string;
  completed: boolean;
  f10_done?: boolean;
  f50_done?: boolean;
  expires_at?: string;
  expired?: boolean;
}

export interface Driver {
  uuid: string;
  name: string;
  photo_url: string;
  tip_count: number;
  email: string;
  old_email?: string;
  phone: string;
  old_phone?: string;
  has_contact_change: boolean;
  first_seen: string;
  last_updated: string;
  deleted?: boolean;
  deleted_at?: string;
  edited_manually?: boolean;
  change_reviewed_at?: string;
  reward?: RewardState;
  source?: string;
  status?: 'Active' | 'Applied' | 'Waitlisted' | 'Rejected';
}

export type ActiveTab = 
  | 'home' 
  | 'inbox' 
  | 'documents' 
  | 'drivers' 
  | 'vehicles' 
  | 'reports' 
  | 'earnings' 
  | 'live_map' 
  | 'banking' 
  | 'invoices' 
  | 'account' 
  | 'help' 
  | 'install' 
  | 'import' 
  | 'sandbox' 
  | 'connection' 
  | 'settings';

export interface GlobalSettings {
  default_reward_cycle: number;
  default_expiry_days?: number;
}

export interface NotificationSettings {
  reward_alert: boolean;
  reward_thresholds: number[];
  sync_reminder: boolean;
  sync_reminder_hours: number;
}

export interface DatabaseSnapshot {
  id: string;
  timestamp: string;
  label: string;
  driversCount: number;
  drivers: Record<string, Driver>;
}

export interface SyncSchedule {
  enabled: boolean;
  frequency: 'daily' | 'weekly';
  time: string; // "HH:MM"
  daysOfWeek?: number[]; // [0-6] (Sunday=0, Monday=1, etc.)
}


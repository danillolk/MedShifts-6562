export interface Shift {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  specialty: string;
  shiftType: 'diurno' | 'noturno' | 'plantão_12h' | 'plantão_24h';
  paymentAmount: number;
  paymentStatus: 'pending' | 'received';
  notes?: string;
}

export interface Payment {
  shiftId: string;
  date: string;
  location: string;
  amount: number;
  status: 'pending' | 'received';
}

export type ViewType = 'dashboard' | 'shifts' | 'financial' | 'calendar';

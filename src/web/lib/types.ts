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
  color?: string;
}

export const SHIFT_COLORS = [
  { value: '#3b82f6', label: 'Azul', bg: 'bg-blue-500', text: 'text-blue-500' },
  { value: '#22c55e', label: 'Verde', bg: 'bg-green-500', text: 'text-green-500' },
  { value: '#ef4444', label: 'Vermelho', bg: 'bg-red-500', text: 'text-red-500' },
  { value: '#a855f7', label: 'Roxo', bg: 'bg-purple-500', text: 'text-purple-500' },
  { value: '#f97316', label: 'Laranja', bg: 'bg-orange-500', text: 'text-orange-500' },
  { value: '#eab308', label: 'Amarelo', bg: 'bg-yellow-500', text: 'text-yellow-500' },
  { value: '#14b8a6', label: 'Teal', bg: 'bg-teal-500', text: 'text-teal-500' },
  { value: '#ec4899', label: 'Rosa', bg: 'bg-pink-500', text: 'text-pink-500' },
] as const;

export interface Payment {
  shiftId: string;
  date: string;
  location: string;
  amount: number;
  status: 'pending' | 'received';
}

export type ViewType = 'dashboard' | 'shifts' | 'financial' | 'calendar';

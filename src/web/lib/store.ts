import { Shift } from './types';

const STORAGE_KEY = 'registro-plantoes-data';

interface StoredData {
  shifts: Shift[];
}

const defaultData: StoredData = {
  shifts: [],
};

export const loadData = (): StoredData => {
  if (typeof window === 'undefined') return defaultData;
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return defaultData;
    return JSON.parse(stored);
  } catch {
    return defaultData;
  }
};

export const saveData = (data: StoredData): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};

export const addShift = (shift: Shift): void => {
  const data = loadData();
  data.shifts.push(shift);
  saveData(data);
};

export const addMultipleShifts = (shifts: Shift[]): void => {
  const data = loadData();
  data.shifts.push(...shifts);
  saveData(data);
};

export const updateShift = (id: string, updates: Partial<Shift>): void => {
  const data = loadData();
  const index = data.shifts.findIndex(s => s.id === id);
  if (index !== -1) {
    data.shifts[index] = { ...data.shifts[index], ...updates };
    saveData(data);
  }
};

export const deleteShift = (id: string): void => {
  const data = loadData();
  data.shifts = data.shifts.filter(s => s.id !== id);
  saveData(data);
};

export const getShifts = (): Shift[] => {
  return loadData().shifts;
};

export const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

import { Shift } from './types';

const STORAGE_KEY = 'registro-plantoes-data';
const API_BASE = '/api';

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

// API Syncing
export const apiFetchShifts = async (): Promise<Shift[]> => {
  try {
    const res = await fetch(`${API_BASE}/shifts`);
    if (res.ok) return await res.json();
  } catch (e) {
    console.error('API Error:', e);
  }
  return loadData().shifts;
};

export const apiSaveShifts = async (shifts: Shift | Shift[]) => {
  try {
    await fetch(`${API_BASE}/shifts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(shifts),
    });
  } catch (e) {
    console.error('API Error:', e);
  }
};

export const apiDeleteShift = async (id: string) => {
  try {
    await fetch(`${API_BASE}/shifts/${id}`, { method: 'DELETE' });
  } catch (e) {
    console.error('API Error:', e);
  }
};

// Targets Sync
export const apiFetchTargets = async () => {
  try {
    const res = await fetch(`${API_BASE}/targets`);
    if (res.ok) return await res.json();
  } catch (e) {
    console.error('API Error:', e);
  }
  return [];
};

export const apiSaveTargets = async (targets: any) => {
  try {
    await fetch(`${API_BASE}/targets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(targets),
    });
  } catch (e) {
    console.error('API Error:', e);
  }
};

// Locations Sync
export const apiFetchLocations = async () => {
  try {
    const res = await fetch(`${API_BASE}/locations`);
    if (res.ok) return await res.json();
  } catch (e) {
    console.error('API Error:', e);
  }
  return [];
};

export const apiSaveLocations = async (locations: any) => {
  try {
    await fetch(`${API_BASE}/locations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(locations),
    });
  } catch (e) {
    console.error('API Error:', e);
  }
};

export const apiDeleteLocation = async (id: string) => {
  try {
    await fetch(`${API_BASE}/locations/${id}`, { method: 'DELETE' });
  } catch (e) {
    console.error('API Error:', e);
  }
};

// Legacy support with API integration
export const addShift = async (shift: Shift) => {
  const data = loadData();
  data.shifts.push(shift);
  saveData(data);
  await apiSaveShifts(shift);
};

export const addMultipleShifts = async (shifts: Shift[]) => {
  const data = loadData();
  data.shifts.push(...shifts);
  saveData(data);
  await apiSaveShifts(shifts);
};

export const updateShift = async (id: string, updates: Partial<Shift>) => {
  const data = loadData();
  const index = data.shifts.findIndex(s => s.id === id);
  if (index !== -1) {
    const updated = { ...data.shifts[index], ...updates };
    data.shifts[index] = updated;
    saveData(data);
    await apiSaveShifts(updated);
  }
};

export const deleteShift = async (id: string) => {
  const data = loadData();
  data.shifts = data.shifts.filter(s => s.id !== id);
  saveData(data);
  await apiDeleteShift(id);
};

export const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

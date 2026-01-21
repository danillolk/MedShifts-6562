import { useState, useEffect, useRef } from 'react';
import { Shift, SHIFT_COLORS } from '@/lib/types';
import { generateId } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { MapPin, Check } from 'lucide-react';

interface ShiftFormProps {
  open: boolean;
  onClose: () => void;
  onSave: (shift: Shift) => void;
  editingShift?: Shift | null;
}

const shiftTypes = [
  { value: 'diurno', label: 'Diurno' },
  { value: 'noturno', label: 'Noturno' },
  { value: 'plantão_12h', label: 'Plantão 12h' },
  { value: 'plantão_24h', label: 'Plantão 24h' },
];

const specialties = [
  'Clínica Geral',
  'Pediatria',
  'Cardiologia',
  'Ortopedia',
  'Neurologia',
  'Ginecologia',
  'Emergência',
  'UTI',
  'Cirurgia Geral',
  'Anestesiologia',
];

const SAVED_LOCATIONS_KEY = 'medplantao_saved_locations';

const getSavedLocations = (): string[] => {
  try {
    const saved = localStorage.getItem(SAVED_LOCATIONS_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
};

const saveLocation = (location: string) => {
  const saved = getSavedLocations();
  if (!saved.includes(location)) {
    const updated = [location, ...saved].slice(0, 20); // Keep max 20 locations
    localStorage.setItem(SAVED_LOCATIONS_KEY, JSON.stringify(updated));
  }
};

export const ShiftForm = ({ open, onClose, onSave, editingShift }: ShiftFormProps) => {
  const [formData, setFormData] = useState<Partial<Shift>>({
    date: editingShift?.date || '',
    startTime: editingShift?.startTime || '',
    endTime: editingShift?.endTime || '',
    location: editingShift?.location || '',
    specialty: editingShift?.specialty || '',
    shiftType: editingShift?.shiftType || 'diurno',
    paymentAmount: editingShift?.paymentAmount || 0,
    paymentStatus: editingShift?.paymentStatus || 'pending',
    notes: editingShift?.notes || '',
    color: editingShift?.color || SHIFT_COLORS[0].value,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [savedLocations, setSavedLocations] = useState<string[]>([]);
  const [showLocationSuggestions, setShowLocationSuggestions] = useState(false);
  const [locationFilter, setLocationFilter] = useState('');
  const locationInputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSavedLocations(getSavedLocations());
  }, [open]);

  useEffect(() => {
    if (editingShift) {
      setFormData({
        date: editingShift.date,
        startTime: editingShift.startTime,
        endTime: editingShift.endTime,
        location: editingShift.location,
        specialty: editingShift.specialty,
        shiftType: editingShift.shiftType,
        paymentAmount: editingShift.paymentAmount,
        paymentStatus: editingShift.paymentStatus,
        notes: editingShift.notes || '',
        color: editingShift.color || SHIFT_COLORS[0].value,
      });
    } else {
      setFormData({
        date: '',
        startTime: '',
        endTime: '',
        location: '',
        specialty: '',
        shiftType: 'diurno',
        paymentAmount: 0,
        paymentStatus: 'pending',
        notes: '',
        color: SHIFT_COLORS[0].value,
      });
    }
    setErrors({});
  }, [editingShift, open]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(e.target as Node) &&
        !locationInputRef.current?.contains(e.target as Node)
      ) {
        setShowLocationSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredLocations = savedLocations.filter(loc =>
    loc.toLowerCase().includes(locationFilter.toLowerCase())
  );

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.date) newErrors.date = 'Data obrigatória';
    if (!formData.startTime) newErrors.startTime = 'Horário de início obrigatório';
    if (!formData.endTime) newErrors.endTime = 'Horário de fim obrigatório';
    if (!formData.location) newErrors.location = 'Local obrigatório';
    if (!formData.specialty) newErrors.specialty = 'Especialidade obrigatória';
    if (!formData.paymentAmount || formData.paymentAmount <= 0) {
      newErrors.paymentAmount = 'Valor deve ser maior que zero';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;

    // Save location to localStorage
    if (formData.location) {
      saveLocation(formData.location);
    }

    const shift: Shift = {
      id: editingShift?.id || generateId(),
      date: formData.date!,
      startTime: formData.startTime!,
      endTime: formData.endTime!,
      location: formData.location!,
      specialty: formData.specialty!,
      shiftType: formData.shiftType!,
      paymentAmount: formData.paymentAmount!,
      paymentStatus: formData.paymentStatus!,
      notes: formData.notes,
      color: formData.color,
    };

    onSave(shift);
    onClose();
  };

  const handleLocationChange = (value: string) => {
    setFormData({ ...formData, location: value });
    setLocationFilter(value);
    setShowLocationSuggestions(true);
  };

  const selectLocation = (location: string) => {
    setFormData({ ...formData, location });
    setLocationFilter(location);
    setShowLocationSuggestions(false);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto bg-slate-900 border-slate-700 text-white">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-emerald-400">
            {editingShift ? 'Editar Plantão' : 'Novo Plantão'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Date */}
          <div className="space-y-2">
            <Label className="text-slate-300">Data</Label>
            <Input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="bg-slate-800 border-slate-600 text-white focus:border-emerald-500"
            />
            {errors.date && <p className="text-red-400 text-sm">{errors.date}</p>}
          </div>

          {/* Time range */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-slate-300">Início</Label>
              <Input
                type="time"
                value={formData.startTime}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                className="bg-slate-800 border-slate-600 text-white focus:border-emerald-500"
              />
              {errors.startTime && <p className="text-red-400 text-sm">{errors.startTime}</p>}
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">Fim</Label>
              <Input
                type="time"
                value={formData.endTime}
                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                className="bg-slate-800 border-slate-600 text-white focus:border-emerald-500"
              />
              {errors.endTime && <p className="text-red-400 text-sm">{errors.endTime}</p>}
            </div>
          </div>

          {/* Location with suggestions */}
          <div className="space-y-2 relative">
            <Label className="text-slate-300">Hospital / Local</Label>
            <div className="relative">
              <Input
                ref={locationInputRef}
                placeholder="Ex: Hospital São Lucas"
                value={formData.location}
                onChange={(e) => handleLocationChange(e.target.value)}
                onFocus={() => setShowLocationSuggestions(true)}
                className="bg-slate-800 border-slate-600 text-white placeholder:text-slate-500 focus:border-emerald-500"
              />
              {showLocationSuggestions && filteredLocations.length > 0 && (
                <div
                  ref={suggestionsRef}
                  className="absolute z-50 w-full mt-1 bg-slate-800 border border-slate-600 rounded-lg shadow-xl max-h-48 overflow-y-auto"
                >
                  <div className="p-2 text-xs text-slate-400 border-b border-slate-700 flex items-center gap-1.5">
                    <MapPin className="w-3 h-3" />
                    Locais Recentes
                  </div>
                  {filteredLocations.map((loc) => (
                    <button
                      key={loc}
                      type="button"
                      onClick={() => selectLocation(loc)}
                      className="w-full px-3 py-2.5 text-left text-white hover:bg-slate-700 transition-colors flex items-center gap-2"
                    >
                      <MapPin className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span className="truncate">{loc}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            {errors.location && <p className="text-red-400 text-sm">{errors.location}</p>}
          </div>

          {/* Specialty */}
          <div className="space-y-2">
            <Label className="text-slate-300">Especialidade</Label>
            <Select
              value={formData.specialty}
              onValueChange={(v) => setFormData({ ...formData, specialty: v })}
            >
              <SelectTrigger className="bg-slate-800 border-slate-600 text-white">
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-600">
                {specialties.map((s) => (
                  <SelectItem key={s} value={s} className="text-white hover:bg-slate-700">
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.specialty && <p className="text-red-400 text-sm">{errors.specialty}</p>}
          </div>

          {/* Shift Type */}
          <div className="space-y-2">
            <Label className="text-slate-300">Tipo de Plantão</Label>
            <Select
              value={formData.shiftType}
              onValueChange={(v) => setFormData({ ...formData, shiftType: v as Shift['shiftType'] })}
            >
              <SelectTrigger className="bg-slate-800 border-slate-600 text-white">
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-600">
                {shiftTypes.map((t) => (
                  <SelectItem key={t.value} value={t.value} className="text-white hover:bg-slate-700">
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Color Picker */}
          <div className="space-y-2">
            <Label className="text-slate-300">Cor do Plantão</Label>
            <div className="flex flex-wrap gap-2">
              {SHIFT_COLORS.map((color) => (
                <button
                  key={color.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, color: color.value })}
                  className={`w-9 h-9 rounded-lg transition-all flex items-center justify-center ${
                    formData.color === color.value 
                      ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-900 scale-110' 
                      : 'hover:scale-105'
                  }`}
                  style={{ backgroundColor: color.value }}
                  title={color.label}
                >
                  {formData.color === color.value && (
                    <Check className="w-5 h-5 text-white drop-shadow-md" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Payment */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-slate-300">Valor (R$)</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={formData.paymentAmount || ''}
                onChange={(e) => setFormData({ ...formData, paymentAmount: parseFloat(e.target.value) || 0 })}
                className="bg-slate-800 border-slate-600 text-white focus:border-emerald-500"
              />
              {errors.paymentAmount && <p className="text-red-400 text-sm">{errors.paymentAmount}</p>}
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">Status Pagamento</Label>
              <Select
                value={formData.paymentStatus}
                onValueChange={(v) => setFormData({ ...formData, paymentStatus: v as 'pending' | 'received' })}
              >
                <SelectTrigger className="bg-slate-800 border-slate-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-600">
                  <SelectItem value="pending" className="text-white hover:bg-slate-700">Pendente</SelectItem>
                  <SelectItem value="received" className="text-white hover:bg-slate-700">Recebido</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label className="text-slate-300">Observações (opcional)</Label>
            <Input
              placeholder="Notas adicionais..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="bg-slate-800 border-slate-600 text-white placeholder:text-slate-500 focus:border-emerald-500"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="border-slate-600 text-slate-300 hover:bg-slate-800">
            Cancelar
          </Button>
          <Button onClick={handleSubmit} className="bg-emerald-600 hover:bg-emerald-700 text-white">
            {editingShift ? 'Salvar' : 'Adicionar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

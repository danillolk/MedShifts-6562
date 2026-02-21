import { useState, useEffect, useRef } from 'react';
import { Shift, SHIFT_COLORS } from '@/lib/types';
import { generateId, apiFetchLocations, apiSaveLocations } from '@/lib/store';
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
import { MapPin, Check, Repeat, ChevronDown, ChevronUp, Settings2 } from 'lucide-react';
import { LocationManager } from './location-manager';

interface ShiftFormProps {
  open: boolean;
  onClose: () => void;
  onSave: (shift: Shift) => void;
  onSaveMultiple?: (shifts: Shift[]) => void;
  editingShift?: Shift | null;
  shifts?: Shift[];
}

type RecurrenceType = 'none' | 'daily' | 'weekly' | 'weekdays' | 'custom';

const recurrenceOptions = [
  { value: 'none', label: 'Não repetir' },
  { value: 'daily', label: 'Diariamente' },
  { value: 'weekly', label: 'Semanalmente' },
  { value: 'weekdays', label: 'Segunda a Sexta' },
  { value: 'custom', label: 'Dias específicos da semana' },
];

const weekDays = [
  { value: 0, label: 'Dom', fullLabel: 'Domingo' },
  { value: 1, label: 'Seg', fullLabel: 'Segunda' },
  { value: 2, label: 'Ter', fullLabel: 'Terça' },
  { value: 3, label: 'Qua', fullLabel: 'Quarta' },
  { value: 4, label: 'Qui', fullLabel: 'Quinta' },
  { value: 5, label: 'Sex', fullLabel: 'Sexta' },
  { value: 6, label: 'Sáb', fullLabel: 'Sábado' },
];

const generateRecurringDates = (
  startDate: string,
  recurrenceType: RecurrenceType,
  endDate: string,
  occurrences: number,
  selectedDays: number[]
): string[] => {
  const dates: string[] = [startDate];
  const start = new Date(startDate + 'T00:00:00');
  const end = endDate ? new Date(endDate + 'T00:00:00') : null;
  const maxOccurrences = occurrences || 10;

  if (recurrenceType === 'none') return dates;
  if (recurrenceType === 'custom' && selectedWeekDays.length === 0) return dates;

  let current = new Date(start);
  let iterations = 0;
  const maxIterations = 1000;

  current.setDate(current.getDate() + 1);

  while (dates.length < maxOccurrences && iterations < maxIterations) {
    iterations++;
    if (end && current > end) break;

    const dayOfWeek = current.getDay();
    let shouldAdd = false;

    switch (recurrenceType) {
      case 'daily': shouldAdd = true; break;
      case 'weekly': shouldAdd = dayOfWeek === start.getDay(); break;
      case 'weekdays': shouldAdd = dayOfWeek >= 1 && dayOfWeek <= 5; break;
      case 'custom': shouldAdd = selectedDays.includes(dayOfWeek); break;
    }

    if (shouldAdd) {
      dates.push(current.toISOString().split('T')[0]);
    }
    current.setDate(current.getDate() + 1);
  }
  return dates;
};

export const ShiftForm = ({ open, onClose, onSave, onSaveMultiple, editingShift, shifts = [] }: ShiftFormProps) => {
  const [formData, setFormData] = useState<Partial<Shift>>({
    date: editingShift?.date || '',
    startTime: editingShift?.startTime || '',
    endTime: editingShift?.endTime || '',
    location: editingShift?.location || '',
    color: editingShift?.color || SHIFT_COLORS[0].value,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [savedLocations, setSavedLocations] = useState<string[]>([]);
  const [showLocationSuggestions, setShowLocationSuggestions] = useState(false);
  const [locationFilter, setLocationFilter] = useState('');
  const [locationManagerOpen, setLocationManagerOpen] = useState(false);
  const locationInputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  const [enableRecurrence, setEnableRecurrence] = useState(false);
  const [recurrenceType, setRecurrenceType] = useState<RecurrenceType>('none');
  const [recurrenceEndDate, setRecurrenceEndDate] = useState('');
  const [recurrenceOccurrences, setRecurrenceOccurrences] = useState(5);
  const [selectedWeekDays, setSelectedWeekDays] = useState<number[]>([]);
  const [useEndDate, setUseEndDate] = useState(true);
  const [showRecurrenceOptions, setShowRecurrenceOptions] = useState(false);

  useEffect(() => {
    const fetchLocs = async () => {
      const data = await apiFetchLocations();
      setSavedLocations(data.map((l: any) => l.name));
    };
    if (open) fetchLocs();
  }, [open]);

  useEffect(() => {
    if (editingShift) {
      setFormData({
        date: editingShift.date,
        startTime: editingShift.startTime,
        endTime: editingShift.endTime,
        location: editingShift.location,
        color: editingShift.color || SHIFT_COLORS[0].value,
      });
      setEnableRecurrence(false);
    } else {
      setFormData({
        date: '',
        startTime: '',
        endTime: '',
        location: '',
        color: SHIFT_COLORS[0].value,
      });
      setEnableRecurrence(false);
      setRecurrenceType('none');
      setRecurrenceEndDate('');
      setRecurrenceOccurrences(5);
      setSelectedWeekDays([]);
    }
    setErrors({});
  }, [editingShift, open]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(e.target as Node) && !locationInputRef.current?.contains(e.target as Node)) {
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
    if (!formData.startTime) newErrors.startTime = 'Início obrigatório';
    if (!formData.endTime) newErrors.endTime = 'Fim obrigatório';
    if (!formData.location) newErrors.location = 'Local obrigatório';
    if (enableRecurrence && recurrenceType !== 'none') {
      if (useEndDate && !recurrenceEndDate) newErrors.recurrenceEndDate = 'Obrigatório';
      if (recurrenceType === 'custom' && selectedWeekDays.length === 0) newErrors.selectedWeekDays = 'Selecione um dia';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    if (formData.location) {
      const saved = await apiFetchLocations();
      if (!saved.find((l: any) => l.name === formData.location)) {
        await apiSaveLocations({ id: generateId(), name: formData.location });
      }
    }

    if (enableRecurrence && recurrenceType !== 'none' && onSaveMultiple) {
      const dates = generateRecurringDates(formData.date!, recurrenceType, useEndDate ? recurrenceEndDate : '', useEndDate ? 100 : recurrenceOccurrences, selectedWeekDays);
      const shifts: Shift[] = dates.map((date) => ({ id: generateId(), date, startTime: formData.startTime!, endTime: formData.endTime!, location: formData.location!, color: formData.color }));
      onSaveMultiple(shifts);
    } else {
      const shift: Shift = { id: editingShift?.id || generateId(), date: formData.date!, startTime: formData.startTime!, endTime: formData.endTime!, location: formData.location!, color: formData.color };
      onSave(shift);
    }
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

  const toggleWeekDay = (day: number) => {
    setSelectedWeekDays(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]);
  };

  const previewDates = enableRecurrence && recurrenceType !== 'none' && formData.date ? generateRecurringDates(formData.date, recurrenceType, useEndDate ? recurrenceEndDate : '', useEndDate ? 10 : Math.min(recurrenceOccurrences, 10), selectedWeekDays) : [];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] sm:max-w-lg max-h-[90vh] overflow-y-auto bg-slate-900 border-slate-700 text-white p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl font-bold text-emerald-400">
            {editingShift ? 'Editar Plantão' : 'Novo Plantão'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 sm:space-y-4 py-2 sm:py-4">
          <div className="space-y-1.5 sm:space-y-2">
            <Label className="text-slate-300 text-xs sm:text-sm">Data</Label>
            <Input type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} className="bg-slate-800 border-slate-600 text-white focus:border-emerald-500 h-10 sm:h-11 text-sm" />
            {errors.date && <p className="text-red-400 text-[10px] sm:text-xs">{errors.date}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <div className="space-y-1.5 sm:space-y-2">
              <Label className="text-slate-300 text-xs sm:text-sm">Início</Label>
              <Input type="time" value={formData.startTime} onChange={(e) => setFormData({ ...formData, startTime: e.target.value })} className="bg-slate-800 border-slate-600 text-white focus:border-emerald-500 h-10 sm:h-11 text-sm" />
              {errors.startTime && <p className="text-red-400 text-[10px] sm:text-xs">{errors.startTime}</p>}
            </div>
            <div className="space-y-1.5 sm:space-y-2">
              <Label className="text-slate-300 text-xs sm:text-sm">Fim</Label>
              <Input type="time" value={formData.endTime} onChange={(e) => setFormData({ ...formData, endTime: e.target.value })} className="bg-slate-800 border-slate-600 text-white focus:border-emerald-500 h-10 sm:h-11 text-sm" />
              {errors.endTime && <p className="text-red-400 text-[10px] sm:text-xs">{errors.endTime}</p>}
            </div>
          </div>

          {!editingShift && (
            <div className="space-y-2 sm:space-y-3">
              <button type="button" onClick={() => { setEnableRecurrence(!enableRecurrence); setShowRecurrenceOptions(!enableRecurrence); }} className={`w-full flex items-center justify-between px-3 py-2 sm:px-4 sm:py-3 rounded-lg border transition-all ${enableRecurrence ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' : 'bg-slate-800 border-slate-600 text-slate-300 hover:border-slate-500'}`}>
                <div className="flex items-center gap-2 sm:gap-3">
                  <Repeat className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="font-medium text-sm sm:text-base">Repetir Plantão</span>
                </div>
                {showRecurrenceOptions ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              {showRecurrenceOptions && (
                <div className="p-3 sm:p-4 bg-slate-800/50 rounded-lg border border-slate-700 space-y-3 sm:space-y-4 animate-in slide-in-from-top-2 duration-200">
                  <div className="space-y-1.5 sm:space-y-2">
                    <Label className="text-slate-300 text-[10px] sm:text-xs uppercase tracking-wider font-semibold">Frequência</Label>
                    <Select value={recurrenceType} onValueChange={(v) => setRecurrenceType(v as RecurrenceType)}>
                      <SelectTrigger className="bg-slate-800 border-slate-600 text-white h-9 sm:h-10 text-xs sm:text-sm"><SelectValue /></SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-600">
                        {recurrenceOptions.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value} className="text-white text-xs sm:text-sm">{opt.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {recurrenceType === 'custom' && (
                    <div className="space-y-1.5 sm:space-y-2">
                      <Label className="text-slate-300 text-[10px] sm:text-xs uppercase tracking-wider font-semibold">Dias da Semana</Label>
                      <div className="flex flex-wrap gap-1.5 sm:gap-2">
                        {weekDays.map((day) => (
                          <button key={day.value} type="button" onClick={() => toggleWeekDay(day.value)} className={`px-2 py-1.5 sm:px-3 sm:py-2 rounded-lg text-[10px] sm:text-xs font-medium transition-all ${selectedWeekDays.includes(day.value) ? 'bg-emerald-500 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`} title={day.fullLabel}>{day.label}</button>
                        ))}
                      </div>
                      {errors.selectedWeekDays && <p className="text-red-400 text-[10px] sm:text-xs">{errors.selectedWeekDays}</p>}
                    </div>
                  )}

                  {recurrenceType !== 'none' && (
                    <>
                      <div className="flex gap-1.5 sm:gap-2">
                        <button type="button" onClick={() => setUseEndDate(true)} className={`flex-1 px-2 py-1.5 sm:px-3 sm:py-2 rounded-lg text-[10px] sm:text-xs font-medium transition-all ${useEndDate ? 'bg-emerald-500 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}>Até data</button>
                        <button type="button" onClick={() => setUseEndDate(false)} className={`flex-1 px-2 py-1.5 sm:px-3 sm:py-2 rounded-lg text-[10px] sm:text-xs font-medium transition-all ${!useEndDate ? 'bg-emerald-500 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}>Nº vezes</button>
                      </div>
                      {useEndDate ? (
                        <div className="space-y-1.5 sm:space-y-2">
                          <Label className="text-slate-300 text-[10px] sm:text-xs uppercase tracking-wider font-semibold">Data Final</Label>
                          <Input type="date" value={recurrenceEndDate} onChange={(e) => setRecurrenceEndDate(e.target.value)} min={formData.date} className="bg-slate-800 border-slate-600 text-white focus:border-emerald-500 h-9 sm:h-10 text-xs" />
                          {errors.recurrenceEndDate && <p className="text-red-400 text-[10px] sm:text-xs">{errors.recurrenceEndDate}</p>}
                        </div>
                      ) : (
                        <div className="space-y-1.5 sm:space-y-2">
                          <Label className="text-slate-300 text-[10px] sm:text-xs uppercase tracking-wider font-semibold">Ocorrências</Label>
                          <Input type="number" min="2" max="52" value={recurrenceOccurrences} onChange={(e) => setRecurrenceOccurrences(parseInt(e.target.value) || 5)} className="bg-slate-800 border-slate-600 text-white focus:border-emerald-500 h-9 sm:h-10 text-xs" />
                        </div>
                      )}
                      {previewDates.length > 1 && (
                        <div className="space-y-1.5 sm:space-y-2">
                          <Label className="text-slate-400 text-[9px] sm:text-[10px] uppercase tracking-wider font-semibold">Prévia ({previewDates.length} plantões)</Label>
                          <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto">
                            {previewDates.slice(0, 10).map((date, i) => (
                              <span key={i} className="px-1.5 py-0.5 bg-slate-700 rounded text-[9px] sm:text-[10px] text-slate-300">{new Date(date + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}</span>
                            ))}
                            {previewDates.length > 10 && <span className="px-1.5 py-0.5 bg-emerald-500/20 text-emerald-400 rounded text-[9px] sm:text-[10px]">+{previewDates.length - 10}</span>}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="space-y-1.5 sm:space-y-2 relative">
            <div className="flex items-center justify-between">
              <Label className="text-slate-300 text-xs sm:text-sm">Hospital / Local</Label>
              <button type="button" onClick={() => setLocationManagerOpen(true)} className="flex items-center gap-1 text-[10px] sm:text-xs text-slate-400 hover:text-emerald-400 transition-colors"><Settings2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />Gerenciar</button>
            </div>
            <div className="relative">
              <Input ref={locationInputRef} placeholder="Ex: Hospital São Lucas" value={formData.location} onChange={(e) => handleLocationChange(e.target.value)} onFocus={() => setShowLocationSuggestions(true)} className="bg-slate-800 border-slate-600 text-white placeholder:text-slate-500 focus:border-emerald-500 h-10 sm:h-11 text-sm" />
              {showLocationSuggestions && filteredLocations.length > 0 && (
                <div ref={suggestionsRef} className="absolute z-50 w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg shadow-2xl max-h-40 overflow-y-auto">
                  <div className="p-2 text-[9px] sm:text-[10px] text-slate-400 border-b border-slate-700 flex items-center gap-1.5"><MapPin className="w-2.5 h-2.5" />Sugestões</div>
                  {filteredLocations.map((loc) => (
                    <button key={loc} type="button" onClick={() => selectLocation(loc)} className="w-full px-3 py-2 text-left text-white hover:bg-slate-700 transition-colors flex items-center gap-2 text-xs"><MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" /><span className="truncate">{loc}</span></button>
                  ))}
                </div>
              )}
            </div>
            {errors.location && <p className="text-red-400 text-[10px] sm:text-xs">{errors.location}</p>}
          </div>

          <div className="space-y-1.5 sm:space-y-2">
            <Label className="text-slate-300 text-xs sm:text-sm">Cor</Label>
            <div className="flex flex-wrap gap-1.5 sm:gap-2">
              {SHIFT_COLORS.map((color) => (
                <button key={color.value} type="button" onClick={() => setFormData({ ...formData, color: color.value })} className={`w-8 h-8 sm:w-9 sm:h-9 rounded-lg transition-all flex items-center justify-center ${formData.color === color.value ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-900 scale-110' : 'hover:scale-105 opacity-70 hover:opacity-100'}`} style={{ backgroundColor: color.value }} title={color.label}>{formData.color === color.value && <Check className="w-4 h-4 sm:w-5 sm:h-5 text-white drop-shadow-md" />}</button>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0 pt-2 flex-row">
          <Button variant="outline" onClick={onClose} className="flex-1 sm:flex-none border-slate-600 text-slate-300 hover:bg-slate-800 h-10 sm:h-11 text-xs sm:text-sm">Cancelar</Button>
          <Button onClick={handleSubmit} className="flex-[2] sm:flex-none bg-emerald-600 hover:bg-emerald-700 text-white h-10 sm:h-11 text-xs sm:text-sm">{editingShift ? 'Salvar' : enableRecurrence && previewDates.length > 1 ? `Adicionar ${previewDates.length}` : 'Adicionar'}</Button>
        </DialogFooter>
      </DialogContent>

      <LocationManager open={locationManagerOpen} onClose={() => { setLocationManagerOpen(false); apiFetchLocations().then(data => setSavedLocations(data.map((l: any) => l.name))); }} shifts={shifts} />
    </Dialog>
  );
};

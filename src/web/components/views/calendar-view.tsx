import { useState } from 'react';
import { Shift } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ShiftForm } from '@/components/shifts/shift-form';
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus,
  Clock,
  MapPin,
  DollarSign
} from 'lucide-react';

interface CalendarViewProps {
  shifts: Shift[];
  onAddShift: (shift: Shift) => void;
  onUpdateShift: (id: string, updates: Partial<Shift>) => void;
}

export const CalendarView = ({ shifts, onAddShift, onUpdateShift }: CalendarViewProps) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingShift, setEditingShift] = useState<Shift | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const startingDay = firstDayOfMonth.getDay();
  const totalDays = lastDayOfMonth.getDate();

  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const getShiftsForDate = (date: string): Shift[] => {
    return shifts.filter(s => s.date === date);
  };

  const formatDateString = (day: number): string => {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  };

  const isToday = (day: number): boolean => {
    const today = new Date();
    return today.getDate() === day && 
           today.getMonth() === month && 
           today.getFullYear() === year;
  };

  const selectedShifts = selectedDate ? getShiftsForDate(selectedDate) : [];

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const handleDateClick = (day: number) => {
    setSelectedDate(formatDateString(day));
  };

  const handleAddShift = (prefilledDate?: string) => {
    setEditingShift(null);
    if (prefilledDate) {
      setSelectedDate(prefilledDate);
    }
    setFormOpen(true);
  };

  const handleEditShift = (shift: Shift) => {
    setEditingShift(shift);
    setFormOpen(true);
  };

  const handleSave = (shift: Shift) => {
    if (editingShift) {
      onUpdateShift(shift.id, shift);
    } else {
      onAddShift(shift);
    }
    setEditingShift(null);
  };

  const days: (number | null)[] = [];
  for (let i = 0; i < startingDay; i++) {
    days.push(null);
  }
  for (let i = 1; i <= totalDays; i++) {
    days.push(i);
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Calendário</h1>
          <p className="text-slate-400">Visualize seus plantões no calendário</p>
        </div>
        <Button 
          onClick={() => handleAddShift(selectedDate || undefined)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/30"
        >
          <Plus className="w-5 h-5 mr-2" />
          Novo Plantão
        </Button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Calendar */}
        <Card className="xl:col-span-2 bg-slate-800/50 border-slate-700">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                size="icon"
                onClick={prevMonth}
                className="text-slate-400 hover:text-white hover:bg-slate-700"
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>
              <CardTitle className="text-xl text-white">
                {monthNames[month]} {year}
              </CardTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={nextMonth}
                className="text-slate-400 hover:text-white hover:bg-slate-700"
              >
                <ChevronRight className="w-5 h-5" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {/* Day headers */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {dayNames.map((day) => (
                <div
                  key={day}
                  className="text-center text-sm font-medium text-slate-400 py-2"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Days grid */}
            <div className="grid grid-cols-7 gap-1">
              {days.map((day, index) => {
                if (!day) {
                  return <div key={`empty-${index}`} className="aspect-square" />;
                }

                const dateStr = formatDateString(day);
                const dayShifts = getShiftsForDate(dateStr);
                const hasShifts = dayShifts.length > 0;
                const isSelected = selectedDate === dateStr;

                return (
                  <button
                    key={day}
                    onClick={() => handleDateClick(day)}
                    className={`
                      aspect-square p-1 rounded-xl transition-all relative
                      flex flex-col items-center justify-start
                      ${isSelected 
                        ? 'bg-emerald-600 text-white ring-2 ring-emerald-400' 
                        : isToday(day)
                          ? 'bg-slate-700 text-white'
                          : 'hover:bg-slate-700/50 text-slate-300'
                      }
                    `}
                  >
                    <span className={`text-sm font-medium mt-1 ${isToday(day) && !isSelected ? 'text-emerald-400' : ''}`}>
                      {day}
                    </span>
                    {hasShifts && (
                      <div className="flex gap-0.5 mt-1 flex-wrap justify-center">
                        {dayShifts.slice(0, 3).map((shift, idx) => (
                          <div
                            key={idx}
                            className={`w-1.5 h-1.5 rounded-full ${
                              shift.paymentStatus === 'received' 
                                ? 'bg-emerald-400' 
                                : 'bg-amber-400'
                            }`}
                          />
                        ))}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Selected Day Details */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">
              {selectedDate 
                ? new Date(selectedDate + 'T00:00:00').toLocaleDateString('pt-BR', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long'
                  })
                : 'Selecione uma data'
              }
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!selectedDate ? (
              <p className="text-slate-400 text-center py-8">
                Clique em um dia para ver os plantões
              </p>
            ) : selectedShifts.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-slate-400 mb-4">Nenhum plantão neste dia</p>
                <Button
                  variant="outline"
                  onClick={() => handleAddShift(selectedDate)}
                  className="border-slate-600 text-slate-300 hover:bg-slate-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {selectedShifts.map((shift) => (
                  <div
                    key={shift.id}
                    onClick={() => handleEditShift(shift)}
                    className="p-4 rounded-xl bg-slate-700/50 hover:bg-slate-700 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-white truncate">{shift.location}</h4>
                      <Badge
                        className={shift.paymentStatus === 'received' 
                          ? 'bg-emerald-500/20 text-emerald-400' 
                          : 'bg-amber-500/20 text-amber-400'
                        }
                      >
                        {shift.paymentStatus === 'received' ? 'Pago' : 'Pendente'}
                      </Badge>
                    </div>
                    <div className="space-y-1.5 text-sm text-slate-400">
                      <div className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{shift.startTime} - {shift.endTime}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5" />
                        <span>{shift.specialty}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-3.5 h-3.5" />
                        <span className="font-medium text-emerald-400">{formatCurrency(shift.paymentAmount)}</span>
                      </div>
                    </div>
                  </div>
                ))}
                <Button
                  variant="outline"
                  className="w-full border-slate-600 text-slate-300 hover:bg-slate-700"
                  onClick={() => handleAddShift(selectedDate)}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar mais
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <ShiftForm
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditingShift(null);
        }}
        onSave={handleSave}
        editingShift={editingShift}
      />
    </div>
  );
};

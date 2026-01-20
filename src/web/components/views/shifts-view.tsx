import { useState } from 'react';
import { Shift } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ShiftForm } from '@/components/shifts/shift-form';
import { 
  Plus, 
  Pencil, 
  Trash2, 
  MapPin, 
  Clock, 
  Calendar,
  Stethoscope
} from 'lucide-react';

interface ShiftsViewProps {
  shifts: Shift[];
  onAddShift: (shift: Shift) => void;
  onUpdateShift: (id: string, updates: Partial<Shift>) => void;
  onDeleteShift: (id: string) => void;
}

export const ShiftsView = ({ shifts, onAddShift, onUpdateShift, onDeleteShift }: ShiftsViewProps) => {
  const [formOpen, setFormOpen] = useState(false);
  const [editingShift, setEditingShift] = useState<Shift | null>(null);

  const sortedShifts = [...shifts].sort((a, b) => b.date.localeCompare(a.date));

  const handleEdit = (shift: Shift) => {
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

  const handleClose = () => {
    setFormOpen(false);
    setEditingShift(null);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const getShiftTypeLabel = (type: Shift['shiftType']) => {
    const labels = {
      diurno: 'Diurno',
      noturno: 'Noturno',
      'plantão_12h': 'Plantão 12h',
      'plantão_24h': 'Plantão 24h',
    };
    return labels[type];
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Plantões</h1>
          <p className="text-slate-400">Gerencie seus plantões médicos</p>
        </div>
        <Button 
          onClick={() => setFormOpen(true)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/30"
        >
          <Plus className="w-5 h-5 mr-2" />
          Novo Plantão
        </Button>
      </div>

      {/* Shifts List */}
      {sortedShifts.length === 0 ? (
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="py-16 text-center">
            <div className="w-16 h-16 rounded-full bg-slate-700 flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Nenhum plantão registrado</h3>
            <p className="text-slate-400 mb-6">Comece adicionando seu primeiro plantão</p>
            <Button 
              onClick={() => setFormOpen(true)}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              <Plus className="w-5 h-5 mr-2" />
              Adicionar Plantão
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {sortedShifts.map((shift) => (
            <Card 
              key={shift.id}
              className="bg-slate-800/50 border-slate-700 hover:border-slate-600 transition-colors"
            >
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                  {/* Date badge */}
                  <div className="flex items-center gap-4 lg:w-48">
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex flex-col items-center justify-center shadow-lg">
                      <span className="text-xs text-emerald-100 uppercase">
                        {new Date(shift.date + 'T00:00:00').toLocaleDateString('pt-BR', { month: 'short' })}
                      </span>
                      <span className="text-xl font-bold text-white">
                        {new Date(shift.date + 'T00:00:00').getDate()}
                      </span>
                    </div>
                    <div className="lg:hidden">
                      <p className="text-sm text-slate-400 capitalize">
                        {new Date(shift.date + 'T00:00:00').toLocaleDateString('pt-BR', { weekday: 'long' })}
                      </p>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-emerald-400" />
                      <h3 className="text-lg font-semibold text-white">{shift.location}</h3>
                    </div>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-slate-400">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-4 h-4" />
                        <span>{shift.startTime} - {shift.endTime}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Stethoscope className="w-4 h-4" />
                        <span>{shift.specialty}</span>
                      </div>
                      <Badge variant="outline" className="border-slate-600 text-slate-300">
                        {getShiftTypeLabel(shift.shiftType)}
                      </Badge>
                    </div>
                  </div>

                  {/* Payment & Actions */}
                  <div className="flex items-center justify-between lg:justify-end gap-4">
                    <div className="text-right">
                      <p className="text-xl font-bold text-white">{formatCurrency(shift.paymentAmount)}</p>
                      <Badge
                        className={shift.paymentStatus === 'received' 
                          ? 'bg-emerald-500/20 text-emerald-400' 
                          : 'bg-amber-500/20 text-amber-400'
                        }
                      >
                        {shift.paymentStatus === 'received' ? 'Recebido' : 'Pendente'}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(shift)}
                        className="text-slate-400 hover:text-white hover:bg-slate-700"
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onDeleteShift(shift.id)}
                        className="text-slate-400 hover:text-red-400 hover:bg-red-500/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <ShiftForm 
        open={formOpen}
        onClose={handleClose}
        onSave={handleSave}
        editingShift={editingShift}
      />
    </div>
  );
};

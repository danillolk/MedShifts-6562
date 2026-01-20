import { Shift } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar, 
  DollarSign, 
  Clock, 
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  MapPin
} from 'lucide-react';

interface DashboardViewProps {
  shifts: Shift[];
}

export const DashboardView = ({ shifts }: DashboardViewProps) => {
  const totalReceived = shifts
    .filter(s => s.paymentStatus === 'received')
    .reduce((acc, s) => acc + s.paymentAmount, 0);
  
  const totalPending = shifts
    .filter(s => s.paymentStatus === 'pending')
    .reduce((acc, s) => acc + s.paymentAmount, 0);

  const today = new Date().toISOString().split('T')[0];
  const upcomingShifts = shifts
    .filter(s => s.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 5);

  const recentShifts = shifts
    .filter(s => s.date < today)
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 5);

  const thisMonth = new Date().toISOString().slice(0, 7);
  const thisMonthShifts = shifts.filter(s => s.date.startsWith(thisMonth));
  const thisMonthTotal = thisMonthShifts.reduce((acc, s) => acc + s.paymentAmount, 0);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
        <p className="text-slate-400">Visão geral dos seus plantões</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-emerald-600 to-teal-600 border-0 shadow-lg shadow-emerald-500/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-emerald-100 text-sm font-medium">Total Recebido</p>
                <p className="text-2xl font-bold text-white mt-1">{formatCurrency(totalReceived)}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-500 to-orange-500 border-0 shadow-lg shadow-amber-500/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-amber-100 text-sm font-medium">Pendente</p>
                <p className="text-2xl font-bold text-white mt-1">{formatCurrency(totalPending)}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500 to-indigo-600 border-0 shadow-lg shadow-blue-500/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium">Total de Plantões</p>
                <p className="text-2xl font-bold text-white mt-1">{shifts.length}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                <Clock className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-violet-500 to-purple-600 border-0 shadow-lg shadow-violet-500/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-violet-100 text-sm font-medium">Este Mês</p>
                <p className="text-2xl font-bold text-white mt-1">{formatCurrency(thisMonthTotal)}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Two column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Shifts */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Calendar className="w-5 h-5 text-emerald-400" />
              Próximos Plantões
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {upcomingShifts.length === 0 ? (
              <p className="text-slate-400 text-center py-6">Nenhum plantão agendado</p>
            ) : (
              upcomingShifts.map((shift) => (
                <div
                  key={shift.id}
                  className="flex items-center gap-4 p-3 rounded-xl bg-slate-700/50 hover:bg-slate-700 transition-colors"
                >
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex flex-col items-center justify-center">
                    <span className="text-xs text-emerald-400 font-medium">
                      {formatDate(shift.date).split(' ')[1]}
                    </span>
                    <span className="text-lg font-bold text-emerald-400">
                      {formatDate(shift.date).split(' ')[0]}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium truncate">{shift.location}</p>
                    <div className="flex items-center gap-2 text-sm text-slate-400">
                      <span>{shift.startTime} - {shift.endTime}</span>
                      <span>•</span>
                      <span>{shift.specialty}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-emerald-400 font-semibold">{formatCurrency(shift.paymentAmount)}</p>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Recent Shifts */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Clock className="w-5 h-5 text-blue-400" />
              Plantões Recentes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentShifts.length === 0 ? (
              <p className="text-slate-400 text-center py-6">Nenhum plantão registrado</p>
            ) : (
              recentShifts.map((shift) => (
                <div
                  key={shift.id}
                  className="flex items-center gap-4 p-3 rounded-xl bg-slate-700/50 hover:bg-slate-700 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-slate-400" />
                      <p className="text-white font-medium truncate">{shift.location}</p>
                    </div>
                    <p className="text-sm text-slate-400 mt-1">{formatDate(shift.date)} • {shift.specialty}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-white font-semibold">{formatCurrency(shift.paymentAmount)}</p>
                    <Badge
                      variant={shift.paymentStatus === 'received' ? 'default' : 'secondary'}
                      className={shift.paymentStatus === 'received' 
                        ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30' 
                        : 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30'
                      }
                    >
                      {shift.paymentStatus === 'received' ? 'Recebido' : 'Pendente'}
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

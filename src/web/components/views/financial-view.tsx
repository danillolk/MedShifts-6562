import { useMemo } from 'react';
import { Shift } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  CheckCircle2, 
  Clock,
  PieChart,
  BarChart3,
  MapPin,
  Calendar
} from 'lucide-react';

interface FinancialViewProps {
  shifts: Shift[];
  onUpdateShift: (id: string, updates: Partial<Shift>) => void;
}

export const FinancialView = ({ shifts, onUpdateShift }: FinancialViewProps) => {
  const totalReceived = shifts
    .filter(s => s.paymentStatus === 'received')
    .reduce((acc, s) => acc + s.paymentAmount, 0);
  
  const totalPending = shifts
    .filter(s => s.paymentStatus === 'pending')
    .reduce((acc, s) => acc + s.paymentAmount, 0);

  const totalAmount = totalReceived + totalPending;

  const receivedPercentage = totalAmount > 0 ? (totalReceived / totalAmount) * 100 : 0;
  const pendingPercentage = totalAmount > 0 ? (totalPending / totalAmount) * 100 : 0;

  // Monthly data for chart
  const monthlyData = useMemo(() => {
    const data: Record<string, { received: number; pending: number }> = {};
    
    shifts.forEach(shift => {
      const month = shift.date.slice(0, 7);
      if (!data[month]) {
        data[month] = { received: 0, pending: 0 };
      }
      if (shift.paymentStatus === 'received') {
        data[month].received += shift.paymentAmount;
      } else {
        data[month].pending += shift.paymentAmount;
      }
    });

    return Object.entries(data)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6)
      .map(([month, values]) => ({
        month: new Date(month + '-01').toLocaleDateString('pt-BR', { month: 'short' }),
        ...values,
        total: values.received + values.pending
      }));
  }, [shifts]);

  const maxMonthlyTotal = Math.max(...monthlyData.map(d => d.total), 1);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const pendingShifts = shifts
    .filter(s => s.paymentStatus === 'pending')
    .sort((a, b) => a.date.localeCompare(b.date));

  const recentTransactions = [...shifts]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 10);

  const togglePaymentStatus = (shiftId: string, currentStatus: string) => {
    onUpdateShift(shiftId, { 
      paymentStatus: currentStatus === 'received' ? 'pending' : 'received' 
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Financeiro</h1>
        <p className="text-slate-400">Acompanhe seus ganhos e pagamentos</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-emerald-600 to-teal-600 border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-emerald-100 text-sm font-medium">Total Recebido</p>
                <p className="text-3xl font-bold text-white mt-2">{formatCurrency(totalReceived)}</p>
                <p className="text-emerald-200 text-sm mt-1">
                  {shifts.filter(s => s.paymentStatus === 'received').length} plantões
                </p>
              </div>
              <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center">
                <CheckCircle2 className="w-7 h-7 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-500 to-orange-500 border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-amber-100 text-sm font-medium">Total Pendente</p>
                <p className="text-3xl font-bold text-white mt-2">{formatCurrency(totalPending)}</p>
                <p className="text-amber-200 text-sm mt-1">
                  {shifts.filter(s => s.paymentStatus === 'pending').length} plantões
                </p>
              </div>
              <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center">
                <Clock className="w-7 h-7 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500 to-indigo-600 border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium">Total Geral</p>
                <p className="text-3xl font-bold text-white mt-2">{formatCurrency(totalAmount)}</p>
                <p className="text-blue-200 text-sm mt-1">{shifts.length} plantões</p>
              </div>
              <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center">
                <DollarSign className="w-7 h-7 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie Chart - Payment Status */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <PieChart className="w-5 h-5 text-emerald-400" />
              Status dos Pagamentos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center gap-8">
              {/* Simple pie chart visualization */}
              <div className="relative w-40 h-40">
                <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                  {/* Background circle */}
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke="#334155"
                    strokeWidth="20"
                  />
                  {/* Received arc */}
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="20"
                    strokeDasharray={`${receivedPercentage * 2.51} 251.2`}
                    className="transition-all duration-700"
                  />
                  {/* Pending arc */}
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke="#f59e0b"
                    strokeWidth="20"
                    strokeDasharray={`${pendingPercentage * 2.51} 251.2`}
                    strokeDashoffset={`${-receivedPercentage * 2.51}`}
                    className="transition-all duration-700"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-white">{Math.round(receivedPercentage)}%</p>
                    <p className="text-xs text-slate-400">Recebido</p>
                  </div>
                </div>
              </div>

              {/* Legend */}
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full bg-emerald-500" />
                  <div>
                    <p className="text-white font-medium">Recebido</p>
                    <p className="text-sm text-slate-400">{formatCurrency(totalReceived)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full bg-amber-500" />
                  <div>
                    <p className="text-white font-medium">Pendente</p>
                    <p className="text-sm text-slate-400">{formatCurrency(totalPending)}</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bar Chart - Monthly Income */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <BarChart3 className="w-5 h-5 text-blue-400" />
              Receita Mensal
            </CardTitle>
          </CardHeader>
          <CardContent>
            {monthlyData.length === 0 ? (
              <p className="text-slate-400 text-center py-8">Sem dados suficientes</p>
            ) : (
              <div className="flex items-end gap-2 h-48">
                {monthlyData.map((data, idx) => (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-2">
                    <div className="w-full flex flex-col gap-1" style={{ height: '180px' }}>
                      <div className="flex-1 flex flex-col justify-end">
                        {/* Received bar */}
                        <div
                          className="w-full bg-emerald-500 rounded-t transition-all duration-500"
                          style={{ height: `${(data.received / maxMonthlyTotal) * 100}%` }}
                        />
                        {/* Pending bar */}
                        <div
                          className="w-full bg-amber-500 rounded-b transition-all duration-500"
                          style={{ height: `${(data.pending / maxMonthlyTotal) * 100}%` }}
                        />
                      </div>
                    </div>
                    <span className="text-xs text-slate-400 capitalize">{data.month}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Two column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Payments */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Clock className="w-5 h-5 text-amber-400" />
              Pagamentos Pendentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            {pendingShifts.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
                <p className="text-slate-400">Nenhum pagamento pendente!</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {pendingShifts.map((shift) => (
                  <div
                    key={shift.id}
                    className="flex items-center gap-4 p-3 rounded-xl bg-slate-700/50 hover:bg-slate-700 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium truncate">{shift.location}</p>
                      <div className="flex items-center gap-2 text-sm text-slate-400">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{formatDate(shift.date)}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-amber-400 font-semibold">{formatCurrency(shift.paymentAmount)}</p>
                      <button
                        onClick={() => togglePaymentStatus(shift.id, shift.paymentStatus)}
                        className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors"
                      >
                        Marcar recebido
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Transactions */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <TrendingUp className="w-5 h-5 text-emerald-400" />
              Transações Recentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentTransactions.length === 0 ? (
              <p className="text-slate-400 text-center py-8">Nenhuma transação</p>
            ) : (
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {recentTransactions.map((shift) => (
                  <div
                    key={shift.id}
                    className="flex items-center gap-4 p-3 rounded-xl bg-slate-700/50"
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      shift.paymentStatus === 'received' 
                        ? 'bg-emerald-500/20' 
                        : 'bg-amber-500/20'
                    }`}>
                      {shift.paymentStatus === 'received' 
                        ? <TrendingUp className="w-5 h-5 text-emerald-400" />
                        : <TrendingDown className="w-5 h-5 text-amber-400" />
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium truncate">{shift.location}</p>
                      <p className="text-sm text-slate-400">{formatDate(shift.date)}</p>
                    </div>
                    <div className="text-right">
                      <p className={`font-semibold ${
                        shift.paymentStatus === 'received' ? 'text-emerald-400' : 'text-amber-400'
                      }`}>
                        {formatCurrency(shift.paymentAmount)}
                      </p>
                      <Badge
                        className={`text-xs ${
                          shift.paymentStatus === 'received' 
                            ? 'bg-emerald-500/20 text-emerald-400' 
                            : 'bg-amber-500/20 text-amber-400'
                        }`}
                      >
                        {shift.paymentStatus === 'received' ? 'Recebido' : 'Pendente'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

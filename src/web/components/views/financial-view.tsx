import { useMemo, useState, useEffect } from 'react';
import { Shift } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  CheckCircle2, 
  Clock,
  PieChart,
  BarChart3,
  MapPin,
  Calendar,
  Settings2
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { apiFetchTargets, apiSaveTargets } from '@/lib/store';

interface MonthlyTarget {
  expected: number;
  actual: number;
}

type TargetsData = Record<string, MonthlyTarget>;

const MONTHS = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

interface FinancialViewProps {
  shifts: Shift[];
  onUpdateShift: (id: string, updates: Partial<Shift>) => void;
}

export const FinancialView = ({ shifts, onUpdateShift }: FinancialViewProps) => {
  const years = useMemo(() => {
    const yearsSet = new Set<string>();
    shifts.forEach(shift => {
      yearsSet.add(shift.date.split('-')[0]);
    });
    const result = Array.from(yearsSet).sort((a, b) => b.localeCompare(a));
    const currentYear = new Date().getFullYear().toString();
    if (!result.includes(currentYear)) result.push(currentYear);
    return result.sort((a, b) => b.localeCompare(a));
  }, [shifts]);

  const hospitals = useMemo(() => {
    const hospitalSet = new Set<string>();
    shifts.forEach(shift => {
      hospitalSet.add(shift.location);
    });
    return ["Todos", ...Array.from(hospitalSet).sort()];
  }, [shifts]);

  const [selectedYear, setSelectedYear] = useState(years[0] || new Date().getFullYear().toString());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth().toString());
  const [selectedHospital, setSelectedHospital] = useState("Todos");
  const [targets, setTargets] = useState<TargetsData>({});

  useEffect(() => {
    const init = async () => {
      const data = await apiFetchTargets();
      const targetsMap: TargetsData = {};
      data.forEach((t: any) => {
        targetsMap[t.id] = { expected: t.expected, actual: t.actual };
      });
      setTargets(targetsMap);
    };
    init();
  }, []);

  const currentTargetKey = `${selectedYear}-${selectedMonth}`;
  const currentTarget = targets[currentTargetKey] || { expected: 0, actual: 0 };

  const handleTargetChange = async (field: keyof MonthlyTarget, value: string) => {
    const numValue = parseFloat(value) || 0;
    const newTarget = {
      ...currentTarget,
      [field]: numValue
    };
    const newTargets = {
      ...targets,
      [currentTargetKey]: newTarget
    };
    setTargets(newTargets);
    
    await apiSaveTargets({
      id: currentTargetKey,
      year: selectedYear,
      month: selectedMonth,
      ...newTarget
    });
  };

  const filteredShifts = useMemo(() => {
    return shifts.filter(s => {
      const yearMatch = s.date.startsWith(selectedYear);
      const hospitalMatch = selectedHospital === "Todos" || s.location === selectedHospital;
      return yearMatch && hospitalMatch;
    });
  }, [shifts, selectedYear, selectedHospital]);

  const yearMetrics = useMemo(() => {
    let received = 0;
    let expected = 0;

    Object.entries(targets).forEach(([key, target]) => {
      if (key.startsWith(`${selectedYear}-`)) {
        received += target.actual;
        expected += target.expected;
      }
    });

    const pending = Math.max(0, expected - received);
    const total = expected;

    return {
      received,
      pending,
      total,
      receivedPercentage: total > 0 ? (received / total) * 100 : 0,
      pendingPercentage: total > 0 ? (pending / total) * 100 : 0
    };
  }, [targets, selectedYear]);

  const monthlyData = useMemo(() => {
    return MONTHS.map((monthName, index) => {
      const key = `${selectedYear}-${index}`;
      const target = targets[key] || { expected: 0, actual: 0 };
      return {
        month: monthName.slice(0, 3),
        received: target.actual,
        pending: Math.max(0, target.expected - target.actual),
        total: target.expected
      };
    }).filter(d => d.total > 0);
  }, [targets, selectedYear]);

  const maxMonthlyTotal = Math.max(...monthlyData.map(d => d.total), 1);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const formatDate = (dateStr: string) => {
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const recentTransactions = [...filteredShifts]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 10);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Financeiro</h1>
          <p className="text-slate-400">
            Gestão financeira anual de {selectedYear}
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          {years.length > 1 && (
            <div className="flex items-center gap-2 bg-slate-800/50 p-1 rounded-lg border border-slate-700 overflow-x-auto">
              <Tabs value={selectedYear} onValueChange={setSelectedYear} className="w-auto">
                <TabsList className="bg-transparent h-8">
                  {years.map(year => (
                    <TabsTrigger 
                      key={year} 
                      value={year}
                      className="text-xs data-[state=active]:bg-blue-600 data-[state=active]:text-white px-3"
                    >
                      {year}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            </div>
          )}
        </div>
      </div>

      <Card className="bg-slate-800/50 border-slate-700 shadow-xl overflow-hidden">
        <CardHeader className="border-b border-slate-700 bg-slate-800/30">
          <CardTitle className="text-lg flex items-center gap-2 text-white font-bold">
            Configuração de Metas Mensais
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
            <div className="space-y-2">
              <Label className="text-slate-300">Mês</Label>
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger className="bg-slate-900 border-slate-700 text-white h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-700 text-white">
                  {MONTHS.map((month, idx) => (
                    <SelectItem key={idx} value={idx.toString()}>{month}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">Valor Esperado para o Mês</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <Input
                  type="number"
                  value={currentTarget.expected || ''}
                  onChange={(e) => handleTargetChange('expected', e.target.value)}
                  placeholder="0,00"
                  className="bg-slate-900 border-slate-700 text-white h-11 pl-9 focus:border-blue-500"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">Valor Realmente Recebido</Label>
              <div className="relative">
                <CheckCircle2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <Input
                  type="number"
                  value={currentTarget.actual || ''}
                  onChange={(e) => handleTargetChange('actual', e.target.value)}
                  placeholder="0,00"
                  className="bg-slate-900 border-slate-700 text-white h-11 pl-9 focus:border-emerald-500"
                />
              </div>
            </div>
            <div className="flex items-center gap-2 h-11 px-4 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-medium">
              <TrendingUp className="w-4 h-4" />
              Pendente: {formatCurrency(Math.max(0, currentTarget.expected - currentTarget.actual))}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-emerald-600 to-teal-600 border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-emerald-100 text-sm font-medium">Total Recebido ({selectedYear})</p>
                <p className="text-3xl font-bold text-white mt-2">{formatCurrency(yearMetrics.received)}</p>
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
                <p className="text-amber-100 text-sm font-medium">Total Pendente ({selectedYear})</p>
                <p className="text-3xl font-bold text-white mt-2">{formatCurrency(yearMetrics.pending)}</p>
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
                <p className="text-blue-100 text-sm font-medium">Meta Anual ({selectedYear})</p>
                <p className="text-3xl font-bold text-white mt-2">{formatCurrency(yearMetrics.total)}</p>
              </div>
              <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center">
                <DollarSign className="w-7 h-7 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <PieChart className="w-5 h-5 text-emerald-400" />
              Progresso Anual
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center gap-8">
              <div className="relative w-40 h-40">
                <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                  <circle cx="50" cy="50" r="40" fill="none" stroke="#334155" strokeWidth="20" />
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="20"
                    strokeDasharray={`${yearMetrics.receivedPercentage * 2.51} 251.2`}
                    className="transition-all duration-700"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke="#f59e0b"
                    strokeWidth="20"
                    strokeDasharray={`${yearMetrics.pendingPercentage * 2.51} 251.2`}
                    strokeDashoffset={`${-yearMetrics.receivedPercentage * 2.51}`}
                    className="transition-all duration-700"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-white">{Math.round(yearMetrics.receivedPercentage)}%</p>
                    <p className="text-xs text-slate-400">Batido</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full bg-emerald-500" />
                  <div>
                    <p className="text-white font-medium">Recebido</p>
                    <p className="text-sm text-slate-400">{formatCurrency(yearMetrics.received)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full bg-amber-500" />
                  <div>
                    <p className="text-white font-medium">Pendente</p>
                    <p className="text-sm text-slate-400">{formatCurrency(yearMetrics.pending)}</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <BarChart3 className="w-5 h-5 text-blue-400" />
              Receita Mensal (Real vs Meta)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {monthlyData.length === 0 ? (
              <p className="text-slate-400 text-center py-8">Configure as metas mensais acima</p>
            ) : (
              <div className="flex items-end gap-2 h-48">
                {monthlyData.map((data, idx) => (
                  <Tooltip key={idx}>
                    <TooltipTrigger asChild>
                      <div className="flex-1 flex flex-col items-center gap-2 cursor-pointer group">
                        <div className="w-full flex flex-col gap-1 hover:scale-x-105 transition-transform" style={{ height: '180px' }}>
                          <div className="flex-1 flex flex-col justify-end">
                            <div
                              className="w-full bg-emerald-500 rounded-t transition-all duration-500"
                              style={{ height: `${(data.received / maxMonthlyTotal) * 100}%` }}
                            />
                            <div
                              className="w-full bg-amber-500 rounded-b transition-all duration-500"
                              style={{ height: `${(data.pending / maxMonthlyTotal) * 100}%` }}
                            />
                          </div>
                        </div>
                        <span className="text-xs text-slate-400 capitalize group-hover:text-white transition-colors">{data.month}</span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="bg-slate-900 border-slate-700 text-white p-3 shadow-xl">
                      <div className="space-y-1">
                        <p className="font-bold text-sm border-b border-slate-700 pb-1 mb-1 capitalize">{data.month}</p>
                        <div className="flex items-center justify-between gap-4 text-xs">
                          <span className="text-emerald-400">Recebido:</span>
                          <span className="font-mono">{formatCurrency(data.received)}</span>
                        </div>
                        <div className="flex items-center justify-between gap-4 text-xs">
                          <span className="text-amber-400">Pendente:</span>
                          <span className="font-mono">{formatCurrency(data.pending)}</span>
                        </div>
                        <div className="flex items-center justify-between gap-4 text-sm font-bold pt-1 border-t border-slate-700 mt-1">
                          <span>Meta:</span>
                          <span className="font-mono">{formatCurrency(data.total)}</span>
                        </div>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-white font-bold">
            Registro de Plantões
          </CardTitle>
          <div className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 min-w-[200px]">
            <Select value={selectedHospital} onValueChange={setSelectedHospital}>
              <SelectTrigger className="bg-transparent border-0 text-white text-xs h-6 focus:ring-0 p-0">
                <div className="flex items-center gap-2">
                  <MapPin className="w-3 h-3 text-slate-400" />
                  <SelectValue placeholder="Hospital" />
                </div>
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-slate-700 text-white">
                {hospitals.map(hospital => (
                  <SelectItem key={hospital} value={hospital} className="text-xs">
                    {hospital}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {recentTransactions.length === 0 ? (
            <p className="text-slate-400 text-center py-8">Nenhum plantão registrado para este filtro</p>
          ) : (
            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
              {recentTransactions.map((shift) => (
                <div
                  key={shift.id}
                  className="flex items-center justify-between p-4 rounded-xl bg-slate-700/30 border border-slate-700/50 hover:border-slate-600 transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center bg-slate-800 text-slate-400">
                      <Calendar className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-white font-medium">{shift.location}</p>
                      <p className="text-sm text-slate-400">{formatDate(shift.date)} • {shift.startTime} - {shift.endTime}</p>
                    </div>
                  </div>
                  <Badge className="bg-slate-800 text-slate-400 border-slate-700">
                    Registrado
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

import { useState, useEffect, useCallback } from 'react';
import { Shift, ViewType } from '@/lib/types';
import { getShifts, addShift, addMultipleShifts, updateShift, deleteShift } from '@/lib/store';
import { Sidebar } from '@/components/layout/sidebar';
import { DashboardView } from '@/components/views/dashboard-view';
import { ShiftsView } from '@/components/views/shifts-view';
import { CalendarView } from '@/components/views/calendar-view';
import { FinancialView } from '@/components/views/financial-view';

function Index() {
  const [currentView, setCurrentView] = useState<ViewType>('dashboard');
  const [shifts, setShifts] = useState<Shift[]>([]);

  useEffect(() => {
    setShifts(getShifts());
  }, []);

  const handleAddShift = useCallback((shift: Shift) => {
    addShift(shift);
    setShifts(getShifts());
  }, []);

  const handleAddMultipleShifts = useCallback((shifts: Shift[]) => {
    addMultipleShifts(shifts);
    setShifts(getShifts());
  }, []);

  const handleUpdateShift = useCallback((id: string, updates: Partial<Shift>) => {
    updateShift(id, updates);
    setShifts(getShifts());
  }, []);

  const handleDeleteShift = useCallback((id: string) => {
    deleteShift(id);
    setShifts(getShifts());
  }, []);

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <DashboardView shifts={shifts} />;
      case 'shifts':
        return (
          <ShiftsView
            shifts={shifts}
            onAddShift={handleAddShift}
            onAddMultipleShifts={handleAddMultipleShifts}
            onUpdateShift={handleUpdateShift}
            onDeleteShift={handleDeleteShift}
          />
        );
      case 'calendar':
        return (
          <CalendarView
            shifts={shifts}
            onAddShift={handleAddShift}
            onAddMultipleShifts={handleAddMultipleShifts}
            onUpdateShift={handleUpdateShift}
          />
        );
      case 'financial':
        return (
          <FinancialView
            shifts={shifts}
            onUpdateShift={handleUpdateShift}
          />
        );
      default:
        return <DashboardView shifts={shifts} />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex">
      <Sidebar currentView={currentView} onViewChange={setCurrentView} />
      
      <main className="flex-1 p-4 lg:p-8 overflow-auto">
        <div className="max-w-7xl mx-auto pt-14 lg:pt-0">
          {renderView()}
        </div>
      </main>
    </div>
  );
}

export default Index;

import { useState, useEffect, useMemo } from 'react';
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
  MapPin, 
  Search, 
  Plus, 
  Pencil, 
  Trash2, 
  Check, 
  X,
  Building2
} from 'lucide-react';
import { Shift } from '@/lib/types';
import { apiFetchLocations, apiSaveLocations, apiDeleteLocation, generateId } from '@/lib/store';

interface LocationManagerProps {
  open: boolean;
  onClose: () => void;
  shifts: Shift[];
}

const SAVED_LOCATIONS_KEY = 'medplantao_saved_locations';

export const LocationManager = ({ open, onClose, shifts }: LocationManagerProps) => {
  const [locations, setLocations] = useState<{id: string, name: string}[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [newLocation, setNewLocation] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  const fetchLocs = async () => {
    const data = await apiFetchLocations();
    if (data.length > 0) {
      setLocations(data);
    } else {
      // Fallback to localStorage if API is empty
      const saved = localStorage.getItem(SAVED_LOCATIONS_KEY);
      if (saved) {
        const names = JSON.parse(saved);
        const mapped = names.map((n: string) => ({ id: generateId(), name: n }));
        setLocations(mapped);
        // Sync to API
        await apiSaveLocations(mapped);
      }
    }
  };

  useEffect(() => {
    if (open) {
      fetchLocs();
      setSearchQuery('');
      setEditingId(null);
      setShowAddForm(false);
      setNewLocation('');
    }
  }, [open]);

  const locationUsageCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    shifts.forEach(shift => {
      counts[shift.location] = (counts[shift.location] || 0) + 1;
    });
    return counts;
  }, [shifts]);

  const filteredLocations = useMemo(() => {
    const sorted = [...locations].sort((a, b) => {
      const countA = locationUsageCounts[a.name] || 0;
      const countB = locationUsageCounts[b.name] || 0;
      return countB - countA || a.name.localeCompare(b.name);
    });
    if (!searchQuery.trim()) return sorted;
    return sorted.filter(loc =>
      loc.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [locations, searchQuery, locationUsageCounts]);

  const handleDelete = async (id: string) => {
    setLocations(locations.filter(l => l.id !== id));
    await apiDeleteLocation(id);
  };

  const handleStartEdit = (id: string, currentValue: string) => {
    setEditingId(id);
    setEditValue(currentValue);
  };

  const handleSaveEdit = async () => {
    if (editingId === null || !editValue.trim()) return;
    
    const updated = locations.map(l => l.id === editingId ? { ...l, name: editValue.trim() } : l);
    setLocations(updated);
    await apiSaveLocations(updated.find(l => l.id === editingId));
    setEditingId(null);
    setEditValue('');
  };

  const handleAddLocation = async () => {
    if (!newLocation.trim()) return;
    if (locations.find(l => l.name === newLocation.trim())) return;
    
    const newItem = { id: generateId(), name: newLocation.trim() };
    const updated = [newItem, ...locations];
    setLocations(updated);
    await apiSaveLocations(newItem);
    setNewLocation('');
    setShowAddForm(false);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[85vh] flex flex-col bg-slate-900 border-slate-700 text-white p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-emerald-400 flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Gerenciar Locais
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col space-y-4">
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Buscar local..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-slate-800 border-slate-600 text-white placeholder:text-slate-500 focus:border-emerald-500 h-10"
              />
            </div>

            {!showAddForm ? (
              <Button
                onClick={() => setShowAddForm(true)}
                variant="outline"
                className="w-full border-dashed border-slate-600 text-slate-300 hover:bg-slate-800 hover:border-emerald-500 hover:text-emerald-400 h-10"
              >
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Novo Local
              </Button>
            ) : (
              <div className="flex gap-2 p-2 bg-slate-800/50 rounded-lg border border-slate-700 animate-in fade-in duration-200">
                <Input
                  placeholder="Nome do local..."
                  value={newLocation}
                  onChange={(e) => setNewLocation(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddLocation()}
                  className="flex-1 bg-slate-700 border-slate-600 text-white h-10"
                  autoFocus
                />
                <Button size="icon" onClick={handleAddLocation} className="bg-emerald-600 hover:bg-emerald-700 h-10 w-10">
                  <Check className="w-4 h-4" />
                </Button>
                <Button size="icon" variant="ghost" onClick={() => setShowAddForm(false)} className="h-10 w-10">
                  <X className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
            {filteredLocations.length === 0 ? (
              <div className="text-center py-12">
                <MapPin className="w-12 h-12 text-slate-700 mx-auto mb-3 opacity-20" />
                <p className="text-slate-500">Nenhum local encontrado</p>
              </div>
            ) : (
              filteredLocations.map((loc) => {
                const usageCount = locationUsageCounts[loc.name] || 0;
                const isEditing = editingId === loc.id;

                return (
                  <div key={loc.id} className="flex items-center gap-3 p-3 bg-slate-800/40 rounded-xl border border-slate-700/50 hover:border-slate-600 transition-all">
                    <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
                      <MapPin className="w-5 h-5 text-emerald-500" />
                    </div>

                    {isEditing ? (
                      <div className="flex-1 flex gap-2">
                        <Input
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          className="flex-1 bg-slate-700 border-slate-600 text-white h-9"
                          autoFocus
                        />
                        <Button size="icon" onClick={handleSaveEdit} className="bg-emerald-600 h-9 w-9">
                          <Check className="w-4 h-4" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => setEditingId(null)} className="h-9 w-9">
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : (
                      <>
                        <div className="flex-1 min-w-0">
                          <p className="text-white font-medium truncate">{loc.name}</p>
                          <p className="text-[10px] sm:text-xs text-slate-500 uppercase tracking-wider font-semibold">
                            {usageCount} {usageCount === 1 ? 'Plantão' : 'Plantões'}
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button size="icon" variant="ghost" onClick={() => handleStartEdit(loc.id, loc.name)} className="h-8 w-8 text-slate-400 hover:text-white">
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                          <Button size="icon" variant="ghost" onClick={() => handleDelete(loc.id)} className="h-8 w-8 text-slate-400 hover:text-red-400">
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        <DialogFooter className="mt-4">
          <Button onClick={onClose} className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white h-11 px-8">
            Concluir
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

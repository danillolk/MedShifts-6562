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

interface LocationManagerProps {
  open: boolean;
  onClose: () => void;
  shifts: Shift[];
}

const SAVED_LOCATIONS_KEY = 'medplantao_saved_locations';

const getSavedLocations = (): string[] => {
  try {
    const saved = localStorage.getItem(SAVED_LOCATIONS_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
};

const saveSavedLocations = (locations: string[]) => {
  localStorage.setItem(SAVED_LOCATIONS_KEY, JSON.stringify(locations));
};

export const LocationManager = ({ open, onClose, shifts }: LocationManagerProps) => {
  const [locations, setLocations] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editValue, setEditValue] = useState('');
  const [newLocation, setNewLocation] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    if (open) {
      setLocations(getSavedLocations());
      setSearchQuery('');
      setEditingIndex(null);
      setShowAddForm(false);
      setNewLocation('');
    }
  }, [open]);

  // Calculate usage count for each location
  const locationUsageCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    shifts.forEach(shift => {
      counts[shift.location] = (counts[shift.location] || 0) + 1;
    });
    return counts;
  }, [shifts]);

  const filteredLocations = useMemo(() => {
    if (!searchQuery.trim()) return locations;
    return locations.filter(loc =>
      loc.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [locations, searchQuery]);

  const handleDelete = (index: number) => {
    const originalIndex = locations.indexOf(filteredLocations[index]);
    const updated = locations.filter((_, i) => i !== originalIndex);
    setLocations(updated);
    saveSavedLocations(updated);
  };

  const handleStartEdit = (index: number, currentValue: string) => {
    setEditingIndex(index);
    setEditValue(currentValue);
  };

  const handleSaveEdit = () => {
    if (editingIndex === null || !editValue.trim()) return;
    
    const originalIndex = locations.indexOf(filteredLocations[editingIndex]);
    const updated = [...locations];
    updated[originalIndex] = editValue.trim();
    setLocations(updated);
    saveSavedLocations(updated);
    setEditingIndex(null);
    setEditValue('');
  };

  const handleCancelEdit = () => {
    setEditingIndex(null);
    setEditValue('');
  };

  const handleAddLocation = () => {
    if (!newLocation.trim()) return;
    if (locations.includes(newLocation.trim())) {
      // Location already exists
      return;
    }
    const updated = [newLocation.trim(), ...locations];
    setLocations(updated);
    saveSavedLocations(updated);
    setNewLocation('');
    setShowAddForm(false);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[85vh] flex flex-col bg-slate-900 border-slate-700 text-white">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-emerald-400 flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Gerenciar Locais
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col space-y-4">
          {/* Search and Add */}
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Buscar local..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-slate-800 border-slate-600 text-white placeholder:text-slate-500 focus:border-emerald-500"
              />
            </div>

            {!showAddForm ? (
              <Button
                onClick={() => setShowAddForm(true)}
                variant="outline"
                className="w-full border-dashed border-slate-600 text-slate-300 hover:bg-slate-800 hover:border-emerald-500 hover:text-emerald-400"
              >
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Novo Local
              </Button>
            ) : (
              <div className="flex gap-2 p-3 bg-slate-800/50 rounded-lg border border-slate-700">
                <Input
                  placeholder="Nome do local..."
                  value={newLocation}
                  onChange={(e) => setNewLocation(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddLocation()}
                  className="flex-1 bg-slate-700 border-slate-600 text-white placeholder:text-slate-500 focus:border-emerald-500"
                  autoFocus
                />
                <Button
                  size="icon"
                  onClick={handleAddLocation}
                  disabled={!newLocation.trim()}
                  className="bg-emerald-600 hover:bg-emerald-700 shrink-0"
                >
                  <Check className="w-4 h-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => {
                    setShowAddForm(false);
                    setNewLocation('');
                  }}
                  className="text-slate-400 hover:text-white hover:bg-slate-700 shrink-0"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>

          {/* Locations List */}
          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {filteredLocations.length === 0 ? (
              <div className="text-center py-8">
                <MapPin className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <p className="text-slate-400">
                  {searchQuery ? 'Nenhum local encontrado' : 'Nenhum local salvo'}
                </p>
                {!searchQuery && (
                  <p className="text-slate-500 text-sm mt-1">
                    Adicione locais ou digite ao criar plantões
                  </p>
                )}
              </div>
            ) : (
              filteredLocations.map((location, index) => {
                const usageCount = locationUsageCounts[location] || 0;
                const isEditing = editingIndex === index;

                return (
                  <div
                    key={`${location}-${index}`}
                    className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg border border-slate-700 hover:border-slate-600 transition-colors"
                  >
                    <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center shrink-0">
                      <MapPin className="w-5 h-5 text-emerald-400" />
                    </div>

                    {isEditing ? (
                      <div className="flex-1 flex gap-2">
                        <Input
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveEdit();
                            if (e.key === 'Escape') handleCancelEdit();
                          }}
                          className="flex-1 bg-slate-700 border-slate-600 text-white focus:border-emerald-500"
                          autoFocus
                        />
                        <Button
                          size="icon"
                          onClick={handleSaveEdit}
                          disabled={!editValue.trim()}
                          className="bg-emerald-600 hover:bg-emerald-700 shrink-0"
                        >
                          <Check className="w-4 h-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={handleCancelEdit}
                          className="text-slate-400 hover:text-white hover:bg-slate-700 shrink-0"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : (
                      <>
                        <div className="flex-1 min-w-0">
                          <p className="text-white font-medium truncate">{location}</p>
                          <p className="text-xs text-slate-500">
                            {usageCount === 0 
                              ? 'Não utilizado' 
                              : usageCount === 1 
                                ? '1 plantão' 
                                : `${usageCount} plantões`}
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleStartEdit(index, location)}
                            className="text-slate-400 hover:text-white hover:bg-slate-700"
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleDelete(index)}
                            className="text-slate-400 hover:text-red-400 hover:bg-red-500/10"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Stats */}
          {locations.length > 0 && (
            <div className="pt-3 border-t border-slate-700 text-center text-sm text-slate-400">
              {locations.length} {locations.length === 1 ? 'local salvo' : 'locais salvos'}
            </div>
          )}
        </div>

        <DialogFooter className="mt-4">
          <Button 
            onClick={onClose} 
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

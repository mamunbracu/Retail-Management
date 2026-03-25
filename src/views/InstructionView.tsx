import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, AlertTriangle, CheckCircle2, Info, ChevronRight, CircleDot, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { InstructionCard, HighlightType } from '../types';
import { cn } from '../utils';
import { api } from '../services/api';
import { PageHeader } from '../components/PageHeader';

import { toast } from 'react-hot-toast';

export const InstructionView = () => {
  const [instructions, setInstructions] = useState<InstructionCard[]>([]);
  const [isInstructionModalOpen, setIsInstructionModalOpen] = useState(false);
  const [editingInstruction, setEditingInstruction] = useState<InstructionCard | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    try {
      await Promise.all(selectedIds.map(id => api.deleteInstruction(id)));
      toast.success(`${selectedIds.length} instructions deleted successfully`);
      setSelectedIds([]);
      await fetchInstructions();
    } catch (error) {
      console.error('Failed to delete instructions:', error);
      toast.error('Failed to delete some instructions');
    }
  };

  const fetchInstructions = async () => {
    setIsLoading(true);
    try {
      const data = await api.getInstructions();
      setInstructions(data);
    } catch (error) {
      console.error('Failed to fetch instructions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInstructions();
  }, []);

  const handleAddOrUpdateInstruction = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newInstruction: InstructionCard = {
      id: editingInstruction?.id || crypto.randomUUID(),
      title: formData.get('title') as string,
      content: formData.get('content') as string,
    };

    try {
      await api.saveInstruction(newInstruction);
      toast.success(editingInstruction ? 'Instruction updated successfully!' : 'Instruction added successfully!');
      await fetchInstructions();
      setIsInstructionModalOpen(false);
      setEditingInstruction(null);
    } catch (error) {
      console.error('Failed to save instruction:', error);
      toast.error('Failed to save instruction');
    }
  };

  const handleDeleteInstruction = async (id: string) => {
    try {
      await api.deleteInstruction(id);
      toast.success('Instruction deleted successfully');
      await fetchInstructions();
    } catch (error) {
      console.error('Failed to delete instruction:', error);
      toast.error('Failed to delete instruction');
    }
  };

  const openEditInstructionModal = (instruction: InstructionCard) => {
    setEditingInstruction(instruction);
    setIsInstructionModalOpen(true);
  };

  const renderFormattedContent = (content: string, highlight?: HighlightType) => {
    const lines = content.split('\n').filter(line => line.trim() !== '');
    
    const getIconColor = (index: number) => {
      if (highlight === 'danger') return 'text-indigo-500';
      if (highlight === 'warning') return 'text-amber-500';
      if (highlight === 'success') return 'text-emerald-500';
      const colors = ['text-blue-500', 'text-purple-500', 'text-pink-500', 'text-indigo-500'];
      return colors[index % colors.length];
    };

    return (
      <div className="space-y-3 mt-4">
        {lines.map((line, idx) => {
          const isHeader = !line.includes(':') && line.length < 40 && !line.startsWith('-');
          
          if (isHeader) {
            return (
              <div key={idx} className="font-bold text-lg mt-6 mb-3 flex items-center gap-2 text-slate-800 dark:text-white">
                <ChevronRight size={18} className={getIconColor(idx)} />
                <span>{line}</span>
              </div>
            );
          }

          const colonIndex = line.indexOf(':');
          if (colonIndex !== -1) {
            const key = line.substring(0, colonIndex + 1);
            const value = line.substring(colonIndex + 1);
            return (
              <div key={idx} className="flex items-start gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 shadow-sm">
                <CircleDot size={16} className={cn("mt-1 shrink-0", getIconColor(idx))} />
                <div className="text-sm">
                  <span className="font-bold text-slate-800 dark:text-slate-200">{key}</span>
                  <span className="text-slate-600 dark:text-slate-400 font-medium">{value}</span>
                </div>
              </div>
            );
          }

          return (
            <div key={idx} className="flex items-start gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 shadow-sm">
              <CircleDot size={16} className={cn("mt-1 shrink-0", getIconColor(idx))} />
              <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{line}</span>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-2">
      <PageHeader title="Instructions">
        <div className="flex gap-2">
          {selectedIds.length > 0 && (
            <button 
              onClick={handleBulkDelete}
              className="bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-3 rounded-xl font-bold shadow-lg shadow-indigo-500/20 flex items-center gap-2 transition-all active:scale-95 shrink-0"
            >
              <Trash2 size={18} />
              Delete ({selectedIds.length})
            </button>
          )}
          <button 
            onClick={() => { setEditingInstruction(null); setIsInstructionModalOpen(true); }}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 sm:px-6 py-3 rounded-xl font-bold shadow-lg shadow-indigo-600/20 flex items-center gap-2 transition-all active:scale-95 shrink-0"
          >
            <Plus size={20} />
            <span className="hidden xs:inline">Add Instruction</span>
            <span className="xs:hidden">Add</span>
          </button>
        </div>
      </PageHeader>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
           {instructions.map((inst) => (
            <motion.div 
              layout
              key={inst.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={() => toggleSelect(inst.id)}
              className={cn(
                "glass-card p-8 shadow-sm flex flex-col h-full transition-all relative cursor-pointer group",
                selectedIds.includes(inst.id) ? "ring-2 ring-indigo-500 bg-indigo-50/50 dark:bg-indigo-900/10" : "hover:shadow-md"
              )}
            >
              <div 
                className={cn(
                  "absolute top-4 right-4 w-5 h-5 rounded border-2 flex items-center justify-center transition-all z-10",
                  selectedIds.includes(inst.id) ? "bg-indigo-500 border-indigo-500" : "border-slate-300 dark:border-slate-600 opacity-0 group-hover:opacity-100"
                )}
              >
                {selectedIds.includes(inst.id) && <Plus size={14} className="text-white rotate-45" />}
              </div>

              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  {inst.highlight === 'danger' && <AlertTriangle size={28} className="text-indigo-500" />}
                  {inst.highlight === 'warning' && <Info size={28} className="text-amber-500" />}
                  {inst.highlight === 'success' && <CheckCircle2 size={28} className="text-emerald-500" />}
                  <h3 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-white">{inst.title}</h3>
                </div>
                <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                  <button 
                    onClick={() => openEditInstructionModal(inst)}
                    className="p-2 glass rounded-xl transition-colors text-slate-400 hover:text-blue-600"
                  >
                    <Edit2 size={18} />
                  </button>
                  <button 
                    onClick={() => handleDeleteInstruction(inst.id)}
                    className="p-2 glass rounded-xl transition-colors text-slate-400 hover:text-indigo-500"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
              <div className="flex-1">
                {renderFormattedContent(inst.content, inst.highlight)}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Modal */}
      <AnimatePresence>
        {isInstructionModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsInstructionModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
            >
              <div className="p-6 md:p-8 overflow-y-auto">
                <div className="flex justify-between items-center mb-6 md:mb-8">
                  <h3 className="text-2xl font-bold text-slate-800 dark:text-white">{editingInstruction ? 'Edit Instruction' : 'Add New Instruction'}</h3>
                  <button onClick={() => setIsInstructionModalOpen(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                    <X size={24} />
                  </button>
                </div>

                <form onSubmit={handleAddOrUpdateInstruction} className="space-y-4 md:space-y-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-slate-400">Title</label>
                    <input 
                      name="title" 
                      defaultValue={editingInstruction?.title || ''} 
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-600/20 outline-none font-medium text-slate-900 dark:text-white" 
                      required
                      placeholder="e.g. Operating Hours"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-slate-400">Content (Each new line will be styled as a step/option)</label>
                    <textarea 
                      name="content" 
                      defaultValue={editingInstruction?.content || ''} 
                      rows={10}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-600/20 outline-none font-medium text-slate-900 dark:text-white resize-none" 
                      required
                      placeholder="Enter instruction details..."
                    />
                  </div>

                  <button 
                    type="submit" 
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-xl font-bold text-lg transition-all shadow-lg shadow-indigo-600/20 mt-4"
                  >
                    {editingInstruction ? 'Update Instruction' : 'Add Instruction'}
                  </button>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

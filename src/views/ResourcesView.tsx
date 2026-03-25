import { useState, useEffect, FormEvent } from 'react';
import { Key, Contact, Plus, Trash2, X, Search, Info, Settings2, Edit2 } from 'lucide-react';
import { Resource, ResourceField } from '../types';
import { api } from '../services/api';
import { motion, AnimatePresence } from 'motion/react';
import { PageHeader } from '../components/PageHeader';
import { cn } from '../utils';
import { toast } from 'react-hot-toast';

export const ResourcesView = () => {
  const [resources, setResources] = useState<Resource[]>([]);
  const [activeTab, setActiveTab] = useState<string>('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  // Modal states
  const [editingResourceId, setEditingResourceId] = useState<string | null>(null);
  const [modalTitle, setModalTitle] = useState('');
  const [modalCategory, setModalCategory] = useState('');
  const [fieldCount, setFieldCount] = useState(1);
  const [dynamicFields, setDynamicFields] = useState<ResourceField[]>([{ label: 'Field 1', value: '' }]);

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    try {
      await Promise.all(selectedIds.map(id => api.deleteResource(id)));
      toast.success(`${selectedIds.length} resources deleted successfully`);
      setSelectedIds([]);
      await fetchResources();
    } catch (error) {
      console.error('Failed to delete resources:', error);
      toast.error('Failed to delete some resources');
    }
  };

  const startEdit = (resource: Resource) => {
    setEditingResourceId(resource.id);
    setModalTitle(resource.title);
    setModalCategory(resource.category);
    setFieldCount((resource.fields || []).length);
    setDynamicFields(resource.fields || []);
    setIsModalOpen(true);
  };

  const fetchResources = async () => {
    setIsLoading(true);
    try {
      const data = await api.getResources();
      setResources(data);
    } catch (error) {
      console.error('Failed to fetch resources:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchResources();
  }, []);

  const handleFieldCountChange = (count: number) => {
    setFieldCount(count);
    const newFields = [...dynamicFields];
    if (count > newFields.length) {
      for (let i = newFields.length; i < count; i++) {
        newFields.push({ label: `Field ${i + 1}`, value: '' });
      }
    } else {
      newFields.splice(count);
    }
    setDynamicFields(newFields);
  };

  const handleFieldLabelChange = (index: number, label: string) => {
    const newFields = [...dynamicFields];
    newFields[index].label = label;
    setDynamicFields(newFields);
  };

  const handleFieldValueChange = (index: number, value: string) => {
    const newFields = [...dynamicFields];
    newFields[index].value = value;
    setDynamicFields(newFields);
  };

  const handleAddResource = async (e: FormEvent) => {
    e.preventDefault();
    const resourceData: Resource = {
      id: editingResourceId || crypto.randomUUID(),
      category: modalCategory || activeTab,
      title: modalTitle,
      fields: dynamicFields,
    };

    try {
      await api.saveResource(resourceData);
      toast.success(editingResourceId ? 'Resource updated successfully!' : 'Resource added successfully!');
      await fetchResources();
      setIsModalOpen(false);
      resetModal();
    } catch (error: any) {
      console.error('Failed to save resource:', error);
      toast.error(error.message || 'Failed to save resource');
      setIsModalOpen(false);
    }
  };

  const resetModal = () => {
    setEditingResourceId(null);
    setModalTitle('');
    setModalCategory(activeTab === 'All' ? '' : activeTab);
    setFieldCount(1);
    setDynamicFields([{ label: 'Field 1', value: '' }]);
  };

  const handleDeleteResource = async (id: string) => {
    try {
      await api.deleteResource(id);
      toast.success('Resource deleted successfully');
      await fetchResources();
    } catch (error: any) {
      console.error('Failed to delete resource:', error);
      toast.error(error.message || 'Failed to delete resource');
    }
  };

  const filteredResources = resources.filter(r => 
    (activeTab === 'All' || r.category === activeTab) && 
    (
      r.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.fields.some(f => f.label.toLowerCase().includes(searchQuery.toLowerCase()) || f.value.toLowerCase().includes(searchQuery.toLowerCase()))
    )
  );

  // Get unique categories for tabs
  const uniqueCategories: string[] = ['All', ...Array.from(new Set<string>(resources.map(r => r.category)))];

  return (
    <div className="p-0 space-y-2">
      <PageHeader title="Resources">
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
            onClick={() => {
              resetModal();
              setIsModalOpen(true);
            }}
            className="bg-primary hover:bg-primary-hover text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-primary/20 flex items-center gap-2 transition-all active:scale-95 shrink-0"
          >
            <Plus size={18} />
            Add Resource
          </button>
        </div>
      </PageHeader>
      
      <div className="flex gap-[5%] items-center">
        <div className="relative w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text"
            placeholder={`Search ${activeTab}s...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="glass w-full pl-12 pr-4 py-4 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-primary/20 outline-none font-medium text-slate-900 dark:text-white shadow-sm"
          />
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex p-1 glass rounded-xl w-fit overflow-x-auto max-w-[60vw] no-scrollbar">
          {uniqueCategories.map(category => (
            <button 
              key={category}
              onClick={() => setActiveTab(category)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition-all whitespace-nowrap ${activeTab === category ? 'bg-white/50 dark:bg-slate-700/50 text-primary dark:text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
            >
              {category !== 'All' && (category === 'password' ? <Key size={16} /> : category === 'contact' ? <Contact size={16} /> : <Info size={16} />)}
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Card(s) */}
      {activeTab === 'All' ? (
        <div className="space-y-8">
          {uniqueCategories.filter(c => c !== 'All' && filteredResources.some(r => r.category === c)).map(category => (
            <div key={category} className="space-y-4">
              <h4 className="text-lg font-bold text-slate-800 dark:text-white capitalize flex items-center gap-2">
                <div className="w-2 h-6 bg-primary rounded-full" />
                {category}
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredResources.filter(r => r.category === category).map(resource => (
                  <div 
                    key={resource.id} 
                    onClick={() => toggleSelect(resource.id)}
                    className={cn(
                      "glass-card p-6 shadow-sm flex flex-col gap-4 relative transition-all cursor-pointer group",
                      selectedIds.includes(resource.id) ? "ring-2 ring-primary bg-primary/5" : "hover:shadow-md"
                    )}
                  >
                    <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className={cn(
                        "w-5 h-5 rounded border-2 flex items-center justify-center transition-all",
                        selectedIds.includes(resource.id) ? "bg-primary border-primary" : "border-slate-300 dark:border-slate-600"
                      )}>
                        {selectedIds.includes(resource.id) && <Plus size={14} className="text-white rotate-45" />}
                      </div>
                    </div>

                    <div className="flex justify-between items-start">
                      <div className="flex flex-col gap-2 w-full">
                        <h4 className="font-bold text-slate-800 dark:text-white text-lg truncate pr-6">{resource.title}</h4>
                        {(resource.fields || []).map((f, i) => (
                          <div key={i} className="flex flex-col">
                            <span className="font-bold text-primary dark:text-primary text-[10px] uppercase tracking-wider">{f.label}</span>
                            <span className="text-slate-800 dark:text-slate-200 font-bold text-sm truncate">{f.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-2 mt-auto pt-4 border-t border-slate-100 dark:border-slate-800/50">
                      <button 
                        onClick={(e) => { e.stopPropagation(); startEdit(resource); }} 
                        className="flex-1 py-2 text-xs font-bold text-slate-500 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all flex items-center justify-center gap-2"
                      >
                        <Edit2 size={14} /> Edit
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleDeleteResource(resource.id); }} 
                        className="flex-1 py-2 text-xs font-bold text-slate-500 hover:text-primary hover:bg-primary/10 dark:hover:bg-primary/20 rounded-lg transition-all flex items-center justify-center gap-2"
                      >
                        <Trash2 size={14} /> Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {isLoading ? (
            <div className="col-span-full text-center py-10">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            </div>
          ) : filteredResources.length === 0 ? (
            <div className="col-span-full text-center py-10 text-slate-400 italic">No {activeTab}s found.</div>
          ) : filteredResources.map(resource => (
            <div 
              key={resource.id} 
              onClick={() => toggleSelect(resource.id)}
              className={cn(
                "glass-card p-6 shadow-sm flex flex-col gap-4 relative transition-all cursor-pointer group",
                selectedIds.includes(resource.id) ? "ring-2 ring-primary bg-primary/5" : "hover:shadow-md"
              )}
            >
              <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className={cn(
                  "w-5 h-5 rounded border-2 flex items-center justify-center transition-all",
                  selectedIds.includes(resource.id) ? "bg-primary border-primary" : "border-slate-300 dark:border-slate-600"
                )}>
                  {selectedIds.includes(resource.id) && <Plus size={14} className="text-white rotate-45" />}
                </div>
              </div>

              <div className="flex justify-between items-start">
                <div className="flex flex-col gap-2 w-full">
                  <h4 className="font-semibold text-slate-800 dark:text-white text-lg truncate pr-6">{resource.title}</h4>
                  {(resource.fields || []).map((f, i) => (
                    <div key={i} className="flex flex-col">
                      <span className="font-semibold text-primary dark:text-primary text-[10px] uppercase tracking-wider">{f.label}</span>
                      <span className="text-slate-800 dark:text-slate-200 font-bold text-sm truncate">{f.value}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex gap-2 mt-auto pt-4 border-t border-slate-100 dark:border-slate-800/50">
                <button 
                  onClick={(e) => { e.stopPropagation(); startEdit(resource); }} 
                  className="flex-1 py-2 text-xs font-bold text-slate-500 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all flex items-center justify-center gap-2"
                >
                  <Edit2 size={14} /> Edit
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); handleDeleteResource(resource.id); }} 
                  className="flex-1 py-2 text-xs font-bold text-slate-500 hover:text-primary hover:bg-primary/10 dark:hover:bg-primary/20 rounded-lg transition-all flex items-center justify-center gap-2"
                >
                  <Trash2 size={14} /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Resource Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
            >
              <div className="p-6 md:p-8 overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-2xl font-bold text-slate-800 dark:text-white">{editingResourceId ? 'Edit' : 'Add New'} Resource</h3>
                  <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                    <X size={24} />
                  </button>
                </div>

                <form onSubmit={handleAddResource} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-widest text-slate-400">Category</label>
                      <input 
                        value={modalCategory}
                        onChange={(e) => setModalCategory(e.target.value)}
                        type="text" 
                        placeholder="e.g. password, contact, links"
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none font-medium text-slate-900 dark:text-white" 
                        required 
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-widest text-slate-400">Resource Title</label>
                      <input 
                        value={modalTitle}
                        onChange={(e) => setModalTitle(e.target.value)}
                        type="text" 
                        placeholder="e.g. Gmail Login, Manager Contact"
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none font-medium text-slate-900 dark:text-white" 
                        required 
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-widest text-slate-400">Number of Fields</label>
                      <select 
                        value={fieldCount}
                        onChange={(e) => handleFieldCountChange(parseInt(e.target.value))}
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none font-medium text-slate-900 dark:text-white"
                      >
                        {[...Array(10)].map((_, i) => (
                          <option key={i + 1} value={i + 1}>{i + 1} Field{i > 0 ? 's' : ''}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-slate-400 mb-2">
                      <Settings2 size={16} />
                      <span className="text-xs font-bold uppercase tracking-widest">Field Configuration</span>
                    </div>
                    <div className="grid grid-cols-1 gap-4">
                      {dynamicFields.map((field, index) => (
                        <div key={index} className="flex flex-col md:flex-row gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                          <div className="flex-1 space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Field Title</label>
                            <input 
                              value={field.label}
                              onChange={(e) => handleFieldLabelChange(index, e.target.value)}
                              type="text" 
                              className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary/20 outline-none font-bold text-sm text-slate-900 dark:text-white"
                              required
                            />
                          </div>
                          <div className="flex-[2] space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Field Content</label>
                            <input 
                              value={field.value}
                              onChange={(e) => handleFieldValueChange(index, e.target.value)}
                              type="text" 
                              className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary/20 outline-none font-medium text-sm text-slate-900 dark:text-white"
                              required
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <button 
                    type="submit" 
                    className="w-full bg-primary hover:bg-primary-hover text-white py-4 rounded-xl font-bold text-lg transition-all shadow-lg shadow-primary/20 mt-4"
                  >
                    Save Resource
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

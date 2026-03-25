import { useState, useEffect, useMemo, FC } from 'react';
import { Search, Edit2, Trash2, Save, X } from 'lucide-react';
import { PageHeader } from '../components/PageHeader';
import { toast } from 'react-hot-toast';

const TABLES = [
  'employees',
  'sales',
  'transactions',
  'roster',
  'order_list',
  'notifications',
  'resources',
  'instructions',
  'shift_tasks',
  'salaries'
];

export const DatabaseTableView: FC = () => {
  const [selectedTable, setSelectedTable] = useState<string>(TABLES[0]);
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<any>({});

  const fetchData = async (table: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/db/${table}`);
      if (!response.ok) throw new Error('Failed to fetch data');
      const result = await response.json();
      setData(result);
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || 'Failed to fetch data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData(selectedTable);
    setSearchQuery('');
    setEditingId(null);
  }, [selectedTable]);

  const handleEdit = (row: any) => {
    setEditingId(row.id);
    setEditFormData({ ...row });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditFormData({});
  };

  const handleSave = async (id: string) => {
    try {
      const response = await fetch(`/api/db/${selectedTable}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editFormData),
      });
      if (!response.ok) throw new Error('Failed to update record');
      toast.success('Record updated successfully');
      setEditingId(null);
      fetchData(selectedTable);
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || 'Failed to update record');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this record?')) return;
    try {
      const response = await fetch(`/api/db/${selectedTable}/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete record');
      toast.success('Record deleted successfully');
      fetchData(selectedTable);
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || 'Failed to delete record');
    }
  };

  const handleInputChange = (key: string, value: any) => {
    setEditFormData((prev: any) => ({ ...prev, [key]: value }));
  };

  const filteredData = useMemo(() => {
    if (!searchQuery) return data;
    const lowerQuery = searchQuery.toLowerCase();
    return data.filter(row => 
      Object.values(row).some(val => 
        String(val).toLowerCase().includes(lowerQuery)
      )
    );
  }, [data, searchQuery]);

  const columns = useMemo(() => {
    if (data.length === 0) return [];
    // Get all unique keys from all rows to ensure we have all columns
    const keys = new Set<string>();
    data.forEach(row => Object.keys(row).forEach(key => keys.add(key)));
    return Array.from(keys);
  }, [data]);

  return (
    <div className="space-y-6">
      <PageHeader title="Database Tables" />

      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
        <div className="flex gap-2 flex-wrap w-full md:w-auto">
          {TABLES.map(table => (
            <button
              key={table}
              onClick={() => setSelectedTable(table)}
              className={`px-4 py-2 rounded-xl font-bold whitespace-nowrap transition-all ${
                selectedTable === table
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
              }`}
            >
              {table}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-64 shrink-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input
            type="text"
            placeholder="Search records..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
          />
        </div>
      </div>

      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="p-8 text-center text-slate-500">Loading data...</div>
          ) : data.length === 0 ? (
            <div className="p-8 text-center text-slate-500">No records found in {selectedTable}</div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                  {columns.map(col => (
                    <th key={col} className="p-4 font-bold text-slate-700 dark:text-slate-300 whitespace-nowrap">
                      {col}
                    </th>
                  ))}
                  <th className="p-4 font-bold text-slate-700 dark:text-slate-300 text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map((row, idx) => (
                  <tr 
                    key={row.id || idx} 
                    className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    {columns.map(col => (
                      <td key={col} className="p-4 text-slate-600 dark:text-slate-400 max-w-xs truncate">
                        {editingId === row.id ? (
                          <input
                            type="text"
                            value={typeof editFormData[col] === 'object' ? JSON.stringify(editFormData[col]) : (editFormData[col] || '')}
                            onChange={(e) => {
                              let val: any = e.target.value;
                              // Try to parse JSON if it looks like an object/array
                              if (val.startsWith('{') || val.startsWith('[')) {
                                try { val = JSON.parse(val); } catch (e) {}
                              }
                              handleInputChange(col, val);
                            }}
                            className="w-full px-2 py-1 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-sm"
                          />
                        ) : (
                          typeof row[col] === 'object' ? JSON.stringify(row[col]) : String(row[col] ?? '')
                        )}
                      </td>
                    ))}
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {editingId === row.id ? (
                          <>
                            <button
                              onClick={() => handleSave(row.id)}
                              className="p-2 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors"
                              title="Save"
                            >
                              <Save size={18} />
                            </button>
                            <button
                              onClick={handleCancelEdit}
                              className="p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                              title="Cancel"
                            >
                              <X size={18} />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => handleEdit(row)}
                              className="p-2 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors"
                              title="Edit"
                            >
                              <Edit2 size={18} />
                            </button>
                            <button
                              onClick={() => handleDelete(row.id)}
                              className="p-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-colors"
                              title="Delete"
                            >
                              <Trash2 size={18} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

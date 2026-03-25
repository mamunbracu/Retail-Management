import { useEffect, useState } from 'react';
import { api } from '../services/api';
import { cn } from '../utils';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface DynamicTableProps {
  dataSource: 'employees' | 'sales' | 'roster' | 'orders' | 'bestEmployee' | 'totalDocuments' | 'totalDeliveries' | 'pendingSalary' | 'paidSalary' | 'performance' | 'none';
  title?: string;
  visibleColumns?: string[];
  headerColor?: string;
  data?: any[];
}

export const DynamicTable = ({ dataSource, title, visibleColumns, headerColor, data: propData }: DynamicTableProps) => {
  const [data, setData] = useState<any[]>(propData || []);
  const [loading, setLoading] = useState(!propData);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    if (propData) {
      setData(propData);
      setLoading(false);
      return;
    }
    
    const fetchData = async () => {
      setLoading(true);
      if (!dataSource || dataSource === 'none') {
        setLoading(false);
        return;
      }
      try {
        let result: any[] = [];
        switch (dataSource) {
          case 'employees': result = await api.getEmployees(); break;
          case 'sales': result = await api.getSales(); break;
          case 'roster': result = await api.getRoster(); break;
          case 'orders': result = await api.getOrderList(); break;
        }
        setData(result);
      } catch (error) {
        console.error('Error fetching table data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [dataSource, propData]);

  if (loading) return <div className="p-8 text-slate-500 animate-pulse font-bold">Loading data...</div>;
  if (!data || data.length === 0) return <div className="p-8 text-slate-500 font-bold">No data available.</div>;

  const allColumns = Array.from(new Set(data.flatMap(row => Object.keys(row)))).filter(key => {
    // Check type of the first non-null/undefined value for this key
    const firstValidRow = data.find(row => row[key] !== null && row[key] !== undefined);
    return firstValidRow ? typeof firstValidRow[key] !== 'object' && key !== 'id' : key !== 'id';
  });
  const columns = visibleColumns && visibleColumns.length > 0 
    ? allColumns.filter(col => visibleColumns.includes(col))
    : allColumns;

  const totalPages = Math.ceil(data.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = data.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="w-full flex flex-col h-full">
      <div className="overflow-x-auto w-full no-scrollbar flex-1">
        <table className="w-full text-sm text-left border-collapse">
          <thead className={cn(
            "text-[10px] uppercase tracking-[0.2em] font-black border-b border-slate-100 dark:border-slate-800",
            headerColor ? cn(headerColor, "bg-transparent") : "text-slate-500 bg-slate-50/50 dark:bg-slate-800/50"
          )}>
            <tr>
              {columns.map(col => (
                <th key={col} className="px-4 py-3 text-[10px] break-words">
                  {col.replace(/_/g, ' ')}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {paginatedData.map((row, i) => (
              <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors group">
                {columns.map(col => (
                  <td key={col} className={cn(
                    "px-4 py-3 break-words font-medium transition-colors",
                    headerColor ? headerColor : "text-slate-600 dark:text-slate-300"
                  )}>
                    {String(row[col])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 dark:border-slate-800 mt-auto">
          <p className="text-[10px] uppercase tracking-widest font-bold text-slate-400">
            Page {currentPage} of {totalPages}
          </p>
          <div className="flex gap-2">
            <button 
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 disabled:opacity-30 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              <ChevronLeft size={14} />
            </button>
            <button 
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 disabled:opacity-30 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

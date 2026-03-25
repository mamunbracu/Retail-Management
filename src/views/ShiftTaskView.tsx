import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Calendar, Sun, Moon, Plus, Trash2, X, Save } from 'lucide-react';
import { DayOfWeek } from '../types';
import { DAYS_OF_WEEK } from '../constants';
import { cn } from '../utils';
import { PageHeader } from '../components/PageHeader';
import { api } from '../services/api';

interface Task {
  text: string;
  completed: boolean;
}

interface TaskList {
  [day: string]: {
    morning: Task[];
    evening: Task[];
  };
}

const INITIAL_SHIFT_TASKS: TaskList = {
  Monday: {
    morning: [
      { text: 'Dairy: Check milk expiry; rotate stock by date. Put short-dated dairy on sale.', completed: false },
      { text: 'Inventory: Refill fridge, confectionery (chocolates/chips), and check chewing gum expiry (mark down if needed).', completed: false },
      { text: 'Stock Management: Price and display any new deliveries. Order Ice Cream via WhatsApp if required.', completed: false },
      { text: 'Lotto/Admin: Ensure Lotto table/counter are up to date. Check stationery; give order list to Ruba.', completed: false },
      { text: 'Cleaning: Clean confectionery shelves, clean coffee machine, and broom/mop the store (including stairs).', completed: false }
    ],
    evening: [
      { text: 'Dairy: Check milk expiry and rotate stock. Put short-dated dairy on sale.', completed: false },
      { text: 'Inventory: Refill the fridge. Check expiry for chewing gum and chocolates (mark down if needed).', completed: false },
      { text: 'Stock Management: Price and display new deliveries. Order Ice Cream via WhatsApp if required.', completed: false },
      { text: 'Lotto/Admin: Ensure Lotto table and counter are up to date. Check stationery; provide order list to Ruba.', completed: false },
      { text: 'Cleaning: Clean confectionery shelves, clean coffee machine, and broom/mop the store (including stairs).', completed: false }
    ]
  },
  Tuesday: {
    morning: [
      { text: 'Receivals: Receive Milk, Drinks, C-Store, and Tobacco (Imperial, BATA, Philip Morris). Note: If not received, inform DADA.', completed: false },
      { text: 'Ordering: Place Bonfect order (in-person or via phone).', completed: false },
      { text: 'Dairy: Rotate milk stock. Mark down short-dated dairy and email Eddie (report any expired DARE/Classic).', completed: false },
      { text: 'Admin: Give settlement report (Thurs–Sun) to Dada. Process "The Land" & QLD newspaper returns.', completed: false },
      { text: 'Lotto/POS: Check Lotto table/coupons. Decorate counter and change outside POS plan.', completed: false },
      { text: 'Food: Manage hot and cold food displays.', completed: false }
    ],
    evening: [
      { text: 'Inventory: Check milk rotation/expiry. Organise magazines and check standing orders.', completed: false },
      { text: 'Tobacco: Receive BATA/Philip Morris (if not completed by morning shift).', completed: false },
      { text: 'Lotto/Admin: Check Lotto table. Cut mastheads for international papers. Process "Wrapaway."', completed: false },
      { text: 'Cleaning: Clean coffee machine and general store clean.', completed: false },
      { text: 'Food: Manage hot and cold food.', completed: false }
    ]
  },
  Wednesday: {
    morning: [
      { text: 'Inventory: Receive/organize magazines. Refill Scratch-its, drinks, ice cream, and snacks.', completed: false },
      { text: 'Quality Control: Check expiry dates for drinks, chocolates, and chewing gum.', completed: false },
      { text: 'Dairy: Check milk expiry and rotate stock.', completed: false },
      { text: 'Lotto/POS: Check Lotto brochures. Clear counter-front ads to prepare for the next day.', completed: false },
      { text: 'Cleaning: Wipe down stationery section, clean coffee machine, and clean store.', completed: false }
    ],
    evening: [
      { text: 'Dairy: Rotate milk stock. Mark down short-dated dairy and email Eddie (report any expired DARE/Classic).', completed: false },
      { text: 'Lotto/POS: Check Lotto table. Decorate counter and update outside POS plan.', completed: false },
      { text: 'Inventory: Check Scratch-its stock. Cut newspaper mastheads.', completed: false },
      { text: 'Food: Manage hot/cold food and check Pie Warmer temperature.', completed: false }
    ]
  },
  Thursday: {
    morning: [
      { text: 'Inventory: Receive Bonfect delivery (price and display). Process "The Land" newspaper returns.', completed: false },
      { text: 'Admin: Prepare EVH magazines/newspapers and charge their account.', completed: false },
      { text: 'Dairy: Rotate milk stock. Mark down short-dated dairy and email Eddie.', completed: false },
      { text: 'Lotto/POS: Check Lotto table and update outside POS plan.', completed: false },
      { text: 'Cleaning: Dust/wipe magazine shelves. Broom the upstairs inventory room.', completed: false }
    ],
    evening: [
      { text: 'Inventory: Check drinks stock/expiry. Refill fridge and confectionery shelves.', completed: false },
      { text: 'Dairy: Rotate milk stock. Mark down short-dated dairy and email Eddie.', completed: false },
      { text: 'Lotto/Admin: Check Lotto table. Cut mastheads for multi-lingual papers.', completed: false },
      { text: 'Maintenance: Clean coffee machine and take out the bins.', completed: false }
    ]
  },
  Friday: {
    morning: [
      { text: 'Orders: Place Milk and Drinks orders.', completed: false },
      { text: 'Dairy: Rotate milk stock. Mark down short-dated dairy and email Eddie.', completed: false },
      { text: 'Lotto/POS: Settle Lotto. Receive and refill Scratch-its. Decorate counter and change outside POS plan.', completed: false },
      { text: 'Maintenance: Manage hot/cold food and take out the bins.', completed: false }
    ],
    evening: [
      { text: 'Lists: Create "New/Missing" lists for Scratch-its, C-Store, and Tobacco (PML, BATA, IML).', completed: false },
      { text: 'Inventory: Organise magazines, refill fridge, and refill coffee beans.', completed: false },
      { text: 'Quality Control: Check expiry dates for chocolates, snacks, and Lotto brochures.', completed: false },
      { text: 'Cleaning: Clean coffee machine, broom, and mop the store.', completed: false }
    ]
  },
  Saturday: {
    morning: [
      { text: 'Newspapers: Receive/prepare papers for display and delivery. Write paper returns.', completed: false },
      { text: 'Dairy: Receive Milk and rotate stock. Mark down short-dated dairy and email Eddie.', completed: false },
      { text: 'Inventory: Check all confectionery stock and display.', completed: false },
      { text: 'Lotto/POS: Update outside POS and counter decor.', completed: false },
      { text: 'Cleaning: Clean register counter and broom the store.', completed: false }
    ],
    evening: [
      { text: 'Ordering: Double-check and place orders for Imperial, BATA, PML, Scratch-its, and C-Store.', completed: false },
      { text: 'Inventory: Check tissue and magazine stock. Arrange chocolate and fridge sections.', completed: false },
      { text: 'Cleaning: Clean coffee machine and broom the shop. Bring the coffee board inside.', completed: false }
    ]
  },
  Sunday: {
    morning: [
      { text: 'Newspapers: Prepare papers for display and delivery.', completed: false },
      { text: 'Inventory: Refill drinks and confectionery. Organise back-stock snacks by expiry date.', completed: false },
      { text: 'Dairy: Rotate milk stock. Mark down short-dated dairy and inform management.', completed: false },
      { text: 'Lotto/POS: Update POS posters and Syndicates. Organise "Wrapaway" box.', completed: false },
      { text: 'Maintenance: Broom the shop.', completed: false }
    ],
    evening: [
      { text: 'Admin/Lotto: Receive magazines (cut mastheads). Update exterior Lotto posters. Print and display Syndicates.', completed: false },
      { text: 'Inventory: Check snack inventory by expiry date. Order Scratch-its based on stock.', completed: false },
      { text: 'Cleaning: Dust/wipe stationery, confectionery shelves, and Lotto display.', completed: false },
      { text: 'Refill: Restock fridge, chips, and chocolates. Email Eddie regarding any DARE/Classic expiries.', completed: false }
    ]
  },
};

export const ShiftTaskView = () => {
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>('Monday');
  const [allTasks, setAllTasks] = useState<TaskList>(INITIAL_SHIFT_TASKS);
  const [newTask, setNewTask] = useState('');
  const [activeShift, setActiveShift] = useState<'morning' | 'evening'>('morning');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTasks = async () => {
      setIsLoading(true);
      try {
        const data = await api.getShiftTasks();
        if (data) {
          setAllTasks(data);
        }
      } catch (error) {
        console.error('Failed to fetch shift tasks:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchTasks();
  }, []);

  const saveTasks = async (updatedTasks: TaskList) => {
    try {
      await api.saveShiftTasks(updatedTasks);
    } catch (error) {
      console.error('Failed to save shift tasks:', error);
    }
  };

  const tasks = allTasks[selectedDay];

  const handleAddTask = async () => {
    if (!newTask.trim()) return;
    const updated = {
      ...allTasks,
      [selectedDay]: {
        ...allTasks[selectedDay],
        [activeShift]: [...allTasks[selectedDay][activeShift], { text: newTask.trim(), completed: false }]
      }
    };
    setAllTasks(updated);
    setNewTask('');
    await saveTasks(updated);
  };

  const handleDeleteTask = async (shift: 'morning' | 'evening', index: number) => {
    const updated = {
      ...allTasks,
      [selectedDay]: {
        ...allTasks[selectedDay],
        [shift]: allTasks[selectedDay][shift].filter((_, i) => i !== index)
      }
    };
    setAllTasks(updated);
    await saveTasks(updated);
  };

  const handleToggleTask = async (shift: 'morning' | 'evening', index: number) => {
    const updated = {
      ...allTasks,
      [selectedDay]: {
        ...allTasks[selectedDay],
        [shift]: allTasks[selectedDay][shift].map((t, i) => i === index ? { ...t, completed: !t.completed } : t)
      }
    };
    setAllTasks(updated);
    await saveTasks(updated);
  };

  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editedTask, setEditedTask] = useState('');

  const handleEditTask = async (shift: 'morning' | 'evening', index: number, newText: string) => {
    const updated = {
      ...allTasks,
      [selectedDay]: {
        ...allTasks[selectedDay],
        [shift]: allTasks[selectedDay][shift].map((t, i) => i === index ? { ...t, text: newText } : t)
      }
    };
    setAllTasks(updated);
    setEditingIndex(null);
    await saveTasks(updated);
  };

  const renderTaskItem = (task: Task, shift: 'morning' | 'evening', index: number) => {
    const isEditing = editingIndex === index;
    
    if (isEditing) {
      return (
        <div className="flex items-center gap-2 p-2 rounded-xl bg-white border border-indigo-200">
          <input 
            type="text"
            value={editedTask}
            onChange={(e) => setEditedTask(e.target.value)}
            className="flex-1 px-2 py-1 outline-none text-sm"
          />
          <button onClick={() => handleEditTask(shift, index, editedTask)} className="text-emerald-500"><Save size={16} /></button>
          <button onClick={() => setEditingIndex(null)} className="text-rose-500"><X size={16} /></button>
        </div>
      );
    }

    const colonIndex = task.text.indexOf(':');
    let content;
    if (colonIndex !== -1) {
      const key = task.text.substring(0, colonIndex + 1);
      const value = task.text.substring(colonIndex + 1);
      content = (
        <div>
          <span className="font-bold text-slate-800 dark:text-slate-200">{key}</span>
          <span className="text-slate-600 dark:text-slate-400">{value}</span>
        </div>
      );
    } else {
      content = <span className="text-slate-700 dark:text-slate-300">{task.text}</span>;
    }

    return (
      <div className={cn(
        "flex items-start gap-3 p-3 rounded-xl border shadow-sm group transition-all",
        task.completed 
          ? "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-800/50" 
          : "bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-700/50"
      )}>
        <input
          type="checkbox"
          checked={task.completed}
          onChange={() => handleToggleTask(shift, index)}
          className="mt-1 shrink-0 w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
        />
        <div className="flex-1 cursor-pointer" onClick={() => { setEditingIndex(index); setEditedTask(task.text); }}>
          <div className={cn(task.completed && "line-through text-slate-400 dark:text-slate-500")}>{content}</div>
        </div>
        <button 
          onClick={() => handleDeleteTask(shift, index)}
          className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-indigo-500 transition-all"
        >
          <Trash2 size={14} />
        </button>
      </div>
    );
  };

  return (
    <div className="space-y-2">
      <PageHeader title="Shift Tasks" />

      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      ) : (
        <>
          {/* Day Selector */}
          <div className="flex p-1 glass rounded-xl w-fit overflow-x-auto max-w-full">
            {DAYS_OF_WEEK.map((day) => (
              <button
                key={day}
                onClick={() => setSelectedDay(day)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition-all whitespace-nowrap",
                  selectedDay === day
                    ? "bg-white/50 dark:bg-slate-700/50 text-indigo-600 dark:text-indigo-400 shadow-sm"
                    : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                )}
              >
                <Calendar size={16} />
                {day}
              </button>
            ))}
          </div>

          {/* Add Task Control */}
          <div className="glass p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row gap-3">
            <select 
              value={activeShift}
              onChange={(e) => setActiveShift(e.target.value as 'morning' | 'evening')}
              className="px-4 py-2 glass border border-slate-200 dark:border-slate-700 rounded-xl outline-none font-bold text-sm text-slate-700 dark:text-slate-300"
            >
              <option value="morning">Morning Shift</option>
              <option value="evening">Evening Shift</option>
            </select>
            <input 
              type="text" 
              placeholder="Add a new task (e.g. Cleaning: Mop the floor)"
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddTask()}
              className="flex-1 px-4 py-2 glass border border-slate-200 dark:border-slate-700 rounded-xl outline-none font-medium text-sm text-slate-900 dark:text-white"
            />
            <button 
              onClick={handleAddTask}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20"
            >
              <Plus size={16} />
              Add Task
            </button>
          </div>

          {/* Task Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Morning Shift */}
            <motion.div
              key={`morning-${selectedDay}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="glass-card p-6 shadow-sm"
            >
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                  <Sun size={24} className="text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-white">Morning Shift</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Opening tasks & preparation</p>
                </div>
              </div>

              <div className="space-y-3">
                {tasks.morning.length > 0 ? (
                  tasks.morning.map((task, idx) => (
                    <div key={idx}>{renderTaskItem(task, 'morning', idx)}</div>
                  ))
                ) : (
                  <div className="text-center py-8 text-slate-500 dark:text-slate-400 italic">
                    No tasks configured for {selectedDay} morning.
                  </div>
                )}
              </div>
            </motion.div>

            {/* Evening Shift */}
            <motion.div
              key={`evening-${selectedDay}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              className="glass-card p-6 shadow-sm"
            >
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="w-12 h-12 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                  <Moon size={24} className="text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-white">Evening Shift</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Closing tasks & cleanup</p>
                </div>
              </div>

              <div className="space-y-3">
                {tasks.evening.length > 0 ? (
                  tasks.evening.map((task, idx) => (
                    <div key={idx}>{renderTaskItem(task, 'evening', idx)}</div>
                  ))
                ) : (
                  <div className="text-center py-8 text-slate-500 dark:text-slate-400 italic">
                    No tasks configured for {selectedDay} evening.
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </div>
  );
};

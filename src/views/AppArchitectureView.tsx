import { useState, useRef, useEffect, Fragment } from 'react';
import { motion } from 'motion/react';
import { User, Shield, Lock, Unlock } from 'lucide-react';

const roles = {
  Admin: { color: 'bg-purple-500', tables: ['Employees', 'Timesheets', 'Finance', 'Orders', 'Resources', 'Salary', 'Shifts', 'Transactions', 'Documents', 'Notifications', 'AdminUsers'] },
  'Senior Staff': { color: 'bg-cyan-500', tables: ['Employees', 'Timesheets', 'Finance', 'Orders', 'Resources', 'Shifts', 'Transactions', 'Documents', 'Notifications'] },
  Staff: { color: 'bg-amber-500', tables: ['Employees', 'Timesheets', 'Resources', 'Shifts', 'Notifications'] },
};

const allTables = roles.Admin.tables;

const DataPacket = ({ angle, delay, radius }: { angle: number, delay: number, radius: number }) => (
  <motion.div
    className="absolute w-2 h-2 sm:w-3 sm:h-3 bg-amber-400 rounded-full z-20"
    style={{ top: '50%', left: '50%' }}
    initial={{ x: 0, y: 0, opacity: 0 }}
    animate={{ 
      x: [0, radius * Math.cos(angle)], 
      y: [0, radius * Math.sin(angle)], 
      opacity: [0, 1, 0] 
    }}
    transition={{ duration: 2, repeat: Infinity, delay, ease: "linear" }}
  />
);

export const AppArchitectureView = () => {
  const [role, setRole] = useState<keyof typeof roles>('Admin');
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new ResizeObserver((entries) => {
      for (let entry of entries) {
        setContainerSize({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        });
      }
    });

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }
    return () => observer.disconnect();
  }, []);

  // Calculate radius dynamically, ensuring it fits within the container and leaves space for buttons
  const radius = Math.min(containerSize.width, containerSize.height) * 0.35;

  return (
    <div className="h-screen max-h-[900px] w-full bg-slate-950 rounded-3xl p-4 sm:p-6 md:p-8 border border-slate-800 text-white overflow-hidden relative flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl sm:text-2xl md:text-3xl font-bold">App Architecture</h2>
      </div>

      <div ref={containerRef} className="relative flex-grow flex items-center justify-center">
        {/* Center: User + API Gateway */}
        <div className="absolute flex flex-col items-center gap-1 sm:gap-2 z-30">
          <div className={`w-12 h-12 sm:w-20 sm:h-20 ${roles[role].color} rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(0,0,0,0.5)]`}>
            <User size={24} />
          </div>
          {/* Connection Line */}
          <div className="w-px h-8 bg-slate-600" />
          <div className="w-12 h-12 sm:w-20 sm:h-20 bg-rose-600 rounded-2xl flex items-center justify-center rotate-45 shadow-[0_0_20px_rgba(225,29,72,0.5)]">
            <Shield size={24} className="-rotate-45" />
          </div>
          <span className="font-bold text-xs sm:text-sm">{role} + API</span>
        </div>

        {/* Tables in Circle */}
        {allTables.map((table, index) => {
          const angle = (index / allTables.length) * 2 * Math.PI;
          const x = radius * Math.cos(angle);
          const y = radius * Math.sin(angle);
          const isAccessible = roles[role].tables.includes(table);
          
          return (
            <Fragment key={table}>
              {/* Static Connection Line */}
              <motion.div
                className="absolute h-px bg-slate-700 z-10"
                style={{
                  top: '50%',
                  left: '50%',
                  width: `${radius}px`,
                  transformOrigin: 'left',
                  transform: `rotate(${angle}rad)`
                }}
              />
              
              {/* Table Bubble */}
              <div 
                className={`absolute p-1 sm:p-2 rounded-lg flex items-center gap-1 border w-24 sm:w-32 z-20 ${isAccessible ? 'bg-emerald-900/50 border-emerald-500' : 'bg-slate-800 border-slate-700'}`}
                style={{ transform: `translate(${x}px, ${y}px)` }}
              >
                {isAccessible ? <Unlock size={10} className="text-emerald-400" /> : <Lock size={10} className="text-slate-500" />}
                <span className={`text-[10px] sm:text-xs font-medium ${isAccessible ? 'text-emerald-100' : 'text-slate-500'}`}>{table}</span>
              </div>
            </Fragment>
          );
        })}

        {/* Animated Flow Lines */}
        {allTables.map((table, index) => {
          if (roles[role].tables.includes(table)) {
            const angle = (index / allTables.length) * 2 * Math.PI;
            return <DataPacket key={table} angle={angle} delay={index * 0.15} radius={radius} />;
          }
          return null;
        })}
      </div>

      {/* Role Buttons (Right Side) */}
      <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-2 z-40">
        {(Object.keys(roles) as Array<keyof typeof roles>).map((r) => (
          <button key={r} onClick={() => setRole(r)} className={`px-4 py-2 rounded-full text-sm font-bold transition-colors ${role === r ? roles[r].color + ' text-white' : 'bg-slate-800 text-slate-400'}`}>
            {r}
          </button>
        ))}
      </div>
      
      <div className="absolute bottom-2 left-2 sm:bottom-4 sm:left-4 bg-slate-900/80 p-2 sm:p-4 rounded-xl text-white text-[10px] sm:text-sm backdrop-blur-sm">
        <p className="font-bold mb-0.5">Real-Time Data Flow:</p>
        <p>Amber: API ↔ Database (Accessible Tables Only)</p>
      </div>
    </div>
  );
};

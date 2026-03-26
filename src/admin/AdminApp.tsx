import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { ViewType, AppNotification, AppSettings } from '../types';
import { api } from '../services/api';
import { cn } from '../utils';

import { Toaster } from 'react-hot-toast';

// Components
import { Sidebar } from '../components/Sidebar';
import { Header } from '../components/Header';
import { LoadingOverlay } from '../components/LoadingOverlay';

// Views
import { DashboardView } from '../views/DashboardView';
import { EmployeesView } from '../views/EmployeesView';
import { AdminEmployeesView } from '../views/AdminEmployeesView';
import { FinanceView } from '../views/FinanceView';
import { RosterView } from '../views/RosterView';
import { InstructionView } from '../views/InstructionView';
import { EmployeeProfileView } from '../views/EmployeeProfileView';
import { SettingsView } from '../views/SettingsView';
import { ShiftTaskView } from '../views/ShiftTaskView';
import { ResourcesView } from '../views/ResourcesView';
import { OrderListView } from '../views/OrderListView';
import { SalaryView } from '../views/SalaryView';
import { TimesheetView } from '../views/TimesheetView';
import { MakeRosterView } from '../views/MakeRosterView';
import { LoginView } from '../views/LoginView';
import { FinanceManagementView } from '../views/FinanceManagementView';
import { AnalyticsView } from '../views/AnalyticsView';
import { StaffTimesheetView } from '../views/StaffTimesheetView';
import DocumentsView from '../views/DocumentsView';
import { AppSettingsView } from '../views/AppSettingsView';
import { CustomPageView } from '../views/CustomPageView';
import { ControlStoreView } from '../views/ControlStoreView';

// Contexts
import { SecurityProvider } from '../contexts/SecurityContext';
import { useAuth } from '../contexts/AuthContext';

export const AdminApp = () => {
  const { user, isLoading, isAdmin } = useAuth();
  const [activeView, setActiveView] = useState<ViewType>('Dashboard');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isReloading, setIsReloading] = useState(false);
  
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [toastNotification, setToastNotification] = useState<AppNotification | null>(null);
  const [appSettings, setAppSettings] = useState<AppSettings | null>(null);

  useEffect(() => {
    const savedDarkMode = localStorage.getItem('firestation_darkmode');
    if (savedDarkMode) {
      try {
        setIsDarkMode(JSON.parse(savedDarkMode));
      } catch (e) {
        console.error('Failed to parse saved dark mode:', e);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('firestation_darkmode', JSON.stringify(isDarkMode));
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  useEffect(() => {
    if (!user) return;
    
    api.getNotifications().then(setNotifications).catch(console.error);
    api.getAppSettings().then(setAppSettings).catch(console.error);

    const socket = io();
    
    socket.on('new_notification', (notification: AppNotification) => {
      setNotifications(prev => [notification, ...prev]);
      setToastNotification(notification);
      setTimeout(() => setToastNotification(null), 5000);
    });

    socket.on('app_settings_updated', (settings: AppSettings) => {
      setAppSettings(settings);
    });

    return () => {
      socket.disconnect();
    };
  }, [user]);

  const handleMarkAllRead = async () => {
    try {
      await api.markNotificationsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: 1 })));
    } catch (error) {
      console.error('Failed to mark notifications as read', error);
    }
  };

  const renderViewContent = () => {
    const handleBackToAdmin = () => setActiveView('Admin Hub');
    const restrictedViews: ViewType[] = ['Admin Hub', 'Finance', 'Finance Management', 'Salary', 'Make Roster'];

    if (restrictedViews.includes(activeView) && !isAdmin) {
      return <DashboardView />;
    }

    switch (activeView) {
      case 'Dashboard': return <DashboardView />;
      case 'Analytics': return <AnalyticsView onNavigate={(view) => setActiveView(view)} />;
      case 'Employees': return <EmployeesView onBack={handleBackToAdmin} onViewProfile={(id) => { setSelectedEmployeeId(id); setActiveView('Employee Profile'); }} />;
      case 'Admin Hub': return <AdminEmployeesView setActiveView={setActiveView} />;
      case 'Employee Profile': return selectedEmployeeId ? <EmployeeProfileView employeeId={selectedEmployeeId} onBack={() => setActiveView('Employees')} /> : <EmployeesView onBack={handleBackToAdmin} onViewProfile={(id) => { setSelectedEmployeeId(id); setActiveView('Employee Profile'); }} />;
      case 'Finance': return <FinanceView onBack={handleBackToAdmin} />;
      case 'Finance Management': return <FinanceManagementView onBack={handleBackToAdmin} />;
      case 'Roster': return <RosterView />;
      case 'Shift Task': return <ShiftTaskView />;
      case 'Order List': return <OrderListView />;
      case 'Instruction': return <InstructionView />;
      case 'Resources': return <ResourcesView />;
      case 'Profile': return <EmployeeProfileView employeeId={user?.id || ''} onBack={() => setActiveView('Dashboard')} />;
      case 'Settings': return <SettingsView isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} onBack={handleBackToAdmin} />;
      case 'Salary': return <SalaryView onBack={handleBackToAdmin} />;
      case 'Make Roster': return <MakeRosterView onBack={handleBackToAdmin} />;
      case 'Timesheet': return <TimesheetView onBack={handleBackToAdmin} />;
      case 'Staff Timesheet': return <StaffTimesheetView />;
      case 'Documents': return <DocumentsView />;
      case 'Control Store': return <ControlStoreView />;
      case 'App Settings': return <AppSettingsView onBack={handleBackToAdmin} onUpdate={setAppSettings} />;
      default: return <CustomPageView viewName={activeView} />;
    }
  };

  const handleReload = () => {
    setIsReloading(true);
    setTimeout(() => window.location.reload(), 1000);
  };

  if (isLoading) return <LoadingOverlay />;
  if (!user) return <LoginView />;

  return (
    <SecurityProvider>
      <Toaster position="top-right" />
      <div className={cn("h-[100dvh] flex font-sans transition-colors duration-300", isDarkMode ? "bg-[#0B0F19] text-slate-100" : "bg-[#F5F5DC] text-slate-900")}>
        {isReloading && <LoadingOverlay />}
        <Sidebar 
          activeView={activeView} 
          setActiveView={setActiveView} 
          isMobileOpen={isSidebarOpen} 
          setIsMobileOpen={setIsSidebarOpen}
          isDarkMode={isDarkMode}
          appSettings={appSettings}
        />
        
        <main className="flex-1 overflow-y-auto no-scrollbar flex flex-col">
          <Header 
            isDarkMode={isDarkMode} 
            setIsDarkMode={setIsDarkMode} 
            setIsMobileOpen={setIsSidebarOpen}
            notifications={notifications}
            onMarkAllRead={handleMarkAllRead}
            onReload={handleReload}
            onProfileClick={() => setActiveView('Profile')}
            appSettings={appSettings}
          />
          <div className="p-4 lg:p-8 max-w-7xl mx-auto w-full flex-1">
            {renderViewContent()}
          </div>

          {toastNotification && (
            <div className="fixed bottom-4 right-4 bg-emerald-600 text-white px-6 py-4 rounded-xl shadow-2xl z-50 flex items-center gap-3 animate-in slide-in-from-bottom-5">
              <div className="flex-1">
                <p className="font-bold text-sm">New Notification</p>
                <p className="text-emerald-100 text-xs mt-1">{toastNotification.message}</p>
              </div>
              <button onClick={() => setToastNotification(null)} className="p-1 hover:bg-emerald-700 rounded-lg transition-colors">
                <X size={16} />
              </button>
            </div>
          )}
        </main>
      </div>
    </SecurityProvider>
  );
};

const X = ({ size }: { size: number }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
);

import { supabase } from "../config/supabase.js";
import { safeJsonParse } from "../utils/json.js";
import { emitToAll } from "../services/socketService.js";

export const getAppSettings = async (req: any, res: any) => {
  try {
    let { data, error } = await supabase.from("app_settings").select("*").eq("id", "current").single();
    
    // Get custom pages from resources table
    const { data: resCustomPages } = await supabase.from("resources").select("*").eq("id", "77777777-7777-7777-7777-777777777777").single();
    
    if (error && !data) {
      console.warn("Supabase error fetching app settings:", error.message);
      return res.json({
        id: 'current',
        siteTitle: 'Firestation Newsagency',
        siteIcon: 'Flame',
        sidebarItems: [
          { id: '1', label: 'Dashboard', view: 'Dashboard', icon: 'LayoutDashboard', order: 0, isVisible: true },
          { id: '2', label: 'Roster', view: 'Roster', icon: 'Calendar', order: 1, isVisible: true },
          { id: '3', label: 'Employees', view: 'Employees', icon: 'Users', order: 2, isVisible: true },
          { id: '4', label: 'Finance', view: 'Finance', icon: 'DollarSign', order: 3, isVisible: true },
          { id: '5', label: 'Order List', view: 'Order List', icon: 'ShoppingCart', order: 4, isVisible: true },
          { id: '6', label: 'Resources', view: 'Resources', icon: 'BookOpen', order: 5, isVisible: true },
          { id: '7', label: 'Instructions', view: 'Instruction', icon: 'Info', order: 6, isVisible: true },
          { id: '8', label: 'Documents', view: 'Documents', icon: 'FileText', order: 7, isVisible: true },
          { id: '9', label: 'Analytics', view: 'Analytics', icon: 'BarChart3', order: 8, isVisible: true },
          { id: '10', label: 'Admin Hub', view: 'Admin Hub', icon: 'ShieldCheck', order: 9, isVisible: true }
        ],
        dashboardCards: [
          { id: '1', title: 'Quick Actions', icon: 'Zap', content: 'Access common tasks quickly.', type: 'static', color: 'bg-indigo-500', order: 0, isVisible: true },
          { id: '2', title: 'Recent Sales', icon: 'DollarSign', content: 'View latest sales data.', type: 'static', color: 'bg-emerald-500', order: 1, isVisible: true },
          { id: '3', title: 'Staff on Shift', icon: 'Users', content: 'See who is currently working.', type: 'static', color: 'bg-blue-500', order: 2, isVisible: true }
        ],
        customPages: {}
      });
    }
    
    const parsedSidebar = safeJsonParse(data.sidebar_items, []);
    const parsedCards = safeJsonParse(data.dashboard_cards, []);
    
    let parsedCustomPages = {};
    if (resCustomPages && resCustomPages.fields) {
      parsedCustomPages = safeJsonParse(resCustomPages.fields, {});
    } else if (data.custom_pages_data) {
      parsedCustomPages = safeJsonParse(data.custom_pages_data, {});
    }

    res.json({
      id: data.id,
      siteTitle: data.site_title || 'Firestation Newsagency',
      siteIcon: data.site_icon || 'Flame',
      sidebarItems: parsedSidebar.length > 0 ? parsedSidebar : [],
      dashboardCards: parsedCards.length > 0 ? parsedCards : [],
      customPages: parsedCustomPages
    });
  } catch (err: any) {
    console.error("Critical error fetching app settings:", err);
    res.status(500).json({ error: "Internal Server Error", message: err.message });
  }
};

export const saveAppSettings = async (req: any, res: any) => {
  const { siteTitle, siteIcon, sidebarItems, dashboardCards, customPages } = req.body;
  
  try {
    const { data, error } = await supabase.from("app_settings").upsert({
      id: 'current',
      site_title: siteTitle,
      site_icon: siteIcon,
      sidebar_items: JSON.stringify(sidebarItems),
      dashboard_cards: JSON.stringify(dashboardCards)
    }).select().single();

    if (error) throw error;

    if (customPages) {
      const { error: resError } = await supabase.from("resources").upsert({
        id: '77777777-7777-7777-7777-777777777777',
        category: 'system',
        title: 'SYSTEM_CUSTOM_PAGES',
        fields: JSON.stringify(customPages)
      });
      if (resError) throw resError;
    }
    
    const formatted = {
      id: data.id,
      siteTitle: data.site_title,
      siteIcon: data.site_icon,
      sidebarItems: safeJsonParse(data.sidebar_items, []),
      dashboardCards: safeJsonParse(data.dashboard_cards, []),
      customPages: customPages || {}
    };

    emitToAll('app_settings_updated', formatted);
    res.json(formatted);
  } catch (err: any) {
    console.error("Error saving app settings:", err);
    res.status(500).json({ error: err.message });
  }
};

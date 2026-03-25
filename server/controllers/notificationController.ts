import { supabase } from "../config/supabase.js";

export const getNotifications = async (req: any, res: any) => {
  const { data, error } = await supabase.from("notifications").select("*").order("created_at", { ascending: false }).limit(50);
  if (error) return res.status(500).json({ error: error.message });
  const formatted = (data || []).map((n: any) => ({
    ...n,
    isRead: n.is_read
  }));
  res.json(formatted);
};

export const markNotificationsAsRead = async (req: any, res: any) => {
  const { error } = await supabase.from("notifications").update({ is_read: 1 }).eq("is_read", 0);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
};

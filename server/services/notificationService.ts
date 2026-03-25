import { supabase } from "../config/supabase.js";
import crypto from "crypto";
import { emitToAll } from "./socketService.js";

export const emitNotification = async (message: string, type: string) => {
  const id = crypto.randomUUID();
  const timestamp = new Date().toISOString();
  
  await supabase.from('notifications').insert([{ id, message, type, created_at: timestamp, is_read: 0 }]);
  
  emitToAll('new_notification', { id, message, type, created_at: timestamp, isRead: 0 });
};

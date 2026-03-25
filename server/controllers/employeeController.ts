import { supabase } from "../config/supabase.js";
import crypto from "crypto";
import { emitNotification } from "../services/notificationService.js";

export const getEmployees = async (req: any, res: any) => {
  console.log("GET /api/employees called");
  const { data, error } = await supabase.from("employees").select("*").order("name");
  if (error) {
    console.error("Error fetching employees:", error);
    return res.status(500).json({ error: error.message });
  }
  console.log(`Fetched ${data?.length || 0} employees`);
  const formatted = (data || []).map((e: any) => ({
    ...e,
    staffId: e.staff_id,
    joinedDate: e.joined_date,
    hourlyRate: e.hourly_rate
  }));
  res.json(formatted);
};

export const saveEmployee = async (req: any, res: any) => {
  console.log("Adding/Updating employee:", req.body);
  const { id, staffId, name, role, email, phone, bio, joinedDate, password, hourlyRate } = req.body;
  const { error } = await supabase.from("employees").upsert({ 
    id: id || crypto.randomUUID(), 
    staff_id: staffId, 
    name, 
    role, 
    email, 
    phone, 
    bio, 
    joined_date: joinedDate || new Date().toISOString().split('T')[0], 
    password: password || 'password123',
    hourly_rate: Number(hourlyRate) || 0
  });
  if (error) {
    console.error("Error saving employee:", error);
    return res.status(500).json({ error: error.message });
  }
  
  await emitNotification(`New employee added: ${name}`, 'employee');
  
  res.json({ success: true });
};

export const deleteEmployee = async (req: any, res: any) => {
  console.log("Deleting employee:", req.params.id);
  const { error } = await supabase.from("employees").delete().eq("id", req.params.id);
  if (error) {
    console.error("Error deleting employee:", error);
    return res.status(500).json({ error: error.message });
  }
  res.json({ success: true });
};

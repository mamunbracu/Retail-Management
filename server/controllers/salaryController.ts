import { supabase } from "../config/supabase.js";
import crypto from "crypto";

export const getSalaries = async (req: any, res: any) => {
  // Try ordering by date first, if it fails, try payment_date
  let { data, error } = await supabase.from("salaries").select("*").order("date", { ascending: false });
  
  if (error && (error.message?.includes("does not exist") || error.message?.includes("Could not find"))) {
    const { data: data2, error: error2 } = await supabase.from("salaries").select("*").order("payment_date", { ascending: false });
    data = data2;
    error = error2;
  }

  if (error) return res.status(500).json({ error: error.message });
  
  const formatted = (data || []).map((s: any) => ({
    ...s,
    date: s.date || s.payment_date,
    type: s.type || s.status || 'Paid',
    notes: s.notes || (s.period_start ? `Period: ${s.period_start} to ${s.period_end}` : '')
  }));
  res.json(formatted);
};

export const saveSalary = async (req: any, res: any) => {
  console.log("Received request to save salary:", req.body);
  const { id, employee_id, amount, type, date, notes, staff_name } = req.body;
  
  const basePayload = {
    id: id || crypto.randomUUID(), 
    employee_id, 
    amount: Number(amount) || 0, 
    type, 
    date, 
    notes 
  };
  console.log("Saving salary with basePayload:", basePayload);

  const legacyPayload = {
    id: id || crypto.randomUUID(), 
    employee_id, 
    amount: Number(amount) || 0, 
    status: type, 
    payment_date: date, 
    staff_name: staff_name || 'Employee', // Fallback
    period_start: date,
    period_end: date,
    added_by: 'Admin'
  };

  let { error } = await supabase.from("salaries").upsert(basePayload);
  
  if (error) {
    console.error("Error saving salary (basePayload):", error.message || error);
    if (error.message?.includes("does not exist") || error.message?.includes("Could not find")) {
      const { error: error2 } = await supabase.from("salaries").upsert(legacyPayload);
      error = error2;
      if (error) console.error("Error saving salary (legacyPayload):", error.message || error);
    }
  }

  if (error) {
    console.error("Error saving salary:", error.message || error);
    return res.status(500).json({ error: error.message, details: error.details, hint: error.hint });
  }
  res.json({ success: true });
};

export const deleteSalary = async (req: any, res: any) => {
  const { error } = await supabase.from("salaries").delete().eq("id", req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
};

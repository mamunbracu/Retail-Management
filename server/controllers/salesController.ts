import { supabase } from "../config/supabase.js";
import crypto from "crypto";
import { emitNotification } from "../services/notificationService.js";

export const getSales = async (req: any, res: any) => {
  console.log("GET /api/sales called");
  const { data, error } = await supabase.from("sales").select("*").order("date", { ascending: false });
  if (error) {
    console.error("Error fetching sales:", error);
    return res.status(500).json({ error: error.message });
  }
  console.log(`Fetched ${data?.length || 0} sales records`);
  const formatted = (data || []).map((s: any) => ({
    ...s,
    totalSales: s.total_sales ?? s.amount ?? 0,
    addedBy: s.added_by
  }));
  res.json(formatted);
};

export const saveSale = async (req: any, res: any) => {
  const { id, date, shift, totalSales, addedBy } = req.body;
  
  const basePayload = {
    id: id || crypto.randomUUID(), 
    date, 
    shift, 
    total_sales: Number(totalSales) || 0, 
    added_by: addedBy || 'Admin'
  };

  const legacyPayload = {
    ...basePayload,
    amount: Number(totalSales) || 0,
    item_name: 'Daily Sales',
    quantity: 1
  };

  // Try with legacy columns first
  let { error } = await supabase.from("sales").upsert(legacyPayload);

  if (error) {
    // If a column doesn't exist, try the base payload
    if (error.message?.includes("does not exist") || error.message?.includes("Could not find")) {
      const { error: error2 } = await supabase.from("sales").upsert(basePayload);
      error = error2;
      
      // If base payload fails because of not-null constraint on amount/item_name/quantity
      if (error && error.message?.includes("violates not-null constraint")) {
         // Try combinations of legacy columns
         const { error: errA } = await supabase.from("sales").upsert({ ...basePayload, amount: Number(totalSales) || 0 });
         if (errA) {
           const { error: errB } = await supabase.from("sales").upsert({ ...basePayload, item_name: 'Daily Sales' });
           if (errB) {
             const { error: errC } = await supabase.from("sales").upsert({ ...basePayload, amount: Number(totalSales) || 0, item_name: 'Daily Sales' });
             if (errC) {
               const { error: errD } = await supabase.from("sales").upsert({ ...basePayload, amount: Number(totalSales) || 0, item_name: 'Daily Sales', quantity: 1 });
               error = errD;
             } else error = null;
           } else error = null;
         } else error = null;
      }
    }
  }

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  await emitNotification(`New sales record added by ${addedBy || 'Admin'} for ${shift || 'scheduled'} shift`, 'sale');

  res.json({ success: true });
};

export const deleteSale = async (req: any, res: any) => {
  const { error } = await supabase.from("sales").delete().eq("id", req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
};

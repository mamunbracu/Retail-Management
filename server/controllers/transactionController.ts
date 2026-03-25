import { supabase } from "../config/supabase.js";
import crypto from "crypto";
import { emitNotification } from "../services/notificationService.js";

export const getTransactions = async (req: any, res: any) => {
  const { data, error } = await supabase.from("transactions").select("*").order("date", { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  const formatted = (data || []).map((t: any) => ({
    ...t,
    addedBy: t.added_by,
    category: t.category || 'Other',
    description: t.description || t.item_name || 'Transaction'
  }));
  res.json(formatted);
};

export const saveTransaction = async (req: any, res: any) => {
  const { id, date, description, category, type, amount, addedBy } = req.body;
  
  const basePayload = {
    id: id || crypto.randomUUID(), 
    date, 
    description, 
    category, 
    type, 
    amount: Number(amount) || 0, 
    added_by: addedBy || 'Admin'
  };

  const legacyPayload = {
    ...basePayload,
    item_name: description || 'Transaction',
    quantity: 1
  };

  // Try with legacy columns first
  let { error } = await supabase.from("transactions").upsert(legacyPayload);

  if (error) {
    if (error.message?.includes("does not exist") || error.message?.includes("Could not find")) {
      const { error: error2 } = await supabase.from("transactions").upsert(basePayload);
      error = error2;
      
      let currentPayload = basePayload;
      if (error && (error.message?.includes("does not exist") || error.message?.includes("Could find")) && error.message?.includes("category")) {
         const { category: _, ...payloadWithoutCategory } = basePayload;
         currentPayload = payloadWithoutCategory as any;
         const { error: errorNoCat } = await supabase.from("transactions").upsert(currentPayload);
         error = errorNoCat;
      }
      
      if (error && error.message?.includes("violates not-null constraint")) {
         // Try combinations of legacy columns
         const { error: errA } = await supabase.from("transactions").upsert({ ...currentPayload, item_name: description || 'Transaction' });
         if (errA) {
           const { error: errB } = await supabase.from("transactions").upsert({ ...currentPayload, quantity: 1 });
           if (errB) {
             const { error: errC } = await supabase.from("transactions").upsert({ ...currentPayload, item_name: description || 'Transaction', quantity: 1 });
             error = errC;
           } else error = null;
         } else error = null;
      }
    }
  }

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  await emitNotification(`New transaction added: ${description || 'Transaction'}`, 'transaction');

  res.json({ success: true });
};

export const deleteTransaction = async (req: any, res: any) => {
  const { error } = await supabase.from("transactions").delete().eq("id", req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
};

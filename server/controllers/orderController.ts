import { supabase } from "../config/supabase.js";
import { emitNotification } from "../services/notificationService.js";

export const getOrders = async (req: any, res: any) => {
  const { data, error } = await supabase.from("order_list").select("*");
  if (error) return res.status(500).json({ error: error.message });
  
  const formatted = (data || []).map((o: any) => ({
    ...o,
    orderDay: o.order_day,
    orderedBy: o.ordered_by,
    orderedTime: o.ordered_time,
    deliveryDay: o.delivery_day,
    fields: typeof o.fields === 'string' ? JSON.parse(o.fields) : o.fields
  }));
  res.json(formatted);
};

export const saveOrder = async (req: any, res: any) => {
  const { id, category, orderDay, orderedBy, orderedTime, deliveryDay, fields, itemName, quantity, status } = req.body;
  
  const payload: any = { 
    id, 
    category, 
    order_day: orderDay, 
    ordered_by: orderedBy, 
    ordered_time: orderedTime, 
    delivery_day: deliveryDay, 
    fields: JSON.stringify(fields) 
  };

  // Try with item_name, quantity and status first for compatibility with legacy schemas
  const itemNameValue = itemName || (fields && fields.length > 0 ? fields[0].value : 'N/A') || 'N/A';
  const quantityValue = quantity || 1;
  const statusValue = status || 'Pending';

  const { error: error1 } = await supabase.from("order_list").upsert({ 
    ...payload, 
    item_name: itemNameValue,
    quantity: quantityValue,
    status: statusValue
  });
  
  if (error1) {
    // If error is "column does not exist", retry without item_name/quantity/status
    if (error1.message?.includes("does not exist") || error1.message?.includes("Could not find")) {
      
      const { error: error2 } = await supabase.from("order_list").upsert(payload);
      if (error2) return res.status(500).json({ error: error2.message });
    } else if (error1.message?.includes("violates not-null constraint")) {
      return res.status(500).json({ error: `Database Constraint Error: ${error1.message}. Please use the "Fix SQL" in Settings.` });
    } else {
      return res.status(500).json({ error: error1.message });
    }
  }

  await emitNotification(`New order added by ${orderedBy || 'Admin'} for ${category || 'scheduled'}`, 'order');

  res.json({ success: true });
};

export const deleteOrder = async (req: any, res: any) => {
  const { error } = await supabase.from("order_list").delete().eq("id", req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
};

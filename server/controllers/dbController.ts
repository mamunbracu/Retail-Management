import { supabase } from "../config/supabase.js";

export const getTableData = async (req: any, res: any) => {
  const { table } = req.params;
  const { data, error } = await supabase.from(table).select("*");
  if (error) return res.status(500).json({ error: error.message });
  res.json(data || []);
};

export const updateTableData = async (req: any, res: any) => {
  const { table, id } = req.params;
  const { error } = await supabase.from(table).update(req.body).eq("id", id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
};

export const deleteTableData = async (req: any, res: any) => {
  const { table, id } = req.params;
  const { error } = await supabase.from(table).delete().eq("id", id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
};

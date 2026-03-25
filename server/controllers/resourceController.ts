import { supabase } from "../config/supabase.js";
import { emitNotification } from "../services/notificationService.js";

export const getResources = async (req: any, res: any) => {
  const { data, error } = await supabase.from("resources").select("*").order("category");
  if (error) {
    console.error("Error fetching resources:", error);
    return res.status(500).json({ error: error.message });
  }
  
  const formatted = (data || []).map((r: any) => {
    let parsedFields = r.fields;
    if (typeof r.fields === 'string') {
      try {
        parsedFields = JSON.parse(r.fields);
      } catch (e) {
        console.error("Failed to parse resource fields:", r.fields);
        parsedFields = [];
      }
    }
    return {
      ...r,
      fields: parsedFields
    };
  });
  res.json(formatted);
};

export const saveResource = async (req: any, res: any) => {
  console.log("Adding/Updating resource:", req.body);
  const { id, category, title, fields } = req.body;
  const { error } = await supabase.from("resources").upsert({ 
    id, 
    category, 
    name: title, // Map title to name to satisfy not-null constraint
    title, 
    fields: typeof fields === 'string' ? fields : JSON.stringify(fields) 
  });
  if (error) {
    console.error("Error saving resource:", error);
    return res.status(500).json({ error: error.message, details: error.details, hint: error.hint });
  }

  await emitNotification(`Resource added/updated: ${title}`, 'resource');

  res.json({ success: true });
};

export const deleteResource = async (req: any, res: any) => {
  console.log("Deleting resource:", req.params.id);
  const { error } = await supabase.from("resources").delete().eq("id", req.params.id);
  if (error) {
    console.error("Error deleting resource:", error);
    return res.status(500).json({ error: error.message });
  }
  res.json({ success: true });
};

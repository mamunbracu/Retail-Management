import { supabase } from "../config/supabase.js";
import { emitNotification } from "../services/notificationService.js";

export const getInstructions = async (req: any, res: any) => {
  const { data, error } = await supabase.from("instructions").select("*").order("title");
  if (error) {
    console.error("Error fetching instructions:", error);
    return res.status(500).json({ error: error.message });
  }
  res.json(data || []);
};

export const saveInstruction = async (req: any, res: any) => {
  console.log("Adding/Updating instruction:", req.body);
  const { id, title, content } = req.body;
  const { error } = await supabase.from("instructions").upsert({ id, title, content });
  if (error) {
    console.error("Error saving instruction:", error);
    return res.status(500).json({ error: error.message, details: error.details, hint: error.hint });
  }

  await emitNotification(`Instruction added/updated: ${title}`, 'instruction');

  res.json({ success: true });
};

export const deleteInstruction = async (req: any, res: any) => {
  console.log("Deleting instruction:", req.params.id);
  const { error } = await supabase.from("instructions").delete().eq("id", req.params.id);
  if (error) {
    console.error("Error deleting instruction:", error);
    return res.status(500).json({ error: error.message });
  }
  res.json({ success: true });
};

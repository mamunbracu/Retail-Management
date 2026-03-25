import { supabase } from "../config/supabase.js";
import { safeJsonParse } from "../utils/json.js";

export const getShiftTasks = async (req: any, res: any) => {
  try {
    const { data, error } = await supabase.from("shift_tasks").select("*");
    if (error) return res.status(500).json({ error: error.message });
    
    if (data && data.length > 0) {
      const record = data.find((r: any) => r.id === 'current');
      if (record) {
        return res.json(safeJsonParse(record.tasks, null));
      }
    }
    res.json(null);
  } catch (err: any) {
    console.error("Error in GET /api/shift-tasks:", err);
    res.status(500).json({ error: "Internal Server Error", message: err.message });
  }
};

export const saveShiftTasks = async (req: any, res: any) => {
  const tasks = req.body;
  const { error } = await supabase.from("shift_tasks").upsert({ id: 'current', tasks: JSON.stringify(tasks) });
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
};

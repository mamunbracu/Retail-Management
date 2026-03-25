import { supabase } from "../config/supabase.js";
import { safeJsonParse } from "../utils/json.js";
import { emitNotification } from "../services/notificationService.js";

export const getRoster = async (req: any, res: any) => {
  const start = Date.now();
  console.log("GET /api/roster called");
  try {
    const { data, error } = await supabase.from("roster").select("*");
    if (error) {
      console.error("Supabase error fetching roster:", error);
      return res.status(500).json({ error: error.message });
    }
    console.log(`Fetched ${data?.length || 0} roster records`);
    const formatted = (data || []).map((r: any) => ({
      ...r,
      employeeId: r.employee_id,
      staffName: r.staff_name,
      date: r.date,
      status: r.status,
      startTime: r.start_time,
      endTime: r.end_time,
      hourlyRate: r.hourly_rate,
      repeatNextWeek: r.repeat_next_week,
      isPaid: r.is_paid,
      paidAmount: r.paid_amount,
      isApproved: r.is_approved ? true : false,
      approvedStartTime: r.approved_start_time,
      approvedEndTime: r.approved_end_time,
      approvedBy: r.approved_by,
      tasks: safeJsonParse(r.tasks)
    }));
    const totalTime = Date.now() - start;
    console.log(`GET /api/roster total time: ${totalTime}ms`);
    res.json(formatted);
  } catch (err: any) {
    console.error("Error in GET /api/roster:", err);
    res.status(500).json({ error: "Internal Server Error", message: err.message });
  }
};

export const saveRoster = async (req: any, res: any) => {
  const { 
    id, employeeId, staffName, day, date, status, 
    startTime, endTime, hourlyRate, repeatNextWeek, 
    isPaid, paidAmount, tasks,
    isApproved, approvedStartTime, approvedEndTime, approvedBy
  } = req.body;

  console.log(`POST /api/roster - ID: ${id}, Status: ${status}, isApproved: ${isApproved}`);

  try {
    const updateData: any = { id };
    if (employeeId !== undefined) updateData.employee_id = employeeId;
    if (staffName !== undefined) updateData.staff_name = staffName;
    if (day !== undefined) updateData.day = day;
    if (date !== undefined) updateData.date = date;
    if (status !== undefined) updateData.status = status;
    if (startTime !== undefined) updateData.start_time = startTime;
    if (endTime !== undefined) updateData.end_time = endTime;
    if (hourlyRate !== undefined) updateData.hourly_rate = Number(hourlyRate) || 0;
    if (repeatNextWeek !== undefined) updateData.repeat_next_week = repeatNextWeek ? true : false;
    if (isPaid !== undefined) updateData.is_paid = isPaid ? 1 : 0;
    if (paidAmount !== undefined) updateData.paid_amount = Number(paidAmount) || 0;
    
    if (tasks !== undefined) {
      updateData.tasks = Array.isArray(tasks) ? tasks : [];
    }
    
    if (isApproved !== undefined) updateData.is_approved = isApproved ? 1 : 0;
    if (approvedStartTime !== undefined) updateData.approved_start_time = approvedStartTime;
    if (approvedEndTime !== undefined) updateData.approved_end_time = approvedEndTime;
    if (approvedBy !== undefined) updateData.approved_by = approvedBy;

    const { error } = await supabase.from("roster").upsert(updateData);
    
    if (error) {
      console.error("Supabase error in POST /api/roster:", error);
      return res.status(500).json({ error: error.message });
    }

    await emitNotification(`Shift updated for ${staffName || 'staff'} on ${day || 'scheduled day'}`, 'roster');

    res.json({ success: true });
  } catch (err: any) {
    console.error("Error in POST /api/roster:", err);
    res.status(500).json({ error: "Internal Server Error", message: err.message });
  }
};

export const deleteRoster = async (req: any, res: any) => {
  const { error } = await supabase.from("roster").delete().eq("id", req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
};

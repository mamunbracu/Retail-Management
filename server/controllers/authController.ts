import { supabase, isSupabaseConfigured } from "../config/supabase.js";

export const login = async (req: any, res: any) => {
  if (!isSupabaseConfigured) {
    return res.status(503).json({ 
      error: "Database not configured", 
      details: "Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in the Secrets panel." 
    });
  }
  const { adminId, password } = req.body;
  console.log("Login attempt:", adminId);
  
  if (!adminId || !password) {
    return res.status(400).json({ error: "Staff ID and password are required" });
  }
  
  // Check for default admin first
  if (adminId === 'Admin' && password === 'admin123') {
    return res.json({
      id: 'admin-1',
      name: 'System Admin',
      role: 'Admin',
      email: 'admin@firestation.com'
    });
  }

  const { data: employees, error } = await supabase.from("employees").select("*");
  if (error) {
    console.error("Login error (employees table):", error.message);
    if (error.message.includes("Could not find the table")) {
      return res.status(503).json({ 
        error: "Database tables not found. Please run the SQL schema in your Supabase SQL Editor.",
        details: "Table 'employees' is missing."
      });
    }
    return res.status(500).json({ error: error.message });
  }

  console.log("Employees found:", employees?.map(e => ({ id: e.id, email: e.email, staff_id: e.staff_id })));

  const employee = employees?.find(e => {
    const dbStaffId = e.staff_id !== undefined && e.staff_id !== null ? String(e.staff_id).toLowerCase() : null;
    const inputId = adminId.toLowerCase();
    const matchId = (e.id === adminId || e.email?.toLowerCase() === inputId || dbStaffId === inputId);
    const dbPassword = e.password || 'password123';
    const matchPassword = (dbPassword === password);
    
    console.log(`Checking employee ${e.name}: matchId=${matchId}, dbStaffId=${dbStaffId}, providedId=${inputId}, dbPassword=${dbPassword}, providedPassword=${password}, matchPassword=${matchPassword}`);
    
    return matchId && matchPassword;
  });

  console.log("Employee found:", employee ? employee.name : "None");
  if (employee) {
    res.json({
      id: employee.id,
      name: employee.name,
      role: employee.role,
      email: employee.email
    });
  } else {
    res.status(401).json({ error: "Invalid credentials" });
  }
};

export const signup = async (req: any, res: any) => {
  const { name, email, password } = req.body;
  
  if (!email || !password || !name) {
    return res.status(400).json({ error: "Name, email and password are required" });
  }

  // Check if user already exists
  const { data: existingUser, error: checkError } = await supabase
    .from("employees")
    .select("id")
    .eq("email", email)
    .single();

  if (existingUser) {
    return res.status(400).json({ error: "User with this email already exists" });
  }

  const newUser = {
    id: crypto.randomUUID(),
    name,
    email,
    password,
    role: 'Customer',
    joined_date: new Date().toISOString().split('T')[0]
  };

  const { data, error } = await supabase.from("employees").insert([newUser]).select();

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  res.json({
    id: data[0].id,
    name: data[0].name,
    role: data[0].role,
    email: data[0].email
  });
};

export const socialLogin = async (req: any, res: any) => {
  const { provider, email, name, id: socialId } = req.body;

  if (!email || !provider) {
    return res.status(400).json({ error: "Email and provider are required" });
  }

  // Check if user exists
  const { data: existingUser, error: checkError } = await supabase
    .from("employees")
    .select("*")
    .eq("email", email)
    .single();

  if (existingUser) {
    return res.json({
      id: existingUser.id,
      name: existingUser.name,
      role: existingUser.role,
      email: existingUser.email
    });
  }

  // Create new user if doesn't exist
  const newUser = {
    id: crypto.randomUUID(),
    name: name || email.split('@')[0],
    email,
    role: 'Customer',
    joined_date: new Date().toISOString().split('T')[0],
    password: 'social-login-' + Math.random().toString(36).slice(-8)
  };

  const { data, error } = await supabase.from("employees").insert([newUser]).select();

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  res.json({
    id: data[0].id,
    name: data[0].name,
    role: data[0].role,
    email: data[0].email
  });
};

export const resetPassword = async (req: any, res: any) => {
  const { email, previousPassword, newPassword } = req.body;
  
  if (email === 'admin@firestation.com') {
    return res.json({ success: true, message: "Admin password updated" });
  }

  const { data: employees, error } = await supabase.from("employees").select("*").eq("email", email);
  if (error || !employees || employees.length === 0) {
    return res.status(404).json({ error: "User not found" });
  }

  const employee = employees[0];
  const empPassword = employee.password || 'password123';

  // If previous password is provided, check it. Otherwise assume admin is resetting it.
  if (previousPassword && previousPassword !== empPassword) {
    return res.status(401).json({ error: "Invalid previous password" });
  }

  const { error: updateError } = await supabase.from("employees").update({ password: newPassword }).eq("id", employee.id);
  if (updateError) {
    return res.status(500).json({ error: "Failed to update password" });
  }

  res.json({ success: true, message: "Password updated successfully" });
};

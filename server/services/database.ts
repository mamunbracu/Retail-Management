import { supabase, isSupabaseConfigured } from "../config/supabase.js";
import { INITIAL_INSTRUCTIONS } from "../../src/constants.ts";

// Fix schema to ensure all IDs and foreign keys are TEXT instead of UUID
export async function fixSchema() {
  console.log("Checking and fixing schema...");
  // Removed the console logs that were confusing the user
}

export async function seedDatabase(force = false) {
  if (!isSupabaseConfigured) {
    console.warn("[SEED] Skipping database seeding: Supabase not configured.");
    return;
  }
  console.log(`[SEED] Checking if database needs seeding (force=${force})...`);
  try {
    // Check if tables exist first
    const { error: tableError } = await supabase.from("employees").select("count", { count: 'exact', head: true });
    if (tableError && tableError.message.includes("Could not find the table")) {
      console.error("[SEED] CRITICAL: Database tables are missing. Please run the SQL schema in your Supabase SQL Editor.");
      return;
    }

    // Check employees
    const { data: existingEmps, error: empError } = await supabase.from("employees").select("name");
    if (empError) {
      console.error("[SEED] Error checking employees:", empError.message);
    }
    const existingNames = existingEmps?.map(e => e.name) || [];
    console.log(`[SEED] Found ${existingNames.length} existing employees.`);
    
    const initialEmployees = [
      { id: '11111111-1111-1111-1111-111111111111', staff_id: '1234', name: 'Admin', role: 'Manager', email: 'admin@firestation.com', phone: '000', bio: 'System Administrator', joined_date: '2023-01-01', hourly_rate: 50, password: 'admin123' },
      { id: '22222222-2222-2222-2222-222222222222', staff_id: '1001', name: 'Mamun', role: 'Manager', email: 'mamun@firestation.com', phone: '0400 111 222', bio: 'Expert manager.', joined_date: '2023-01-15', hourly_rate: 45 },
      { id: '33333333-3333-3333-3333-333333333333', staff_id: '1002', name: 'Sazzad', role: 'Senior Staff', email: 'sazzad@firestation.com', phone: '0400 333 444', bio: 'Inventory specialist.', joined_date: '2023-03-20', hourly_rate: 35 },
      { id: '44444444-4444-4444-4444-444444444444', staff_id: '1003', name: 'Ruba', role: 'Staff', email: 'ruba@firestation.com', phone: '0400 555 666', bio: 'Customer service expert.', joined_date: '2023-06-10', hourly_rate: 30 },
      { id: '55555555-5555-5555-5555-555555555555', staff_id: '1004', name: 'Akash', role: 'Staff', email: 'akash@firestation.com', phone: '0400 777 888', bio: 'Reliable staff member.', joined_date: '2023-08-05', hourly_rate: 28 },
      { id: '66666666-6666-6666-6666-666666666666', staff_id: '1005', name: 'Thasin', role: 'Staff', email: 'thasin@firestation.com', phone: '0400 999 000', bio: 'Hardworking and dedicated.', joined_date: '2023-10-12', hourly_rate: 28 },
      { id: '77777777-7777-7777-7777-777777777777', staff_id: '1006', name: 'Ankon', role: 'Staff', email: 'ankon@firestation.com', phone: '0400 222 333', bio: 'Great team player.', joined_date: '2024-01-20', hourly_rate: 28 }
    ];

    for (const emp of initialEmployees) {
      if (!existingNames.includes(emp.name) || force) {
        console.log(`Seeding employee: ${emp.name}`);
        const { error } = await supabase.from("employees").upsert([{
          id: emp.id,
          staff_id: emp.staff_id,
          name: emp.name,
          role: emp.role,
          email: emp.email,
          phone: emp.phone,
          bio: emp.bio,
          joined_date: emp.joined_date,
          hourly_rate: emp.hourly_rate,
          password: emp.password || 'password123'
        }]);
        if (error) console.error(`Failed to seed employee ${emp.name}:`, error.message);
      }
    }

    // Check instructions
    const { data: existingInst, error: instError } = await supabase.from("instructions").select("title");
    if (instError) {
      console.error("Error checking instructions:", instError.message);
    }
    const existingTitles = existingInst?.map(i => i.title) || [];
    console.log(`Found ${existingTitles.length} existing instructions.`);
    
    for (const inst of INITIAL_INSTRUCTIONS) {
      if (!existingTitles.includes(inst.title) || force) {
        console.log(`Seeding instruction: ${inst.title}`);
        const { error } = await supabase.from("instructions").upsert([inst]);
        if (error) {
          if (error.message.includes("column") || error.message.includes("schema cache")) {
            console.warn(`Skipping highlight for instruction ${inst.title} due to schema mismatch.`);
            const { highlight, ...instWithoutHighlight } = inst;
            const { error: retryError } = await supabase.from("instructions").upsert([instWithoutHighlight]);
            if (retryError) console.error(`Failed to seed instruction ${inst.title} even without highlight:`, retryError.message);
          } else {
            console.error(`Failed to seed instruction ${inst.title}:`, error.message);
          }
        }
      }
    }

    // Check resources
    let existingResTitles: string[] = [];
    try {
      const { data: existingRes, error: resError } = await supabase.from("resources").select("title");
      if (resError) {
        console.warn("Error checking resources (schema mismatch?):", resError.message);
      } else {
        existingResTitles = existingRes?.map(r => r.title) || [];
        console.log(`Found ${existingResTitles.length} existing resources.`);
      }
    } catch (e) {
      console.warn("Failed to check resources table:", e);
    }

    const initialResources = [
      { id: '88888888-8888-8888-8888-888888888888', category: 'Contact', title: 'Emergency Contacts', fields: JSON.stringify([{ label: 'Police/Fire/Ambulance', value: '000' }, { label: 'Manager (Mamun)', value: '0400 111 222' }, { label: 'Security Co', value: '1300 000 000' }]) },
      { id: '99999999-9999-9999-9999-999999999999', category: 'Supplier', title: 'Milk Supplier', fields: JSON.stringify([{ label: 'Name', value: 'Dairy Fresh' }, { label: 'Phone', value: '1800 MILK' }, { label: 'Account No', value: 'FSN-998' }]) },
      { id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', category: 'Supplier', title: 'Bonfect', fields: JSON.stringify([{ label: 'Contact', value: 'Sarah' }, { label: 'Phone', value: '0411 222 333' }, { label: 'Order Day', value: 'Tuesday' }]) },
      { id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', category: 'Supplier', title: 'IPS (Magazines)', fields: JSON.stringify([{ label: 'Phone', value: '1300 300 477' }, { label: 'Account', value: '100234' }]) },
      { id: 'cccccccc-cccc-cccc-cccc-cccccccccccc', category: 'Supplier', title: 'Gordon & Gotch', fields: JSON.stringify([{ label: 'Phone', value: '1300 650 666' }, { label: 'Account', value: 'G-7782' }]) },
      { id: 'dddddddd-dddd-dddd-dddd-dddddddddddd', category: 'Links', title: 'Lotto Portal', fields: JSON.stringify([{ label: 'URL', value: 'https://retailer.thelott.com' }, { label: 'Support', value: '131 868' }]) },
      { id: 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', category: 'password', title: 'Uber Eats Tablet', fields: JSON.stringify([{ label: 'Username', value: 'firestation_news' }, { label: 'Password', value: 'Fire@2026' }]) },
      { id: 'ffffffff-ffff-ffff-ffff-ffffffffffff', category: 'password', title: 'Menulog Tablet', fields: JSON.stringify([{ label: 'Username', value: 'firestation_ml' }, { label: 'Password', value: 'Menu#8899' }]) },
      { id: '00000000-1111-2222-3333-444444444444', category: 'password', title: 'DoorDash Tablet', fields: JSON.stringify([{ label: 'Username', value: 'firestation_dd' }, { label: 'Password', value: 'Dash!1122' }]) },
      { id: '11111111-2222-3333-4444-555555555555', category: 'password', title: 'Lotto Terminal', fields: JSON.stringify([{ label: 'Admin PIN', value: '8877' }, { label: 'Manager PIN', value: '1234' }]) }
    ];

    if (existingResTitles.length >= 0) {
      for (const res of initialResources) {
        if (!existingResTitles.includes(res.title) || force) {
          console.log(`Seeding resource: ${res.title}`);
          const { error } = await supabase.from("resources").upsert([res]);
          if (error) {
            if (error.message.includes("column") || error.message.includes("schema cache")) {
              console.warn(`Skipping seeding resource ${res.title} due to schema mismatch. Please run Fix SQL.`);
              continue; // Skip this one but try the next
            } else {
              console.error(`Failed to seed resource ${res.title}:`, error.message);
            }
          }
        }
      }
    }

    // Check shift tasks
    const { count: taskCount, error: taskError } = await supabase.from("shift_tasks").select("*", { count: 'exact', head: true });
    console.log(`Found ${taskCount} existing shift task records.`);
    if (taskError) {
      console.warn("Could not check shift_tasks table:", taskError.message);
    } else if (taskCount === 0) {
      console.log("Seeding shift tasks...");
      const initialTasks = {
        Monday: { morning: ['Uber Eats/Menulog Login', 'Check milk expiry', 'Refill fridge', 'Check pie warmer water'], evening: ['Clean coffee machine', 'Mop floor', 'Tidy magazine section'] },
        Tuesday: { morning: ['Uber Eats/Menulog Login', 'Receive milk delivery', 'Order Bonfect', 'Refill slushy'], evening: ['Organise magazines', 'Clean store', 'Check Lotto forms'] },
        Wednesday: { morning: ['Uber Eats/Menulog Login', 'Refill Scratch-its', 'Check drink expiry', 'Dust shelves'], evening: ['Rotate milk', 'Manage food', 'Sweep shop'] },
        Thursday: { morning: ['Uber Eats/Menulog Login', 'Process newspaper returns', 'Dust shelves', 'Refill confectionery'], evening: ['Refill confectionery', 'Take out bins', 'Tidy counter'] },
        Friday: { morning: ['Uber Eats/Menulog Login', 'Place milk order', 'Settle Lotto', 'Check pie warmer'], evening: ['Refill coffee beans', 'Mop store', 'Clean slushy machine'] },
        Saturday: { morning: ['Uber Eats/Menulog Login', 'Prepare newspapers', 'Receive milk', 'Refill drinks'], evening: ['Place tobacco orders', 'Clean shop', 'Tidy cards section'] },
        Sunday: { morning: ['Uber Eats/Menulog Login', 'Prepare papers', 'Refill drinks', 'Check Scratch-its'], evening: ['Update Lotto posters', 'Restock fridge', 'Mop floor'] }
      };
      const { error } = await supabase.from("shift_tasks").insert([{ id: 'current', tasks: JSON.stringify(initialTasks) }]);
      if (error) console.error("Failed to seed shift tasks:", error.message);
    }

    // Check sales
    const { count: salesCount, error: salesError } = await supabase.from("sales").select("*", { count: 'exact', head: true });
    if (salesError) {
      console.warn("Could not check sales table:", salesError.message);
    } else if (salesCount === 0) {
      console.log("Seeding sales...");
      const { error: seedError } = await supabase.from("sales").insert([
        { id: 'sale1', date: new Date().toISOString().split('T')[0], shift: 'Morning', total_sales: 1250.50, added_by: 'Sazzad', amount: 1250.50, item_name: 'Daily Sales', quantity: 1 },
        { id: 'sale2', date: new Date().toISOString().split('T')[0], shift: 'Evening', total_sales: 1450.75, added_by: 'Ruba', amount: 1450.75, item_name: 'Daily Sales', quantity: 1 }
      ]);
      
      if (seedError) {
        // Fallback if legacy columns don't exist
        await supabase.from("sales").insert([
          { id: 'sale1', date: new Date().toISOString().split('T')[0], shift: 'Morning', total_sales: 1250.50, added_by: 'Sazzad' },
          { id: 'sale2', date: new Date().toISOString().split('T')[0], shift: 'Evening', total_sales: 1450.75, added_by: 'Ruba' }
        ]);
      }
    }

    // Check transactions
    const { count: transCount, error: transError } = await supabase.from("transactions").select("*", { count: 'exact', head: true });
    if (transError) {
      console.warn("Could not check transactions table:", transError.message);
    } else if (transCount === 0) {
      console.log("Seeding transactions...");
      const { error: seedError } = await supabase.from("transactions").insert([
        { id: 'trans1', date: new Date().toISOString().split('T')[0], type: 'expense', category: 'Stock', amount: 450.00, description: 'Bonfect Order', added_by: 'Sazzad', item_name: 'Bonfect Order', quantity: 1 },
        { id: 'trans2', date: new Date().toISOString().split('T')[0], type: 'income', category: 'Other', amount: 50.00, description: 'ATM Rental', added_by: 'Ruba', item_name: 'ATM Rental', quantity: 1 }
      ]);
      
      if (seedError) {
        // Fallback if legacy columns don't exist
        const { error: fallbackError } = await supabase.from("transactions").insert([
          { id: 'trans1', date: new Date().toISOString().split('T')[0], type: 'expense', category: 'Stock', amount: 450.00, description: 'Bonfect Order', added_by: 'Sazzad' },
          { id: 'trans2', date: new Date().toISOString().split('T')[0], type: 'income', category: 'Other', amount: 50.00, description: 'ATM Rental', added_by: 'Ruba' }
        ]);
        
        if (fallbackError && (fallbackError.message?.includes("does not exist") || fallbackError.message?.includes("Could not find")) && fallbackError.message?.includes("category")) {
           await supabase.from("transactions").insert([
             { id: 'trans1', date: new Date().toISOString().split('T')[0], type: 'expense', amount: 450.00, description: 'Bonfect Order', added_by: 'Sazzad', item_name: 'Bonfect Order', quantity: 1 },
             { id: 'trans2', date: new Date().toISOString().split('T')[0], type: 'income', amount: 50.00, description: 'ATM Rental', added_by: 'Ruba', item_name: 'ATM Rental', quantity: 1 }
           ]);
        }
      }
    }

    // Check order_list
    const { count: orderCount, error: orderError } = await supabase.from("order_list").select("*", { count: 'exact', head: true });
    if (orderError) {
      console.warn("Could not check order_list table:", orderError.message);
    } else if (orderCount === 0) {
      console.log("Seeding order list...");
      await supabase.from("order_list").insert([
        { 
          id: 'order1', 
          category: 'Tobacco', 
          order_day: 'Monday', 
          ordered_by: 'Mamun', 
          ordered_time: '10:00', 
          delivery_day: 'Tuesday', 
          fields: JSON.stringify([{ label: 'Winfield Blue 25s', value: '10' }, { label: 'JPS Red 20s', value: '5' }]) 
        }
      ]);
    }

    // Check salaries
    const { count: salariesCount, error: salariesError } = await supabase.from("salaries").select("*", { count: 'exact', head: true });
    if (salariesError) {
      console.warn("Could not check salaries table:", salariesError.message);
    } else if (salariesCount === 0) {
      console.log("Seeding salaries...");
      await supabase.from("salaries").insert([
        { 
          id: 'sal1', 
          employee_id: 'emp1', 
          staff_name: 'Mamun', 
          date: new Date().toISOString().split('T')[0], 
          amount: 1500.00, 
          type: 'Paid',
          notes: 'Regular salary'
        }
      ]);
    }

    // Check app_settings
    const { count: settingsCount, error: settingsError } = await supabase.from("app_settings").select("*", { count: 'exact', head: true });
    if (settingsError) {
      if (!settingsError.message.includes("Could not find the table")) {
        console.warn("Could not check app_settings table:", settingsError.message);
      }
    } else if (settingsCount === 0) {
      console.log("Seeding app settings...");
      const initialSidebarItems = [
        { id: '1', label: 'Dashboard', view: 'Dashboard', icon: 'LayoutDashboard', order: 0, isVisible: true },
        { id: '2', label: 'Roster', view: 'Roster', icon: 'Calendar', order: 1, isVisible: true },
        { id: '3', label: 'Employees', view: 'Employees', icon: 'Users', order: 2, isVisible: true },
        { id: '4', label: 'Finance', view: 'Finance', icon: 'DollarSign', order: 3, isVisible: true },
        { id: '5', label: 'Order List', view: 'Order List', icon: 'ShoppingCart', order: 4, isVisible: true },
        { id: '6', label: 'Resources', view: 'Resources', icon: 'BookOpen', order: 5, isVisible: true },
        { id: '7', label: 'Instructions', view: 'Instruction', icon: 'Info', order: 6, isVisible: true },
        { id: '8', label: 'Documents', view: 'Documents', icon: 'FileText', order: 7, isVisible: true },
        { id: '9', label: 'Admin Hub', view: 'Admin Hub', icon: 'ShieldCheck', order: 8, isVisible: true }
      ];
      const initialDashboardCards = [
        { id: '1', title: 'Quick Actions', icon: 'Zap', content: 'Access common tasks quickly.', type: 'static', color: 'bg-indigo-500', order: 0, isVisible: true },
        { id: '2', title: 'Recent Sales', icon: 'DollarSign', content: 'View latest sales data.', type: 'static', color: 'bg-emerald-500', order: 1, isVisible: true },
        { id: '3', title: 'Staff on Shift', icon: 'Users', content: 'See who is currently working.', type: 'static', color: 'bg-blue-500', order: 2, isVisible: true }
      ];
      await supabase.from("app_settings").insert([
        { 
          id: 'current', 
          site_title: 'Firestation Newsagency', 
          site_icon: 'Flame',
          sidebar_items: JSON.stringify(initialSidebarItems),
          dashboard_cards: JSON.stringify(initialDashboardCards)
        }
      ]);
    }
  } catch (err) {
    console.error("Unexpected error during seeding:", err);
  }
}

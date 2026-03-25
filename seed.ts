import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import { INITIAL_INSTRUCTIONS } from "./src/constants.ts";

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "";
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || "";

if (!supabaseUrl || !supabaseKey) {
  console.error("CRITICAL: Supabase credentials missing.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function seed() {
  console.log("Starting database seeding...");

  const initialEmployees = [
    { id: '11111111-1111-1111-1111-111111111111', staff_id: '1234', name: 'Admin', role: 'Manager', email: 'admin@firestation.com', phone: '000', bio: 'System Administrator', joined_date: '2023-01-01', hourly_rate: 50, password: 'admin123' },
    { id: '22222222-2222-2222-2222-222222222222', staff_id: '1001', name: 'Mamun', role: 'Manager', email: 'mamun@firestation.com', phone: '0400 111 222', bio: 'Expert manager.', joined_date: '2023-01-15', hourly_rate: 45 },
    { id: '33333333-3333-3333-3333-333333333333', staff_id: '1002', name: 'Sazzad', role: 'Senior Staff', email: 'sazzad@firestation.com', phone: '0400 333 444', bio: 'Inventory specialist.', joined_date: '2023-03-20', hourly_rate: 35 },
    { id: '44444444-4444-4444-4444-444444444444', staff_id: '1003', name: 'Ruba', role: 'Staff', email: 'ruba@firestation.com', phone: '0400 555 666', bio: 'Customer service expert.', joined_date: '2023-06-10', hourly_rate: 30 },
    { id: '55555555-5555-5555-5555-555555555555', staff_id: '1004', name: 'Akash', role: 'Staff', email: 'akash@firestation.com', phone: '0400 777 888', bio: 'Reliable staff member.', joined_date: '2023-08-05', hourly_rate: 28 },
    { id: '66666666-6666-6666-6666-666666666666', staff_id: '1005', name: 'Thasin', role: 'Staff', email: 'thasin@firestation.com', phone: '0400 999 000', bio: 'Hardworking and dedicated.', joined_date: '2023-10-12', hourly_rate: 28 },
    { id: '77777777-7777-7777-7777-777777777777', staff_id: '1006', name: 'Ankon', role: 'Staff', email: 'ankon@firestation.com', phone: '0400 222 333', bio: 'Great team player.', joined_date: '2024-01-20', hourly_rate: 28 }
  ];

  console.log("Seeding employees...");
  for (const emp of initialEmployees) {
    const { error } = await supabase.from("employees").upsert([{
      ...emp,
      password: emp.password || 'password123'
    }]);
    if (error) console.error(`Failed to seed employee ${emp.name}:`, error.message);
  }

  console.log("Seeding instructions...");
  for (const inst of INITIAL_INSTRUCTIONS) {
    const { error } = await supabase.from("instructions").upsert([inst]);
    if (error) console.error(`Failed to seed instruction ${inst.title}:`, error.message);
  }

  const initialResources = [
    { id: '88888888-8888-8888-8888-888888888888', category: 'Contact', title: 'Emergency Contacts', fields: JSON.stringify([{ label: 'Police/Fire/Ambulance', value: '000' }, { label: 'Manager (Mamun)', value: '0400 111 222' }, { label: 'Security Co', value: '1300 000 000' }]) },
    { id: '99999999-9999-9999-9999-999999999999', category: 'Supplier', title: 'Milk Supplier', fields: JSON.stringify([{ label: 'Name', value: 'Dairy Fresh' }, { label: 'Phone', value: '1800 MILK' }, { label: 'Account No', value: 'FSN-998' }]) },
    { id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', category: 'Supplier', title: 'Bonfect', fields: JSON.stringify([{ label: 'Contact', value: 'Sarah' }, { label: 'Phone', value: '0411 222 333' }, { label: 'Order Day', value: 'Tuesday' }]) }
  ];

  console.log("Seeding resources...");
  for (const res of initialResources) {
    const { error } = await supabase.from("resources").upsert([res]);
    if (error) console.error(`Failed to seed resource ${res.title}:`, error.message);
  }

  console.log("Seeding sales...");
  await supabase.from("sales").upsert([
    { id: 'sale1', date: new Date().toISOString().split('T')[0], shift: 'Morning', total_sales: 1250.50, added_by: 'Sazzad' },
    { id: 'sale2', date: new Date().toISOString().split('T')[0], shift: 'Evening', total_sales: 1450.75, added_by: 'Ruba' }
  ]);

  console.log("Seeding transactions...");
  await supabase.from("transactions").upsert([
    { id: 'trans1', date: new Date().toISOString().split('T')[0], type: 'expense', category: 'Stock', amount: 450.00, description: 'Bonfect Order', added_by: 'Sazzad' },
    { id: 'trans2', date: new Date().toISOString().split('T')[0], type: 'income', category: 'Other', amount: 50.00, description: 'ATM Rental', added_by: 'Ruba' }
  ]);

  console.log("Seeding shift tasks...");
  const initialTasks = {
    Monday: { morning: ['Uber Eats/Menulog Login', 'Check milk expiry'], evening: ['Clean coffee machine'] },
    Tuesday: { morning: ['Uber Eats/Menulog Login', 'Receive milk delivery'], evening: ['Organise magazines'] },
    Wednesday: { morning: ['Uber Eats/Menulog Login'], evening: ['Rotate milk'] },
    Thursday: { morning: ['Uber Eats/Menulog Login'], evening: ['Tidy counter'] },
    Friday: { morning: ['Uber Eats/Menulog Login'], evening: ['Mop store'] },
    Saturday: { morning: ['Uber Eats/Menulog Login'], evening: ['Clean shop'] },
    Sunday: { morning: ['Uber Eats/Menulog Login'], evening: ['Restock fridge'] }
  };
  await supabase.from("shift_tasks").upsert([{ id: 'current', tasks: JSON.stringify(initialTasks) }]);

  console.log("Database seeding completed.");
}

seed().catch(console.error);

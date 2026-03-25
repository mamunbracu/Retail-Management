import { DayOfWeek, InstructionCard } from './types';

export const STAFF_NAMES = ['Sazzad', 'Mamun', 'Akash', 'Ankon', 'Ruba', 'Thasin'];

export const DAYS_OF_WEEK: DayOfWeek[] = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday'
];

export const COLORS = {
  primary: '#FF6347', // Tomato
  secondary: '#0B0F19', // Dark Blue/Black
  accent: '#F5F5DC', // Beige
};

export const INITIAL_INSTRUCTIONS: InstructionCard[] = [
  {
    id: '11111111-aaaa-bbbb-cccc-111111111111',
    title: 'Digital & Delivery Logins',
    highlight: 'danger',
    content: `Keep these secure. Access tablets as soon as the shift starts.

Uber Eats
Username: lemon-270959@ubereats.com
Password: 6a2cc438
Account #: 0293601251
Support: 1800 839 157
`
  },
    {
    id: '22222222-aaaa-bbbb-cccc-222222222222',
    title: 'Digital & Delivery Logins',
    highlight: 'danger',
    content: `Keep these secure. Access tablets as soon as the shift starts.


Menulog
Tablet Login: 11075109 | Password: 371167462
Account PIN: 5170
Partner Center: jamesapugomes@yahoo.com | Password: Firenews179
Support: +61 1300 664 335`
  },
  {
    id: '33333333-aaaa-bbbb-cccc-333333333333',
    title: '🛠️ General Shift Tasks (Every Shift)',
    highlight: 'success',
    content: `These tasks should be performed continuously to keep the shop welcoming.

Customer Service: Always greet customers. Wish them luck after every Lotto sale!

Coffee & Food:
Clean the coffee machine and refill milk.
Check water levels in the pie warmer.
Refill the slushy machine.

`
  },
  {
      id: '44444444-aaaa-bbbb-cccc-444444444444',
      title: '🛠️ General Shift Tasks (Every Shift)',
       highlight: 'normal',
      content: `These tasks should be performed continuously to keep the shop welcoming.
      Floor & Shelves:
Refill drinks and confectionery.
Tidy the magazine, card section, and stationery.
Refill Scratch-its stock.
Sweep the shop (mop if necessary).`},
{
      id: '55555555-aaaa-bbbb-cccc-555555555555',
      title: '🖥️ System Instructions (XChangeIT & Customers)',
       highlight: 'normal',
      content: `These tasks should be performed continuously to keep the shop welcoming.
     
Admin/Lotto:
Check Lotto table forms/supplies.
Review the current POS plan.
Keep the counter space tidy for the next co-worker.`
  },
{
      id: '66666666-aaaa-bbbb-cccc-666666666666',
      title: '🖥️ System Instructions ( Customers)',
       highlight: 'normal',
      content: `These tasks should be performed continuously to keep the shop welcoming.
     
Managing Customer Accounts
Adding a New Customer: Customers → Customer Maintenance → New. Enter details. Under Other Options, set credit limits if needed. Click Save.
.`
  },
  {
      id: '77777777-aaaa-bbbb-cccc-777777777777',
      title: '🖥️ System Instructions (XChangeIT & Customers)',
       highlight: 'normal',
      content: `Technical process.
     
 
 Adding Papers/Magazines to Account
Go to Customers → Customer Orders.
Search for the Customer and click Edit.
Right-click a blank line and select Append Line to Orders.
Select Publication, Round, and Delivery Scale.
For Magazines: Search by name in the Schedule box.
Select "Keep" or "Put away" for shop pickups.
Ensure "Charge Publication/Delivery" is ticked (or unticked if they pay cash at pickup).
Click Save.`
  },
  {
    id: '88888888-aaaa-bbbb-cccc-888888888888',
    title: '🖥️ System Instructions (XChangeIT & Customers)',
    highlight: 'normal',
    content: `1. Processing DDO / DD2 Files
Method A (Direct): Main Menu → Stock Systems → XChangeIT → Select XChangeIT in Service Provider → Find → Process Data.
Method B (Stock Received): Main Menu → Stock Received → Green Tab Check New → Load invoices → Process via Quick Invoice.

 Invoicing XChangeIT EDI Files
Go to Stock Systems → Stock Received → Convert XChangeIT EDI tab.
Select Creditor (e.g., GG, IPS). Click Refresh.
Double-click the invoice. Click Code for history.
F10: Subagent changes. F5: Subagent history. F2: Change label type (set to 'N' if no labels needed).
Finalise: Click Update Invoice → Tick Adjust allocation → Process → Update.
`
  },
  {
    id: '99999999-aaaa-bbbb-cccc-999999999999',
    title: '⏰ Operating Hours',
    highlight: 'warning',
    content: `Day Hours
Mon – Thu 7:00 AM – 10:00 PM
Fri – Sat 7:00 AM – 11:00 PM
Sunday 7:00 AM – 10:00 PM

Firestation Newsagency Contact: 02936012521`
  }
];

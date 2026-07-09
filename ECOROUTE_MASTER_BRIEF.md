# ECOROUTE MASTER DEVELOPMENT DECK & ARCHITECTURE BRIEF

## 1. EXECUTIVE PROJECT OVERVIEW
EcoRoute (`ecoroute.stims.co.za`) is an enterprise-grade full-stack logistics carbon emissions tracking, audit, and reporting dashboard application tailored for corporate fleet compliance. 

### Critical Infrastructure Context:
The production third-party service (Carbon Interface) features a broken backend transactional mail server that silently fails with generic 500 errors during email confirmation or password resend attempts. To unblock development, EcoRoute decouples completely from their live infrastructure and maps to a high-fidelity local API simulation engine paired with an independent cloud data persistence layer.

---

## 2. SYSTEM ARCHITECTURE & ENVIRONMENT HOOKS
The system runs on two distinct localized servers communicating across cross-origin boundaries via explicit environmental parameters:

- **Frontend App**: Next.js App Router running on `http://localhost:3000`
- **Mock Server Engine**: Standalone Node.js Express App running on `http://localhost:4000`
- **Database Engine**: Supabase (PostgreSQL Cloud Instance + Built-in Go-Auth services)

### Frontend Configuration Profile (`.env.local`):
```env
CARBON_INTERFACE_URL=http://localhost:4000/api/v1/estimates
CARBON_INTERFACE_KEY=mock_secret_api_key_abc123
NEXT_PUBLIC_SUPABASE_URL=https://supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpX...
```

---

## 3. SUPABASE CLOUD DATABASE LAYOUT (SQL SEED)
The database utilizes strict PostgreSQL constraints and custom relational mapping rules. To prevent breaking historical data dependencies on analytics charts or compiled compliance certificates, **Soft Deletion** is strictly enforced via an `is_active` boolean switch flag.

```sql
-- Profile Repository linking directly to Supabase Auth UUID strings
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  name text not null,
  surname text not null,
  company text not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Custom Corporate Fleet Asset Table with Multi-Column Unique Index Constraints
create table user_vehicles (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  make text not null,
  model text not null,
  year integer not null,
  registration_number text not null,
  is_active boolean default true not null,
  carbon_multiplier numeric default 0.23 not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  constraint unique_user_registration_plate unique (user_id, registration_number)
);

-- Permanent Environmental Compliance Audit Log Ledger
create table emissions_logs (
  id uuid default gen_random_uuid() primary key,
  category_display text not null,
  carbon_kg numeric not null,
  carbon_g numeric not null,
  carbon_mt numeric not null,
  carbon_lb numeric not null,
  raw_payload jsonb not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Automation Trigger: Seamlessly clone auth.users metadata to public.profiles upon registration
create or replace function public.handle_new_user()
returns trigger as \[ begin   insert into public.profiles (id, name, surname, company)   values (     new.id,     coalesce(new.raw_user_meta_data->>'name', 'First'),     coalesce(new.raw_user_meta_data->>'surname', 'Last'),     coalesce(new.raw_user_meta_data->>'company', 'Default Fleet')   );   return new; end; \] language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Enable Row Level Security (RLS) policies for user scopes
alter table profiles enable row level security;
alter table user_vehicles enable row level security;

create policy "Users can view own profiles" on profiles for select using (auth.uid() = id);
create policy "Users can view own vehicles" on user_vehicles for select using (auth.uid() = user_id);
create policy "Users can insert own vehicles" on user_vehicles for insert with check (auth.uid() = user_id);
create policy "Users can update own vehicles" on user_vehicles for update using (auth.uid() = user_id);
```
*Note: The **"Confirm email" provider toggle setting is explicitly turned OFF** inside the Supabase Auth Settings tab to bypass standard email rate limits during local sandbox testing loops.*

---

## 4. MOCK API INFRASTRUCTURE (`carbon-mock-server`)
The simulation backend splits networking routes from server listeners to ensure flawless execution of automated unit tests.

### Entry Launcher (`index.js`):
```javascript
const app = require('./server');
const PORT = 4000;
app.listen(PORT, () => console.log(`Advanced Logistics Engine online on Port ${PORT}`));
```

### Core Router (`server.js`):
Enforces security bearer gates, cross-origin parameters (`cors()`), and computes transport masses dynamically:
- **`GET /api/v1/vehicle_makes`**: Static catalogue reference array (`Ferrari`, `Toyota`).
- **`GET /api/v1/vehicle_makes/:id/vehicle_models`**: Returns model specs with safe Corolla fallbacks.
- **`POST /api/v1/estimates`**: Unified multi-modal calculation endpoint. Processes `vehicle` (custom attributes mapping), `shipping` (maritime ton-km calculation using `0.015` multiplier), and `flight` (aviation passenger-leg algorithm using `150` base factor). Returns nested metrics JSON matching the exact expected corporate structure.

### Automation Testing Tracker (`server.test.js`):
Executes **5 out of 5 automated Jest / Supertest validations** verification checks covering route tokens, bad payloads, and mathematical transport computations (`npm test`).

---

## 5. FRONTEND FILE MAP ARCHITECTURE (`ecoroute/src/`)

### A. Style Sheet Layers (`app/globals.css`)
Tailwind CSS v4 CSS-first layer file containing custom hardware-accelerated motion assets:
- **`animate-ticker`**: Infinite, fluid horizontal text track marquee loop for critical fleet notifications.
- **`animate-fade-in`**: Smooth opacity/transform micro-interaction for entry content overlays.

### B. Dynamic Application Route Handler Layouts (`app/`)
- **`layout.js`**: Hard-bypasses operating system light preferences by enforcing `className="dark"` and `colorScheme: "dark"` document wrappers on an obsidian canvas grid (`bg-slate-950`).
- **`lib/supabaseClient.js`**: Global re-usable client initialization link instance.
- **`lib/certificateTemplate.js`**: Short, clean printable blueprint rendering an immaculate, premium minimalist corporate card template layout—**completely free of ugly JSON, displaying a human-readable Manifest Summary Table**.
- **`api/pdf/[id]/route.js`**: Server endpoint handler. Uses modern App Router layout async syntax (`await params`), queries rows from Supabase, processes layout variables, and streams clean printable views right inside browser tabs.
- **`api/backup/route.js`**: Queries `emissions_logs` and outputs comma-separated string streams triggering direct, browser-native CSV file spreadsheet downloads.
- **`update-password/page.js`**: Captures recovery access tokens sent via forgot password reset links to securely change user credentials.
- **`page.js`**: Core workspace layout state orchestrator. Manages user account checks, maps state hooks, handles form submissions, and aggregates multi-component splits.

### C. Modular Reusable View Components (`app/components/`)
- **`Ticker.jsx`**: Scrolling hardware-accelerated logistics alert notice marquee text layer.
- **`AuthScreen.jsx`**: Secure account creator, corporate login, and sliding forgot password recovery screen template using `resetPasswordForEmail`.
- **`DispatchForm.jsx`**: Compact form. 100% dependent on custom user fleet assets for vehicle estimations, hiding the select dropdown list and alerting drivers if no cars are registered first.
- **`Ledger.jsx`**: Visual output monitor parsing multi-modal carbon calculations dynamically, showing custom table entry IDs, and unlocking the printable document anchor button.
- **`FleetManager.jsx`**: Glassmorphic dashboard popup modal accessed near header backup buttons. Generates production years dynamically (`1990` to `Current Year + 1`) and queries database records to block duplicate license plates.
- **`FleetList.jsx`**: Grid list displaying active corporate cars with their plate tracking labels. Employs **Optimistic State Updates** to instantly hide deactivated cars before executing `is_active: false` updates.
- **`CarbonChart.jsx`**: Responsive Recharts area chart line profile that reads database caches live on startup to display cumulative tracking metrics.

---

## 6. CODING AND ARCHITECTURAL PROTOCOLS TO ENFORCE
1. **Never use standard HTML `class`**: Always map to the valid React standard `className`.
2. **Never break historical data logs**: Never execute destructive hard deletes against the `user_vehicles` table; update the `is_active` flag.
3. **No global catalog mixups**: The global manufacturer catalog is completely detached from the dispatch selector. Calculations are strictly driven by the custom user vehicles array pool.
4. **Bypass interpreter bracket bugs**: When extracting the first row index object returned from a Supabase array insertion payload response, always use the native array selector method **`insertedRows.at(0).id`** to guarantee compatibility.
5. **Always await App Router parameters**: Dynamic route properties (`params`) must be explicitly awaited (`const resolvedParams = await params`) inside server handlers before keys are extracted.

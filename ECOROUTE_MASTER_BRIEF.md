 STIMS ECO-ROUTE // SYSTEM MASTER BRIEF & FILE SPECIFICATIONS
This documentation details the structural layout, background operations, database tables, and connection configurations for the EcoRoute Carbon Auditing and Fleet Management platform.
________________________________________
📂 1. SYSTEM ROOT FILE DICTIONARY & COMPONENT GRAPH
The following chart outlines the exact file layout and component trees running inside your active workspace.
text
src/
└── app/
    ├── favicon.ico                  # Application system tab icon asset
    ├── globals.css                  # Style layout layer injecting the tech dark theme
    ├── layout.js                    # Global layout shell wrapping metadata blocks
    ├── page.js                      # Central router file handling page switching and synchronization
    │
    ├── actions/
    │   ├── checkout.js              # Server Action: Billing configuration pipeline links
    │   └── email.js                 # Server Action: Converts log profiles into safe uncorrupted attachments
    │
    ├── api/
    │   ├── backup/
    │   │   └── route.js             # API: Exports entire user logging datasets into raw JSON archives
    │   ├── checkout/
    │   │   ├── cancel/
    │   │   │   └── route.js         # API: Manages subscription plan termination pipelines
    │   │   └── initialize/
    │   │       └── route.js         # API: Sets up active Paystack ZAR checking endpoints safely
    │   ├── estimates/
    │   │   └── route.js             # API: General endpoint matrix layer for emissions lookups
    │   ├── pdf/
    │   │   └── [id]/
    │   │       └── route.js         # API: Compiles secure, isolated file download parameters via path query IDs
    │   └── v1/
    │       ├── estimates/
    │       │   └── route.js         # API: Enterprise secure Carbon Calculation engine (requires Bearer tokens)
    │       └── vehicle_makes/
    │           ├── route.js         # API: Provides lists of vehicle manufacturer tracking indexes
    │           └── [id]/
    │               └── vehicle_models/
    │                   └── route.js # API: Provides vehicle spec variations filtering by manufacturer IDs
    │
    ├── components/
    │   ├── AuthScreen.jsx           # Screen component locking fields for unauthenticated profiles
    │   ├── CarbonChart.jsx          # Component wrapping history metrics inside timeline trend graphs
    │   ├── DashboardView.js         # Master Frame: Packages calculation forms, single ledgers, and licensing
    │   ├── DispatchForm.jsx         # Form section mapping multi-sector input fields (Vehicle, Shipping, Flights)
    │   ├── ExportModal.js           # Modal: Centers horizontally and vertically on screens, processes direct downloads
    │   ├── FleetList.jsx            # Dynamic asset ledger register mapping car rows with active action confirm options
    │   ├── FleetManager.jsx         # Form wrapper modal tracking new vehicle registry data additions
    │   ├── FleetView.js             # Master Frame: Triggers backup files, manages free tier limits, and loads logs
    │   ├── Footer.js                # Application navigation footer providing state intercept anchors back home
    │   ├── Header.jsx               # Greeting panel strip rendering active user details and plan tier levels
    │   ├── Ledger.jsx               # Calculation results diagnostic component sheet
    │   ├── LogHistoryDetails.js     # Detail node element managing single card checks and loading the exporter modals
    │   ├── LogHistoryDropdown.js    # Symmetrical layout headers grouping calendar date query limit selectors
    │   ├── LogHistoryItem.js        # Scrollable log button checklist element built with custom scrollbar properties
    │   ├── LogHistoryManager.js     # Shared context container ensuring logs default to the active calendar month bounds
    │   ├── Navbar.js                # Core header nav handling pulse beacon pulsars and home page leave intercepts
    │   └── Ticker.jsx               # Scrolling animation notification message banner strip
    │
    ├── lib/
    │   ├── certificateTemplate.js   # Script template layer exporting structured HTML content for text prints
    │   ├── mockData.js              # Test mock arrays for automotive profiles testing sequences
    │   └── supabaseClient.js        # Engine script configuring database communication pool keys
    │
    └── update-password/
        └── page.js                  # Operational directory route handling password recovery changes
Use code with caution.
________________________________________
⚙️ 2. TRANSACTIONAL WORKFLOWS & DATA CONSTRAINTS
A. Dynamic View State Routing (Client Engine)
•	Instead of running traditional multi-page document requests that drop component values, src/app/page.js utilizes a string hook state switch matrix (activeViewPage) to load individual master frames (DashboardView vs FleetView).
•	When clicking / EcoRoute or the ecoroute.stims.co.za footer anchor link, click-intercept methods override standard browser behavior to toggle the screen back to the primary workspace safely.
B. Viewport Modal Centering Properties
To prevent relative layout containers or css transforms from breaking popup placement on scrolled windows, every dialogue card handles layout centering independently:
•	Backdrops apply fixed top-0 left-0 right-0 bottom-0 z-[100] flex items-start justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in parameters.
•	Inner dialog layout cards utilize w-full max-w-sm mt-12 mx-auto styling. This pins them symmetrically to the top-center of the screen window view, with a small margin, rather than centering based on page length.
C. Quota Access Limit Handshakes
•	Free Account Restriction Level: Limited to 1 vehicle row item.
•	Validation Loop: When triggering the creation modal inside FleetView.js, the platform evaluates customVehicles.length. If the registry is filled, it immediately triggers the custom, styled VEHICLE REGISTRY LIMIT popup modal on your screen with an inline payment authorization upgrade button.
D. File Compilations & Valid Attachment Delivery
•	Local Printing Engine: Uses dynamic iframe generation to capture isolated table row element branches, apply print layouts, and open browser print controls directly.
•	Email Attachment Validation: Passing raw layout code files across remote servers can cause email reader errors. The application converts text logs into raw binary byte blocks using TextEncoder(), encodes the bytes into a base64 string, and passes the clean data down to your server action. This attaches it as a valid, uncorrupted .txt documentation report directly through the Resend API channel.
________________________________________
🗄️ 3. CORE RELATIONAL DATABASE SCHEMAS
The storage engine uses PostgreSQL tables through Supabase to store information without using double slashes (//) or underscores (_) inside system label variables.
Table: profiles
•	id (uuid, primary key) — References the global user system identification token.
•	first_name (text) — Name string of the system operator.
•	surname (text) — Surname string of the system operator.
•	company (text) — Associated business node label text string.
Table: user_subscriptions
•	user_id (uuid, primary key) — References the owner user profile token.
•	app_id (text) — Application scope selector string (ecoroute).
•	tier (text) — Access level permission value (free or premium).
•	status (text) — Billing parameter state tracking values (active or cancelled).
Table: ecoroute_vehicles
•	id (uuid, primary key) — Unique automotive tracer code token.
•	user_id (uuid) — Identifies the creating operational account user profile.
•	registration_number (text) — License registration plate string value.
•	make (text) — Automotive manufacturing company brand name label.
•	model (text) — Specific design series label.
•	year (integer) — Release year number string.
•	is_active (boolean) — Logic flag to toggle soft-deletion behavior without dropping history indices.
Table: ecoroute_emissions_logs
•	id (uuid, primary key) — Main entry tracer asset code.
•	vehicle_id (uuid, optional) — Connects history logs to an active car entry in the vehicle table database rows.
•	category_display (text) — Output identifier string (Holds explicit plate strings for fleet asset records).
•	carbon_kg (numeric) — Calculated footprint mass output in kilograms.
•	carbon_g (numeric) — Calculated footprint mass output in grams.
•	carbon_mt (numeric) — Calculated footprint mass output in metric tons.
•	carbon_lb (numeric) — Calculated footprint mass output in pounds.
•	raw_payload (jsonb) — Complete diagnostic object array fields.
•	created_at (timestamp) — Automated calendar execution tracker date stamp.
________________________________________
💎 4. STIMS INTERFACE CSS UTILITY CLASS MATRIX
The theme prioritizes high scannability over dark slate frames (#020617). To include high-intensity neon effects, apply this CSS utility definition directly to your interface styling sheets:
css
/* High-intensity custom neon blue glow shadow utility for cards and active button hovers */
.stims-hover-glow:hover {
  border-color: #3b82f6 !important;
  box-shadow: 0 0 25px 3px rgba(59, 130, 246, 0.25), inset 0 0 12px 1px rgba(59, 130, 246, 0.1);
  background-color: rgba(15, 23, 42, 0.9) !important;
}

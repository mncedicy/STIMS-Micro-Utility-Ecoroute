<!-- BEGIN:nextjs-agent-rules -->

# EcoRoute Architecture & Agents Blueprint

## System Overview
EcoRoute (`ecoroute.stims.co.za`) is a real-time logistics carbon emissions tracking application. It integrates with a local Mock Carbon Interface API server to process fleet travel records and persist data using Supabase.

## Tech Stack
- **Framework**: Next.js (App Router, JavaScript)
- **Styling**: Tailwind CSS v4 (CSS-First Layer Configuration)
- **Mock Service**: Standalone Express Node.js App (Running on port 4000)
- **Database Layer**: Supabase Cache Storage

## Core Environment Setup
- Local API URL: `http://localhost:4000/api/v1/estimates`
- Next.js Web Dev Server: `http://localhost:3000`

## Active UI Features
- Dark Theme: `bg-slate-950` obsidian canvas
- Motion Elements: Continuous horizontal `animate-ticker` for carbon alerts
- Content Entry: Smooth `animate-fade-in` micro-interactions


<!-- END:nextjs-agent-rules -->

// src/app/components/fleet/asset/list/FleetEmptyState.jsx

'use client';

import React from 'react';

export default function FleetEmptyState() {
    return (
        <div className="text-center py-12 text-slate-600 text-xs border border-dashed border-slate-800 rounded-lg bg-slate-950/20 my-auto uppercase tracking-wider text-[10px]">
            No vehicles found. Please add a vehicle to start tracking.
        </div>
    );
}

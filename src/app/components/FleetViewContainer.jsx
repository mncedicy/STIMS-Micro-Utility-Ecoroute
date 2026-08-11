// /src/app/components/FleetViewContainer.jsx
'use client';

import React from 'react';
import FleetView from './FleetView';
import CsvUploader from './CsvUploader'; // Imported standard modular batch loader

export default function FleetViewContainer({
    user,
    customVehicles,
    rawLogsArray,
    loadData,
    setIsFleetModalOpen,
    subscription,
    errorMsg
}) {
    return (
        <div className="space-y-6 w-full animate-fade-in">

            {errorMsg && (
                <div className="p-3 text-xs bg-rose-950/20 border border-rose-900/40 text-rose-400 font-mono rounded-lg shadow-sm">
                    ⚠️ SYSTEM LOG alert: {errorMsg}
                </div>
            )}

            <FleetView
                user={user}
                customVehicles={customVehicles}
                rawLogsArray={rawLogsArray}
                loadData={loadData}
                setIsFleetModalOpen={setIsFleetModalOpen}
                subscription={subscription}
            />



        </div>
    );
}

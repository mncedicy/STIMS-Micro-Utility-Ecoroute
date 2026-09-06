// src\app\components\fleet\FleetViewContainer.jsx

'use client';

import React from 'react';
import EmissionView from './EmissionView';

export default function EmissionViewContainer({
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

            <EmissionView
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

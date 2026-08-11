// /src/app/components/DashboardViewContainer.jsx
'use client';

import React from 'react';
import DashboardView from './DashboardView';
import CarbonTaxTelemetry from './CarbonTaxTelemetry';

export default function DashboardViewContainer({
    user,
    profile,
    isPremium,
    quotaReached,
    customVehicles,
    selectedCustomVehicle,
    setSelectedCustomVehicle,
    distance,
    setDistance,
    unit,
    setUnit,
    estimate,
    calcLoading,
    errorMsg,
    handleCalculate,
    subscription,
    loadData,
    setIsFleetModalOpen
}) {
    const tokenRecordRow = estimate?.tokenRecord || estimate?.data?.tokenRecord;

    return (
        <div className="w-full space-y-6 animate-fade-in text-left">



            <DashboardView
                user={user}
                profile={profile}
                isPremium={isPremium}
                quotaReached={quotaReached}
                customVehicles={customVehicles}
                selectedCustomVehicle={selectedCustomVehicle}
                setSelectedCustomVehicle={setSelectedCustomVehicle}
                distance={distance}
                setDistance={setDistance}
                unit={unit}
                setUnit={setUnit}
                estimate={estimate}
                calcLoading={calcLoading}
                errorMsg={errorMsg}
                handleCalculate={handleCalculate}
                subscription={subscription}
                loadData={loadData}
                setIsFleetModalOpen={setIsFleetModalOpen}
            />

            {/* Mounts the user-friendly live ZAR tax exposures forecaster widget directly in the main workspace view */}
            {tokenRecordRow && (
                <CarbonTaxTelemetry
                    tokenRecord={tokenRecordRow}
                    appMeta={estimate?.appMeta || null}
                />
            )}
        </div>
    );
}

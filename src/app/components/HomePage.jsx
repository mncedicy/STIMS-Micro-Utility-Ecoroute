// src/app/components/HomePage.jsx

'use client';

import DashboardViewContainer from './home/DashboardViewContainer';
import ApiViewContainer from './developer/ApiViewContainer';
import FleetViewContainer from './fleet/FleetViewContainer';
import EmissionViewContainer from './emission/EmissionViewContainer';
import ReferralsViewContainer from './referrals/ReferralsViewContainer';
import Contact from './contact/Contact';
import FleetManager from './fleet/asset/FleetAssetManager';

export default function HomePage({
    activeViewPage,
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
    setIsFleetModalOpen,
    rawLogsArray,
    isFleetModalOpen,
}) {
    return (
        <main className="w-full flex flex-col items-center justify-start pt-28 pb-24 px-4 relative z-10 flex-grow animate-fade-in-up">
            <div className="w-full max-w-6xl px-2 relative space-y-6">


                {activeViewPage === 'dashboard' && (
                    <DashboardViewContainer
                        user={user} profile={profile} isPremium={isPremium} quotaReached={quotaReached}
                        customVehicles={customVehicles} selectedCustomVehicle={selectedCustomVehicle} setSelectedCustomVehicle={setSelectedCustomVehicle}
                        distance={distance} setDistance={setDistance} unit={unit} setUnit={setUnit}
                        estimate={estimate} calcLoading={calcLoading} errorMsg={errorMsg} handleCalculate={handleCalculate}
                        subscription={subscription} loadData={loadData} setIsFleetModalOpen={setIsFleetModalOpen}
                    />
                )}
                {activeViewPage === 'emission_history' && (
                    <EmissionViewContainer
                        user={user} customVehicles={customVehicles} rawLogsArray={rawLogsArray}
                        loadData={loadData} setIsFleetModalOpen={setIsFleetModalOpen} subscription={subscription} errorMsg={errorMsg}
                    />
                )}

                {activeViewPage === 'fleet' && (
                    <FleetViewContainer
                        user={user} customVehicles={customVehicles} rawLogsArray={rawLogsArray}
                        loadData={loadData} setIsFleetModalOpen={setIsFleetModalOpen} subscription={subscription} errorMsg={errorMsg}
                    />
                )}

                {activeViewPage === 'referrals' && (
                    <ReferralsViewContainer user={user} isPremium={isPremium} subscription={subscription} errorMsg={errorMsg} />
                )}

                {activeViewPage === 'developer_api' && (
                    <ApiViewContainer user={user} isPremium={isPremium} />
                )}

                <Contact user={user} profile={profile} />
            </div>

            <FleetManager user={user} isOpen={isFleetModalOpen} onClose={() => setIsFleetModalOpen(false)} onVehicleAdded={loadData} />
        </main>
    );
}
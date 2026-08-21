// src/app/page.jsx

'use client';

import Navbar from './components/shared/Navbar';
import Footer from './components/shared/Footer';
import LandingPage from './components/LandingPage';
import HomePage from './components/HomePage';
import { useEcoRouteData } from './utils/ecoroute/useEcoRouteData';

export default function Home() {
  const {
    user,
    profile,
    subscription,
    customVehicles,
    selectedCustomVehicle,
    setSelectedCustomVehicle,
    isFleetModalOpen,
    setIsFleetModalOpen,
    distance,
    setDistance,
    unit,
    setUnit,
    estimate,
    calcLoading,
    errorMsg,
    activeViewPage,
    setActiveViewPage,
    rawLogsArray,
    showAuthGateModal,
    setShowAuthGateModal,
    isVerifiedRedirect,
    activeApplicationMeta,
    loadData,
    handleCalculate,
    isPremium,
    quotaReached,
    loading,
  } = useEcoRouteData();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-xs font-mono text-slate-600 select-none">
        AUTHENTICATING SUBDOMAIN MATRIX...
      </div>
    );
  }

  if (!user) {
    return (
      <LandingPage
        showAuthGateModal={showAuthGateModal}
        setShowAuthGateModal={setShowAuthGateModal}
        activeApplicationMeta={activeApplicationMeta}
        loadData={loadData}
        isVerifiedRedirect={isVerifiedRedirect}
        setActiveViewPage={setActiveViewPage}
      />
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 selection:bg-blue-500 selection:text-slate-950 antialiased relative">
      <div className="stims-ambient-glow" />
      <Navbar user={user} activeViewPage={activeViewPage} onNavigateViewPage={setActiveViewPage} />

      <HomePage
        activeViewPage={activeViewPage}
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
        rawLogsArray={rawLogsArray}
        isFleetModalOpen={isFleetModalOpen}
      />

      <Footer onNavigateViewPage={setActiveViewPage} />
    </div>
  );
}
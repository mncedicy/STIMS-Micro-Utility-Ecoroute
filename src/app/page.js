// /src/app/page.jsx
'use client';

import { useState, useEffect } from 'react';
import Ticker from './components/Ticker';
import AuthScreen from './components/AuthScreen';
import FleetManager from './components/FleetManager';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import LandingHero from './components/LandingHero';
import Contact from './components/Contact';
import DashboardViewContainer from './components/DashboardViewContainer';
import ApiViewContainer from './components/ApiViewContainer';
import FleetViewContainer from './components/FleetViewContainer';
import { supabase } from './lib/supabaseClient';

export default function Home() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [subscription, setSub] = useState({ tier: 'free', status: 'inactive' });
  const [customVehicles, setCustomVehicles] = useState([]);
  const [selectedCustomVehicle, setSelectedCustomVehicle] = useState('');
  const [isFleetModalOpen, setIsFleetModalOpen] = useState(false);
  const [distance, setDistance] = useState(100);
  const [unit, setUnit] = useState('km');
  const [estimate, setEstimate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [calcLoading, setCalcLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [activeViewPage, setActiveViewPage] = useState('dashboard');
  const [rawLogsArray, setRawLogsArray] = useState([]);
  const [showAuthGateModal, setShowAuthGateModal] = useState(false);

  const [activeApplicationMeta, setActiveApplicationMeta] = useState({
    title: "EcoRoute",
    tagline: "FLEET CARBON ANALYTICS",
    category: "LOGISTICS",
    description: "Automated mileage-to-emissions translation engine built specifically for independent local courier services seeking green compliance tax credits.",
    app_link: "https://stims.co.za",
    monetization_type: "Subscription",
    monetization_fee_display: "R280 per month",
    usage_limit_free: 100,
    usage_limit_premium: 3000
  });

  const syncState = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      setUser(session.user);
    } else {
      setUser(null);
      setLoading(false);
    }
  };

  useEffect(() => {
    syncState();
    const { data: { subscription: authSub } } = supabase.auth.onAuthStateChange((_, s) => {
      if (s?.user) {
        setUser(s.user);
      } else {
        setUser(null);
        setLoading(false);
      }
    });
    window.addEventListener('focus', syncState);
    return () => {
      authSub?.unsubscribe();
      window.removeEventListener('focus', syncState);
    };
  }, []);

  const loadData = async (isRefreshOnly = false) => {
    try {
      const { data: appMetaRow } = await supabase
        .from('applications')
        .select('*')
        .eq('app_id', 'ecoroute')
        .maybeSingle();

      if (appMetaRow) {
        setActiveApplicationMeta(appMetaRow);
      }

      const { data: { session } } = await supabase.auth.getSession();
      const activeUser = session?.user;
      if (!activeUser) return;

      const [prof, sub, cars, logs, tokenRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', activeUser.id).maybeSingle(),
        supabase.from('user_subscriptions').select('tier, status, current_period_start').eq('user_id', activeUser.id).eq('app_id', 'ecoroute').maybeSingle(),
        supabase.from('ecoroute_vehicles').select('*').eq('user_id', activeUser.id).eq('is_active', true).order('created_at', { ascending: false }),
        supabase.from('ecoroute_emissions_logs').select('*').eq('user_id', activeUser.id).order('emission_date', { ascending: false }),
        supabase.from('ecoroute_corporate_api_tokens').select('*').eq('user_id', activeUser.id).maybeSingle()
      ]);

      setProfile(prof.data);
      setSub(sub.data ? { tier: sub.data.tier, status: sub.data.status } : { tier: 'free', status: 'inactive' });
      setCustomVehicles(cars.data || []);
      setRawLogsArray(logs.data || []);

      if (!isRefreshOnly && tokenRes.data) {
        setEstimate({ category_display: 'INITIALIZATION', tokenRecord: tokenRes.data });
      } else if (isRefreshOnly && tokenRes.data && estimate && estimate.category_display !== 'INITIALIZATION') {
        setEstimate(prev => ({ ...prev, tokenRecord: tokenRes.data }));
      }
    } catch (err) {
      console.error('EcoRoute core data load exception:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id) loadData(false);
  }, [user]);

  async function handleCalculate(formPayload) {
    setCalcLoading(true);
    setErrorMsg('');
    try {
      const { data: currentSessionData } = await supabase.auth.getSession();
      const accessToken = currentSessionData?.session?.access_token || '';

      const res = await fetch('/api/estimates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': accessToken ? `Bearer ${accessToken}` : '' },
        body: JSON.stringify(formPayload)
      });

      const result = await res.json();
      if (!res.ok || result.error) throw new Error(result.error || 'Offline calculation rejected.');

      setEstimate(result.data);
      await loadData(true);
    } catch (err) {
      setErrorMsg(err.message || 'Processing parameter metrics failed.');
    } finally {
      setCalcLoading(false);
    }
  }

  if (loading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-xs font-mono text-slate-600 select-none">AUTHENTICATING SUBDOMAIN MATRIX...</div>;

  if (!user) {
    return (
      <div className="min-h-screen w-full bg-[#020617] text-slate-100 antialiased relative flex flex-col justify-between selection:bg-blue-500 selection:text-slate-950">
        {!showAuthGateModal ? (
          <>
            <LandingHero onGetStartedClick={() => setShowAuthGateModal(true)} appData={activeApplicationMeta} />
            <Contact user={null} profile={null} />
          </>
        ) : (
          <main className="w-full flex-grow flex items-center justify-center p-4 relative z-10 pt-16 animate-fade-in">
            <div className="w-full max-w-md relative space-y-4">
              <AuthScreen onAuthSuccess={loadData} />
              <button type="button" onClick={() => setShowAuthGateModal(false)} className="w-full text-center text-slate-500 hover:text-slate-300 font-mono text-[10px] uppercase tracking-widest bg-transparent border-none outline-none py-1 cursor-pointer transition-colors">◀ return to landing overview</button>
            </div>
          </main>
        )}
        <Footer onNavigateViewPage={setActiveViewPage} />
      </div>
    );
  }

  // FIXED IS_PREMIUM VALIDATION ENGINE: Preserves active data states across cancelled renewal cutoff intervals
  const isPremium = subscription.tier === 'premium' && (subscription.status === 'active' || subscription.status === 'cancelling');
  const quotaReached = !isPremium && customVehicles.length >= 1;

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 selection:bg-blue-500 selection:text-slate-950 antialiased relative">
      <div className="stims-ambient-glow" />
      <Navbar user={user} activeViewPage={activeViewPage} onNavigateViewPage={setActiveViewPage} />

      <main className="w-full flex flex-col items-center justify-start pt-28 pb-24 px-4 relative z-10 flex-grow animate-fade-in-up">
        <div className="w-full max-w-4xl relative space-y-6">
          <Ticker />

          {activeViewPage === 'dashboard' && (
            <DashboardViewContainer
              user={user} profile={profile} isPremium={isPremium} quotaReached={quotaReached}
              customVehicles={customVehicles} selectedCustomVehicle={selectedCustomVehicle} setSelectedCustomVehicle={setSelectedCustomVehicle}
              distance={distance} setDistance={setDistance} unit={unit} setUnit={setUnit}
              estimate={estimate} calcLoading={calcLoading} errorMsg={errorMsg} handleCalculate={handleCalculate}
              subscription={subscription} loadData={loadData} setIsFleetModalOpen={setIsFleetModalOpen}
            />
          )}

          {activeViewPage === 'developer_api' && (
            <ApiViewContainer user={user} isPremium={isPremium} />
          )}

          {activeViewPage === 'fleet' && (
            <FleetViewContainer
              user={user} customVehicles={customVehicles} rawLogsArray={rawLogsArray}
              loadData={loadData} setIsFleetModalOpen={setIsFleetModalOpen} subscription={subscription} errorMsg={errorMsg}
            />
          )}

          <Contact user={user} profile={profile} />
        </div>

        <FleetManager user={user} isOpen={isFleetModalOpen} onClose={() => setIsFleetModalOpen(false)} onVehicleAdded={loadData} />
      </main>
      <Footer onNavigateViewPage={setActiveViewPage} />
    </div>
  );
}

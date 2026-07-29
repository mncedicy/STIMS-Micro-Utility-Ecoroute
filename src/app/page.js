'use client';

import { useState, useEffect } from 'react';
import Ticker from './components/Ticker';
import AuthScreen from './components/AuthScreen';
import FleetManager from './components/FleetManager';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import DashboardView from './components/DashboardView';
import FleetView from './components/FleetView';
import { supabase } from './lib/supabaseClient';

export default function Home() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [subscription, setSub] = useState({ tier: 'free', status: 'inactive' });
  const [customVehicles, setCustomVehicles] = useState([]);
  const [selectedCustomVehicle, setSelectedCustomVehicle] = useState('');
  const [isFleetModalOpen, setIsFleetModalOpen] = useState(false);
  const [distance, setDistance] = useState(100);
  const [unit, setUnit] = useState('km'); // Default standard metric system
  const [estimate, setEstimate] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [calcLoading, setCalcLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [activeViewPage, setActiveViewPage] = useState('dashboard');
  const [rawLogsArray, setRawLogsArray] = useState([]);

  const syncState = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setUser(session?.user ?? null); if (!session?.user) setLoading(false);
  };

  useEffect(() => {
    syncState();
    const { data: { subscription: authSub } } = supabase.auth.onAuthStateChange((_, s) => {
      setUser(s?.user ?? null); if (!s?.user) setLoading(false);
    });
    window.addEventListener('focus', syncState);
    return () => { authSub?.unsubscribe(); window.removeEventListener('focus', syncState); };
  }, []);


  const loadData = async () => {
    if (!user) return;
    try {
      // Fetch data streams concurrently from Supabase
      const [prof, sub, cars, logs] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).maybeSingle(),
        supabase.from('user_subscriptions').select('tier, status').eq('user_id', user.id).eq('app_id', 'ecoroute').maybeSingle(),
        supabase.from('ecoroute_vehicles').select('*').eq('user_id', user.id).eq('is_active', true).order('created_at', { ascending: false }),
        supabase.from('ecoroute_emissions_logs').select('*').order('created_at', { ascending: false }) // Sorted newest first for scannable timeline items
      ]);

      setProfile(prof.data);
      setSub(sub.data ? { tier: sub.data.tier, status: sub.data.status } : { tier: 'free', status: 'inactive' });
      setCustomVehicles(cars.data || []);
      setRawLogsArray(logs.data || []);
      if (logs.data) setHistory(logs.data.map(l => ({ carbon_kg: l.carbon_kg, estimated_at: l.created_at })));
    } catch (err) {
      console.error('EcoRoute core ledger data loading exception:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (user) loadData(); }, [user]);

  async function handleCalculate(formPayload) {
    setCalcLoading(true);
    setErrorMsg('');

    try {
      // FIX AUTHENTICATION HEADER EXTRACTION PATHWAY:
      // Try extracting live access token directly from active memory session variables first
      const { data: currentSessionData } = await supabase.auth.getSession();
      let accessToken = currentSessionData?.session?.access_token || '';

      // Fallback cleanly to localStorage object lookups if memory bounds are missing
      if (!accessToken) {
        const localSsoSessionString = window.localStorage.getItem('stims-enterprise-sso');
        if (localSsoSessionString) {
          const parsedSsoData = JSON.parse(localSsoSessionString);
          accessToken = parsedSsoData?.access_token || parsedSsoData?.currentSession?.access_token || '';
        }
      }

      // Dispatch parameters into your internal offline endpoint handler with auth headers attached
      const res = await fetch('/api/estimates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': accessToken ? `Bearer ${accessToken}` : ''
        },
        body: JSON.stringify(formPayload)
      });

      const result = await res.json();
      if (!res.ok || result.error) throw new Error(result.error || 'Offline calculation execution rejected.');

      setEstimate(result.data);
      await loadData(); // Force data refresh across timeline history charts matrix
    } catch (err) {
      console.error('EcoRoute Pipeline calculation error tracking:', err.message);
      setErrorMsg(err.message || 'Processing logistical parameters failed.');
    } finally {
      setCalcLoading(false);
    }
  }

  if (loading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-xs font-mono text-slate-600 select-none">AUTHENTICATING SUBDOMAIN MATRIX...</div>;
  if (!user) return <main className="min-h-screen w-full flex items-center justify-center p-4 bg-slate-950 text-slate-100 selection:bg-blue-500 selection:text-slate-950 antialiased relative"><div className="stims-ambient-glow" /><Ticker /><AuthScreen onAuthSuccess={loadData} /></main>;

  const isPremium = subscription.tier === 'premium' && subscription.status === 'active';
  const quotaReached = !isPremium && customVehicles.length >= 1;

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 selection:bg-blue-500 selection:text-slate-950 antialiased relative">
      <div className="stims-ambient-glow" />

      <Navbar user={user} activeViewPage={activeViewPage} onNavigateViewPage={setActiveViewPage} />

      <main className="w-full flex flex-col items-center justify-start pt-28 pb-24 px-4 relative z-10 animate-fade-in-up flex-grow">
        <div className="w-full max-w-4xl relative space-y-6">
          <Ticker />

          {activeViewPage === 'dashboard' ? (
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
          ) : (
            <div className="space-y-6">
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
          )}
        </div>

        <FleetManager user={user} isOpen={isFleetModalOpen} onClose={() => setIsFleetModalOpen(false)} onVehicleAdded={loadData} />
      </main>

      <Footer />
    </div>
  );
}

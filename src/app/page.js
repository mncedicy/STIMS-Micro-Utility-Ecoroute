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
  const [unit, setUnit] = useState('mi');
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
      const [prof, sub, cars, logs] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).maybeSingle(),
        supabase.from('user_subscriptions').select('tier, status').eq('user_id', user.id).eq('app_id', 'ecoroute').maybeSingle(),
        supabase.from('ecoroute_vehicles').select('*').eq('user_id', user.id).eq('is_active', true).order('created_at', { ascending: false }),
        supabase.from('ecoroute_emissions_logs').select('*').order('created_at', { ascending: true })
      ]);
      setProfile(prof.data);
      setSub(sub.data ? { tier: sub.data.tier, status: sub.data.status } : { tier: 'free', status: 'inactive' });
      setCustomVehicles(cars.data || []);
      setRawLogsArray(logs.data || []);
      if (logs.data) setHistory(logs.data.map(l => ({ carbon_kg: l.carbon_kg, estimated_at: l.created_at })));
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  useEffect(() => { if (user) loadData(); }, [user]);

  async function handleCalculate(p) {
    setCalcLoading(true); setErrorMsg('');
    let plateLabel = '';

    if (p.type === 'vehicle') {
      const car = customVehicles.find(v => v.id === p.vehicle_model_id);
      if (!car) return (setErrorMsg('Select valid car.'), setCalcLoading(false));
      Object.assign(p, { vehicle_make: car.make, vehicle_model: car.model, vehicle_year: car.year });
      plateLabel = car.registration_number || car.registration || '';
    }

    try {
      // FIXED: Restored the true Carbon Calculation API route path with secure bearer headers
      const res = await fetch('/api/v1/estimates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer STIMS_SECURE_ECO_PASS_KEY'
        },
        body: JSON.stringify(p)
      });
      const result = await res.json(); if (result.error) throw new Error(result.error);
      const est = result.data.attributes;

      const displayString = p.type === 'vehicle'
        ? `Fleet Car [${plateLabel.toUpperCase()}] ${p.vehicle_make} ${p.vehicle_model}`
        : est.category_display;

      const { data: rows, error: dbErr } = await supabase.from('ecoroute_emissions_logs').insert([{
        vehicle_id: p.type === 'vehicle' ? p.vehicle_model_id : null,
        category_display: displayString,
        carbon_kg: est.carbon_kg, carbon_g: est.carbon_g, carbon_mt: est.carbon_mt, carbon_lb: est.carbon_lb, raw_payload: { ...est, ...p, registration_number: plateLabel }
      }]).select();
      if (dbErr) throw dbErr;

      setEstimate({ ...est, supabase_id: rows && rows.length > 0 ? rows.id : null, category_display: displayString });
      await loadData();
    } catch (err) { setErrorMsg(err.message || 'Processing failed.'); } finally { setCalcLoading(false); }
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

          {errorMsg && (
            <div className="p-3 text-xs bg-rose-950/20 border border-rose-900/40 text-rose-400 font-mono rounded-lg shadow-sm">
              ⚠️ SYSTEM LOG alert: {errorMsg}
            </div>
          )}

          {activeViewPage === 'dashboard' ? (
            <DashboardView
              user={user} profile={profile} isPremium={isPremium} quotaReached={quotaReached} customVehicles={customVehicles} selectedCustomVehicle={selectedCustomVehicle} setSelectedCustomVehicle={setSelectedCustomVehicle} distance={distance} setDistance={setDistance} unit={unit} setUnit={setUnit} estimate={estimate} calcLoading={calcLoading} errorMsg={errorMsg} handleCalculate={handleCalculate} subscription={subscription} loadData={loadData} setIsFleetModalOpen={setIsFleetModalOpen}
            />
          ) : (
            <FleetView
              user={user}
              customVehicles={customVehicles}
              rawLogsArray={rawLogsArray}
              loadData={loadData}
              setIsFleetModalOpen={setIsFleetModalOpen}
              subscription={subscription}
            />
          )}
        </div>

        <FleetManager user={user} isOpen={isFleetModalOpen} onClose={() => setIsFleetModalOpen(false)} onVehicleAdded={loadData} />
      </main>

      <Footer />
    </div>
  );
}

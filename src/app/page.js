// src/app/page.js
'use client';

import { useState, useEffect } from 'react';
import Ticker from './components/Ticker';
import DispatchForm from './components/DispatchForm';
import Ledger from './components/Ledger';
import CarbonChart from './components/CarbonChart';
import AuthScreen from './components/AuthScreen';
import FleetManager from './components/FleetManager';
import FleetList from './components/FleetList';
import Header from './components/Header';
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
      setProfile(prof.data); setSub(sub.data ? { tier: sub.data.tier, status: sub.data.status } : { tier: 'free', status: 'inactive' });
      setCustomVehicles(cars.data || []);
      if (logs.data) setHistory(logs.data.map(l => ({ carbon_kg: l.carbon_kg, estimated_at: l.created_at })));
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  useEffect(() => { if (user) loadData(); }, [user]);

  async function handleCalculate(p) {
    setCalcLoading(true); setErrorMsg('');
    if (p.type === 'vehicle') {
      const car = customVehicles.find(v => v.id === p.vehicle_model_id);
      if (!car) return (setErrorMsg('Select valid car.'), setCalcLoading(false));
      Object.assign(p, { vehicle_make: car.make, vehicle_model: car.model, vehicle_year: car.year });
    }
    try {
      // FIXED: Swapped out external link for our new internal proxy handler path to bypass CORS locks
      const res = await fetch('/api/estimates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(p)
      });
      const result = await res.json(); if (result.error) throw new Error(result.error);
      const est = result.data.attributes;

      const { data: rows, error: dbErr } = await supabase.from('ecoroute_emissions_logs').insert([{
        vehicle_id: p.type === 'vehicle' ? p.vehicle_model_id : null,
        category_display: p.type === 'vehicle' ? `Fleet Car (${p.vehicle_make} ${p.vehicle_model})` : est.category_display,
        carbon_kg: est.carbon_kg, carbon_g: est.carbon_g, carbon_mt: est.carbon_mt, carbon_lb: est.carbon_lb, raw_payload: { ...est, ...p }
      }]).select();
      if (dbErr) throw dbErr;

      setEstimate({ ...est, supabase_id: rows && rows.length > 0 ? rows[0].id : null, category_display: p.type === 'vehicle' ? `Fleet Car (${p.vehicle_make} ${p.vehicle_model})` : est.category_display });
      setHistory(prev => [...prev, { carbon_kg: est.carbon_kg, estimated_at: new Date().toISOString() }]);
    } catch (err) { setErrorMsg(err.message || 'Processing failed.'); } finally { setCalcLoading(false); }
  }

  if (loading) return <div className="min-h-screen bg-[#020617] flex items-center justify-center text-xs font-mono text-slate-600 select-none">AUTHENTICATING SUBDOMAIN MATRIX...</div>;
  if (!user) return <main className="min-h-screen w-full flex items-center justify-center p-4 bg-[#020617] relative"><div className="absolute inset-0 stims-blueprint-bg opacity-30 pointer-events-none" /><Ticker /><AuthScreen onAuthSuccess={loadData} /></main>;

  const isPremium = subscription.tier === 'premium' && subscription.status === 'active';
  const quotaReached = !isPremium && customVehicles.length >= 1;

  return (
    <main className="min-h-screen w-full flex flex-col items-center justify-start pt-20 pb-24 px-4 bg-[#020617] relative animate-fade-in">
      <div className="absolute inset-0 stims-blueprint-bg opacity-30 pointer-events-none z-0" />
      <div className="absolute top-0 left-0 right-0 h-96 bg-gradient-to-b from-blue-500/[0.02] via-transparent to-transparent pointer-events-none z-0" />

      <div className="w-full max-w-4xl relative z-10 space-y-6">
        <Ticker />
        <Header user={user} profile={profile} isPremium={isPremium} quotaReached={quotaReached} openModal={() => setIsFleetModalOpen(true)} onSuccess={loadData} />

        {errorMsg && (
          <div className="p-3 text-xs bg-rose-950/20 border border-rose-900/40 text-rose-400 font-mono rounded-lg shadow-sm">
            ⚠️ SYSTEM LOG alert: {errorMsg}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          <DispatchForm distance={distance} setDistance={setDistance} unit={unit} setUnit={setUnit} onSubmit={handleCalculate} loading={calcLoading} errorMsg={errorMsg} customVehicles={customVehicles} selectedCustomVehicle={selectedCustomVehicle} setSelectedCustomVehicle={setSelectedCustomVehicle} />
          <Ledger estimate={estimate} isPremium={isPremium} />
          <FleetList customVehicles={customVehicles} onVehicleDeleted={loadData} />
          <CarbonChart history={history} />
        </div>
      </div>
      <FleetManager user={user} isOpen={isFleetModalOpen} onClose={() => setIsFleetModalOpen(false)} onVehicleAdded={loadData} />
    </main>
  );
}

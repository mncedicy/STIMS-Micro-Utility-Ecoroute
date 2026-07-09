'use client';

import { useState, useEffect } from 'react';
import Ticker from './components/Ticker';
import DispatchForm from './components/DispatchForm';
import Ledger from './components/Ledger';
import CarbonChart from './components/CarbonChart';
import AuthScreen from './components/AuthScreen';
import FleetManager from './components/FleetManager';
import FleetList from './components/FleetList';
import { supabase } from './lib/supabaseClient';

export default function Home() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [customVehicles, setCustomVehicles] = useState([]);
  const [selectedCustomVehicle, setSelectedCustomVehicle] = useState('');

  const [isFleetModalOpen, setIsFleetModalOpen] = useState(false);

  const [distance, setDistance] = useState(100);
  const [unit, setUnit] = useState('mi');
  const [estimate, setEstimate] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadUserFleetData = async () => {
    if (!user) return;
    try {
      const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      setProfile(prof);

      // FIXED: Strictly filter the select query to only fetch vehicles where is_active is true from the start
      const { data: cars } = await supabase
        .from('user_vehicles')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      setCustomVehicles(cars || []);
    } catch (err) {
      console.error('Error fetching fleet rows:', err.message);
    }
  };

  useEffect(() => {
    loadUserFleetData();
  }, [user]);

  useEffect(() => {
    async function fetchHistoricalLogs() {
      try {
        const { data, error } = await supabase.from('emissions_logs').select('*').order('created_at', { ascending: true });
        if (error) throw error;
        if (data) {
          setHistory(data.map(log => ({ carbon_kg: log.carbon_kg, estimated_at: log.created_at })));
        }
      } catch (err) {
        console.error('Error hydrating historical trends:', err);
      }
    }
    fetchHistoricalLogs();
  }, []);

  async function handleCalculate(payload) {
    setLoading(true);
    setErrorMsg('');

    if (payload.type === 'vehicle') {
      const selectedCar = customVehicles.find(v => v.id === payload.vehicle_model_id);
      if (!selectedCar) {
        setErrorMsg('Please select a valid car from your saved custom vehicles list.');
        setLoading(false);
        return;
      }
      payload.vehicle_make = selectedCar.make;
      payload.vehicle_model = selectedCar.model;
      payload.vehicle_year = selectedCar.year;
    }

    try {
      const res = await fetch(process.env.CARBON_INTERFACE_URL, {
        method: 'POST',
        headers: { 'Authorization': 'Bearer mock_secret_api_key_abc123', 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const result = await res.json();
      if (result.error) throw new Error(result.error);

      const newEstimate = result.data.attributes;

      const { data: insertedRows, error: dbError } = await supabase
        .from('emissions_logs')
        .insert([{
          category_display: payload.type === 'vehicle' ? `Fleet Car (${payload.vehicle_make} ${payload.vehicle_model})` : newEstimate.category_display,
          carbon_kg: newEstimate.carbon_kg,
          carbon_g: newEstimate.carbon_g,
          carbon_mt: newEstimate.carbon_mt,
          carbon_lb: newEstimate.carbon_lb,
          raw_payload: { ...newEstimate, ...payload }
        }])
        .select();

      if (dbError) throw dbError;
      const supabaseRowId = insertedRows && insertedRows.length > 0 ? insertedRows.at(0).id : null;

      setEstimate({
        ...newEstimate,
        supabase_id: supabaseRowId,
        category_display: payload.type === 'vehicle' ? `Fleet Car (${payload.vehicle_make} ${payload.vehicle_model})` : newEstimate.category_display
      });

      setHistory((prev) => [...prev, { carbon_kg: newEstimate.carbon_kg, estimated_at: newEstimate.estimated_at }]);

    } catch (err) {
      setErrorMsg(err.message || 'Failed to process logistics calculation.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  if (!user) {
    return (
      <main className="min-h-screen w-full flex items-center justify-center p-4 bg-slate-950 text-slate-100">
        <Ticker />
        <AuthScreen onAuthSuccess={() => loadUserFleetData()} />
      </main>
    );
  }

  return (
    <main className="min-h-screen w-full flex flex-col items-center justify-start pt-20 pb-12 px-4 animate-fade-in relative bg-slate-950 text-slate-100">
      <Ticker />

      <div className="w-full max-w-4xl flex flex-col sm:flex-row justify-between items-start sm:items-center mt-8 mb-4 gap-4 px-1">
        <div>
          <h1 className="text-2xl font-black bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent tracking-tight">EcoRoute Control Workspace</h1>
          <p className="text-xs text-slate-400 font-semibold uppercase mt-0.5 tracking-wider">Welcome back, {profile?.name || 'User'} • <span className="text-emerald-400">{profile?.company || 'Loading...'}</span></p>
        </div>

        <div className="flex flex-wrap gap-2.5">
          <button
            onClick={() => setIsFleetModalOpen(true)}
            className="bg-gradient-to-r from-emerald-950/60 to-teal-950/60 hover:from-emerald-900/60 hover:to-teal-900/60 border border-emerald-800 text-xs font-bold text-emerald-400 px-4 py-2 rounded-xl transition-all shadow-md cursor-pointer flex items-center space-x-1.5"
          >
            <span>🚗</span> <span>Add Fleet Car</span>
          </button>

          <a href="/api/backup" download className="bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-bold text-slate-300 px-4 py-2 rounded-xl transition-all shadow-md flex items-center space-x-1.5">
            <span>📥</span> <span>CSV Backup</span>
          </a>

          <button onClick={() => supabase.auth.signOut()} className="bg-red-950/40 hover:bg-red-900/60 border border-red-900/60 text-xs font-bold text-red-400 px-4 py-2 rounded-xl transition-all shadow-md cursor-pointer">Sign Out</button>
        </div>
      </div>

      <div className="w-full max-w-4xl grid md:grid-cols-2 gap-8 items-start">
        <DispatchForm
          distance={distance}
          setDistance={setDistance}
          unit={unit}
          setUnit={setUnit}
          onSubmit={handleCalculate}
          loading={loading}
          errorMsg={errorMsg}
          customVehicles={customVehicles}
          selectedCustomVehicle={selectedCustomVehicle}
          setSelectedCustomVehicle={setSelectedCustomVehicle}
        />

        <Ledger estimate={estimate} />

        <FleetList
          customVehicles={customVehicles}
          onVehicleDeleted={() => loadUserFleetData()}
        />

        <CarbonChart history={history} />
      </div>

      <FleetManager
        user={user}
        isOpen={isFleetModalOpen}
        onClose={() => setIsFleetModalOpen(false)}
        onVehicleAdded={() => loadUserFleetData()}
      />
    </main>
  );
}

// /src/app/page.jsx
'use client';

import { useState, useEffect } from 'react';
import Ticker from './components/Ticker';
import AuthScreen from './components/AuthScreen';
import FleetManager from './components/FleetManager';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import DashboardView from './components/DashboardView';
import FleetView from './components/FleetView';
import CorporateApiPanel from './components/CorporateApiPanel';
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

  // FIXED ACTION ROUTINE: Added an optional boolean parameter to check if this is an on-the-fly state refresh pass
  const loadData = async (isRefreshOnly = false) => {
    if (!user) return;
    try {
      const [prof, sub, cars, logs, tokenRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).maybeSingle(),
        supabase.from('user_subscriptions').select('tier, status, current_period_start').eq('user_id', user.id).eq('app_id', 'ecoroute').maybeSingle(),
        supabase.from('ecoroute_vehicles').select('*').eq('user_id', user.id).eq('is_active', true).order('created_at', { ascending: false }),
        supabase.from('ecoroute_emissions_logs').select('*').eq('user_id', user.id).order('emission_date', { ascending: false }),
        supabase.from('ecoroute_corporate_api_tokens').select('*').eq('user_id', user?.id).maybeSingle()
      ]);

      setProfile(prof.data);
      setSub(sub.data ? { tier: sub.data.tier, status: sub.data.status } : { tier: 'free', status: 'inactive' });
      setCustomVehicles(cars.data || []);

      const allLogs = logs.data || [];
      setRawLogsArray(allLogs);

      // FIXED SEPARATION: Only apply the initialization placeholder layout state if this is the first page load
      if (!isRefreshOnly) {
        if (tokenRes.data) {
          setEstimate({
            category_display: 'INITIALIZATION',
            tokenRecord: tokenRes.data
          });
        }
      } else {
        // If it is a refresh after a calculation, update the active token metrics inside your current report panel
        if (tokenRes.data && estimate && estimate.category_display !== 'INITIALIZATION') {
          setEstimate(prev => ({
            ...prev,
            tokenRecord: tokenRes.data
          }));
        }
      }

      // Chronological current-month date trimming layout grouping boundaries
      const today = new Date();
      const currentYear = today.getFullYear();
      const currentMonth = String(today.getMonth() + 1).padStart(2, '0');
      const lastDayInMonth = new Date(currentYear, today.getMonth() + 1, 0).getDate();

      const startBoundsStr = `${currentYear}-${currentMonth}-01`;
      const endBoundsStr = `${currentYear}-${currentMonth}-${String(lastDayInMonth).padStart(2, '0')}`;

      if (logs.data) {
        const currentMonthLogs = allLogs.filter(l => {
          const d = l.emission_date;
          return d && d >= startBoundsStr && d <= endBoundsStr;
        });

        setHistory(currentMonthLogs.map(l => ({
          carbon_kg: l.carbon_kg,
          estimated_at: l.emission_date
        })));
      }
    } catch (err) {
      console.error('EcoRoute core data load exception:', err);
    } finally {
      setLoading(false);
    }
  };

  // First page mount triggers normal initial loading
  useEffect(() => { if (user) loadData(false); }, [user]);

  async function handleCalculate(formPayload) {
    setCalcLoading(true);
    setErrorMsg('');

    try {
      const { data: currentSessionData } = await supabase.auth.getSession();
      let accessToken = currentSessionData?.session?.access_token || '';

      if (!accessToken) {
        const localSsoSessionString = window.localStorage.getItem('stims-enterprise-sso');
        if (localSsoSessionString) {
          const parsedSsoData = JSON.parse(localSsoSessionString);
          accessToken = parsedSsoData?.access_token || parsedSsoData?.currentSession?.access_token || '';
        }
      }

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

      // Update state directly from clean response return
      setEstimate(result.data);

      // FIXED: Pass true to let loadData know this is a refresh only, keeping your numbers visible
      await loadData(true);
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
          ) : activeViewPage === 'developer_api' ? (
            <CorporateApiPanel
              user={user}
              isPremium={isPremium}
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

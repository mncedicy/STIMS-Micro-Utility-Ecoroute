// src/app/utils/ecoroute/useEcoRouteData.js

'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../../lib/supabaseClient';

export function useEcoRouteData() {
    const [user, setUser] = useState(null);
    const [profile, setProfile] = useState(null);
    const [subscription, setSub] = useState({ tier: 'free', status: 'inactive' });
    const [customVehicles, setCustomVehicles] = useState([]);
    const [selectedCustomVehicle, setSelectedCustomVehicle] = useState('');
    const [isFleetModalOpen, setIsFleetModalOpen] = useState(false);
    const [distance, setDistance] = useState('');
    const [unit, setUnit] = useState('km');
    const [estimate, setEstimate] = useState(null);
    const [loading, setLoading] = useState(true);
    const [calcLoading, setCalcLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [activeViewPage, setActiveViewPage] = useState('dashboard');
    const [rawLogsArray, setRawLogsArray] = useState([]);
    const [showAuthGateModal, setShowAuthGateModal] = useState(false);
    const [isVerifiedRedirect, setIsVerifiedRedirect] = useState(false);
    const [activeApplicationMeta, setActiveApplicationMeta] = useState(null);
    const [tokenRecord, setTokenRecord] = useState(null);

    // Keep an active reference pointer to prevent rendering loop race conditions across async context fetches
    const selectedVehicleRef = useRef('');
    useEffect(() => {
        selectedVehicleRef.current = selectedCustomVehicle;
    }, [selectedCustomVehicle]);

    // Initial session loading controller pipeline
    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session }, error }) => {
            if (error) {
                console.error("[EcoRoute Session Lookup Error]:", error);
                setLoading(false);
                return;
            }
            setUser(session?.user || null);
            // CRITICAL PATCH: If no session exists at initialization, lift the gate immediately
            if (!session) {
                setLoading(false);
            }
        });

        const { data: { subscription: authListener } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user || null);
            // CRITICAL PATCH: If user signs out or has no session, unlock loading state
            if (!session) {
                setLoading(false);
            }
        });

        return () => authListener.unsubscribe();
    }, []);

    // FIXED DEPENDENCY BLOCK: Removed 'selectedCustomVehicle' to stop recursive memoization breaks
    const loadData = useCallback(
        async (isRefreshOnly = false) => {
            // CRITICAL PATCH: If data fetching fires without a session ID, release loading state to break out of the infinite screen hang
            if (!user?.id) {
                setLoading(false);
                return;
            }

            if (!isRefreshOnly) setLoading(true);
            try {
                const [cars, logs, sub, tokenRes, prof] = await Promise.all([
                    supabase.from('ecoroute_vehicles').select('*').eq('user_id', user.id).eq('is_active', true).order('created_at', { ascending: false }),
                    supabase.from('ecoroute_emissions_logs').select('*').eq('user_id', user.id).order('emission_date', { ascending: false }).order('created_at', { ascending: false }),
                    supabase.from('user_subscriptions').select('tier, status, current_period_start, current_period_end').eq('user_id', user.id).eq('app_id', 'ecoroute').maybeSingle(),
                    supabase.from('ecoroute_corporate_api_tokens').select('*').eq('user_id', user.id).maybeSingle(),
                    supabase.from('profiles').select('*').eq('id', user.id).maybeSingle()
                ]);


                setProfile(prof?.data || null);
                setSub(sub?.data ? { tier: sub.data.tier, status: sub.data.status, current_period_start: sub.data.current_period_start, current_period_end: sub.data.current_period_end } : { tier: 'free', status: 'inactive' });
                setCustomVehicles(cars?.data || []);
                setRawLogsArray(logs?.data || []);



                if (tokenRes?.data) {
                    setTokenRecord(tokenRes.data);
                }

                // FIXED CONDITION: Uses our non-reactive useRef pointer to assign the truck fallback value safely without re-triggering loadData
                if (cars?.data?.length > 0 && !selectedVehicleRef.current) {
                    setSelectedCustomVehicle(cars.data[0].id);
                }
            } catch (err) {
                console.error('EcoRoute core data load exception:', err);
                setErrorMsg('Network error synchronizing telemetry pipelines.');
            } finally {
                // Guaranteed safety release execution trigger
                setLoading(false);
            }
        },
        [user?.id] // Stable hook signature array bounds
    );

    useEffect(() => {
        if (user?.id) {
            loadData(false);
        }
    }, [user?.id, loadData]);

    async function handleCalculate(formPayload) {
        setCalcLoading(true);
        setErrorMsg('');
        try {
            const { data: session } = await supabase.auth.getSession();
            const token = session?.session?.access_token || '';

            const res = await fetch('/api/estimates', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formPayload)
            });

            const result = await res.json();
            if (!res.ok || result.error) {
                throw new Error(result.error || 'Server calculation fault.');
            }

            const nextData = result.data || result;
            setEstimate(nextData);

            if (nextData?.tokenRecord) {
                setTokenRecord(nextData.tokenRecord);
            }

            await loadData(true);
        } catch (err) {
            setErrorMsg(err.message || 'Processing parameter metrics failed.');
        } finally {
            setCalcLoading(false);
        }
    }

    const isPremium = subscription.tier === 'premium' && ['active', 'cancelling', 'non-renewing', 'non_renewing'].includes(subscription.status);
    const quotaReached = !isPremium && customVehicles.length >= 1;

    return {
        user, profile, subscription, customVehicles, selectedCustomVehicle, setSelectedCustomVehicle,
        isFleetModalOpen, setIsFleetModalOpen, distance, setDistance, unit, setUnit,
        estimate: estimate ? { ...estimate, tokenRecord: tokenRecord || estimate.tokenRecord } : (tokenRecord ? { tokenRecord } : null),
        loading, calcLoading, errorMsg, activeViewPage, setActiveViewPage, rawLogsArray,
        showAuthGateModal, setShowAuthGateModal, isVerifiedRedirect, activeApplicationMeta,
        loadData, handleCalculate, isPremium, quotaReached,
    };
}

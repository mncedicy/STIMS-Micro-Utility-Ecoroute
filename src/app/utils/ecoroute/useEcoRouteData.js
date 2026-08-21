// src/app/utils/ecoroute/useEcoRouteData.js

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { calculateEstimate } from './ecorouteHelpers';

export function useEcoRouteData() {
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
    const [isVerifiedRedirect, setIsVerifiedRedirect] = useState(false);

    // Keep a reference to current estimate to avoid re-triggering loadData on state changes
    const estimateRef = useRef(estimate);
    useEffect(() => {
        estimateRef.current = estimate;
    }, [estimate]);

    const [activeApplicationMeta, setActiveApplicationMeta] = useState({
        title: 'EcoRoute',
        tagline: 'FLEET CARBON ANALYTICS',
        category: 'LOGISTICS',
        description:
            'Automated mileage-to-emissions translation engine built specifically for independent local courier services seeking green compliance tax credits.',
        app_link: 'https://ecoroute.stims.co.za',
        monetization_type: 'Subscription',
        monetization_fee_display: 'R280 per month',
        usage_limit_free: 100,
        usage_limit_premium: 3000,
    });

    // Automatically open AuthScreen when user redirects from email verification
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        if (params.get('verified') === 'true') {
            setIsVerifiedRedirect(true);
            setShowAuthGateModal(true);

            // Clean up parameter from URL bar without a page refresh
            window.history.replaceState({}, document.title, window.location.pathname);
        }
    }, []);

    const syncState = useCallback(async () => {
        const {
            data: { session },
        } = await supabase.auth.getSession();
        if (session?.user) {
            setUser(session.user);
        } else {
            setUser(null);
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        syncState();
        const {
            data: { subscription: authSub },
        } = supabase.auth.onAuthStateChange((_, s) => {
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
    }, [syncState]);

    const loadData = useCallback(
        async (isRefreshOnly = false) => {
            try {
                const { data: appMetaRow } = await supabase
                    .from('applications')
                    .select('*')
                    .eq('app_id', 'ecoroute')
                    .maybeSingle();

                if (appMetaRow) {
                    setActiveApplicationMeta(appMetaRow);
                }

                const {
                    data: { session },
                } = await supabase.auth.getSession();
                const activeUser = session?.user;
                if (!activeUser) return;

                const [prof, sub, cars, logs, tokenRes] = await Promise.all([
                    supabase
                        .from('profiles')
                        .select('*')
                        .eq('id', activeUser.id)
                        .maybeSingle(),
                    supabase
                        .from('user_subscriptions')
                        .select(
                            'tier, status, current_period_start, current_period_end'
                        )
                        .eq('user_id', activeUser.id)
                        .eq('app_id', 'ecoroute')
                        .maybeSingle(),
                    supabase
                        .from('ecoroute_vehicles')
                        .select('*')
                        .eq('user_id', activeUser.id)
                        .eq('is_active', true)
                        .order('created_at', { ascending: false }),
                    supabase
                        .from('ecoroute_emissions_logs')
                        .select('*')
                        .eq('user_id', activeUser.id)
                        .order('emission_date', { ascending: false }),
                    supabase
                        .from('ecoroute_corporate_api_tokens')
                        .select('*')
                        .eq('user_id', activeUser.id)
                        .maybeSingle(),
                ]);

                setProfile(prof.data);

                setSub(
                    sub.data
                        ? {
                            tier: sub.data.tier,
                            status: sub.data.status,
                            current_period_start: sub.data.current_period_start,
                            current_period_end: sub.data.current_period_end,
                        }
                        : { tier: 'free', status: 'inactive' }
                );

                setCustomVehicles(cars.data || []);
                setRawLogsArray(logs.data || []);

                const currentEstimate = estimateRef.current;
                if (!isRefreshOnly && tokenRes.data) {
                    setEstimate({
                        category_display: 'INITIALIZATION',
                        tokenRecord: tokenRes.data,
                    });
                } else if (
                    isRefreshOnly &&
                    tokenRes.data &&
                    currentEstimate &&
                    currentEstimate.category_display !== 'INITIALIZATION'
                ) {
                    setEstimate((prev) => ({ ...prev, tokenRecord: tokenRes.data }));
                }
            } catch (err) {
                console.error('EcoRoute core data load exception:', err);
            } finally {
                setLoading(false);
            }
        },
        [] // Stable dependency array stops continuous refreshing
    );

    useEffect(() => {
        if (user?.id) loadData(false);
    }, [user?.id, loadData]);

    async function handleCalculate(formPayload) {
        setCalcLoading(true);
        setErrorMsg('');
        try {
            const data = await calculateEstimate(formPayload);
            setEstimate(data);
            await loadData(true);
        } catch (err) {
            setErrorMsg(err.message || 'Processing parameter metrics failed.');
        } finally {
            setCalcLoading(false);
        }
    }

    const isPremium =
        subscription.tier === 'premium' &&
        (subscription.status === 'active' ||
            subscription.status === 'cancelling' ||
            subscription.status === 'non-renewing' ||
            subscription.status === 'non_renewing');

    const quotaReached = !isPremium && customVehicles.length >= 1;

    return {
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
        loading,
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
    };
}
// src/app/components/emission/chart/CarbonChart.jsx

'use client';

import React, { useState } from 'react';
import CarbonChartBar from './CarbonChartBar';
import CarbonAdvisorCard from './CarbonAdvisorCard';
import CarbonChartFilters from './CarbonChartFilters';

// === INTERNAL MATRIX UTILITIES (Calculates trend metrics layout frameworks cleanly) ===
const fetchChronologicalDataMatrix = (logs = []) => {
    const dateMap = {};
    logs.forEach(log => {
        const dayKey = log.emission_date || (log.created_at ? log.created_at.split('T')[0] : new Date().toISOString().split('T')[0]);
        dateMap[dayKey] = (dateMap[dayKey] || 0) + parseFloat(log.carbon_kg || 0);
    });
    return Object.keys(dateMap)
        .sort((a, b) => new Date(a) - new Date(b))
        .map(date => ({
            label: new Date(date).toLocaleDateString('en-ZA', { day: '2-digit', month: 'short' }),
            value: dateMap[date],
            rawLabel: date
        }));
};

const fetchCategoryDataMatrix = (logs = []) => {
    const typeMap = { VEHICLE: 0, FLIGHT: 0, SHIPPING: 0, ELECTRICITY: 0, GAS: 0 };
    logs.forEach(log => {
        const cat = (log.category_display || 'VEHICLE').toUpperCase();
        if (typeMap[cat] !== undefined) typeMap[cat] += parseFloat(log.carbon_kg || 0);
    });
    return Object.keys(typeMap).map(type => ({
        label: type === 'ELECTRICITY' ? 'POWER' : type,
        value: typeMap[type]
    })).filter(item => item.value > 0);
};

export default function CarbonChart({ rawLogsArray = [] }) {
    // Structural Initial Calendar Boundary Matrix Calculations
    const getInitialDates = () => {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const lastDayNode = new Date(year, today.getMonth() + 1, 0).getDate();

        return {
            firstDay: `${year}-${month}-01`,
            lastDay: `${year}-${month}-${String(lastDayNode).padStart(2, '0')}`
        };
    };

    const dateBounds = getInitialDates();
    const todayMaxString = new Date().toISOString().split('T')[0];

    const [chartMode, setChartMode] = useState('date'); // 'date' or 'type'
    const [startDate, setStartDate] = useState(dateBounds.firstDay);
    const [endDate, setEndDate] = useState(dateBounds.lastDay);

    const safeLogsList = Array.isArray(rawLogsArray) ? rawLogsArray : [];

    // LINEAR BOUNDARY FILTER ENGINE: Filters chart array data prior to vector evaluations
    const filteredLogs = safeLogsList.filter(log => {
        const logDateString = log.emission_date || (log.created_at ? log.created_at.split('T')[0] : null);
        if (!logDateString) return false;

        const activeStart = startDate && startDate.trim() !== '' ? startDate : dateBounds.firstDay;
        const activeEnd = endDate && endDate.trim() !== '' ? endDate : dateBounds.lastDay;

        return logDateString >= activeStart && logDateString <= activeEnd;
    });

    const chronologicalPoints = fetchChronologicalDataMatrix(filteredLogs);
    const categoryPoints = fetchCategoryDataMatrix(filteredLogs);

    // Slit and slice display constraints adaptively based on selected calendar scopes
    const activePoints = chartMode === 'date'
        ? chronologicalPoints.slice(-10) // Show up to 10 points for optimal range adjustments
        : categoryPoints;

    const totalKg = filteredLogs.reduce((acc, curr) => acc + parseFloat(curr.carbon_kg || 0), 0);
    const avgKg = activePoints.length > 0 ? totalKg / activePoints.length : 0;
    const maxVal = activePoints.length > 0 ? Math.max(...activePoints.map(p => p.value), 10) : 100;

    const getSummaryAdviceString = () => {
        if (activePoints.length === 0) return "No verified operational greenhouse gas telemetry captured within this specified filter matrix.";

        if (chartMode === 'date') {
            const peak = [...activePoints].sort((a, b) => b.value - a.value)[0];
            if (!peak || peak.value === 0) return "Greenhouse gas emission curves are tracking smoothly within baseline constraints.";
            return `PEAK INTENSITY DETECTED: Operations on [${peak.label}] released ${peak.value.toLocaleString('en-ZA', { maximumFractionDigits: 1 })} KG CO₂e. ${peak.value > avgKg * 1.3
                ? "This sudden spike sits significantly above your moving timeline baseline. We recommend auditing land transport truck routing logs or consolidations for this day to mitigate carbon tax exposure parameters."
                : "Your timeline trajectory shows stable enterprise operational runs. Maintain current defensive route planning models."
                }`;
        }

        const topCat = [...categoryPoints].sort((a, b) => b.value - a.value)[0];
        if (!topCat || topCat.value === 0) return "No carbon footprint sector groupings detected.";

        let strategicInsight = `The [${topCat.label}] vector comprises your largest greenhouse gas exposure, accounting for ${topCat.value.toLocaleString('en-ZA', { maximumFractionDigits: 1 })} KG CO₂e. `;
        if (topCat.label === 'VEHICLE') strategicInsight += "Prioritize optimization workflows on high-multiplier land fleet assets by auditing trailing axle efficiencies and fuel parameters.";
        if (topCat.label === 'FLIGHT') strategicInsight += "Minimize short-haul corporate aviation segments by migrating cross-border enterprise collaboration pipelines to lower-impact digital environments.";
        if (topCat.label === 'POWER') strategicInsight += "High grid electricity loads detected. Consider scheduling energy-intensive logistics runs to off-peak slots to minimize regional grid impact.";
        if (topCat.label === 'GAS') strategicInsight += "High industrial combustion levels recorded. Recommend auditing thermal management variables or exploring low-emission alternatives.";
        if (topCat.label === 'SHIPPING') strategicInsight += "Deep-sea ocean cargo volume detected. Re-negotiate carrier distribution manifest schedules to flatten cross-border carbon load thresholds.";
        return strategicInsight;
    };

    return (
        <div className="p-5 bg-slate-900/40 border border-slate-900 rounded-xl font-mono text-xs space-y-4 md:col-span-2 group relative transition-all duration-300 stims-hover-glow">
            {/* Analytics Header Control Center Strip (Extracted Modular Panel) */}
            <CarbonChartFilters
                startDate={startDate}
                endDate={endDate}
                onStartDateChange={setStartDate}
                onEndDateChange={setEndDate}
                chartMode={chartMode}
                onChartModeChange={setChartMode}
                todayMaxString={todayMaxString}
            />

            {/* Chart Framework Grid Rendering Layout */}
            {safeLogsList.length > 0 && activePoints.length > 0 ? (
                <div className="space-y-4 animate-fade-in">
                    <div className="h-40 flex items-end justify-between gap-2 pt-6 px-4 bg-[#020617]/40 border border-slate-900 rounded-lg relative overflow-hidden">
                        {/* Subtle Horizontal Background Guideline Overlays */}
                        <div className="absolute inset-0 flex flex-col justify-between pointer-events-none px-2 py-4 opacity-[0.03]">
                            <div className="w-full border-b border-slate-100" />
                            <div className="w-full border-b border-slate-100" />
                            <div className="w-full border-b border-slate-100" />
                        </div>

                        {activePoints.map((point, idx) => (
                            <CarbonChartBar
                                key={idx}
                                point={point}
                                maxVal={maxVal}
                                totalKg={totalKg}
                            />
                        ))}
                    </div>

                    <div className="flex items-center justify-between text-[9px] text-slate-500 px-1 border-b border-slate-900 pb-3">
                        <span>GRID MAX CAPACITY BASING: {maxVal.toLocaleString('en-ZA', { maximumFractionDigits: 1 })} KG</span>
                        <div className="flex items-center space-x-1">
                            <span className="h-1.5 w-1.5 rounded-sm bg-blue-500" />
                            <span>CARBON MASS VOLUME (KG CO₂e)</span>
                        </div>
                    </div>

                    {/* Integrated Carbon Advisor Data Card Layout Module Connection */}
                    <CarbonAdvisorCard
                        adviceString={getSummaryAdviceString()}
                        totalKg={totalKg}
                        avgKg={avgKg}
                    />
                </div>
            ) : (
                <div className="text-center py-12 text-slate-600 text-xs border border-dashed border-slate-900 rounded-xl bg-slate-950/10 max-w-full uppercase tracking-wider text-[10px]">
                    ⚡ NO EMISSION RECORDS RECONCILED WITHIN THIS SPECIFIED CALENDAR WINDOW RANGE.
                </div>
            )}
        </div>
    );
}

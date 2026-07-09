'use client';

import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

export default function CarbonChart({ history }) {
    // Fallback placeholder timeline if no real calculation runs have occurred yet
    const defaultTimeline = [
        { name: 'Mon', CO2: 42 },
        { name: 'Tue', CO2: 38 },
        { name: 'Wed', CO2: 56 },
        { name: 'Thu', CO2: 48 },
        { name: 'Fri', CO2: 64 },
        { name: 'Sat', CO2: 22 },
        { name: 'Sun', CO2: 15 },
    ];

    // Map historical records if available, otherwise apply placeholder dataset
    const chartData = history && history.length > 0
        ? history.map((item, idx) => ({
            name: `Run ${idx + 1}`,
            CO2: item.carbon_kg
        }))
        : defaultTimeline;

    return (
        <div className="w-full bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-2xl space-y-4 col-span-1 md:col-span-2">
            <div className="border-b border-slate-800 pb-3 flex justify-between items-center">
                <div>
                    <h2 className="text-lg font-bold text-white tracking-tight">Emissions Analytics Profile</h2>
                    <p className="text-xs text-slate-400">Real-time cumulative tracking metrics (kg CO2)</p>
                </div>
                <div className="flex items-center space-x-2 text-[11px] font-mono bg-slate-950 px-2.5 py-1 rounded border border-slate-800 text-slate-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
                    <span>Active Feed</span>
                </div>
            </div>

            <div className="h-64 w-full pt-4">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorCO2" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                        <XAxis
                            dataKey="name"
                            stroke="#64748b"
                            fontSize={11}
                            tickLine={false}
                            axisLine={false}
                        />
                        <YAxis
                            stroke="#64748b"
                            fontSize={11}
                            tickLine={false}
                            axisLine={false}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: '#020617',
                                borderColor: '#334155',
                                borderRadius: '8px',
                                color: '#f8fafc',
                                fontSize: '12px'
                            }}
                        />
                        <Area
                            type="monotone"
                            dataKey="CO2"
                            stroke="#10b981"
                            strokeWidth={2}
                            fillOpacity={1}
                            fill="url(#colorCO2)"
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}

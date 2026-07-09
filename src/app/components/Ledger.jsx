'use client';

export default function Ledger({ estimate }) {
    return (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-2xl space-y-6 min-h-[340px] flex flex-col justify-between">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                    <h2 className="text-lg font-bold text-white tracking-tight">Audit Output Ledger</h2>
                    <p className="text-xs text-slate-400">Carbon metrics compliance summary</p>
                </div>
                <span className={`h-2 w-2 rounded-full ${estimate ? 'bg-emerald-500 animate-pulse' : 'bg-slate-700'}`} />
            </div>

            {estimate ? (
                <div className="space-y-5 flex-grow justify-center flex flex-col animate-fade-in">
                    <div className="grid grid-cols-2 gap-4 text-xs bg-slate-950/60 p-3 rounded-lg border border-slate-800/60">
                        <div>
                            <span className="text-slate-500 block">Category Focus:</span>
                            <span className="font-semibold text-blue-400 text-sm">{estimate.category_display}</span>
                        </div>

                        {estimate.vehicle_make && (
                            <>
                                <div>
                                    <span className="text-slate-500 block">Vehicle Profile:</span>
                                    <span className="font-semibold text-slate-200 text-sm">{estimate.vehicle_make} {estimate.vehicle_model}</span>
                                </div>
                                <div className="mt-1">
                                    <span className="text-slate-500 block">Total Audited Route:</span>
                                    <span className="font-semibold text-slate-200 text-sm">{estimate.distance_value} {estimate.distance_unit}</span>
                                </div>
                            </>
                        )}

                        {estimate.weight_value && (
                            <>
                                <div>
                                    <span className="text-slate-500 block">Manifest Weight:</span>
                                    <span className="font-semibold text-slate-200 text-sm">{estimate.weight_value} {estimate.weight_unit}</span>
                                </div>
                                <div className="mt-1">
                                    <span className="text-slate-500 block">Voyage Sector:</span>
                                    <span className="font-semibold text-slate-200 text-sm">{estimate.distance_value} {estimate.distance_unit}</span>
                                </div>
                            </>
                        )}

                        {estimate.airport_origin && (
                            <>
                                <div>
                                    <span className="text-slate-500 block">Flight Sector:</span>
                                    <span className="font-semibold text-slate-200 text-sm font-mono">{estimate.airport_origin} ➡️ {estimate.airport_destination}</span>
                                </div>
                                <div className="mt-1">
                                    <span className="text-slate-500 block">Manifest Pax:</span>
                                    <span className="font-semibold text-slate-200 text-sm">{estimate.passengers} Passenger(s)</span>
                                </div>
                            </>
                        )}
                    </div>

                    <div className="p-5 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                        <div className="flex justify-between items-baseline">
                            <span className="text-xs text-slate-400 font-semibold uppercase tracking-widest">Carbon Impact</span>
                            <span className="text-3xl font-black text-emerald-400 tracking-tight">{estimate.carbon_kg} kg</span>
                        </div>
                        <div className="text-xs text-slate-500 text-right font-mono">
                            {estimate.carbon_mt} MT | {estimate.carbon_g.toLocaleString()} Grams | {estimate.carbon_lb} lbs
                        </div>
                    </div>

                    {/* Clean, unblocked dynamic linking layout element */}
                    {estimate.supabase_id && (
                        <a
                            href={`/api/pdf/${estimate.supabase_id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full text-center bg-slate-950 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 text-emerald-400 rounded-lg py-2 text-xs font-semibold tracking-wide transition-colors flex items-center justify-center space-x-2 shadow-sm"
                        >
                            <span>📄</span>
                            <span>View & Print Compliance Certificate</span>
                        </a>
                    )}

                    <p className="text-[10px] text-slate-500 font-mono tracking-wider text-center mt-2">
                        SYSTEM GENERATED TIMELOG: {new Date(estimate.estimated_at).toLocaleTimeString()}
                    </p>
                </div>
            ) : (
                <div className="flex-grow flex flex-col items-center justify-center text-center p-6 border border-dashed border-slate-800 rounded-lg bg-slate-950/40">
                    <span className="text-2xl mb-1">📊</span>
                    <p className="text-xs text-slate-400 font-medium">Ledger Awaiting Core Metrics</p>
                    <p className="text-[11px] text-slate-500 max-w-[200px] mt-1">Configure flight, vehicle, or shipping data to populate database records.</p>
                </div>
            )}

            <footer className="text-[10px] text-slate-600 font-mono tracking-widest text-center border-t border-slate-800/60 pt-3">
                ECOROUTE • STIMS AUDIT FABRIC v4
            </footer>
        </div>
    );
}

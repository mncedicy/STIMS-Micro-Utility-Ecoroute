// src/app/components/Ledger.jsx
'use client';

export default function Ledger({ estimate, isPremium }) {
    return (
        <div className="stims-panel-card min-h-[318px] flex flex-col justify-between">
            <div className="flex items-center justify-between border-b border-slate-900 pb-2.5">
                <div>
                    <h3 className="text-sm font-bold text-white tracking-tight">Audit Output Ledger</h3>
                    <p className="text-[11px] text-slate-500 font-sans">Carbon footprint compliance registry summary</p>
                </div>
                <span className={`h-2 w-2 rounded-full ${estimate ? 'bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.5)] animate-pulse' : 'bg-slate-800'}`} />
            </div>

            {estimate ? (
                <div className="space-y-4 flex-grow justify-center flex flex-col pt-3 animate-fade-in">
                    <div className="grid grid-cols-2 gap-3 text-[11px] font-sans bg-[#020617]/60 p-3 rounded-lg border border-slate-900/60">
                        <div>
                            <span className="text-slate-500 block font-mono text-[9px] uppercase tracking-wider">Classification Framework:</span>
                            <span className="font-bold text-blue-400 font-mono text-[10px]">{estimate.category_display}</span>
                        </div>

                        {estimate.vehicle_make && (
                            <>
                                <div>
                                    <span className="text-slate-500 block font-mono text-[9px] uppercase tracking-wider">Vehicle Profile:</span>
                                    <span className="font-semibold text-slate-200">{estimate.vehicle_make} {estimate.vehicle_model}</span>
                                </div>
                                <div className="col-span-2 pt-1 border-t border-slate-900/40">
                                    <span className="text-slate-500 inline font-mono text-[9px] uppercase tracking-wider">Audited Sector: </span>
                                    <span className="font-mono text-slate-300 font-bold">{estimate.distance_value} {estimate.distance_unit}</span>
                                </div>
                            </>
                        )}

                        {estimate.weight_value && (
                            <>
                                <div>
                                    <span className="text-slate-500 block font-mono text-[9px] uppercase tracking-wider">Manifest Weight:</span>
                                    <span className="font-semibold text-slate-200">{estimate.weight_value} {estimate.weight_unit}</span>
                                </div>
                                <div className="col-span-2 pt-1 border-t border-slate-900/40">
                                    <span className="text-slate-500 inline font-mono text-[9px] uppercase tracking-wider">Voyage Bounds: </span>
                                    <span className="font-mono text-slate-300 font-bold">{estimate.distance_value} {estimate.distance_unit}</span>
                                </div>
                            </>
                        )}

                        {estimate.airport_origin && (
                            <>
                                <div className="col-span-2 flex justify-between items-center font-mono">
                                    <div>
                                        <span className="text-slate-500 block text-[9px] uppercase tracking-wider">Flight Sector Route:</span>
                                        <span className="font-bold text-slate-200 tracking-widest">{estimate.airport_origin} ➔ {estimate.airport_destination}</span>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-slate-500 block text-[9px] uppercase tracking-wider">Manifest Pax:</span>
                                        <span className="font-bold text-slate-200">{estimate.passengers} Pax</span>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                    <div className="p-4 bg-[#020617] rounded-xl border border-slate-900 flex justify-between items-baseline">
                        <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest">Total CO2e</span>
                        <div className="text-right">
                            <span className="text-2xl font-black font-mono text-emerald-400 tracking-tight">{estimate.carbon_kg} <span className="text-xs font-normal text-slate-500">kg</span></span>
                            <span className="block text-[9px] font-mono text-slate-600 uppercase mt-0.5">{estimate.carbon_mt} MT | {Number(estimate.carbon_g).toLocaleString()} g</span>
                        </div>
                    </div>

                    <div className="relative pt-1">
                        {isPremium ? (
                            <a href={`/api/pdf/${estimate.supabase_id}`} target="_blank" rel="noopener noreferrer" className="stims-btn-secondary w-full text-center">
                                📄 View Compliance Certificate
                            </a>
                        ) : (
                            <div className="bg-[#020617]/90 border border-slate-900/80 rounded-xl p-3 text-center space-y-1.5 relative overflow-hidden backdrop-blur-sm">
                                <p className="text-[11px] text-slate-500 font-sans leading-normal">
                                    🔒 Official PDF Green Audit Verification Certificates require an active Pro subscription.
                                </p>
                                <a href="http://localhost:3000/dashboard" className="inline-flex items-center text-[9px] font-mono font-black bg-blue-600 text-white py-1 px-2.5 rounded uppercase tracking-wider transition-colors hover:bg-blue-500">
                                    Unlock Access ➔
                                </a>
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <div className="flex-grow flex flex-col items-center justify-center text-center p-6 border border-dashed border-slate-900 bg-[#020617]/30 rounded-lg my-3">
                    <span className="text-xl mb-1 select-none">📊</span>
                    <p className="text-[11px] font-mono uppercase tracking-wider text-slate-500 font-bold">Ledger Idle</p>
                    <p className="text-[10px] text-slate-600 max-w-[220px] mt-0.5 leading-normal">Configure travel manifests inside dispatcher matrices to populate active log rows.</p>
                </div>
            )}

            <footer className="text-[9px] text-slate-600 font-mono tracking-widest text-center border-t border-slate-900/60 pt-2.5 mt-auto">
                stims.co.za // ecoroute_fabric_v4
            </footer>
        </div>
    );
}

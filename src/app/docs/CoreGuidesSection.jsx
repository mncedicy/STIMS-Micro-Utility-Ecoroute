// src/app/docs/CoreGuidesSection.jsx
'use client';

import React, { useState, useEffect } from 'react';
import { CORE_GUIDES } from './coreGuidesData';

export default function CoreGuidesSection() {
    const [origin, setOrigin] = useState('https://ecoroute.stims.co.za');

    useEffect(() => {
        if (typeof window !== 'undefined') {
            setOrigin(window.location.origin);
        }
    }, []);

    return (
        <>
            {Object.keys(CORE_GUIDES).map((key) => {
                const sec = CORE_GUIDES[key];
                return (
                    <section key={key} id={key} className="scroll-mt-20 border-b border-slate-900 pb-12 space-y-4 text-left font-mono">
                        <h1 className="text-lg font-bold uppercase tracking-wider text-slate-200 flex items-center space-x-2">
                            <span className="text-blue-500">#</span>
                            <span>{sec.title}</span>
                        </h1>
                        <p className="text-xs text-slate-400 leading-relaxed max-w-3xl font-sans">{sec.description}</p>

                        {sec.baseUrlDynamic && (
                            <div className="space-y-1.5 pt-1 max-w-3xl">
                                <span className="text-[9px] font-bold text-blue-400 uppercase tracking-widest block">Base URL</span>
                                <div className="bg-slate-950 border border-slate-900 p-3 rounded-lg">
                                    <code className="text-[11px] text-emerald-400 font-mono font-bold select-all block">
                                        {origin}
                                    </code>
                                </div>
                            </div>
                        )}

                        {sec.usage && <p className="text-[11px] text-slate-500 italic font-sans">{sec.usage}</p>}

                        {/* Render Error Types Matrix Roster List */}
                        {sec.errorTypes && (
                            <div className="space-y-2 pt-2 max-w-3xl">
                                <span className="text-[9px] font-bold text-rose-400 uppercase tracking-widest block">Standard Error Codes Roster</span>
                                <div className="grid grid-cols-1 gap-2">
                                    {sec.errorTypes.map((err, idx) => (
                                        <div key={idx} className="bg-slate-950/60 border border-slate-900 p-2.5 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                                            <span className="text-[10px] text-rose-400 font-bold shrink-0">{err.code}</span>
                                            <span className="text-[10px] text-slate-400 font-sans">{err.desc}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Render Webhook Events Explanations Roster List */}
                        {sec.webhookEvents && (
                            <div className="space-y-2 pt-2 max-w-3xl">
                                <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-widest block">Available Webhook Event Types</span>
                                <div className="grid grid-cols-1 gap-2">
                                    {sec.webhookEvents.map((wh, idx) => (
                                        <div key={idx} className="bg-slate-950/60 border border-slate-900 p-2.5 rounded-lg space-y-1">
                                            <span className="text-[10px] text-emerald-400 font-bold block">{wh.event}</span>
                                            <span className="text-[10px] text-slate-400 font-sans block leading-normal">{wh.desc}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {sec.code && (
                            <div className="bg-slate-950 border border-slate-900 p-3.5 rounded-lg overflow-x-auto shadow-sm max-w-3xl">
                                <pre className="text-[10px] text-blue-400 font-bold select-all whitespace-pre-wrap">{sec.code}</pre>
                            </div>
                        )}

                        {sec.codePayload && (
                            <div className="space-y-1.5 pt-2 max-w-3xl">
                                <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-widest block">{sec.payloadTitle || 'Example Response Payload'}</span>
                                <div className="bg-slate-950 border border-slate-900 p-3.5 rounded-lg overflow-x-auto shadow-sm">
                                    <pre className="text-[10px] text-emerald-400 font-mono whitespace-pre-wrap">{sec.codePayload}</pre>
                                </div>
                            </div>
                        )}
                    </section>
                );
            })}
        </>
    );
}

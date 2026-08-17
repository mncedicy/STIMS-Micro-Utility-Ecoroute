// src/app/docs/EndpointsSection.jsx
'use client';

import React from 'react';
import { API_ENDPOINTS } from './endpointsData';

export default function EndpointsSection() {
    return (
        <div className="space-y-16">
            <h2 className="text-[10px] font-black uppercase tracking-widest text-slate-500 border-b border-slate-900 pb-2">API Documentation Specifications Reference</h2>

            {API_ENDPOINTS.map((ep) => (
                <section key={ep.id} id={ep.id} className="scroll-mt-20 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start pt-4 pb-14 border-b border-slate-900/60 last:border-b-0">

                    {/* LEFT PART: Summary, parameters tables, download CSV links */}
                    <div className="lg:col-span-7 space-y-5">
                        <div className="space-y-2">
                            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider font-sans">{ep.name}</h3>
                            <p className="text-xs text-slate-400 leading-relaxed">{ep.description}</p>
                        </div>

                        {/* {ep.downloads && ep.downloads.length > 0 && (
                            <div className="flex flex-wrap gap-3 pt-1">
                                {ep.downloads.map((dl, dIdx) => (
                                    <a
                                        key={dIdx}
                                        href={dl.href}
                                        className="text-[10px] font-sans font-bold text-blue-400 hover:text-blue-300 border border-blue-900/40 bg-blue-950/20 px-3 py-1.5 rounded-md transition-colors"
                                    >
                                        {dl.label}
                                    </a>
                                ))}
                            </div>
                        )} */}

                        <div className="space-y-1.5">
                            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">HTTP Headers</span>
                            <div className="border border-slate-900 rounded-lg overflow-hidden text-[10px]">
                                <div className="bg-slate-900/40 p-2 flex font-bold text-slate-500 border-b border-slate-900 uppercase text-[8px] tracking-widest">
                                    <div className="w-1/3">Key</div>
                                    <div className="w-1/4">Type</div>
                                    <div className="w-5/12">Description</div>
                                </div>
                                {ep.headers.map((h, idx) => (
                                    <div key={idx} className="p-2 flex border-b border-slate-900/30 last:border-b-0 text-left items-center bg-slate-950/30">
                                        <div className="w-1/3 font-bold text-blue-400 truncate pr-1">{h.key}</div>
                                        <div className="w-1/4 text-slate-500 font-mono text-[9px]">{h.type}</div>
                                        <div className="w-5/12 text-slate-400 font-sans text-[10px] leading-tight">{h.desc}</div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Parameters</span>
                            <div className="border border-slate-900 rounded-lg overflow-hidden text-[10px]">
                                <div className="bg-slate-900/40 p-2 flex font-bold text-slate-500 border-b border-slate-900 uppercase text-[8px] tracking-widest">
                                    <div className="w-1/3">Field</div>
                                    <div className="w-1/4">Required</div>
                                    <div className="w-5/12">Description</div>
                                </div>
                                {ep.parameters.map((p, idx) => (
                                    <div key={idx} className="p-2 flex border-b border-slate-900/30 last:border-b-0 text-left items-start bg-slate-950/30">
                                        <div className="w-1/3 font-bold text-slate-200 truncate pr-1">{p.field}<span className="block text-[8px] text-slate-600 font-normal">{p.type}</span></div>
                                        <div className={`w-1/4 font-bold text-[9px] ${p.required === 'True' || p.required === true ? 'text-rose-500' : 'text-slate-500'}`}>{String(p.required)}</div>
                                        <div className="w-5/12 text-slate-400 font-sans text-[10px] leading-tight">{p.desc}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* RIGHT PART: Sticky Badging & Code Payloads list views mapping */}
                    <div className="lg:col-span-5 space-y-4 lg:sticky lg:top-20">
                        <div className="flex items-center space-x-2.5 bg-slate-900/80 p-2.5 rounded-lg border border-slate-800/80">
                            <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded uppercase tracking-wider shrink-0 ${ep.method === 'POST' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-blue-950 text-blue-400 border border-blue-800'
                                }`}>
                                {ep.method}
                            </span>
                            <code className="text-[11px] text-slate-100 font-bold tracking-wide select-all truncate">{ep.path}</code>
                        </div>

                        {ep.payloadSchemas && ep.payloadSchemas.length > 0 && (
                            <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1">
                                <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest block px-1">Request Payloads / Query Structure</span>
                                {ep.payloadSchemas.map((schema, sIdx) => (
                                    <div key={sIdx} className="space-y-1">
                                        <span className="text-[9px] font-sans font-bold text-slate-400 block px-1">{schema.label}</span>
                                        <div className="bg-slate-950 border border-slate-900 rounded-lg p-2.5 overflow-x-auto shadow-inner">
                                            <pre className="text-[9.5px] text-slate-400 font-mono whitespace-pre">{schema.code}</pre>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="space-y-1">
                            <span className="text-[8px] font-bold text-blue-400 uppercase tracking-widest block px-1">Response Envelope (200 OK Example)</span>
                            <div className="bg-slate-950 border border-slate-900 rounded-lg p-2.5 overflow-x-auto shadow-inner">
                                <pre className="text-[9.5px] text-emerald-400 font-mono whitespace-pre">{ep.response}</pre>
                            </div>
                        </div>
                    </div>

                </section>
            ))}
        </div>
    );
}

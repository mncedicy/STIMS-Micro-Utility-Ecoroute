// /src/app/components/ApiSnippetCard.jsx
'use client';

import React, { useState, useEffect } from 'react';
import ApiPayloads from './ApiPayloads';
import ApiFields from './ApiFields';

export default function ApiSnippetCard({ userId }) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [hostOrigin, setHostOrigin] = useState('https://stims.co.za');

    useEffect(() => {
        if (typeof window !== 'undefined') {
            setHostOrigin(window.location.origin);
        }
    }, []);

    return (
        <div className="bg-[#020617]/40 border border-slate-900 rounded-lg p-3 space-y-3 font-mono text-[10px] text-slate-400 leading-normal transition-all duration-300">
            <div className="flex items-center justify-between">
                <span className="text-blue-500 font-bold uppercase tracking-wider">DEVELOPER INTEGRATION SNIPPET</span>
                <button
                    type="button"
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="bg-slate-950 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 px-2 py-1 rounded text-[9px] font-bold uppercase tracking-wider transition-colors cursor-pointer select-none"
                >
                    {isExpanded ? 'Collapse Doc ▲' : 'View Full API Doc ▼'}
                </button>
            </div>

            <div className="space-y-1">
                <div><span className="text-emerald-500 font-bold">POST</span> {hostOrigin}/api/v1/logistics/audit</div>
                <div><span className="text-slate-500 font-bold">Headers:</span> Authorization: Bearer ecoroute_live_...</div>
            </div>

            {isExpanded && (
                <div className="space-y-4 pt-3 border-t border-slate-900/60 animate-fade-in font-mono text-[10px] overflow-y-auto max-h-[500px] scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
                    <div className="space-y-1">
                        <span className="text-slate-300 font-bold uppercase block tracking-wider">REQUIRED HEADERS</span>
                        <div className="bg-slate-950/60 p-2 border border-slate-900 rounded text-slate-400">
                            <div>Content-Type: application/json</div>
                            <div>Authorization: Bearer ecoroute_live_YOUR_SECRET_TOKEN</div>
                        </div>
                    </div>

                    <ApiPayloads />
                    <ApiFields userId={userId} />

                    <div className="space-y-1">
                        <span className="text-slate-300 font-bold uppercase block tracking-wider">EXPECTED JSON RESPONSE (200 OK)</span>
                        <pre className="bg-[#020617] p-2 border border-slate-900 rounded text-emerald-400 overflow-x-auto">
                            {`{\n  "success": true,\n  "status": "TRANSACTION_AUDIT_VERIFIED",\n  "timestamp": "2026-08-08T01:45:00.000Z",\n  "organization": "Your Enterprise Profile Name",\n  "quota_requests_remaining": 99942,\n  "metrics": {\n    "carbon_kg": 230.20,\n    "carbon_g": 230200,\n    "carbon_mt": 0.2302,\n    "carbon_lb": 507.5\n  },\n  "telemetry": {\n    "userAssignedDate": "2026-08-08",\n    "processedViaSecureTunnel": true\n  },\n  "record": {\n    "id": "c7b508f2-11da-4bc3-9fae-cc9231f82110"\n  }\n}`}
                        </pre>
                    </div>
                </div>
            )}
        </div>
    );
}

'use client';

export default function Ticker() {
    const alerts = [
        "FLEET NOTICE: Toyota Hilux Route optimization saved 14.2kg CO2 this morning.",
        "COMPLIANCE ALERT: SARS Carbon Tax limit approaches for Fleet Zone B.",
        "SYSTEM STATUS: Local Carbon Interface Mock engine operational on Port 4000.",
        "LOGISTICS LOG: Johannesburg to Durban freight run audited successfully.",
    ];

    return (
        <div className="w-full bg-slate-900/60 border-y border-slate-800/80 py-3 overflow-hidden backdrop-blur-sm fixed top-0 left-0 z-50">
            <div className="animate-ticker space-x-12">
                {[...alerts, ...alerts].map((alert, index) => (
                    <span key={index} className="text-xs font-mono tracking-wider text-emerald-400 font-medium whitespace-nowrap">
                        ⚡ {alert}
                    </span>
                ))}
            </div>
        </div>
    );
}

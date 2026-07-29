// /src/app/components/SearchableDropdownField.jsx
'use client';

import React, { useState, useEffect, useRef } from 'react';

export default function SearchableDropdownField({
    label,
    placeholder,
    valueDisplay,
    searchPlaceholder,
    items = [],
    disabled = false,
    isOpen = false,
    onToggle,
    onSelect,
    renderItem
}) {
    const [searchQuery, setSearchQuery] = useState('');
    const dropdownRef = useRef(null);

    // Filter items based on custom search input query text (handles strings and complex object items safely)
    const filteredItems = items.filter(item => {
        const matchString = typeof item === 'string' ? item : JSON.stringify(item);
        return matchString.toLowerCase().includes(searchQuery.toLowerCase().trim());
    });

    // Reset search query state when the dropdown is dismissed
    useEffect(() => {
        if (!isOpen) setSearchQuery('');
    }, [isOpen]);

    return (
        <div ref={dropdownRef} className="flex flex-col space-y-1 relative">
            <label className="text-slate-400 text-[11px] uppercase tracking-wider font-bold">{label}</label>

            <div
                onClick={() => !disabled && onToggle()}
                className={`w-full border rounded-lg px-3 py-2 flex justify-between items-center transition-all ${disabled
                    ? 'bg-slate-950/40 border-slate-900 opacity-40 cursor-not-allowed'
                    : 'bg-slate-950 border-slate-800 cursor-pointer hover:border-slate-700'
                    }`}
            >
                <span className={valueDisplay ? 'text-slate-200 truncate pr-2 max-w-full block' : 'text-slate-600 truncate pr-2 max-w-full block'}>
                    {valueDisplay || placeholder}
                </span>
                <span className="text-[9px] text-slate-600 transition-transform duration-200 select-none" style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>▼</span>
            </div>

            {isOpen && !disabled && (
                <div className="absolute top-[58px] left-0 right-0 bg-slate-950 border border-slate-800 rounded-lg shadow-2xl p-2 z-50 space-y-2 animate-fade-in max-h-[220px] overflow-y-auto">
                    <input
                        type="text"
                        placeholder={searchPlaceholder}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        className="w-full bg-slate-900 border border-slate-800 rounded p-1.5 text-xs text-slate-200 outline-none focus:border-blue-500 placeholder:text-slate-700 font-mono"
                        autoFocus
                    />
                    <div className="divide-y divide-slate-900/60 max-h-[140px] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-800">
                        {filteredItems.map((item, idx) => (
                            <div
                                key={idx}
                                onClick={() => { onSelect(item); onToggle(); }}
                                className="p-2 hover:bg-blue-950/40 text-slate-300 hover:text-white cursor-pointer transition-colors font-mono text-[11px] break-words"
                            >
                                {renderItem ? renderItem(item) : item}
                            </div>
                        ))}
                        {filteredItems.length === 0 && (
                            <div className="p-2 text-slate-700 text-center uppercase text-[10px]">No records matched</div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

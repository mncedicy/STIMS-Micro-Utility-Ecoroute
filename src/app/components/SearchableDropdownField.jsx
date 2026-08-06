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
    renderItem,
    onSearchChange, // Handler for server-side queries
    onLoadMore,     // Handler for server-side infinite scroll pagination
    loading = false
}) {
    const [searchQuery, setSearchQuery] = useState('');
    const dropdownRef = useRef(null);
    const scrollContainerRef = useRef(null);

    // Filter items locally ONLY if no backend/server search handler is wired up
    const filteredItems = onSearchChange
        ? items
        : items.filter(item => {
            const matchString = typeof item === 'string' ? item : JSON.stringify(item);
            return matchString.toLowerCase().includes(searchQuery.toLowerCase().trim());
        });

    // Fire backend queries when text updates
    const handleInputChange = (e) => {
        const val = e.target.value;
        setSearchQuery(val);
        if (onSearchChange) {
            onSearchChange(val);
        }
    };

    // Track when scrolling hits the bottom of the dropdown list container panel
    const handleScroll = (e) => {
        if (!onLoadMore || loading) return;
        const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;

        // Triggers pagination fetch slightly before hitting absolute bottom pixels
        if (scrollHeight - scrollTop <= clientHeight + 15) {
            onLoadMore(searchQuery);
        }
    };

    // Reset search query state when the dropdown is dismissed
    useEffect(() => {
        if (!isOpen) setSearchQuery('');
    }, [isOpen]);

    // Handle clicking outside to close the dropdown
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (isOpen && dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                onToggle();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen, onToggle]);

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
                <div className="absolute top-[58px] left-0 right-0 bg-slate-950 border border-slate-800 rounded-lg shadow-2xl p-2 z-50 space-y-2 animate-fade-in max-h-[220px]">
                    <input
                        type="text"
                        placeholder={searchPlaceholder}
                        value={searchQuery}
                        onChange={handleInputChange}
                        onClick={(e) => e.stopPropagation()}
                        className="w-full bg-slate-900 border border-slate-800 rounded p-1.5 text-xs text-slate-200 outline-none focus:border-blue-500 placeholder:text-slate-700 font-mono"
                        autoFocus
                    />
                    <div
                        ref={scrollContainerRef}
                        onScroll={handleScroll}
                        className="divide-y divide-slate-900/60 max-h-[140px] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-800"
                    >
                        {filteredItems.map((item, idx) => (
                            <div
                                key={idx}
                                onClick={() => { onSelect(item); onToggle(); }}
                                className="p-2 hover:bg-blue-950/40 text-slate-300 hover:text-white cursor-pointer transition-colors font-mono text-[11px] break-words"
                            >
                                {renderItem ? renderItem(item) : item}
                            </div>
                        ))}
                        {filteredItems.length === 0 && !loading && (
                            <div className="p-2 text-slate-700 text-center uppercase text-[10px]">No records matched</div>
                        )}
                        {loading && (
                            <div className="p-2 text-blue-500 text-center uppercase text-[9px] font-bold tracking-widest animate-pulse">Streaming records...</div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

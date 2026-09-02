// src/app/components/shared/SearchableDropdownField.jsx

'use client';

import React, { useState } from 'react';

export default function SearchableDropdownField({
    label,
    options,
    items,
    selectedValue,
    valueDisplay,
    onSelect,
    isOpen: externalIsOpen,
    onToggle,
    placeholder = 'Select...',
    searchPlaceholder = 'Search...',
    disabled = false,
    className = '',
    renderItem,
    filterPredicate,
    onSearchChange,
    onLoadMore,
    loading = false
}) {
    const [internalIsOpen, setInternalIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const isDropdownOpen = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen;

    const handleToggle = () => {
        if (disabled) return;
        if (typeof onToggle === 'function') {
            onToggle();
        } else {
            setInternalIsOpen((prev) => !prev);
        }
    };

    // Normalize incoming data (accepts `items` or `options`)
    const rawData = items || options || [];
    const safeData = Array.isArray(rawData) ? rawData : [];

    // Search query change handler
    const handleInputChange = (e) => {
        const query = e.target.value;
        setSearchTerm(query);

        if (typeof onSearchChange === 'function') {
            onSearchChange(query);
        }
    };

    // Filter items client-side (unless server-side search is handled by onSearchChange)
    const filteredItems = safeData.filter((opt) => {
        if (typeof onSearchChange === 'function') return true;
        if (!searchTerm || !searchTerm.trim()) return true;

        const query = searchTerm.toLowerCase().trim();

        if (typeof filterPredicate === 'function') {
            return filterPredicate(opt, query);
        }

        if (typeof renderItem === 'function') {
            const renderedText = String(renderItem(opt) || '').toLowerCase();
            return renderedText.includes(query);
        }

        const rawLabel = typeof opt === 'object' && opt !== null ? (opt.label || opt.name) : opt;
        const rawValue = typeof opt === 'object' && opt !== null ? opt.value : opt;

        const labelText = String(rawLabel ?? '').toLowerCase();
        const valueText = String(rawValue ?? '').toLowerCase();

        return labelText.includes(query) || valueText.includes(query);
    });

    const handleSelectOption = (item) => {
        if (disabled) return;

        // 1. Clear search input
        setSearchTerm('');

        // 2. Always close internal state first (fixes Year, Make, Model cascade)
        setInternalIsOpen(false);

        // 3. Trigger external toggle callback if parent controls dropdown state
        if (typeof onToggle === 'function') {
            onToggle();
        }

        // 4. Send payload to parent selector
        if (typeof onSelect === 'function') {
            const isStandardOption = typeof item === 'object' && item !== null && 'value' in item && 'label' in item;
            const payload = isStandardOption ? item.value : item;
            onSelect(payload);
        }
    };

    const getDisplayLabel = () => {
        if (valueDisplay) return valueDisplay;

        const currentSelectedOpt = safeData.find((opt) => {
            const val = typeof opt === 'object' && opt !== null ? opt.value : opt;
            return String(val ?? '') === String(selectedValue ?? '');
        });

        if (currentSelectedOpt) {
            if (typeof renderItem === 'function') return renderItem(currentSelectedOpt);
            if (typeof currentSelectedOpt === 'object' && currentSelectedOpt !== null) {
                return currentSelectedOpt.label || currentSelectedOpt.name || currentSelectedOpt.value;
            }
            return String(currentSelectedOpt);
        }

        return selectedValue || placeholder;
    };

    const displayLabel = getDisplayLabel();
    const hasSelection = Boolean(valueDisplay || selectedValue);

    return (
        <div className={`relative w-full text-left font-mono text-xs select-none ${className}`}>
            {label && (
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    {label}
                </label>
            )}

            {/* Dropdown Header Trigger */}
            <div
                onClick={handleToggle}
                className={`w-full border rounded-lg px-3 py-2 flex justify-between items-center transition-all ${disabled
                    ? 'bg-slate-950/40 border-slate-900 opacity-40 cursor-not-allowed'
                    : 'bg-slate-950 border-slate-800 cursor-pointer hover:border-slate-700'
                    }`}
            >
                <span className={hasSelection ? 'text-slate-200 font-semibold truncate' : 'text-slate-500 truncate'}>
                    {displayLabel}
                </span>
                <span className="text-[10px] text-slate-500 ml-2 shrink-0">
                    {isDropdownOpen ? '▲' : '▼'}
                </span>
            </div>

            {/* Dropdown Menu Panel */}
            {isDropdownOpen && !disabled && (
                <div className="absolute z-50 left-0 right-0 mt-1 bg-slate-950 border border-blue-900/60 rounded-lg shadow-2xl p-2 space-y-2">
                    {/* Search Input Box */}
                    <input
                        type="text"
                        autoFocus
                        value={searchTerm}
                        onChange={handleInputChange}
                        placeholder={searchPlaceholder}
                        className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                    />

                    {/* Scrollable List */}
                    <div className="max-h-48 overflow-y-auto space-y-0.5 custom-scrollbar">
                        {loading && (
                            <div className="p-2 text-center text-[10px] text-blue-400 font-mono animate-pulse bg-blue-950/20 rounded border border-blue-900/30">
                                SEARCHING DATABASE...
                            </div>
                        )}

                        {!loading && filteredItems.length > 0 ? (
                            <>
                                {filteredItems.map((item, idx) => {
                                    let labelText = '';
                                    if (typeof renderItem === 'function') {
                                        labelText = renderItem(item);
                                    } else if (typeof item === 'object' && item !== null) {
                                        labelText = item.label || item.name || String(item.value ?? '');
                                    } else {
                                        labelText = String(item);
                                    }

                                    const itemValue = typeof item === 'object' && item !== null && 'value' in item ? item.value : item;
                                    const isSelected = selectedValue !== undefined && String(itemValue ?? '') === String(selectedValue ?? '');

                                    return (
                                        <div
                                            key={item?.id || idx}
                                            onClick={() => handleSelectOption(item)}
                                            className={`px-2.5 py-1.5 rounded cursor-pointer transition-colors text-xs ${isSelected
                                                ? 'bg-blue-600/30 text-blue-400 font-bold'
                                                : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                                                }`}
                                        >
                                            {labelText}
                                        </div>
                                    );
                                })}

                                {typeof onLoadMore === 'function' && (
                                    <button
                                        type="button"
                                        onClick={() => onLoadMore(searchTerm)}
                                        className="w-full py-1.5 mt-1 text-center text-[10px] text-blue-400 hover:bg-blue-950/50 rounded transition-colors uppercase font-bold"
                                    >
                                        Load More Results...
                                    </button>
                                )}
                            </>
                        ) : (
                            !loading && (
                                <div className="p-3 text-center text-[10px] text-slate-600 uppercase tracking-widest font-mono">
                                    NO RECORDS MATCHED
                                </div>
                            )
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
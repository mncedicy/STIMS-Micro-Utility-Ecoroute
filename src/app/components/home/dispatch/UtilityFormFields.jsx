// src/app/components/home/dispatch/UtilityFormFields.jsx

'use client';

import React from 'react';
import SearchableDropdownField from '../../shared/SearchableDropdownField';

export default function UtilityFormFields({
    activeTab,
    electricityKwh,
    setElectricityKwh,
    countryCode,
    setCountryCode,
    gasQuantity,
    setGasQuantity,
    gasType,
    setGasType,
    gasUnit,
    setGasUnit,
    dbCountriesList = [],
    openDropdownKey,
    setOpenDropdownKey
}) {
    if (!['electricity', 'gas'].includes(activeTab)) return null;

    const selectedCountryNode = dbCountriesList?.find(c => c.code?.toLowerCase() === countryCode?.toLowerCase());
    const countryDisplayLabel = selectedCountryNode
        ? `${selectedCountryNode.name} (${selectedCountryNode.code.toUpperCase()})`
        : countryCode;

    return (
        <>
            {activeTab === 'electricity' && (
                <div className="space-y-4 animate-fade-in font-mono text-xs">
                    {/* UNIFIED DESIGN HEADER ROW */}
                    <div className="p-3 bg-blue-950/20 border border-blue-900/40 rounded-lg text-slate-400 text-[11px] leading-relaxed font-sans normal-case">
                        <strong className="text-blue-400 font-mono text-[10px] tracking-wider uppercase block mb-1">
                            ⚡ UTILITY GRID ELECTRICITY FOOTPRINT CALCULATOR
                        </strong>
                        Measures Scope 2 indirect carbon intensity configurations derived from regional power grid consumptions.
                    </div>

                    <div className="grid grid-cols-2 gap-2 items-start">
                        <div>
                            <label className="block text-slate-400 mb-1 text-[11px] uppercase tracking-wider font-bold">ENERGY CONSUMED (KWH)</label>
                            <input
                                type="number"
                                step="any"
                                value={electricityKwh}
                                onChange={(e) => setElectricityKwh(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500 font-mono text-xs"
                                required
                            />
                        </div>
                        <div className="relative">
                            <SearchableDropdownField
                                label="GRID REGION"
                                placeholder="Select Country..."
                                valueDisplay={countryDisplayLabel}
                                searchPlaceholder="Type country name or code..."
                                items={dbCountriesList}
                                isOpen={openDropdownKey === 'country'}
                                onToggle={() => setOpenDropdownKey(openDropdownKey === 'country' ? null : 'country')}
                                onSelect={(country) => setCountryCode(country.code)}
                                renderItem={(country) => `${country.name} (${country.code.toUpperCase()})`}
                            />
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'gas' && (
                <div className="space-y-4 animate-fade-in font-mono text-xs">
                    {/* UNIFIED DESIGN HEADER ROW */}
                    <div className="p-3 bg-blue-950/20 border border-blue-900/40 rounded-lg text-slate-400 text-[11px] leading-relaxed font-sans normal-case">
                        <strong className="text-blue-400 font-mono text-[10px] tracking-wider uppercase block mb-1">
                            🔥 STATIONARY COMBUSTION FUEL PROPERTY ANALYTICS
                        </strong>
                        Evaluates thermodynamic carbon footprint impacts across various industrial manufacturing properties or heating fuels.
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <label className="block text-slate-400 mb-1 text-[11px] uppercase tracking-wider font-bold">GAS PROPERTIES</label>
                            <select
                                value={gasType}
                                onChange={(e) => {
                                    setGasType(e.target.value);
                                    setGasUnit(e.target.value === 'NATURAL_GAS' ? 'm3' : 'liter');
                                }}
                                className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500 cursor-pointer font-mono"
                            >
                                <option value="NATURAL_GAS">NATURAL GAS</option>
                                <option value="LPG">LPG / PROPANE</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-slate-400 mb-1 text-[11px] uppercase tracking-wider font-bold">GAS MEASURE UNIT</label>
                            <select
                                value={gasUnit}
                                onChange={(e) => setGasUnit(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500 cursor-pointer font-mono"
                            >
                                {gasType === 'NATURAL_GAS' ? (
                                    <>
                                        <option value="m3">M³ (VOLUME)</option>
                                        <option value="kwh">KWH (ENERGY)</option>
                                    </>
                                ) : (
                                    <>
                                        <option value="liter">LITERS (VOL)</option>
                                        <option value="kg">KG (MASS)</option>
                                    </>
                                )}
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="block text-slate-400 mb-1 text-[11px] uppercase tracking-wider font-bold">QUANTITY FUEL BURNED</label>
                        <input
                            type="number"
                            step="any"
                            value={gasQuantity}
                            onChange={(e) => setGasQuantity(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500 font-mono"
                            required
                        />
                    </div>
                </div>
            )}
        </>
    );
}

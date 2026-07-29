// /src/app/components/UtilityFormFields.jsx
'use client';

import React from 'react';
import SearchableDropdownField from './SearchableDropdownField';

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

    // Resolve matching display string layout label based on the active country code context
    const selectedCountryNode = dbCountriesList?.find(c => c.code?.toLowerCase() === countryCode?.toLowerCase());
    const countryDisplayLabel = selectedCountryNode
        ? `${selectedCountryNode.name} (${selectedCountryNode.code.toUpperCase()})`
        : countryCode;

    return (
        <>
            {/* BLOCK SUBFORM: Grid electricity calculation fields setup */}
            {activeTab === 'electricity' && (
                /* MODIFIED: Changed layout from grid-cols-3 to grid-cols-2 ensuring equal width distribution */
                <div className="grid grid-cols-2 gap-2 animate-fade-in font-mono text-xs items-start">
                    {/* MODIFIED: Removed col-span-2 to let columns stretch 50/50 evenly inside the parent frame */}
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
                    {/* Searchable dropdown picker container takes up the second equal 50% grid block slot */}
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
            )}

            {/* BLOCK SUBFORM: Gas combustion fuel properties setup fields */}
            {activeTab === 'gas' && (
                <div className="space-y-3 animate-fade-in font-mono text-xs">
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

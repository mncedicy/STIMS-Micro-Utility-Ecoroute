// /src/app/components/AuditSubmitButton.jsx
'use client';

import React from 'react';

export default function AuditSubmitButton({ loading }) {
    return (
        <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-4 rounded transition-all uppercase text-[11px] tracking-widest disabled:opacity-50 shadow-[0_0_20px_rgba(37,99,235,0.2)] hover:shadow-[0_0_25px_rgba(59,130,246,0.4)] stims-hover-glow cursor-pointer text-center"
        >
            {loading ? 'CALCULATING EMISSIONS...' : 'EXECUTE LOGISTICS AUDIT'}
        </button>
    );
}

// /src/app/components/SystemDialogModal.jsx
'use client';

import React from 'react';

export default function SystemDialogModal({
    isOpen,
    status = 'blue', // 'green' | 'red' | 'blue'
    title,
    message,
    confirmText = 'CONFIRM',
    cancelText = 'CANCEL',
    onConfirm,
    onCancel
}) {
    if (!isOpen) return null;

    const statusColors = {
        green: 'bg-green-500',
        red: 'bg-red-500',
        blue: 'bg-blue-500'
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-start justify-center p-4 pt-20 bg-slate-950/80 backdrop-blur-md animate-fade-in font-mono text-xs">
            <div className="w-full max-w-sm p-5 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl space-y-4 mx-auto">

                {/* Modal Header */}
                <div className="flex items-center space-x-2 border-b border-slate-800 pb-2.5">
                    <div className={`h-1.5 w-1.5 rounded-full animate-pulse ${statusColors[status] || statusColors.blue}`} />
                    <h4 className="text-[11px] font-bold text-slate-200 uppercase tracking-widest">
                        {title}
                    </h4>
                </div>

                {/* Modal Content */}
                <div className="text-xs space-y-2 text-slate-400 leading-relaxed">
                    <p className="font-bold text-slate-200">{message}</p>
                </div>

                {/* Action Interface Footer Grid */}
                <div className="flex space-x-2 pt-2 text-[10px]">
                    {onCancel ? (
                        <>
                            <button
                                type="button"
                                onClick={onCancel}
                                className="flex-1 bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200 py-2 rounded transition-colors uppercase tracking-wider font-bold"
                            >
                                {cancelText}
                            </button>
                            <button
                                type="button"
                                onClick={onConfirm}
                                className="flex-1 bg-red-950/40 border border-red-700 text-red-400 hover:bg-red-700 hover:text-white font-bold py-2 rounded transition-all uppercase tracking-wider"
                            >
                                {confirmText}
                            </button>
                        </>
                    ) : (
                        <button
                            type="button"
                            onClick={onConfirm}
                            className="w-full bg-slate-950 border border-slate-800 text-blue-400 hover:text-blue-300 py-2 rounded transition-colors uppercase tracking-wider font-bold text-center"
                        >
                            ACKNOWLEDGE
                        </button>
                    )}
                </div>

            </div>
        </div>
    );
}

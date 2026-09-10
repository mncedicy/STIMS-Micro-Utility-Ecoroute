// src/app/components/emission/EmissionView.js

'use client';

import React, { useState } from 'react';
import FleetHeader from './EmissionHeader';
import CarbonChart from './chart/CarbonChart';
import LogHistoryManager from './log/LogHistoryManager';
import CsvUploader from './CsvUploader';
import ExportHistoryViewer from './export/ExportHistoryViewer';
import { useSubscriptionActions } from '../../hooks/useSubscriptionActions';
import { chargeTokenForBackup } from '../../actions/backup';

export default function EmissionView({ user, customVehicles = [], rawLogsArray = [], loadData, setIsFleetModalOpen, subscription }) {
    // Destructure handlePrimaryClickButton from the hook and alias it to upgradePlan
    const { isPending, handlePrimaryClickButton: upgradePlan } = useSubscriptionActions(user, subscription, loadData);
    const [localError, setLocalError] = useState('');

    const handleBackupDownload = async () => {
        setLocalError('');
        const userId = user?.id || user?.user?.id;

        if (!userId) {
            setLocalError('⚠️ Missing active tracking credentials.');
            return;
        }

        try {
            // Validate and subtract 1 corporate quota token before allowing raw extraction
            const verification = await chargeTokenForBackup(userId);

            if (!verification.success) {
                setLocalError(`⚠️ RESOURCE EXHAUSTED: ${verification.error}`);
                return;
            }

            // Client-side local serialization continues safely only on success
            const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({ vehicles: customVehicles, logs: rawLogsArray }, null, 2));
            const downloadAnchor = document.createElement('a');
            downloadAnchor.setAttribute("href", dataStr);
            downloadAnchor.setAttribute("download", "ecoroute_backup_ledger.json");
            document.body.appendChild(downloadAnchor);
            downloadAnchor.click();
            downloadAnchor.remove();
        } catch (err) {
            console.error(err);
            setLocalError('⚠️ An unexpected exception disrupted the data download.');
        }
    };

    return (
        <div className="space-y-6 w-full font-mono animate-fade-in relative">
            {/* Mounted modularized action bar engine header */}
            <FleetHeader
                handleBackupDownload={handleBackupDownload}
            />

            {localError && (
                <div className="p-3 text-xs bg-rose-950/20 border border-rose-900/40 text-rose-400 font-mono rounded-lg shadow-sm">
                    {localError}
                </div>
            )}

            <CsvUploader onUploadSuccess={() => loadData(true)} />
            <LogHistoryManager user={user} customVehicles={customVehicles} rawLogsArray={rawLogsArray} />
            <CarbonChart rawLogsArray={rawLogsArray} />

            {/* Mount the interactive export history audit trail component seamlessly */}
            <ExportHistoryViewer user={user} customVehicles={customVehicles} />
        </div>
    );
}

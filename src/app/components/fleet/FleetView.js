// src\app\components\fleet\FleetView.js

'use client';

import React from 'react';
import FleetHeader from './FleetHeader';
import FleetList from './asset/FleetAssetList';
import CarbonChart from './CarbonChart';
import LogHistoryManager from './log/LogHistoryManager';
import CsvUploader from './CsvUploader';
import { useSubscriptionActions } from '../../hooks/useSubscriptionActions';

export default function FleetView({ user, customVehicles = [], rawLogsArray = [], loadData, setIsFleetModalOpen, subscription }) {
    // Destructure handlePrimaryClickButton from the hook and alias it to upgradePlan
    const { isPending, handlePrimaryClickButton: upgradePlan } = useSubscriptionActions(user, subscription, loadData);

    const isPremium = subscription?.tier === 'premium' && (subscription?.status === 'active' || subscription?.status === 'cancelling');
    const freeTierLimitReached = !isPremium && customVehicles.length >= 1;

    const handleBackupDownload = () => {
        try {
            const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({ vehicles: customVehicles, logs: rawLogsArray }, null, 2));
            const downloadAnchor = document.createElement('a');
            downloadAnchor.setAttribute("href", dataStr);
            downloadAnchor.setAttribute("download", "ecoroute_backup_ledger.json");
            document.body.appendChild(downloadAnchor);
            downloadAnchor.click();
            downloadAnchor.remove();
        } catch (err) {
            console.error(err);
        }
    };

    const handleAddNewVehicleClick = () => {
        setIsFleetModalOpen(true);
    };

    return (
        <div className="space-y-6 w-full font-mono animate-fade-in relative">
            {/* Mounted modularized action bar engine header */}
            <FleetHeader
                freeTierLimitReached={freeTierLimitReached}
                handleBackupDownload={handleBackupDownload}
                handleAddNewVehicleClick={handleAddNewVehicleClick}
                handleUpgradePlanAction={upgradePlan}
                isPending={isPending}
            />

            <CsvUploader onUploadSuccess={() => loadData(true)} />
            <FleetList customVehicles={customVehicles} onVehicleDeleted={loadData} isPremium={isPremium} />
            <LogHistoryManager user={user} customVehicles={customVehicles} rawLogsArray={rawLogsArray} />
            <CarbonChart rawLogsArray={rawLogsArray} />
        </div>
    );
}

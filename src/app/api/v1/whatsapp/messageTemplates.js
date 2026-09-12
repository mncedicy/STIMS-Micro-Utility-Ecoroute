// File Location: src/app/api/v1/whatsapp/messageTemplates.js

export function buildAuditCardString(userName, categoryTitle, inputTrace, conversions, capacity, usage) {
    return `🌱 *EcoRoute Audit Verified* 🌱\n\n` +
        `👤 *User:* ${userName}\n` +
        `📁 *Category:* ${categoryTitle}\n` +
        `🔢 *Input Trace:* ${inputTrace}\n\n` +
        `📊 *CARBON LEDGER METRICS*:\n` +
        `• Total Carbon: *${conversions.carbon_kg} kg*\n` +
        `• Metric Tonnes: *${conversions.carbon_mt} MT*\n` +
        `• Pounds Weight: *${conversions.carbon_lb} lbs*\n\n` +
        `Remaining Run Balance: ${Math.max(0, capacity - (usage + 1))} REQS left.`;
}
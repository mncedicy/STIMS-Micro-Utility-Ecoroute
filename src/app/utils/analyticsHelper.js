// /src/app/utils/analyticsHelper.js

export const getChronologicalData = (logs) => {
    const dateMap = {};
    logs.forEach(log => {
        const dayKey = log.emission_date || new Date(log.created_at).toISOString().split('T')[0];
        dateMap[dayKey] = (dateMap[dayKey] || 0) + parseFloat(log.carbon_kg || 0);
    });
    return Object.keys(dateMap)
        .sort((a, b) => new Date(a) - new Date(b))
        .slice(-7)
        .map(date => ({
            label: new Date(date).toLocaleDateString('en-ZA', { day: '2-digit', month: 'short' }),
            value: dateMap[date],
            rawLabel: date
        }));
};

export const getCategoryData = (logs) => {
    const typeMap = { VEHICLE: 0, FLIGHT: 0, SHIPPING: 0, ELECTRICITY: 0, GAS: 0 };
    logs.forEach(log => {
        const cat = (log.category_display || 'VEHICLE').toUpperCase();
        if (typeMap[cat] !== undefined) typeMap[cat] += parseFloat(log.carbon_kg || 0);
    });
    return Object.keys(typeMap).map(type => ({
        label: type,
        value: typeMap[type]
    })).filter(item => item.value > 0);
};

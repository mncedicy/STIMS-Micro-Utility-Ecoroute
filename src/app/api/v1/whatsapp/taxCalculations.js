// src/app/api/v1/whatsapp/taxCalculations.js

/**
 * Computes calendar date frames dynamically and gathers emissions log metrics from the database.
 */
export async function compileTaxLedgerReport(choice, userId, supabaseAdmin) {
    const choiceMapping = { "tax_opt_1": "1", "tax_opt_2": "2", "tax_opt_3": "3", "tax_opt_4": "4", "tax_opt_5": "5", "tax_opt_6": "6" };
    const resolvedChoice = choiceMapping[choice] || choice;

    if (!['1', '2', '3', '4', '5', '6'].includes(resolvedChoice)) {
        return { success: false };
    }

    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth();
    let startDate = new Date(today), endDate = new Date(today), label = '';

    if (resolvedChoice === '1') { startDate.setMonth(today.getMonth() - 1); label = '1 Month (SARS Audit Cycle)'; }
    else if (resolvedChoice === '2') { startDate.setMonth(today.getMonth() - 3); label = '3 Months (Quarterly Variance)'; }
    else if (resolvedChoice === '3') { startDate.setMonth(today.getMonth() - 6); label = '6 Months (Half-Year Compliance)'; }
    else if (resolvedChoice === '4') { startDate.setFullYear(today.getFullYear() - 1); label = '12 Months (Rolling Ledger)'; }
    else if (resolvedChoice === '5') {
        const startYear = currentMonth >= 2 ? currentYear : currentYear - 1;
        startDate = new Date(startYear, 2, 1, 0, 0, 0, 0);
        label = `Current Tax Year (${startYear}/${startYear + 1})`;
    } else if (resolvedChoice === '6') {
        const baseYear = currentMonth >= 2 ? currentYear : currentYear - 1;
        startDate = new Date(baseYear - 1, 2, 1, 0, 0, 0, 0);
        endDate = new Date(baseYear, 1, baseYear % 4 === 0 && (baseYear % 100 !== 0 || baseYear % 400 === 0) ? 29 : 28, 23, 59, 59, 999);
        label = `Previous Tax Year (${baseYear - 1}/${baseYear})`;
    }

    const startIso = startDate.toISOString().split('T')[0];
    const endIso = endDate.toISOString().split('T')[0];

    const { data: logs } = await supabaseAdmin
        .from('ecoroute_emissions_logs')
        .select('carbon_kg')
        .eq('user_id', userId)
        .eq('print_status', 'included')
        .gte('emission_date', startIso)
        .lte('emission_date', endIso);

    const totalEntries = logs?.length || 0;
    const totalKg = (logs || []).reduce((sum, row) => sum + parseFloat(row.carbon_kg || 0), 0);
    const totalMt = totalKg / 1000;
    const taxableVolumeMt = totalMt * 0.40;
    const accruedLiabilityZar = taxableVolumeMt * 190;

    return {
        success: true,
        label,
        startIso,
        endIso,
        totalEntries,
        totalKg,
        totalMt,
        taxableVolumeMt,
        accruedLiabilityZar
    };
}

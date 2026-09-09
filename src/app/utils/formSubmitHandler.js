// src/app/utils/formSubmitHandler.js

/**
 * Intercepts, validates, and builds out clean payloads for the central estimate onSubmit endpoint hooks
 */
export function processFormSubmission({
    e,
    activeTab,
    emissionDate,
    todayString,
    distance,
    unit,
    selectedCustomVehicle,
    weight,
    weightUnit,
    shippingMode,
    depAirport,
    destAirport,
    passengers,
    flightClass,
    countryCode,
    electricityKwh,
    powerSource, // Injected parameter state mapping context variable
    gasQuantity,
    gasType,
    gasUnit,
    routeCoordinates,
    taxStartDate,
    taxEndDate,
    osrmTotalDuration,
    osrmLegsData,
    osrmWaypointsData,
    triggerDialogAlert,
    onSubmit
}) {
    e.preventDefault();

    if (activeTab !== 'route' && activeTab !== 'tax' && emissionDate > todayString) {
        return triggerDialogAlert(`Selected entry date cannot be in the future. Max allowed date is ${todayString}.`);
    }

    const trackingPayload = ['route', 'tax'].includes(activeTab) ? {} : { emission_date: emissionDate };

    if (activeTab === 'vehicle') {
        if (!selectedCustomVehicle) return triggerDialogAlert('Please select a valid vehicle from your active fleet registration list.');
        onSubmit({
            ...trackingPayload, type: 'vehicle', distance: distance.toString(), unit, vehicle_id: selectedCustomVehicle,
            osrm_total_duration: osrmTotalDuration, osrm_legs_data: osrmLegsData, osrm_waypoints_data: osrmWaypointsData
        });
    }
    else if (activeTab === 'shipping') {
        onSubmit({
            ...trackingPayload, type: 'shipping', distance: distance.toString(), unit, cargo_weight: weight.toString(), mass_unit: weightUnit,
            shipping_mode: shippingMode,
            osrm_total_duration: osrmTotalDuration, osrm_legs_data: osrmLegsData, osrm_waypoints_data: osrmWaypointsData
        });
    }
    else if (activeTab === 'flight') {
        if (!depAirport || !destAirport) return triggerDialogAlert('Please select valid origin and destination terminals from the database dropdown.');
        if (depAirport === destAirport) return triggerDialogAlert('Flight origin and destination cannot match the same terminal location.');
        onSubmit({
            ...trackingPayload, type: 'flight', passengers: passengers.toString(),
            origin_iata: depAirport.trim(), dest_iata: destAirport.trim(),
            flight_class: flightClass
        });
    }
    else if (activeTab === 'electricity') {
        if (!countryCode && powerSource === 'utility_grid') return triggerDialogAlert('Please select a valid target grid region country.');
        onSubmit({
            ...trackingPayload,
            type: 'electricity',
            kwh: electricityKwh.toString(),
            country_code: countryCode.trim().toUpperCase(),
            power_source: powerSource // Bound flawlessly to outbound calculation pipeline payloads
        });
    }
    else if (activeTab === 'gas') {
        onSubmit({ ...trackingPayload, type: 'gas', quantity: gasQuantity.toString(), gas_type: gasType, gas_unit: gasUnit });
    }
    else if (activeTab === 'route') {
        if (!selectedCustomVehicle) return triggerDialogAlert('Please select a valid vehicle profile asset for route trace analytics.');
        if (routeCoordinates.length < 2) return triggerDialogAlert('Please click on the tracker canvas map frame to plot at least 2 coordinate points.');

        onSubmit({
            ...trackingPayload, type: 'route', vehicle_id: selectedCustomVehicle, coordinates_string: routeCoordinates,
            osrm_total_duration: osrmTotalDuration, osrm_legs_data: osrmLegsData, osrm_waypoints_data: osrmWaypointsData
        });
    }
    else if (activeTab === 'tax') {
        onSubmit({ ...trackingPayload, type: 'tax', start_date: taxStartDate, end_date: taxEndDate });
    }
}
